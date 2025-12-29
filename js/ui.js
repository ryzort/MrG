// MODAL & SETTINGS LOGIC
const modal = document.getElementById('settings-modal');
const alertDot = document.getElementById('settings-alert');
const inputImgbb = document.getElementById('input-imgbb-key');
const inputPolli = document.getElementById('input-polli-key');

// Load saved keys pas web dibuka
document.addEventListener('DOMContentLoaded', () => {
    inputImgbb.value = CONFIG.getImgBBKey();
    inputPolli.value = CONFIG.getPollinationsKey();
    
    // Cek kalo kosong kasih peringatan merah
    if (!CONFIG.getImgBBKey()) {
        alertDot.classList.remove('hidden');
    }
});

function toggleSettings() {
    modal.classList.toggle('hidden');
}

function saveSettings() {
    const imgbb = inputImgbb.value.trim();
    const polli = inputPolli.value.trim();

    if (!imgbb) {
        alert("ImgBB Key wajib diisi bro buat upload gambar!");
        return;
    }

    localStorage.setItem('mrg_imgbb_key', imgbb);
    localStorage.setItem('mrg_polli_key', polli);
    
    alertDot.classList.add('hidden');
    toggleSettings();
    alert("Mantap! API Key berhasil disimpan.");
    
    // Refresh halaman biar config ngebaca ulang (opsional)
    // location.reload(); 
    }

// ==========================================
// LOGIC TAB 1: STORY & EXTRACTION
// ==========================================

window.setupTab1 = function() {
    const storyInput = document.getElementById('story-input');
    const toggleBtn = document.getElementById('toggle-dialog');
    const toggleCircle = document.getElementById('toggle-circle');
    const dialogStatus = document.getElementById('dialog-status');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnNext = document.getElementById('btn-next-tab');
    const tagsContainer = document.getElementById('char-tags-container');
    const tagsList = document.getElementById('tags-list');

    // 1. Load Data Lama (Kalau user balik dari tab lain)
    const savedData = STATE.data.story;
    storyInput.value = savedData.text || "";
    
    // Set status toggle sesuai data simpanan
    let isDialogOn = savedData.useDialog;
    updateToggleUI(isDialogOn);

    // Kalau karakter udah ada sebelumnya, tampilin
    if (savedData.characters.length > 0) {
        renderTags(savedData.characters);
        btnAnalyze.classList.add('hidden'); // Sembunyiin tombol generate
        btnNext.classList.remove('hidden'); // Munculin tombol next
        tagsContainer.classList.remove('hidden');
    }

    // 2. Event Listener: Toggle Dialog
    toggleBtn.onclick = () => {
        isDialogOn = !isDialogOn;
        updateToggleUI(isDialogOn);
        STATE.updateStory(storyInput.value, isDialogOn);
    };

    function updateToggleUI(isOn) {
        if (isOn) {
            toggleBtn.classList.replace('bg-gray-600', 'bg-accent');
            toggleCircle.classList.replace('left-1', 'left-7');
            dialogStatus.innerText = "ON";
            dialogStatus.classList.replace('text-gray-400', 'text-accent');
        } else {
            toggleBtn.classList.replace('bg-accent', 'bg-gray-600');
            toggleCircle.classList.replace('left-7', 'left-1');
            dialogStatus.innerText = "OFF";
            dialogStatus.classList.replace('text-accent', 'text-gray-400');
        }
    }

    // 3. Event Listener: Tombol Analisa (Generate)
    btnAnalyze.onclick = async () => {
        const text = storyInput.value.trim();
        if (!text) {
            alert("Tulis dulu ceritanya bro!");
            return;
        }

        // Simpan inputan dulu
        STATE.updateStory(text, isDialogOn);

        // UI Loading effect
        const originalText = btnAnalyze.innerHTML;
        btnAnalyze.innerHTML = `<i class="ph ph-spinner animate-spin text-xl"></i> <span>Membaca Cerita...</span>`;
        btnAnalyze.disabled = true;

        try {
            // PROMPT KHUSUS BUAT NERJEMAHIN CERITA JADI LIST NAMA
            const promptMessages = [
                {
                    role: "system",
                    content: "You are an assistant that extracts character names from a story. Output ONLY a JSON array of strings. Example: [\"Jono\", \"Joni\", \"Robot A\"]. If no names found, return []."
                },
                {
                    role: "user",
                    content: `Extract all character names from this story:\n\n${text}`
                }
            ];

            // Panggil API (Logic ada di api.js)
            const resultRaw = await generateText(promptMessages, 'json'); 
            
            // Parsing hasil JSON dari AI
            let characters = [];
            try {
                // Bersihin format markdown ```json ... ``` kalau ada
                const cleanJson = resultRaw.replace(/```json|```/g, '').trim();
                characters = JSON.parse(cleanJson);
            } catch (e) {
                console.warn("Gagal parse JSON, coba manual split", resultRaw);
                // Fallback kalau AI bego dikit: coba split koma
                characters = resultRaw.split(',').map(s => s.trim());
            }

            if (characters.length === 0) {
                alert("AI gak nemu nama karakter bro. Coba sebutin nama tokohnya di cerita.");
                btnAnalyze.innerHTML = originalText;
                btnAnalyze.disabled = false;
                return;
            }

            // Sukses! Simpan ke STATE & Render
            STATE.setCharactersList(characters);
            renderTags(characters);

            // Ganti tombol jadi Next
            btnAnalyze.classList.add('hidden');
            btnNext.classList.remove('hidden');
            tagsContainer.classList.remove('hidden');

        } catch (err) {
            alert("Gagal analisa cerita: " + err.message);
            btnAnalyze.innerHTML = originalText;
            btnAnalyze.disabled = false;
        }
    };

    // Helper: Bikin tampilan Tag
    function renderTags(names) {
        tagsList.innerHTML = "";
        names.forEach(name => {
            const tag = document.createElement('div');
            tag.className = "bg-accent/20 text-accent border border-accent/30 px-3 py-1 rounded-full text-sm font-medium animate-fade-in flex items-center gap-2";
            tag.innerHTML = `<i class="ph ph-user"></i> ${name}`;
            tagsList.appendChild(tag);
        });
    }
};
