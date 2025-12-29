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

    // Safety check: Kalau elemen gak ada, stop
    if(!masterPrompt) return;

    // --- 1. LOAD DATA LAMA (State Management) ---
    // Kalau user balik dari Tab 3, isiannya jangan ilang
    masterPrompt.value = STATE.data.style.artPrompt || "";
    if(toggleQuality) toggleQuality.checked = STATE.data.style.isProQuality;
    if(STATE.data.style.refImage) {
        urlInput.value = STATE.data.style.refImage;
        statusTxt.innerText = "✅ Gambar sebelumnya tersimpan.";
        statusTxt.className = "text-[10px] text-green-400 mt-3 text-center";
    }

    // --- 2. LOGIC TOMBOL UPLOAD & ANALISA ---
    if (btnUpload) {
        btnUpload.onclick = async () => {
            let imageUrl = urlInput.value.trim();
            const hasFile = fileInput.files.length > 0;

            if (!imageUrl && !hasFile) {
                return alert("Pilih file gambar dulu atau paste link-nya bro!");
            }

            // UI Loading (Biar user tau lagi mikir)
            const originalBtnText = btnUpload.innerHTML;
            btnUpload.disabled = true;
            btnUpload.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Processing...`;
            statusTxt.className = "text-[10px] text-accent mt-3 text-center animate-pulse";
            
            try {
                // A. Kalau Upload File -> Kirim ke ImgBB
                if (hasFile) {
                    statusTxt.innerText = "⏳ Sedang mengupload ke ImgBB...";
                    // Panggil fungsi upload dari api.js
                    imageUrl = await uploadToImgBB(fileInput.files[0]);
                    urlInput.value = imageUrl; // Tampilkan URL hasil upload
                }

                // B. Analisa Style via AI
                statusTxt.innerText = "👁️ AI sedang menganalisa visual style...";
                
                // Prompt khusus buat nyuri style gambar
                const prompt = `Describe the art style, lighting, color palette, and rendering technique of the image at this URL: "${imageUrl}". 
                Output ONE concise paragraph suitable for an image generation prompt. Focus only on visual style.`;
                
                // Panggil AI (Logic Lu: OpenAI)
                const styleDesc = await callAI(CONFIG.AI_MODELS.logic, prompt);

                // Bersihin hasil
                const cleanStyle = styleDesc.replace(/```/g, '').replace(/"/g, '').trim();
                
                masterPrompt.value = cleanStyle;
                STATE.data.style.refImage = imageUrl;
                
                // UI Sukses
                statusTxt.className = "text-[10px] text-green-400 mt-3 text-center font-bold";
                statusTxt.innerHTML = `<i class="ph ph-check-circle"></i> Style Berhasil Dikunci!`;

            } catch (err) {
                console.error(err);
                statusTxt.className = "text-[10px] text-red-400 mt-3 text-center";
                statusTxt.innerText = "❌ Error: " + err.message;
            } finally {
                // Balikin Tombol
                btnUpload.disabled = false;
                btnUpload.innerHTML = originalBtnText;
            }
        };
    }

    // --- 3. LOGIC TOMBOL NEXT (GLOBAL) ---
    // Fungsi ini dipanggil dari onclick HTML "Simpan & Lanjut"
    window.saveStyleAndNext = function() {
        const prompt = masterPrompt.value.trim();
        // Kalau kosong, ingetin user
        if (!prompt) {
            const proceed = confirm("Style Prompt masih kosong. AI bakal pake style default. Yakin lanjut?");
            if (!proceed) return;
        }

        const isPro = toggleQuality.checked;
        
        // Simpan ke State Database
        STATE.updateStyleConfig(prompt, isPro);
        
        console.log("Style Saved:", { prompt, isPro });
        
        // Pindah ke Tab 3 (Character)
        switchTab(3);
    };
};
