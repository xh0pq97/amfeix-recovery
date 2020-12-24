import { A, D, I, K, L, S, U, V, oA, oF, isA, future } from '../common/tools';
import { tableStrucMap } from './data';
import fakeIndexedDB from 'fake-indexeddb/auto';

let computeKey = (table, data, keyPath) => (z => keyPath && keyPath.length === 1 ? z.join("") : z)(data && ((keyPath || tableStrucMap[table].keyPath).map(k => data[k]))); 

//L({tables}); L({tableStrucMap});
class IndexedDB {
  constructor(name) {
    this.name = name;
    this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || fakeIndexedDB 
    this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    this.whenInitialized = future();
    this.init();
  }

  async init() { this.whenInitialized.resolve(this.db = await (new Promise((resolve, reject) => A(this.indexedDB.open(this.name, 5), {
    onerror: e => reject(`DB Error: ${e.target.error}`), onsuccess: e => { L("DB opened."); resolve(e.target.result); },
    onupgradeneeded: e => (async () => { let db = e.target.result; L("Upgrading db.");
      for (let i = 0; i < db.objectStoreNames.length; ++i) await db.deleteObjectStore(db.objectStoreNames.item(i));
      await Promise.all((V(tableStrucMap)).map((({ table, keyPath, indices, autoIncrement }) => new Promise((resolve, reject) => { // L({ table, keyPath, indices, autoIncrement });
        let os = db.createObjectStore(table, ({ keyPath: keyPath || "id", autoIncrement: autoIncrement || !D(keyPath) }));
        oA(indices).forEach(i => os.createIndex(i[0], i[1], { unique: i[2], multiEntry: true }));
        os.transaction.oncomplete = () => { I(`Object store created: ${L(K(os))}`); resolve(os); };
        os.transaction.onerror = () => reject(`Creating table '${table}' failed`);
      })))); L("DB structure initialized.");
      resolve(db);
    })()
  })))); }
 
  async close() { await this.whenInitialized.promise; await this.db.close();  }
  async deleteDB(name) { await this.db.deleteDatabase(name); }

  getTx(table, label, reject) { let tx = this.db.transaction(isA(table) ? table: [table], "readwrite"); 
    return A(tx, { onerror: () => (tx.error !== null) && reject(`Error on ${label} for ${table}: ${tx.error}`) }); 
  }
  getOS(table, label, reject) { return this.getTx(table, label, reject).objectStore(table); }
  act(table, label, input, getData, index) { return new Promise((resolve, reject) => { let os = this.getOS(table, label, reject);
    I({index, input});
    (index ? os.index((index)) : os)[label](input).onsuccess = e => resolve(getData(e)); 
  }); }
  add(table, data) { return this.act(table, "add", data, () => data); }
  put(table, data) { return this.act(table, "put", data, () => data); }
  count(table, data) { return this.act(table, "count", data, e => e.target.result); }
  getAll(table, data, index, keyPath) { return this.act(table, "getAll", (computeKey(table, data, keyPath)), e => e.target.result, index); }
  openCursor(table, data, onCursor) { return this.act(table, "openCursor", data, e => (c => c && onCursor(c))((e.target.result))); }
  iterateAll(table, data, onData) { return this.openCursor(table, data, c => { if (onData(c.value)) c.continue(); }); }
  get(table, data, index, keyPath) { I( {computeKey: computeKey(table, data, keyPath)} ); return this.act(table, "get", computeKey(table, data, keyPath), e => e.target.result, index); }
  write(table, data) { return this.get(table, data).catch(() => this.add(table, data)).then(() => this.put(table, data)); }
  clear(table) { return this.act(table, "clear", U, I); }

  newBuffer() { return new IDBuffer(this) }
}

class IDBuffer {
  constructor(idb) { A(this, { idb, pendingOps: [], tables: {}, batchSize: 1024 }); }

  queueOp(table, action, data, onSuccess, onError) {
    this.tables[table] = true;
    this.pendingOps.push({ table, action, data, onSuccess, onError });
    if (this.pendingOps.length > this.batchSize) {
      this.activeFlush = (this.activeFlush || Promise.resolve()).then(async () => await this.flush());
    }
  }

  pendingOpsCount() { return this.pendingOps.length; }

  async flush() { 
    while (this.pendingOps.length > 0) await new Promise((resolve, reject) => {
      let p = this.pendingOps; 
      this.pendingOps = [];
      let tx = this.idb.getTx((K(this.tables)), "flush", err => { L('flusherr'); L({err}); reject(err); });
      let result = { errors: 0, successes: 0 }, total = p.length;
      p.forEach(x => {
        let os = tx.objectStore(x.table);
        let y = os[x.action](x.data);
        y.onsuccess = e => { oF(x.onSuccess)(e.target.result); if (result.errors + ++result.successes === total) resolve(result); };
        y.onerror = e => { L(`Error for ${S(x)}: ${S(e)}`); oF(x.onError)(e); if (++result.errors + result.successes === total) resolve(result); };
      });
    })
  }

  add(table, data) { this.queueOp(table, "add", data, () => data, err => { L(`Add error ${S(data)}`); L({err}) }); }
  put(table, data) { this.queueOp(table, "put", data, () => data, err => { L('Put error '); L({err}) }); }
  count(table, data) { this.queueOp(table, "count", data, e => e.target.result); }
  getAll(table, data) { this.queueOp(table, "getAll", (data), e => e.target.result); }
  get(table, data, onSuccess, onError) { this.queueOp(table, "get", computeKey(table, data), onSuccess, onError); }  
  write(table, data) { this.get(table, data, d => { this.put(table, data); }, () => { this.add(table, data); }); }
}

export { IndexedDB, IDBuffer };