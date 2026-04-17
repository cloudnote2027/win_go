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

    // ========== Database Configuration ==========
    const DATABASE_ID = '69e216c900325e4cf49f';
    const COLLECTION_ID = 'wingo_history';

    // ========== WinGo API Configuration ==========
    const WINGO_API_URL = 'https://ckygjf6r.com/api/webapi/GetNoaverageEmerdList';
    const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIxNzc2NDI3NzE0IiwibmJmIjoiMTc3NjQyNzcxNCIsImV4cCI6IjE3NzY0Mjk1MTQiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI0LzE3LzIwMjYgNzowODozNCBQTSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFjY2Vzc19Ub2tlbiIsIlVzZXJJZCI6IjIxMTM1MSIsIlVzZXJOYW1lIjoiOTU5Njc1NDQ3NDIwIiwiVXNlclBob3RvIjoiMSIsIk5pY2tOYW1lIjoiTWVtYmVyTk5HRDJRSFQiLCJBbW91bnQiOiIzLjM5IiwiSW50ZWdyYWwiOiIwIiwiTG9naW5NYXJrIjoiSDUiLCJMb2dpblRpbWUiOiI0LzE3LzIwMjYgNjozODozNCBQTSIsIkxvZ2luSVBBZGRyZXNzIjoiNjkuMTYwLjI4LjI0OCIsIkRiTnVtYmVyIjoiMCIsIklzdmFsaWRhdG9yIjoiMCIsIktleUNvZGUiOiI2OSIsIlRva2VuVHlwZSI6IkFjY2Vzc19Ub2tlbiIsIlBob25lVHlwZSI6IjEiLCJVc2VyVHlwZSI6IjAiLCJVc2VyTmFtZTIiOiIiLCJpc3MiOiJqd3RJc3N1ZXIiLCJhdWQiOiJsb3R0ZXJ5VGlja2V0In0._QoREn7hL3Ys2KfyePsoxwmQcLQWvwiSjGDef9DxZWo';

    // ========== Generate Random ==========
    function generateRandom() {
        return crypto.randomBytes(16).toString('hex');
    }

    // ========== Try to generate signature (multiple methods) ==========
    function generateSignature(random, timestamp) {
        // Method 1: MD5 of random + timestamp
        const method1 = crypto.createHash('md5').update(random + timestamp).digest('hex').toUpperCase();
        
        // Method 2: MD5 of timestamp + random
        const method2 = crypto.createHash('md5').update(timestamp + random).digest('hex').toUpperCase();
        
        // Method 3: MD5 of random only
        const method3 = crypto.createHash('md5').update(random).digest('hex').toUpperCase();
        
        // Method 4: SHA256 of random + timestamp
        const method4 = crypto.createHash('sha256').update(random + timestamp).digest('hex').toUpperCase().substring(0, 32);
        
        // Try each method and log
        context.log(`Signature Method1 (MD5 random+ts): ${method1}`);
        context.log(`Signature Method2 (MD5 ts+random): ${method2}`);
        context.log(`Signature Method3 (MD5 random only): ${method3}`);
        context.log(`Signature Method4 (SHA256): ${method4}`);
        
        // Return method1 as default (you can change based on what works)
        return method1;
    }

    // ========== Try multiple request body combinations ==========
    async function tryRequest(requestBody, attemptName) {
        context.log(`📡 Trying ${attemptName}...`);
        
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
        
        return response.data;
    }

    // ========== Main Function ==========
    try {
        context.log('🔄 Fetching WinGo data...');

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const random = generateRandom();
        
        // Request Body combinations to try
        const requestBodies = [
            {
                name: "Dynamic signature (generated)",
                body: {
                    pageSize: 10,
                    pageNo: 1,
                    typeId: 1,
                    language: 0,
                    random: random,
                    signature: generateSignature(random, currentTimestamp),
                    timestamp: currentTimestamp
                }
            },
            {
                name: "Fixed from working request",
                body: {
                    pageSize: 10,
                    pageNo: 1,
                    typeId: 1,
                    language: 0,
                    random: "df769f067ba44ae9a3f4fbbfe76de560",
                    signature: "D04C39EBB3657B3B94641BEC56674C69",
                    timestamp: 1776427739
                }
            },
            {
                name: "No signature (test)",
                body: {
                    pageSize: 10,
                    pageNo: 1,
                    typeId: 1,
                    language: 0,
                    random: random,
                    timestamp: currentTimestamp
                }
            }
        ];

        let result = null;
        let success = false;

        // Try each request body
        for (const req of requestBodies) {
            try {
                result = await tryRequest(req.body, req.name);
                
                if (result && result.code === 0) {
                    context.log(`✅ Success with: ${req.name}`);
                    success = true;
                    break;
                } else {
                    context.log(`❌ Failed: ${req.name} - Code: ${result?.code}, Msg: ${result?.msg}`);
                }
            } catch (err) {
                context.log(`❌ Error with ${req.name}: ${err.message}`);
            }
        }

        // If all failed, return error
        if (!success || !result || result.code !== 0) {
            context.error('❌ All request methods failed');
            return context.res.json({
                success: false,
                error: 'All API requests failed',
                lastResult: result
            }, 500);
        }

        // ========== Process Successful Response ==========
        context.log('API Response Code:', result.code);
        context.log('API Message:', result.msg);

        if (result.data && result.data.list) {
            const records = result.data.list;
            context.log(`📊 Fetched ${records.length} records`);
            context.log(`Total pages: ${result.data.totalPage}, Total count: ${result.data.totalCount}`);

            let newCount = 0;
            let skipCount = 0;
            let errorCount = 0;

            for (const record of records) {
                try {
                    // Check if already exists
                    const existing = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_ID,
                        [`equal("issue_number", "${record.issueNumber}")`],
                        1
                    );

                    if (existing.total > 0) {
                        context.log(`⏭️ Skipping ${record.issueNumber} (already exists)`);
                        skipCount++;
                        continue;
                    }

                    // Handle color (sometimes "red,violet" format)
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
                    errorCount++;
                    context.error(`DB Error for ${record.issueNumber}: ${dbError.message}`);
                }
            }

            context.log(`🎉 Done! New: ${newCount}, Skipped: ${skipCount}, Errors: ${errorCount}`);
            
            return context.res.json({
                success: true,
                message: 'Collection completed',
                newRecords: newCount,
                skippedRecords: skipCount,
                errorRecords: errorCount,
                totalFetched: records.length,
                totalPages: result.data.totalPage,
                totalCount: result.data.totalCount
            });

        } else {
            context.error('❌ Invalid API response structure');
            return context.res.json({
                success: false,
                error: 'Invalid API response structure',
                details: result
            }, 500);
        }

    } catch (err) {
        context.error('❌ Fatal Error: ' + err.message);
        if (err.response) {
            context.error('Response status:', err.response.status);
            context.error('Response data:', JSON.stringify(err.response.data));
        }
        return context.res.json({
            success: false,
            error: err.message,
            stack: err.stack
        }, 500);
    }
};
