import Web3 from 'web3';
import BN from 'bn.js';
import amfeixCjson from './amfeixC.json'; 
import { A, D, E, F, H, K, L, S, U, V, oA, oO, oF, isO, isA } from './tools'; 
import { IndexedDB } from './db';

let newDB = false //|| true; 

const btcRpcUrl = `http://157.245.35.34/`, 
ethInterfaceUrl = "ws://46.101.6.38/ws"; 
//ethInterfaceUrl = "http://46.101.6.38:8547/"; 
//const web3 =  new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
const web3 = new Web3(new (ethInterfaceUrl.indexOf("ws://") === 0 ? Web3.providers.WebsocketProvider : Web3.providers.HttpProvider)(ethInterfaceUrl));
const amfeixC = new web3.eth.Contract(amfeixCjson.abi, "0xb0963da9baef08711583252f5000Df44D4F56925"); 
const amfeixM = amfeixC.methods;

let amfeixFeeFields = "fee1 fee2 fee3".split(" ");
let invMap = (countTable, dataTable) => ({countTable, dataTable});
let arrays = "investorsAddresses time amount".split(" "), indexMaps = "feeAddresses fundDepositAddresses".split(" "), investorMaps = [invMap("ntx", "fundTx"), invMap("rtx", "reqWD")]; 
let ethBasicFields = "owner aum decimals btcPrice".split(" ").concat(amfeixFeeFields).concat(indexMaps.map(k => `${k}Length`));
const btcFields = "blockcount connectioncount difficulty blockchaininfo".split(" ");

let btcRpc = async (method, func, params) => ((await fetch(`${btcRpcUrl}${func}/${method === "GET" ? `?${E(oO(params)).map(x => x.map(encodeURIComponent).join("=")).join("&")}` : ''}`, 
 { method, mode: 'cors', headers: { "content-type": "application/json" }, ...(method === "POST" ? { body: S({params}) }: {}) })).json());

export let tableStrucMap = {}
let hierName = (o, p) => F(E(o).map(([k, v]) => { let q = p ? [p, k].join("-") : k; return [k, isA(v) ? (tableStrucMap[q] = {...v[0], table: q}, q) : hierName(v, q)]; }));
let struc = (keyPath, indices) => [{ keyPath, indices }];
let tables = hierName({ 
  eth: { ...F(arrays.concat(indexMaps).map(k => [k, struc(["index"])])), 
    constants: struc(["name"], [["name", "name", true]]), 
    ntx: struc(["investorIx"]), fundTx: struc(["investorIx", "index"]),
    rtx: struc(["investorIx"]), reqWD: struc(["investorIx", "index"]),
  }, 
  btc: { 
    constants: struc(["name"], [["name", "name", true]]), 
    ntx: struc(["investorIx"]), fundTx: struc(["investorIx", "index"]),
    rtx: struc(["investorIx"]), reqWD: struc(["investorIx", "index"]) 
  } 
});

class Data {
  constructor() { 
    this.localData = (d => d ? L(JSON.parse(d)) : { dbix: 60 })((localStorage.getItem("_")));
    if (newDB) this.localData.dbix++;
    let i = A(this, { tables, tableStrucMap, investorData: {}, observers: {}, data: {}, idb: new IndexedDB(S(this.localData.dbix)) }); 
//    this.localData = { dbix: 63 };
    (this.saveLocalData = () => localStorage.setItem("_", S(this.localData)))();

    this.loadProgress = {};
    let onLoadProgress = name => d => { this.loadProgress[name] = d; this.fireObservers("loadProgress", this.loadProgress); };
    (async () => { await this.idb.init(); 
      L('Load phase 0: Single shots for simple arrays on fresh DB');
      await Promise.all([this.loadTimeDataSingleShot(onLoadProgress("timeData")), this.loadInvestorsAddressesSingleShot(onLoadProgress("allInvestors"))]);
      L('Load phase 1: Constants, investor addresses, fund chart (time/amount)')
      await Promise.all([...arrays.map(l => this.updateSimpleArray(onLoadProgress(l), l)), ...indexMaps.map(l => this.updateSimpleArray(onLoadProgress(l), l, `${l}Length`)),
        ...btcFields.map(name => this.getData(tables.btc.constants, { name }, async () => ({ name, value: await btcRpc("GET", `get${name}`) }))),
        ...ethBasicFields.map(name => this.getData(tables.eth.constants, { name }, async () => ({ name, value: await amfeixC.methods[name]().call() }))),
//        (async () => {  
//          let timeData = await amfeixC.methods.getAll().call(); 
  //        let data = []; 
    //      for (let x = 0, l = timeData[1].length, acc = 100 * this.getFactor(); x < l; ++x) data.push((acc += parseInt(timeData[1][x]))/this.getFactor()); 
  //        let td = data.map((d, i) => [parseInt(timeData[0][i]), d]); 
  //        setEthData("timeData", td);
    //      setEthData("roi", td[td.length - 1][1] - 100);
      //    setEthData("dailyChange", parseInt(L(timeData[1][timeData[1].length - 1]))/L(this.getFactor())); 
  //      })()
      ]);  
      L('Load phase 1 done.');
      for (let t of "investorsAddresses fundDepositAddresses feeAddresses".split(" ").map(k => tables.eth[k])) await this.setData(t, (await this.idb.getAll(t)), true);
      L('Load phase 2: Deposits, withdrawals, withdrawal requests');
      await Promise.all([...investorMaps.map(m => this.updateInvestorMappedArray(onLoadProgress(`investors:${m.dataTable}`), m))]);
      L('Load phase 3: Bitcoin transactions');
      await Promise.all([...investorMaps.map(m => this.updateBitcoinTxs(onLoadProgress(`btcTx:${m.dataTable}`), m))]);
    })();
  }

  async loadTimeDataSingleShot(onLoadProgress) { let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    let length;
    if ((await sIx("time") === 0) && (await sIx("amount") === 0)) {
      this.updateLoadProgress(onLoadProgress, 0);
      let timeData = await amfeixM.getAll().call();
      length = timeData[0].length;
      for (let index = 0; index < length; ++index) {
        await Promise.all(["time", "amount"].map(t => this.setData(tables.eth[t], { index, data: timeData[index] }))).then(() => {
          return Promise.all(["time", "amount"].map(name => this.setData(tables.eth.constants, {...countKey(name), startIndex: index + 1 })));
        }); 
        this.updateLoadProgress(onLoadProgress, index, length);
        
      }
      this.updateLoadProgress(onLoadProgress, length, length, true);
    }
  }

  async loadInvestorsAddressesSingleShot(onLoadProgress) { let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    let length;
    if ((await sIx("investorsAddresses") === 0)) {
      this.updateLoadProgress(onLoadProgress, 0);
      let investorsAddresses = await amfeixM.getAllInvestors().call();
      length = investorsAddresses.length;
      for (let index = 0; index < length; ++index) {
        await this.setData(tables.eth.investorsAddresses, { index, data: investorsAddresses[index] }); 
        await this.setData(tables.eth.constants, {...countKey("investorsAddresses"), startIndex: index + 1 });
        this.updateLoadProgress(onLoadProgress, index, length);
      }
      this.updateLoadProgress(onLoadProgress, length, length, true);
    }
  }

  async getArrayLengthAndStartIndex(onLoadProgress, countTable, countKey, lengthName, parms) { //L(`galsi(${countTable}, ${S(countKey)}, ${lengthName}, ${parms})`)
    onLoadProgress({ msg: "Starting...", p: undefined });
    let alsi = oO(await this.getData(countTable, countKey, lengthName && (async () => ({ ...countKey, length: parseInt(await amfeixM[lengthName](...oA(parms)).call()) }))));
    this.updateLoadProgress(onLoadProgress, alsi.startIndex, alsi.length);
    //L(`galsi(${countTable}, ${S(countKey)}, ${lengthName}, ${parms}) ==> ${S({ length, startIndex })}`) 
    return ({ startIndex: 0, ...alsi });
  } 

  updateLoadProgress(onLoadProgress, index, length, fin) { //L({index ,length})
    onLoadProgress({ msg: `${index}${D(length) ? `/${length}` : (fin ? `/${index}` : '')}`, p: D(length) && (index/length)});
  }

  async updateGenericArray(onLoadProgress, name, { length, startIndex }, countKey, countTable, dataTable, parms) {
    //L(`Array '${name}' ${S({ countTable, dataTable })} start index: ${startIndex} (${length ? `known length = ${length}` : 'unknown length'})`)
    this.updateLoadProgress(onLoadProgress, startIndex, length);
    let index = startIndex;
    let catchWrap = p => p.catch(e => { throw L(e) });
    let masterKeys = F(tableStrucMap[dataTable].keyPath.map(k => [k, countKey[k]]));
    try { while (!D(length) || (index < length)) { //L(`Processing item ${index} for ${name} (${dataTable}) with parms = ${S(parms)}`);
      let data = await (amfeixM[name](...oA(parms), index).call()); //L('C');
      await this.setData(dataTable, ({ ...masterKeys, index, data })); //L('D');
      await this.setData(countTable, ({ ...countKey, startIndex: ++index, length })); //L('I'); 
      this.updateLoadProgress(onLoadProgress, index, length);
    } } catch {} // { L(`Array ${name} stopped at ${index}.`) } 
    this.updateLoadProgress(onLoadProgress, index, length, true);
    //L(`Array '${name}' update completed with ${index} entries (count = ${await this.idb.count(dataTable )})`);
  }

  async updateInvestorMappedArray(onLoadProgress, { countTable, dataTable }) { //L(`uima(${name}, ${countTable}, ${dataTable})`);
    let { startIndex, length, investorMapCountKey } = await this.getInvestorMapUpdateCountData(countTable, dataTable, `eth`, tables.eth.investorsAddresses);
    let investorIx = startIndex;
    L(`updateInvestorMappedArray ${investorIx}/${length}`);
    while (investorIx < length) { let countKey = { investorIx };
      let investor = await this.getData(tables.eth.investorsAddresses, { index: investorIx });
      if (investor) { let parms = [investor.data]; 
        this.updateLoadProgress(onLoadProgress, investorIx, length);
        let alsi = await this.getArrayLengthAndStartIndex(() => {}, tables.eth[countTable], countKey, countTable, parms);
        await this.updateGenericArray(() => {}, dataTable, (alsi), countKey, tables.eth[countTable], tables.eth[dataTable], parms);
        await this.setData(tables.eth.constants, ({...investorMapCountKey, startIndex: investorIx + 1 }));
      } else { L(`Investor = falsy at @ ${investorIx} for ${dataTable}`); break; }
      ++investorIx;
    }
    this.updateLoadProgress(onLoadProgress, investorIx, length, true);
  }

  async getInvestorMapUpdateCountData(countTable, dataTable, type, lengthTable) {
    let investorMapCountKey = { name: `${countTable}-${dataTable}.counts` };
    let length = await this.idb.count(lengthTable);
    let startIndex = oO(await this.getData(tables[type].constants, investorMapCountKey)).startIndex || 0;
    return { startIndex, length, investorMapCountKey };
  }

  async updateBitcoinTxs(onLoadProgress, { countTable, dataTable }, countKeyName) { //L(`uima(${name}, ${countTable}, ${dataTable})`);
    let { startIndex, length, investorMapCountKey } = await this.getInvestorMapUpdateCountData(countTable, dataTable, `btc`, tables.eth[dataTable]);
    let index = startIndex;  
    L('Getting all...')
    let fundDepositAddresses = ((await this.getData((tables.eth.fundDepositAddresses), null, U, true)).map(d => d.data));
    for (let d of (await this.idb.getAll(tables.eth[dataTable])).slice(index)) { let key = { investorIx: d.investorIx, index: d.index };
      await this.getData(tables.btc[dataTable], key, async () => {
        let value = ((oA((oO((await btcRpc("POST", 'getrawtransaction', [d.data.txId, true])).result)).vout).map(({value, scriptPubKey: {addresses}}) => ({value, address: addresses[0]}))
        .filter(x => fundDepositAddresses.includes(x.address)).map(x => x.value))[0]);
        return ({ ...key, value });
      }); 
      await this.setData(tables.btc.constants, {...investorMapCountKey, startIndex: index + 1 });
      this.updateLoadProgress(onLoadProgress, index, length);
      index++; 
    }
    this.updateLoadProgress(onLoadProgress, index, length, true);
    L('done');
  }

  updateSimpleArray(onLoadProgress, name, lengthName) { return this.updateArray(onLoadProgress, name, tables.eth.constants, lengthName); }  
  async updateArray(onLoadProgress, arrayName, countTable, lengthName, parms) { //L(`updateArray(${arrayName}, ${countTable}, ${lengthName}, ${S((parms))})`);
    let countKey = { name: lengthName || `${arrayName}.counts` }; 
    let alsi = (await this.getArrayLengthAndStartIndex(onLoadProgress, countTable, countKey, lengthName, parms)); 
    await this.updateGenericArray(onLoadProgress, arrayName, alsi, countKey, countTable, tables.eth[arrayName], parms);
  }

  addObserver(key, onChange, context) { //L(`addObserver(${(key)})`);
    (this.observers[key] = oA(this.observers[key])).push({ onChange, context });
    onChange(this[key], context); 
  }

  addDataObserver(table, data, onChange, context) { //L(`addObserver(${(key)})`);
    this.addObserver(L(this.getKey(table, oO(data))), onChange, context);
    return this.getData(table, data, false, true);
  }

  getKey(table, data) { return (`${table}${isO(data) ? `:[${tableStrucMap[table].keyPath.map(a => data[a]).join(",")}]` : ''}`) }

  setData(table, data, noIDB) { let key = this.getKey(table, data);
    this.fireObservers(key, this.data[key] = data);
    return noIDB ? data : this.idb.write(table, data);  
  }
  async getData(table, data, retriever, noIDB) { let key = this.getKey(table, data);
    return this.data[key] = (this.data[key]) || (!noIDB && await this.idb.get(table, data)) || (retriever && (await this.setData(table, await retriever(), noIDB)));
  }

  fireObservers(key, data) { let obs = oA(this.observers[key]);
    let retain = obs.map(o => o.onChange(data, o.context));
    if (retain.length > 0) this.observers[key] = obs.filter((o, i) => retain[i]);  
    return data;
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