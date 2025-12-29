import { uploadToImgbb } from '../api/imgbb.js';

export default function Casting({ state, apiManager, session }) {
  const root = document.createElement('div');
  root.className = 'card';
  const title = document.createElement('h2'); title.textContent = 'Tab 2 — Casting & Style';
  root.appendChild(title);

  const proj = session.load(state.get('currentProject')) || {};
  const characters = (proj.data && proj.data.characters) || [];

  const uploadRow = document.createElement('div'); uploadRow.className = 'row';
  const inputUrl = document.createElement('input');
  inputUrl.placeholder = 'Paste public image URL (required for API calls)';
  inputUrl.style.flex = '1';

  // Local file upload (preview only)
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.title = 'Local file (preview & optional upload to imgbb)';

  const btnSaveRef = document.createElement('button'); btnSaveRef.className = 'primary'; btnSaveRef.textContent = 'Save Reference';
  uploadRow.appendChild(inputUrl);
  uploadRow.appendChild(fileInput);
  uploadRow.appendChild(btnSaveRef);

  const styleDescEl = document.createElement('div'); styleDescEl.className = 'small-muted'; styleDescEl.style.marginTop = '8px';
  root.appendChild(uploadRow);
  root.appendChild(styleDescEl);

  // preview area for uploaded local file
  const previewArea = document.createElement('div');
  previewArea.style.marginTop = '8px';
  root.appendChild(previewArea);

  let selectedFile = null;

  fileInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    previewArea.innerHTML = '';
    selectedFile = null;
    if (!f) return;
    selectedFile = f;
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    img.style.maxWidth = '220px';
    img.style.borderRadius = '8px';
    previewArea.appendChild(img);

    // show imgbb action if key exists
    const imgbbKey = localStorage.getItem('mrg_imgbb_key');
    const note = document.createElement('div'); note.className = 'small-muted'; note.style.marginTop = '6px';
    if (imgbbKey) {
      note.innerHTML = `File selected. Kamu bisa <strong>Upload to imgbb</strong> langsung dari UI lalu otomatis pakai public URL untuk Save Reference.`;
      const uploadBtn = document.createElement('button'); uploadBtn.className = 'ghost'; uploadBtn.textContent = 'Upload to imgbb & Use URL';
      uploadBtn.style.marginTop = '6px';
      uploadBtn.addEventListener('click', async () => {
        uploadBtn.disabled = true;
        try {
          const res = await uploadToImgbb(selectedFile, imgbbKey);
          inputUrl.value = res.url;
          alert('Upload sukses, URL disisipkan ke input. Klik Save Reference untuk lanjut.');
        } catch (err) {
          alert('Upload to imgbb failed: ' + (err.message || err));
        } finally {
          uploadBtn.disabled = false;
        }
      });
      previewArea.appendChild(uploadBtn);
    } else {
      note.innerHTML = `File selected untuk preview. Pollinations memerlukan URL publik. Simpan file ke hosting (imgbb, Imgur, CDN) lalu paste URL di input di atas. Atau simpan imgbb key di Settings untuk upload langsung.`;
    }
    previewArea.appendChild(note);
  });

  const bank = document.createElement('div'); bank.className = 'col'; bank.style.marginTop = '12px';
  root.appendChild(bank);

  function renderEmptyCards() {
    bank.innerHTML = '';
    characters.forEach(ch => {
      const card = document.createElement('div'); card.className = 'card';
      card.style.display = 'flex'; card.style.gap = '12px'; card.style.alignItems = 'center';
      const imgArea = document.createElement('div'); imgArea.style.width = '120px'; imgArea.style.height = '120px'; imgArea.style.background = 'rgba(255,255,255,0.02)'; imgArea.style.borderRadius = '8px';
      imgArea.textContent = 'No image';
      const name = document.createElement('div'); name.innerHTML = `<strong>${ch.name}</strong><div class="small-muted">${ch.base_desc}</div>`;
      const editBtn = document.createElement('button'); editBtn.className = 'ghost'; editBtn.textContent = 'Edit Prompt';
      editBtn.addEventListener('click', () => alert('Buka prompt editor (belum diimplementasi editing UI lengkap)'));
      card.appendChild(imgArea);
      card.appendChild(name);
      card.appendChild(editBtn);
      bank.appendChild(card);
    });
  }
  renderEmptyCards();

  btnSaveRef.addEventListener('click', async () => {
    const url = inputUrl.value.trim();
    if (!url) {
      alert('Masukkan public image URL di input paling kiri sebelum Save Reference. Jika kamu hanya punya file lokal, upload dulu (imgbb) atau paste public URL.');
      return;
    }
    btnSaveRef.disabled = true;
    try {
      // Use pollinations-chat to analyze the style. We will send a short chat messages array including an image_url item.
      const messages = [
        { role: 'system', content: 'You are an image/style analyzer. Produce a concise masterStyleDesc from the reference image.' },
        { role: 'user', content: [{ type: 'text', text: 'Describe the visual style of this image in one short paragraph.' }, { type: 'image_url', image_url: { url } }] }
      ];
      const styleResp = await apiManager.request('pollinations-chat', messages, { model: 'openai' });
      let masterStyleDesc = '';
      try {
        masterStyleDesc = styleResp.choices?.[0]?.message?.content || styleResp.choices?.[0]?.message?.content_blocks?.[0]?.text || (styleResp.text || '');
      } catch (e) { masterStyleDesc = (styleResp.text || '') }
      masterStyleDesc = masterStyleDesc || 'Gaya: cinematic, warm tones (detected)';
      styleDescEl.textContent = masterStyleDesc;

      // generate character prompts & images
      for (const ch of characters) {
        const promptMsg = `Generate a compact image prompt (single line) for character "${ch.name}". Use style: ${masterStyleDesc}. Include clothing and lighting keywords.`;
        const promptResp = await apiManager.request('pollinations-chat', [{ role: 'user', content: promptMsg }], { model: 'openai' });
        const promptText = promptResp.choices?.[0]?.message?.content || promptResp.text || promptMsg;
        const imgRes = await apiManager.request('pollinations-image', promptText, { model: 'seedream' });
        // update UI card image (simple matcher)
        const cardImgs = bank.querySelectorAll('.card');
        for (let el of cardImgs) {
          if (el.innerHTML.includes(ch.name)) {
            const area = el.querySelector('div');
            area.innerHTML = `<img src="${imgRes.url}" alt="${ch.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>`;
          }
        }
        // save to session
        const p = session.load(state.get('currentProject'));
        p.data.characters = p.data.characters.map(c => c.name === ch.name ? { ...c, prompt: promptText, image: imgRes.url } : c);
        session.save(p);
      }
      // lock style in session
      const p2 = session.load(state.get('currentProject'));
      p2.data.masterStyle = masterStyleDesc;
      session.save(p2);

      // mark stage complete
      const sc = state.get('stageCompleted') || {};
      sc.casting = true;
      state.set('stageCompleted', sc);
      alert('Style saved and characters generated.');
    } catch (err) {
      alert('Error analisa style / generate: ' + (err.message || err));
    } finally {
      btnSaveRef.disabled = false;
    }
  });

  const nextBtn = document.createElement('button'); nextBtn.className = 'primary'; nextBtn.textContent = 'Next → Scenes';
  nextBtn.style.marginTop = '12px';
  nextBtn.addEventListener('click', () => state.set('route', 'scenes'));
  root.appendChild(nextBtn);

  return root;
}
