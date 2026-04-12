const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    // Endpoint ကို cloud.appwrite.io လို့ပဲ သုံးရပါမယ် ကိုမျိုး
    client
        .setEndpoint('https://cloud.appwrite.io/v1') 
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    try {
        // Win Go API လှမ်းခေါ်ခြင်း (API Link မှန်ဖို့တော့ လိုပါမယ်)
        const response = await axios.get('https://api.wingogame.com/get-latest-results'); 
        const data = response.data;

        // Database ID: 69dbcab6001e18fba9ec
        await databases.createDocument(
            '69dbcab6001e18fba9ec', 
            'game_data_logs', // <--- Collection ID မှန်အောင် စစ်ပေးပါ
            sdk.ID.unique(),
            {
                issueNumber: data.period,
                number: data.number,
                type: data.type,
                timestamp: Math.floor(Date.now() / 1000)
            }
        );

        context.log('✅ Success: Win Go data synced successfully!');
        return context.res.json({ message: 'Success' });

    } catch (err) {
        // Error ဖြစ်ရင် ဘာကြောင့်လဲဆိုတာ ဒီမှာ ပြပါလိမ့်မယ်
        context.error('❌ Error Details: ' + err.message);
        return context.res.json({ error: err.message }, 500);
    }
};
