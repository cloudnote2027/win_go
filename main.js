const axios = require('axios');

module.exports = async function (context) {
    try {
        // ၁။ Data Fetching
        const response = await axios.get('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json');
        const list = response.data.data.list;
        
        if (!list || list.length === 0) {
            return context.res.json({ status: "error", message: "Source offline" }, 400);
        }

        // ၂။ Binary Data Conversion (1: BIG, 0: SMALL)
        const rawData = list.map(item => parseInt(item.number) >= 5 ? 1 : 0);
        const lastThree = rawData.slice(0, 3).reverse().join(''); // လတ်တလော Pattern

        // --- 🧠 1. Higher-Order Markov (2nd Order) ---
        // အရင် ၂ လှည့်ကိုကြည့်ပြီး နောက်တစ်လှည့်ကို ခန့်မှန်းခြင်း
        const getHigherMarkov = (data) => {
            let transitions = {};
            for (let i = 0; i < data.length - 2; i++) {
                let state = `${data[i+2]}${data[i+1]}`; // အရင် ၂ လှည့်
                let next = data[i];
                if (!transitions[state]) transitions[state] = { 0: 0, 1: 0 };
                transitions[state][next]++;
            }
            let currentState = `${rawData[1]}${rawData[0]}`;
            let stats = transitions[currentState] || { 0: 1, 1: 1 };
            return stats[1] / (stats[1] + stats[0]);
        };

        // --- 🧠 2. Fuzzy Pattern Matching (Long Sequence) ---
        const getFuzzyPattern = (data) => {
            const currentPattern = data.slice(0, 4).join('');
            let hits = { 0: 0, 1: 0 };
            for (let i = 0; i < data.length - 5; i++) {
                let prevPattern = data.slice(i + 1, i + 5).join('');
                if (prevPattern === currentPattern) {
                    hits[data[i]]++;
                }
            }
            return (hits[1] + 1) / (hits[1] + hits[0] + 2); // Laplace smoothing
        };

        // --- 🧠 3. Bayesian Trend Strength ---
        const getBayesianTrend = (data) => {
            const streak = data.slice(0, 5).every(x => x === data[0]);
            let prior = streak ? 0.7 : 0.5; // Streak ဖြစ်နေရင် အရှိန်ကို ဦးစားပေး
            const likelihood = data.slice(0, 15).filter(x => x === 1).length / 15;
            return (prior * likelihood) / (prior * likelihood + (1 - prior) * (1 - likelihood));
        };

        // ၃။ Adaptive Weight Fusion (🎯 Fusion Logic)
        const markovScore = getHigherMarkov(rawData);
        const fuzzyScore = getFuzzyPattern(rawData);
        const bayesianScore = getBayesianTrend(rawData);

        // အရေးကြီးဆုံး Pattern (Sequential) ကို ၅၀% အလေးချိန်ပေးသည်
        const finalScore = (fuzzyScore * 0.5) + (markovScore * 0.3) + (bayesianScore * 0.2);

        // ၄။ Agreement & Confidence Calculation
        let confidence = Math.abs(finalScore - 0.5) * 200;
        const consensus = (markovScore > 0.5 && fuzzyScore > 0.5 && bayesianScore > 0.5) ||
                          (markovScore < 0.5 && fuzzyScore < 0.5 && bayesianScore < 0.5);
        
        if (consensus) confidence += 12; // Model အားလုံး သဘောတူရင် Bonus ပေးမယ်

        // ၅။ Final Decision Result
        return context.res.json({
            status: "success",
            period: (BigInt(list[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(confidence, 99.9).toFixed(2) + "%",
            analysis: {
                markov_2nd: (markovScore * 100).toFixed(1) + "%",
                fuzzy_match: (fuzzyScore * 100).toFixed(1) + "%",
                trend_bias: (bayesianScore * 100).toFixed(1) + "%"
            },
            recommendation: confidence > 88 ? "🔥 STRONG ENTRY" : "⚖️ CAUTION"
        });

    } catch (err) {
        return context.res.json({ status: "error", message: err.message }, 500);
    }
};
