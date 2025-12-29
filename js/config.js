const CONFIG = {
    // Ganti dengan API Key ImgBB punya lu nanti
    IMGBB_API_KEY: "API_KEY_LU_DISINI", 
    
    // Settingan Model AI Pollinations
    AI_MODELS: {
        story: "openai",          // Buat nulis cerita (Tab 1)
        vision: "gemini",         // Buat liat gambar (Tab 2) - Support Vision
        json: "qwen-coder",       // Buat format JSON/Data (Tab 3 & 5)
        image: "flux"             // Buat generate gambar (Tab 3 & 4)
    },

    // Settingan Error Message
    ERRORS: {
        network: "Koneksi bermasalah. Cek internet lu bro.",
        api: "AI lagi pusing (API Error). Coba lagi bentar.",
        image: "Gagal upload gambar. Coba file lain atau link langsung."
    }
};
