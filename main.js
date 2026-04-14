const axios = require('axios');

module.exports = async function (context) {
    context.log("Nexus Elite V15.1: Deep Analysis Booting...");

    try {
        // ၁။ ဒေတာဆွဲယူခြင်း (ပိုများများရအောင် URL မှာ Parameter ထည့်ကြည့်ခြင်း)
        // မှတ်ချက် - API က limit ပေးထားရင် ၁၀ ခုပဲ ရနိုင်ပါတယ်
        const response = await axios.get('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?pageSize=50');
        const list = response.data.data.list;
        
        const rawData = list.map(item => parseInt(item.number) >= 5 ? 1 : 0);
        context.log(`Fetched Data Count: ${rawData.length}`);

        // --- 🧠 Markov Logic (Higher Order) ---
        const getHigherMarkov = (data) => {
            let transitions = {};
            // အချက်အလက်နည်းရင် 1st Order ပဲသုံး၊ များရင် 2nd Order သုံးမယ် (Adaptive)
            let order = data.length > 20 ? 2 : 1; 
            
            for (let i = 0; i < data.length - order; i++) {
                let state = data.slice(i + 1, i + 1 + order).join('');
                let next = data[i];
                if (!transitions[state]) transitions[state] = { 0: 0, 1: 0 };
                transitions[state][next]++;
            }
            let currentState = data.slice(0, order).join('');
            let stats = transitions[currentState] || { 0: 1, 1: 1 };
            return (stats[1] + 1) / (stats[1] + stats[0] + 2); // Laplacian Smoothing
        };

        // --- 🧠 Fuzzy Matching (Adaptive Search) ---
        const getFuzzyPattern = (data) => {
            let pLength = data.length > 30 ? 3 : 2; // ဒေတာနည်းရင် ၂ လှည့်ပဲ တိုက်စစ်မယ်
            const currentPattern = data.slice(0, pLength).join('');
            let hits = { 0: 0, 1: 0 };
            for (let i = 0; i < data.length - (pLength + 1); i++) {
                let prevPattern = data.slice(i + 1, i + 1 + pLength).join('');
                if (prevPattern === currentPattern) hits[data[i]]++;
            }
            return (hits[1] + 1) / (hits[1] + hits[0] + 2);
        };

        const mScore = getHigherMarkov(rawData);
        const fScore = getFuzzyPattern(rawData);
        
        // Final Fusion
        const finalScore = (fScore * 0.6) + (mScore * 0.4);
        
        // Confidence Calculation (Adjusted for Small Samples)
        let baseConfidence = Math.abs(finalScore - 0.5) * 200;
        
        // ဒေတာနည်းနေရင်တောင် Confidence ကို တွက်ချက်မှု တိကျရင် ပြပေးမယ်
        let finalConfidence = baseConfidence;
        if (rawData.length < 15) finalConfidence *= 0.7; // ၁၅ ခုအောက်ဆို ၃၀% လျှော့ပြမယ် (Safety)

        const result = {
            status: "success",
            period: (BigInt(list[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(finalConfidence, 99.9).toFixed(2) + "%",
            debug: {
                sample_size: rawData.length,
                markov: mScore.toFixed(2),
                pattern: fScore.toFixed(2)
            }
        };

        context.log(`Result: ${result.prediction} | Conf: ${result.confidence} | Sample: ${rawData.length}`);
        return context.res.json(result);

    } catch (err) {
        context.error("Execution Error: " + err.message);
        return context.res.json({ status: "error", message: err.message }, 500);
    }
};
