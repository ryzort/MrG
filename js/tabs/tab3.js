window.setupTab3 = function() {
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');
    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "";
    const selectedRatio = STATE.data.style.ratio || "1:1";

    if (characters.length === 0) {
        if(charGrid) charGrid.innerHTML = `<div class="col-span-full text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-400">Data Kosong. Generate di Tab 1.</div>`;
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
            const charVisual = typeof char === 'string' ? "Standing" : char.visual;
            const initialPrompt = `${stylePrompt}. Character design of ${charName}, ${charVisual}. Full body shot, neutral background.`;
            
            // Logic Persistence
            let existingImg = "logo.png";
            let opacityClass = "opacity-20";
            // Kita pake generatedUrl (Link Pollinations Asli) buat display juga
            if (typeof char === 'object' && char.generatedUrl) {
                existingImg = char.generatedUrl;
                opacityClass = "opacity-100";
            }

            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-2xl group animate-fade-in flex flex-col";
            card.innerHTML = `
                <div class="w-full ${ratioClass} bg-black/40 rounded-xl overflow-hidden mb-3 relative border border-white/5">
                    <img id="char-img-${index}" src="${existingImg}" class="w-full h-full object-contain ${opacityClass} transition-all duration-500">
                    
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-2"></i>
                        <span class="text-[10px] text-white">GENERATING...</span>
                    </div>
                    <div class="absolute bottom-2 right-2 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="viewFullImage(${index})" class="bg-black/60 hover:bg-white hover:text-black p-2 rounded-lg border border-white/10"><i class="ph ph-magnifying-glass-plus"></i></button>
                        <button onclick="downloadImage(${index}, '${charName}')" class="bg-black/60 hover:bg-green-500 p-2 rounded-lg border border-white/10"><i class="ph ph-download-simple"></i></button>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-white text-sm truncate pr-2">${charName}</h4>
                        <button onclick="generateSingleChar(${index})" class="text-[10px] bg-accent px-3 py-1 rounded font-bold">BUAT</button>
                    </div>
                    <textarea id="prompt-input-${index}" class="w-full bg-black/30 text-[10px] text-gray-400 p-2 rounded h-16 resize-none">${initialPrompt}</textarea>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // --- LOGIC GENERATE (DIRECT POLLINATIONS URL) ---
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        let w = 1024, h = 1024;
        if (selectedRatio === "16:9") { w = 1280; h = 720; }
        if (selectedRatio === "9:16") { w = 720; h = 1280; }

        loader.classList.remove('hidden');
        loader.classList.add('flex');
        imgEl.style.opacity = "0.3";

        try {
            // 1. Generate (Dapet Blob & Raw URL)
            const result = await fetchImageBlobAI(promptVal, w, h);
            
            // 2. Tampilkan Blob (Cepat)
            imgEl.src = result.blobUrl;
            imgEl.onload = () => {
                imgEl.classList.remove('opacity-20');
                imgEl.classList.add('opacity-100');
                loader.classList.add('hidden');
                loader.classList.remove('flex');

                // 3. Simpan RAW URL (Link Panjang Pollinations) ke State
                // Link ini AMAN buat referensi Tab 4 karena nanti di-encode
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
            alert("Gagal: " + e.message);
        }
    };

    // ... (Fungsi View, Download, Gen All SAMA) ...
    window.downloadImage = function(index, name) {
        const img = document.getElementById(`char-img-${index}`);
        const a = document.createElement('a'); a.href = img.src; a.download = `MrG_${name}.png`; a.click();
    };
    window.viewFullImage = function(index) {
        const img = document.getElementById(`char-img-${index}`);
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4";
        modal.innerHTML = `<img src="${img.src}" class="max-h-[90vh] max-w-[90vw] object-contain rounded">`;
        modal.onclick = () => modal.remove();
        document.body.appendChild(modal);
    };
    if(btnGenAll) {
        btnGenAll.onclick = () => {
            if(confirm("Generate Semua?")) characters.forEach((_, idx) => setTimeout(() => generateSingleChar(idx), idx * 5000));
        };
    }
};
