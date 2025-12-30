// ==========================================
// LOGIC KHUSUS TAB 4 (SCENES & STORYBOARD)
// ==========================================

window.setupTab4 = function() {
    console.log("[Tab 4] Initializing Scene Director...");

    const scenesContainer = document.getElementById('scenes-container');
    const btnGenScenes = document.getElementById('btn-generate-scenes');
    const inputCount = document.getElementById('scene-count');

    if (!btnGenScenes) return;

    // LOAD STATE
    if (STATE.data.scenes && STATE.data.scenes.length > 0) {
        renderScenes(STATE.data.scenes);
    }

    // --- 1. GENERATE LIST SCENE ---
    btnGenScenes.onclick = async () => {
        const story = STATE.data.story.generatedText || STATE.data.story.text;
        const count = inputCount.value || 6;

        if (!story) return alert("Cerita belum ada bro! Generate dulu di Tab 1.");

        // UI Loading
        const originalText = btnGenScenes.innerHTML;
        btnGenScenes.disabled = true;
        btnGenScenes.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Meracik Skenario...`;
        
        scenesContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-accent animate-pulse">
                <i class="ph ph-film-strip text-4xl mb-4"></i>
                <p class="text-sm font-bold">AI sedang menyusun ${count} adegan...</p>
            </div>`;

        try {
            // PROMPT YANG LEBIH GALAK & SPESIFIK (English Instruction)
            const prompt = `
            Role: Professional Movie Director.
            Task: Split this story into EXACTLY ${count} visual scenes (Storyboard).
            Story: "${story.substring(0, 3000)}..."
            
            IMPORTANT RULES:
            1. Output MUST be a valid JSON Array.
            2. NO introductory text, NO markdown, NO code blocks. Start directly with [.
            3. Keys: "id" (number), "text" (Narrative in Indonesian), "visual" (Image prompt in English).
            
            Format Example:
            [{"id": 1, "text": "Jono berjalan di lorong.", "visual": "Cyberpunk corridor, dark lighting"}]
            `;

            console.log("[Tab 4] Requesting Scenes...");
            
            // Panggil AI
            const raw = await callAI(CONFIG.AI_MODELS.logic, prompt, true); // true = auto clean markdown
            console.log("[Tab 4] Raw Response:", raw);
            
            // --- LOGIC PARSING SUPER KUAT (SANITIZER) ---
            let scenes = [];
            try {
                // 1. Cari kurung siku pertama '[' dan terakhir ']'
                const firstBracket = raw.indexOf('[');
                const lastBracket = raw.lastIndexOf(']');
                
                if (firstBracket !== -1 && lastBracket !== -1) {
                    // Ambil isinya doang, buang teks sampah di depan/belakang
                    const cleanJson = raw.substring(firstBracket, lastBracket + 1);
                    scenes = JSON.parse(cleanJson);
                } else {
                    // Kalau gak nemu kurung, coba parse mentah
                    scenes = JSON.parse(raw);
                }

                // Validasi apakah hasilnya Array
                if (!Array.isArray(scenes)) throw new Error("Hasil bukan Array");

            } catch (e) {
                console.error("[Tab 4] Parsing Error:", e);
                // Fallback: Kalau gagal, coba bersihin karakter aneh
                try {
                    const superClean = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Hapus invisible chars
                    scenes = JSON.parse(superClean);
                } catch(e2) {
                    throw new Error("AI ngasih format ngaco. Coba klik Generate lagi bro.");
                }
            }

            // Simpan & Render
            STATE.data.scenes = scenes;
            STATE.save();
            renderScenes(scenes);

        } catch (e) {
            console.error(e);
            alert("Gagal: " + e.message);
            scenesContainer.innerHTML = `
                <div class="col-span-full text-center py-20 bg-red-900/20 border border-red-500/50 rounded-xl">
                    <p class="text-red-300 font-bold mb-2">AI Error / Format Salah</p>
                    <p class="text-xs text-gray-400">Coba klik Generate sekali lagi.</p>
                    <div class="mt-4 bg-black/50 p-2 rounded text-[10px] text-left overflow-auto h-24 max-w-lg mx-auto font-mono text-red-200">
                        ${e.message}
                    </div>
                </div>`;
        } finally {
            btnGenScenes.disabled = false;
            btnGenScenes.innerHTML = originalText;
        }
    };

    // --- 2. RENDER PANEL SCENE ---
    // --- 2. RENDER PANEL SCENE (STRUKTUR PROMPT BARU) ---
    function renderScenes(scenes) {
        scenesContainer.innerHTML = "";
        
        const stylePrompt = STATE.data.style.artPrompt || "Cinematic shot";
        const characters = STATE.data.story.characters || [];
        const activeRatio = STATE.data.style.ratio || "16:9"; 

        let ratioClass = "aspect-video";
        let ratioStyle = "aspect-ratio: 16/9;";
        if (activeRatio === "9:16") { ratioClass = "aspect-[9/16]"; ratioStyle = "aspect-ratio: 9/16;"; }
        if (activeRatio === "1:1") { ratioClass = "aspect-square"; ratioStyle = "aspect-ratio: 1/1;"; }

        scenes.forEach((scene, index) => {
            // --- LOGIC PROMPT BARU (ANTI-BLEEDING) ---
            
            // 1. MASTER STYLE (Vibe Utama)
            let finalPrompt = `${stylePrompt}. `;
            
            // 2. SCENE DESCRIPTION (Fokus ke Aksi & Background dulu)
            // Kita kasih label biar AI tau ini settingan tempat
            finalPrompt += `SCENE ACTION: ${scene.visual}. `;
            
            // 3. KARAKTER INJECTION (Dipisah tegas)
            let charPrompts = [];
            let detectedRefs = []; 

            if (Array.isArray(characters)) {
                characters.forEach(char => {
                    const charName = typeof char === 'string' ? char : char.name;
                    const charDesc = typeof char === 'string' ? '' : char.visual;
                    
                    const regex = new RegExp(`\\b${charName}\\b`, 'i');
                    
                    if (regex.test(scene.text) || regex.test(scene.visual)) {
                        // Masukin ke array dulu, jangan langsung tempel
                        // Gunakan format: Name (Description)
                        charPrompts.push(`${charName} is (${charDesc})`);
                        
                        if (char.generatedUrl) detectedRefs.push(char.generatedUrl);
                    }
                });
            }

            // Kalau ada karakter di scene ini, tempel dengan kata kunci "FEATURING"
            // Ini ngasih tau AI: "Oke, setting udah, sekarang fokus ke orangnya"
            if (charPrompts.length > 0) {
                finalPrompt += ` CHARACTERS: ${charPrompts.join(" AND ")}. `;
            }

            // 4. BOOSTERS & TECHNICAL
            finalPrompt += "Detailed faces, correct anatomy, masterpiece, 8k resolution.";

            const existingImg = scene.generatedUrl || "logo.png";
            const opacityClass = scene.generatedUrl ? "opacity-100" : "opacity-20";

            // HTML Panel (Sama kayak sebelumnya)
            const panel = document.createElement('div');
            panel.className = "glass-panel p-4 rounded-xl animate-fade-in group flex flex-col";
            panel.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <span class="bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-accent">SCENE ${scene.id}</span>
                    <div class="flex gap-2">
                        <button onclick="editScenePrompt(${index})" class="text-gray-400 hover:text-white text-xs bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                            <i class="ph ph-pencil-simple"></i> Edit
                        </button>
                    </div>
                </div>
                
                <p class="text-xs text-gray-300 mb-3 italic leading-relaxed">"${scene.text}"</p>

                <div class="w-full bg-black/50 rounded-lg overflow-hidden relative border border-white/5 mb-2 group-hover:shadow-lg transition-all" style="${ratioStyle}">
                    <img id="scene-img-${index}" src="${existingImg}" class="w-full h-full object-contain ${opacityClass} transition-all duration-500">
                    
                    <div id="loader-${index}" class="absolute inset-0 flex flex-col items-center justify-center hidden bg-black/80 z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-2"></i>
                        <span class="text-[10px] text-white tracking-widest">RENDERING...</span>
                    </div>

                    <button onclick="renderSceneImage(${index})" class="absolute bottom-3 right-3 bg-accent hover:bg-white hover:text-accent text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 text-xs flex items-center gap-2 z-30">
                        <i class="ph ph-paint-brush-broad"></i> RENDER
                    </button>
                </div>

                <!-- Simpan Prompt yang udah dirapikan -->
                <textarea id="scene-prompt-${index}" class="hidden">${finalPrompt}</textarea>
                <input type="hidden" id="scene-refs-${index}" value='${JSON.stringify(detectedRefs)}'>
            `;
            scenesContainer.appendChild(panel);
        });
    }

    // --- 3. RENDER IMAGE (VIP FETCH) ---
    window.renderSceneImage = async function(index) {
        const imgEl = document.getElementById(`scene-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const promptVal = document.getElementById(`scene-prompt-${index}`).value;
        const refsRaw = document.getElementById(`scene-refs-${index}`).value;
        const refImages = JSON.parse(refsRaw);

        const activeRatio = STATE.data.style.ratio || "16:9";
        let w = 1280, h = 720;
        if (activeRatio === "9:16") { w = 720; h = 1280; }
        if (activeRatio === "1:1") { w = 1024; h = 1024; }

        loader.classList.remove('hidden');
        loader.classList.add('flex');
        imgEl.style.opacity = "0.3";

        try {
            console.log(`Rendering Scene ${index}... Refs:`, refImages.length);
            
            // Panggil API (Terima Object)
            const result = await fetchImageBlobAI(promptVal, w, h, refImages);
            
            imgEl.src = result.blobUrl; // Tampilkan Blob
            
            imgEl.onload = () => {
                imgEl.classList.remove('opacity-20');
                imgEl.classList.add('opacity-100');
                loader.classList.add('hidden');
                loader.classList.remove('flex');
                
                // Simpan URL Asli juga buat Scene (siapa tau mau dipake lagi)
                if(STATE.data.scenes[index]) {
                    STATE.data.scenes[index].generatedUrl = result.rawUrl;
                    STATE.save(); 
                }
            };

        } catch (e) {
            console.error(e);
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            alert("Gagal Render: " + e.message);
        }
    };

    // --- 4. EDIT PROMPT ---
    window.editScenePrompt = function(index) {
        const currentPrompt = document.getElementById(`scene-prompt-${index}`).value;
        const modalHtml = `
            <div id="scene-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                <div class="bg-[#1e1e24] w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl animate-fade-in">
                    <h3 class="text-sm font-bold text-accent mb-4">Edit Scene Prompt</h3>
                    <textarea id="modal-scene-text" class="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-200 focus:border-accent focus:outline-none resize-none mb-4">${currentPrompt}</textarea>
                    <div class="flex justify-end gap-3">
                        <button onclick="document.getElementById('scene-modal').remove()" class="text-xs text-gray-500 hover:text-white">BATAL</button>
                        <button onclick="saveScenePrompt(${index})" class="btn-neon px-6 py-2 rounded-lg text-xs font-bold">SIMPAN</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window.saveScenePrompt = function(index) {
        const newVal = document.getElementById('modal-scene-text').value;
        document.getElementById(`scene-prompt-${index}`).value = newVal;
        document.getElementById('scene-modal').remove();
    };
};
