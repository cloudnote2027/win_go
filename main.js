const axios = require('axios');
const sdk = require('node-appwrite');

module.exports = async function (context) {
    context.log("Nexus Elite Engine Started...");

    try {
        // ၁။ Data Fetching
        const response = await axios.get('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json');
        const list = response.data.data.list;
        
        context.log(`Fetched ${list.length} records successfully.`);

        // Binary Conversion
        const rawData = list.map(item => parseInt(item.number) >= 5 ? 1 : 0);

        // --- 🧠 Higher-Order Markov Logic ---
        const getHigherMarkov = (data) => {
            let transitions = {};
            for (let i = 0; i < data.length - 2; i++) {
                let state = `${data[i+2]}${data[i+1]}`;
                let next = data[i];
                if (!transitions[state]) transitions[state] = { 0: 0, 1: 0 };
                transitions[state][next]++;
            }
            let currentState = `${rawData[1]}${rawData[0]}`;
            let stats = transitions[currentState] || { 0: 1, 1: 1 };
            return stats[1] / (stats[1] + stats[0] || 1);
        };

        // --- 🧠 Fuzzy Pattern Matcher ---
        const getFuzzyPattern = (data) => {
            const currentPattern = data.slice(0, 4).join('');
            let hits = { 0: 0, 1: 0 };
            for (let i = 0; i < data.length - 5; i++) {
                let prevPattern = data.slice(i + 1, i + 5).join('');
                if (prevPattern === currentPattern) hits[data[i]]++;
            }
            return (hits[1] + 1) / (hits[1] + hits[0] + 2);
        };

        // --- 🧠 Bayesian Trend ---
        const getBayesianTrend = (data) => {
            const isStreak = data.slice(0, 5).every(x => x === data[0]);
            let prior = isStreak ? 0.75 : 0.5;
            const likelihood = data.slice(0, 15).filter(x => x === 1).length / 15;
            return (prior * likelihood) / (prior * likelihood + (1 - prior) * (1 - likelihood) || 1);
        };

        const mScore = getHigherMarkov(rawData);
        const fScore = getFuzzyPattern(rawData);
        const bScore = getBayesianTrend(rawData);

        // Final Fusion Logic
        const finalScore = (fScore * 0.5) + (mScore * 0.3) + (bScore * 0.2);
        let confidence = Math.abs(finalScore - 0.5) * 200;
        const consensus = (mScore > 0.5 && fScore > 0.5 && bScore > 0.5) ||
                          (mScore < 0.5 && fScore < 0.5 && bScore < 0.5);
        if (consensus) confidence += 12;

        const result = {
            status: "success",
            period: (BigInt(list[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(confidence, 99.9).toFixed(2) + "%",
            breakdown: {
                markov: (mScore * 100).toFixed(1) + "%",
                fuzzy: (fScore * 100).toFixed(1) + "%",
                bayesian: (bScore * 100).toFixed(1) + "%"
            },
            recommendation: confidence > 88 ? "STRONG ENTRY" : "NEUTRAL"
        };

        context.log(`Prediction: ${result.prediction} | Confidence: ${result.confidence}`);
        
        // အဖြေကို Body မှာ ပေါ်အောင် ပြန်ပေးခြင်း
        return context.res.json(result);

    } catch (err) {
        context.error("Error: " + err.message);
        return context.res.json({ status: "error", message: err.message }, 500);
    }
};
