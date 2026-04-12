const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    client
        .setEndpoint('https://sgp.cloud.appwrite.io/v1') 
        .setProject('69dbc2e7002c8efa0c80') 
        .setKey('standard_2ce8b8e77513955e33e50d655f0eb1da84ac7cc2f1c1d14d571a5f70f1e850aea9c433448474ad9a16e6068c1be8e57acddd679f8588f79f06424dc0cfa6156f032a148736870b06da0afd791508f5f3de0e6a17777cf8f10bd70e2c50dee1d14804d7b119d11235179bd3fd7bfc490d356da4138ecdc1ad8d07f6edfb1e4d19');

    try {
        // ဖိုင်ထဲက အချက်အလက်တွေအတိုင်း Header နဲ့ Body ကို ပြင်ဆင်ထားပါတယ်
        const response = await axios.post('https://api.bigwinqaz.com/api/webapi/GetNoaverageEmerdList', {
            "pageSize": 10,
            "pageNo": 1,
            "typeId": 1,
            "language": 7,
            "random": "3f2a4f251561407cbc986d4989fe26be",
            "signature": "499E2885E36F69998213B558081C0E77",
            "timestamp": 1776022019
        }, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc2MDIxMjI0IiwibmJmIjoiMTc3NjAyMTIyNCIsImV4cCI6IjE3NzYwMjMwMjQiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI0LzEzLzIwMjYgMjoxMzo0NCBBTSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFjY2Vzc19Ub2tlbiIsIlVzZXJJZCI6IjUzNDgwMyIsIlVzZXJOYW1lIjoiOTU5Njk5NzE2MzM1IiwiVXNlclBob3RvIjoiNSIsIk5pY2tOYW1lIjoiTWVtYmVyTk5HQldBQ1AiLCJBbW91bnQiOiIxLjkwIiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiSDUiLCJMb2dpblRpbWUiOiI0LzEzLzIwMjYgMTo0Mzo0NCBBTSIsIkxvZ2luSVBBZGRyZXNzIjoiMTIwLjg4LjMzLjE5MyIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiIzMTciLCJUb2tlblR5cGUiOiJBY2Nlc3NfVG9rZW4iLCJQaG9uZVR5cGUiOiIxIiwiVXNlclR5cGUiOiIwIiwiVXNlck5hbWUyIjoiIiwiaXNzIjoiand0SXNzdWVyIiwiYXVkIjoibG90dGVyeVRpY2tldCJ9.mkGa3w5X1A0WXbqC64Zo3Cp7_5vHo4nu9L0zqt_-n3k',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 7.1.2; Pixel 4 Build/RQ3A.211001.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.117 Mobile Safari/537.36'
            }
        [span_1](start_span)});[span_1](end_span)

        const result = response.data;
        context.log('API Sync Success!');

        if (result && result.data && result.data.list) {
            const latest = result.data.list[0];

            await databases.createDocument(
                '69dbcab6001e18fba9ec', 
                'game_data_logs', 
                sdk.ID.unique(),
                {
                    "IssueNumber": String(latest.issueNumber),
                    "number": Number(latest.number),
                    "type": String(latest.colour),
                    "timestamp": Math.floor(Date.now() / 1000)
                }
            );

            return context.res.json({ message: 'Success' });
        }

    } catch (err) {
        context.error('❌ Sync Error: ' + err.message);
        return context.res.json({ error: err.message }, 500);
    }
};
