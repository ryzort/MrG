// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS - FINAL FIX)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing...");
    
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "High quality render";
    
    // Ambil ratio dari State
    const currentRatio = STATE.data.style.ratio || "1:1";

    // Cek Data Kosong
    if (characters.length === 0) {
        if(charGrid) charGrid.innerHTML = `<div class="col-span-full text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-400 font-bold">Data Kosong. Generate di Tab 1 dulu.</div>`;
        return;
    }

    renderCards();

    function renderCards() {
        charGrid.innerHTML = "";
        
        // Tentukan CSS Ratio (Tailwind + Inline Style backup)
        let ratioStyle = "aspect-ratio: 1 / 1;";
        let ratioClass = "aspect-square";
        
        if (currentRatio === "16:9") { ratioClass = "aspect-video"; ratioStyle = "aspect-ratio: 16 / 9;"; }
        if (currentRatio === "9:16") { ratioClass = "aspect-[9/16]"; ratioStyle = "aspect-ratio: 9 / 16;"; }

        characters.forEach((char, index) => {
            const charName = typeof char === 'string' ? char : char.name;
            const charVisual = typeof char === 'string' ? "Standing pose" : char.visual;

            const initialPrompt = `${stylePrompt}. Character design of ${charName}, ${charVisual}. Full body shot, neutral background.`;

            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-2xl hover:border-accent/50 transition-all group animate-fade-in flex flex-col";
            
            card.innerHTML = `
                <!-- FRAME GAMBAR (Pake inline style biar paten) -->
                <div class="w-full bg-black/40 rounded-xl overflow-hidden mb-4 relative border border-white/5 group-hover:shadow-2xl transition-all" style="${ratioStyle}">
                    
                    <img id="char-img-${index}" src="logo.png" class="w-full h-full object-contain opacity-10 transition-all duration-700">
                    
                    <!-- Loading Overlay -->
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 backdrop-blur-sm z-20">
                        <i class="ph ph-paint-brush-broad animate-bounce text-accent text-4xl mb-2"></i>
                        <span class="text-[10px] text-white font-black tracking-widest">CREATING...</span>
                    </div>

                    <!-- Error Overlay -->
                    <div id="error-msg-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-red-900/60 z-20 p-4 text-center">
                        <i class="ph ph-warning-octagon text-3xl mb-1"></i>
                        <span class="text-xs font-bold text-white">Gagal Load</span>
                        <button onclick="generateSingleChar(${index})" class="mt-2 text-[10px] bg-white text-red-900 px-2 py-1 rounded font-bold hover:bg-gray-200">COBA LAGI</button>
                    </div>

                    <!-- Action Buttons -->
                    <div class="absolute bottom-3 right-3 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="viewFullImage(${index})" class="bg-black/60 hover:bg-white hover:text-black p-2 rounded-lg backdrop-blur-md border border-white/10" title="Full View">
                            <i class="ph ph-magnifying-glass-plus"></i>
                        </button>
                        <button onclick="downloadImage(${index}, '${charName}')" class="bg-black/60 hover:bg-green-500 hover:text-white p-2 rounded-lg backdrop-blur-md border border-white/10" title="Download">
                            <i class="ph ph-download-simple"></i>
                        </button>
                    </div>
                </div>

                <!-- Info Area -->
                <div class="px-1 flex flex-col flex-1">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-black text-white text-sm uppercase tracking-tighter truncate pr-2">${charName}</h4>
                        <div class="flex gap-1 shrink-0">
                            <button onclick="openEditModal(${index})" class="text-[10px] bg-white/5 hover:bg-accent px-2 py-1 rounded-md transition-colors font-bold text-gray-300 hover:text-white">PROMPT</button>
                            <button onclick="generateSingleChar(${index})" class="text-[10px] bg-accent hover:bg-white hover:text-accent px-2 py-1 rounded-md transition-colors font-bold flex items-center gap-1 text-white">
                                <i class="ph ph-arrows-clockwise"></i> REGEN
                            </button>
                        </div>
                    </div>
                    <input type="hidden" id="prompt-input-${index}" value="${initialPrompt}">
                    <p class="text-[9px] text-gray-500 line-clamp-2 italic leading-tight cursor-help" title="${initialPrompt}">
                        ${initialPrompt}
                    </p>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // --- GENERATE SINGLE (DENGAN RESOLUSI DINAMIS) ---
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const errorMsg = document.getElementById(`error-msg-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        // Ambil Ratio LANGSUNG dari State saat tombol diklik (Biar update)
        const activeRatio = STATE.data.style.ratio || "1:1";
        
        // Tentukan W & H
        let w = 1024, h = 1024;
        if (activeRatio === "16:9") { w = 1280; h = 720; }
        if (activeRatio === "9:16") { w = 720; h = 1280; }

        // UI Start
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        errorMsg.classList.add('hidden');
        errorMsg.classList.remove('flex'); // Pastikan error hilang dulu
        imgEl.style.opacity = "0.1";

        try {
            console.log(`Generating Char ${index} (${w}x${h})...`);
            
            // Panggil API (Jalur VIP Fetch Blob)
            const objectUrl = await fetchImageBlobAI(promptVal, w, h);
            
            imgEl.src = objectUrl;
            imgEl.onload = () => {
                imgEl.style.opacity = "1";
                loader.classList.add('hidden');
                loader.classList.remove('flex');
            };

        } catch (e) {
            console.error(e);
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            errorMsg.classList.remove('hidden');
            errorMsg.classList.add('flex');
            // Gak perlu alert popup biar gak ganggu kalau generate massal
        }
    };

    // --- DOWNLOAD ---
    window.downloadImage = function(index, name) {
        const img = document.getElementById(`char-img-${index}`);
        if(img.src.includes('logo.png')) return alert("Generate dulu gambarnya bro!");
        
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `MrG_${name}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // --- FULL VIEW (MODAL RESPONSIVE) ---
    window.viewFullImage = function(index) {
        const img = document.getElementById(`char-img-${index}`);
        if(img.src.includes('logo.png')) return;

        const activeRatio = STATE.data.style.ratio || "1:1";
        
        // Style container biar ngikutin rasio gambar
        let cssStyle = "max-width:90vw; max-height:90vh;";
        if(activeRatio === "9:16") cssStyle = "height:90vh; aspect-ratio:9/16;";
        if(activeRatio === "16:9") cssStyle = "width:90vw; aspect-ratio:16/9;";

        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fade-in";
        modal.innerHTML = `
            <div class="relative flex flex-col items-center justify-center" style="${cssStyle}">
                <img src="${img.src}" class="w-full h-full object-contain rounded-lg shadow-2xl border border-white/10">
                <button onclick="this.parentElement.parentElement.remove()" class="absolute -top-10 right-0 text-white text-xl hover:text-red-500 transition-colors">
                    <i class="ph ph-x-circle"></i>
                </button>
            </div>
        `;
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    };

    // --- EDIT MODAL ---
    window.openEditModal = function(index) {
        const currentPrompt = document.getElementById(`prompt-input-${index}`).value;
        const modalHtml = `
            <div id="prompt-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                <div class="bg-[#1e1e24] w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl animate-fade-in">
                    <h3 class="text-sm font-bold text-accent mb-4 uppercase tracking-widest">Edit Character Prompt</h3>
                    <textarea id="modal-textarea" class="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-200 focus:border-accent focus:outline-none resize-none mb-4">${currentPrompt}</textarea>
                    <div class="flex justify-end gap-3">
                        <button onclick="document.getElementById('prompt-modal').remove()" class="text-xs text-gray-500 uppercase hover:text-white">Batal</button>
                        <button onclick="savePromptModal(${index})" class="btn-neon px-6 py-2 rounded-lg text-xs font-bold">SIMPAN & UPDATE</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window.savePromptModal = function(index) {
        const newVal = document.getElementById('modal-textarea').value;
        document.getElementById(`prompt-input-${index}`).value = newVal;
        document.getElementById('prompt-modal').remove();
        // Opsional: Langsung generate pas simpan?
        // generateSingleChar(index); 
    };

    // GENERATE ALL
    if(btnGenAll) {
        btnGenAll.onclick = () => {
            alert("Memulai antrian generate... (Jeda 5 detik per gambar)");
            characters.forEach((_, idx) => {
                setTimeout(() => generateSingleChar(idx), idx * 5000);
            });
        };
    }
};
