import { A, K, L, V, oA } from './tools';
import { tableStrucMap } from './data';

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
      onupgradeneeded: e => (async () => {
        let db = e.target.result; L("Upgrading db.");
        await Promise.all((V(tableStrucMap)).map((({ table, keyPath, indices }) => new Promise((resolve, reject) => {
          let os = db.createObjectStore(table, L({ keyPath }));
          oA(indices).forEach(i => os.createIndex(i[0], i[1], { unique: i[2] }));
          os.transaction.oncomplete = () => { L(`Object store created: ${L(K(os))}`); resolve(os); };
          os.transaction.onerror = () => reject(`Creating table '${table}' failed`);
        }))));
        L("DB structure initialized.");
        resolve(db);
      })()
    }));
  }

  getTx(table, label, reject) { let tx = this.db.transaction([table], "readwrite"); return A(tx, { onerror: () => (tx.error !== null) && reject(`Error on ${label} for ${table}: ${tx.error}`) }); }
  getOS(table, label, reject) { return this.getTx(table, label, reject).objectStore(table); }
  act(table, label, input, getData) { return new Promise((resolve, reject) => { this.getOS(table, label, reject)[label](input).onsuccess = e => resolve(getData(e)); }); }
  add(table, data) { return this.act(table, "add", data, () => data); }
  put(table, data) { return this.act(table, "put", data, () => data); }
  count(table, data) { return this.act(table, "count", data, e => e.target.result); }
  getAll(table, data) { return this.act(table, "getAll", data, e => e.target.result); }
  openCursor(table, data, onCursor) { return this.act(table, "openCursor", data, e => (c => c && onCursor(c))((e.target.result))); }
  iterateAll(table, data, onData) { return this.openCursor(table, data, c => { if (onData(c.value)) c.continue(); }); }
  get(table, data) { return this.act(table, "get", (tableStrucMap[table]).keyPath.map(k => data[k]), e => e.target.result); }
  write(table, data) { return this.get(table, data).catch(() => this.add(table, data)).then(() => this.put(table, data)); }

}

export { IndexedDB };