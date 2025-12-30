// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS - PERSISTENCE FIX)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing...");
    
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "High quality render";
    const selectedRatio = STATE.data.style.ratio || "1:1";

    if (characters.length === 0) {
        if(charGrid) charGrid.innerHTML = `<div class="col-span-full text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-400 font-bold">Data Kosong. Generate di Tab 1 dulu.</div>`;
        return;
    }

    renderCards();

    function renderCards() {
        charGrid.innerHTML = "";
        
        let ratioClass = "aspect-square";
        if (selectedRatio === "16:9") ratioClass = "aspect-video"; 
        if (selectedRatio === "9:16") ratioClass = "aspect-[9/16]"; 

        characters.forEach((char, index) => {
            // Cek Data: Object vs String
            const charName = typeof char === 'string' ? char : char.name;
            const charVisual = typeof char === 'string' ? "Standing pose" : char.visual;
            
            // CEK APAKAH SUDAH ADA GAMBAR TERSIMPAN? (Persistence Logic)
            // Kita simpan di properti sementara 'generatedUrl' di dalam objek karakter
            const existingImg = char.generatedUrl || "logo.png";
            const isGenerated = char.generatedUrl ? true : false;
            const opacityClass = isGenerated ? "opacity-100" : "opacity-20";

            const initialPrompt = `${stylePrompt}. Character design of ${charName}, ${charVisual}. Full body shot, neutral background.`;

            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-2xl hover:border-accent/50 transition-all group animate-fade-in flex flex-col";
            
            card.innerHTML = `
                <div class="w-full ${ratioClass} bg-black/40 rounded-xl overflow-hidden mb-4 relative border border-white/5 group-hover:shadow-2xl transition-all">
                    
                    <!-- Gambar Utama -->
                    <img id="char-img-${index}" src="${existingImg}" class="w-full h-full object-contain ${opacityClass} transition-all duration-500">
                    
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 backdrop-blur-sm z-20">
                        <i class="ph ph-paint-brush-broad animate-bounce text-accent text-4xl mb-2"></i>
                        <span class="text-[10px] text-white font-black tracking-widest">CREATING...</span>
                    </div>

                    <div id="error-msg-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-red-900/80 z-20 p-4 text-center">
                        <i class="ph ph-warning-octagon text-3xl mb-1 text-white"></i>
                        <span class="text-xs font-bold text-white">Gagal Load (429)</span>
                        <p class="text-[9px] text-white mt-1">Tunggu sebentar...</p>
                        <button onclick="generateSingleChar(${index})" class="mt-2 bg-white text-red-900 px-3 py-1 rounded text-xs font-bold">COBA LAGI</button>
                    </div>

                    <!-- Tombol Action -->
                    <div class="absolute bottom-3 right-3 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="viewFullImage(${index})" class="bg-black/60 hover:bg-white hover:text-black p-2 rounded-lg backdrop-blur-md border border-white/10" title="Full View">
                            <i class="ph ph-magnifying-glass-plus"></i>
                        </button>
                        <button onclick="downloadImage(${index}, '${charName}')" class="bg-black/60 hover:bg-green-500 hover:text-white p-2 rounded-lg backdrop-blur-md border border-white/10" title="Download">
                            <i class="ph ph-download-simple"></i>
                        </button>
                    </div>
                </div>

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

    // --- GENERATE LOGIC ---
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const errorMsg = document.getElementById(`error-msg-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        // Ambil Ratio
        const activeRatio = STATE.data.style.ratio || "1:1";
        let w = 1024, h = 1024;
        if (activeRatio === "16:9") { w = 1280; h = 720; }
        if (activeRatio === "9:16") { w = 720; h = 1280; }

        loader.classList.remove('hidden');
        loader.classList.add('flex');
        errorMsg.classList.add('hidden');
        errorMsg.classList.remove('flex');
        
        // Jangan ubah opacity kalo lagi regen, biar gambar lama masih keliatan dikit
        if(imgEl.src.includes('logo.png')) imgEl.style.opacity = "0.1";

        try {
            console.log(`Generating Char ${index}...`);
            const objectUrl = await fetchImageBlobAI(promptVal, w, h);
            
            imgEl.src = objectUrl;
            imgEl.onload = () => {
                imgEl.style.opacity = "1";
                imgEl.classList.remove('opacity-10');
                loader.classList.add('hidden');
                
                // SIMPAN KE STATE (PENTING!)
                // Biar pas pindah tab, gambarnya gak ilang
                if(typeof characters[index] === 'object') {
                    characters[index].generatedUrl = objectUrl;
                } else {
                    // Kalau data lama masih string, ubah jadi object
                    characters[index] = { name: characters[index], visual: "", generatedUrl: objectUrl };
                }
                // Update State Global
                STATE.data.story.characters = characters;
                // Note: Blob URL cuma bertahan selama sesi browser. 
                // Kalau refresh halaman (F5), tetep akan hilang. 
                // Tapi pindah tab AMAN.
            };

        } catch (e) {
            console.error(e);
            loader.classList.add('hidden');
            errorMsg.classList.remove('hidden');
            errorMsg.classList.add('flex');
        }
    };

    // --- FULL VIEW FIXED (ASPECT RATIO TRUE) ---
    window.viewFullImage = function(index) {
        const img = document.getElementById(`char-img-${index}`);
        if(img.src.includes('logo.png')) return;

        const activeRatio = STATE.data.style.ratio || "1:1";
        
        // Logic CSS Modal biar bentuknya bener
        let modalStyle = "";
        if(activeRatio === "1:1") modalStyle = "width: 80vh; aspect-ratio: 1/1;";
        if(activeRatio === "16:9") modalStyle = "width: 90vw; aspect-ratio: 16/9;";
        if(activeRatio === "9:16") modalStyle = "height: 90vh; aspect-ratio: 9/16;";

        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fade-in";
        modal.innerHTML = `
            <div class="relative flex items-center justify-center" style="max-width:100%; max-height:100%;">
                <!-- Container Gambar dengan Rasio Paksa -->
                <div style="${modalStyle}" class="relative">
                    <img src="${img.src}" class="w-full h-full object-contain rounded-lg shadow-2xl border border-white/10 bg-black">
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-3xl hover:text-red-500 transition-colors bg-black/50 rounded-full p-2">
                    <i class="ph ph-x-circle"></i>
                </button>
            </div>
        `;
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    };

    // ... (Fungsi Modal Edit & Download & Gen All Tetap Sama) ...
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

    window.openEditModal = function(index) {
        const currentPrompt = document.getElementById(`prompt-input-${index}`).value;
        const modalHtml = `
            <div id="prompt-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                <div class="bg-[#1e1e24] w-full max-
