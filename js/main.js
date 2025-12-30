let currentTab = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadTab(1); // Load Tab 1 pas web dibuka
});

async function switchTab(tabId) {
    // 1. Update Tampilan Tombol Navigasi
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-tab-${tabId}`);
    if(activeBtn) activeBtn.classList.add('active');

    // 2. Load Isi Kontennya
    await loadTab(tabId);
    currentTab = tabId;
}

async function loadTab(tabId) {
    const contentDiv = document.getElementById('app-content');
    
    // Daftar File HTML per Tab
    const fileMap = {
        1: 'components/tab1-story.html',
        2: 'components/tab2-style.html',
        3: 'components/tab3-chars.html',
        4: 'components/tab4-scenes.html',
        5: 'components/tab5-video.html'
    };

    // Efek Fade Out
    contentDiv.style.opacity = '0';
    
    setTimeout(async () => {
        try {
            // Ambil file HTML dari folder components
            const response = await fetch(fileMap[tabId]);
            if (!response.ok) throw new Error("Gagal load component");
            
            const html = await response.text();
            contentDiv.innerHTML = html;
            
            // --- BAGIAN PENTING: JALANIN OTAKNYA (JS) ---
            // Kita kasih waktu 100ms biar HTML nempel dulu baru JS jalan
            setTimeout(() => {
                if (tabId === 1 && window.setupTab1) window.setupTab1();
                if (tabId === 2 && window.setupTab2) window.setupTab2();
                if (tabId === 3 && window.setupTab3) window.setupTab3(); // INI UDAH AKTIF
                if (tabId === 4 && window.setupTab4) window.setupTab4();
                if (tabId === 5 && window.setupTab5) window.setupTab5();
                // Nanti Tab 4 & 5 ditambahin di sini
            }, 100); 

        } catch (err) {
            console.error(err);
            contentDiv.innerHTML = `
                <div class="text-center text-red-500 py-10 border border-red-500/20 bg-red-500/10 rounded-xl m-4">
                    <p class="font-bold">Error: Gagal memuat ${fileMap[tabId]}</p>
                    <p class="text-sm opacity-70">Pastikan file sudah dibuat di folder components/</p>
                </div>`;
        }
        
        // Efek Fade In
        contentDiv.style.opacity = '1';
    }, 200);
}
