export default function Projects({state, session}){
  const root = document.createElement('div');
  root.className = 'card';
  const title = document.createElement('h2'); title.textContent = 'Projects';
  const listWrap = document.createElement('div');
  listWrap.className='col';
  const btnNew = document.createElement('button');
  btnNew.className='primary';
  btnNew.textContent = 'New Project';
  btnNew.addEventListener('click', ()=>{
    const p = session.save({title:'Untitled Project', data:{}, created_at:new Date().toISOString()});
    state.set('currentProject', p.id);
    state.set('route','story');
  });

  root.appendChild(title);
  root.appendChild(btnNew);

  function renderList(){
    listWrap.innerHTML='';
    const items = session.list();
    if(items.length===0){
      const p = document.createElement('p'); p.className='small-muted'; p.textContent = 'Belum ada project. Klik New Project untuk mulai.';
      listWrap.appendChild(p);
    }else{
      items.forEach(it=>{
        const card = document.createElement('div');
        card.className='card';
        card.style.marginTop='8px';
        const r = document.createElement('div');
        r.innerHTML = `<strong>${it.title||'Untitled'}</strong> <div class="small-muted">updated ${it.updated_at||it.created_at}</div>`;
        const actions = document.createElement('div');
        actions.style.marginTop='8px';
        const open = document.createElement('button'); open.className='ghost'; open.textContent='Open';
        open.addEventListener('click', ()=>{
          state.set('currentProject', it.id);
          state.set('route','story');
        });
        const deleteBtn = document.createElement('button'); deleteBtn.className='ghost'; deleteBtn.textContent='Delete';
        deleteBtn.addEventListener('click', ()=>{
          session.remove(it.id);
          renderList();
        });
        actions.appendChild(open); actions.appendChild(deleteBtn);
        card.appendChild(r); card.appendChild(actions);
        listWrap.appendChild(card);
      });
    }
  }

  root.appendChild(listWrap);
  renderList();
  return root;
  }
