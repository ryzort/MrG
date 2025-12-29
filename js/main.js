let currentTab = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadTab(1); // Load Tab 1 pas web dibuka
});

async function switchTab(tabId) {
    // 1. Update Tampilan Tombol Navigasi (Biar nyala yang aktif)
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

    // Efek Fade Out (Hilang pelan-pelan)
    contentDiv.style.opacity = '0';
    
    setTimeout(async () => {
        try {
            // Ambil file HTML dari folder components
            const response = await fetch(fileMap[tabId]);
            if (!response.ok) throw new Error("Gagal load component");
            
            const html = await response.text();
            contentDiv.innerHTML = html;
            
            // --- BAGIAN PENTING: JALANIN OTAKNYA (JS) ---
            setTimeout(() => {
                // Kalau buka Tab 1, panggil logic Tab 1
                if (tabId === 1 && window.setupTab1) window.setupTab1();
                
                // Kalau buka Tab 2, panggil logic Tab 2
                if (tabId === 2 && window.setupTab2) window.setupTab2();
                
                // Kalau buka Tab 3, panggil logic Tab 3 (INI YG KITA AKTIFIN)
                if (tabId === 3 && window.setupTab3) window.setupTab3(); 
                
                // Nanti Tab 4 & 5 kita tambahin di sini kalau filenya udah ada
            }, 50);

        } catch (err) {
            console.error(err);
            contentDiv.innerHTML = `
                <div class="text-center text-red-500 py-10 border border-red-500/20 bg-red-500/10 rounded-xl m-4">
                    <p class="font-bold">Error: Gagal memuat ${fileMap[tabId]}</p>
                    <p class="text-sm opacity-70">Pastikan file sudah dibuat di folder components/</p>
                </div>`;
        }
        
        // Efek Fade In (Muncul pelan-pelan)
        contentDiv.style.opacity = '1';
    }, 200);
                    }
