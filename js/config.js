const CONFIG = {
    // Fungsi buat ngambil Key dari LocalStorage
    getImgBBKey: () => localStorage.getItem('mrg_imgbb_key') || "",
    getPollinationsKey: () => localStorage.getItem('mrg_polli_key') || "",

    // Cek apakah user udah set key
    isConfigured: () => {
        return localStorage.getItem('mrg_imgbb_key') !== null;
    },

    // Settingan Model AI (Tetap disini karena aman publik)
    AI_MODELS: {
        story: "openai",          
        vision: "gemini",         // Support Vision
        json: "qwen-coder",       
        image: "flux"             
    },

    ERRORS: {
        network: "Koneksi bermasalah. Cek internet lu bro.",
        api: "AI lagi pusing (API Error). Cek API Key atau coba lagi.",
        missingKey: "Woy bro! API Key belum diisi. Klik tombol Gear ⚙️ di atas dulu."
    }
};
