// ==========================================
// LOGIC KHUSUS TAB 3 (CHARACTERS)
// ==========================================

window.setupTab3 = function() {
    console.log("[Tab 3] Initializing...");
    
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-gen-all-chars');

    // 1. AMBIL DATA DARI STATE (TAB 1 & 2)
    const characters = STATE.data.story.characters || [];
    const stylePrompt = STATE.data.style.artPrompt || "High quality, detailed character sheet";
    const selectedRatio = STATE.data.style.ratio || "1:1";
    const storyContext = STATE.data.story.text || ""; // Buat referensi prompt

    // Cek Konsistensi Data
    console.log("Data Tab 3:", { characters, stylePrompt, selectedRatio });

    // Kalau gak ada karakter, tampilin pesan kosong
    if (characters.length === 0) {
        if(charGrid) {
            charGrid.innerHTML = `
                <div class="col-span-full text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <i class="ph ph-ghost text-4xl text-gray-600 mb-2"></i>
                    <p class="text-sm text-gray-400">Belum ada karakter terdeteksi.<br>Ke Tab 1 dulu bro, generate cerita & karakternya.</p>
                </div>`;
        }
        return;
    }

    // 2. RENDER KARTU (PLACEHOLDERS)
    renderCards();

    function renderCards() {
        charGrid.innerHTML = "";
        
        // Tentukan CSS Class berdasarkan Rasio yang dipilih di Tab 2
        let ratioClass = "aspect-square"; // Default 1:1
        if (selectedRatio === "16:9") ratioClass = "aspect-video"; 
        if (selectedRatio === "9:16") ratioClass = "aspect-[9/16]"; // Tailwind arbitrary value

        characters.forEach((name, index) => {
            // Logic Prompt Otomatis: Style + Nama + Konteks
            // Default prompt awal sebelum diedit user
            const initialPrompt = `${stylePrompt}. Character sheet of ${name}, full body shot, standing pose, neutral background. Based on story context: ${storyContext.substring(0, 100)}...`;

            const card = document.createElement('div');
            card.className = "glass-panel p-3 rounded-xl hover:border-accent/50 transition-all group relative animate-fade-in";
            
            // HTML Kartu
            card.innerHTML = `
                <!-- AREA GAMBAR (Sesuai Rasio) -->
                <div class="w-full ${ratioClass} bg-black/50 rounded-lg overflow-hidden mb-3 relative border border-white/5 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">
                    
                    <!-- Gambar Hasil -->
                    <img id="char-img-${index}" src="logo.png" class="w-full h-full object-cover opacity-20 transition-opacity duration-500">
                    
                    <!-- Loader -->
                    <div id="loader-${index}" class="absolute inset-0 flex flex-col items-center justify-center hidden bg-black/60 backdrop-blur-sm z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-2"></i>
                        <span class="text-[10px] text-white font-bold">Generating...</span>
                    </div>

                    <!-- Tombol Generate (Overlay) -->
                    <button onclick="generateSingleChar(${index})" class="absolute bottom-3 right-3 bg-accent hover:bg-white hover:text-accent text-white p-3 rounded-full shadow-lg transition-all z-10 group-hover:scale-110 active:scale-95" title="Generate Gambar">
                        <i class="ph ph-magic-wand text-lg"></i>
                    </button>
                </div>

                <!-- INFO KARAKTER -->
                <div class="flex justify-between items-start gap-2">
                    <div class="flex-1">
                        <h4 class="font-bold text-white text-sm flex items-center gap-2">
                            ${name}
                        </h4>
                        <!-- Prompt Hidden Input (Bisa diedit) -->
                        <textarea id="prompt-input-${index}" class="hidden w-full bg-black/50 text-[10px] text-gray-300 p-2 rounded mt-2 border border-accent/30 focus:outline-none" rows="3">${initialPrompt}</textarea>
                        
                        <p id="prompt-preview-${index}" class="text-[10px] text-gray-500 line-clamp-1 mt-0.5 cursor-pointer hover:text-accent transition-colors" onclick="toggleEditPrompt(${index})" title="Klik untuk edit prompt">
                            <i class="ph ph-pencil-simple text-xs mr-1"></i> ${initialPrompt}
                        </button>
                    </div>
                </div>
            `;
            charGrid.appendChild(card);
        });
    }

    // 3. FITUR EDIT PROMPT
    window.toggleEditPrompt = function(index) {
        const input = document.getElementById(`prompt-input-${index}`);
        const preview = document.getElementById(`prompt-preview-${index}`);
        
        if (input.classList.contains('hidden')) {
            input.classList.remove('hidden'); // Munculin kotak edit
            preview.classList.add('hidden');  // Sembunyiin preview
            input.focus();
        } else {
            input.classList.add('hidden');
            preview.classList.remove('hidden');
            preview.innerHTML = `<i class="ph ph-pencil-simple text-xs mr-1"></i> ${input.value}`; // Update preview
        }
    };

    // 4. GENERATE SATU GAMBAR
    window.generateSingleChar = async function(index) {
        const imgEl = document.getElementById(`char-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);
        const promptVal = document.getElementById(`prompt-input-${index}`).value;
        
        // UI Loading
        loader.classList.remove('hidden');

        try {
            console.log(`Generating Char ${index}:`, promptVal);
            
            // Panggil fungsi URL Builder dari api.js (Otomatis cek Pro/Std quality)
            const url = generateImageURL(promptVal);
            
            // Preload Image biar mulus
            const newImg = new Image();
            newImg.src = url;
            newImg.onload = () => {
                imgEl.src = url;
                imgEl.style.opacity = "1";
                loader.classList.add('hidden');
            };
            newImg.onerror = () => {
                throw new Error("Gagal load gambar dari server AI");
            }

        } catch (e) {
            console.error(e);
            alert("Gagal generate: " + e.message);
            loader.classList.add('hidden');
        }
    };

    // 5. GENERATE ALL (Antrian biar gak error Rate Limit)
    if(btnGenAll) {
        btnGenAll.onclick = function() {
            if(!confirm("Generate semua karakter sekaligus? Ini akan memakan waktu.")) return;
            
            characters.forEach((_, index) => {
                // Kasih jeda 3 detik per karakter biar API gak ngamuk
                setTimeout(() => {
                    generateSingleChar(index);
                }, index * 3000); 
            });
        };
    }
};
