// ==========================================
// LOGIC KHUSUS TAB 1 (STORY CONCEPT)
// ==========================================

window.setupTab1 = function() {
    console.log("[Tab 1] Initializing...");

    const storyInput = document.getElementById('story-input');
    const finalStoryText = document.getElementById('final-story-text');
    const resultArea = document.getElementById('result-area');
    const toggleBtn = document.getElementById('toggle-dialog');
    const toggleCircle = document.getElementById('toggle-circle');
    const dialogStatus = document.getElementById('dialog-status');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnNext = document.getElementById('btn-next-tab');
    const tagsList = document.getElementById('tags-list');

    if (!storyInput) return;

    // 1. Load Data Lama
    const savedData = STATE.data.story;
    storyInput.value = savedData.text || ""; // Input kasar
    let isDialogOn = savedData.useDialog;
    
    // Kalau udah pernah generate, tampilin hasilnya
    if (savedData.generatedText) {
        finalStoryText.innerText = savedData.generatedText;
        resultArea.classList.remove('hidden');
        btnAnalyze.classList.add('hidden');
        btnNext.classList.remove('hidden');
        renderTags(savedData.characters);
    }
    
    updateToggleUI(isDialogOn);

    // 2. Toggle Logic
    if(toggleBtn) {
        toggleBtn.onclick = () => {
            isDialogOn = !isDialogOn;
            updateToggleUI(isDialogOn);
            STATE.updateStory(storyInput.value, isDialogOn); // Simpan
        };
    }

    function updateToggleUI(isOn) {
        if (isOn) {
            toggleBtn.classList.replace('bg-gray-600', 'bg-accent');
            toggleCircle.style.transform = "translateX(24px)";
            dialogStatus.innerText = "ON";
            dialogStatus.style.color = "#6366f1";
        } else {
            toggleBtn.classList.replace('bg-accent', 'bg-gray-600');
            toggleCircle.style.transform = "translateX(0px)";
            dialogStatus.innerText = "OFF";
            dialogStatus.style.color = "#9ca3af";
        }
    }

    // 3. LOGIC GENERATE (THE FIX)
    if (btnAnalyze) {
        btnAnalyze.onclick = async () => {
            const concept = storyInput.value.trim();
            if (!concept) return alert("Isi konsep cerita dulu bro!");

            // UI Loading
            const originalText = btnAnalyze.innerHTML;
            btnAnalyze.innerHTML = `<i class="ph ph-spinner animate-spin text-xl"></i> <span>Menulis Cerita (Claude)...</span>`;
            btnAnalyze.disabled = true;

            try {
                // TAHAP 1: Generate Cerita Lengkap
                const fullStory = await generateStoryAI(concept, isDialogOn);
                
                // Tampilkan Hasil
                finalStoryText.innerText = fullStory;
                resultArea.classList.remove('hidden');
                
                // Update tombol loading
                btnAnalyze.innerHTML = `<i class="ph ph-spinner animate-spin text-xl"></i> <span>Mendeteksi Karakter...</span>`;

                // TAHAP 2: Extract Karakter dari Cerita Lengkap (Bukan Konsep)
                const characters = await extractCharactersAI(fullStory);

                if (!characters || characters.length === 0) {
                    alert("Cerita jadi, tapi AI gagal nemu karakter.");
                } else {
                    renderTags(characters);
                }

                // SIMPAN KE DATABASE
                STATE.data.story.text = concept;
                STATE.data.story.generatedText = fullStory; // Simpan cerita jadi
                STATE.data.story.characters = characters;
                STATE.save();

                // Final UI Update
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
            // Handle kalau data lama masih String, atau data baru Object
            const name = typeof char === 'string' ? char : char.name;
            const desc = typeof char === 'string' ? '' : char.visual;
            
            const tag = document.createElement('div');
            tag.className = "bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-fade-in group relative cursor-help";
            tag.innerHTML = `<i class="ph ph-user"></i> ${name}`;
            
            // Tooltip deskripsi fisik pas di-hover
            if(desc) {
                tag.title = desc; // Simpel tooltip
            }
            
            tagsList.appendChild(tag);
        });
    }
