// ==========================================
// LOGIC KHUSUS TAB 2 (STYLE & CONFIG)
// ==========================================

window.setupTab2 = function() {
    console.log("[Tab 2] Initializing...");
    
    const btnUpload = document.getElementById('btn-upload-style');
    const statusTxt = document.getElementById('style-status');
    const masterPrompt = document.getElementById('master-prompt');
    const toggleQuality = document.getElementById('toggle-quality');
    const fileInput = document.getElementById('style-file');
    const urlInput = document.getElementById('style-url');
    const imgPreview = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    
    // Variable lokal buat rasio (Default 1:1)
    let selectedAspectRatio = "1:1";

    if(!masterPrompt) return;

    // --- 1. LOAD DATA LAMA ---
    masterPrompt.value = STATE.data.style.artPrompt || "";
    if(toggleQuality) toggleQuality.checked = STATE.data.style.isProQuality;
    
    // Load Rasio yang tersimpan (kalo ada)
    if (STATE.data.style.ratio) {
        selectRatioUI(STATE.data.style.ratio);
    }

    // Load Gambar Preview (kalo ada)
    if(STATE.data.style.refImage) {
        urlInput.value = STATE.data.style.refImage;
        showPreview(STATE.data.style.refImage);
    }

    // --- 2. FITUR PREVIEW GAMBAR ---
    // Pas user pilih file, langsung tampilin (belum upload)
    fileInput.onchange = function() {
        if (this.files && this.files[0]) {
            const objectUrl = URL.createObjectURL(this.files[0]);
            showPreview(objectUrl);
            // Kosongin input URL biar gak bingung
            urlInput.value = ""; 
        }
    };

    // Pas user ngetik/paste URL, tampilin preview
    urlInput.oninput = function() {
        if (this.value.trim()) {
            showPreview(this.value.trim());
        }
    };

    function showPreview(src) {
        imgPreview.src = src;
        imgPreview.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');
    }

    // --- 3. LOGIC UPLOAD & ANALISA ---
    if (btnUpload) {
        btnUpload.onclick = async () => {
            const hasFile = fileInput.files.length > 0;
            let imageUrl = urlInput.value.trim();

            if (!imageUrl && !hasFile) {
                return alert("Masukin gambar dulu bro!");
            }

            // UI Loading
            const originalBtnText = btnUpload.innerHTML;
            btnUpload.disabled = true;
            btnUpload.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Processing...`;
            statusTxt.className = "text-[10px] text-accent mt-3 text-center animate-pulse";
            
            try {
                // LOGIC LU: File -> ImgBB -> Link
                if (hasFile) {
                    statusTxt.innerText = "⏳ Uploading ke ImgBB...";
                    imageUrl = await uploadToImgBB(fileInput.files[0]);
                    urlInput.value = imageUrl; 
                    console.log("Uploaded to ImgBB:", imageUrl);
                } 
                // LOGIC LU: Link -> Direct (Gak perlu upload lagi)
                else {
                    console.log("Using direct link:", imageUrl);
                }

                // ANALISA STYLE
                statusTxt.innerText = "👁️ AI sedang menganalisa visual style...";
                
                const prompt = `Analyze this image style for a generative AI prompt. Focus on art style, lighting, and texture. Keep it concise (under 50 words). Image URL: "${imageUrl}"`;
                
                const styleDesc = await callAI(CONFIG.AI_MODELS.logic, prompt);
                const cleanStyle = styleDesc.replace(/```/g, '').replace(/"/g, '').trim();
                
                masterPrompt.value = cleanStyle;
                STATE.data.style.refImage = imageUrl; // Simpan link gambar
                
                statusTxt.className = "text-[10px] text-green-400 mt-3 text-center font-bold";
                statusTxt.innerHTML = `<i class="ph ph-check-circle"></i> Style Berhasil Dikunci!`;

            } catch (err) {
                console.error(err);
                statusTxt.className = "text-[10px] text-red-400 mt-3 text-center";
                statusTxt.innerText = "❌ Error: " + err.message;
            } finally {
                btnUpload.disabled = false;
                btnUpload.innerHTML = originalBtnText;
            }
        };
    }

    // --- 4. LOGIC ASPECT RATIO (Global Function) ---
    window.selectRatio = function(ratio) {
        selectedAspectRatio = ratio;
        selectRatioUI(ratio);
    };

    function selectRatioUI(ratio) {
        selectedAspectRatio = ratio;
        // Reset semua tombol jadi abu-abu
        ['1:1', '16:9', '9:16'].forEach(r => {
            const id = r === '1:1' ? 'ratio-square' : r === '16:9' ? 'ratio-landscape' : 'ratio-portrait';
            const btn = document.getElementById(id);
            if(btn) {
                btn.className = "ratio-btn bg-black/30 border border-white/10 text-gray-400 py-2 rounded-lg text-xs font-bold hover:bg-white/5 transition-all w-full";
            }
        });

        // Highlight tombol yang dipilih
        const activeId = ratio === '1:1' ? 'ratio-square' : ratio === '16:9' ? 'ratio-landscape' : 'ratio-portrait';
        const activeBtn = document.getElementById(activeId);
        if(activeBtn) {
            activeBtn.className = "ratio-btn active bg-accent/20 border border-accent text-white py-2 rounded-lg text-xs font-bold hover:bg-accent/30 transition-all w-full shadow-[0_0_10px_rgba(99,102,241,0.3)]";
        }
    }

    // --- 5. LOGIC SAVE & NEXT ---
    window.saveStyleAndNext = function() {
        const prompt = masterPrompt.value.trim();
        const isPro = toggleQuality.checked;
        
        // Simpan Config ke Database
        STATE.updateStyleConfig(prompt, isPro);
        
        // Simpan Ratio ke Database Manual (karena gak ada di helper updateStyleConfig yg lama)
        STATE.data.style.ratio = selectedAspectRatio;
        STATE.save();
        
        console.log("Saved:", { prompt, isPro, ratio: selectedAspectRatio });
        
        switchTab(3);
    };
};
