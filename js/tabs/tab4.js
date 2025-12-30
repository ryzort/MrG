// ==========================================
// LOGIC KHUSUS TAB 4 (SCENES & STORYBOARD)
// ==========================================

window.setupTab4 = function() {
    console.log("[Tab 4] System Ready.");

    const scenesContainer = document.getElementById('scenes-container');
    const btnGenScenes = document.getElementById('btn-generate-scenes');
    const inputCount = document.getElementById('scene-count');

    // Cek apakah elemen ada
    if (!btnGenScenes || !scenesContainer) {
        console.error("[Tab 4] Error: Elemen HTML tidak lengkap.");
        return;
    }

    // LOAD STATE LAMA (Kalau udah pernah generate, tampilin lagi)
    if (STATE.data.scenes && STATE.data.scenes.length > 0) {
        console.log("[Tab 4] Memuat data scene lama...");
        renderScenes(STATE.data.scenes);
    }

    // --- 1. LOGIC KLIK TOMBOL GENERATE ---
    btnGenScenes.onclick = async () => {
        console.log("[Tab 4] Tombol diklik.");
        
        // Ambil cerita dari Tab 1
        const story = STATE.data.story.generatedText || STATE.data.story.text;
        const count = inputCount.value || 6;

        if (!story) {
            alert("Cerita kosong! Balik ke Tab 1 dulu, generate cerita.");
            return;
        }

        // UI Loading
        const originalText = btnGenScenes.innerHTML;
        btnGenScenes.disabled = true;
        btnGenScenes.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Sedang Menulis Skenario...`;
        
        // Tampilkan loading di tengah container
        scenesContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-accent animate-pulse">
                <i class="ph ph-film-strip text-4xl mb-4"></i>
                <p class="text-sm font-bold">AI sedang memecah cerita menjadi ${count} adegan...</p>
                <p class="text-xs text-gray-500 mt-2">Mohon tunggu, ini butuh kecerdasan tinggi.</p>
            </div>`;

        try {
            // PROMPT SUTRADARA
            const prompt = `
            Bertindaklah sebagai Sutradara Film. Analisa cerita ini: 
            "${story.substring(0, 3000)}..."
            
            TUGAS: Pecah cerita menjadi TEPAT ${count} Scene Visual (Storyboard).
            OUTPUT: HANYA JSON Array murni. Format:
            [{"id": 1, "text": "Narasi singkat adegan (Bahasa Indonesia)", "visual": "Visual description for AI Image Prompt (English)"}]
            `;

            console.log("[Tab 4] Mengirim request ke AI...");
            
            // Panggil AI Logic
            const raw = await callAI(CONFIG.AI_MODELS.logic, prompt, true);
            console.log("[Tab 4] AI Menjawab:", raw);
            
            // Parse JSON (Pembersih)
            let scenes = [];
            try {
                const clean = raw.replace(/```json|```/g, "").trim();
                const m = clean.match(/\[([\s\S]*?)\]/); // Cari kurung siku array
                scenes = JSON.parse(m ? m[0] : clean);
            } catch (e) {
                console.error("[Tab 4] Gagal Parse JSON:", e);
                throw new Error("AI memberikan format yang salah. Coba lagi.");
            }

            // Simpan & Render
            STATE.data.scenes = scenes;
            STATE.save();
            renderScenes(scenes);

        } catch (e) {
            console.error(e);
            alert("Gagal: " + e.message);
            // Balikin tampilan kosong kalau gagal
            scenesContainer.innerHTML = `
                <div class="col-span-full text-center py-20 bg-red-900/20 border border-red-500/50 rounded-xl">
                    <i class="ph ph-warning text-4xl text-red-400 mb-2"></i>
                    <p class="text-red-300">${e.message}</p>
                </div>`;
        } finally {
            btnGenScenes.disabled = false;
            btnGenScenes.innerHTML = originalText;
        }
    };

    // --- 2. RENDER PANEL SCENE (INJEKSI HTML) ---
    function renderScenes(scenes) {
        scenesContainer.innerHTML = ""; // Hapus loading/placeholder
        
        const stylePrompt = STATE.data.style.artPrompt || "Cinematic shot";
        const characters = STATE.data.story.characters || [];
        const activeRatio = STATE.data.style.ratio || "16:9"; 

        // Tentukan CSS Rasio
        let ratioClass = "aspect-video"; // Default 16:9
        let ratioStyle = "aspect-ratio: 16/9;";
        
        if (activeRatio === "9:16") { ratioClass = "aspect-[9/16]"; ratioStyle = "aspect-ratio: 9/16;"; }
        if (activeRatio === "1:1") { ratioClass = "aspect-square"; ratioStyle = "aspect-ratio: 1/1;"; }

        scenes.forEach((scene, index) => {
            // LOGIC INJECTION PROMPT (GABUNGKAN KARAKTER KE SCENE)
            let injectedPrompt = `${stylePrompt}. Scene ${index+1}: ${scene.visual}. `;
            let detectedRefs = []; 

            // Cek apakah nama karakter disebut di scene ini?
            if (Array.isArray(characters)) {
                characters.forEach(char => {
                    // Handle format data char (string/object)
                    const charName = typeof char === 'string' ? char : char.name;
                    const charDesc = typeof char === 'string' ? '' : char.visual;
                    
                    const regex = new RegExp(`\\b${charName}\\b`, 'i'); // Cari kata "Jono" (case insensitive)
                    
                    if (regex.test(scene.text) || regex.test(scene.visual)) {
                        // KETEMU! Inject deskripsi fisiknya
                        injectedPrompt += ` (${charName}: ${charDesc}). `;
                        
                        // Ambil referensi gambar (kalau ada url)
                        if (typeof char === 'object' && char.generatedUrl) {
                            detectedRefs.push(char.generatedUrl);
                        }
                    }
                });
            }

            injectedPrompt += " Cinematic lighting, masterpiece, 8k.";
            
            // Cek gambar yg udah ada di state scene
            const existingImg = scene.generatedUrl || "logo.png";
            const opacityClass = scene.generatedUrl ? "opacity-100" : "opacity-20";

            // HTML Panel
            const panel = document.createElement('div');
            panel.className = "glass-panel p-4 rounded-xl animate-fade-in group flex flex-col";
            panel.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <span class="bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-accent">SCENE ${scene.id}</span>
                    <button onclick="editScenePrompt(${index})" class="text-gray-400 hover:text-white text-xs bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                        <i class="ph ph-pencil-simple"></i> Edit Prompt
                    </button>
                </div>
                
                <p class="text-xs text-gray-300 mb-3 italic leading-relaxed min-h-[3em]">"${scene.text}"</p>

                <!-- Frame Gambar -->
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

                <textarea id="scene-prompt-${index}" class="hidden">${injectedPrompt}</textarea>
                <!-- Hidden Ref Images (JSON String) -->
                <input type="hidden" id="scene-refs-${index}" value='${JSON.stringify(detectedRefs)}'>
            `;
            scenesContainer.appendChild(panel);
        });
    }

    // --- 3. GENERATE IMAGE (VIP FETCH) ---
    window.renderSceneImage = async function(index) {
        const imgEl = document.getElementById(`scene-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const promptVal = document.getElementById(`scene-prompt-${index}`).value;
        
        // Ambil Refs dari hidden input
        let refImages = [];
        try {
            refImages = JSON.parse(document.getElementById(`scene-refs-${index}`).value);
        } catch(e) { refImages = []; }

        // Ambil Rasio
        const activeRatio = STATE.data.style.ratio || "16:9";
        let w = 1280, h = 720; // Default wide
        if (activeRatio === "9:16") { w = 720; h = 1280; }
        if (activeRatio === "1:1") { w = 1024; h = 1024; }

        // UI Reset
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        imgEl.style.opacity = "0.3";

        try {
            console.log(`Rendering Scene ${index}... Refs:`, refImages.length);
            
            // Panggil API dengan Multi-Ref (fetchImageBlobAI support 4 param)
            const objectUrl = await fetchImageBlobAI(promptVal, w, h, refImages);
            
            imgEl.src = objectUrl;
            imgEl.onload = () => {
                imgEl.classList.remove('opacity-20');
                imgEl.classList.add('opacity-100');
                loader.classList.add('hidden');
                loader.classList.remove('flex');
                
                // Simpan URL
                if(STATE.data.scenes[index]) {
                    STATE.data.scenes[index].generatedUrl = objectUrl;
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

    // --- 4. EDIT POPUP ---
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
