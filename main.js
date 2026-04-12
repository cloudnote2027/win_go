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
        // API အသစ်ကို POST နဲ့ လှမ်းခေါ်ပါမယ်
        const response = await axios.post('https://api.bigwinqaz.com/api/webapi/GetEmerdList', {
            "pageSize": 10,
            "pageNo": 1,
            "typeId": 1 // Win Go 1 min အတွက်
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
            }
        });

        const result = response.data;
        
        // API က ဒေတာပေးမပေး Log မှာ အရင်ကြည့်မယ်
        context.log('API Response:', JSON.stringify(result));

        // ဒေတာပါလာရင် ပထမဆုံးတစ်ခုကို ယူမယ်
        if (result && result.data && result.data.list && result.data.list.length > 0) {
            const latest = result.data.list[0];

            await databases.createDocument(
                '69dbcab6001e18fba9ec', 
                'game_data_logs', 
                sdk.ID.unique(),
                {
                    "IssueNumber": String(latest.issueNumber),
                    "number": Number(latest.number),
                    "type": String(latest.colour || "none"),
                    "timestamp": Math.floor(Date.now() / 1000)
                }
            );

            context.log('✅ Success: New Data Sync Completed!');
            return context.res.json({ message: 'Success' });
        } else {
            context.error('❌ Error: No data found in API list');
            return context.res.json({ error: 'Empty list' }, 404);
        }

    } catch (err) {
        context.error('❌ Error Details: ' + err.message);
        return context.res.json({ error: err.message }, 500);
    }
};
