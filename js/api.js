// =================================================================
// API CORE (JANTUNG SISTEM - FINAL ULTIMATE TUNED VERSION)
// =================================================================

/**
 * HELPER: Membersihkan JSON dari format Markdown
 */
function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

/**
 * CORE FUNCTION 1: callAI (TEXT GENERATION)
 */
async function callAI(model, prompt, isJsonMode = false) {
    const apiKey = CONFIG.getPollinationsKey();
    
    if (!apiKey) {
        alert(CONFIG.ERRORS.missingKey);
        throw new Error("Missing API Key");
    }

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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    console.warn(`Server busy (${response.status}). Retrying...`);
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
            console.error(`Attempt ${attempt} failed:`, err);
            if (attempt >= maxRetries) throw err;
            await new Promise(r => setTimeout(r, baseDelay));
        }
    }
}

/**
 * CORE FUNCTION 2: fetchImageBlobAI (IMAGE GENERATION - VIP TUNED)
 * - Supports Custom Width/Height
 * - Supports Multi-Image Reference (Img2Img)
 * - Uses Header Authorization (VIP)
 * - Tuning Parameters: Guidance Scale & Strength
 */
async function fetchImageBlobAI(prompt, width, height, refImages = []) {
    const apiKey = CONFIG.getPollinationsKey();
    
    // Pastikan membaca state terbaru
    const isPro = STATE.data.style && STATE.data.style.isProQuality === true;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    // --- TUNING PARAMETERS ---
    const guidance = 15; // Patuh pada prompt teks
    const strength = 0.6; // Kreativitas ubah pose (jika ada ref image)

    // 1. RATIO HINT & BOOSTER
    let ratioHint = "";
    if (width > height) ratioHint = " ((wide cinematic 16:9 landscape))";
    if (height > width) ratioHint = " ((tall vertical portrait 9:16))";

    const detailBooster = ", highly detailed, sharp focus, 8k, masterpiece";
    const finalPrompt = prompt + ratioHint + detailBooster;
    
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1500)); 

    // 2. BASE URL CONSTRUCTION
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true&guidance_scale=${guidance}`;

    // 3. APPEND IMAGE REFERENCES (Img2Img Logic)
    if (refImages && Array.isArray(refImages) && refImages.length > 0) {
        // Tambahkan strength agar tidak kaku
        url += `&strength=${strength}`;
        
        refImages.forEach(refUrl => {
            if (refUrl && refUrl.startsWith('http')) {
                url += `&image=${encodeURIComponent(refUrl)}`;
            }
        });
        console.log(`[API Image] Using ${refImages.length} Refs (Model: ${model})`);
    }

    // Anti-Cache Timestamp
    url += `&t=${new Date().getTime()}`;

    console.log(`[API Image] Fetching ${width}x${height}...`);

    // 4. FETCH EXECUTION (VIP PATH)
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${apiKey}` 
            }
        });

        if (!response.ok) {
            throw new Error(`Image Gen Failed: ${response.status}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob); 

    } catch (err) {
        console.error("Fetch Image Error:", err);
        throw err;
    }
}

// =================================================================
// WRAPPER FUNCTIONS (FUNGSI KHUSUS PER TAB)
// =================================================================

async function generateStoryAndChars(topic, useDialog) {
    const styleInstruction = useDialog 
        ? "WAJIB FORMAT NASKAH FULL DIALOG (Script). Contoh: Jono: 'Halo'. Minimalkan narasi." 
        : "WAJIB FORMAT NARASI NOVEL. Fokus pada deskripsi suasana.";

    const prompt = `
    TUGAS: Tulis cerita pendek berdasarkan konsep: "${topic}"
    ATURAN: ${styleInstruction}. Bahasa: Indonesia. Gaya: Sinematik.
    
    SETELAH CERITA SELESAI, BUAT BARIS BARU DAN TULIS PEMISAH: ###DATA_KARAKTER###
    
    DI BAWAH PEMISAH, BUAT JSON ARRAY TOKOH UTAMA: 
    [{"name": "Nama Tokoh", "visual": "Physical description in English. MUST INCLUDE: 1. Body Type (Human/Humanoid/Cyborg), 2. Skin/Fur Color & Markings (e.g. orange fur, black stripes), 3. Face Details, 4. Clothing Materials."}]
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
        } catch (e) { 
            console.error("Gagal Parse JSON Karakter:", e);
        }
    }
    
    return { story: storyText, characters: characters };
}

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
    if (!data.success) throw new Error("Upload Gagal: " + (data.error?.message || "Unknown error"));
    
    return data.data.url;
    }
