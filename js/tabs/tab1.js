// ==========================================
// LOGIC KHUSUS TAB 1 (STORY CONCEPT)
// ==========================================

window.setupTab1 = function() {
    console.log("[Tab 1] Initializing...");

    // Ambil elemen DOM
    const storyInput = document.getElementById('story-input');
    const toggleBtn = document.getElementById('toggle-dialog');
    const toggleCircle = document.getElementById('toggle-circle');
    const dialogStatus = document.getElementById('dialog-status');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnNext = document.getElementById('btn-next-tab');
    const tagsContainer = document.getElementById('char-tags-container');
    const tagsList = document.getElementById('tags-list');

    // Safety Check: Kalau elemen gak ada, stop biar gak error console
    if (!storyInput) return;

    // --- 1. LOAD DATA LAMA (State Management) ---
    const savedData = STATE.data.story;
    storyInput.value = savedData.text || "";
    let isDialogOn = savedData.useDialog;
    
    // Set UI awal sesuai data simpanan
    updateToggleUI(isDialogOn);

    if (savedData.characters && savedData.characters.length > 0) {
        renderTags(savedData.characters);
        if(btnAnalyze) btnAnalyze.classList.add('hidden');
        if(btnNext) btnNext.classList.remove('hidden');
        if(tagsContainer) tagsContainer.classList.remove('hidden');
    }

    // --- 2. LOGIC TOGGLE DIALOG ---
    if(toggleBtn) {
        toggleBtn.onclick = () => {
            isDialogOn = !isDialogOn;
            updateToggleUI(isDialogOn);
            STATE.updateStory(storyInput.value, isDialogOn);
        };
    }

    function updateToggleUI(isOn) {
        if (isOn) {
            toggleBtn.classList.replace('bg-gray-600', 'bg-accent'); // Ungu
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

    // --- 3. LOGIC TOMBOL ANALISA (THE BRAIN) ---
    if (btnAnalyze) {
        btnAnalyze.onclick = async () => {
            const text = storyInput.value.trim();
            if (!text) return alert("Bro, tulis dulu ceritanya!");

            // Simpan state dulu
            STATE.updateStory(text, isDialogOn);
            
            // Efek Loading Keren
            const originalText = btnAnalyze.innerHTML;
            btnAnalyze.innerHTML = `<i class="ph ph-spinner animate-spin text-xl"></i> <span>Sedang Membaca Cerita...</span>`;
            btnAnalyze.disabled = true;
            btnAnalyze.classList.remove('btn-neon'); // Hilangin glow sementara
            btnAnalyze.style.opacity = "0.7";

            try {
                // Panggil Fungsi Canggih dari api.js (Logic Lu)
                // Kita panggil extractCharactersAI yg pake OpenAI + JSON Cleaner
                const characters = await extractCharactersAI(text);

                if (!characters || characters.length === 0) {
                    alert("AI bingung bro. Gak nemu nama karakter. Coba sebut nama tokohnya lebih jelas.");
                } else {
                    STATE.setCharactersList(characters);
                    renderTags(characters);
                    
                    // Sukses: Ganti tombol
                    btnAnalyze.classList.add('hidden');
                    btnNext.classList.remove('hidden');
                    tagsContainer.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
                alert("Gagal Analisa: " + err.message);
            } finally {
                // Balikin tombol ke asal (kalo gagal)
                if(!btnAnalyze.classList.contains('hidden')) {
                    btnAnalyze.innerHTML = originalText;
                    btnAnalyze.disabled = false;
                    btnAnalyze.classList.add('btn-neon');
                    btnAnalyze.style.opacity = "1";
                }
            }
        };
    }

    // Helper: Render Tag Warna-Warni
    function renderTags(names) {
        tagsList.innerHTML = "";
        names.forEach(name => {
            const tag = document.createElement('div');
            // Style tag pake class Tailwind + Custom CSS
            tag.className = "bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-fade-in hover:bg-accent/20 transition-colors cursor-default";
            tag.innerHTML = `<i class="ph ph-user-circle text-lg"></i> ${name}`;
            tagsList.appendChild(tag);
        });
    }
};
