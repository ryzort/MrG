const CONFIG = {
    // Ambil Key dari LocalStorage (Fitur Settings yang tadi)
    getImgBBKey: () => localStorage.getItem('mrg_imgbb_key') || "",
    getPollinationsKey: () => localStorage.getItem('mrg_polli_key') || "",

    // DAFTAR MODEL (Sesuai Screenshot & Doc lu)
    // Lu bisa ganti nama model ini sesuai list di: https://gen.pollinations.ai/v1/models
    AI_MODELS: {
        story: "openai",          // Paling stabil buat text
        vision: "gpt-4o",         // Buat liat gambar
        json: "openai",           // Ganti qwen jadi openai biar aman
        image: "flux",            // Gambar tetep flux
        video_prompt: "mistral"   
    },

    ERRORS: {
        missingKey: "API Key belum diisi bro! Klik tombol Gear ⚙️ di pojok kanan atas."
    }
};
