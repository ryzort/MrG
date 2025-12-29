// Variable Global buat Tab Aktif
let currentTab = 1;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Tab Pertama pas dibuka
    loadTab(1);

    // 2. Cek Koneksi API (Opsional, buat debug)
    console.log("MrG System Ready. Config status:", CONFIG.isConfigured());
});

// Fungsi Pindah Tab
async function switchTab(tabId) {
    // Update tombol aktif di navigasi
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-tab-${tabId}`).classList.add('active');

    // Load isi kontennya
    await loadTab(tabId);
    currentTab = tabId;
}

// Fungsi Load HTML dari folder components
async function loadTab(tabId) {
    const contentDiv = document.getElementById('app-content');
    const fileMap = {
        1: 'components/tab1-story.html',
        2: 'components/tab2-style.html',
        3: 'components/tab3-chars.html',
        4: 'components/tab4-scenes.html',
        5: 'components/tab5-video.html'
    };

    // Efek Loading Transisi
    contentDiv.style.opacity = '0';
    
    setTimeout(async () => {
        try {
            const response = await fetch(fileMap[tabId]);
            if (!response.ok) throw new Error("Gagal load component");
            
            const html = await response.text();
            contentDiv.innerHTML = html;
            
            // Re-Initialize Logic khusus per Tab (Nanti kita isi logicnya disini)
            if(tabId === 1) initTab1();
            if(tabId === 2) initTab2(); // Nanti dibuat
            // dst...

        } catch (err) {
            contentDiv.innerHTML = `<div class="text-red-500 text-center mt-10">Gagal memuat Tab ${tabId}. <br> Pastikan file ${fileMap[tabId]} sudah dibuat di folder components/</div>`;
        }
        
        // Munculin pelan-pelan (Fade In)
        contentDiv.style.opacity = '1';
    }, 200);
}

// --- Placeholder Logic Init (Biar gak error dlu) ---
function initTab1() {
    console.log("Tab 1 Loaded");
    // Logic Tab 1 bakal kita tulis di script terpisah atau di ui.js nanti
    if(window.setupTab1) window.setupTab1();
}
function initTab2() {}
