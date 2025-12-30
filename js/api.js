// =================================================================
// API CORE (JANTUNG SISTEM - MR.G VERSION)
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
 * - Menggunakan Retry Logic (Mencoba 3x jika gagal).
 * - Menangani Error 429 (Rate Limit) dan 500 (Server Error).
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
    const baseDelay = 2000; // Tunggu 2 detik jika gagal
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

            // Handle Error HTTP
            if (!response.ok) {
                // Jika kena Rate Limit (429) atau Server Error (500), kita coba lagi (Retry)
                if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
                    console.warn(`Server busy (${response.status}). Retrying in ${baseDelay}ms...`);
                    const wait = baseDelay * Math.pow(2, attempt - 1); // Delay makin lama (Exponential Backoff)
                    await new Promise(r => setTimeout(r, wait));
                    continue; // Ulangi loop
                }
                
                // Jika error lain (misal 401 Unauthorized), langsung stop & lapor
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Kembalikan hasil (bersihkan jika mode JSON)
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
 * CORE FUNCTION 2: fetchImageBlobAI (IMAGE GENERATION - VIP)
 * - Mendukung Custom Width/Height.
 * - Mendukung Image Reference (Img2Img).
 * - Menggunakan Jalur Header Authorization (VIP).
 * - Output berupa ObjectURL (Blob) agar gambar tidak gagal load.
 */
async function fetchImageBlobAI(prompt, width, height, refImages = []) {
    const apiKey = CONFIG.getPollinationsKey();
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    // 1. RATIO HINT (Biar AI gak ngasih kotak melulu)
    let ratioHint = "";
    if (width > height) ratioHint = " ((wide cinematic 16:9 landscape))";
    if (height > width) ratioHint = " ((tall vertical portrait 9:16))";

    // 2. ENCODE PROMPT (Biar URL aman dari karakter aneh)
    const finalPrompt = prompt + ratioHint;
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1500)); // Potong max 1500 char

    // 3. BASE URL (Parameter Width & Height ditaruh di depan)
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    // 4. APPEND IMAGE REFERENCES (Looping array refImages)
    // Ini buat Tab 4 biar bisa kirim referensi gambar Jono & Siti
    if (refImages && Array.isArray(refImages) && refImages.length > 0) {
        refImages.forEach(refUrl => {
            if (refUrl && refUrl.startsWith('http')) { // Pastikan URL valid
                url += `&image=${encodeURIComponent(refUrl)}`;
            }
        });
        console.log(`[API Image] Using ${refImages.length} reference images.`);
    }

    // Tambah timestamp biar gak dicache browser
    url += `&t=${new Date().getTime()}`;

    console.log(`[API Image] Fetching ${width}x${height}...`);

    // 5. FETCH EXECUTION
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${apiKey}` // Kunci VIP
            }
        });

        if (!response.ok) {
            throw new Error(`Image Gen Failed: ${response.status}`);
        }

        // 6. CONVERT TO BLOB
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

/**
 * ONE-SHOT STORY GENERATOR
 * Meminta cerita DAN karakter sekaligus dalam satu request (Hemat waktu & token).
 */
async function generateStoryAndChars(topic, useDialog) {
    const styleInstruction = useDialog 
        ? "WAJIB FORMAT NASKAH FULL DIALOG (Script). Contoh: Jono: 'Halo'. Minimalkan narasi." 
        : "WAJIB FORMAT NARASI NOVEL. Fokus pada deskripsi suasana dilarang menggunakan dialog.";

    const prompt = `
    TUGAS: Tulis cerita pendek berdasarkan konsep: "${topic}"
    ATURAN: ${styleInstruction}. Bahasa: Indonesia. Gaya: Sinematik.
    
    TUGAS KEDUA (PENTING):
    Setelah cerita, buat baris baru, tulis: ###DATA_KARAKTER###
    Buat JSON ARRAY tokoh utama.
    
    FORMAT JSON: 
    [{"name": "Nama", "visual": "Physical description in English. MUST INCLUDE: 1. Body Type (Human/Humanoid/Cyborg), 2. Skin/Fur Color & Markings (e.g. orange fur, black stripes), 3. Face Details, 4. Clothing Materials."}]
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
            // Regex buat nyari Array [...] jaga-jaga ada teks sampah
            const m = clean.match(/\[([\s\S]*?)\]/);
            characters = JSON.parse(m ? m[0] : clean);
        } catch (e) { 
            console.error("Gagal Parse JSON Karakter:", e);
            // Karakter kosong gak bikin error fatal, cuma array kosong
        }
    }
    
    return { story: storyText, characters: characters };
}

/**
 * UPLOAD IMGBB
 * Wajib buat Tab 2 (Style Reference).
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
