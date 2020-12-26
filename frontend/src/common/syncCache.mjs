import { A, D, E, oA } from './tools.mjs';

class Observer {
  constructor(observable, onChange, context, index) { A(this, { observable, onChange, context, index }); }
  detach() { this.observable.remove(this); }
}

class Observable {
  constructor() { A(this, { observers: {}, observerIx: 0 }); }
  watch(key, onChange, context) {
    let obs = new Observer(this, onChange, context, this.observerIx++);
    (this.observers[key] = oA(this.observers[key])).push(obs);
    if (D(this.data[key])) obs.onChange(this.data[key], context);
    return obs;
  }
  observe(key, data) { oA(this.observers[key]).forEach(o => o.onChange(data, o.context)); return data; }
  remove(obs) {
    if (D(this.observers[obs.index])) delete this.observers[obs.index];
  }
}

class SyncCache extends Observable {
  constructor() { super(); A(this, { data: {} }); }
  setData(key, data) { this.observe(key, this.data[key] = data); return data; } //  L(`syncCache.setData(${key}, ${S(data)})`);
  getData(key, retriever) { return this.data[key] = (D(this.data[key]) ? this.data[key] : (retriever && this.observe(key, retriever()))); }
  set(obj) { E(obj).forEach(([k, v]) => this.setData(k, v)); }
}

export { SyncCache } 