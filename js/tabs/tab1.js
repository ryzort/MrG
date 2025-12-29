// ==========================================
// LOGIC KHUSUS TAB 1 (STORY CONCEPT)
// ==========================================

window.setupTab1 = function() {
    console.log("[Tab 1] Initializing...");

    const storyInput = document.getElementById('story-input');
    const finalStoryText = document.getElementById('final-story-text');
    const resultArea = document.getElementById('result-area');
    
    // Elemen Toggle
    const toggleBtn = document.getElementById('toggle-dialog');
    const toggleCircle = document.getElementById('toggle-circle');
    const dialogStatus = document.getElementById('dialog-status');
    
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnNext = document.getElementById('btn-next-tab');
    const tagsList = document.getElementById('tags-list');

    if (!storyInput) return;

    // 1. LOAD DATA LAMA & STATE AWAL
    const savedData = STATE.data.story;
    storyInput.value = savedData.text || "";
    
    // Pastikan defaultnya false kalo belum ada data
    let isDialogOn = savedData.useDialog === true; 
    
    // Set UI Awal (Jalanin fungsi update tampilan)
    updateToggleUI(isDialogOn);

    if (savedData.generatedText) {
        finalStoryText.innerText = savedData.generatedText;
        resultArea.classList.remove('hidden');
        btnAnalyze.classList.add('hidden');
        btnNext.classList.remove('hidden');
        renderTags(savedData.characters);
    }

    // 2. LOGIC TOGGLE (YANG DIPERBAIKI)
    if(toggleBtn) {
        // Hapus event listener lama (biar gak double) lalu pasang baru
        toggleBtn.onclick = null; 
        toggleBtn.onclick = () => {
            // Ubah Status True/False
            isDialogOn = !isDialogOn;
            console.log("Toggle clicked. Status:", isDialogOn);
            
            // Update Tampilan & Simpan ke Database
            updateToggleUI(isDialogOn);
            STATE.updateStory(storyInput.value, isDialogOn);
        };
    }

    // Fungsi Update Tampilan Toggle (Animasi)
    function updateToggleUI(isOn) {
        if(!toggleBtn || !toggleCircle || !dialogStatus) return;

        if (isOn) {
            // MODE ON: Warna Ungu, Geser Kanan
            toggleBtn.classList.remove('bg-gray-600');
            toggleBtn.classList.add('bg-accent');
            
            // Geser lingkaran 20px ke kanan
            toggleCircle.style.transform = "translateX(20px)";
            
            dialogStatus.innerText = "ON";
            dialogStatus.style.color = "#6366f1"; // Ungu Neon
        } else {
            // MODE OFF: Warna Abu, Geser Kiri (Posisi Awal)
            toggleBtn.classList.remove('bg-accent');
            toggleBtn.classList.add('bg-gray-600');
            
            // Balikin lingkaran ke 0px
            toggleCircle.style.transform = "translateX(0px)";
            
            dialogStatus.innerText = "OFF";
            dialogStatus.style.color = "#9ca3af"; // Abu-abu
        }
    }

    // 3. LOGIC GENERATE (SAMA KAYAK SEBELUMNYA)
    if (btnAnalyze) {
        btnAnalyze.onclick = async () => {
            const concept = storyInput.value.trim();
            if (!concept) return alert("Isi konsep cerita dulu bro!");

            // Simpan state dialog terakhir sebelum kirim
            STATE.updateStory(concept, isDialogOn);

            const originalText = btnAnalyze.innerHTML;
            btnAnalyze.innerHTML = `<i class="ph ph-spinner animate-spin text-xl"></i> <span>Menulis Cerita (Claude)...</span>`;
            btnAnalyze.disabled = true;

            try {
                // TAHAP 1: Generate Cerita
                const fullStory = await generateStoryAI(concept, isDialogOn);
                
                finalStoryText.innerText = fullStory;
                resultArea.classList.remove('hidden');
                
                btnAnalyze.innerHTML = `<i class="ph ph-spinner animate-spin text-xl"></i> <span>Mendeteksi Karakter...</span>`;

                // TAHAP 2: Extract Karakter
                const characters = await extractCharactersAI(fullStory);

                if (!characters || characters.length === 0) {
                    alert("Cerita jadi, tapi karakter tidak terdeteksi.");
                } else {
                    renderTags(characters);
                }

                // SIMPAN SEMUA
                STATE.data.story.text = concept;
                STATE.data.story.generatedText = fullStory;
                STATE.data.story.characters = characters;
                STATE.data.story.useDialog = isDialogOn; // Pastikan kesimpen
                STATE.save();

                btnAnalyze.classList.add('hidden');
                btnNext.classList.remove('hidden');

            } catch (err) {
                console.error(err);
                alert("Error: " + err.message);
                btnAnalyze.innerHTML = originalText;
                btnAnalyze.disabled = false;
            }
        };
    }

    function renderTags(characters) {
        tagsList.innerHTML = "";
        characters.forEach(char => {
            const name = typeof char === 'string' ? char : char.name;
            const desc = typeof char === 'string' ? '' : char.visual;
            
            const tag = document.createElement('div');
            tag.className = "bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-fade-in group relative cursor-help";
            tag.innerHTML = `<i class="ph ph-user"></i> ${name}`;
            if(desc) tag.title = desc;
            tagsList.appendChild(tag);
        });
    }

    window.copyStory = function() {
        navigator.clipboard.writeText(finalStoryText.innerText);
        alert("Cerita berhasil disalin!");
    }
};
