export default function Video({state, apiManager, session}){
  const root = document.createElement('div');
  root.className='card';
  const title = document.createElement('h2'); title.textContent='Tab 4 — Video Prompt & SFX';
  root.appendChild(title);

  const proj = session.load(state.get('currentProject')) || {};
  const scenes = proj?.data?.scenes || [];

  if(scenes.length===0){
    const p = document.createElement('p'); p.className='small-muted'; p.textContent='Belum ada scene. Kembali ke Tab Scenes untuk generate 8 scene.';
    root.appendChild(p);
    return root;
  }

  const wrap = document.createElement('div'); wrap.className='col';
  scenes.forEach(s=>{
    const card = document.createElement('div'); card.className='card';
    const heading = document.createElement('div'); heading.innerHTML = `<strong>Scene ${s.index}</strong>`;
    const motionArea = document.createElement('textarea'); motionArea.style.width='100%'; motionArea.style.minHeight='80px';
    const sfxArea = document.createElement('div'); sfxArea.className='small-muted';
    const genBtn = document.createElement('button'); genBtn.className='ghost'; genBtn.textContent='Generate Video Prompt & SFX';
    genBtn.addEventListener('click', async ()=>{
      genBtn.disabled=true;
      try{
        const textResp = await apiManager.request('openai', `video_motion_prompt_for_scene: ${s.prompt}`);
        motionArea.value = textResp.text || `Motion prompt for scene ${s.index} (stub)`;
        const sfxResp = await apiManager.request('openai', `sfx_suggestions_for_scene: ${s.prompt}`);
        sfxArea.textContent = sfxResp.text || 'SFX: wind, Foley footsteps (stub)';
        const p = session.load(state.get('currentProject'));
        p.data.scenes = p.data.scenes.map(scn => scn.index===s.index ? {...scn, motion: motionArea.value, sfx: sfxArea.textContent} : scn);
        session.save(p);
      }catch(err){ alert('Error generate video prompt: '+err.message); }finally{ genBtn.disabled=false; }
    });
    card.appendChild(heading);
    card.appendChild(motionArea);
    card.appendChild(sfxArea);
    card.appendChild(genBtn);
    wrap.appendChild(card);
  });
  root.appendChild(wrap);

  const doneBtn = document.createElement('button'); doneBtn.className='primary'; doneBtn.textContent='Finish Project';
  doneBtn.style.marginTop='12px';
  doneBtn.addEventListener('click', ()=>{
    alert('Project disimpan. Kamu bisa download session atau terus edit (MVP).');
  });
  root.appendChild(doneBtn);

  return root;
}
