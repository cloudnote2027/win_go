const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    client
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    try {
        // Win Go API (ဒါက ဥပမာ link ပါ၊ ကိုမျိုးသုံးနေကျ link ရှိရင် အောက်ကဟာနဲ့ လဲပေးပါ)
        const response = await axios.get('https://api.wingogame.com/get-latest-results');
        const data = response.data;

        // Database ထဲ သိမ်းခြင်း
        await databases.createDocument(
            '69dbcab6001e18fba9ec', // ကိုမျိုးပေးတဲ့ Database ID
            'game_data_logs',       // Collection ID
            sdk.ID.unique(),
            {
                issueNumber: data.period,
                number: data.number,
                type: data.type,
                timestamp: Math.floor(Date.now() / 1000)
            }
        );

        context.log('✅ Success: Data saved to Appwrite Database');
        return context.res.json({ message: 'Success' });

    } catch (err) {
        context.error('❌ Error: ' + err.message);
        return context.res.json({ error: err.message }, 500);
    }
};
