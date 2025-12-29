// ==========================================
// API CORE (JANTUNG SISTEM - PRO VERSION)
// ==========================================

function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

/**
 * CORE FUNCTION: callAI (Text/Vision)
 * Logic Retry Loop & Header Auth
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
 * PRO IMAGE GENERATION: fetchImageBlobAI
 * Teknik: encodeURIComponent + Fetch Header VIP + Blob + ObjectURL
 */
async function fetchImageBlobAI(prompt, width = 1024, height = 1024) {
    const apiKey = CONFIG.getPollinationsKey();
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    // 1. Teknik encodeURIComponent (Aman dari karakter aneh)
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

    console.log(`[API Image VIP] Generating: ${width}x${height}`);

    try {
        // 2. Teknik fetch dengan Header (Jalur VIP/Prioritas)
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) throw new Error(`Image API failed: ${response.status}`);

        // 3. Teknik URL.createObjectURL (Ubah Blob jadi Link Gambar Lokal)
        const blob = await response.blob();
        return URL.createObjectURL(blob); 

    } catch (err) {
        console.error("Fetch Image Error:", err);
        throw err;
    }
}

// ==========================================
// WRAPPER FUNCTIONS
// ==========================================

async function generateStoryAndChars(topic, useDialog) {
    const styleInstruction = useDialog 
        ? "WAJIB FORMAT NASKAH FULL DIALOG. Contoh: Jono: 'Halo'. AI dilarang banyak narasi." 
        : "WAJIB FORMAT NARASI NOVEL. AI dilarang banyak dialog langsung.";

    const prompt = `
    TULIS CERITA: "${topic}"
    ATURAN: ${styleInstruction}
    BAHASA: Indonesia.

    SETELAH CERITA, TULIS PEMISAH: ###DATA_KARAKTER###
    LALU BUAT JSON ARRAY: [{"name": "Nama", "visual": "Deskripsi fisik visual bahasa Inggris (hair, face, cloth)"}]
    `;
    
    const rawResult = await callAI(CONFIG.AI_MODELS.story, prompt);
    let storyText = rawResult;
    let characters = [];

    if (rawResult.includes("###DATA_KARAKTER###")) {
        const parts = rawResult.split("###DATA_KARAKTER###");
        storyText = parts[0].trim();
        try {
            const clean = cleanJSON(parts[1]);
            const m = clean.match(/\[([\s\S]*?)\]/);
            characters = JSON.parse(m ? m[0] : clean);
        } catch (e) { console.error("JSON Parse Error"); }
    }
    return { story: storyText, characters: characters };
}

async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
    const data = await res.json();
    return data.data.url;
                    }
