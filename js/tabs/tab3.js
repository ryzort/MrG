// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing...");
    
    const charGrid = document.getElementById('char-grid');
    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "Cinematic lighting, detailed texture, 8k resolution";
    
    // Kalau belum ada karakter dari Tab 1
    if (characters.length === 0) return;

    // Render Container Kartu (Masih Kosong Gambarnya)
    renderCharPlaceholders();

    function renderCharPlaceholders() {
        charGrid.innerHTML = "";
        characters.forEach((name, index) => {
            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-xl hover:border-accent/50 transition-all group relative";
            card.innerHTML = `
                <div class="aspect-square bg-black/50 rounded-lg overflow-hidden mb-3 relative border border-white/5">
                    <img id="char-img-${index}" src="https://via.placeholder.com/500x500/111/333?text=Ready" class="w-full h-full object-cover opacity-50 transition-opacity duration-500">
                    <div id="loader-${index}" class="absolute inset-0 flex items-center justify-center hidden">
                        <i class="ph ph-spinner animate-spin text-accent text-2xl"></i>
                    </div>
                    <button onclick="generateSingleChar(${index})" class="absolute bottom-2 right-2 bg-black/60 hover:bg-accent text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/10 z-10">
                        <i class="ph ph-arrows-clockwise"></i>
                    </button>
                </div>
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-white text-sm">${name}</h4>
                        <p class="text-[10px] text-gray-400">Prompt: ${stylePrompt.substring(0, 20)}...</p>
                    </div>
                    <button class="text-gray-500 hover:text-white"><i class="ph ph-pencil-simple"></i></button>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // Fungsi Generate 1 Karakter
    window.generateSingleChar = async function(index) {
        const name = characters[index];
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        
        // UI Loading
        imgEl.style.opacity = "0.3";
        loader.classList.remove('hidden');

        // Bikin Prompt Gabungan
        const fullPrompt = `${stylePrompt}. Character sheet of ${name}, full body, standing, neutral background. High quality.`;
        
        try {
            // Pake fungsi generateImageURL dari api.js (Logic lu)
            // Ini otomatis cek Toggle Quality (Pro/Std) dari STATE
            const url = generateImageURL(fullPrompt);
            
            // Hack biar gambar reload (tambah timestamp)
            const finalUrl = url + "&t=" + new Date().getTime();

            // Load Gambar
            const newImg = new Image();
            newImg.src = finalUrl;
            newImg.onload = () => {
                imgEl.src = finalUrl;
                imgEl.style.opacity = "1";
                loader.classList.add('hidden');
            };
        } catch (e) {
            console.error(e);
            alert("Gagal generate gambar");
            loader.classList.add('hidden');
        }
    };

    // Fungsi Generate Semua Sekaligus
    window.generateAllCharacters = function() {
        characters.forEach((_, index) => {
            setTimeout(() => {
                generateSingleChar(index);
            }, index * 1500); // Kasih jeda biar gak spam API
        });
    };
};
