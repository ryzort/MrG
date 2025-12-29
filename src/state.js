// Simple pub/sub state store
export class State {
  constructor(initial = {}) {
    this._state = initial;
    this._subs = {};
  }
  get(k){ return this._state[k]; }
  set(k,v){
    this._state[k]=v;
    this._emit(k,v);
  }
  subscribe(k, cb){
    this._subs[k]=this._subs[k]||[];
    this._subs[k].push(cb);
    return ()=>{ this._subs[k]=this._subs[k].filter(fn=>fn!==cb); };
  }
  _emit(k,v){
    (this._subs[k]||[]).forEach(cb=>cb(v));
  }
}
