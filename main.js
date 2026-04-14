const axios = require('axios');
const sdk = require('node-appwrite');

module.exports = async function (context) {
    context.log("Nexus Elite V15.0: Deep Analysis Started...");

    try {
        // ၁။ ဒေတာဆွဲယူခြင်း
        const response = await axios.get('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json');
        const list = response.data.data.list;
        
        // အလှည့် ၅၀ အထိ ဒေတာယူခြင်း
        const analysisData = list.slice(0, 50);
        context.log(`Fetched ${analysisData.length} records for analysis.`);

        if (analysisData.length < 10) {
            return context.res.json({ status: "error", message: "Insufficent data" }, 400);
        }

        // Binary Conversion (1: BIG, 0: SMALL)
        const rawData = analysisData.map(item => parseInt(item.number) >= 5 ? 1 : 0);

        // --- 🧠 Logic 1: Higher-Order Markov (2nd Order) ---
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

        // --- 🧠 Logic 2: Fuzzy Pattern Matcher (Deep Search) ---
        const getFuzzyPattern = (data) => {
            const currentPattern = data.slice(0, 3).join('');
            let hits = { 0: 0, 1: 0 };
            for (let i = 0; i < data.length - 4; i++) {
                let prevPattern = data.slice(i + 1, i + 4).join('');
                if (prevPattern === currentPattern) hits[data[i]]++;
            }
            return (hits[1] + 1) / (hits[1] + hits[0] + 2); // Laplace smoothing
        };

        // --- 🧠 Logic 3: Bayesian Streak Analysis ---
        const getBayesianTrend = (data) => {
            const isStreak = data.slice(0, 4).every(x => x === data[0]);
            let prior = isStreak ? 0.8 : 0.5; // Streak ဖြစ်နေရင် အရှိန်ကို ပိုမြှင့်တယ်
            const likelihood = data.slice(0, 20).filter(x => x === 1).length / 20;
            return (prior * likelihood) / (prior * likelihood + (1 - prior) * (1 - likelihood) || 1);
        };

        const mScore = getHigherMarkov(rawData);
        const fScore = getFuzzyPattern(rawData);
        const bScore = getBayesianTrend(rawData);

        // Adaptive Fusion Logic (Weighting: Pattern 50%, Markov 30%, Bayesian 20%)
        const finalScore = (fScore * 0.5) + (mScore * 0.3) + (bScore * 0.2);

        // Confidence Calculation
        let confidence = Math.abs(finalScore - 0.5) * 200;
        
        // Agreement Bonus (Model အားလုံး တူရင် Bonus ပေး)
        const consensus = (mScore > 0.5 && fScore > 0.5 && bScore > 0.5) ||
                          (mScore < 0.5 && fScore < 0.5 && bScore < 0.5);
        if (consensus) confidence += 15;

        // Sample Size Quality (ဒေတာများလေ ယုံကြည်မှုတိုးလေ)
        const qualityFactor = Math.min(rawData.length / 50, 1.0);
        confidence *= qualityFactor;

        const result = {
            status: "success",
            period: (BigInt(list[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(confidence, 99.9).toFixed(2) + "%",
            breakdown: {
                markov_2nd: (mScore * 100).toFixed(1) + "%",
                pattern_match: (fScore * 100).toFixed(1) + "%",
                bayesian_trend: (bScore * 100).toFixed(1) + "%"
            },
            data_points: rawData.length,
            recommendation: confidence > 85 ? "🔥 STRONG ENTRY" : "⚖️ WAIT / CAUTION"
        };

        context.log(`Prediction: ${result.prediction} | Confidence: ${result.confidence} | Sample: ${rawData.length}`);
        
        return context.res.json(result);

    } catch (err) {
        context.error("Execution Error: " + err.message);
        return context.res.json({ status: "error", message: err.message }, 500);
    }
};
