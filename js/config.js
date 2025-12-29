const CONFIG = {
    // Ambil Key dari LocalStorage
    getImgBBKey: () => localStorage.getItem('mrg_imgbb_key') || "",
    getPollinationsKey: () => localStorage.getItem('mrg_polli_key') || "",

    // DAFTAR MODEL (FIXED)
    AI_MODELS: {
        story: "claude",           // Cerita
        logic: "openai",           // Logic biasa
        vision: "openai",          // <--- WAJIB 'openai' BUAT VISION
        image_std: "seedream",     
        image_pro: "seedream-pro"  
    },

    ERRORS: {
        missingKey: "API Key Pollinations kosong! Masukin di Settings dulu."
    }
};
