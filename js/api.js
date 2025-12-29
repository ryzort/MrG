// HELPER: Cek Error & Tampilkan Alert
function handleError(error, context) {
    console.error(`[${context}] Error:`, error);
    // Alert cuma muncul kalau errornya parah banget
    if (!error.message.includes("JSON")) { 
        alert(`Gagal di ${context}!\nError: ${error.message || error}`);
    }
    throw error; 
}

/**
 * 1. TEXT & CHAT GENERATION (Jalur Gratis: text.pollinations.ai)
 * Kita pake endpoint 'text.pollinations.ai' yang support POST tanpa login.
 */
async function generateText(messages, modelType = 'story') {
    // Ambil settingan model (default: openai)
    const selectedModel = CONFIG.AI_MODELS[modelType] || "openai"; 
    
    // PENTING: Pake URL ini biar GRATIS & Tanpa Key
    const url = "https://text.pollinations.ai/"; 
    
    const bodyData = {
        messages: messages,
        model: selectedModel,
        seed: Math.floor(Math.random() * 10000), // Biar variatif
        jsonMode: modelType === 'json' // Aktifin mode JSON kalau perlu
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // GAK PERLU HEADER AUTHORIZATION BUAT URL INI
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            throw new Error(`Server AI Error (${response.status})`);
        }
        
        // Output dari server ini text murni (bukan JSON object openai standard)
        // Jadi kita ambil text()-nya langsung
        const textResult = await response.text();
        return textResult;

    } catch (err) {
        handleError(err, `Generate Text (${selectedModel})`);
    }
}

/**
 * 2. IMAGE GENERATION (URL Builder)
 * Sesuai Doc: GET https://image.pollinations.ai/...
 */
function generateImageURL(prompt, width = 1024, height = 1024) {
    const model = CONFIG.AI_MODELS.image || "flux";
    const seed = Math.floor(Math.random() * 1000000); 
    
    const safePrompt = encodeURIComponent(prompt);
    
    // Pake image.pollinations.ai biar konsisten
    return `https://image.pollinations.ai/prompt/${safePrompt}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true`;
}

/**
 * 3. VISION (Analisa Gambar)
 * Khusus Vision kita coba tembak model 'gpt-4o' atau 'gemini' via text endpoint
 */
async function analyzeImageStyle(imageUrl) {
    const messages = [
        {
            role: "user",
            content: [
                { type: "text", text: "Analyze the art style of this image. Describe it in 50 words for an image prompt." },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        }
    ];

    return await generateText(messages, 'vision');
}

/**
 * 4. UPLOAD IMGBB
 * Tetap butuh API Key ImgBB (Wajib)
 */
async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    if (!apiKey) {
        alert("Woy bro! Masukin API Key ImgBB dulu di tombol Gear ⚙️");
        throw new Error("API Key ImgBB Kosong");
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
        console.log("Sedang upload ke ImgBB...");
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || "Gagal Upload");
        }
    } catch (err) {
        handleError(err, "Upload ImgBB");
    }
        }
