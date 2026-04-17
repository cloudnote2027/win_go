const sdk = require('node-appwrite');
const axios = require('axios');
const crypto = require('crypto');

module.exports = async function (context) {
    // ========== Appwrite Client Setup ==========
    const client = new sdk.Client();
    const databases = new sdk.Databases(client);

    client
        .setEndpoint('https://sgp.cloud.appwrite.io/v1')
        .setProject('69e21622001b3d65b91e')
        .setKey('standard_c20730e8d14d6a6f1e3d35c24d0397a8ba9b74fad3502ebad9ea4d3a0a7726c6365b811344e88e29de690e785d41530fa1c9935efa304b7cd2c81d13bdc5eff9c612dcf5e4a384e50572e0f09e504949f534381b8128e4c985a9b3a343023a91b1fef6d4929f2828ec75814fa7164d373526f98da93be107dd867af8fb699389');

    // ========== WinGo API Configuration ==========
    const WINGO_API_URL = 'https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList';
    const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc2NDI3NzE0IiwibmJmIjoiMTc3NjQyNzcxNCIsImV4cCI6IjE3NzY0Mjk1MTQiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI0LzE3LzIwMjYgNzowODozNCBQTSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFjY2Vzc19Ub2tlbiIsIlVzZXJJZCI6IjIxMTM1MSIsIlVzZXJOYW1lIjoiOTU5Njc1NDQ3NDIwIiwiVXNlclBob3RvIjoiMSIsIk5pY2tOYW1lIjoiTWVtYmVyTk5HRDJRSFQiLCJBbW91bnQiOiIzLjM5IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiSDUiLCJMb2dpblRpbWUiOiI0LzE3LzIwMjYgNjozODozNCBQTSIsIkxvZ2luSVBBZGRyZXNzIjoiNjkuMTYwLjI4LjI0OCIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI2OSIsIlRva2VuVHlwZSI6IkFjY2Vzc19Ub2tlbiIsIlBob25lVHlwZSI6IjEiLCJVc2VyVHlwZSI6IjAiLCJVc2VyTmFtZTIiOiIiLCJpc3MiOiJqd3RJc3N1ZXIiLCJhdWQiOiJsb3R0ZXJ5VGlja2V0In0._QoREn7hL3Ys2KfyePsoxwmQcLQWvwiSjGDef9DxZWo';

    // Database Configuration
    const DATABASE_ID = '69e216c900325e4cf49f';
    const COLLECTION_ID = 'wingo_history';

    function generateRandom() {
        return crypto.randomBytes(16).toString('hex');
    }

    function generateSignature(random, timestamp) {
        // Using working signature from request_body.json
        return "D04C39EBB3657B3B94641BEC56674C69";
    }

    try {
        context.log('🔄 Fetching WinGo data...');

        const timestamp = Math.floor(Date.now() / 1000);
        const random = generateRandom();
        
        const requestBody = {
            pageSize: 10,
            pageNo: 1,
            typeId: 1,
            language: 0,
            random: random,
            signature: generateSignature(random, timestamp),
            timestamp: timestamp
        };

        context.log(`Request: pageNo=1, timestamp=${timestamp}`);

        const response = await axios.post(WINGO_API_URL, requestBody, {
            headers: {
                'Host': 'ckygjf6r.com',
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 7.1.2; Pixel 4 Build/RQ3A.211001.001; wv) AppleWebKit/537.36',
                'Origin': 'https://localhost',
                'X-Requested-With': 'com.cklottery.app',
                'Referer': 'https://localhost/',
                'Accept': 'application/json, text/plain, */*'
            },
            timeout: 15000
        });

        const result = response.data;
        context.log('API Response Code:', result.code);
        context.log('API Message:', result.msg);

        if (result && result.code === 0 && result.data && result.data.list) {
            const records = result.data.list;
            context.log(`📊 Fetched ${records.length} records`);
            context.log(`Total pages: ${result.data.totalPage}, Total count: ${result.data.totalCount}`);

            let newCount = 0;

            for (const record of records) {
                try {
                    // Check if already exists
                    const existing = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_ID,
                        [
                            `equal("issue_number", "${record.issueNumber}")`
                        ]
                    );

                    if (existing.total > 0) {
                        context.log(`⏭️ Skipping ${record.issueNumber} (already exists)`);
                        continue;
                    }

                    let color = record.colour;
                    let colorType = 'single';
                    if (color && color.includes(',')) {
                        colorType = 'multi';
                        context.log(`⚠️ Multi-color detected: ${color}`);
                    }

                    // Save new record
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTION_ID,
                        sdk.ID.unique(),
                        {
                            issue_number: record.issueNumber,
                            number: parseInt(record.number),
                            color: color,
                            color_type: colorType,
                            big_small: parseInt(record.number) >= 5 ? 'Big' : 'Small',
                            premium: record.premium || '',
                            collected_at: Math.floor(Date.now() / 1000)
                        }
                    );
                    
                    newCount++;
                    context.log(`✅ Saved: ${record.issueNumber} → ${record.number} (${color})`);
                    
                } catch (dbError) {
                    context.error(`DB Error for ${record.issueNumber}: ${dbError.message}`);
                }
            }

            context.log(`🎉 Done! New records: ${newCount}/${records.length}`);
            
            return context.res.json({
                success: true,
                message: 'Collection completed',
                newRecords: newCount,
                totalFetched: records.length,
                totalPages: result.data.totalPage,
                totalCount: result.data.totalCount
            });

        } else {
            context.error('❌ Invalid API response');
            return context.res.json({
                success: false,
                error: 'Invalid API response',
                details: result
            }, 500);
        }

    } catch (err) {
        context.error('❌ Error: ' + err.message);
        if (err.response) {
            context.error('Response status:', err.response.status);
        }
        return context.res.json({
            success: false,
            error: err.message
        }, 500);
    }
};
