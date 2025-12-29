function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.toggle('hidden');
}

function saveSettings() {
    const imgbb = document.getElementById('input-imgbb-key').value.trim();
    const polli = document.getElementById('input-polli-key').value.trim();

    if (!imgbb) return alert("ImgBB Key wajib diisi!");

    localStorage.setItem('mrg_imgbb_key', imgbb);
    localStorage.setItem('mrg_polli_key', polli);
    
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('settings-alert').classList.add('hidden');
    
    alert("API Key Berhasil Disimpan!");
    setTimeout(() => location.reload(), 500); 
}

// Load status saat awal
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('input-imgbb-key')) {
        document.getElementById('input-imgbb-key').value = CONFIG.getImgBBKey();
        document.getElementById('input-polli-key').value = CONFIG.getPollinationsKey();
    }
    if (!CONFIG.getImgBBKey() && document.getElementById('settings-alert')) {
        document.getElementById('settings-alert').classList.remove('hidden');
    }
});
