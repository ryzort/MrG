// ==========================================
// API CORE (JANTUNG SISTEM)
// ==========================================

function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

/**
 * CORE: TEXT GENERATION (Retry Logic)
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
            console.log(`[API Text] Attempt ${attempt} | Model: ${model}`);
            
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
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    const wait = baseDelay * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, wait));
                    continue;
                }
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            return isJsonMode ? cleanJSON(content) : content;

        } catch (err) {
            if (attempt >= maxRetries) throw err;
            await new Promise(r => setTimeout(r, baseDelay));
        }
    }
}

/**
 * CORE: IMAGE GENERATION (VIP Fetch Blob)
 * Menggunakan Header Authorization + ObjectURL biar gambar HD dan aman.
 */
async function fetchImageBlobAI(prompt, width, height) {
    const apiKey = CONFIG.getPollinationsKey();
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    // Tambahkan "Hint" orientasi otomatis biar AI gak ngasih kotak
    let ratioHint = "";
    if (width > height) ratioHint = ", wide landscape, 16:9";
    if (height > width) ratioHint = ", tall portrait, vertical, 9:16";

    // Encode prompt biar URL aman
    const finalPrompt = prompt + ratioHint;
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1000)); // Potong max 1000 char

    // URL Construction
    const url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    console.log(`[API Image] Fetching ${width}x${height}...`);

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error(`Image API Error: ${response.status}`);

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// --- WRAPPER FUNCTIONS ---

// 1. One-Shot Story + Karakter
async function generateStoryAndChars(topic, useDialog) {
    const styleInstruction = useDialog 
        ? "WAJIB FORMAT NASKAH FULL DIALOG. Contoh Jono: 'Halo'." 
        : "WAJIB FORMAT NARASI NOVEL.";

    const prompt = `
    TULIS CERITA: "${topic}"
    ATURAN: ${styleInstruction}. Bahasa: Indonesia.
    
    SETELAH CERITA SELESAI, TULIS: ###DATA_KARAKTER###
    LALU JSON ARRAY: [{"name": "Nama", "visual": "Physical description in English (hair, face, clothes)"}]
    `;
    
    const rawResult = await callAI(CONFIG.AI_MODELS.story, prompt);
    let storyText = rawResult;
    let characters = [];

    if (rawResult.includes("###DATA_KARAKTER###")) {
        const parts = rawResult.split("###DATA_KARAKTER###");
        storyText = parts[0].trim();
        try {
            const clean = cleanJSON(parts[1]);
            const m = clean.match(/\[([\s\S]*?)\]/); // Cari kurung siku []
            characters = JSON.parse(m ? m[0] : clean);
        } catch (e) { 
            console.error("JSON Parse Error:", e);
            characters = [];
        }
    }
    return { story: storyText, characters: characters };
}

// 2. Upload ImgBB
async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
    const data = await res.json();
    return data.data.url;
                }
