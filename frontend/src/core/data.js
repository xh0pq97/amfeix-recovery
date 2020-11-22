import Web3 from 'web3';
import amfeixCjson from '../amfeixC.json'; 
// eslint-disable-next-line
import { A, D, E, F, G, H, I, K, L, S, T, P, U, V, oA, oO, oF, isO, isA, isS, singleKeyObject, makeEnum } from '../tools'; 
import { IndexedDB } from './db'; 
import { Persistent } from './persistent';
import { BN }  from './bignumber';
import JSONBig from 'json-bigint'; 
import Accounts from 'web3-eth-accounts';
//import aggregate from './aggregate.js';
import aggregate from '@makerdao/multicall/src/aggregate';
import { pubKeyToEthAddress, pubKeyToBtcAddress } from "./crypto";

let newDB = false //|| true;  

let stati = { Deposits: makeEnum("Active Withdrawn Withdrawal_Requested"), Withdrawal_Requests: makeEnum("Pending Processed") }; 

let anomalousInvestorIndexMap = F([2339, 74, 418, 419, 424, 464, 515, 3429, 515, 1061, 3428, 3429, 3437, 3438].map(i => [(i), true]));

let hostname = window.location.hostname;
hostname = (hostname === "localhost") ? "spacetimemanifolds.com" : hostname;
const btcRpcUrl = `https://btc.${hostname}/`; //`http://157.245.35.34/`,  
const ethInterfaceUrl = `https://eth.${hostname}/`; //"ws://46.101.6.38/ws"; 
const ethInterfaceUrls = [ethInterfaceUrl, ethInterfaceUrl + 'ganache/']; //"ws://46.101.6.38/ws"; 
//ethInterfaceUrl = "http://46.101.6.38:8547/";  
//const web3 =  new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
let amfeixAddress = "0xb0963da9baef08711583252f5000Df44D4F56925";
 
let b64ToHex = v => Buffer.from(v, 'base64').toString('hex');
let decodeFundDeposit = ([timestamp, amountX, transactionX, pubKeyX]) => 
  ({timestamp, satoshiBN: BN(b64ToHex(amountX), 16), txId: b64ToHex(transactionX), pubKey: b64ToHex(pubKeyX)});

class ABI {
  constructor(abi) {
    this.methodMap = {};
    abi.forEach(x => { if (x.type === "function") { this.methodMap[x.name] = x } });
  }
}

let abi = new ABI(amfeixCjson.abi);
//L(`abi keys = ${K(abi)}`);
//
class MultiCallBatch {
  constructor() { this.calls = []; }
  add(target, method, params, onSuccess, onError) { this.calls.push(({ target, method, params, onSuccess, onError })); }
  async execute(rpcUrl) { 
   // L(`Executing multicall length: ${this.calls.length}`)
    //L(`I = ${S(I)}`);
//    L(`MultiCallBatch input = ${S(this.calls)}`);
    let calls = this.calls.map((c, i) => { let m = abi.methodMap[c.method]; 
      return ({ target: c.target, call: [`${c.method}(${m.inputs.map(x => x.type).join(",")})(${m.outputs.map(x => x.type).join(",")})`, ...c.params], returns: m.outputs.map((x, j) => [`${i}_${j}`, I])       
      })
    });
//    L({calls});
    let response = await aggregate(calls, { rpcUrl, multicallAddress: '0x5e227AD1969Ea493B43F840cfF78d08a6fc17796' });
    let results = oO(oO(response).results).original;
    //L(`MultiCallBatch results = ${S(results)}`)
    await Promise.all(this.calls.map((c, i) => { let m = abi.methodMap[c.method];
      let q = m.outputs.map((x, j) => {
        let r = results[`${i}_${j}`];
        if (oO(r)._hex) { r = BN(r._hex.slice(2), 16).toString(); }
        return r;
      });
//      L({method: c.method, parms: c.params, q});
      return c.onSuccess(q.length === 1 ? q[0] : q);
    }));
  }
}

class AmfeixContract {
  setWeb3Url(url) { //L(`Setting web3 url to ${url}`);
    this.url = url;
    this.web3 = new Web3(new (this.url.indexOf("ws://") === 0 ? Web3.providers.WebsocketProvider : Web3.providers.HttpProvider)(this.url, { timeout: 60000 }));  
    this.amfeixM = () => (new this.web3.eth.Contract(amfeixCjson.abi, amfeixAddress, { from: this.from })).methods; 
    A(this, { queuedOps: [], batchIx: 0, queuedOpCount: 0, processedOpCount: 0, queuedBatches: [], processing: false, inFlight: 0, maxInFlight: 16, nextIx: 0, batchSize: 256, activeBatch: Promise.resolve() });
  }

  setFrom(address) { this.from = address; }

  queueOp(method, params, onSuccess, onError) { this.queuedOpCount++
    this.queuedOps.push(({ method, params, onSuccess, onError }));
    if (this.queuedOps.length  >= this.batchSize) this.flushBatch(); 
  } 

  async execute(op) { try { return await amfx.amfeixM()[op.method](...oA(op.params)).call(); } catch(err) { return { err } } }

  executeBatch() {
    let batch = new MultiCallBatch();//, batchNo = this.batchIx++;
//    L(`Creating batch ${batchNo}`); 
    for (let op of this.queuedOps) {
//      let op = this.queuedOps[this.nextIx++];
      batch.add(amfeixAddress, op.method, oA(op.params), op.onSuccess, op.onError);
  //    this.processedOpCount++;// += this.queuedOps.length;
    }
    this.queuedOps = [];
    
    let delay = async f => { if (this.inFlight > this.maxInFlight) { return new Promise((resolve, reject) => setTimeout(async () => { resolve(await delay(f)); }, 200)); } else { return await f(); } };
    let prevActiveBatch = this.activeBatach;
    this.activeBatch = (async () => { await prevActiveBatch; 
//      await delay(async () => { this.inFlight++; return await batch.execute(this.url) });  
      this.inFlight++; //L(`Inflight increased to ${this.inFlight} by starting batch ${batchNo}`)
      await batch.execute(this.url); 
      this.inFlight--; //L(`Inflight reduced to ${this.inFlight} by completing batch ${batchNo}`);  
//      L(P(this, T("queuedOpCount processedOpCount")));
    })();
  }   

  async flushBatch() { //L('Flushing batched ops');
    if (this.queuedOps.length > 0) {
      while (this.queuedOps.length > 0) { this.executeBatch(); }
      //L('Flush almost done');
      await this.activeBatch; this.activeBatch = Promise.resolve();
      //L('Flush done');
    }
  }
}

let amfx = new AmfeixContract();

let amfeixFeeFields = T("fee1 fee2 fee3");
let invMap = (countTable, dataTable) => ({countTable, dataTable});
let amfeixAddressLists = ["fundDepositAddresses", "feeAddresses"];
let timeAndAmount = T("time amount"), indexMaps = amfeixAddressLists, investorMaps = [invMap("ntx", "fundTx"), invMap("rtx", "reqWD")]; 
let ethBasicFields = T("owner aum decimals btcPrice").concat(amfeixFeeFields).concat(amfeixAddressLists.map(k => `${k}Length`));
const btcFields = T("blockcount connectioncount difficulty blockchaininfo");

let btcRpc = async (method, func, params) => JSONBig.parse((await ((await fetch(`${btcRpcUrl}${func}/${method === "GET" ? `?${E(oO(params)).map(x => x.map(encodeURIComponent).join("=")).join("&")}` : ''}`, 
 { method, mode: 'cors', headers: { "content-type": "application/json" }, ...(method === "POST" ? { body: S({params}) }: {}) })).text())));

let invMapDBStruc = ({countTable, dataTable}) => ({ ...singleKeyObject(countTable, struc(["investorIx"])), ...singleKeyObject(dataTable, struc(["investorIx", "index"], [["investorIx", "investorIx", false]])) })
 
export let tableStrucMap = {}
let hierName = (o, p) => F(E(o).map(([k, v]) => { let q = p ? [p, k].join("-") : k; return [k, isA(v) ? (tableStrucMap[q] = {...v[0], table: q}, q) : hierName(v, q)]; }));
let struc = (keyPath, indices) => [{ keyPath, indices }];
let tables = hierName({ 
  eth: { constants: struc(["name"], [["name", "name", true]]),  ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1]), 
  ...F(T("time amount").concat(indexMaps).map(k => [k, struc(["index"])])), investorsAddresses: struc(["index"], [["data", "data", true]])  }, 
  btc: { constants: struc(["name"], [["name", "name", true]]), ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1]) },
  queue: { ethTransactions: struc(["index"]) }
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
  set(obj) { E(obj).forEach(([k, v]) => this.setData(k, v)); }
}

let constantFields = { btc: btcFields, eth: ethBasicFields };
let constantRetrievers = { 
  btc: name => async () => ({ name, value: await btcRpc("GET", `get${name}`) }),
  eth: name => async () => ({ name, value: await amfx.amfeixM()[name]().call() })
} 

let timeFunc = async f => {
  let startTime = Date.now();
  let result = await f();
  return { result, time: Date.now() - startTime };
}
 
let getInvestorDataKey = investor => `investor_${investor.data}`;
let getInvestorWalletDataKey = investor => `investor_Wallet_${investor.btcAddress}`; 

class Transaction { constructor(method, parms) { A(this, { method, parms }); } }

class Scheduler {
  constructor(interval, onUpdate) {
    this.intervalHandle = setInterval(async () => { await onUpdate(); this.lastUpdate = Date.now(); }, interval);
  }
}

class Data extends Persistent {
  constructor() { super("data", ["localData"], { localData: { dbix: 173 } }); L('Creating Data class instance.');
    //this.localData = (d => d ? L(JSON.parse(d)) : { dbix: 60 })((localStorage.getItem("_")));
    if (newDB) this.localData.dbix++; 
    A(this, { tables, tableStrucMap, investorData: {}, observers: {}, data: {}, loadProgress: { progress: {}, timings: {} }, syncCache: new SyncCache(), idb: new IndexedDB(S(this.localData.dbix)), adminLoadInitiated: false, queuedEthTransactions: [] }); 
    for (let q = 0; q < this.localData.dbix; ++q) this.idb.deleteDB(S(q));
    this.persist(); 
     
    this.setEthRPCUrl(ethInterfaceUrl); 
    this.onLoadProgress = name => d => { this.loadProgress.progress[name] = d; this.syncCache.setData("loadProgress", this.loadProgress); };
    this.onGlobalLoad = (step, length, done) => this.updateLoadProgress(this.onLoadProgress("Global load"), step, length || 5, done);
    this.updateConstants = F(E(constantFields).map(([t, f]) => [t, () => this.measureTime(`Constants (${t})`, async () => await Promise.all(f.map(async name => { 
      let result = await constantRetrievers[t](name)();
      this.syncCache.setData(name, result.value); 
      await this.setData(tables[t].constants, (result));
    })))]));
    this.updateConstants.eth = () => this.measureTime(`Constants (eth)`, async () => { 
      let buf = this.idb.newBuffer();
      constantFields.eth.forEach(name => amfx.queueOp(name, [], value => { this.syncCache.setData(name, value); buf.write(tables.eth.constants, { name, value }); }, err => L(`Eth constant retrieval error ${S(err)}`))); 
      await amfx.flushBatch(); await buf.flush();
    });
    
    this.functionsToPerformAfterBasicLoad = [];
    this.functionsToPerformAfterGenericLoad = [];

    (async () => { await this.idb.init(); this.syncCache.setData("dbInitialized", true); await this.genericLoad(); })(); 
  }

  set queuedEthTransactions(a) { this.syncCache.setData("queuedEthTransactions", a); }
  get queuedEthTransactions() { return this.syncCache.getData("queuedEthTransactions"); }

  async signAndSubmitQueuedEthTransactions(privateKey, testMode) { await this.measureTime("Basic Load", async () => {
    let from = "0xADBfBEd800B49f84732F6D95fF5C924173C2C06A";
    L(`Generating ${this.queuedEthTransactions.length} transactions...`);
    L({privateKey});
    testMode = true;
    L({accounts: await amfx.web3.eth.personal.getAccounts()})
    let account = amfx.web3.eth.accounts.privateKeyToAccount(privateKey); 
    this.queuedEthTransactions = await Promise.all(this.queuedEthTransactions.map(async t => {
      L(`Pending tx: ${S(t)}`);
      let u = amfx.amfeixM()[t.method](...t.parms); 
//      L(`u = ${S(u)}`);
      let options = L({from, to: amfeixAddress, gas: Math.max(25000, await u.estimateGas({ from, to: amfeixAddress })), data: u.encodeABI() });
      let z = await amfx.web3.eth.sendTransaction(options); L(`Sendtransaction result = ${S(z)}`); 
//      let x = await account.signTransaction(options); L(`Signed tx: ${S(x)}`);
  //    let z = await w3.web3.eth.sendSignedTransaction(x.rawTransaction); L(`Submitted tx: ${S(z)}`);
      return ({ ...t, ...P(z, T("gasUsed blockNumber transactionHash")), status: z.status === true ? "Submitted" : "Failed" });
    })); 
  })}

  runWhenDBInitialized(f) { let obs = this.syncCache.watch("dbInitialized", () => { f(); obs.detach(); }) }

  async updateFixedLengthArray(name) { await this.measureTime(`Update '${name}' array`, () => this.updateArray(name, `${name}Length`)) }

  async basicLoad() { await this.measureTime("Basic Load", async () => { this.onGlobalLoad(0);
    await Promise.all([this.loadTimeData(), ...V(this.updateConstants).map(x => x()), ...indexMaps.map(l => this.updateFixedLengthArray(l))]); this.onGlobalLoad(1);
    await this.updateSyncCache(); this.onGlobalLoad(2);
    await this.computeTimeDataFromTimeAndAmount(); this.onGlobalLoad(3); 
    for (let q of oA(this.functionsToPerformAfterBasicLoad)) await q();
  }); }

  performAfterBasicLoad(f) { this.functionsToPerformAfterBasicLoad.push(f); }
  performAfterGenericLoad(f) { this.functionsToPerformAfterGenericLoad.push(f); }

  async updateSyncCache() { await this.measureTime("updateSyncCache", () => Promise.all(T("investorsAddresses").map(async t => this.syncCache.setData(t, (await this.idb.getAll(tables.eth[t])))))); } 

  async updateRegisteredTransactions() { await this.measureTime("Update Registered Transactions", async () => {
    await this.measureTime("updateRegisteredEthTransactions", async () => { await this.updateRegisteredEthTransactions(); }); this.onGlobalLoad(4);
    await this.updateRegisteredBtcTransactions();
  }); }
  async updateRegisteredEthTransactions() { await this.measureTime("Update Registered Eth Transactions", async () => {
    await Promise.all(investorMaps.map(m => this.updateInvestorMappedArray(this.onLoadProgress(`Smart contract registered transactions: ${m.dataTable}`), m))); 
  }); }
  async updateRegisteredBtcTransactions() { await this.measureTime("Update Registered Btc Transactions", async () => {
    await Promise.all(investorMaps.map(m => this.updateBitcoinTxs(this.onLoadProgress(`Bitcoin transactions: ${m.dataTable}`), m))); 
  }); }

  async updateInvestorAddresses() { await this.measureTime("Update Investor Addresses", async () => {
    await this.updateArray("investorsAddresses");  
  }); }

  async genericLoad() { await this.measureTime("Generic Load", async () => {
    await this.basicLoad(); 
    await this.updateInvestorAddresses(); this.onGlobalLoad(4);
    await this.updateRegisteredTransactions(); this.onGlobalLoad(5);
    this.onGlobalLoad(5, 5, true);
    for (let q of oA(this.functionsToPerformAfterGenericLoad)) await q();
  }); }

  async adminLoad() { 
    if (!this.adminLoadInitiated) { this.adminLoadInitiated = true; this.onGlobalLoad(5, 7);
      await this.fetchFundDeposits(); this.onGlobalLoad(6, 7);
      await this.computeData(); this.onGlobalLoad(7, 7, true);
    }
  }

  async registerInvestorAddress(address) {  
    let investorsAddresses = await amfx.amfeixM().getAllInvestors().call();
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

  setEthRPCUrl(newRPCUrl) { //L(`nweRPCURL: ${newRPCUrl}`)
    amfx.setWeb3Url(newRPCUrl);
    this.syncCache.setData("ethRPCUrl", newRPCUrl);
//    (async() => L(`Personal accounts: ${S(await oF(oO(w3.web3.eth.personal).getAccounts)())}`))();
  }

  getFundDepositAddresses() { return L(this.syncCache.getData("fundDepositAddresses")).map(x => x.data).filter(z => z.length > 0); }
  getFundDepositPubKeys() { return ["03f1da9523bf0936bfe1fed5cd34921e94a78cac1ea4cfd36b716e440fb8de90aa"]; }

  async fetchFundDeposits() { this.syncCache.set({ fundDeposits: await Promise.all(this.getFundDepositAddresses().map(a => this.fetchDeposits(U, a))) }); };
  async fetchDeposits(fromPubKey, toAddr) { return oA(oO(await btcRpc("GET", `getdeposits/${toAddr ? `toAddress/${toAddr}` : ''}${fromPubKey ? `fromPublicKey/${fromPubKey}` : ''}`)).data).map(decodeFundDeposit) }

  async retrieveInvestorWalletData(investor) { L({investor}); 
    let key = getInvestorWalletDataKey(investor);
    let cached = await this.syncCache.getData(key);
    if (D(cached)) return cached;  

    let d = {
      Investments: await Promise.all((this.getFundDepositAddresses().map(async a => (await this.fetchDeposits(investor.pubKey, a)).map(d => ({...d, fundDepositAddress: a }))))),
      Returns: await Promise.all((this.getFundDepositPubKeys().map(async a => (await this.fetchDeposits(a, investor.btcAddress)).map(d => ({...d, fundDepositPubKey: a }))))),
      Deposits: await this.fetchDeposits(U, investor.btcAddress), Withdrawals: await this.fetchDeposits(investor.pubKey)
    };
    this.syncCache.setData(key, d);
    return d;
  }

  getDecimals() { return this.syncCache.getData('decimals'); } 
  getFactor() { return BN(10).pow(this.getDecimals()); } 

  async computeTimeDataFromTimeAndAmount() { await this.measureTime("Fund Index chart computation", async () => {  
    let performance = [], [time, amount] = T("time amount").map(t => (this.syncCache.getData(t))).map(y => (y).map(x => x.data));  
    let f = this.getFactor(), ff = f.times(100);// L({factor: f})
    for (let x = 0, acc = BN(1.0); x < amount.length; ++x) performance.push([time[x], acc = acc.times(ff.plus(BN(amount[x])).div(ff))]);  
    let timeData = performance.map(([t, d]) => [1000*t, parseFloat(d.toString())]);
    E(({ timeData, roi: (100*timeData[timeData.length - 1][1] - 100), dailyChange: parseFloat((BN(amount[amount.length - 1]).div(f)).toString()) })).map(([k, v]) => this.syncCache.setData(k, v));
    this.performance = performance;
  }); }

  getPerformanceIndex(time, lowIndex, highIndex) { let p = this.performance;
    let low = lowIndex || 0, high = highIndex || (p.length - 1); // L(`gpi(${time}, ${low}, ${high})`)
    while (high > low) { let m = low + ((high - low) >> 1); 
      if (p[m][0] > time) { high = m; } else if (low < m) { low = m; } else break;
    }
    return high;
  }

  async loadTimeData() { await this.measureTime("Fund Index chart data", async () => {
    let onLoadProgress = this.onLoadProgress("Fund Index chart data");
    let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    let length;
    if ((await sIx("time") === 0) && (await sIx("amount") === 0)) { await this.measureTime("Fund Index chart data (single step)", async () => {
      let buf = this.idb.newBuffer();
      this.updateLoadProgress(onLoadProgress, 0);
      let timeData = await amfx.amfeixM().getAll().call();
      length = timeData[0].length;
      for (let index = 0; index < length; ++index) {
        ["time", "amount"].forEach((t, i) => buf.write(tables.eth[t], { index, data: (i === 0 ? parseInt : I)(timeData[i][index]) }));
      }
      ["time", "amount"].forEach(name => buf.write(tables.eth.constants, {...countKey(name), startIndex: length }));
      let result = await buf.flush();
      this.updateLoadProgress(onLoadProgress, length, length, true);
      timeAndAmount.forEach((t, i) => this.syncCache.setData(t, timeData[i].map((data, index) => ({ index, data }))));
    }) } else { await Promise.all(timeAndAmount.map(l => this.updateArray(l))); }
  }); }

  async loadInvestorsAddressesSingleShot(onLoadProgress) { await this.measureTime("Investors addresses", async () => {
    let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    if ((await sIx("investorsAddresses") === 0)) {
      let buf = this.idb.newBuffer();
      this.updateLoadProgress(onLoadProgress, 0);
      let investorsAddresses = await amfx.amfeixM().getAllInvestors().call(); 
      let length = investorsAddresses.length;
      investorsAddresses.forEach((data, index) => buf.write(tables.eth.investorsAddresses, { index, data }));
      buf.write(tables.eth.constants, {...countKey("investorsAddresses"), startIndex: length });
      await buf.flush(); 
      this.updateLoadProgress(onLoadProgress, length, length, true);
    }
  }); }

  updateLoadProgress(onLoadProgress, index, length, done) { onLoadProgress({ index, length: D(length) ? length : (done ? index : "unknown") }); }

  async updateGenericArray(onLoadProgress, name, { length, startIndex }, countKey, countTable, dataTable, parms, buf, w3Batcher, onDone) {
    if (onLoadProgress) this.updateLoadProgress(onLoadProgress, startIndex, length);
    let index = startIndex;
    let localBuf = buf || this.idb.newBuffer();
    let masterKeys = F(oA(tableStrucMap[dataTable].keyPath).map(k => [k, countKey[k]]));
    let final = async (index) => {
      localBuf.write(countTable, ({ ...countKey, startIndex: index, length })); //L('I'); 
      if (!D(buf)) await localBuf.flush();
      if (onLoadProgress) this.updateLoadProgress(onLoadProgress, index, length, true);
      await oF(onDone)();
    }
    if (D(length)) {
      let w3b = w3Batcher || amfx;
      let completed = 0;
//      L({name, startIndex, index, length});
      if (index === length) await final(index);
      while ((index < length)) { let currentIx = index++; 
        //L({name, currentIx, length});
        w3b.queueOp(name, [...oA(parms), currentIx], async data => {
          localBuf.write(dataTable, ({ ...masterKeys, index: currentIx, data })); //L('D');
          if (onLoadProgress) this.updateLoadProgress(onLoadProgress, completed, length);
          completed++;
        //  L({currentIx, length, completed, startIndex});
          if (completed === length - startIndex) { await final(currentIx + 1); }
        }, err => { L(`Error in '${name}' array update: ${S(err)}`) });  
      }
      if (!D(w3Batcher)) { L('flushB'); await amfx.flushBatch(); }
    } else {
      try { while (!D(length) || (index < length)) { //L(`Processing item ${index} for ${name} (${dataTable}) with parms = ${S(parms)}`);
        let data = await (amfx.amfeixM()[name](...oA(parms), index).call()); //L('C');
        if (isS(data) && data.length === 0) throw new Error(`Empty resposne for ${name}(${parms})`);
        localBuf.write(dataTable, ({ ...masterKeys, index: index++, data })); //L('D');
        if (onLoadProgress) this.updateLoadProgress(onLoadProgress, index, length); 
      } } catch {} // { L(`Array ${name} stopped at ${index}.`) } 
      await final(index); 
    }
  }

  async updateArray(arrayName, lengthName, parms, postProcess) { 
    await this.measureTime(`Update '${arrayName}' array`, async () => { 
      let olp = this.onLoadProgress(`Update '${arrayName}' array`);
      let countKey = ({ name: lengthName || `${arrayName}.counts` }); 
      let alsi = (await this.getArrayLengthAndStartIndex(tables.eth.constants, countKey, lengthName, parms)); 
//      L({arrayName, alsi});
      if (D(alsi.value) && !D(alsi.length)) alsi.length = parseInt(alsi.value);
      // L({arrayName, lengthName, countKey, alsi});
  //    L({arrayName, alsi});
      await new Promise((resolve, reject) => { try {
        this.updateGenericArray(olp, arrayName, alsi, countKey, tables.eth.constants, tables.eth[arrayName], parms, U, U, resolve);//, U, U, () => dp.resolve());
      } catch(err) { reject(err) } });
      //await amfx.flushBatch();
      //await donePromise;
    });
    await this.measureTime(`Cache '${arrayName}' array`, async () => this.syncCache.setData(arrayName, (await this.idb.getAll(tables.eth[arrayName]))));  
  } 

  async getArrayLengthAndStartIndex(countTable, countKey, lengthName, parms) { //L(`galsi(${countTable}, ${S(countKey)}, ${lengthName}, ${parms})`)
    let alsi = oO(await this.getData(countTable, countKey, lengthName && (async () => ({ ...countKey, length: parseInt(await amfx.amfeixM()[lengthName](...oA(parms)).call()) }))));
//    this.updateLoadProgress(onLoadProgress, alsi.startIndex, alsi.length);
    //L(`galsi(${countTable}, ${S(countKey)}, ${lengthName}, ${parms}) ==> ${S({ alsi })}`) 
    return ({ startIndex: 0, ...alsi });
  } 

  updateInvestorArray(investor, { countTable, dataTable }, buf, w3Batcher, onDone) { 
    let countKey = { investorIx: investor.index }, parms = [investor.data]; 
    w3Batcher.queueOp(countTable, parms, async length => {
      this.uiaStep2++;
      await this.updateGenericArray(U, dataTable, { startIndex: 0, length: parseInt(length) }, countKey, tables.eth[countTable], tables.eth[dataTable], parms, buf, w3Batcher);
      await oF(onDone)(); 
    }, err => L(`Error while getting array length for '${countTable}-${dataTable}' for investor ${investor.data}: ${S(err)}`));
  }

  async updateInvestorMappedArray(onLoadProgress, { countTable, dataTable }) { await this.measureTime(`Update invsetor mapped array '${dataTable}'`, async () => {
    //L(`uima(${countTable}, ${dataTable})`);
    let olp = onLoadProgress;
    let { startIndex, length, investorMapCountKey } = await this.getInvestorMapUpdateCountData(countTable, dataTable, `eth`);
    let ix = startIndex;
    let investors = this.syncCache.getData("investorsAddresses"); 
    length = investors.length;
    let localBuf = this.idb.newBuffer();
    let completed = 0;
    await new Promise(async (resolve, reject) => { try {
      await new Promise(async (resolve, reject) => { try {
        if (ix === length) { this.updateLoadProgress(olp, ix, length); resolve(); }
        while (ix < length) this.updateInvestorArray(investors[ix++], { countTable, dataTable }, localBuf, amfx, async () => { 
          this.updateLoadProgress(olp, ++completed, length);
          if (completed === length - startIndex) resolve();
        });
        await amfx.flushBatch(); 
      } catch(err) { reject(err); } }); L(`uima ${dataTable} final`);
      await amfx.flushBatch(); L(`uima ${dataTable} local buf flush`);
      await localBuf.flush(); L(`uima ${dataTable} local buf done`);
      if (ix !== startIndex) await this.setData(tables.eth.constants, ({...investorMapCountKey, startIndex: ix }));
      resolve();
    } catch(err) { reject(err); } });
  }); }

  async getInvestorMapUpdateCountData(countTable, dataTable, type, lengthTable) {
    let investorMapCountKey = { name: `${countTable}-${dataTable}.counts` };
    let length = lengthTable && await this.idb.count(lengthTable);
    let startIndex = oO(await this.getData(tables[type].constants, investorMapCountKey)).startIndex || 0;
    return { startIndex, length, investorMapCountKey };
  }

  async updateBitcoinTxs(onLoadProgress, { countTable, dataTable }, countKeyName) { //L(`uima(${name}, ${countTable}, ${dataTable})`);
    let { startIndex, length, investorMapCountKey } = await this.getInvestorMapUpdateCountData(countTable, dataTable, `btc`, tables.eth[dataTable]);
    let index = startIndex;   
    let fundDepositAddresses = this.getFundDepositAddresses();
//    L({fundDepositAddresses}); 
    for (let d of (await this.idb.getAll(tables.eth[dataTable])).slice(index)) { let key = { investorIx: d.investorIx, index: d.index };
      await this.getData(tables.btc[dataTable], key, async () => {
        return ({ ...key, value: (x => D(x) ? x.toString() : U)((oA((oO((await btcRpc("POST", 'getrawtransaction', [d.data.txId, true])).result)).vout).map(({value, scriptPubKey: {addresses}}) => ({value, address: addresses[0]})).filter(x => fundDepositAddresses.includes((x).address)).map(x => x.value))[0]) });
      }); 
      await this.setData(tables.btc.constants, { ...investorMapCountKey, startIndex: index + 1 });
      this.updateLoadProgress(onLoadProgress, index, length);
      index++; 
    }
    this.updateLoadProgress(onLoadProgress, index, length, true);
    //L('done');
  }

  async clearTransactionCache(t) { await Promise.all([
    ...T("ntx fundTx rtx reqWD").map(z => this.idb.clear(tables[t][z])),
    ...T("ntx-fundTx rtx-reqWD").map(z => this.idb.write(tables[t].constants, { name: `${z}.counts`, startIndex: 0 }))
  ]); }  

  getKey(table, data) { return (`${table}${isO(data) ? `:[${tableStrucMap[table].keyPath.map(a => data[a]).join(",")}]` : ''}`) }

  async setData(table, data) { return await this.idb.write(table, data); }
  async getData(table, data, retriever) { return (await this.idb.get(table, data)) || (retriever && (await this.setData(table, await retriever()))); } 

  async measureTime(name, promise) { this.loadProgress.timings[name] = (await timeFunc(promise)).time; } 

  async computeData() { await this.measureTime("computeData", async () => {
    let investors = [], approvedDeposits = {}, fundDeposits = this.syncCache.getData("fundDeposits"); 
    let investorsAddresses = this.syncCache.getData("investorsAddresses"); let olp = this.onLoadProgress("Computing data structures");  
    let d = await Promise.all(investorMaps.map(async im => await Promise.all(['eth', 'btc'].map(t => this.idb.getAll(tables[t][im.dataTable])))));
    let e = d.map(im => im.map(x => F(x.map(z => [z.investorIx, []]))));
    d.forEach((im, a) => im.forEach((x, b) => x.forEach(z => { e[a][b][z.investorIx].push(z); } ))); 
    for (let ix = 0; ix < investorsAddresses.length; ++ix) { this.updateLoadProgress(olp, ix, investorsAddresses.length);
      let investor = await this.retrieveInvestorData(investorsAddresses[ix], U, e); 
      let i = { index: investorsAddresses[ix].index, address: investorsAddresses[ix].data, investmentValue: investor.investmentValue, Withdrawal_Requests: investor.Withdrawal_Requests };
      investors.push(i);
      investor.Deposits.forEach(d => { approvedDeposits[d.txId] = true; });
    }   
    this.syncCache.set({ investorsAddresses }); 
    L({ investors: investorsAddresses.map(i => P(i, T("pubKey btcAddress"))) });
    this.syncCache.set({ investors, withdrawalRequests: investors.map(i => i.Withdrawal_Requests).flat(), pendingDeposits: G(fundDeposits, v => v.filter(d => !approvedDeposits[d.txId])) });  
    this.updateLoadProgress(olp, investorsAddresses.length, investorsAddresses.length);
  }); };

  async retrieveInvestorData(investor, lengths, allData) { //L(`retrieveInvestorData = ${S(investor)}`);
    let cached = this.syncCache.getData(getInvestorDataKey(investor));
    if (cached) { L('cached'); return cached; }
    if (!D(investor.index)) {
      L(`finding index for investor.data = ${investor.data}`);
      let i = await this.idb.get(tables.eth.investorsAddresses, { data: investor.data }, "data", ["data"]);
      investor.index = oO(i).index;
      L(`returned ${S(i)}`)
    }
    let invKey = { investorIx: investor.index }; //L(`Retrieving investor ${investor} data`);
//    L(`invKey = ${S(invKey)}`);
    let ethDataMap = ([txId, pubKey, signature, action, timestamp]) => ({ timestamp: parseInt(timestamp), txId, pubKey, signature, action });
    let dataMaps = { eth: x => ({index: x.index, ...ethDataMap(oO(x.data))}), btc: x => ({index: x.index, value: BN(x.value)}) }
    let txs, reqWD;
//    L(`getting data for investor ${investor.index}`);
    if (D(allData)) {
      [txs, reqWD] = allData.map((im, j) => {
//        L({im});
        let [e, b] = ['eth', 'btc'].map((t, z) => (oA(im[z][invKey.investorIx])).map(oO).map(dataMaps[t]));
        for (let index = 0; index < Math.min(e.length, b.length); ++index) e[index].value = b[index].value;
        return (e);
//        process.exit();
      });
    } else {
      let getList = async (m, j) => {  
        let fastLength = (oO(oA(lengths)[j]))[(invKey.investorIx)];
        let length = D(fastLength) ? (fastLength) : ((oO(await this.idb.get((tables.eth[(m).countTable]), (invKey)))).length || 0);
        let [e, b] = await Promise.all(['eth', 'btc'].map(async t => {             
          let buf = this.idb.newBuffer();
          let r  = []; 
          for (let index = 0; index < length; ++index) { r.push(U); buf.get(tables[t][m.dataTable], ({...invKey, index}), d => { r[index] = d; }); }
          await buf.flush(); 
          return r.map(oO).map(dataMaps[t]);
        }));
        for (let index = 0; index < length; ++index) e[index].value = b[index].value;
        return (e);
      };
      [txs, reqWD] = await Promise.all(investorMaps.map(getList));
    }

    let toObj = a => F(a.map(e => [e.txId, e]));
    let dedup = d => V(toObj(d)); // XXX: does not check if duplicates are identical -- only retains one of them with same txId   
    try {
      investor.pubKey = oO(oA(txs)[0]).pubKey;
      investor.derivedEthAddress = pubKeyToEthAddress(investor.pubKey, true); 
      investor.btcAddress = pubKeyToBtcAddress(investor.pubKey);   
      investor.anomalous = anomalousInvestorIndexMap[investor.index] ? "Yes" : "No";
      if (investor.derivedEthAddress.toLowerCase() !== investor.data.toLowerCase()) L(`Investor (${investor.index}): Address discrepancy ${investor.data} !== ${investor.derivedEthAddress}`)
    } catch (err) { investor.pubKeys = []; investor.error = "Yes"; investor.anomalous = "Yes"; } 
    
    let data = F(["Deposits", "Withdrawals"].map((k, i) => [k, dedup(txs.filter(x => x.action === S(i)))]));
    data.Withdrawal_Requests = dedup(reqWD);
    let objs = G(data, toObj);
    let has = G(objs, v => x => D(v[x.txId]));  
    let g = ({ 
      Deposits: data.Deposits,// hasWithdrawalRequest: has.withdrawalRequest(d) })), 
      Withdrawal_Requests: data.Withdrawal_Requests.filter(x => has.Deposits(x) && !has.Withdrawals(x)), 
      Withdrawals: data.Withdrawals.filter(x => has.Deposits(x) && has.Withdrawal_Requests(x)) 
    });

    let investment = g.Deposits.concat(g.Withdrawals).sort((a, b) => a.timestamp - b.timestamp); 
    let currentValueAcc = BN(0); 
    for (let d of g.Deposits) { d.status = ((has.Withdrawals(d)) ? stati.Deposits.Withdrawn : (has.Withdrawal_Requests(d) ? stati.Deposits.Withdrawal_Requested : stati.Deposits.Active));
      let endTimestamp = (oO(objs.Withdrawal_Requests[d.txId]) || oO(objs.Withdrawals[d.txId])).timestamp || 0;
      let endIx = (d.status === stati.Deposits.Active) ? this.performance.length - 1 : this.getPerformanceIndex(endTimestamp);
      let startIx = this.getPerformanceIndex(d.timestamp), startPerf = this.performance[startIx];
      let endPerf = this.performance[endIx][1];
      let appliedPerf = (startPerf[0] >= d.timestamp) ? startPerf[1] : endPerf;
//      L(`num = ${appliedPerf.toString()}`); 
      //d.performance  = perf.toString();
      //L({appliedPerf});      L({d});
      d.finalValue = (appliedPerf.isZero() || !D(d.value)) ? U : d.value.times(endPerf.div(appliedPerf));
      d.hasWithdrawalRequest = has.Withdrawal_Requests(d) ? "Yes" : "No";
      d.hasWithdrawal = has.Withdrawals(d) ? "Yes" : "No";
    }
    for (let wr of g.Withdrawal_Requests) wr.status = has.Withdrawals(wr) ? stati.Withdrawal_Requests.Processed : stati.Withdrawal_Requests.Pending;
    for (let i of investment) { let v = i.value; 
//      i.accValue = (acc = (i.action === "0" ? acc.plus(v) : acc.minus(v)));  
      i.accCurrentValue = currentValueAcc && ((currentValueAcc = (i.action === "0" ? (D(i.finalValue) ? currentValueAcc.plus(i.finalValue) : U) : currentValueAcc.minus(v)))); 
    }
  //  g.investment = investment.map(x => [1000*x.timestamp, parseFloat(x.accValue.toString())]);
    g.investmentValue = currentValueAcc && parseFloat(currentValueAcc.toString());
    g.value = investment.map(x => [1000*x.timestamp, parseFloat(x.accCurrentValue.toString())]);;
    for (let d of g.Deposits) { T("finalValue value").forEach(v => { if (D(d[v])) d[v] = d[v].toString(); }); }
    for (let d of g.Withdrawal_Requests) { T("value").forEach(v => { if (D(d[v])) d[v] = d[v].toString(); }); }
    for (let d of g.Withdrawals) { T("value").forEach(v => { if (D(d[v])) d[v] = d[v].toString(); }); }
      //L(g);
    return this.syncCache.setData(getInvestorDataKey(investor), g);
  }

  getInvestorData(investor) { return this.investorData[investor] = D(this.investorData[investor]) ? this.investorData[investor] : this.retrieveInvestorData(investor); }
}

let data = new Data(); 
  
export { Transaction, stati, ethInterfaceUrls, btcRpcUrl, btcFields, ethBasicFields, getInvestorDataKey, getInvestorWalletDataKey, data, amfeixFeeFields, amfeixAddressLists };