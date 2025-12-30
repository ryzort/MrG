// ==========================================
// API CORE (VIP + IMAGE REFERENCE)
// ==========================================

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
 * FETCH IMAGE BLOB (UPGRADE: REFERENCE IMAGE)
 * refImages: Array string URL gambar karakter (opsional)
 */
async function fetchImageBlobAI(prompt, width, height, refImages = []) {
    const apiKey = CONFIG.getPollinationsKey();
    const isPro = STATE.data.style.isProQuality;
    const model = isPro ? "seedream-pro" : "seedream";
    const seed = STATE.data.sessionSeed;

    let ratioHint = "";
    if (height > width) ratioHint = " ((vertical portrait 9:16))"; 
    if (width > height) ratioHint = " ((wide cinematic 16:9))";

    const finalPrompt = prompt + ratioHint;
    const encodedPrompt = encodeURIComponent(finalPrompt.substring(0, 1500)); // Limit panjang

    // Base URL
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    // --- LOGIC REFERENCE IMAGE ---
    // Kalau ada gambar referensi, tempel ke URL
    if (refImages && refImages.length > 0) {
        // Ambil gambar pertama sebagai referensi utama (Limitasi API biasanya 1-2 gambar)
        // Kita encode URL referensinya juga
        const encodedRef = encodeURIComponent(refImages[0]);
        url += `&image=${encodedRef}`;
        console.log("Using Image Reference:", refImages[0]);
    }

    // Timestamp unik
    url += `&t=${new Date().getTime()}`;

    console.log(`[VIP API] Fetching... Refs: ${refImages.length}`);

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) throw new Error(`Image API Error: ${response.status}`);

    const blob = await response.blob();
    return URL.createObjectURL(blob); 
}

// ... (Sisanya: generateStoryAndChars, uploadToImgBB TETAP S
