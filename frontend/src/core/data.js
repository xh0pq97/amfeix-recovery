import Web3 from 'web3';
import BigNumber from 'bignumber.js'; 
import amfeixCjson from '../amfeixC.json'; 
// eslint-disable-next-line
import { A, D, E, F, G, H, I, K, L, S, T, U, V, oA, oO, oF, isO, isA, singleKeyObject, makeEnum } from '../tools'; 
import { IndexedDB } from './db'; 
import { Persistent } from './persistent';
let BN = (v, b) => new BigNumber(v, b);

let newDB = false;//true;  

let stati = { Deposits: makeEnum("Active Withdrawn Withdrawal_Requested"), Withdrawal_Requests: makeEnum("Pending Processed") }; 

let hostname = window.location.hostname;
hostname = (hostname === "localhost") ? "spacetimemanifolds.com" : hostname;
const btcRpcUrl = `https://btc.${hostname}/`; //`http://157.245.35.34/`, 
const ganacheInterfaceUrl = `https://eth.${hostname}:8545`;
const ethInterfaceUrl = `https://eth.${hostname}/`; //"ws://46.101.6.38/ws"; 
//ethInterfaceUrl = "http://46.101.6.38:8547/"; 
//const web3 =  new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
let amfeixAddress = "0xb0963da9baef08711583252f5000Df44D4F56925";

let coin = BN(10).pow(18);
let b64ToHex = v => Buffer.from(v, 'base64').toString('hex');
let decodeFundDeposit = ([timestamp, amountX, transactionX, pubKeyX]) => 
  ({timestamp, value: BN(b64ToHex(amountX), 16).div(coin).toString(), txId: b64ToHex(transactionX), pubKey: b64ToHex(pubKeyX)});

class AmfeixContract {
  constructor(url) { this.setWeb3Url(url); }

  setWeb3Url(url) { 
    this.url = url;
    this.web3 = new Web3(new (ethInterfaceUrl.indexOf("ws://") === 0 ? Web3.providers.WebsocketProvider : Web3.providers.HttpProvider)(this.url)); 
    this.amfeixC = new this.web3.eth.Contract(amfeixCjson.abi, amfeixAddress); 
    this.amfeixM = () => this.amfeixC.methods;
    this.queuedOps = [];
    this.processing = false;
    this.inFlight = 0;
    this.maxInFlight = 32;
    this.nextIx = 0;
  }

  queueOp(method, params, onSuccess, onError) {
    this.queuedOps.push({ method, params, onSuccess, onError });
    this.processIfIdle();
  }

  async execute(op) {
    try {
      return await w3.amfeixM()[op.method](...oA(op.params)).call();
    } catch(err) { return { err } }
  }

  startNextOp() {// L('startNextOp');
    if ((this.inFlight < this.maxInFlight) && (this.nextIx < this.queuedOps.length)) { 
     // L(`Starting op ${this.nextIx} (in flight = ${this.inFlight}) queued = ${this.queuedOps.length}`);
      let activeIx = this.nextIx++;
      let op = this.queuedOps[activeIx];
      let onProcessed = () => {// L(`onProcessed ${activeIx}`);
        this.queuedOps[activeIx] = U;
/*        if (this.nextIx === this.queuedOps.length) {
          this.queuedOps = [];
          this.nextIx = 0;
          this.processing = false;
        } */
        this.inFlight--;
        this.startNextOp();
      }; 
//      let onProcessed = I;
      this.inFlight++;
        op.promise = this.execute(op).then(d => { I('then'); onProcessed(); oF(d.err ? op.onError : op.onSuccess)(d); }) 
        ;
      this.startNextOp();
    } else if (this.inFlight === 0) {
      this.queuedOps = [];
      this.nextIx = 0;
      this.processing = false;
      }
  }

  processIfIdle() {// L('processIfIdle');
    if (!this.processing) {
      this.processing = true;
      this.startNextOp();
    }
  }

  async flush() { //L('flush');
    while (this.queuedOps.length > 0) { //L(`flush: ${this.queuedOps.length}`)
      try { await Promise.all(this.queuedOps.filter(I).map(x => x.promise).filter(I)); }
      catch(err) { throw err; }
    }
    this.queuedOps = [];
    this.nextIx = 0;
    this.processing = false;
  }
}
let w3 = new AmfeixContract(ethInterfaceUrl);

let amfeixFeeFields = "fee1 fee2 fee3".split(" ");
let invMap = (countTable, dataTable) => ({countTable, dataTable});
let timeAndAmount = T("time amount"), arrays = ["investorsAddresses"].concat(timeAndAmount), indexMaps = T("feeAddresses fundDepositAddresses"), investorMaps = [invMap("ntx", "fundTx"), invMap("rtx", "reqWD")]; 
let ethBasicFields = T("owner aum decimals btcPrice").concat(amfeixFeeFields).concat(indexMaps.map(k => `${k}Length`));
const btcFields = T("blockcount connectioncount difficulty blockchaininfo");

let btcRpc = async (method, func, params) => ((await fetch(`${btcRpcUrl}${func}/${method === "GET" ? `?${E(oO(params)).map(x => x.map(encodeURIComponent).join("=")).join("&")}` : ''}`, 
 { method, mode: 'cors', headers: { "content-type": "application/json" }, ...(method === "POST" ? { body: S({params}) }: {}) })).json());

let invMapDBStruc = ({countTable, dataTable}) => ({ ...singleKeyObject(countTable, struc(["investorIx"])), ...singleKeyObject(dataTable, struc(["investorIx", "index"])) })
 
export let tableStrucMap = {}
let hierName = (o, p) => F(E(o).map(([k, v]) => { let q = p ? [p, k].join("-") : k; return [k, isA(v) ? (tableStrucMap[q] = {...v[0], table: q}, q) : hierName(v, q)]; }));
let struc = (keyPath, indices) => [{ keyPath, indices }];
let tables = hierName({ 
  eth: { constants: struc(["name"], [["name", "name", true]]), ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1]),
  ...F(T("time amount").concat(indexMaps).map(k => [k, struc(["index"])])), investorsAddresses: struc(["index"], [["data", "data", true]])  }, 
  btc: { constants: struc(["name"], [["name", "name", true]]), ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1]) } 
});

class Observer {  
  constructor(observable, onChange, context, index) { A(this, { observable, onChange, context, index }); }
  detach() { this.observable.remove(this); } 
}

class Observable { 
  constructor() { A(this, { observers: {}, observerIx: 0 }) } 
  watch(key, onChange, context) { let obs = new Observer(this, onChange, context, this.observerIx++); 
    (this.observers[key] = oA(this.observers[key])).push(obs); 
    if (D(this.data[key])) obs.onChange(this.data[key], context);
    return obs; 
  }
  observe(key, data) { oA(this.observers[key]).forEach(o => o.onChange(data, o.context)); return data; }
  remove(obs) { if (D(this.observers[obs.index])) delete this.observers[obs.index]; }
}

class SyncCache extends Observable {
  constructor() { super(); A(this, { data: {} }) }
  setData(key, data) { this.observe(key, this.data[key] = data); return data; } //  L(`syncCache.setData(${key}, ${S(data)})`);
  getData(key, retriever) { return this.data[key] = (D(this.data[key]) ? this.data[key] : (retriever && this.observe(key, retriever()))) }
}

let constantFields = { btc: btcFields, eth: ethBasicFields };
let constantRetrievers = { 
  btc: name => async () => ({ name, value: await btcRpc("GET", `get${name}`) }),
  eth: name => async () => ({ name, value: await w3.amfeixM()[name]().call() })
}

let schedule = (action, interval) => {
  let perform = async () => {
    await action();
    setTimeout(() => schedule(action, interval), interval);
  };
}

let timeFunc = async f => {
  let startTime = Date.now();
  let result = await f();
  return { result, time: Date.now() - startTime };
}
 
let getInvestorDataKey = investor => `investor_${investor.data}`;
let getInvestorWalletDataKey = investor => `investor_Wallet_${investor.btcAddress}`;
let getInvestorWithdrawTxDataKey = investor => `investor_WithdrawTx_${investor.btcAddress}`;

class Data extends Persistent {
  constructor() { super("data", ["localData"], { localData: { dbix: 173 } }); L('Creating Data class instance.');
    //this.localData = (d => d ? L(JSON.parse(d)) : { dbix: 60 })((localStorage.getItem("_")));
    if (newDB) this.localData.dbix++; 
    A(this, { tables, tableStrucMap, investorData: {}, observers: {}, data: {}, loadProgress: {}, syncCache: new SyncCache(), idb: new IndexedDB(S(this.localData.dbix)), adminLoadInitiated: false }); 
    for (let q = 0; q < this.localData.dbix; ++q) this.idb.deleteDB(S(q));
    this.persist(); 
     
    (async () => { await this.idb.init(); this.syncCache.setData("dbInitialized", true); await this.genericLoad(); })(); 
    this.onLoadProgress = name => d => { this.loadProgress[name] = d; this.syncCache.setData("loadProgress", this.loadProgress); };
//    this.onLoadMsg = msg => this.onLoadProgress("Phase");
  }

  runWhenDBInitialized(f) { let obs = this.syncCache.watch("dbInitialized", () => { f(); obs.detach(); }) }

  async basicLoad() { 
    this.onLoadProgress('Basic load phase')('Load phase 0: Single shots on fresh DB for fund index chart data');
    await this.loadTimeDataSingleShot(this.onLoadProgress("Fund Index chart"));
    this.onLoadProgress('Basic load phase')('Load phase 1: Constants, fee and fund addresses, fund index chart data (deltas)');
    await Promise.all([...timeAndAmount.map(l => this.updateSimpleArray(this.onLoadProgress(`Fund Index chart (${l})`), l)),
      ...indexMaps.map(l => this.updateSimpleArray(this.onLoadProgress(l), l, `${l}Length`)),
      ...E(constantFields).map(([t, f]) => f.map(name => this.getData(tables[t].constants, { name }, constantRetrievers[t](name)))).flat()]);  
    await this.updateSyncCache();
    this.computeTimeDataFromTimeAndAmount();
    this.onLoadProgress('Basic load phase')('Done');
  }

  async updateSyncCache() {
    for (let t of T("investorsAddresses fundDepositAddresses feeAddresses").concat(timeAndAmount)) this.syncCache.setData(t, await this.idb.getAll(tables.eth[t]));
    for (let t in constantFields) for (let name of constantFields[t]) this.syncCache.setData(name, oO(await this.getData(tables[t].constants, { name })).value);
  }

  async updateRegisteredTransactions() {
    await this.updateInvestorRegisteredEthTransactions();
    await this.updateInvestorRegisteredBtcTransactions();
  }
  async updateInvestorRegisteredEthTransactions() { await Promise.all(investorMaps.map(m => this.updateInvestorMappedArray(this.onLoadProgress(`Smart contract registered transactions: ${m.dataTable}`), m))); }
  async updateInvestorRegisteredBtcTransactions() { await Promise.all(investorMaps.map(m => this.updateBitcoinTxs(this.onLoadProgress(`Bitcoin transactions: ${m.dataTable}`), m))); }

  async genericLoad() { 
    await this.basicLoad();
    await this.updateRegisteredTransactions(); 
    await this.computeData();
  }

  async computeData() {
    let fundDeposits =  this.syncCache.getData("fundDeposits");
    let processedDepositsTxIds = [];
    this.investors = {};
    this.withdrawalRequests = [];
    let investorsAddresses = this.syncCache.getData("investorsAddresses"); let olp = this.onLoadProgress("Computing data structures");
    this.loadProgress.Compute_investorData = (await timeFunc(async () => {
      for (let ix = 0; ix < investorsAddresses.length; ++ix) { this.updateLoadProgress(olp, ix, investorsAddresses.length);
        let investor = await this.retrieveInvestorData(investorsAddresses[ix]);
        let i = { index: investorsAddresses[ix].index, address: investorsAddresses[ix].data, investmentValue: investor.investmentValue, Withdrawal_Requests: investor.Withdrawal_Requests };
        this.investors[i.index] = i;
        this.withdrawalRequests.push(i.Withdrawal_Requests);
        processedDepositsTxIds.push(investor.Deposits.map(d => d.txId));
      } 
    })).time; 
    this.syncCache.setData("investors", V(this.investors));
    this.syncCache.setData("withdrawalRequests", this.withdrawalRequests.flat());
    let pendingDeposits;
    this.loadProgress.Compute_pending_deposits = (await timeFunc(() => { 
      processedDepositsTxIds = processedDepositsTxIds.flat();
      pendingDeposits = G(fundDeposits, v => v.filter(d => !processedDepositsTxIds.includes(d.txId))); 
    })).time; 
    this.syncCache.setData("pendingDeposits", pendingDeposits);
    L({pendingDeposits});
    this.updateLoadProgress(olp, investorsAddresses.length, investorsAddresses.length);
  };

  async adminLoad() { 
    if (!this.adminLoadInitiated) {
      this.adminLoadInitiated = true;
      this.onLoadProgress('Admin phase')('Load phase 0: Investor addresses (one shot)');
      await this.loadInvestorsAddressesSingleShot(this.onLoadProgress("allInvestors"));
      this.onLoadProgress('Admin phase')('Load phase 1: Investor addresses (incremental))');
      await this.updateSimpleArray(this.onLoadProgress("investorsAddresses"), "investorsAddresses");  
      await this.updateSyncCache();
      this.computeTimeDataFromTimeAndAmount(); 
      await Promise.all([this.updateRegisteredTransactions(), this.loadFundDeposits()]); 
      await this.computeData();
    }
  }

  async registerInvestorAddress(address) { //L(`Registering investor address ${address}`);
    let investorsAddresses = await w3.amfeixM().getAllInvestors().call();
    let index = investorsAddresses.map(x => x.toLowerCase()).indexOf(address.toLowerCase());
    if (index >= 0) { let investor = { index, data: address }; L(`inv = ${S(investor)}`)
      await this.setData(tables.eth.investorsAddresses, investor);
      await Promise.all(investorMaps.map(m => this.updateInvestorArray(investor, m))); 
      await this.updateSyncCache();
      await this.updateRegisteredTransactions();
      await this.computeData();
      return investor;
    } 
  }

  async loadFundDeposits() {
    let fundDepositAddresses = (this.syncCache.getData("fundDepositAddresses").map(x => x.data));
    let fundDeposits = G((F(await Promise.all((fundDepositAddresses.map(async a => [a, oO(await btcRpc("GET", `getdeposits/toAddress/${a}`)).data]))))), v => v.map(decodeFundDeposit));
    this.syncCache.setData("fundDeposits", (fundDeposits));
    L('Loaded fund deposits');
  };

  async retrieveInvestorFundTxData(investor) {
    let key = this.getInvestorFundTxDataKey(investor);
    let cached = await this.syncCache.getData(key);
    if (D(cached)) return cached; 
    let fundDepositAddresses = (this.syncCache.getData("fundDepositAddresses").map(x => x.data));
    let fundDeposits = G((F(await Promise.all((fundDepositAddresses.map(async a => [a, oO(await btcRpc("GET", `getdeposits/toAddress/${a}`)).data]))))), v => v.map(decodeFundDeposit)); 
    this.syncCache.setData(key, (fundDeposits));
    L(`Loaded fund tx for investor ${S(investor)}`)
  }

  getFactor() { return BN(10).pow(this.syncCache.getData('decimals')); } 

  computeTimeDataFromTimeAndAmount() {
    let performance = [], [time, amount] = "time amount".split(" ").map(t => this.syncCache.getData(t)).map(y => y.map(x => x.data));  
    let f = this.getFactor(), ff = f.times(100);// L({factor: f})
    for (let x = 0, acc = BN(1.0); x < amount.length; ++x) performance.push([time[x], (acc = (acc.times((BN(amount[x])).plus(ff))).div(ff)).plus(0)]);  
    E(({ timeData: performance.map(([t, d]) => [1000*t, parseFloat(d.times(100).toString())]), roi: parseFloat(performance[performance.length - 1][1].times(100).minus(100).toString()), 
      dailyChange: parseFloat((BN(amount[amount.length - 1]).div(f)).toString()) }))
    .map(([k, v]) => this.syncCache.setData(k, v));
    this.performance = performance;
  }

  getPerformanceIndex(time, lowIndex, highIndex) { let p = this.performance;
    let low = lowIndex || 0, high = highIndex || (p.length - 1); // L(`gpi(${time}, ${low}, ${high})`)
    while (high > low) { let m = low + ((high - low) >> 1); 
      if (p[m][0] > time) { high = m; } else if (low < m) { low = m; } else break;
    }
    return high;
  }

  async loadTimeDataSingleShot(onLoadProgress) { let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    let length;
    if ((await sIx("time") === 0) && (await sIx("amount") === 0)) {
      let buf = this.idb.newBuffer();
      this.updateLoadProgress(onLoadProgress, 0);
      let timeData = await w3.amfeixM().getAll().call();
      length = timeData[0].length;
      for (let index = 0; index < length; ++index) {
        ["time", "amount"].forEach((t, i) => buf.write(tables.eth[t], { index, data: (i === 0 ? parseInt : I)(timeData[i][index]) }));
      }
      ["time", "amount"].forEach(name => buf.write(tables.eth.constants, {...countKey(name), startIndex: length }));
      let result = await buf.flush();
      this.updateLoadProgress(onLoadProgress, length, length, true);
    }
  }

  async loadInvestorsAddressesSingleShot(onLoadProgress) { let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    if ((await sIx("investorsAddresses") === 0)) {
      let buf = this.idb.newBuffer();
      this.updateLoadProgress(onLoadProgress, 0);
      let investorsAddresses = await w3.amfeixM().getAllInvestors().call();
      let length = investorsAddresses.length;
      investorsAddresses.forEach((data, index) => buf.write(tables.eth.investorsAddresses, { index, data }));
      buf.write(tables.eth.constants, {...countKey("investorsAddresses"), startIndex: length });
      await buf.flush(); 
      this.updateLoadProgress(onLoadProgress, length, length, true);
    }
  }

  async getArrayLengthAndStartIndex(onLoadProgress, countTable, countKey, lengthName, parms) { //L(`galsi(${countTable}, ${S(countKey)}, ${lengthName}, ${parms})`)
    onLoadProgress({ msg: "Starting...", p: undefined });
    let alsi = oO(await this.getData(countTable, countKey, lengthName && (async () => ({ ...countKey, length: parseInt(await w3.amfeixM()[lengthName](...oA(parms)).call()) }))));
    this.updateLoadProgress(onLoadProgress, alsi.startIndex, alsi.length);
    //L(`galsi(${countTable}, ${S(countKey)}, ${lengthName}, ${parms}) ==> ${S({ length, startIndex })}`) 
    return ({ startIndex: 0, ...alsi });
  } 

  updateLoadProgress(onLoadProgress, index, length, done) { onLoadProgress({ index, length: D(length) ? length : (done ? index : "unknown") }); }

  async updateGenericArray(onLoadProgress, name, { length, startIndex }, countKey, countTable, dataTable, parms, buf) {
    //L(`Array '${name}' ${S({ countTable, dataTable })} start index: ${startIndex} (${length ? `known length = ${length}` : 'unknown length'})`)
    this.updateLoadProgress(onLoadProgress, startIndex, length);
    let index = startIndex;
    //let catchWrap = p => p.catch(e => { throw L(e) });
    let localBuf = buf || this.idb.newBuffer();
    let masterKeys = F(oA(tableStrucMap[dataTable].keyPath).map(k => [k, countKey[k]]));
    try { while (!D(length) || (index < length)) { //L(`Processing item ${index} for ${name} (${dataTable}) with parms = ${S(parms)}`);
/*      let currentIx = index++;
      //L({currentIx})
      let error;
      w3.queueOp(name, [...oA(parms), currentIx], data => {
        localBuf.write(dataTable, ({ ...masterKeys, index: currentIx, data })); //L('D');
        this.updateLoadProgress(onLoadProgress, currentIx, length);
      }, err => { error = true;}); 
      if (!D(length)) await w3.flush();
      if (error) break;*/
      
      let data = await (w3.amfeixM()[name](...oA(parms), index).call()); //L('C');
      localBuf.write(dataTable, ({ ...masterKeys, index: index++, data })); //L('D');
      this.updateLoadProgress(onLoadProgress, index, length); 
      
    } } catch {} // { L(`Array ${name} stopped at ${index}.`) } 
    await w3.flush();
    localBuf.write(countTable, ({ ...countKey, startIndex: index, length })); //L('I'); 
    if (!D(buf)) await localBuf.flush();
    this.updateLoadProgress(onLoadProgress, index, length, true);
    //L(`Array '${name}' update completed with ${index} entries (count = ${await this.idb.count(dataTable )})`);
  }

  async updateInvestorArray(investor, { countTable, dataTable }, buf) { let countKey = { investorIx: investor.index }, parms = [investor.data]; 
    let alsi = await this.getArrayLengthAndStartIndex(() => {}, tables.eth[countTable], countKey, countTable, parms);
    await this.updateGenericArray(() => {}, dataTable, alsi, countKey, tables.eth[countTable], tables.eth[dataTable], parms, buf);
}
  async updateInvestorMappedArray(onLoadProgress, { countTable, dataTable }) { //L(`uima(${name}, ${countTable}, ${dataTable})`);
    let { startIndex, length, investorMapCountKey } = await this.getInvestorMapUpdateCountData(countTable, dataTable, `eth`, tables.eth.investorsAddresses);
    let ix = startIndex;
    //L(`updateInvestorMappedArray ${ix}/${length}`); 
    let investors = await this.idb.getAll(tables.eth.investorsAddresses);
//    L(`investors = ${S(investors)}`);
  //  L(`Math.min(length, investors.length) = ${Math.min(length, investors.length)}`)
    let localBuf = this.idb.newBuffer();
    while (ix < Math.min(length, investors.length)) {// let investor = investors[ix];
      this.updateLoadProgress(onLoadProgress, ix, length);
      await this.updateInvestorArray(investors[ix], { countTable, dataTable }, localBuf);
      ix++;
      if (localBuf.pendingOpsCount() >= 1024) await localBuf.flush();
    }
    await localBuf.flush();
    await this.setData(tables.eth.constants, ({...investorMapCountKey, startIndex: ix }));
  //  L(`updateInvestorMappedArray afer while ${ix}/${length}`); 
    this.updateLoadProgress(onLoadProgress, ix, length, true);
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
    let fundDepositAddresses = this.syncCache.getData("fundDepositAddresses").map(d => d.data);
    for (let d of (await this.idb.getAll(tables.eth[dataTable])).slice(index)) { let key = { investorIx: d.investorIx, index: d.index };
      await this.getData(tables.btc[dataTable], key, async () => {
        return ({ ...key, value:  ((oA((oO((await btcRpc("POST", 'getrawtransaction', [d.data.txId, true])).result)).vout).map(({value, scriptPubKey: {addresses}}) => ({value, address: addresses[0]}))
        .filter(x => fundDepositAddresses.includes(x.address)).map(x => x.value))[0]) });
      }); 
      await this.setData(tables.btc.constants, { ...investorMapCountKey, startIndex: index + 1 });
      this.updateLoadProgress(onLoadProgress, index, length);
      index++; 
    }
    this.updateLoadProgress(onLoadProgress, index, length, true);
    //L('done');
  }

  updateSimpleArray(onLoadProgress, name, lengthName) { return this.updateArray(onLoadProgress, name, tables.eth.constants, lengthName); }  
  async updateArray(onLoadProgress, arrayName, countTable, lengthName, parms) { //L(`updateArray(${arrayName}, ${countTable}, ${lengthName}, ${S((parms))})`);
    let countKey = { name: lengthName || `${arrayName}.counts` }; 
    let alsi = (await this.getArrayLengthAndStartIndex(onLoadProgress, countTable, countKey, lengthName, parms)); 
    await this.updateGenericArray(onLoadProgress, arrayName, alsi, countKey, countTable, tables.eth[arrayName], parms);
  } 

  getKey(table, data) { return (`${table}${isO(data) ? `:[${tableStrucMap[table].keyPath.map(a => data[a]).join(",")}]` : ''}`) }

  async setData(table, data) { return await this.idb.write(table, data); }
  async getData(table, data, retriever) { return (await this.idb.get(table, data)) || (retriever && (await this.setData(table, await retriever()))); } 

  async retrieveInvestorData(investor) { //L(`retrieveInvestorData = ${S(investor)}`);
    let cached = await this.syncCache.getData(getInvestorDataKey(investor));
    if (cached) return cached;
    if (!D(investor.index)) {
      L('finding index');
      let i = await this.idb.get(tables.eth.investorsAddresses, { data: investor.data }, "data", ["data"]);
      investor.index = oO(i).index;
      L(`returned ${S(i)}`)
    }
    let invKey = { investorIx: investor.index }; //L(`Retrieving investor ${investor} data`);
//    L(`invKey = ${S(invKey)}`);
    let ethDataMap = x => ({ timestamp: parseInt(x.timestamp), txId: x.txId, pubKey: x.pubKey, signature: x.signature, action: x.action });
    let dataMaps = { eth: x => ({index: x.index, ...ethDataMap(oO(x.data))}), btc: x => ({index: x.index, value: x.value}) }
    let getList = async m => { let length = ((oO(await this.idb.get((tables.eth[(m).countTable]), (invKey)))).length || 0);
      let [e, b] = await Promise.all(['eth', 'btc'].map(async t => {
        let buf = this.idb.newBuffer();
        let r  = []; 
        for (let index = 0; index < length; ++index) { r.push(U); buf.get(tables[t][m.dataTable], ({...invKey, index}), d => { r[index] = d; }); }
        await buf.flush(); 
        return r.map(oO).map(dataMaps[t]);
      }));
      for (let index = 0; index < length; ++index) e[index].value = b[index].value;
      return e;
    };
//    L(investorMaps);
    let [txs, reqWD] = await Promise.all(investorMaps.map(getList));
    let toObj = a => F(a.map(e => [e.txId, e]));
    let dedup = d => V(toObj(d)); // XXX: does not check if duplicates are identical -- only retains one of them with same txId  
    let data = { ...F(["Deposits", "Withdrawals"].map((k, i) => [k, dedup(txs.filter(x => x.action === S(i)))])), Withdrawal_Requests: dedup(reqWD) }
    let objs = G(data, toObj);
    let has = G(objs, v => x => D(v[x.txId]));  
    let g = ({ 
      Deposits: data.Deposits,// hasWithdrawalRequest: has.withdrawalRequest(d) })), 
      Withdrawal_Requests: data.Withdrawal_Requests.filter(x => has.Deposits(x) && !has.Withdrawals(x)), 
      Withdrawals: data.Withdrawals.filter(x => has.Deposits(x) && has.Withdrawal_Requests(x)) 
    });

    let investment = g.Deposits.concat(g.Withdrawals).sort((a, b) => a.timestamp - b.timestamp); 
    let acc = BN(0), currentValueAcc = BN(0);
    for (let d of g.Deposits) { d.status = ((has.Withdrawals(d)) ? stati.Deposits.Withdrawn : (has.Withdrawal_Requests(d) ? stati.Deposits.Withdrawal_Requested : stati.Deposits.Active));
      let endTimestamp = (oO(objs.Withdrawal_Requests[d.txId]) || oO(objs.Withdrawals[d.txId])).timestamp || 0;
      let endIx = (d.status === stati.Deposits.Active) ? this.performance.length - 1 : this.getPerformanceIndex(endTimestamp);
      let startIx = this.getPerformanceIndex(d.timestamp), startPerf = this.performance[startIx];
      let endPerf = this.performance[endIx][1];
      let perf = endPerf.div((startPerf[0] >= d.timestamp) ? startPerf[1] : endPerf);
      d.performance = perf.toString();
      d.finalValue = BN(d.value).times(perf);
      d.hasWithdrawalRequest = has.Withdrawal_Requests(d) ? "Yes" : "No";
      d.hasWithdrawal = has.Withdrawals(d) ? "Yes" : "No";
    }
    for (let wr of g.Withdrawal_Requests) wr.status = has.Withdrawals(wr) ? stati.Withdrawal_Requests.Processed : stati.Withdrawal_Requests.Pending;
    for (let i of investment) { let v = BN(i.value); 
      i.accValue = parseFloat((acc = (i.action === "0" ? acc.plus(v) : acc.minus(v))).plus(0).toString()); 
      i.accCurrentValue = parseFloat((currentValueAcc = (i.action === "0" ? currentValueAcc.plus(i.finalValue) : currentValueAcc.minus(v))).plus(0).toString()); 
    }
    g.investment = investment.map(x => [1000*x.timestamp, x.accValue]);
    g.investmentValue = parseFloat(currentValueAcc.toString());
    g.value = investment.map(x => [1000*x.timestamp, x.accCurrentValue]);;
    for (let d of g.Deposits) d.finalValue = d.finalValue.toString();
      //L(g);
    return this.syncCache.setData(getInvestorDataKey(investor), g);
  }

  getInvestorData(investor) { return this.investorData[investor] = D(this.investorData[investor]) ? this.investorData[investor] : this.retrieveInvestorData(investor); }
}

let data = new Data(); 
  
export { stati, ethInterfaceUrl, btcRpcUrl, btcFields, ethBasicFields, getInvestorDataKey, getInvestorWalletDataKey, w3, data, amfeixFeeFields, ganacheInterfaceUrl };