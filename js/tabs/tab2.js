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
    
    let selectedAspectRatio = "1:1";

    if(!masterPrompt) return;

    // LOAD DATA
    masterPrompt.value = STATE.data.style.artPrompt || "";
    if(toggleQuality) toggleQuality.checked = STATE.data.style.isProQuality;
    if (STATE.data.style.ratio) selectRatioUI(STATE.data.style.ratio);

    if(STATE.data.style.refImage) {
        urlInput.value = STATE.data.style.refImage;
        showPreview(STATE.data.style.refImage);
    }

    // PREVIEW GAMBAR
    fileInput.onchange = function() {
        if (this.files && this.files[0]) {
            const objectUrl = URL.createObjectURL(this.files[0]);
            showPreview(objectUrl);
            urlInput.value = ""; 
        }
    };

    urlInput.oninput = function() {
        if (this.value.trim()) showPreview(this.value.trim());
    };

    function showPreview(src) {
        imgPreview.src = src;
        imgPreview.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');
    }

    // LOGIC UPLOAD & ANALISA (VISION MODE FIXED)
    if (btnUpload) {
        btnUpload.onclick = async () => {
            const hasFile = fileInput.files.length > 0;
            let imageUrl = urlInput.value.trim();

            if (!imageUrl && !hasFile) return alert("Masukin gambar dulu bro!");

            // UI Loading
            const originalBtnText = btnUpload.innerHTML;
            btnUpload.disabled = true;
            btnUpload.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Processing...`;
            statusTxt.className = "text-[10px] text-accent mt-3 text-center animate-pulse";
            
            try {
                // 1. UPLOAD KE IMGBB (Wajib)
                if (hasFile) {
                    statusTxt.innerText = "⏳ Uploading ke ImgBB...";
                    imageUrl = await uploadToImgBB(fileInput.files[0]);
                    urlInput.value = imageUrl; 
                } 

                // 2. ANALISA STYLE (STRUKTUR MULTI-MODAL)
                statusTxt.innerText = "👁️ AI sedang melihat gambar...";
                
                // Ini struktur yang lu minta (Array Object)
                // ... di dalam btnUpload.onclick ...

                // ANALISA STYLE (VERSI BERSIH DARI KONTEN)
                const visionPayload = [
                    { 
                        type: "text", 
                        text: `Analyze the ARTISTIC STYLE and RENDERING TECHNIQUE of this image.
                        
                        CRITICAL RULES:
                        1. IGNORE THE SUBJECT AND OBJECTS (Do NOT mention cat, apron, kitchen, clothes, character).
                        2. FOCUS ONLY ON: Visual Vibes, Lighting (e.g. cinematic, volumetric), Texture Quality (e.g. soft fur render), Render Engine (e.g. Octane, Unreal 5), and Color Palette.
                        3. Output must be a concise comma-separated list of style keywords.
                        ` 
                    },
                    { 
                        type: "image_url", 
                        image_url: { url: imageUrl } 
                    }
                ];
                
                // ... callAI ...
                
                // Panggil model 'openai' dengan payload Array
                const styleDesc = await callAI(CONFIG.AI_MODELS.vision, visionPayload);
                
                const cleanStyle = styleDesc.replace(/```/g, '').replace(/"/g, '').trim();
                
                masterPrompt.value = cleanStyle;
                STATE.data.style.refImage = imageUrl;
                
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

    // SELECT RATIO UI
    window.selectRatio = function(ratio) {
        selectedAspectRatio = ratio;
        selectRatioUI(ratio);
    };

    function selectRatioUI(ratio) {
        ['1:1', '16:9', '9:16'].forEach(r => {
            const id = r === '1:1' ? 'ratio-square' : r === '16:9' ? 'ratio-landscape' : 'ratio-portrait';
            const btn = document.getElementById(id);
            if(btn) btn.className = "ratio-btn bg-black/30 border border-white/10 text-gray-400 py-2 rounded-lg text-xs font-bold hover:bg-white/5 transition-all w-full";
        });
        const activeId = ratio === '1:1' ? 'ratio-square' : ratio === '16:9' ? 'ratio-landscape' : 'ratio-portrait';
        const activeBtn = document.getElementById(activeId);
        if(activeBtn) activeBtn.className = "ratio-btn active bg-accent/20 border border-accent text-white py-2 rounded-lg text-xs font-bold hover:bg-accent/30 transition-all w-full shadow-[0_0_10px_rgba(99,102,241,0.3)]";
    }

    // SAVE & NEXT
    window.saveStyleAndNext = function() {
        const prompt = masterPrompt.value.trim();
        const isPro = toggleQuality.checked;
        STATE.updateStyleConfig(prompt, isPro);
        STATE.data.style.ratio = selectedAspectRatio;
        STATE.save();
        switchTab(3);
    };
};
