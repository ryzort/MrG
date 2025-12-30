window.setupTab3 = function() {
    console.log("Tab 3 Loaded via Logic.");

    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    // 1. AMBIL DATA LANGSUNG (Tanpa Safety Check Ribet)
    // Asumsi: Tab 1 sudah dijalankan, jadi data pasti ada di STATE
    const characters = STATE.data.story.characters; 
    const stylePrompt = STATE.data.style.artPrompt;
    const selectedRatio = STATE.data.style.ratio || "1:1";

    // Cek Data di Console (Buat Debug)
    console.log("Menerima Data Karakter:", characters);

    // Kalau kosong, kasih tau suruh ke Tab 1
    if (!characters || characters.length === 0) {
        charGrid.innerHTML = `
            <div class="col-span-full text-center py-20 border border-white/10 rounded-xl bg-white/5">
                <p class="text-gray-400">Data Karakter Kosong.<br>Silakan Generate Cerita di <b>Tab 1</b> dulu.</p>
            </div>`;
        return;
    }

    // 2. RENDER KARTU
    charGrid.innerHTML = ""; // Bersihkan grid sebelum isi baru

    // Tentukan CSS Rasio (Biar frame ngikutin pilihan Tab 2)
    let ratioClass = "aspect-square";
    if (selectedRatio === "16:9") ratioClass = "aspect-video";
    if (selectedRatio === "9:16") ratioClass = "aspect-[9/16]";

    characters.forEach((char, index) => {
        // Handle format data (String lama vs Object baru)
        // Kalau masih string (misal dari data lama), kita ubah jadi object on-the-fly biar gak error
        let charName = typeof char === 'string' ? char : char.name;
        let charVisual = typeof char === 'string' ? "Standing pose" : char.visual;
        
        // CEK DATA GAMBAR (Persistence Logic)
        // Apakah karakter ini sudah punya properti 'generatedUrl'?
        // Kalau char masih string, pasti belum punya.
        let imgSource = "logo.png"; // Default
        let opacityClass = "opacity-20";
        
        if (typeof char === 'object' && char.generatedUrl) {
            imgSource = char.generatedUrl;
            opacityClass = "opacity-100"; // Kalau ada gambar, bikin terang
        }

        // Susun Prompt Awal
        const initialPrompt = `${stylePrompt}. Character design of ${charName}, ${charVisual}. Full body shot, neutral background.`;

        // Masukin HTML ke Grid
        const cardHtml = `
            <div class="glass-panel p-3 rounded-2xl group animate-fade-in">
                <!-- FRAME GAMBAR -->
                <div class="w-full ${ratioClass} bg-black/40 rounded-xl overflow-hidden mb-3 relative border border-white/5">
                    
                    <!-- Gambar (Source dinamis dari State) -->
                    <img id="char-img-${index}" src="${imgSource}" class="w-full h-full object-contain ${opacityClass} transition-all duration-500">
                    
                    <!-- Loader (Hidden by default) -->
                    <div id="loader-${index}" class="absolute inset-0 flex-col items-center justify-center hidden bg-black/80 z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-2"></i>
                        <span class="text-[10px] text-white">GENERATING...</span>
                    </div>

                    <!-- Tombol Action -->
                    <div class="absolute bottom-2 right-2 flex flex-col gap-2 z-30">
                        <button onclick="viewFullImage(${index})" class="bg-black/60 hover:bg-white hover:text-black p-2 rounded-lg border border-white/10" title="Lihat Full">
                            <i class="ph ph-magnifying-glass-plus"></i>
                        </button>
                        <button onclick="downloadImage(${index}, '${charName}')" class="bg-black/60 hover:bg-green-500 hover:text-white p-2 rounded-lg border border-white/10" title="Download">
                            <i class="ph ph-download-simple"></i>
                        </button>
                    </div>
                </div>

                <!-- INFO & KONTROL -->
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-white text-sm truncate w-24">${charName}</h4>
                        <button onclick="generateSingleChar(${index})" class="text-[10px] bg-accent hover:bg-white hover:text-accent text-white px-3 py-1 rounded-md font-bold transition-colors flex items-center gap-1">
                            <i class="ph ph-magic-wand"></i> BUAT
                        </button>
                    </div>
                    
                    <!-- Prompt Area (Textarea biasa biar gampang diedit) -->
                    <textarea id="prompt-input-${index}" class="w-full bg-black/30 text-[10px] text-gray-400 p-2 rounded border border-white/5 focus:border-accent focus:text-white h-16 resize-none transition-all">${initialPrompt}</textarea>
                </div>
            </div>
        `;
        charGrid.insertAdjacentHTML('beforeend', cardHtml);
    });

    // 3. FUNGSI GENERATE (Update State setelah berhasil)
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        // Ambil Resolusi dari Tab 2
        let w = 1024, h = 1024;
        if (selectedRatio === "16:9") { w = 1280; h = 720; }
        if (selectedRatio === "9:16") { w = 720; h = 1280; }

        // UI Loading
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        
        try {
            // Panggil API (Jalur VIP)
            const objectUrl = await fetchImageBlobAI(promptVal, w, h);
            
            // Tampilkan
            imgEl.src = objectUrl;
            imgEl.onload = () => {
                imgEl.classList.remove('opacity-20');
                imgEl.classList.add('opacity-100');
                loader.classList.add('hidden');
                loader.classList.remove('flex');

                // --- BAGIAN PENTING: UPDATE STATE BIAR GAK ILANG ---
                // Kita modifikasi array characters di index ke-i
                // Pastikan formatnya object
                if (typeof characters[index] !== 'object') {
                    characters[index] = { name: characters[index], visual: "", generatedUrl: objectUrl };
                } else {
                    characters[index].generatedUrl = objectUrl;
                }
                
                // Simpan perubahan ke Memory Utama (STATE)
                STATE.data.story.characters = characters;
                STATE.save(); // Simpan ke LocalStorage juga biar aman refresh
            };

        } catch (e) {
            console.error(e);
            alert("Gagal Generate: " + e.message);
            loader.classList.add('hidden');
            loader.classList.remove('flex');
        }
    };

    // Fungsi Full View (Simple Modal)
    window.viewFullImage = function(index) {
        const img = document.getElementById(`char-img-${index}`);
        if(img.src.includes('logo.png')) return;

        // Bikin modal container on the fly
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fade-in";
        
        // Atur CSS biar gambar gak gepeng di modal
        let imgStyle = "max-height: 90vh; max-width: 90vw; object-fit: contain;";
        
        modal.innerHTML = `
            <div class="relative">
                <img src="${img.src}" style="${imgStyle}" class="rounded-lg shadow-2xl border border-white/10">
                <button onclick="this.parentElement.parentElement.remove()" class="absolute -top-12 right-0 text-white p-2 bg-white/10 rounded-full hover:bg-red-500 transition-colors">
                    <i class="ph ph-x text-xl"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.downloadImage = function(index, name) {
        const img = document.getElementById(`char-img-${index}`);
        if(img.src.includes('logo.png')) return;
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `MrG_${name}.png`;
        a.click();
    };

    if(btnGenAll) {
        btnGenAll.onclick = () => {
            if(confirm("Generate Semua? (Jeda 5 Detik)")) {
                characters.forEach((_, idx) => setTimeout(() => generateSingleChar(idx), idx * 5000));
            }
        };
    }
};
