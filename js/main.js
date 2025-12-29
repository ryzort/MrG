// Variable Global
let currentTab = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Load Tab 1 pas pertama buka
    loadTab(1);
    
    // Cek console buat debug
    console.log("System Ready. Config loaded.");
});

async function switchTab(tabId) {
    // Update tombol navigasi visual
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btn-tab-${tabId}`);
    if(activeBtn) activeBtn.classList.add('active');

    // Load konten tab
    await loadTab(tabId);
    currentTab = tabId;
}

async function loadTab(tabId) {
    const contentDiv = document.getElementById('app-content');
    
    // Mapping file HTML
    const fileMap = {
        1: 'components/tab1-story.html',
        2: 'components/tab2-style.html',
        3: 'components/tab3-chars.html',
        4: 'components/tab4-scenes.html',
        5: 'components/tab5-video.html'
    };

    // Efek Loading
    contentDiv.style.opacity = '0';
    
    setTimeout(async () => {
        try {
            const response = await fetch(fileMap[tabId]);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            
            const html = await response.text();
            contentDiv.innerHTML = html;
            
            // --- BAGIAN PENTING: JALANIN LOGIC SETELAH HTML MUNCUL ---
            // Kita kasih delay super dikit (10ms) biar DOM render dulu
            setTimeout(() => {
                if (tabId === 1 && window.setupTab1) window.setupTab1();
                if (tabId === 2 && window.setupTab2) window.setupTab2(); 
                // dst untuk tab lain nanti
            }, 10);

        } catch (err) {
            console.error(err);
            contentDiv.innerHTML = `<div class="text-red-500 text-center mt-10 p-4 border border-red-500 rounded">
                Gagal memuat Tab ${tabId}.<br>
                Pastikan file <b>${fileMap[tabId]}</b> sudah dibuat di folder components/
            </div>`;
        }
        
        // Munculin lagi
        contentDiv.style.opacity = '1';
    }, 200);
}
