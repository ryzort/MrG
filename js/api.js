// Fungsi Helper buat Error Handling
function handleError(error, context) {
    console.error(`Error di ${context}:`, error);
    alert(`Gawat Bro! ${context} Error: \n${error.message || error}`);
    // Nanti bisa kita upgrade jadi notif toast yang keren
}

// 1. TEXT GENERATION (Pollinations)
async function generateText(messages, modelType = 'story') {
    const model = CONFIG.AI_MODELS[modelType];
    const url = "https://gen.pollinations.ai/v1/chat/completions";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Pollinations sebenernya gratis, tapi klo ada key bisa ditaruh sini
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error(`Server AI ngambek: ${response.status}`);
        
        const data = await response.json();
        return data.choices[0].message.content;

    } catch (err) {
        handleError(err, "Generate Text AI");
        return null;
    }
}

// 2. IMAGE GENERATION (Pollinations)
// Return URL gambar langsung
function generateImageURL(prompt, width, height) {
    const model = CONFIG.AI_MODELS.image;
    const seed = Math.floor(Math.random() * 1000000); // Biar gambar beda terus
    // Encode prompt biar URL aman
    const safePrompt = encodeURIComponent(prompt);
    
    return `https://gen.pollinations.ai/image/${safePrompt}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true`;
}

// 3. VISION ANALYSIS (Image to Text)
async function analyzeImageStyle(imageUrl) {
    const messages = [
        {
            role: "user",
            content: [
                { type: "text", text: "Analyze the art style, color palette, and visual vibe of this image. Describe it in a prompt format for image generation. Keep it under 50 words." },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        }
    ];

    return await generateText(messages, 'vision');
}

// 4. UPLOAD KE IMGBB
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error.message);
        }
    } catch (err) {
        handleError(err, "Upload ImgBB");
        throw err;
    }
              }
