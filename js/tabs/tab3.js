// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS - VIP VERSION)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing VIP System...");
    
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "Professional 3D render";
    const selectedRatio = STATE.data.style.ratio || "1:1";

    if (characters.length === 0) {
        if(charGrid) charGrid.innerHTML = `<div class="col-span-full text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-400">Belum ada karakter. Selesaikan Tab 1 dulu.</div>`;
        return;
    }

    renderCards();

    function renderCards() {
        charGrid.innerHTML = "";
        
        let ratioClass = "aspect-square";
        if (selectedRatio === "16:9") ratioClass = "aspect-video"; 
        if (selectedRatio === "9:16") ratioClass = "aspect-[9/16]"; 

        characters.forEach((char, index) => {
            const charName = typeof char === 'string' ? char : char.name;
            const charVisual = typeof char === 'string' ? "Standing pose, detailed character" : char.visual;

            // Prompt Gabungan: Master Style + Deskripsi Fisik
            const initialPrompt = `${stylePrompt}. Character design of ${charName}, ${charVisual}. Full body, neutral background.`;

            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-xl hover:border-accent/50 transition-all group animate-fade-in";
            
            card.innerHTML = `
                <div class="w-full ${ratioClass} bg-black/50 rounded-lg overflow-hidden mb-3 relative border border-white/5">
                    <img id="char-img-${index}" src="logo.png" class="w-full h-full object-cover opacity-20">
                    
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-2"></i>
                        <span class="text-[10px] text-white">VIP GENERATING...</span>
                    </div>

                    <div id="error-msg-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-red-900/80 z-20 p-2 text-center">
                        <i class="ph ph-warning text-2xl mb-1"></i>
                        <span class="text-[10px]">Gagal Load</span>
                    </div>

                    <button onclick="generateSingleChar(${index})" class="absolute bottom-3 right-3 bg-accent text-white p-3 rounded-full shadow-lg z-30 hover:scale-110 active:scale-90">
                        <i class="ph ph-magic-wand text-lg"></i>
                    </button>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-white text-sm">${charName}</h4>
                        <button onclick="openEditModal(${index})" class="text-[10px] text-gray-400 hover:text-accent bg-white/5 px-2 py-1 rounded">
                            EDIT PROMPT
                        </button>
                    </div>
                    <input type="hidden" id="prompt-input-${index}" value="${initialPrompt}">
                    <p class="text-[9px] text-gray-500 line-clamp-2 italic" id="prompt-preview-${index}">
                        ${initialPrompt}
                    </p>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // --- LOGIC GENERATE VIP (FETCH BLOB) ---
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const errorMsg = document.getElementById(`error-msg-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        errorMsg.classList.add('hidden');
        imgEl.style.opacity = "0.1";

        try {
            // MANGGIL FUNGSI VIP DARI API.JS
            const objectUrl = await fetchImageBlobAI(promptVal, 1024, 1024);
            
            imgEl.src = objectUrl;
            imgEl.onload = () => {
                imgEl.style.opacity = "1";
                loader.classList.add('hidden');
                loader.classList.remove('flex');
            };

        } catch (e) {
            console.error(e);
            loader.classList.add('hidden');
            errorMsg.classList.remove('hidden');
            errorMsg.classList.add('flex');
            alert("VIP Generate Error: " + e.message);
        }
    };

    // --- MODAL EXPAND UNTUK EDIT ---
    window.openEditModal = function(index) {
        const currentPrompt = document.getElementById(`prompt-input-${index}`).value;
        const modalHtml = `
            <div id="prompt-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" onclick="closePromptModal()"></div>
                <div class="bg-[#1e1e24] w-full max-w-lg rounded-2xl p-6 relative border border-white/10 shadow-2xl animate-fade-in">
                    <h3 class="text-sm font-bold text-accent mb-4 uppercase tracking-widest">Edit VIP Prompt</h3>
                    <textarea id="modal-textarea" class="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-200 focus:border-accent focus:outline-none resize-none mb-4">${currentPrompt}</textarea>
                    <div class="flex justify-end gap-3">
                        <button onclick="closePromptModal()" class="text-xs text-gray-500">BATAL</button>
                        <button onclick="savePromptModal(${index})" class="btn-neon px-6 py-2 rounded-lg text-xs font-bold">SIMPAN</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window.closePromptModal = function() { document.getElementById('prompt-modal')?.remove(); };

    window.savePromptModal = function(index) {
        const newVal = document.getElementById('modal-textarea').value;
        document.getElementById(`prompt-input-${index}`).value = newVal;
        document.getElementById(`prompt-preview-${index}`).innerText = newVal;
        closePromptModal();
    };

    if(btnGenAll) {
        btnGenAll.onclick = () => {
            characters.forEach((_, idx) => setTimeout(() => generateSingleChar(idx), idx * 3000));
        };
    }
};
