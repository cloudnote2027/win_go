const axios = require('axios');

module.exports = async function (context) {
    try {
        // ၁။ Data Fetching (ကိုမျိုးရဲ့ API)
        const response = await axios.get('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json');
        const list = response.data.data.list;
        
        if (!list || list.length === 0) {
            return context.res.json({ responseBody: JSON.stringify({ status: "error", message: "Source offline" }) });
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

        // ၃။ Adaptive Weight Fusion
        const markovScore = getHigherMarkov(rawData);
        const fuzzyScore = getFuzzyPattern(rawData);
        const bayesianScore = getBayesianTrend(rawData);
        const finalScore = (fuzzyScore * 0.5) + (markovScore * 0.3) + (bayesianScore * 0.2);

        // ၄။ Confidence Calculation
        let confidence = Math.abs(finalScore - 0.5) * 200;
        const consensus = (markovScore > 0.5 && fuzzyScore > 0.5 && bayesianScore > 0.5) ||
                          (markovScore < 0.5 && fuzzyScore < 0.5 && bayesianScore < 0.5);
        if (consensus) confidence += 12;

        // ၅။ Final Response (HTML UI က ဖတ်နိုင်အောင် responseBody ထဲ ထည့်သည်)
        const finalResponse = {
            status: "success",
            period: (BigInt(list[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(confidence, 99.9).toFixed(2) + "%",
            analysis: {
                markov: (markovScore * 100).toFixed(1) + "%",
                fuzzy: (fuzzyScore * 100).toFixed(1) + "%",
                trend: (bayesianScore * 100).toFixed(1) + "%"
            },
            recommendation: confidence > 88 ? "🔥 STRONG ENTRY" : "⚖️ CAUTION"
        };

        return context.res.json({
            responseBody: JSON.stringify(finalResponse)
        });

    } catch (err) {
        return context.res.json({ responseBody: JSON.stringify({ status: "error", message: err.message }) });
    }
};
