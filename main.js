const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    // ========== Appwrite Client Setup ==========
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    client
        .setEndpoint('https://sgp.cloud.appwrite.io/v1')
        .setProject('69e21622001b3d65b91e')
        .setKey('standard_c20730e8d14d6a6f1e3d35c24d0397a8ba9b74fad3502ebad9ea4d3a0a7726c6365b811344e88e29de690e785d41530fa1c9935efa304b7cd2c81d13bdc5eff9c612dcf5e4a384e50572e0f09e504949f534381b8128e4c985a9b3a343023a91b1fef6d4929f2828ec75814fa7164d373526f98da93be107dd867af8fb699389');

    const DATABASE_ID = '69e216c900325e4cf49f';
    const COLLECTION_ID = 'wingo_history';
    
    const WINGO_API_URL = 'https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList';
    const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc2NDI3NzE0IiwibmJmIjoiMTc3NjQyNzcxNCIsImV4cCI6IjE3NzY0Mjk1MTQiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI0LzE3LzIwMjYgNzowODozNCBQTSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFjY2Vzc19Ub2tlbiIsIlVzZXJJZCI6IjIxMTM1MSIsIlVzZXJOYW1lIjoiOTU5Njc1NDQ3NDIwIiwiVXNlclBob3RvIjoiMSIsIk5pY2tOYW1lIjoiTWVtYmVyTk5HRDJRSFQiLCJBbW91bnQiOiIzLjM5IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiSDUiLCJMb2dpblRpbWUiOiI0LzE3LzIwMjYgNjozODozNCBQTSIsIkxvZ2luSVBBZGRyZXNzIjoiNjkuMTYwLjI4LjI0OCIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI2OSIsIlRva2VuVHlwZSI6IkFjY2Vzc19Ub2tlbiIsIlBob25lVHlwZSI6IjEiLCJVc2VyVHlwZSI6IjAiLCJVc2VyTmFtZTIiOiIiLCJpc3MiOiJqd3RJc3N1ZXIiLCJhdWQiOiJsb3R0ZXJ5VGlja2V0In0._QoREn7hL3Ys2KfyePsoxwmQcLQWvwiSjGDef9DxZWo';

    let lastSavedIssue = null;

    async function getLastSavedIssue() {
        try {
            const result = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    sdk.Query.orderDesc('issue_number'),
                    sdk.Query.limit(1)
                ]
            );
            if (result.total > 0) {
                return result.documents[0].issue_number;
            }
            return null;
        } catch (err) {
            context.error(`Error getting last issue: ${err.message}`);
            return null;
        }
    }

    async function documentExists(issueNumber) {
        try {
            const result = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [sdk.Query.equal('issue_number', issueNumber)]
            );
            return result.total > 0;
        } catch (err) {
            return false;
        }
    }

    try {
        context.log('🔄 Fetching WinGo data...');

        // API က pageSize 10 ပဲ လက်ခံတယ်
        const requestBody = {
            pageSize: 10,
            pageNo: 1,
            typeId: 1,
            language: 0,
            random: "df769f067ba44ae9a3f4fbbfe76de560",
            signature: "D04C39EBB3657B3B94641BEC56674C69",
            timestamp: 1776427739
        };

        const response = await axios.post(WINGO_API_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 7.1.2; Pixel 4)',
                'Origin': 'https://localhost',
                'X-Requested-With': 'com.cklottery.app',
                'Referer': 'https://localhost/'
            },
            timeout: 15000
        });

        const result = response.data;
        context.log('API Response Code:', result.code);

        if (result.code === 0 && result.data && result.data.list) {
            const records = result.data.list;
            context.log(`📊 Fetched ${records.length} records`);
            
            // Get last saved issue number
            lastSavedIssue = await getLastSavedIssue();
            context.log(`Last saved issue: ${lastSavedIssue || 'None'}`);
            
            let newRecords = [];
            
            // Find new records (not in database)
            for (const record of records) {
                const exists = await documentExists(record.issueNumber);
                if (!exists) {
                    newRecords.push(record);
                }
            }
            
            context.log(`🆕 New records found: ${newRecords.length}`);
            
            if (newRecords.length === 0) {
                context.log('No new records to save');
                return context.res.json({
                    success: true,
                    message: 'No new records',
                    newRecords: 0
                });
            }
            
            // Save only the LATEST new record (first one in the list)
            // records list comes with latest first
            const latestNew = newRecords[0];
            
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                sdk.ID.unique(),
                {
                    issue_number: latestNew.issueNumber,
                    number: parseInt(latestNew.number),
                    color: latestNew.colour,
                    big_small: parseInt(latestNew.number) >= 5 ? 'Big' : 'Small',
                    premium: latestNew.premium || '',
                    collected_at: Math.floor(Date.now() / 1000)
                }
            );
            
            context.log(`✅ Saved: ${latestNew.issueNumber} → ${latestNew.number} (${latestNew.colour})`);
            
            return context.res.json({
                success: true,
                message: 'Saved latest record',
                issueNumber: latestNew.issueNumber,
                number: latestNew.number,
                color: latestNew.colour,
                totalNewFound: newRecords.length
            });
            
        } else {
            context.error('❌ API error:', result.msg);
            return context.res.json({ success: false, error: result.msg }, 500);
        }

    } catch (err) {
        context.error('❌ Error: ' + err.message);
        return context.res.json({ success: false, error: err.message }, 500);
    }
};
