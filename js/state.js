const STATE = {
    // Data Default (Kosong)
    data: {
        story: {
            text: "",
            useDialog: true, // Toggle Dialog
            characters: []   // List nama karakter (Jono, Joni)
        },
        style: {
            refImage: "",    // Link gambar referensi
            artPrompt: "",   // Hasil analisa AI tentang style
            ratio: "1:1",    // Aspect ratio
            sceneCount: 5    // Jumlah scene
        },
        characters: [],      // Array kartu karakter detail
        scenes: []           // Array panel scene
    },

    // Load data pas web dibuka
    init() {
        const saved = localStorage.getItem('mrg_project_data');
        if (saved) {
            this.data = JSON.parse(saved);
        }
    },

    // Simpan data ke LocalStorage
    save() {
        localStorage.setItem('mrg_project_data', JSON.stringify(this.data));
        console.log("Data tersimpan aman.");
    },

    // Fungsi Update per Bagian (Biar rapi)
    updateStory(text, useDialog) {
        this.data.story.text = text;
        this.data.story.useDialog = useDialog;
        this.save();
    },

    setCharactersList(tags) {
        this.data.story.characters = tags;
        this.save();
    },

    updateStyle(imgUrl, prompt, ratio, count) {
        this.data.style.refImage = imgUrl;
        this.data.style.artPrompt = prompt;
        this.data.style.ratio = ratio;
        this.data.style.sceneCount = count;
        this.save();
    }
};

// Jalanin init pas file dimuat
STATE.init();
