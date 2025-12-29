const STATE = {
    data: {
        story: {
            text: "",
            useDialog: false, 
            characters: []
        },
        style: {
            refImage: "",
            artPrompt: "",
            isProQuality: true // Default ON (Sesuai kode lu)
        },
        sessionSeed: Math.floor(Math.random() * 999999), // Seed konsisten
    },

    init() {
        const saved = localStorage.getItem('mrg_project_data');
        if (saved) {
            this.data = { ...this.data, ...JSON.parse(saved) };
        }
    },

    save() {
        localStorage.setItem('mrg_project_data', JSON.stringify(this.data));
    },

    // Helpers Update Data
    updateStory(text, useDialog) {
        this.data.story.text = text;
        this.data.story.useDialog = useDialog;
        this.save();
    },

    setCharactersList(tags) {
        this.data.story.characters = tags;
        this.save();
    },
    
    updateStyleConfig(prompt, isPro) {
        this.data.style.artPrompt = prompt;
        this.data.style.isProQuality = isPro;
        this.save();
    }
};

STATE.init();
