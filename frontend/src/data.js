import Web3 from 'web3';
import BN from 'bn.js';
import amfeixCjson from './amfeixC.json'; 
import { A, D, E, F, H, K, L, S, V, oA, oO, oF, isO, isA } from './tools'; 

const btcRpcUrl = `http://157.245.35.34/`, 
ethInterfaceUrl = "ws://46.101.6.38/ws"; 
//ethInterfaceUrl = "http://46.101.6.38:8547/"; 
//const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
const web3 = new Web3(new (ethInterfaceUrl.indexOf("ws://") === 0 ? Web3.providers.WebsocketProvider : Web3.providers.HttpProvider)(ethInterfaceUrl));
const amfeixC = new web3.eth.Contract(amfeixCjson.abi, "0xb0963da9baef08711583252f5000Df44D4F56925"); 

let amfeixFeeFields = "fee1 fee2 fee3".split(" ");
let invMap = (countTable, dataTable) => ({countTable, dataTable});
let arrays = "investorsAddresses time amount".split(" "), indexMaps = "feeAddresses fundDepositAddresses".split(" "), 
investorMaps = [invMap("ntx", "fundTX"), invMap("rtx", "reqWD")];
let ethBasicFields = "owner aum decimals btcPrice".split(" ").concat(amfeixFeeFields).concat(indexMaps.map(k => `${k}Length`));
const btcFields = "blockcount connectioncount difficulty blockchaininfo".split(" ");

let btcRpc = async (method, func, params) => ((await fetch(`${btcRpcUrl}${func}/${method === "GET" ? `?${E(oO(params)).map(x => x.map(encodeURIComponent).join("=")).join("&")}` : ''}`, 
 { method, mode: 'cors', headers: { "content-type": "application/json" }, ...(method === "POST" ? { body: S({params}) }: {}) })).json());

let tableStrucMap = {}
let hierName = (o, p) => F(E(o).map(([k, v]) => { let q = p ? [p, k].join("-") : k; return [k, isA(v) ? (tableStrucMap[q] = {...v[0], table: q}, q) : hierName(v, q)]; }));
let struc = (keyPath, indices) => [{ keyPath, indices }];
let tables = hierName({ 
  eth: { ...F(arrays.concat(indexMaps).map(k => [k, struc(["index"], [["data", "data", true]])])), 
    constants: struc(["name"], [["name", "name", true]]), 
    ntx: struc(["investorIx"]), fundTX: struc(["investorIx", "index"], [["hash", "hash", true]]),
    rtx: struc(["investorIx"]), reqWD: struc(["investorIx", "index"], [["hash", "hash", true]]),
  }, 
  btc: { 
    constants: struc(["name"], [["name", "name", true]]), 
    transactions: struc(["hash"], [["hash", "hash", true]])
  } 
});
//L({tables}); L({tableStrucMap});

class IndexedDB {
  constructor(name) { this.name = name;
    this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB; 
    this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange; 
  }

  async init() { L("Initializing db.")
    this.db = await new Promise((resolve, reject) => A(this.indexedDB.open(this.name, 15), { onerror: e => reject(`DB Error: ${e.target.error}`), onsuccess: e => { L("DB opened."); resolve(e.target.result); },
      onupgradeneeded: e => (async () => { let db = e.target.result; L("Upgrading db.");
        await Promise.all((V(tableStrucMap)).map((({table, keyPath, indices}) => new Promise((resolve, reject) => { L(`Creating table '${table}'`);
          let os = db.createObjectStore(table, { keyPath });
          oA(indices).forEach(i => os.createIndex(i[0], i[1], { unique: i[2] }));
          os.transaction.oncomplete = () => { L(`Object store created: ${L(K(os))}`); resolve(os) };
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
  add(table, data) { return this.act(table, "add",  data, () => data); }
  put(table, data) { return this.act(table, "put", data, () => data); } 
  count(table) { return this.act(table, "count", undefined, e => e.target.result); } 
  get(table, data) { return this.act(table, "get", [data[tableStrucMap[table].keyPath[0]]], e => e.target.result); 
}

  async write(table, data) { return await this.get(table, data).catch(() => this.add(table, data)).then(() => this.put(table, data)) } 
}

class Data {
  constructor() { let i = A(this, { investorData: {}, observers: {}, data: {}, idb: new IndexedDB("42") }); 
    (async () => { await this.idb.init(); 
      await Promise.all([...arrays.map(l => this.updateSimpleArray(l)), ...indexMaps.map(l => this.updateSimpleArray(l, `${l}Length`)),
        ...btcFields.map(name => this.getData(tables.btc.constants, { name }, async () => ({ name, value: await btcRpc("GET", `get${name}`) }))),
        ...ethBasicFields.map(name => this.getData(tables.eth.constants, { name }, async () => ({ name, value: await amfeixC.methods[name]().call() }))),
//        (async () => {  
//          let timeData = await amfeixC.methods.getAll().call(); 
  //        let data = []; 
    //      for (var x = 0, l = timeData[1].length, acc = 100 * this.getFactor(); x < l; ++x) data.push((acc += parseInt(timeData[1][x]))/this.getFactor()); 
  //        let td = data.map((d, i) => [parseInt(timeData[0][i]), d]); 
  //        setEthData("timeData", td);
    //      setEthData("roi", td[td.length - 1][1] - 100);
      //    setEthData("dailyChange", parseInt(L(timeData[1][timeData[1].length - 1]))/L(this.getFactor())); 
  //      })()
      ]);  
      await Promise.all([...investorMaps.map(m => this.updateInvestorMappedArray(m))]);
    })();
  }
/*
  async getArrayLengthAndStartIndex(lengthName) {
    let length = lengthName ? oO(await this.getData(countTable, { name: lengthNameKey }, async () => ({ name: lengthNameKey, value: (await amfeixC.methods[(lengthName)](...oA(parms)).call()) }))).value : undefined; 
    let startIndex = oO(await this.getData(countTable, { name: startIndexName })).value || 0;
    return { length, startIndex };
  }*/

  async updateInvestorMappedArray({ countTable, dataTable }) {

  }

  async updateSimpleArray(arrayName, lengthName) { return await this.updateArray(arrayName, tables.eth.constants, lengthName); }  
  async updateArray(arrayName, countTable, lengthName, parms) { L(`updateArray(${arrayName}, ${countTable}, ${lengthName}, ${S((parms))})`);
    let lengthNameKey = lengthName || `${arrayName}.length`; 
    let startIndexName = `${lengthNameKey}.startIndex`; 
    let length = lengthName ? oO(await this.getData(countTable, { name: lengthNameKey }, async () => ({ name: lengthNameKey, value: (await amfeixC.methods[(lengthName)](...oA(parms)).call()) }))).value : undefined; 
    let startIndex = oO(await this.getData(countTable, { name: startIndexName })).value || 0;
    L(`Array '${arrayName}' start index: ${startIndex} (${length ? `known length = ${length}` : 'unknown length'})`)
    try { for (var index = startIndex; !D(length) || (index < length); index++) {
      let data = await amfeixC.methods[arrayName](...oA(parms), index).call();
      await this.setData(tables.eth[arrayName], { index, data }); 
      await this.setData(countTable, { name: startIndexName, value: index + 1 });
    } } catch { L(`Array ${arrayName} stopped at ${index}.`) } 
    L(`Array '${arrayName}' update completed with ${index} entries (count = ${await this.idb.count(tables.eth[arrayName])}).`);
  }

  addObserver(key, onChange, context) { //L(`addObserver(${(key)})`);
    (this.observers[key] = oA(this.observers[key])).push({ onChange, context });
    onChange(this[key], context);
  }

  getKey(table, data) { return (`${table}:[${tableStrucMap[table].keyPath.map(a => data[a]).join(",")}]`) }

  async getData(table, data, retriever) { let key = this.getKey(table, data);
    return this.data[key] = (this.data[key]) || (await this.idb.get(table, data)) || (retriever && (await this.setData(table, (await retriever()))));
  }

  setData(table, data) { let key = this.getKey(table, data);
    this.data[key] = data;
    let obs = oA(this.observers[key]);
    let retain = obs.map(o => o.onChange(data, o.context));
    if (retain.length > 0) this.observers[key] = obs.filter((o, i) => retain[i]);  
    return this.idb.write(table, data); 
  }
  
  retrieveInvestorData(investor) { (async (investor) => { //L(`Retrieving investor ${investor} data`);
    let setData = (k, d) => this.setData(`eth/investorData/${investor}.${k}`, d);
    let toObj = a => F(a.map(e => [e.txId, e]));
    let dedup = d => V(toObj(d)); // XXX: does not check if duplicates are identical -- only retains one of them with same txId 
    let txs = []; (await this.getList("ntx", "fundTx", [investor]));  
    let data = { ...F(["deposit", "withdrawal"].map((k, i) => [k, dedup(txs.filter(x => x.action === S(i)))])), withdrawalRequest: dedup(await this.getList("rtx", "reqWD", [investor])) }
    let objs = F(E(data).map(([k, v]) => [k, toObj(v)]));
    let has = F(E(objs).map(([k, v]) => [k, x => D(v[x.txId])]));  
    let g = { 
      deposits: data.deposit.map(d => ({...d, hasWithdrawalRequest: has.withdrawalRequest(d) })), 
      withdrawalRequests: data.withdrawalRequest.filter(x => has.deposit(x) && !has.withdrawal(x)), 
      withdrawals: data.withdrawal.filter(x => has.deposit(x) && has.withdrawalRequest(x)) 
    };
    K(g).forEach(k => setData(k, g[k]));
    let allTxIds = g.deposits.map(d => d.txId); 
    g.bitcoinTxs = F(await Promise.all(allTxIds.map(async txId => [txId, 
       (oA((oO((await btcRpc("POST", 'getrawtransaction', [txId, true])).result)).vout).map(({value, scriptPubKey: {addresses}}) => ({value, address: addresses[0]}))
         .filter(x => this.data.fundDepositAddresses.includes(x.address)).map(x => x.value))])));
    setData("bitcoinTxs", g.bitcoinTxs);

    // Compute cumulative investment
//    let btcValueToBN = v => { let p = v.indexOf("."); let ten = new BN(10);
  //    let int = (new BN(v.substr(0, p), 10)).mul(ten.pown()), fracS = v.substr(p + 1), fracLength = fracS.length(), frac = (new BN(fracS, 10)).mul(ten.pown(18 - fracLength));
    //  frac = 
   // }
    return (g);
  })(investor); }

  getFactor() { return Math.pow(10, this.data.decimals); } 
  getInvestorData(investor) { return this.investorData[investor] = D(this.investorData[investor]) ? this.investorData[investor] : this.retrieveInvestorData(investor); }
}

let data = new Data();

export { ethInterfaceUrl, btcRpcUrl, btcFields, ethBasicFields, data, amfeixFeeFields };