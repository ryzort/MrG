const STATE = {
    data: {
        story: {
            text: "",
            useDialog: false, 
            characters: []
        },
        style: {
            refImage: "",
            // Default style dari kode lu:
            artPrompt: "3D animation style, Pixar style, cinematic lighting, highly detailed",
            isProQuality: true, // Default ON (Toggle Quality)
        },
        // Session Seed biar karakter konsisten (Logic Lu)
        sessionSeed: Math.floor(Math.random() * 999999),
        scenes: []
    },

    init() {
        const saved = localStorage.getItem('mrg_project_data');
        if (saved) {
            // Merge saved data dengan default biar seed gak ilang
            const parsed = JSON.parse(saved);
            this.data = { ...this.data, ...parsed };
        }
    },

    save() {
        localStorage.setItem('mrg_project_data', JSON.stringify(this.data));
    },

    // Update Helpers
    updateStory(text, useDialog) {
        this.data.story.text = text;
        this.data.story.useDialog = useDialog;
        this.save();
    },

    setCharactersList(tags) {
        this.data.story.characters = tags;
        this.save();
    },
    
    // Simpan status Toggle Quality disini
    updateStyleConfig(prompt, isPro) {
        this.data.style.artPrompt = prompt;
        this.data.style.isProQuality = isPro;
        this.save();
    }
};

STATE.init();
