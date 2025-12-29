// ==========================================
// API CORE (JANTUNG SISTEM)
// ==========================================

// Helper: Bersihin format Markdown dari response JSON AI
function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

/**
 * CORE FUNCTION: callAI
 * Menangani request ke Pollinations dengan Retry Logic & Error Handling.
 * Bisa menerima Prompt berupa String (Text) atau Array (Vision).
 */
async function callAI(model, prompt, isJsonMode = false) {
    const apiKey = CONFIG.getPollinationsKey();
    
    // Validasi Key
    if (!apiKey) {
        alert(CONFIG.ERRORS.missingKey);
        throw new Error("Missing API Key");
    }

    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    const maxRetries = 3;
    const baseDelay = 1000; // 1 detik
    let attempt = 0;

    // Loop Retry (Logic Lu)
    while (true) {
        attempt++;
        try {
            console.log(`[API] Attempt ${attempt} | Model: ${model}`);
            
            // Construct Body
            // content: prompt -> Bisa String, bisa Array Object (buat Vision)
            const bodyData = { 
                model: model, 
                messages: [{ role: 'user', content: prompt }] 
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(bodyData)
            });

            // Handle Error HTTP
            if (!response.ok) {
                // Retry jika Rate Limit (429) atau Server Error (5xx)
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    console.warn(`Server error ${response.status}. Retrying...`);
                    const wait = baseDelay * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, wait));
                    continue; // Ulang loop
                }
                // Jika error lain (misal 401 Unauthorized), langsung stop
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            
            // Validasi Data Response
            if (!data.choices || !data.choices.length) {
                throw new Error("AI tidak memberikan jawaban (Empty Response)");
            }

            const content = data.choices[0].message.content;

            // Return sesuai mode
            if (isJsonMode) return cleanJSON(content);
            return content;

        } catch (err) {
            console.error(`Attempt ${attempt} failed:`, err);
            
            // Jika sudah max retry, lempar error ke UI
            if (attempt >= maxRetries) {
                // alert(`Gagal koneksi ke AI setelah ${maxRetries}x percobaan.`);
                throw err;
            }
            // Tunggu sebelum retry
            await new Promise(r => setTimeout(r, baseDelay));
        }
    }
}

// ==========================================
// WRAPPER FUNCTIONS (Fungsi Khusus)
// ==========================================

// 1. GENERATE STORY (Claude)
async function generateStoryAI(topic, useDialog) {
    const mode = useDialog ? 'Naskah Full Dialog (Script Format)' : 'Cerita Narasi Novel';
    
    const prompt = `Tulis cerita sci-fi/fantasy profesional dan detail berdasarkan konsep ini: "${topic}".
    
    Setting Mode: ${mode}.
    Bahasa: Indonesia.
    Gaya Bahasa: Sinematik, detail, emosional.
    
    Output hanya isi ceritanya saja tanpa pembuka/penutup basa-basi dari AI.`;
    
    // Panggil model story (Claude)
    return await callAI(CONFIG.AI_MODELS.story, prompt);
}

// ... kode callAI sebelumnya tetap sama ...

// 2. EXTRACT CHARACTERS (UPGRADE: NAME + VISUAL)
async function extractCharactersAI(storyText) {
    // Prompt kita pertajam: Minta JSON Object dengan properti 'name' dan 'visual'
    const prompt = `Analisa cerita berikut. Identifikasi tokoh utama.
    Output HANYA JSON Array of Objects. 
    Format: [{"name": "Nama Tokoh", "visual": "Deskripsi fisik visual singkat padat untuk prompt gambar AI (baju, rambut, wajah), max 20 kata per tokoh, bahasa Inggris"}].
    
    Jangan ada penjelasan lain. Cerita:\n${storyText}`;
    
    // Panggil model logic
    const raw = await callAI(CONFIG.AI_MODELS.logic, prompt, true);
    
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn("JSON Parse gagal, mencoba Regex Match...", e);
        const m = raw.match(/\[([\s\S]*?)\]/);
        if (m) {
            try { return JSON.parse(m[0]); } catch (e2) { return []; }
        }
        return []; 
    }
}

// ... sisa file tetap sama ...

// 3. UPLOAD TO IMGBB
async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    if (!apiKey) throw new Error("API Key ImgBB Kosong. Cek Settings.");
    
    const formData = new FormData();
    formData.append("image", file);
    
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
    const data = await res.json();
    
    if(!data.success) throw new Error(data.error?.message || "Gagal Upload ke ImgBB");
    
    return data.data.url;
}

// 4. GENERATE IMAGE URL (URL Builder)
function generateImageURL(prompt) {
    // Cek status toggle quality dari STATE
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? CONFIG.AI_MODELS.image_pro : CONFIG.AI_MODELS.image_std;
    
    // Gunakan seed sesi biar konsisten
    const seed = STATE.data.sessionSeed;
    
    // Encode prompt biar URL aman
    const safePrompt = encodeURIComponent(prompt);
    
    // URL Pollinations Image (GET Request)
    return `https://gen.pollinations.ai/image/${safePrompt}?model=${model}&width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
                }
