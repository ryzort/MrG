// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS - ULTIMATE)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing Ultimate System...");
    
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "";
    const selectedRatio = STATE.data.style.ratio || "1:1";

    if (characters.length === 0) {
        if(charGrid) charGrid.innerHTML = `<div class="col-span-full text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-400 font-bold">Data Karakter Kosong. Generate di Tab 1 dulu bro!</div>`;
        return;
    }

    renderCards();

    function renderCards() {
        charGrid.innerHTML = "";
        
        // Map Rasio ke CSS & Resolusi API
        let ratioClass = "aspect-square"; 
        let dim = { w: 1024, h: 1024 };

        if (selectedRatio === "16:9") {
            ratioClass = "aspect-video";
            dim = { w: 1280, h: 720 };
        } else if (selectedRatio === "9:16") {
            ratioClass = "aspect-[9/16]";
            dim = { w: 720, h: 1280 };
        }

        characters.forEach((char, index) => {
            const charName = typeof char === 'string' ? char : char.name;
            const charVisual = typeof char === 'string' ? "Standing pose" : char.visual;

            // Prompt Konstruksi
            const initialPrompt = `${stylePrompt}. Character design of ${charName}, ${charVisual}. Full body, neutral background, cinematic lighting.`;

            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-2xl hover:border-accent/50 transition-all group animate-fade-in flex flex-col";
            
            card.innerHTML = `
                <!-- FRAME GAMBAR -->
                <div class="w-full ${ratioClass} bg-black/40 rounded-xl overflow-hidden mb-4 relative border border-white/5 group-hover:shadow-2xl transition-all">
                    
                    <!-- object-contain biar GAK KEPOTONG -->
                    <img id="char-img-${index}" src="logo.png" class="w-full h-full object-contain opacity-10 transition-all duration-700">
                    
                    <!-- Overlay Loading -->
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 backdrop-blur-sm z-20">
                        <i class="ph ph-paint-brush-broad animate-bounce text-accent text-4xl mb-2"></i>
                        <span class="text-[10px] text-white font-black tracking-widest">CREATING...</span>
                    </div>

                    <!-- Overlay Gagal -->
                    <div id="error-msg-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-red-900/60 z-20 p-4 text-center">
                        <i class="ph ph-warning-octagon text-3xl mb-1"></i>
                        <span class="text-xs font-bold">API Limit (429)</span>
                        <p class="text-[9px] mt-1 opacity-80">Tunggu 15-30 detik lalu klik regenerasi bro.</p>
                    </div>

                    <!-- ACTION FLOATING BUTTONS -->
                    <div class="absolute bottom-3 right-3 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="viewFullImage(${index})" class="bg-black/60 hover:bg-white hover:text-black p-2 rounded-lg backdrop-blur-md border border-white/10" title="Lihat Full">
                            <i class="ph ph-magnifying-glass-plus"></i>
                        </button>
                        <button onclick="downloadImage(${index}, '${charName}')" class="bg-black/60 hover:bg-green-500 p-2 rounded-lg backdrop-blur-md border border-white/10" title="Download">
                            <i class="ph ph-download-simple"></i>
                        </button>
                    </div>
                </div>

                <!-- INFO & EDIT -->
                <div class="px-1 flex flex-col flex-1">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-black text-white text-sm uppercase tracking-tighter">${charName}</h4>
                        <div class="flex gap-1">
                            <button onclick="openEditModal(${index})" class="text-[10px] bg-white/5 hover:bg-accent px-2 py-1 rounded-md transition-colors font-bold">PROMPT</button>
                            <button onclick="generateSingleChar(${index})" class="text-[10px] bg-accent hover:bg-white hover:text-accent px-2 py-1 rounded-md transition-colors font-bold flex items-center gap-1">
                                <i class="ph ph-arrows-clockwise"></i> REGEN
                            </button>
                        </div>
                    </div>
                    <input type="hidden" id="prompt-input-${index}" value="${initialPrompt}">
                    <p class="text-[9px] text-gray-500 line-clamp-2 italic leading-tight" id="prompt-preview-${index}">
                        ${initialPrompt}
                    </p>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // --- FITUR GENERATE (DENGAN RESOLUSI DINAMIS) ---
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const errorMsg = document.getElementById(`error-msg-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        // Reset Resolusi berdasarkan Ratio State
        let w = 1024, h = 1024;
        if (selectedRatio === "16:9") { w = 1280; h = 720; }
        if (selectedRatio === "9:16") { w = 720; h = 1280; }

        loader.classList.remove('hidden');
        loader.classList.add('flex');
        errorMsg.classList.add('hidden');
        imgEl.style.opacity = "0.1";

        try {
            // Pake Resolusi Dinamis biar gak kepotong!
            const objectUrl = await fetchImageBlobAI(promptVal, w, h);
            
            imgEl.src = objectUrl;
            imgEl.onload = () => {
                imgEl.style.opacity = "1";
                imgEl.classList.remove('opacity-10');
                loader.classList.add('hidden');
            };

        } catch (e) {
            console.error(e);
            loader.classList.add('hidden');
            errorMsg.classList.remove('hidden');
            errorMsg.classList.add('flex');
            if(e.message.includes("429")) {
                console.warn("Kena Rate Limit Bro!");
            }
        }
    };

    // --- FITUR DOWNLOAD ---
    window.downloadImage = function(index, name) {
        const img = document.getElementById(`char-img-${index}`);
        if(img.src.includes('logo.png')) return alert("Generate dulu gambarnya bro!");
        
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `MrG_${name}_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // --- FITUR FULL VIEW (MODAL) ---
    window.viewFullImage = function(index) {
        const img = document.getElementById(`char-img-${index}`);
        if(img.src.includes('logo.png')) return;

        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fade-in";
        modal.onclick = () => modal.remove();
        modal.innerHTML = `
            <div class="relative max-w-5xl max-h-full">
                <img src="${img.src}" class="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10">
                <p class="text-center text-gray-500 text-xs mt-4">Klik dimana saja untuk menutup</p>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // ... (Fungsi openEditModal, closePromptModal, savePromptModal tetap sama seperti sebelumnya) ...
    window.openEditModal = function(index) {
        const currentPrompt = document.getElementById(`prompt-input-${index}`).value;
        const charName = typeof characters[index] === 'string' ? characters[index] : characters[index].name;
        const modalHtml = `
            <div id="prompt-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" onclick="closePromptModal()"></div>
                <div class="bg-[#1e1e24] w-full max-w-lg rounded-2xl p-6 relative border border-white/10 shadow-2xl animate-fade-in">
                    <h3 class="text-sm font-bold text-accent mb-4 uppercase tracking-widest">Edit Character Prompt</h3>
                    <textarea id="modal-textarea" class="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-200 focus:border-accent focus:outline-none resize-none mb-4">${currentPrompt}</textarea>
                    <div class="flex justify-end gap-3">
                        <button onclick="closePromptModal()" class="text-xs text-gray-500">BATAL</button>
                        <button onclick="savePromptModal(${index})" class="btn-neon px-6 py-2 rounded-lg text-xs font-bold">SIMPAN & UPDATE</button>
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
            alert("Memulai generate massal. Mohon tunggu jeda antar gambar biar gak kena Rate Limit.");
            characters.forEach((_, idx) => {
                // Kasih jeda 5 detik biar aman dari 429
                setTimeout(() => generateSingleChar(idx), idx * 5000);
            });
        };
    }
};
