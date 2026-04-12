const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    // ကိုမျိုး ပေးထားတဲ့ ID တွေကို တိုက်ရိုက် ထည့်ထားပါတယ်
    client
        .setEndpoint('https://cloud.appwrite.io/v1') 
        .setProject('69dbc2e7002c8efa0c80') 
        .setKey('standard_2ce8b8e77513955e33e50d655f0eb1da84ac7cc2f1c1d14d571a5f70f1e850aea9c433448474ad9a16e6068c1be8e57acddd679f8588f79f06424dc0cfa6156f032a148736870b06da0afd791508f5f3de0e6a17777cf8f10bd70e2c50dee1d14804d7b119d11235179bd3fd7bfc490d356da4138ecdc1ad8d07f6edfb1e4d19');

    try {
        // Win Go API လှမ်းခေါ်ခြင်း
        const response = await axios.get('https://api.wingogame.com/get-latest-results'); 
        const data = response.data;

        // Database ID: 69dbcab6001e18fba9ec
        await databases.createDocument(
            '69dbcab6001e18fba9ec', 
            'game_data_logs', 
            sdk.ID.unique(),
            {
                issueNumber: data.period,
                number: data.number,
                type: data.type,
                timestamp: Math.floor(Date.now() / 1000)
            }
        );

        context.log('✅ Success: Data saved to Appwrite!');
        return context.res.json({ message: 'Success' });

    } catch (err) {
        // Error တက်ရင် ဘာကြောင့်လဲဆိုတာ ဒီမှာ အတိအကျ ပြပါလိမ့်မယ်
        context.error('❌ Error Details: ' + err.message);
        return context.res.json({ error: err.message }, 500);
    }
};
