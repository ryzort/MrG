// =================================================================
// API CORE (JANTUNG SISTEM - FINAL AUDITED)
// =================================================================

function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

/**
 * 1. TEXT GENERATION (RETRY LOGIC)
 */
async function callAI(model, prompt, isJsonMode = false) {
    const apiKey = CONFIG.getPollinationsKey();
    if (!apiKey) { alert(CONFIG.ERRORS.missingKey); throw new Error("Missing API Key"); }

    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    const maxRetries = 3;
    const baseDelay = 2000;
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
 * 2. IMAGE GENERATION (VIP FETCH + REF IMAGE)
 * Mengembalikan Object: { blobUrl, rawUrl }
 */
async function fetchImageBlobAI(prompt, width, height, refImages = []) {
    const apiKey = CONFIG.getPollinationsKey();
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    // A. Ratio Hint
    let ratioHint = "";
    if (width > height) ratioHint = " ((wide cinematic 16:9 landscape))";
    if (height > width) ratioHint = " ((tall vertical portrait 9:16))";

    // B. Encode Prompt
    const detailBooster = ", highly detailed, 8k, masterpiece";
    const finalPrompt = prompt + ratioHint + detailBooster;
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1500)); 

    // C. Base URL
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    // D. Append Ref Images (Tab 4 Logic)
    // Kita encode URL referensi biar server gak bingung
    if (refImages && Array.isArray(refImages) && refImages.length > 0) {
        refImages.forEach(refUrl => {
            if (refUrl && refUrl.startsWith('http')) {
                url += `&image=${encodeURIComponent(refUrl)}`;
            }
        });
        console.log(`[API Image] Using ${refImages.length} Refs`);
    }

    // E. Timestamp (Anti Cache)
    // Simpan URL ini sebagai RAW URL sebelum ditambah timestamp fetch
    const rawUrlForState = url; 
    
    // URL buat fetch (pake timestamp)
    const fetchUrl = url + `&t=${new Date().getTime()}`;

    console.log(`[API Image] Fetching...`);

    // F. Fetch Execution
    const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error(`Image API Error: ${response.status}`);

    const blob = await response.blob();
    
    // Return Dua Jenis URL
    return {
        blobUrl: URL.createObjectURL(blob), // Buat ditampilkan di <img>
        rawUrl: rawUrlForState              // Buat disimpen di STATE (sebagai referensi Tab 4)
    };
}

// ==========================================
// WRAPPER FUNCTIONS
// ==========================================

// 3. ONE-SHOT STORY
async function generateStoryAndChars(topic, useDialog) {
    const styleInstruction = useDialog 
        ? "WAJIB FORMAT NASKAH FULL DIALOG (Script)." 
        : "WAJIB FORMAT NARASI NOVEL.";

    const prompt = `
    TULIS CERITA: "${topic}"
    ATURAN: ${styleInstruction}. Bahasa: Indonesia.
    SETELAH CERITA SELESAI, TULIS: ###DATA_KARAKTER###
    LALU JSON ARRAY: [{"name": "Nama", "visual": "Physical description English"}]
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
        } catch (e) { }
    }
    return { story: storyText, characters: characters };
}

// 4. UPLOAD IMGBB (JANGAN DIHAPUS - INI BUAT TAB 2)
async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    if (!apiKey) throw new Error("API Key ImgBB belum disetting!");

    const formData = new FormData();
    formData.append("image", file);
    
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { 
        method: "POST", 
        body: formData 
    });
    
    const data = await res.json();
    if (!data.success) throw new Error("Upload Gagal");
    
    return data.data.url;
}
