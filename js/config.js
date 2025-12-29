const CONFIG = {
    // Ambil Key dari LocalStorage
    getImgBBKey: () => localStorage.getItem('mrg_imgbb_key') || "",
    getPollinationsKey: () => localStorage.getItem('mrg_polli_key') || "",

    // DAFTAR MODEL
    AI_MODELS: {
        story: "claude",           // Cerita
        logic: "openai",           // Logic biasa
        vision: "gpt-4o",          // <--- GANTI JADI 'gpt-4o' (Ini yang punya mata)
        image_std: "seedream",     
        image_pro: "seedream-pro"  
    },

    ERRORS: {
        missingKey: "API Key Pollinations kosong! Masukin di Settings (Gear Icon) dulu."
    }
};
