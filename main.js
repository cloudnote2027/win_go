const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    // Endpoint URL ကို ဒီအတိုင်း အတိအကျ ပြင်ပေးပါ
    client
        .setEndpoint('https://cloud.appwrite.io/v1') // <--- ဒီနေရာမှာ /v1 ပါဖို့ လိုပါတယ်
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    try {
        // Win Go API လှမ်းခေါ်ခြင်း
        const response = await axios.get('https://api.wingogame.com/get-latest-results'); 
        const data = response.data;

        // Database ID: 69dbcab6001e18fba9ec ထဲသို့ သိမ်းခြင်း
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

        context.log('✅ Success: Sync Completed!');
        return context.res.json({ message: 'Success' });
    } catch (err) {
        // ဘာကြောင့် Error တက်လဲဆိုတာ သိရအောင် log ထုတ်ပေးထားပါတယ်
        context.error('❌ Error Details: ' + err.message);
        return context.res.json({ error: err.message }, 500);
    }
};
