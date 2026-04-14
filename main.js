const axios = require('axios');

module.exports = async function (context) {
    try {
        // ၁။ Data Fetching with Timeout config
        const response = await axios.get('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json', {
            timeout: 15000 // 15s စောင့်မယ်
        });
        
        const list = response.data.data.list;
        
        if (!list || list.length === 0) {
            return context.res.json({ responseBody: JSON.stringify({ status: "error", message: "Empty Data" }) });
        }

        // ၂။ Binary Data Conversion (1: BIG, 0: SMALL)
        const rawData = list.map(item => parseInt(item.number) >= 5 ? 1 : 0);

        // --- 🧠 1. Higher-Order Markov (2nd Order) ---
        const getHigherMarkov = (data) => {
            let transitions = {};
            for (let i = 0; i < data.length - 2; i++) {
                let state = `${data[i+2]}${data[i+1]}`;
                let next = data[i];
                if (!transitions[state]) transitions[state] = { 0: 0, 1: 0 };
                transitions[state][next]++;
            }
            let currentState = `${data[1]}${data[0]}`;
            let stats = transitions[currentState] || { 0: 1, 1: 1 };
            return stats[1] / (stats[1] + stats[0]);
        };

        // --- 🧠 2. Fuzzy Pattern Matching ---
        const getFuzzyPattern = (data) => {
            const currentPattern = data.slice(0, 4).join('');
            let hits = { 0: 0, 1: 0 };
            for (let i = 0; i < data.length - 5; i++) {
                let prevPattern = data.slice(i + 1, i + 5).join('');
                if (prevPattern === currentPattern) hits[data[i]]++;
            }
            return (hits[1] + 1) / (hits[1] + hits[0] + 2);
        };

        // --- 🧠 3. Bayesian Trend Strength ---
        const getBayesianTrend = (data) => {
            const streak = data.slice(0, 5).every(x => x === data[0]);
            let prior = streak ? 0.7 : 0.5;
            const likelihood = data.slice(0, 15).filter(x => x === 1).length / 15;
            return (prior * likelihood) / (prior * likelihood + (1 - prior) * (1 - likelihood));
        };

        // ၃။ Weight Fusion Logic
        const mkv = getHigherMarkov(rawData);
        const fzy = getFuzzyPattern(rawData);
        const bay = getBayesianTrend(rawData);
        const finalScore = (fzy * 0.5) + (mkv * 0.3) + (bay * 0.2);

        // ၄။ Confidence & Bonus
        let confidence = Math.abs(finalScore - 0.5) * 200;
        const consensus = (mkv > 0.5 && fzy > 0.5 && bay > 0.5) || (mkv < 0.5 && fzy < 0.5 && bay < 0.5);
        if (consensus) confidence += 12;

        const finalResult = {
            status: "success",
            period: (BigInt(list[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(confidence, 99.9).toFixed(2) + "%",
            mkv: (mkv * 100).toFixed(1) + "%",
            fzy: (fzy * 100).toFixed(1) + "%",
            bay: (bay * 100).toFixed(1) + "%",
            rec: confidence > 88 ? "🔥 STRONG ENTRY" : "⚖️ CAUTION"
        };

        return context.res.json({
            responseBody: JSON.stringify(finalResult)
        });

    } catch (err) {
        return context.res.json({ responseBody: JSON.stringify({ status: "error", message: err.message }) });
    }
};
