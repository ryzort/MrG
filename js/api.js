// HELPER: Bersihin JSON dari Markdown
function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

/**
 * CORE API CALL (Logic Retry & Error Handling Lu)
 */
async function callAI(model, prompt, isJsonMode = false) {
    const apiKey = CONFIG.getPollinationsKey();
    if (!apiKey) {
        alert(CONFIG.ERRORS.missingKey);
        throw new Error("Missing API Key");
    }

    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    const maxRetries = 3;
    const baseDelay = 1000;
    let attempt = 0;

    while (true) {
        attempt++;
        try {
            console.log(`[API] Attempt ${attempt} (${model})`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({ 
                    model: model, 
                    messages: [{ role: 'user', content: prompt }] 
                })
            });

            if (!response.ok) {
                // Retry kalau Server Error / Rate Limit
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    console.warn(`Server error ${response.status}. Retrying...`);
                    const wait = baseDelay * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, wait));
                    continue; 
                }
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            if (isJsonMode) return cleanJSON(content);
            return content;

        } catch (err) {
            console.error(`Attempt ${attempt} failed:`, err);
            if (attempt >= maxRetries) throw err;
            await new Promise(r => setTimeout(r, baseDelay));
        }
    }
}

// WRAPPER FUNCTIONS (Biar dipanggil Tab dengan mudah)

// 1. Extract Karakter (Pake Regex Match Logic Lu)
async function extractCharactersAI(storyText) {
    const prompt = `List tokoh utama dari cerita ini. Output hanya sebuah JSON array of strings. Contoh: ["Jono", "Siti"]. Jangan ada penjelasan lain. Cerita:\n${storyText}`;
    const raw = await callAI(CONFIG.AI_MODELS.logic, prompt, true);
    
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn("JSON Parse gagal, coba regex match...", e);
        const m = raw.match(/\[([\s\S]*?)\]/);
        if (m) return JSON.parse(m[0]);
        return []; 
    }
}

// 2. Upload ImgBB
async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    if (!apiKey) throw new Error("API Key ImgBB Kosong");
    
    const formData = new FormData();
    formData.append("image", file);
    
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
    const data = await res.json();
    if(!data.success) throw new Error("Gagal Upload ke ImgBB");
    
    return data.data.url;
}
