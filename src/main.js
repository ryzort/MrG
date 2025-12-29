import { State } from './state.js';
import { ApiManager } from './apiManager.js';
import { Session } from './session.js';

import Story from './components/story.js';
import Casting from './components/casting.js';
import Scenes from './components/scenes.js';
import Video from './components/video.js';
import Projects from './components/projects.js';
import Settings from './components/settings.js';

const root = document.getElementById('app-root');
const statusEl = document.getElementById('ai-status');

// init managers
window.apiManager = new ApiManager();
window.session = new Session();
window.appState = new State({
  route: 'projects',
  stageCompleted: { story:false, casting:false, scenes:false, video:false }
});

// UI: respond to API status events
window.apiManager.onStatus((s) => {
  statusEl.textContent = s;
});

// Router-ish: mount components
const routes = {
  projects: Projects,
  story: Story,
  casting: Casting,
  scenes: Scenes,
  video: Video,
  settings: Settings
};

function setActiveNav(route){
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.route===route);
  });
}

function mount(route){
  root.innerHTML = '';
  const Comp = routes[route];
  if(!Comp) return root.appendChild(document.createTextNode('Not found'));
  const el = Comp({
    state: window.appState,
    apiManager: window.apiManager,
    session: window.session
  });
  root.appendChild(el);
  setActiveNav(route);
}

// nav buttons
document.querySelectorAll('.nav-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    const target = b.dataset.route;
    // enforce step-by-step lock: cannot go to tab unless previous completed (except projects & settings)
    const allowed = checkRouteAllowed(target);
    if(!allowed){
      window.apiManager.setStatus('Selesaikan step sebelumnya terlebih dahulu');
      return;
    }
    window.appState.set('route', target);
  });
});

function checkRouteAllowed(route){
  if(route==='projects' || route==='settings') return true;
  const st = window.appState.get('stageCompleted');
  if(route==='story') return true;
  if(route==='casting') return st.story;
  if(route==='scenes') return st.casting;
  if(route==='video') return st.scenes;
  return true;
}

// subscribe to route changes
window.appState.subscribe('route', (route)=>{
  mount(route);
});

// initial mount
mount(window.appState.get('route') || 'projects');
