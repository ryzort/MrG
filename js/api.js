// =================================================================
// API CORE (DIRECT REFERENCE + ENCODING FIX)
// =================================================================

function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

async function callAI(model, prompt, isJsonMode = false) {
    const apiKey = CONFIG.getPollinationsKey();
    if (!apiKey) { alert(CONFIG.ERRORS.missingKey); throw new Error("Missing API Key"); }

    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    const maxRetries = 3;
    const baseDelay = 1000;
    let attempt = 0;

    while (true) {
        attempt++;
        try {
            const bodyData = { model: model, messages: [{ role: 'user', content: prompt }] };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
                    continue;
                }
                throw new Error(`API Error ${response.status}`);
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
 * FETCH IMAGE (THE URI COMPONENT FIX)
 * Sesuai instruksi lu: Kita encode URL referensi biar server gak bingung.
 */
async function fetchImageBlobAI(prompt, width, height, refImages = []) {
    const apiKey = CONFIG.getPollinationsKey();
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    let ratioHint = "";
    if (width > height) ratioHint = " ((wide cinematic 16:9))";
    if (height > width) ratioHint = " ((tall vertical portrait 9:16))";

    const finalPrompt = prompt + ratioHint + ", highly detailed, 8k";
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1500)); 

    // Base URL
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    // --- LOGIC KONSISTENSI (IMAGE REFERENCE) ---
    if (refImages && Array.isArray(refImages) && refImages.length > 0) {
        refImages.forEach(refUrl => {
            if (refUrl && refUrl.length > 10) {
                // INI KUNCI DARI DISKUSI LU:
                // Kita bungkus URL Jono pake encodeURIComponent()
                // Biar tanda & dan ? di URL Jono gak ngerusak URL Scene
                const safeRef = encodeURIComponent(refUrl);
                
                url += `&image=${safeRef}`;
            }
        });
        console.log(`[API Image] Added ${refImages.length} Ref Images (Encoded).`);
    }

    // Timestamp unik untuk fetch request ini (biar browser gak cache)
    const fetchUrl = url + `&t=${new Date().getTime()}`;

    console.log(`[API Image] Fetching...`);

    const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error(`Image API Error: ${response.status}`);

    const blob = await response.blob();
    
    return {
        blobUrl: URL.createObjectURL(blob),
        rawUrl: url // URL Asli Pollinations (Tanpa timestamp) buat disimpen di State
    };
}

// ... Wrapper Functions ...
async function generateStoryAndChars(topic, useDialog) {
    const styleInstruction = useDialog ? "WAJIB FORMAT NASKAH DIALOG." : "WAJIB FORMAT NARASI NOVEL.";
    const prompt = `TULIS CERITA: "${topic}". ATURAN: ${styleInstruction}. Bahasa: Indonesia. SETELAH SELESAI, TULIS: ###DATA_KARAKTER### LALU JSON: [{"name": "Nama", "visual": "Physical description"}]`;
    
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
        } catch (e) { }
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
