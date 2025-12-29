// Simple session storage for MVP (localStorage)
export class Session {
  constructor(){
    this.key = 'mrg_sessions';
    this.sessions = JSON.parse(localStorage.getItem(this.key)||'[]');
  }
  list(){ return this.sessions; }
  save(project){
    project.id = project.id || ('p_' + Date.now());
    project.updated_at = new Date().toISOString();
    const idx = this.sessions.findIndex(s=>s.id===project.id);
    if(idx>=0) this.sessions[idx]=project;
    else this.sessions.push(project);
    localStorage.setItem(this.key, JSON.stringify(this.sessions));
    return project;
  }
  load(id){
    return this.sessions.find(s=>s.id===id);
  }
  remove(id){
    this.sessions = this.sessions.filter(s=>s.id!==id);
    localStorage.setItem(this.key, JSON.stringify(this.sessions));
  }
  }
