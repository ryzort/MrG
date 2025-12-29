// ==========================================
// GLOBAL SETTINGS (MODAL)
// ==========================================

// Fungsi dipanggil dari HTML (onclick)
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.toggle('hidden');
    } else {
        console.error("Modal Settings gak ketemu! Cek index.html lu bro.");
    }
}

function saveSettings() {
    const inputImgbb = document.getElementById('input-imgbb-key');
    const inputPolli = document.getElementById('input-polli-key');
    const alertDot = document.getElementById('settings-alert');
    const modal = document.getElementById('settings-modal');

    const imgbb = inputImgbb.value.trim();
    const polli = inputPolli.value.trim();

    if (!imgbb) {
        alert("ImgBB Key wajib diisi buat upload gambar nanti!");
        return;
    }

    localStorage.setItem('mrg_imgbb_key', imgbb);
    localStorage.setItem('mrg_polli_key', polli);
    
    if (alertDot) alertDot.classList.add('hidden');
    if (modal) modal.classList.add('hidden'); // Tutup modal
    
    alert("Mantap! API Key berhasil disimpan.");
    
    // Refresh halaman biar config ngebaca ulang
    setTimeout(() => location.reload(), 500); 
}

// Pas halaman siap, load isi inputan
document.addEventListener('DOMContentLoaded', () => {
    const inputImgbb = document.getElementById('input-imgbb-key');
    const inputPolli = document.getElementById('input-polli-key');
    const alertDot = document.getElementById('settings-alert');

    // Load data dari LocalStorage
    if (inputImgbb) inputImgbb.value = CONFIG.getImgBBKey();
    if (inputPolli) inputPolli.value = CONFIG.getPollinationsKey();
    
    // Cek dot merah
    if (!CONFIG.getImgBBKey() && alertDot) {
        alertDot.classList.remove('hidden');
    }
});


// ==========================================
// LOGIC TAB 1: STORY & EXTRACTION
// ==========================================

window.setupTab1 = function() {
    console.log("Setup Tab 1 dimulai..."); // Debug

    const storyInput = document.getElementById('story-input');
    const toggleBtn = document.getElementById('toggle-dialog');
    const toggleCircle = document.getElementById('toggle-circle');
    const dialogStatus = document.getElementById('dialog-status');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnNext = document.getElementById('btn-next-tab');
    const tagsContainer = document.getElementById('char-tags-container');
    const tagsList = document.getElementById('tags-list');

    // Cek elemen ada gak
    if (!toggleBtn || !storyInput) {
        console.error("Elemen Tab 1 belum ke-load sempurna.");
        return;
    }

    // 1. Load Data Lama
    const savedData = STATE.data.story;
    storyInput.value = savedData.text || "";
    
    let isDialogOn = savedData.useDialog;
    updateToggleUI(isDialogOn);

    if (savedData.characters.length > 0) {
        renderTags(savedData.characters);
        if(btnAnalyze) btnAnalyze.classList.add('hidden');
        if(btnNext) btnNext.classList.remove('hidden');
        if(tagsContainer) tagsContainer.classList.remove('hidden');
    }

    // 2. Logic Toggle
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

    // 3. Logic Tombol Generate
    if (btnAnalyze) {
    btnAnalyze.onclick = async () => {
        const text = storyInput.value.trim();
        if (!text) return alert("Isi cerita dulu!");

        STATE.updateStory(text, isDialogOn);
        
        // UI Loading
        const originalText = btnAnalyze.innerHTML;
        btnAnalyze.innerHTML = `<i class="ph ph-spinner animate-spin text-xl"></i> <span>Sedang Berpikir (Claude)...</span>`;
        btnAnalyze.disabled = true;

        try {
            // 1. Kalau user ngetik ide kasar, kita bikinin cerita dulu (Opsional, atau langsung extract)
            // Sesuai kode lu: User input ide -> AI bikin cerita -> AI extract karakter
            
            // Anggap input user itu udah cerita jadi (atau mau digenerate dlu? 
            // Kalau mau generate dlu kek app.js lu, pake logic ini:)
            /* 
               const storyResult = await generateStoryAI(text, isDialogOn); 
               storyInput.value = storyResult; // Update textarea dengan cerita full
               STATE.updateStory(storyResult, isDialogOn);
            */

            // 2. Extract Karakter (Pake logic lu yang solid)
            const characters = await extractCharactersAI(storyInput.value); // Pake text yg ada di input

            if (!characters || characters.length === 0) {
                alert("AI tidak menemukan karakter. Coba edit cerita manual.");
            } else {
                STATE.setCharactersList(characters);
                renderTags(characters);
                
                // Sukses
                btnAnalyze.classList.add('hidden');
                btnNext.classList.remove('hidden');
                tagsContainer.classList.remove('hidden');
            }

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btnAnalyze.innerHTML = originalText;
            btnAnalyze.disabled = false;
        }
    };
