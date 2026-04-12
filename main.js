const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    // အရေးကြီးဆုံးအပိုင်း: Endpoint ကို ဒီအတိုင်းပဲ ထားပါ
    client
        .setEndpoint('https://cloud.appwrite.io/v1') 
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    try {
        // Win Go API လှမ်းခေါ်မယ်
        const response = await axios.get('https://api.wingogame.com/get-latest-results'); 
        const data = response.data;

        // Database ID: 69dbcab6001e18fba9ec ထဲကို သိမ်းမယ်
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

        context.log('✅ Success: Data saved!');
        return context.res.json({ message: 'Success' });

    } catch (err) {
        // ဒီနေရာမှာ Error အသေးစိတ်ကို Log ထုတ်ခိုင်းထားတယ် ကိုမျိုး
        context.error('❌ Error Details: ' + err.message);
        return context.res.json({ error: err.message }, 500);
    }
};
