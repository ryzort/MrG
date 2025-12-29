export default function Scenes({state, apiManager, session}){
  const root = document.createElement('div');
  root.className='card';
  const title = document.createElement('h2'); title.textContent='Tab 3 — Scene Images (8 Scenes)';
  root.appendChild(title);

  const sceneGrid = document.createElement('div');
  sceneGrid.style.display='grid';
  sceneGrid.style.gridTemplateColumns='repeat(auto-fit,minmax(220px,1fr))';
  sceneGrid.style.gap='12px';
  root.appendChild(sceneGrid);

  const btnGen = document.createElement('button'); btnGen.className='primary'; btnGen.textContent='Generate 8 Scenes';
  btnGen.addEventListener('click', async ()=>{
    btnGen.disabled = true;
    try{
      const proj = session.load(state.get('currentProject'));
      const masterStory = proj?.data?.masterStory || 'No story';
      const breakdown = await apiManager.request('openai', 'scene_breakdown: ' + masterStory);
      const scenes = [];
      for(let i=1;i<=8;i++){
        const prompt = `Scene ${i} based on story: ${masterStory}. Detail shot ${i}.`;
        const img = await apiManager.request('pollinations-image', prompt);
        scenes.push({index:i,prompt, image:img.url || img.objectUrl || img});
      }
      sceneGrid.innerHTML='';
      scenes.forEach(s=>{
        const c = document.createElement('div'); c.className='card';
        c.innerHTML = `<div style="height:180px;background:#081226;border-radius:8px;overflow:hidden"><img src="${s.image}" style="width:100%;height:100%;object-fit:cover"/></div><div style="margin-top:8px"><textarea data-prompt="${s.index}" style="width:100%">${s.prompt}</textarea></div>`;
        sceneGrid.appendChild(c);
      });
      proj.data.scenes = scenes;
      session.save(proj);
      const sc = state.get('stageCompleted') || {};
      sc.scenes = true;
      state.set('stageCompleted', sc);
    }catch(err){
      alert('Error generate scenes: '+err.message);
    }finally{ btnGen.disabled=false; }
  });
  root.appendChild(btnGen);
  return root;
          }
