// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS - FIXED)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing...");
    
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    // AMBIL DATA
    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "High quality render";
    const selectedRatio = STATE.data.style.ratio || "1:1";

    if (characters.length === 0) {
        if(charGrid) charGrid.innerHTML = `<div class="col-span-full text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-400">Belum ada karakter. Generate ulang di Tab 1.</div>`;
        return;
    }

    renderCards();

    function renderCards() {
        charGrid.innerHTML = "";
        
        let ratioClass = "aspect-square";
        if (selectedRatio === "16:9") ratioClass = "aspect-video"; 
        if (selectedRatio === "9:16") ratioClass = "aspect-[9/16]"; 

        characters.forEach((char, index) => {
            // DETEKSI DATA: Apakah string lama atau Object baru?
            const charName = typeof char === 'string' ? char : char.name;
            const charVisual = typeof char === 'string' ? "Standing pose" : char.visual;

            // RUMUS PROMPT: [Style Master] + [Visual Karakter] + [Pose Standar]
            // Kita potong stylePrompt max 200 karakter biar URL gak kepanjangan & error
            const cleanStyle = stylePrompt.substring(0, 250);
            const initialPrompt = `${cleanStyle}. Character design of ${charName}, ${charVisual}. Full body shot, neutral background.`;

            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-xl hover:border-accent/50 transition-all group relative animate-fade-in";
            
            card.innerHTML = `
                <div class="w-full ${ratioClass} bg-black/50 rounded-lg overflow-hidden mb-3 relative border border-white/5 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <img id="char-img-${index}" src="logo.png" class="w-full h-full object-cover opacity-20 transition-opacity duration-500">
                    
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-2"></i>
                        <span class="text-[10px] text-white">Painting...</span>
                    </div>

                    <div id="error-msg-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-red-900/80 z-20 p-2 text-center">
                        <i class="ph ph-warning text-red-200 text-2xl mb-1"></i>
                        <span class="text-[10px] text-red-100 leading-tight">Gagal Load</span>
                    </div>

                    <button onclick="generateSingleChar(${index})" class="absolute bottom-3 right-3 bg-accent hover:bg-white hover:text-accent text-white p-3 rounded-full shadow-lg z-10 transition-transform hover:scale-110 active:scale-90">
                        <i class="ph ph-magic-wand text-lg"></i>
                    </button>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-white text-sm">${charName}</h4>
                        <button onclick="openEditModal(${index})" class="text-xs text-gray-400 hover:text-accent flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                            <i class="ph ph-pencil-simple"></i> Edit Prompt
                        </button>
                    </div>
                    <!-- Hidden input buat nyimpen prompt asli -->
                    <input type="hidden" id="prompt-input-${index}" value="${initialPrompt}">
                    <p class="text-[10px] text-gray-500 line-clamp-2 leading-relaxed italic" id="prompt-preview-${index}">
                        ${initialPrompt}
                    </p>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // --- MODAL EDIT PROMPT (SOLUSI BIAR GAK SEMPIT) ---
    // Kita bikin modal dinamis via JS aja biar gak ngerubah HTML banyak2
    window.openEditModal = function(index) {
        const currentPrompt = document.getElementById(`prompt-input-${index}`).value;
        const charName = typeof characters[index] === 'string' ? characters[index] : characters[index].name;

        // Buat elemen modal on-the-fly
        const modalHtml = `
            <div id="prompt-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="closePromptModal()"></div>
                <div class="bg-[#1e1e24] w-full max-w-lg rounded-2xl p-6 relative border border-white/10 shadow-2xl animate-fade-in">
                    <h3 class="text-lg font-bold text-white mb-4">Edit Prompt: <span class="text-accent">${charName}</span></h3>
                    <textarea id="modal-textarea" class="w-full h-40 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-accent focus:outline-none resize-none mb-4">${currentPrompt}</textarea>
                    <div class="flex justify-end gap-3">
                        <button onclick="closePromptModal()" class="px-4 py-2 text-sm text-gray-400 hover:text-white">Batal</button>
                        <button onclick="savePromptModal(${index})" class="btn-neon px-6 py-2 rounded-lg text-sm font-bold">Simpan</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window.closePromptModal = function() {
        const m = document.getElementById('prompt-modal');
        if(m) m.remove();
    };

    window.savePromptModal = function(index) {
        const newVal = document.getElementById('modal-textarea').value;
        document.getElementById(`prompt-input-${index}`).value = newVal;
        document.getElementById(`prompt-preview-${index}`).innerText = newVal; // Update preview kecil
        closePromptModal();
    };

    // --- GENERATE IMAGE (FIX LOADING FOREVER) ---
    window.generateSingleChar = function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const errorMsg = document.getElementById(`error-msg-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        // Reset UI
        imgEl.style.opacity = "0.2";
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        errorMsg.classList.add('hidden');
        errorMsg.classList.remove('flex');

        try {
            console.log(`[Gen Char ${index}] Prompt Length: ${promptVal.length}`);
            
            // Generate URL
            const url = generateImageURL(promptVal);
            
            // Add Timestamp biar gak ke-cache browser
            const uniqueUrl = url + "&t=" + new Date().getTime();

            // Load Image Object
            const newImg = new Image();
            
            newImg.onload = function() {
                console.log(`[Gen Char ${index}] Success!`);
                imgEl.src = uniqueUrl;
                imgEl.style.opacity = "1";
                loader.classList.add('hidden');
                loader.classList.remove('flex');
            };

            newImg.onerror = function() {
                console.error(`[Gen Char ${index}] Failed to load image.`);
                loader.classList.add('hidden');
                loader.classList.remove('flex');
                errorMsg.classList.remove('hidden');
                errorMsg.classList.add('flex');
                // Kasih tau user kalau prompt kepanjangan
                if(promptVal.length > 500) {
                    alert("Gagal generate: Prompt terlalu panjang! Coba perpendek deskripsi style di Tab 2 atau edit prompt karakter ini.");
                }
            };

            // Trigger load
            newImg.src = uniqueUrl;

        } catch (e) {
            console.error(e);
            alert("System Error: " + e.message);
            loader.classList.add('hidden');
        }
    };
    
    // Generate All (Sama kayak sebelumnya)
    if(btnGenAll) {
        btnGenAll.onclick = function() {
            if(!confirm("Generate semua?")) return;
            characters.forEach((_, idx) => setTimeout(() => generateSingleChar(idx), idx * 2000));
        };
    }
};
