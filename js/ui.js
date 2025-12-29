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
