const CONFIG = {
    getImgBBKey: () => localStorage.getItem('mrg_imgbb_key') || "",
    getPollinationsKey: () => localStorage.getItem('mrg_polli_key') || "",

    // SAMA PERSIS KAYA KODE LU
    AI_MODELS: {
        story: "claude",          // Buat cerita (Paling pinter nulis)
        logic: "openai",          // Buat JSON/Logic (Paling patuh)
        vision: "openai",         // Buat liat gambar
        image_std: "seedream",    // Gambar Standar
        image_pro: "seedream-pro" // Gambar Pro (4K)
    },

    ERRORS: {
        missingKey: "API Key Pollinations kosong! Masukin di Settings dulu."
    }
};
