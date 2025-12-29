const CONFIG = {
    // Ambil Key dari LocalStorage (Fitur Settings yang tadi)
    getImgBBKey: () => localStorage.getItem('mrg_imgbb_key') || "",
    getPollinationsKey: () => localStorage.getItem('mrg_polli_key') || "",

    // DAFTAR MODEL (Sesuai Screenshot & Doc lu)
    // Lu bisa ganti nama model ini sesuai list di: https://gen.pollinations.ai/v1/models
    AI_MODELS: {
        story: "openai",          // Model cerdas buat nulis cerita
        vision: "gemini",         // Model yang punya logo "Mata" (Vision)
        json: "qwen-coder",       // Model jago koding/struktur data
        image: "flux",            // Model gambar paling bagus saat ini
        video_prompt: "mistral"   // Model buat bikin prompt video (opsional)
    },

    ERRORS: {
        missingKey: "API Key belum diisi bro! Klik tombol Gear ⚙️ di pojok kanan atas."
    }
};
