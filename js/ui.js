// ==========================================
// GLOBAL UI: SETTINGS & MODAL ONLY
// ==========================================

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.toggle('hidden');
}

function saveSettings() {
    const imgbb = document.getElementById('input-imgbb-key').value.trim();
    const polli = document.getElementById('input-polli-key').value.trim();

    if (!imgbb) {
        alert("ImgBB Key wajib diisi bro!");
        return;
    }

    localStorage.setItem('mrg_imgbb_key', imgbb);
    localStorage.setItem('mrg_polli_key', polli);
    
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('settings-alert').classList.add('hidden');
    
    alert("Mantap! API Key Tersimpan.");
    setTimeout(() => location.reload(), 500); 
}

// --- FUNGSI RESET BARU ---
function resetProject() {
    if (confirm("Yakin mau HAPUS DATA & Mulai Baru?\n(Cerita & Gambar akan hilang, API Key tetap aman)")) {
        // Ambil key dulu biar gak ilang
        const k1 = localStorage.getItem('mrg_imgbb_key');
        const k2 = localStorage.getItem('mrg_polli_key');
        
        // Hapus SEMUA
        localStorage.clear();
        
        // Balikin Key
        if(k1) localStorage.setItem('mrg_imgbb_key', k1);
        if(k2) localStorage.setItem('mrg_polli_key', k2);
        
        alert("Data Project berhasil di-reset!");
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('input-imgbb-key')) {
        document.getElementById('input-imgbb-key').value = CONFIG.getImgBBKey();
        document.getElementById('input-polli-key').value = CONFIG.getPollinationsKey();
    }
    if (!CONFIG.getImgBBKey() && document.getElementById('settings-alert')) {
        document.getElementById('settings-alert').classList.remove('hidden');
    }
});
