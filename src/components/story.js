export default function Story({state, apiManager, session}){
  const root = document.createElement('div');
  root.className='card';
  const title = document.createElement('h2'); title.textContent='Tab 1 — Story';
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Tulis ide cerita kasar di sini...';
  textarea.style.width='100%';
  textarea.style.minHeight='160px';
  const btnGen = document.createElement('button'); btnGen.className='primary'; btnGen.textContent='Generate Master Story';
  const nextBtn = document.createElement('button'); nextBtn.className='primary'; nextBtn.textContent='Next → Casting';
  nextBtn.style.marginLeft='10px';
  nextBtn.disabled = true;

  const charWrap = document.createElement('div'); charWrap.className='col';
  charWrap.style.marginTop='12px';

  btnGen.addEventListener('click', async ()=>{
    const idea = textarea.value.trim();
    if(!idea) return alert('Isi ide cerita dulu.');
    btnGen.disabled = true;
    try{
      const storyResp = await apiManager.request('claude', idea);
      const masterStory = storyResp.text || storyResp;
      const storyEl = document.getElementById('master-story');
      if(storyEl) storyEl.textContent = masterStory;
      else {
        const s = document.createElement('pre'); s.id='master-story'; s.textContent = masterStory; s.style.whiteSpace='pre-wrap';
        root.appendChild(s);
      }
      const extract = await apiManager.request('openai', 'extract_characters: ' + masterStory);
      const characters = extract.characters || [];
      charWrap.innerHTML='';
      characters.forEach(c=>{
        const b = document.createElement('span');
        b.className='badge';
        b.textContent = c.name;
        charWrap.appendChild(b);
      });
      const projectId = state.get('currentProject');
      const proj = session.load(projectId) || {id:projectId, title:'Untitled', data:{}};
      proj.data.masterStory = masterStory;
      proj.data.characters = characters;
      session.save(proj);
      const sc = state.get('stageCompleted') || {};
      sc.story = true;
      state.set('stageCompleted', sc);
      nextBtn.disabled = false;
    }catch(err){
      alert('Error generate: '+err.message);
    }finally{
      btnGen.disabled=false;
    }
  });

  nextBtn.addEventListener('click', ()=>{
    state.set('route','casting');
  });

  root.appendChild(title);
  root.appendChild(textarea);
  const ctrl = document.createElement('div'); ctrl.style.marginTop='8px';
  ctrl.appendChild(btnGen); ctrl.appendChild(nextBtn);
  root.appendChild(ctrl);
  root.appendChild(charWrap);

  return root;
}
