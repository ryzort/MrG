let currentTab = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadTab(1); // Default Tab 1
});

async function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-tab-${tabId}`)?.classList.add('active');
    await loadTab(tabId);
    currentTab = tabId;
}

async function loadTab(tabId) {
    const contentDiv = document.getElementById('app-content');
    const fileMap = {
        1: 'components/tab1-story.html',
        2: 'components/tab2-style.html',
        3: 'components/tab3-chars.html',
        4: 'components/tab4-scenes.html',
        5: 'components/tab5-video.html'
    };

    contentDiv.style.opacity = '0';
    
    setTimeout(async () => {
        try {
            const response = await fetch(fileMap[tabId]);
            if (!response.ok) throw new Error("Gagal load component");
            
            const html = await response.text();
            contentDiv.innerHTML = html;
            
            // JALANIN LOGIC PER TAB (Panggil fungsi dari file js/tabs/...)
            setTimeout(() => {
                if (tabId === 1 && window.setupTab1) window.setupTab1();
                if (tabId === 2 && window.setupTab2) window.setupTab2();
                // if (tabId === 3 && window.setupTab3) window.setupTab3();
            }, 50);

        } catch (err) {
            contentDiv.innerHTML = `<div class="text-center text-red-500 py-10">Error: Gagal memuat ${fileMap[tabId]}<br>Pastikan file sudah ada di folder components/</div>`;
        }
        contentDiv.style.opacity = '1';
    }, 200);
}
