// HELPER: Cek Error & Tampilkan Alert
function handleError(error, context) {
    console.error(`[${context}] Error:`, error);
    alert(`Gagal di ${context}!\nError: ${error.message || error}`);
    throw error; // Lempar error biar proses berhenti
}

/**
 * 1. TEXT & CHAT GENERATION
 * Sesuai Doc: POST https://gen.pollinations.ai/v1/chat/completions
 * Body Wajib: model, messages
 */
async function generateText(messages, modelType = 'story') {
    const apiKey = CONFIG.getPollinationsKey();
    
    // Pilih model dari config (misal: "openai" atau "qwen-coder")
    const selectedModel = CONFIG.AI_MODELS[modelType] || "openai"; 
    
    const url = "https://gen.pollinations.ai/v1/chat/completions";
    
    const headers = {
        "Content-Type": "application/json",
    };
    
    // Kalau ada key, pasang Bearer Token
    if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                model: selectedModel, // <-- INI YANG WAJIB DIKIRIM
                messages: messages,
                temperature: 0.7,     // Kreativitas standar
                max_tokens: 2000      // Biar ceritanya panjang
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Server AI Error (${response.status}): ${errData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content; // Ambil teks jawaban

    } catch (err) {
        handleError(err, `Generate Text (${selectedModel})`);
    }
}

/**
 * 2. IMAGE GENERATION (URL Builder)
 * Sesuai Doc: GET https://gen.pollinations.ai/image/{prompt}?model=flux&...
 */
function generateImageURL(prompt, width = 1024, height = 1024) {
    const model = CONFIG.AI_MODELS.image || "flux";
    const seed = Math.floor(Math.random() * 1000000000); // Random Seed
    
    // Bersihin prompt dari karakter aneh
    const safePrompt = encodeURIComponent(prompt);
    
    // Rangkai URL sesuai parameter dokumentasi
    // nologo=true (biar bersih)
    // enhance=true (biar AI benerin prompt kita dikit)
    return `https://gen.pollinations.ai/image/${safePrompt}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;
}

/**
 * 3. VISION (Analisa Gambar)
 * Sesuai Doc: Body messages array beda format (ada type: text & type: image_url)
 * Model Wajib: gemini / gptimage / claude-large (yang support vision)
 */
async function analyzeImageStyle(imageUrl) {
    const model = CONFIG.AI_MODELS.vision; // Pastikan ini "gemini" atau model vision lain
    
    const messages = [
        {
            role: "user",
            content: [
                { 
                    type: "text", 
                    text: "Analyze this image's art style, lighting, and colors. Describe it in a detailed prompt format for image generation. Focus on visual description only." 
                },
                { 
                    type: "image_url", 
                    image_url: { 
                        url: imageUrl 
                    } 
                }
            ]
        }
    ];

    // Panggil fungsi generateText tapi pake flag 'vision' biar ngambil model vision
    return await generateText(messages, 'vision');
}

/**
 * 4. UPLOAD IMGBB
 * Sesuai Doc: POST https://api.imgbb.com/1/upload
 */
async function uploadToImgBB(file) {
    const apiKey = CONFIG.getImgBBKey();
    if (!apiKey) {
        alert(CONFIG.ERRORS.missingKey);
        throw new Error("API Key ImgBB Kosong");
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
        // Tampilkan loading (opsional bisa di handle di UI)
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
