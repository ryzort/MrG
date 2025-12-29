const CONFIG = {
    // Ambil Key dari LocalStorage
    getImgBBKey: () => localStorage.getItem('mrg_imgbb_key') || "",
    getPollinationsKey: () => localStorage.getItem('mrg_polli_key') || "",

    // DAFTAR MODEL (LOGIC LU)
    AI_MODELS: {
        story: "claude",           // Paling jago nulis cerita
        logic: "openai",           // Paling jago struktur data/JSON
        vision: "openai",          // Buat analisa gambar
        image_std: "seedream",     // Gambar Standar
        image_pro: "seedream-pro"  // Gambar Pro (4K)
    },

    ERRORS: {
        missingKey: "API Key Pollinations kosong! Masukin di Settings (Gear Icon) dulu."
    }
};
