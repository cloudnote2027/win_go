const axios = require('axios');

module.exports = async function (context) {
    try {
        // ၁။ Data Fetching
        const response = await axios.get('https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json', { timeout: 10000 });
        const list = response.data.data.list;
        
        if (!list || list.length === 0) {
            return context.res.json({ responseBody: JSON.stringify({ status: "error", message: "No Data Found" }) });
        }

        // ၂။ Binary Conversion (BIG: 1, SMALL: 0)
        const rawData = list.map(item => parseInt(item.number) >= 5 ? 1 : 0);

        // --- 🧠 1. Higher-Order Markov ---
        const getMarkov = (data) => {
            let trans = {};
            for (let i = 0; i < data.length - 2; i++) {
                let state = `${data[i+2]}${data[i+1]}`;
                let next = data[i];
                if (!trans[state]) trans[state] = { 0: 0, 1: 0 };
                trans[state][next]++;
            }
            let cur = `${data[1]}${data[0]}`;
            let s = trans[cur] || { 0: 1, 1: 1 };
            return s[1] / (s[1] + s[0]);
        };

        // --- 🧠 2. Fuzzy Pattern Matching ---
        const getFuzzy = (data) => {
            const curP = data.slice(0, 4).join('');
            let h = { 0: 0, 1: 0 };
            for (let i = 0; i < data.length - 5; i++) {
                if (data.slice(i+1, i+5).join('') === curP) h[data[i]]++;
            }
            return (h[1] + 1) / (h[1] + h[0] + 2);
        };

        // --- 🧠 3. Bayesian Trend ---
        const getBayes = (data) => {
            const streak = data.slice(0, 5).every(x => x === data[0]);
            let prior = streak ? 0.7 : 0.5;
            const like = data.slice(0, 15).filter(x => x === 1).length / 15;
            return (prior * like) / (prior * like + (1 - prior) * (1 - like));
        };

        // ၃။ Weight Fusion & Confidence
        const mkv = getMarkov(rawData);
        const fzy = getFuzzy(rawData);
        const bay = getBayes(rawData);
        const finalScore = (fzy * 0.5) + (mkv * 0.3) + (bay * 0.2);

        let conf = Math.abs(finalScore - 0.5) * 200;
        if ((mkv > 0.5 && fzy > 0.5 && bay > 0.5) || (mkv < 0.5 && fzy < 0.5 && bay < 0.5)) conf += 12;

        const result = {
            status: "success",
            period: (BigInt(list[0].issueNumber) + 1n).toString(),
            prediction: finalScore >= 0.5 ? "BIG" : "SMALL",
            confidence: Math.min(conf, 99.9).toFixed(2) + "%",
            mkv: (mkv * 100).toFixed(1) + "%",
            fzy: (fzy * 100).toFixed(1) + "%",
            bay: (bay * 100).toFixed(1) + "%",
            rec: conf > 88 ? "🔥 STRONG" : "⚖️ CAUTION"
        };

        // UI အတွက် responseBody ထဲ ထည့်ပို့ခြင်း
        return context.res.json({
            responseBody: JSON.stringify(result)
        });

    } catch (err) {
        return context.res.json({ responseBody: JSON.stringify({ status: "error", message: err.message }) });
    }
};
