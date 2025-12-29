export default function Settings({ state, apiManager, session }) {
  const root = document.createElement('div');
  root.className = 'card';
  const title = document.createElement('h2'); title.textContent = 'Settings';
  root.appendChild(title);

  // Pollinations / API keys manager
  const keysWrap = document.createElement('div'); keysWrap.className = 'col';
  const keyForm = document.createElement('div'); keyForm.className = 'row';
  const providerSelect = document.createElement('select');
  ['pollinations','openai','claude'].forEach(p=>{
    const o = document.createElement('option'); o.value = p; o.textContent = p; providerSelect.appendChild(o);
  });
  const keyInput = document.createElement('input'); keyInput.placeholder = 'API key';
  const addKeyBtn = document.createElement('button'); addKeyBtn.className='primary'; addKeyBtn.textContent='Add Key';
  keyForm.appendChild(providerSelect); keyForm.appendChild(keyInput); keyForm.appendChild(addKeyBtn);
  keysWrap.appendChild(keyForm);

  const listEl = document.createElement('div'); listEl.style.marginTop='8px';
  keysWrap.appendChild(listEl);

  function loadKeys(){
    const arr = JSON.parse(localStorage.getItem('mrg_api_keys')||'[]');
    listEl.innerHTML='';
    if(arr.length===0){
      const p = document.createElement('div'); p.className='small-muted'; p.textContent='No API keys saved.';
      listEl.appendChild(p); return;
    }
    arr.forEach((k, idx)=>{
      const row = document.createElement('div'); row.className='row';
      const info = document.createElement('div'); info.style.flex='1'; info.innerHTML = `<strong>${k.provider}</strong> <div class="small-muted">${k.key.slice(0,6)}…</div>`;
      const del = document.createElement('button'); del.className='ghost'; del.textContent='Remove';
      del.addEventListener('click', ()=>{
        const a = JSON.parse(localStorage.getItem('mrg_api_keys')||'[]');
        a.splice(idx,1);
        localStorage.setItem('mrg_api_keys', JSON.stringify(a));
        loadKeys();
      });
      row.appendChild(info); row.appendChild(del);
      listEl.appendChild(row);
    });
  }
  addKeyBtn.addEventListener('click', ()=>{
    const provider = providerSelect.value;
    const key = keyInput.value.trim();
    if(!key) return alert('Masukkan API key dulu.');
    const arr = JSON.parse(localStorage.getItem('mrg_api_keys')||'[]');
    arr.push({ provider, key });
    localStorage.setItem('mrg_api_keys', JSON.stringify(arr));
    keyInput.value='';
    loadKeys();
    // update app manager in-memory if present
    if(window.apiManager && typeof window.apiManager.addKeys === 'function'){
      window.apiManager.addKeys(arr);
    }
  });

  // imgbb key manager (client key)
  const imgbbWrap = document.createElement('div'); imgbbWrap.style.marginTop='16px';
  const imgbbTitle = document.createElement('h3'); imgbbTitle.textContent='imgbb settings';
  const imgbbInput = document.createElement('input'); imgbbInput.placeholder='imgbb client API key (used to upload files)';
  imgbbInput.style.width='60%';
  const saveImgbbBtn = document.createElement('button'); saveImgbbBtn.className='primary'; saveImgbbBtn.textContent='Save imgbb Key';
  const clearImgbbBtn = document.createElement('button'); clearImgbbBtn.className='ghost'; clearImgbbBtn.textContent='Clear';
  imgbbWrap.appendChild(imgbbTitle);
  const rowImgbb = document.createElement('div'); rowImgbb.className='row'; rowImgbb.appendChild(imgbbInput); rowImgbb.appendChild(saveImgbbBtn); rowImgbb.appendChild(clearImgbbBtn);
  imgbbWrap.appendChild(rowImgbb);
  const imgbbNote = document.createElement('div'); imgbbNote.className='small-muted'; imgbbNote.style.marginTop='8px';
  imgbbNote.innerHTML = 'imgbb client key is stored locally (localStorage). It is used to auto-upload local image files and get a public URL needed by Pollinations.';
  imgbbWrap.appendChild(imgbbNote);

  saveImgbbBtn.addEventListener('click', ()=>{
    const k = imgbbInput.value.trim();
    if(!k) return alert('Masukkan imgbb key.');
    localStorage.setItem('mrg_imgbb_key', k);
    alert('imgbb key saved locally.');
  });
  clearImgbbBtn.addEventListener('click', ()=>{
    localStorage.removeItem('mrg_imgbb_key');
    imgbbInput.value = '';
    alert('imgbb key removed.');
  });

  // load existing imgbb key
  imgbbInput.value = localStorage.getItem('mrg_imgbb_key') || '';

  root.appendChild(keysWrap);
  root.appendChild(imgbbWrap);
  loadKeys();
  return root;
}