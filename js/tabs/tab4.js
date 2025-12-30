// ==========================================
// LOGIC KHUSUS TAB 4 (SCENES & STORYBOARD)
// ==========================================

window.setupTab4 = function() {
    console.log("[Tab 4] Initializing...");

    const scenesContainer = document.getElementById('scenes-container');
    const btnGenScenes = document.getElementById('btn-generate-scenes');
    const inputCount = document.getElementById('scene-count');

    // LOAD STATE LAMA
    if (STATE.data.scenes && STATE.data.scenes.length > 0) {
        renderScenes(STATE.data.scenes);
    }

    // --- 1. GENERATE LIST SCENE (AI) ---
    if (btnGenScenes) {
        btnGenScenes.onclick = async () => {
            const story = STATE.data.story.generatedText || STATE.data.story.text;
            const count = inputCount.value || 6;

            if (!story) return alert("Cerita belum ada bro! Balik ke Tab 1.");

            // UI Loading
            btnGenScenes.disabled = true;
            btnGenScenes.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Mikir...`;
            scenesContainer.innerHTML = `<div class="col-span-full text-center py-20 text-accent animate-pulse">Sedang memecah cerita jadi ${count} adegan...</div>`;

            try {
                const prompt = `
                Analisa cerita ini: "${story.substring(0, 3000)}..."
                
                Tugas: Pecah cerita menjadi TEPAT ${count} Scene Visual (Storyboard).
                Output: HANYA JSON Array. Format:
                [{"id": 1, "text": "Narasi singkat adegan", "visual": "Deskripsi visual untuk prompt gambar (tanpa dialog)"}]
                `;

                // Panggil AI Logic
                const raw = await callAI(CONFIG.AI_MODELS.logic, prompt, true);
                
                // Parse JSON
                let scenes = [];
                try {
                    const m = raw.match(/\[([\s\S]*?)\]/);
                    scenes = JSON.parse(m ? m[0] : raw);
                } catch (e) {
                    console.error("Gagal parse scene:", e);
                    return alert("AI gagal bikin format scene. Coba lagi.");
                }

                // Simpan & Render
                STATE.data.scenes = scenes;
                STATE.save();
                renderScenes(scenes);

            } catch (e) {
                console.error(e);
                alert("Error: " + e.message);
            } finally {
                btnGenScenes.disabled = false;
                btnGenScenes.innerHTML = `<i class="ph ph-film-strip"></i> Generate Storyboard`;
            }
        };
    }

    // --- 2. RENDER PANEL SCENE ---
    function renderScenes(scenes) {
        scenesContainer.innerHTML = "";
        
        // Ambil data Global
        const stylePrompt = STATE.data.style.artPrompt || "";
        const characters = STATE.data.story.characters || [];
        const activeRatio = STATE.data.style.ratio || "16:9"; // Default scene biasanya wide

        // Tentukan CSS Rasio
        let ratioClass = "aspect-video";
        if (activeRatio === "9:16") ratioClass = "aspect-[9/16]";
        if (activeRatio === "1:1") ratioClass = "aspect-square";

        scenes.forEach((scene, index) => {
            // LOGIC INJECTION & REFERENSI (Sesuai Request Lu)
            let injectedPrompt = `${stylePrompt}. Scene ${index+1}: ${scene.visual}. `;
            let detectedRefs = []; // Array URL gambar karakter

            // Cek setiap karakter, apakah namanya disebut di scene ini?
            characters.forEach(char => {
                const charName = typeof char === 'string' ? char : char.name;
                const charDesc = typeof char === 'string' ? '' : char.visual;
                
                // Regex buat cari nama (case insensitive)
                const regex = new RegExp(`\\b${charName}\\b`, 'i');
                
                // Cek di teks narasi atau visual prompt scene
                if (regex.test(scene.text) || regex.test(scene.visual)) {
                    // 1. INJECT DESKRIPSI FISIK
                    injectedPrompt += ` (${charName}: ${charDesc}). `;
                    
                    // 2. AMBIL GAMBAR REFERENSI (Kalau ada)
                    // Ambil link mentah dari State (generatedUrl di Tab 3 biasanya blob, 
                    // tapi untuk referensi ke Pollinations kita butuh URL publik atau base64. 
                    // TAPI Pollinations support image-to-image pake URL apa aja. 
                    // Untuk sekarang kita coba kirim Blob URL lokal (semoga browser support) 
                    // ATAU idealnya kita harus upload gambar Tab 3 ke ImgBB dulu.
                    // TAPI biar cepet, kita biarkan logic Injection Teks dulu yang dominan.
                    
                    if (char.generatedUrl) {
                        // Simpan referensi (Logic tambahan nanti kalau Blob gak tembus)
                        detectedRefs.push(char.generatedUrl);
                    }
                }
            });

            // Tambahkan environment
            injectedPrompt += " Cinematic lighting, detailed background, masterpiece.";

            // Render HTML Panel
            const panel = document.createElement('div');
            panel.className = "glass-panel p-4 rounded-xl animate-fade-in group";
            panel.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <span class="bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-accent">SCENE ${scene.id}</span>
                    <div class="flex gap-2">
                        <button onclick="editScenePrompt(${index})" class="text-gray-400 hover:text-white"><i class="ph ph-pencil-simple"></i></button>
                    </div>
                </div>
                
                <!-- Narasi -->
                <p class="text-xs text-gray-300 mb-3 italic">"${scene.text}"</p>

                <!-- Frame Gambar -->
                <div class="w-full ${ratioClass} bg-black/50 rounded-lg overflow-hidden relative border border-white/5">
                    <img id="scene-img-${index}" src="logo.png" class="w-full h-full object-contain opacity-20">
                    
                    <div id="loader-${index}" class="absolute inset-0 flex flex-col items-center justify-center hidden bg-black/80 z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl"></i>
                    </div>

                    <button onclick="renderSceneImage(${index})" class="absolute bottom-3 right-3 bg-accent hover:bg-white hover:text-accent text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 text-xs flex items-center gap-2">
                        <i class="ph ph-paint-brush-broad"></i> RENDER
                    </button>
                </div>

                <!-- Hidden Input Prompt Final -->
                <textarea id="scene-prompt-${index}" class="hidden">${injectedPrompt}</textarea>
                <!-- Hidden Ref Images -->
                <input type="hidden" id="scene-refs-${index}" value='${JSON.stringify(detectedRefs)}'>
            `;
            scenesContainer.appendChild(panel);
        });
    }

    // --- 3. GENERATE IMAGE SCENE ---
    window.renderSceneImage = async function(index) {
        const imgEl = document.getElementById(`scene-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const promptVal = document.getElementById(`scene-prompt-${index}`).value;
        const refsRaw = document.getElementById(`scene-refs-${index}`).value;
        const refImages = JSON.parse(refsRaw); // Array URL

        // Ambil Rasio
        const activeRatio = STATE.data.style.ratio || "16:9";
        let
