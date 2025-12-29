// HELPER: Bersihin JSON (Logic Lu)
function cleanJSON(text) {
    return text.replace(/```json|```/g, "").trim();
}

/**
 * CORE API CALL (Diadaptasi dari function callAI punya lu)
 * Fitur: Retry otomatis, Error Handling, JSON parse safe
 */
async function callAI(model, prompt, isJsonMode = false) {
    const apiKey = CONFIG.getPollinationsKey();
    if (!apiKey) {
        alert(CONFIG.ERRORS.missingKey);
        throw new Error("Missing API Key");
    }

    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    const maxRetries = 3;
    const baseDelay = 1000; // 1 detik
    let attempt = 0;

    // LOOP RETRY (LOGIC LU)
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

            // Handle Rate Limit / Server Error
            if (!response.ok) {
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    console.warn(`Server error ${response.status}. Retrying...`);
                    // Delay logic
                    const wait = baseDelay * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, wait));
                    continue; // Ulang loop
                }
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Kalau butuh JSON, kita bersihin dulu pake helper cleanJSON
            if (isJsonMode) {
                return cleanJSON(content);
            }
            
            return content;

        } catch (err) {
            console.error(`Attempt ${attempt} failed:`, err);
            if (attempt >= maxRetries) {
                alert(`Gagal Total setelah ${maxRetries}x percobaan. Cek koneksi atau Key lu.`);
                throw err;
            }
            // Wait before retry
            await new Promise(r => setTimeout(r, baseDelay));
        }
    }
}

// WRAPPER FUNGSI (Biar compatible sama UI yang udah kita buat)

// 1. Generate Story (Pake 'claude')
async function generateStoryAI(topic, useDialog) {
    const mode = useDialog ? 'Full Dialog' : 'Narasi Visual';
    const prompt = `Tulis cerita pendek profesional tentang: "${topic}". Mode: ${mode}. Bahasa Indonesia.`;
    // Pake claude sesuai request lu
    return await callAI(CONFIG.AI_MODELS.story, prompt);
}

// 2. Extract Karakter (Pake 'openai' + JSON Mode)
async function extractCharactersAI(storyText) {
    const prompt = `List tokoh utama dari cerita ini. Output hanya sebuah JSON array of strings. Contoh: ["Jono", "Siti"]. Jangan ada penjelasan lain. Cerita:\n${storyText}`;
    const raw = await callAI(CONFIG.AI_MODELS.logic, prompt, true);
    
    // Parsing Logic (Sesuai kode lu yang pake Regex match)
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn("JSON Parse lurus gagal, coba regex match", e);
        const m = raw.match(/\[([\s\S]*?)\]/);
        if (m) return JSON.parse(m[0]);
        return []; // Fail safe
    }
}

// 3. Generate Image URL (Logic Toggle Quality Lu Masuk Sini)
function generateImageURL(prompt) {
    // Cek status toggle quality dari STATE
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? CONFIG.AI_MODELS.image_pro : CONFIG.AI_MODELS.image_std;
    
    const seed = STATE.data.sessionSeed; // Pake Seed Konsisten
    const safePrompt = encodeURIComponent(prompt);
    
    return `https://gen.pollinations.ai/image/${safePrompt}?model=${model}&width=1024&height=1024&seed=${seed}&nologo=true`;
}

// 4. Upload ImgBB (Tetap sama karena udah bener)
async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    if (!apiKey) throw new Error("API Key ImgBB Kosong");
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
    const data = await res.json();
    return data.data.url;
}
