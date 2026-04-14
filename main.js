const axios = require('axios');

module.exports = async function (context) {
    context.log("Nexus Elite V15.2: Multi-Fetch Engine Booting...");

    try {
        // ၁။ Data Multi-Fetching (၃၀ ခုရအောင် ၃ ခါခေါ်ခြင်း)
        const fetchPoints = [1, 2, 3]; // Page 1, 2, 3
        const requests = fetchPoints.map(p => 
            axios.get(`https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?pageIndex=${p}&pageSize=10`)
        );

        const results = await Promise.all(requests);
        let combinedList = [];
        results.forEach(res => {
            if (res.data.data.list) combinedList = combinedList.concat(res.data.data.list);
        });

        // Binary Conversion (1: BIG, 0: SMALL)
        const rawData = combinedList.map(item => parseInt(item.number) >= 5 ? 1 : 0);
        context.log(`Total Combined Data: ${rawData.length}`);

        if (rawData.length < 20) {
            return context.res.json({ status: "warning", message: "Low data volume" });
        }

        // --- 🧠 1. Markov Chain (2nd Order) ---
        const getMarkov = (data) => {
            let transitions = {};
            for (let i = 0; i < data.length - 2; i++) {
                let state = `${data[i+2]}${data[i+1]}`;
                let next = data[i];
                if (!transitions[state]) transitions[state] = { 0: 0, 1: 0 };
                transitions[state][next]++;
            }
            let currentState = `${data[1]}${data[0]}`;
            let stats = transitions[currentState] || { 0: 1, 1: 1 };
            return (stats[1] + 1) / (stats[1] + stats[0] + 2);
        };

        // --- 🧠 2. Sequence Pattern Matching ---
        const getPattern = (data) => {
            const current = data.slice(0, 3).join('');
            let hits = { 0: 0, 1: 0 };
            for (let i = 0; i < data.length - 4; i++) {
                if (data.slice(i + 1, i + 4).join('') === current) hits[data[i]]++;
            }
            return (hits[1] + 1) / (hits[1] + hits[0] + 2);
        };

        const mScore = getMarkov(rawData);
        const pScore = getPattern(rawData);

        // Fusion Logic
        const finalScore = (pScore * 0.6) + (mScore * 0.4);
        let confidence = Math.abs(finalScore - 0.5) * 200;

        // Consensus Bonus
        if ((mScore > 0.5 && pScore > 0.5) || (mScore < 0.5 && pScore < 0.5)) {
            confidence += 10;
        }

        const responseBody = {
            status: "success",
            period: (BigInt(combinedList[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(confidence, 99.8).toFixed(2) + "%",
            sample_size: rawData.length,
            details: {
                markov: (mScore * 100).toFixed(1) + "%",
                pattern: (pScore * 100).toFixed(1) + "%"
            }
        };

        context.log(`Prediction: ${responseBody.prediction} | Sample: ${rawData.length} | Conf: ${responseBody.confidence}`);
        return context.res.json(responseBody);

    } catch (err) {
        context.error("Fetch Error: " + err.message);
        return context.res.json({ status: "error", message: err.message }, 500);
    }
};
