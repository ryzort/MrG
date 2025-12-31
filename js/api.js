// =================================================================
// API CORE (JANTUNG SISTEM - FULL VERSION)
// =================================================================

/**
 * HELPER: Membersihkan JSON dari format Markdown (```json ... ```)
 */
function cleanJSON(text) {
    if (!text) return "";
    return text.replace(/```json|```/g, "").trim();
}

/**
 * CORE FUNCTION 1: callAI (TEXT GENERATION)
 * Menggunakan Retry Logic Loop (Anti Error 429/500).
 */
async function callAI(model, prompt, isJsonMode = false) {
    const apiKey = CONFIG.getPollinationsKey();
    
    // Validasi API Key
    if (!apiKey) {
        alert(CONFIG.ERRORS.missingKey);
        throw new Error("Missing API Key");
    }

    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    const maxRetries = 3;
    const baseDelay = 2000; // 2 detik
    let attempt = 0;

    // LOOP RETRY (LOGIC LU)
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

            // Handle Error HTTP
            if (!response.ok) {
                // Jika kena Rate Limit (429) atau Server Error (500), kita coba lagi
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    console.warn(`Server busy (${response.status}). Retrying...`);
                    const wait = baseDelay * Math.pow(2, attempt - 1); // Delay makin lama
                    await new Promise(r => setTimeout(r, wait));
                    continue; // Ulangi loop
                }
                
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            
            // Validasi Isi Data
            if (!data.choices || !data.choices.length) {
                throw new Error("AI Empty Response");
            }

            const content = data.choices[0].message.content;

            // Kembalikan hasil
            return isJsonMode ? cleanJSON(content) : content;

        } catch (err) {
            console.error(`Attempt ${attempt} failed:`, err);
            
            // Jika sudah mentok maxRetries, lempar error ke UI
            if (attempt >= maxRetries) throw err;
            
            // Tunggu sebelum coba lagi
            await new Promise(r => setTimeout(r, baseDelay));
        }
    }
}

/**
 * CORE FUNCTION 2: fetchImageBlobAI (IMAGE GENERATION - VIP TUNED)
 * - Custom Width/Height
 * - Image Reference (Img2Img) Support
 * - Header Authorization (VIP Path)
 * - Tuning: Guidance Scale & Strength
 * - Output: Blob ObjectURL (Anti Gagal Load)
 */
async function fetchImageBlobAI(prompt, width, height, refImages = []) {
    const apiKey = CONFIG.getPollinationsKey();
    
    // Pastikan membaca state terbaru buat Toggle Pro
    const isPro = STATE.data.style && STATE.data.style.isProQuality === true;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    // --- TUNING PARAMETERS (Sesuai Chat Lu) ---
    const guidance = 15; // Nurut sama Prompt Teks
    const strength = 0.6; // Fleksibel sama Pose Referensi

    // 1. RATIO HINT (Biar gak kotak)
    let ratioHint = "";
    if (width > height) ratioHint = " ((wide cinematic 16:9 landscape))";
    if (height > width) ratioHint = " ((tall vertical portrait 9:16))";

    // 2. ENCODE PROMPT (Wajib)
    const detailBooster = ", highly detailed, sharp focus, 8k, masterpiece";
    const finalPrompt = prompt + ratioHint + detailBooster;
    
    // Potong max 1500 biar URL gak kepanjangan (Penyebab Error 400)
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1500)); 

    // 3. BASE URL CONSTRUCTION (Parameter di Query)
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true&guidance_scale=${guidance}`;

    // 4. APPEND IMAGE REFERENCES (Looping)
    // Ini buat Tab 4 biar bisa kirim referensi gambar Jono & Siti
    if (refImages && Array.isArray(refImages) && refImages.length > 0) {
        url += `&strength=${strength}`; // Aktifin strength cuma kalo ada gambar
        
        refImages.forEach(refUrl => {
            if (refUrl && refUrl.startsWith('http')) {
                // Encode lagi URL gambarnya biar aman
                url += `&image=${encodeURIComponent(refUrl)}`;
            }
        });
        console.log(`[API Image] Using ${refImages.length} Refs (Model: ${model})`);
    }

    // Anti-Cache Timestamp
    url += `&t=${new Date().getTime()}`;

    console.log(`[API Image] Fetching ${width}x${height}...`);

    // 5. FETCH EXECUTION (VIP PATH)
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${apiKey}` // Tiket Masuk
            }
        });

        if (!response.ok) {
            throw new Error(`Image Gen Failed: ${response.status}`);
        }

        // 6. BLOB CONVERSION (Solusi Gambar Tajam)
        const blob = await response.blob();
        
        return {
            blobUrl: URL.createObjectURL(blob), // Buat ditampilkan di <img>
            rawUrl: url // URL Asli Pollinations (Tanpa timestamp) buat disimpen di STATE
        };

    } catch (err) {
        console.error("Fetch Image Error:", err);
        throw err;
    }
}

// =================================================================
// WRAPPER FUNCTIONS (LOGIC SPECIFIC)
// =================================================================

/**
 * ONE-SHOT STORY GENERATOR
 * Memastikan Toggle Dialog benar-benar mengubah instruksi.
 */
async function generateStoryAndChars(topic, useDialog) {
    // INSTRUKSI YANG LEBIH TEGAS (Sesuai komplain lu)
    const styleInstruction = useDialog 
        ? "WAJIB FORMAT NASKAH SKRIP (SCRIPT FORMAT). Tulis nama karakter diikuti titik dua dan dialognya (Contoh: Jono: 'Halo'). Jangan gunakan paragraf narasi panjang." 
        : "WAJIB FORMAT NARASI NOVEL (PARAGRAF). Fokus pada deskripsi, suasana, dan pikiran. DILARANG menggunakan format naskah (Nama: Dialog).";

    const prompt = `
    PERAN: Penulis Cerita Profesional.
    TUGAS: Tulis cerita pendek berdasarkan konsep: "${topic}"
    
    ATURAN FORMAT UTAMA: 
    ${styleInstruction}
    
    Bahasa: Indonesia. Gaya: Sinematik.
    
    SETELAH CERITA SELESAI, BUAT BARIS BARU DAN TULIS PEMISAH: ###DATA_KARAKTER###
    
    DI BAWAH PEMISAH, BUAT JSON ARRAY TOKOH UTAMA: 
    Format: [{"name": "Nama Tokoh", "visual": "Physical description in English. MUST INCLUDE: Body Type (Human/Anthropomorphic/Cyborg), Skin/Fur Color, Face Details, Clothing."}]
    `;
    
    // Panggil Claude (Story Model)
    const rawResult = await callAI(CONFIG.AI_MODELS.story, prompt);
    
    let storyText = rawResult;
    let characters = [];

    // Pisahkan Cerita dan JSON
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

/**
 * UPLOAD IMGBB
 * Wajib buat Tab 2.
 */
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
