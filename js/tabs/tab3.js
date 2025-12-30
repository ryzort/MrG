// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS - FINAL FIXED)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing...");
    
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    // 1. AMBIL DATA LANGSUNG DARI STATE
    // Menggunakan optional chaining (?.) untuk keamanan jika data belum ada
    const characters = STATE.data.story?.characters || [];
    const stylePrompt = STATE.data.style?.artPrompt || "High quality render";
    const selectedRatio = STATE.data.style?.ratio || "1:1";

    console.log("Data Tab 3:", { count: characters.length, ratio: selectedRatio });

    // Cek jika data kosong
    if (characters.length === 0) {
        if(charGrid) {
            charGrid.innerHTML = `
                <div class="col-span-full text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-400">
                    <i class="ph ph-ghost text-4xl mb-2"></i>
                    <p>Belum ada karakter. Generate dulu di Tab 1.</p>
                </div>`;
        }
        return;
    }

    // 2. RENDER KARTU
    renderCards();

    function renderCards() {
        charGrid.innerHTML = "";
        
        // Tentukan CSS Class berdasarkan Rasio
        let ratioClass = "aspect-square"; // Default 1:1
        if (selectedRatio === "16:9") ratioClass = "aspect-video"; 
        if (selectedRatio === "9:16") ratioClass = "aspect-[9/16]"; 

        characters.forEach((char, index) => {
            // Handle Data String vs Object
            const charName = typeof char === 'string' ? char : char.name;
            const charVisual = typeof char === 'string' ? "Standing pose" : (char.visual || "Standing pose");
            
            // Handle Gambar Tersimpan (Persistence)
            let existingImg = "logo.png"; // Gambar default
            let opacityClass = "opacity-20";
            
            if (typeof char === 'object' && char.generatedUrl) {
                existingImg = char.generatedUrl;
                opacityClass = "opacity-100";
            }

            // Konstruksi Prompt
            const initialPrompt = `${stylePrompt}. Character design of ${charName}, ${charVisual}. Full body shot, neutral background.`;

            // HTML KARTU
            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-2xl hover:border-accent/50 transition-all group animate-fade-in flex flex-col";
            
            card.innerHTML = `
                <!-- FRAME GAMBAR -->
                <div class="w-full ${ratioClass} bg-black/40 rounded-xl overflow-hidden mb-3 relative border border-white/5 group-hover:shadow-2xl transition-all">
                    
                    <img id="char-img-${index}" src="${existingImg}" class="w-full h-full object-contain ${opacityClass} transition-all duration-500">
                    
                    <!-- Loading Overlay -->
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 backdrop-blur-sm z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-2"></i>
                        <span class="text-[10px] text-white font-bold">GENERATING...</span>
                    </div>

                    <!-- Error Overlay -->
                    <div id="error-msg-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-red-900/80 z-20 p-4 text-center">
                        <i class="ph ph-warning text-2xl mb-1 text-white"></i>
                        <span class="text-[10px] text-white">Gagal Load</span>
                    </div>

                    <!-- Action Buttons (Bottom Right) -->
                    <div class="absolute bottom-2 right-2 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="viewFullImage(${index})" class="bg-black/60 hover:bg-white hover:text-black p-2 rounded-lg backdrop-blur-md border border-white/10" title="Lihat Full">
                            <i class="ph ph-magnifying-glass-plus"></i>
                        </button>
                        <button onclick="downloadImage(${index}, '${charName}')" class="bg-black/60 hover:bg-green-500 hover:text-white p-2 rounded-lg backdrop-blur-md border border-white/10" title="Download">
                            <i class="ph ph-download-simple"></i>
                        </button>
                    </div>
                </div>

                <!-- INFO & KONTROL -->
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-white text-sm truncate pr-2">${charName}</h4>
                        <button onclick="generateSingleChar(${index})" class="text-[10px] bg-accent hover:bg-white hover:text-accent text-white px-3 py-1 rounded-md font-bold transition-colors flex items-center gap-1">
                            <i class="ph ph-magic-wand"></i> BUAT
                        </button>
                    </div>
                    
                    <!-- Prompt Area (Textarea biasa biar gampang diedit) -->
                    <div class="relative group/prompt">
                        <textarea id="prompt-input-${index}" class="w-full bg-black/30 text-[10px] text-gray-400 p-2 rounded border border-white/5 focus:border-accent focus:text-white h-16 resize-none transition-all">${initialPrompt}</textarea>
                        <div class="absolute bottom-1 right-1 text-[8px] text-gray-600 pointer-events-none">Edit Prompt</div>
                    </div>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // 3. FUNGSI GENERATE (SAFE MODE)
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const errorMsg = document.getElementById(`error-msg-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        // Ambil Ratio Terbaru dari State
        const activeRatio = STATE.data.style?.ratio || "1:1";
        
        // Mapping Resolusi
        let w = 1024, h = 1024;
        if (activeRatio === "16:9") { w = 1280; h = 720; }
        if (activeRatio === "9:16") { w = 720; h = 1280; }

        // UI Reset
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        errorMsg.classList.add('hidden');
        errorMsg.classList.remove('flex');
        
        if(imgEl) imgEl.style.opacity = "0.3";

        // ... di dalam window.generateSingleChar ...
        try {
            console.log(`Generating index ${index}...`);
            
            // Panggil API (Sekarang return Object)
            const result = await fetchImageBlobAI(promptVal, w, h);
            
            // Tampilkan pake Blob (Biar cepet & tajam)
            imgEl.src = result.blobUrl;
            
            imgEl.onload = () => {
                imgEl.classList.remove('opacity-20');
                imgEl.classList.add('opacity-100');
                loader.classList.add('hidden');
                loader.classList.remove('flex');
                
                // --- UPDATE STATE (SIMPAN LINK ASLI/RAW) ---
                // Kita simpan result.rawUrl, BUKAN result.blobUrl
                // Karena result.rawUrl bisa dibaca server AI buat referensi Tab 4
                if (typeof characters[index] !== 'object') {
                    characters[index] = { name: characters[index], visual: "", generatedUrl: result.rawUrl };
                } else {
                    characters[index].generatedUrl = result.rawUrl;
                }
                
                STATE.data.story.characters = characters;
                STATE.save();
            };

        } catch (e) {
            console.error(e);
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            errorMsg.classList.remove('hidden');
            errorMsg.classList.add('flex');
            // alert("Gagal Generate: " + e.message); // Optional alert
        }
    };

    // --- FUNGSI PENDUKUNG ---
    
    // Download Image
    window.downloadImage = function(index, name) {
        const img = document.getElementById(`char-img-${index}`);
        if(!img || img.src.includes('logo.png')) return alert("Belum ada gambar!");
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `MrG_${name}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // View Full Image
    window.viewFullImage = function(index) {
        const img = document.getElementById(`char-img-${index}`);
        if(!img || img.src.includes('logo.png')) return;

        const activeRatio = STATE.data.style?.ratio || "1:1";
        
        // CSS Style untuk Modal agar tidak gepeng
        let modalStyle = "max-height: 90vh; max-width: 90vw; object-fit: contain;";
        if (activeRatio === "9:16") modalStyle = "height: 85vh; aspect-ratio: 9/16; object-fit: contain;";
        if (activeRatio === "16:9") modalStyle = "width: 90vw; aspect-ratio: 16/9; object-fit: contain;";

        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fade-in";
        
        modal.innerHTML = `
            <div class="relative">
                <img src="${img.src}" style="${modalStyle}" class="rounded-lg shadow-2xl border border-white/10">
                <button onclick="this.parentElement.parentElement.remove()" class="absolute -top-12 right-0 text-white p-2 bg-white/10 rounded-full hover:bg-red-500 transition-colors">
                    <i class="ph ph-x text-xl"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Generate All
    if(btnGenAll) {
        btnGenAll.onclick = () => {
            if(confirm("Generate Semua? (Jeda 5 Detik)")) {
                characters.forEach((_, idx) => setTimeout(() => generateSingleChar(idx), idx * 5000));
            }
        };
    }
};
