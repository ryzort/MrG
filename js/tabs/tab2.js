// ==========================================
// LOGIC KHUSUS TAB 2 (STYLE & CONFIG)
// ==========================================

window.setupTab2 = function() {
    console.log("[Tab 2] Initializing...");
    
    // Ambil elemen DOM
    const btnUpload = document.getElementById('btn-upload-style');
    const statusTxt = document.getElementById('style-status');
    const masterPrompt = document.getElementById('master-prompt');
    const toggleQuality = document.getElementById('toggle-quality');
    const fileInput = document.getElementById('style-file');
    const urlInput = document.getElementById('style-url');

    // Safety check
    if(!masterPrompt) return;

    // --- 1. LOAD DATA LAMA ---
    // Balikin prompt style yang udah disave
    masterPrompt.value = STATE.data.style.artPrompt || "";
    // Balikin posisi toggle quality
    if(toggleQuality) toggleQuality.checked = STATE.data.style.isProQuality;

    // --- 2. LOGIC UPLOAD & ANALISA ---
    if (btnUpload) {
        btnUpload.onclick = async () => {
            let imageUrl = urlInput.value.trim();
            const hasFile = fileInput.files.length > 0;

            if (!imageUrl && !hasFile) {
                return alert("Pilih file gambar atau tempel link dulu bro!");
            }

            // UI Loading
            btnUpload.disabled = true;
            btnUpload.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Processing...`;
            statusTxt.className = "text-xs text-accent mt-2 text-center animate-pulse";
            statusTxt.innerText = "⏳ Memproses data...";
            
            try {
                // A. Kalau Upload File -> Kirim ke ImgBB
                if (hasFile) {
                    statusTxt.innerText = "⏳ Mengupload ke Server ImgBB...";
                    // Panggil fungsi upload dari api.js
                    imageUrl = await uploadToImgBB(fileInput.files[0]);
                    urlInput.value = imageUrl; // Tampilkan URL hasil upload biar user tau
                }

                // B. Analisa Style via AI
                statusTxt.innerText = "👁️ AI sedang menganalisa visual style...";
                
                // Prompt khusus buat nyuri style gambar
                const prompt = `Describe the art style, visual vibe, lighting, and rendering technique of this image in one concise sentence suitable for image generation prompts. Image URL: ${imageUrl}`;
                
                // Panggil AI (Logic Lu: OpenAI/Claude)
                // Karena callAI lu support prompt text biasa, kita pake model 'logic' (OpenAI)
                const styleDesc = await callAI(CONFIG.AI_MODELS.logic, prompt);

                // Bersihin hasil (remove quotes/markdown)
                const cleanStyle = styleDesc.replace(/```/g, '').replace(/"/g, '').trim();
                
                masterPrompt.value = cleanStyle;
                STATE.data.style.refImage = imageUrl;
                
                statusTxt.className = "text-xs text-green-400 mt-2 text-center font-bold";
                statusTxt.innerHTML = `<i class="ph ph-check-circle"></i> Style Berhasil Dikunci!`;

            } catch (err) {
                console.error(err);
                statusTxt.className = "text-xs text-red-400 mt-2 text-center";
                statusTxt.innerText = "❌ Error: " + err.message;
            } finally {
                btnUpload.disabled = false;
                btnUpload.innerHTML = "Upload & Analisa Style";
            }
        };
    }

    // --- 3. LOGIC TOMBOL NEXT (GLOBAL) ---
    // Fungsi ini dipanggil langsung dari onclick HTML
    window.saveStyleAndNext = function() {
        const prompt = masterPrompt.value.trim();
        if (!prompt) return alert("Style belum ada bro! Upload gambar atau tulis manual.");

        const isPro = toggleQuality.checked;
        
        // Simpan ke State Database
        STATE.updateStyleConfig(prompt, isPro);
        
        console.log("Style Saved:", { prompt, isPro });
        
        // Pindah ke Tab 3 (Character)
        // Pastikan switchTab function ada (dari main.js)
        if(typeof switchTab === 'function') {
            switchTab(3);
        } else {
            alert("Fungsi navigasi error. Refresh halaman.");
        }
    };
};
