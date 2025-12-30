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
/**
 * FETCH IMAGE (UPDATE: RETURN RAW URL JUGA)
 */
async function fetchImageBlobAI(prompt, width, height, refImages = []) {
    const apiKey = CONFIG.getPollinationsKey();
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    let ratioHint = "";
    if (width > height) ratioHint = " ((wide cinematic 16:9 landscape))";
    if (height > width) ratioHint = " ((tall vertical portrait 9:16))";

    const finalPrompt = prompt + ratioHint + ", highly detailed, 8k";
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1500)); 

    // URL Construction
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    // Append References (PENTING BUAT TAB 4)
    if (refImages && Array.isArray(refImages) && refImages.length > 0) {
        refImages.forEach(refUrl => {
            // Pastikan URL-nya public (http/https), bukan blob
            if (refUrl && refUrl.startsWith('http')) {
                url += `&image=${encodeURIComponent(refUrl)}`;
            }
        });
        console.log(`[API] Using ${refImages.length} Refs`);
    }

    url += `&t=${new Date().getTime()}`; // Timestamp

    console.log(`[API] Fetching...`);

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error(`Image API Error: ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // KEMBALIKAN 2 DATA: BLOB (Buat Tampil) & RAW URL (Buat Referensi nanti)
    return {
        blobUrl: blobUrl,
        rawUrl: url // <-- Ini link sakti buat dikirim balik ke AI
    };
}

// =================================================================
// WRAPPER FUNCTIONS (FUNGSI KHUSUS PER TAB)
// =================================================================

async function generateStoryAndChars(topic, useDialog) {
    const styleInstruction = useDialog 
        ? "WAJIB FORMAT NASKAH FULL DIALOG (Script). Contoh: Jono: 'Halo'." 
        : "WAJIB FORMAT NARASI NOVEL DILARANG MENGGUNAKAN DIALOG (SCRIPT) FOKUS KE NARASI DETAIL ADEGAN DAN VIBES";

    // KITA TAMBAHIN ATURAN KHUSUS BUAT "NON-HUMAN"
    const prompt = `
    TUGAS: Tulis cerita pendek berdasarkan konsep: "${topic}"
    ATURAN: ${styleInstruction}. Bahasa: Indonesia. Gaya: Sinematik.
    
    SETELAH CERITA SELESAI, TULIS: ###DATA_KARAKTER###
    
    DI BAWAH PEMISAH, BUAT JSON ARRAY TOKOH UTAMA: 
    Format: [{"name": "Nama", "visual": "Physical description in English."}]
    
    ATURAN DESKRIPSI VISUAL (PENTING):
    1. Jika karakter adalah HEWAN/HUMANOID (Kucing, Harimau, dll), WAJIB gunakan kata kunci: "Anthropomorphic [Animal Name], Disney Zootopia style".
    2. WAJIB jelaskan tekstur kulit/bulu. Contoh: "Body covered in orange fur", JANGAN biarkan "Human skin" kecuali manusia.
    3. Jelaskan pakaian dan ekspresi wajah.
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
        } catch (e) { console.error("JSON Error"); }
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
