import { A, D, I, K, L, S, V, oA, oF, isA } from '../tools';
import { tableStrucMap } from './data';

let computeKey = (table, data) => (tableStrucMap[table]).keyPath.map(k => data[k]); 

//L({tables}); L({tableStrucMap});
class IndexedDB {
  constructor(name) {
    this.name = name;
    this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
  }

  async init() {
    L("Initializing db.");
    this.db = await new Promise((resolve, reject) => A(this.indexedDB.open(this.name, 1), {
      onerror: e => reject(`DB Error: ${e.target.error}`), onsuccess: e => { L("DB opened."); resolve(e.target.result); },
      onupgradeneeded: e => (async () => { let db = e.target.result; L("Upgrading db.");
        await Promise.all((V(tableStrucMap)).map((({ table, keyPath, indices, autoIncrement }) => new Promise((resolve, reject) => { // L({ table, keyPath, indices, autoIncrement });
          let os = db.createObjectStore(table, ({ keyPath: keyPath || "id", autoIncrement: autoIncrement || !D(keyPath) }));
          oA(indices).forEach(i => os.createIndex(i[0], i[1], { unique: i[2], multiEntry: true }));
          os.transaction.oncomplete = () => { I(`Object store created: ${L(K(os))}`); resolve(os); };
          os.transaction.onerror = () => reject(`Creating table '${table}' failed`);
        })))); L("DB structure initialized.");
        resolve(db);
      })()
    }));
  }

  deleteDB(name) { return this.indexedDB.deleteDatabase(name); }

  getTx(table, label, reject) { let tx = this.db.transaction(isA(table) ? table: [table], "readwrite"); 
    return A(tx, { onerror: () => (tx.error !== null) && reject(`Error on ${label} for ${table}: ${tx.error}`) }); 
  }
  getOS(table, label, reject) { return this.getTx(table, label, reject).objectStore(table); }
  act(table, label, input, getData) { return new Promise((resolve, reject) => { this.getOS(table, label, reject)[label](input).onsuccess = e => resolve(getData(e)); }); }
  add(table, data) { return this.act(table, "add", data, () => data); }
  put(table, data) { return this.act(table, "put", data, () => data); }
  count(table, data) { return this.act(table, "count", data, e => e.target.result); }
  getAll(table, data) { return this.act(table, "getAll", L(data), e => e.target.result); }
  openCursor(table, data, onCursor) { return this.act(table, "openCursor", data, e => (c => c && onCursor(c))((e.target.result))); }
  iterateAll(table, data, onData) { return this.openCursor(table, data, c => { if (onData(c.value)) c.continue(); }); }
  get(table, data) { return this.act(table, "get", computeKey(table, data), e => e.target.result); }
  write(table, data) { return this.get(table, data).catch(() => this.add(table, data)).then(() => this.put(table, data)); }
}

class IDBuffer {
  constructor(idb) { A(this, { idb, pendingOps: [], tables: {} }); }

  queueOp(table, action, data, onSuccess, onError) {
    this.tables[table] = true;
    this.pendingOps.push({ table, action, data, onSuccess, onError })
  }

  async flush() { 
    while (this.pendingOps.length > 0) {
      await new Promise((resolve, reject) => {
      let p = this.pendingOps; 
      let tables = K(this.tables);
      L({tables})
      let tx = this.idb.getTx(tables, "flush", err => { L({err}); reject(err); });
      let result = { errors: 0, successes: 0 }, total = p.length;
      this.pendingOps = [];
  //    let checkDone = () => { if (++i === total) resolve(); }
      p.forEach(x => {
        let os = tx.objectStore(x.table);
        let y = os[x.action](x.data);
        y.onsuccess = e => { oF(x.onSuccess)(e.target.value); if (result.errors + ++result.successes === total) resolve(result); }
        y.onerror = e => { oF(x.onError)(e.target.value); if (++result.errors + result.successes === total) resolve(result); }
      });
      })
    }
  }

  add(table, data) { this.queueOp(table, "add", data, () => data, err => { L({err}) }); }
  put(table, data) { this.queueOp(table, "put", data, () => data, err => { L({err}) }); }
  count(table, data) { this.queueOp(table, "count", data, e => e.target.result); }
  getAll(table, data) { this.queueOp(table, "getAll", L(data), e => e.target.result); }
  get(table, data, onSuccess, onError) { this.queueOp(table, "get", computeKey(table, data), onSuccess, onError); }  
  write(table, data) { this.get(table, data, d => { L(`getput ${S(d)}`); if (D(d)) { this.put(table, data); } else { this.add(table, data); } }, () => { L(' getadd'); this.add(table, data); }); }
}

export { IndexedDB, IDBuffer };