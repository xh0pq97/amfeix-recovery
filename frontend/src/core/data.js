/* eslint no-unused-vars: 0 */
/* eslint no-loop-func: 0 */
import amfeixCjson from '../amfeixC.json'; 
// eslint-disable-next-line
import { A, D, E, F, G, H, I, K, L, S, T, P, U, V, W, oA, oO, oF, oS, isO, isA, isS, future, singleKeyObject, makeEnum } from '../common/tools'; 
import { IndexedDB } from './db'; 
import { Persistent } from './persistent';
import { BN, ALPHABET }  from './bignumber';
import JSONBig from 'json-bigint'; 
//import Accounts from 'web3-eth-accounts';
//import aggregate from './aggregate.js';
import { satoshiToBTCFloat } from './satoshi';
import { pubKeyToEthAddress, pubKeyToBtcAddress } from "../common/pubKeyConvertor";
import { SyncCache } from '../common/syncCache'; 
import { ETransactionType } from './enums.js';
import { amfx, amfeixAddress } from './amfeixContract';
import bs58check from 'bs58check';  
import nodeFetch from 'node-fetch';
import crossFetch from 'cross-fetch';

global.fetch = nodeFetch;

//global.document = {}
//global.window = { document: {}, location: "localhost" }

let newDB = false; // || true;   
 
let stati = { Deposits: makeEnum("Active Withdrawn Pending_Withdrawal"), Pending_Withdrawals: makeEnum("Pending Processed") }; 

let anomalousInvestorIndexMap = F([2339, 74, 418, 419, 424, 464, 515, 3429, 515, 1061, 3428, 3429, 3437, 3438].map(i => [(i), true]));

let b64ToHex = v => Buffer.from(v, 'base64').toString('hex');
let hexToBtcAddress = v => bs58check.encode(Buffer.from(v, 'hex'));
let decodeFundDeposit = s => (([timestamp, amountX, transactionX, fromPubKeyX]) => { let fromPubKey = b64ToHex(fromPubKeyX);
  return {timestamp, txId: b64ToHex(transactionX), fromPubKey, fromBtcAddress: pubKeyToBtcAddress(fromPubKey), satoshiBN: BN(b64ToHex(amountX), 16)}; } )(T(s)); 
let decodeDeposit = s => (([timestamp, amountX, transactionX, fromBtcAddressX]) => {  
  return {timestamp, txId: b64ToHex(transactionX), fromBtcAddress: fromBtcAddressX && bs58check.encode(Buffer.from(fromBtcAddressX, 'base64')), satoshiBN: BN(b64ToHex(amountX), 16)}; } )(T(s)); 
  
let hostname = window.location.hostname, amfeixUK  = "amfeix.uk";
if (hostname === "localhost") hostname = amfeixUK;
const btcRpcUrl = `https://btc.${amfeixUK}/`, ethInterfaceUrl = `https://eth.${amfeixUK}/`; //"ws://46.101.6.38/ws";  
const ethInterfaceUrls = [ethInterfaceUrl, ethInterfaceUrl + 'ganache/']; //"ws://46.101.6.38/ws";  
//ethInterfaceUrl = "http://46.101.6.38:8547/";  
//const web3 =  new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
let invMap = (countTable, dataTable) => ({countTable, dataTable}); 
let timeAndAmount = T("time amount"), amfeixFeeFields = T("fee1 fee2 fee3"), amfeixAddressLists = T("fundDepositAddresses feeAddresses"), btcFields = T("blockcount connectioncount difficulty blockchaininfo");
let indexMaps = amfeixAddressLists, investorMaps = [invMap("ntx", "fundTx"), invMap("rtx", "reqWD")]; 
let ethBasicFields = T("owner aum decimals btcPrice").concat(amfeixFeeFields).concat(amfeixAddressLists.map(k => `${k}Length`));

let btcRpc = async (method, func, params) => JSONBig.parse((await ((await fetch(`${btcRpcUrl}${func}/${method === "GET" && params ? `?${E(oO(params)).map(x => x.map(encodeURIComponent).join("=")).join("&")}` : ''}`, 
 { method, mode: 'cors', headers: { "content-type": "application/json" }, ...(method === "POST" ? { body: S({params}) }: {}) })).text())));

let invMapDBStruc = ({countTable, dataTable}) => ({ ...singleKeyObject(countTable, struc(["investorIx"])), ...singleKeyObject(dataTable, struc(["investorIx", "index"], [["investorIx", "investorIx", false]])) })
 
let tableStrucMap = {}
let hierName = (o, p) => F(E(o).map(([k, v]) => { let q = p ? [p, k].join("-") : k; return [k, isA(v) ? (tableStrucMap[q] = {...v[0], table: q}, q) : hierName(v, q)]; }));
let struc = (keyPath, indices) => [{ keyPath, indices }];
let tables = hierName({ 
  eth: { constants: struc(["name"], [["name", "name", true]]),  ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1]), 
  ...F(timeAndAmount.concat(indexMaps).map(k => [k, struc(["index"])])), investorsAddresses: struc(["index"], [["data", "data", true]])  }, 
  btc: { constants: struc(["name"], [["name", "name", true]]), ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1])
//  , deposits: struc(["height", "txId"]. [[]]) 
},
  queue: { ethTransactions: struc(["index"]) }
}); 

let constantFields = { btc: btcFields, eth: ethBasicFields };
let constantRetrievers = G({ btc: name => btcRpc("GET", `get${name}`), eth: name => amfx.amfeixM()[name]().call() }, v => name => async () => ({ name, value: await v(name) })); 

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

let fetchDeposits = async (fromPubKey, toAddr) => L(oA(oO(await btcRpc("GET", L(`getdeposits/toAddress/${toAddr || '_'}/fromPublicKey/${fromPubKey || '_'}`))).data).map(decodeDeposit));

let binSearch = (e, low, high) => { while (high > low) { let m = low + ((high - low) >> 1); if (e(m)) { high = m; } else if (low < m) { low = m; } else break; } return high; }

class Data extends Persistent {
  constructor() { super("data", ["localData"], { localData: { dbix: 1173 } }); L('Creating Data class instance.'); 
    if (newDB) this.localData.dbix++; 
    let f = T("dbInit basicLoad loadBasicFields loadTimeData loadConstants loadAddressLists investorsAddressesLoad computePerformance updateRegisteredEthTransactions fetchFundDeposits updateRegisteredBtcTransactions computeAllInvestorData loadTransactionsForMonitoredInvestors");
    let fs = this.futStack = []; this.orgFuncs = {}; this.futs = F(f.concat(T("mode modeSet")).map(k => [k, future()]));
    f.forEach(k => { this.orgFuncs[k] = this[k]; this[k] = (async () => await this.futs[k].resolveWithPromise((async () => { 
      fs.push(k); L(`> ${fs.join("\\")}`); await this.orgFuncs[k].bind(this)(); L(`< ${fs.join("\\")}`); fs.pop();  
    })())); }); 
    this.dataProperties = T("queuedEthTransactions investorsAddresses performance decimals fundDeposits aum btcPrice owner investors withdrawalRequests pendingDeposits timeData roi dailyChange").concat([timeAndAmount, amfeixFeeFields, amfeixAddressLists].flat());
    this.dataProperties.forEach(k => Object.defineProperty(this, k, { get: () => this.getSync(k), set: v => this.setSync(k, v) }));
    A(this, { tables, tableStrucMap, investorData: {}, observers: {}, data: {}, loadProgress: { progress: {}, timings: {} }, syncCache: new SyncCache(), idb: new IndexedDB(S(this.localData.dbix)), adminLoadInitiated: false, queuedEthTransactions: [] }); 
    this.persist(); 
     
    this.setEthRPCUrl(ethInterfaceUrl); 
    this.onLoadProgress = name => d => { this.loadProgress.progress[name] = d; this.setSync("loadProgress", this.loadProgress); };
    this.onGlobalLoad = (step, length, done) => this.updateLoadProgress(this.onLoadProgress("Loading..."), step, length || 3, done);
    this.updateConstants = G(constantFields, (f, t) => async () => await this.measureTime(`Constants (${t})`, async () => 
      await Promise.all(f.map(async name => this.setSync(name, (await this.setData(tables[t].constants, await constantRetrievers[t](name)())).value)))));
    this.updateConstants.eth = async () => { await this.measureTime(`Constants (eth)`, async () => await this.idb.withLocalBuffer(async buf =>  {  
      constantFields.eth.forEach(name => amfx.queueOp(name, [], value => buf.write(tables.eth.constants, L({ name, value: this.setSync(name, value) }), err => L(`Eth constant retrieval error ${S(err)}`)))); 
      await amfx.flushBatch(); L('after amfxf'); await amfx.activeBatch; L('after afmxa');
    })); L("After updateConstants.eth"); }

    (async () => { await this.dbInit(); this.setSync(L("dbInitialized"), true); let r = await this.basicLoad(); L({roi: this.roi}); return r; })(); 
    this.constructorCompleted = true; 
  } 

  async dbInit() { await this.idb.init(); }

  async setMode(mode) { 
    this.mode = mode; 
    this.futs.modeSet.resolve(this.mode);
    if (mode.Admin) { await this.futs.basicLoad.promise; await this.investorsAddressesLoad(); await this.loadTransactionsForMonitoredInvestors(); } 
    this.futs.mode.resolve(this.mode);
  }

  setSync(k, v) { return this.syncCache.setData(k, v); }
  getSync(k) { return this.syncCache.getData(k); } 

  async signAndSubmitQueuedEthTransactions(privateKey, testMode) { await this.measureTime("signAndSubmitQueuedEthTransactions", async () => {
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

  async runWhenDBInitialized(f) { await this.futs.dbInit.promise; f(); }

  async updateFixedLengthArray(name) { await this.measureTime(`Update '${name}' array`, () => this.updateArray(name, `${name}Length`)) }

  async updateSyncCache() { await Promise.all(T("investorsAddresses").map(async t => this.setSync(t, (await this.idb.getAll(tables.eth[t]))))); } 
  async basicLoad() { this.onGlobalLoad(0); await this.loadBasicFields(); this.onGlobalLoad(1); await this.computePerformance(); this.onGlobalLoad(3); } 
  async loadBasicFields() { await Promise.all([this.loadTimeData(), this.loadConstants(), this.loadAddressLists()]); }
  async loadConstants() { await Promise.all(V(this.updateConstants).map(async x => await x())); }
  async loadAddressLists() { await Promise.all(indexMaps.map(l => this.updateFixedLengthArray(l))); }
  async updateRegisteredEthTransactions() { await Promise.all(investorMaps.map(m => this.updateInvestorMappedArray(this.onLoadProgress(`Smart contract registered transactions: ${m.dataTable}`), m)));  }
  async updateRegisteredBtcTransactions() { let fundDepositObj = F(oA(this.fundDeposits).flat().map(x => [x.txId, x]));
    await Promise.all(investorMaps.map(m => this.updateBitcoinTxs(this.onLoadProgress(`Bitcoin transactions: ${m.dataTable}`), m, fundDepositObj))); 
  }
  async investorsAddressesLoad() { await (this.updateArray("investorsAddresses")); this.onGlobalLoad(4, 7, false); }
  async fetchFundDeposits() { this.syncCache.set({ fundDeposits: await Promise.all(this.getFundDepositAddresses().map(a => fetchDeposits(U, a))) }); };
  getFundDepositAddresses() { return L(oA(this.fundDepositAddresses)).map(x => x.data).filter(z => z.length > 0); }
  getFundDepositPubKeys() { return ["03f1da9523bf0936bfe1fed5cd34921e94a78cac1ea4cfd36b716e440fb8de90aa"]; }

  async loadTransactionsForMonitoredInvestors() {  
    await Promise.all([this.updateRegisteredEthTransactions(), this.fetchFundDeposits()]); this.onGlobalLoad(5);
    await this.updateRegisteredBtcTransactions(); this.onGlobalLoad(6);
    await this.computeAllInvestorData(); this.onGlobalLoad(7, 7, true);
  } 

  async registerInvestorAddress(address) { await this.updateSyncCache(); L(`registerInvestorAddress ${address}`);
    let index = this.investorsAddresses.find(v => v.data && (v.data.toLowerCase() === address.toLowerCase())) 
    index = this.investorsAddresses[index].index;
    if (index >= 0) { let investor = await this.setData(tables.eth.investorsAddresses, L({ index, data: address }));
      let buf = this.idb.newBuffer();
      let p = Promise.all(investorMaps.map(m => this.updateInvestorTxs(investor, m, buf, amfx))); 
      await amfx.flushBatch(); await buf.flush(); await p;
      return investor;
    } 
  }
f
  setEthRPCUrl(newRPCUrl) { //L(`nweRPCURL: ${newRPCUrl}`)
    amfx.setWeb3Url(newRPCUrl);
    this.setSync("ethRPCUrl", newRPCUrl);
//    (async() => L(`Personal accounts: ${S(await oF(oO(w3.web3.eth.personal).getAccounts)())}`))();
  }

  async retrieveInvestorWalletData(investor) { L({investor}); if (investor.btcAddress) {
    let key = getInvestorWalletDataKey(investor);
    let cached = await this.syncCache.getData(key);
    if (D(cached)) return cached;  
    
    let sum = a => a.reduce((acc, v) => acc.plus(v.delta), BN(0));
    let getTxs = async address => oA(oO(await btcRpc("GET", L(`gettxs/address/${address}`))).data).map(tx => {
      let ioMap = a => a.map(x => ({ delta: BN(x.value, 10), btcAddress: hexToBtcAddress(x.addr) })), uniqueAddrs = a => K(F(a.map(x => [oS(x.btcAddress), true])));
      let ins = ioMap(tx.ins), outs = ioMap(tx.outs), froms = uniqueAddrs(ins), tos = uniqueAddrs(outs); 
      let isInvestment = tos.some(a => this.getFundDepositAddresses().includes(a));
//      L({tos, isInvestment, fda: this.getFundDepositAddresses()});
      let fromBTC = froms.length === 1 ? froms[0] : U;
      let filteredTos = tos.filter(s => s !== fromBTC);
      let toBTC = filteredTos.length === 1 ? filteredTos[0] : U;
      let filteredSum = a => sum(a.filter(x => x.btcAddress === investor.btcAddress));
      let delta = filteredSum(outs).minus(filteredSum(ins));
      let fee = sum(ins).minus(sum(outs));
      return {...P(tx, T("time txId")), ins, outs, delta, fee, btcTransferType: isInvestment ? ETransactionType.Investment : ((delta < 0) ? ETransactionType.Outgoing : ETransactionType.Incoming) };
    });
    let txs = (await getTxs(investor.btcAddress));

    return this.setSync(key, L({ finalBalance: sum(txs), txs })); 
  } }

  async loadTimeData() { let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    if ((await sIx("time") === 0) && (await sIx("amount") === 0)) { await this.measureTime("Fund Index chart data (single step)", this.idb.withLocalBuffer(async buf => {
      let timeData = await amfx.amfeixM().getAll().call(), length = timeData[0].length;
      timeAndAmount.forEach((t, i) => {
        t.forEach((d, index) => buf.write(tables.eth[t], { index, data: (i === 0 ? parseInt : I)(d) }));
        buf.write(tables.eth.constants, {...countKey(t), startIndex: length });
        this.setSync(t, timeData[i].map((data, index) => ({ index, data })));
      });
//      for (let index = 0; index < length; ++index) timeAndAmount.forEach((t, i) => buf.write(tables.eth[t], { index, data: (i === 0 ? parseInt : I)(timeData[i][index]) }));
  //    timeAndAmount.forEach(name => buf.write(tables.eth.constants, {...countKey(name), startIndex: length }));
    //  timeAndAmount.forEach((t, i) => this.setSync(t, timeData[i].map((data, index) => ({ index, data })))); 
    })) } else await Promise.all(timeAndAmount.map(l => this.updateArray(l))); 
  }

  updateLoadProgress(onLoadProgress, index, length, done) { onLoadProgress({ index, length: D(length) ? length : (done ? index : "unknown") }); }

  async updateGenericArray(onLoadProgress, name, { length, startIndex }, countKey, countTable, dataTable, parms, buf, w3Batcher) {
    if (onLoadProgress) this.updateLoadProgress(onLoadProgress, startIndex, length);
    let index = startIndex || 0;
    let localBuf = buf || this.idb.newBuffer();
    let masterKeys = F(oA(tableStrucMap[dataTable].keyPath).map(k => [k, countKey[k]]));
    let final = async (resolve) => { //L('final');
      localBuf.write(countTable, ({ ...countKey, startIndex: length, length })); //L('I'); 
      if (!D(buf)) await localBuf.flush();
      if (onLoadProgress) this.updateLoadProgress(onLoadProgress, length, length, true);
      resolve();
    } 
    return new Promise(async (resolve, reject) => { try {
      let w3b = w3Batcher || amfx;
      let completed = 0;
      if (index === length) await final(resolve);
      while ((index < length)) { let currentIx = index++; 
        w3b.queueOp(name, [...oA(parms), currentIx], async data => {
          localBuf.write(dataTable, ({ ...masterKeys, index: currentIx, data })); //L('D');
          if (onLoadProgress) this.updateLoadProgress(onLoadProgress, completed, length);
          if (++completed === length - startIndex) { await final(resolve); }
        }, err => { L(`Error in '${name}' array update: ${S(err)}`) });  
      }
      if (!D(w3Batcher)) { await amfx.flushBatch(); }
    } catch(err) { reject(err) } }); 
  }

  async updateArray(arrayName, lengthName, parms) { await this.measureTime(`Update '${arrayName}' array`, async () => { L(`update array ${arrayName}`);
    let countKey = ({ name: lengthName || `${arrayName}.counts` }); 
    let alsi = (await this.getArrayLengthAndStartIndex(tables.eth.constants, countKey, lengthName, parms)); 
    if (D(alsi.value) && !D(alsi.length)) alsi.length = parseInt(alsi.value);
    if (!D(alsi.length)) alsi.length = await this.findArrayLength(arrayName, parms);
    let p = await this.updateGenericArray(this.onLoadProgress(`Update '${arrayName}' array`), arrayName, alsi, countKey, tables.eth.constants, tables.eth[arrayName], parms);//, U, U, () => dp.resolve());
    await amfx.flushBatch(); await p;
    this.setSync(arrayName, await this.idb.getAll(tables.eth[arrayName]));
  }); } 

  async getArrayLengthAndStartIndex(countTable, countKey, lengthName, parms) { 
    return ({ startIndex: 0, ...oO(await this.getData(countTable, countKey, lengthName && (async () => ({ ...countKey, length: parseInt(await amfx.execute(lengthName, parms)) })))) });
  } 

  updateInvestorTxs(investor, { countTable, dataTable }, buf, w3Batcher) { 
    let countKey = { investorIx: investor.index }, parms = [investor.data]; 
    return new Promise(async (resolve, reject) => { try {
      w3Batcher.queueOp(countTable, parms, async length => {
        resolve(await this.updateGenericArray(U, dataTable, { startIndex: 0, length: parseInt(length) }, countKey, tables.eth[countTable], tables.eth[dataTable], parms, buf, w3Batcher));
      }, err => L(`Error while getting array length for '${countTable}-${dataTable}' for investor ${investor.data}: ${S(err)}`));
    } catch(err) { reject(err); } }); //L(`uima ${dataTable} final`);
  }

  async updateInvestorMappedArray(onLoadProgress, { countTable, dataTable }) { await this.measureTime(`Update invsetor mapped array '${dataTable}'`, async () => {
    L(`uima(${countTable}, ${dataTable})`);
    let { startIndex, length, investorMapCountKey } = await this.getInvestorMapUpdateCountData(countTable, dataTable, `eth`);
    let ix = startIndex, investors = this.syncCache.getData("investorsAddresses"), completed = 0, p = Promise.resolve(), olp = onLoadProgress;
    length = investors.length;
    await this.idb.withLocalBuffer(async buf => {
      while (ix < length) { let q = p;
        let r = this.updateInvestorTxs(investors[ix++], { countTable, dataTable }, buf, amfx);
        p = (async () => { await q; await await r; this.updateLoadProgress(olp, ++completed, length); })();
      };
      await amfx.flushBatch(); await p; this.updateLoadProgress(olp, ix, length); await amfx.flushBatch();  
    });
    if (ix !== startIndex) await this.setData(tables.eth.constants, ({...investorMapCountKey, startIndex: ix }));
    L(`uima(${countTable}, ${dataTable}) end`);
  }); }

  async getInvestorMapUpdateCountData(countTable, dataTable, type, lengthTable) {
    let investorMapCountKey = { name: `${countTable}-${dataTable}.counts` };
    let length = lengthTable && await this.idb.count(lengthTable);
    let startIndex = oO(await this.getData(tables[type].constants, investorMapCountKey)).startIndex || 0;
    return { startIndex, length, investorMapCountKey, index: startIndex };
  }

  async updateBitcoinTxs(onLoadProgress, { countTable, dataTable }, fundDepositObj) { //L(`uima(${name}, ${countTable}, ${dataTable})`);
    let { index, length, investorMapCountKey } = await this.getInvestorMapUpdateCountData(countTable, dataTable, `btc`, tables.eth[dataTable]);
    await this.idb.withLocalBuffer(async buf => { 
      for (let d of (await this.idb.getAll(tables.eth[dataTable])).slice(index)) { let key = { investorIx: d.investorIx, index: d.index };
        let fd = fundDepositObj[d.data[0]];
  //      L({fd})
        if (D(fd)) { buf.write(tables.btc[dataTable], {...key, value: fd.satoshiBN.toString(ALPHABET.length) }); }
        else { L(`Bitcoin fund deposit not found for ${d.data[0]}`); }
        buf.write(tables.btc.constants, { ...investorMapCountKey, startIndex: ++index });
        this.updateLoadProgress(onLoadProgress, index, length); 
      } 
    });
    this.updateLoadProgress(onLoadProgress, length, length, true);
  }
 
  async clearTransactionCache(t) { await Promise.all([
    ...T("ntx fundTx rtx reqWD").map(z => this.idb.clear(tables[t][z])),
    ...T("ntx-fundTx rtx-reqWD").map(z => this.idb.write(tables[t].constants, { name: `${z}.counts`, startIndex: 0 }))
  ]); }  

  async clearCache() { await Promise.all(K(tables).map(t => K(tables[t]).map(z => tables[t][z])).flat().map(n => this.idb.clear(n))); }

  getKey(table, data) { return (`${table}${isO(data) ? `:[${tableStrucMap[table].keyPath.map(a => data[a]).join(",")}]` : ''}`) }

  async setData(table, data) { return await this.idb.write(table, data); }
  async getData(table, data, retriever) { return (await this.idb.get(table, data)) || (retriever && (await this.setData(table, await retriever()))); } 

  async measureTime(name, promise) { this.loadProgress.timings[name] = (await timeFunc(promise)).time; } 

  getFactor() { return BN(10).pow(this.decimals); } 

  async computePerformance() { await this.futs.loadConstants.promise;
    let f = this.getFactor(), ff = f.times(100), performance = [], [time, amount] = T("time amount").map(t => (this.getSync(t))).map(y => y.map(x => x.data));  
    L({f, ff});
    for (let x = 0, acc = BN(1.0); x < amount.length; ++x) { let deltaFactor = ff.plus(BN(amount[x])).div(ff); performance.push([time[x], acc = acc.times(deltaFactor), deltaFactor]); }
    let timeData = performance.map(([t, d]) => [1000*t, parseFloat(d.toString())]);
    E(L({ performance, timeData, roi: (100*timeData[timeData.length - 1][1] - 100), dailyChange: parseFloat((BN(amount[amount.length - 1]).div(f)).toString()) })).forEach(([k, v]) => this.setSync(k, v));
  }

  binSearch(e, low, high) { while (high > low) { let m = low + ((high - low) >> 1); if (e(m)) { high = m; } else if (low < m) { low = m; } else break; } return high; }
  async findArrayLength(arrayName, parms) {  
    let exceedsLength = async l => { try {//L(`Processing item ${index} for ${name} (${dataTable}) with parms = ${S(parms)}`);
      let data = await (amfx.amfeixM()[arrayName](...oA(parms), l).call()); //L('C');
      if (isS(data) && data.length === 0) throw new Error(`Empty response for ${arrayName}(${parms})`);
    } catch { return true; } }
    let l = 1;
    while ((l < (1 << 52)) && !await exceedsLength(l)) { l <<= 1; }
    let low = l >> 1, high = l;
    while (high > low) { let m = low + ((high - low) >> 1); if (await exceedsLength(m)) { high = m; } else if (low < m) { low = m; } else break; }
    L(`Found length ${high} for array ${arrayName}`);
    return high;
  }

  getPerformanceIndex(time, lowIndex, highIndex) { let p = this.performance, low = lowIndex || 0, high = highIndex || (p.length - 1); // L(`gpi(${time}, ${low}, ${high})`)
    while (high > low) { let m = low + ((high - low) >> 1); if (p[m][0] > time) { high = m; } else if (low < m) { low = m; } else break; }
    return high;
  }

  async computeAllInvestorData() { 
    let investors = [], investorsAddresses = this.investorsAddresses, olp = this.onLoadProgress("Computing data structures");  
    let d = await Promise.all(investorMaps.map(async im => await Promise.all(['eth', 'btc'].map(t => this.idb.getAll(tables[t][im.dataTable])))));
    let e = d.map(im => im.map(x => F(x.map(z => [z.investorIx, []]))));
    d.forEach((im, a) => im.forEach((x, b) => x.forEach(z => { e[a][b][z.investorIx].push(z); } ))); 
    for (let ix = 0; ix < investorsAddresses.length; ++ix) { this.updateLoadProgress(olp, ix, investorsAddresses.length); investors.push(await this.computeInvestorData(investorsAddresses[ix], U, e)); }
    let approvedDepositTxIds = F(investors.map(i => i.Deposits.map(d => d.txId)).flat().map(k => [k, true]));  
    this.syncCache.set({ investors, withdrawalRequests: investors.map(i => i.Pending_Withdrawals).flat(), pendingDeposits: G(this.fundDeposits, v => v.filter(d => !approvedDepositTxIds[d.txId])) });  
    this.updateLoadProgress(olp, investorsAddresses.length, investorsAddresses.length);
    L("computeAllInvestorData done. ####")
  };

  async getInvestorIndexFromInvestorsAddressesTable(ethAddress) { return (L(await this.idb.get(tables.eth.investorsAddresses, { data: ethAddress }, "data", ["data"])))?.index; }

  async computeInvestorData(investor, lengths, allData) { //L(`retrieveInvestorData = ${S(investor)}`);  
    if (!(D(investor.data))) return U;
    let cached = this.getSync(getInvestorDataKey(investor));
    if (cached) { L('cached'); return cached; }
    if (!D(investor.index)) { investor.index = await this.getInvestorIndexFromInvestorsAddressesTable(L(investor.data)); }
    let invKey = { investorIx: investor.index }; //L(`Retrieving investor ${investor} data`);
//    L(`invKey = ${S(invKey)}`);
    let ethDataMap = ([txId, pubKey, signature, action, timestamp]) => ({ timestamp: parseInt(oS(timestamp)), txId, pubKey, signature, action });
    let dataMaps = { eth: x => ({index: x.index, ...ethDataMap(((x.data)))}), btc: x => ({index: x.index, value: BN(x.value, ALPHABET.length) }) }
    let linkValues = ([e, b]) => { for (let index = 0; index < Math.min(e.length, b.length); ++index) e[index].value = b[index].value; return e; };
    let [txs, reqWD] = (D(allData)) ? allData.map((im, j) => linkValues(T('eth btc').map((t, z) => (oA(im[z][invKey.investorIx])).map(oO).map(dataMaps[t]))))
    : await Promise.all(investorMaps.map(async (m, j) => {  
        let fastLength = (oO(oA(lengths)[j]))[(invKey.investorIx)];
        let length = D(fastLength) ? (fastLength) : ((oO(await this.idb.get((tables.eth[(m).countTable]), (invKey)))).length || 0);
        return linkValues(await Promise.all(T('eth btc').map(async t => { let r = [], buf = this.idb.newBuffer();
          for (let index = 0; index < length; ++index) { r.push(U); buf.get(tables[t][m.dataTable], ({...invKey, index}), d => { r[index] = d; }); }
          await buf.flush(); return r.map(oO).map(dataMaps[t]);
    }))); }));
    investor.pubKey = oO(oA(txs)[0]).pubKey;
    
    let txIdToObj = a => F(a.map(e => [e.txId, e])); // XXX: does not check if duplicates are identical -- only retains one of them with same txId   
    let h = { Pending_Withdrawals: txIdToObj(reqWD), ...F(T("Deposits Withdrawals").map((k, i) => [k, txIdToObj(txs.filter(x => x.action === S(i)))])) };
    let txIdMap = G(h, v => x => v[x.txId]), f = (z, b) => V(z).filter(x => txIdMap.Deposits(x) && b(x));
    let g = { Deposits: V(h.Deposits), Pending_Withdrawals: f(h.Pending_Withdrawals, x => !txIdMap.Withdrawals(x)), Withdrawals: f(h.Withdrawals, x => txIdMap.Pending_Withdrawals(x)) };
    g.investment = g.Deposits.concat(g.Withdrawals).sort((a, b) => a.timestamp - b.timestamp);  
    for (let i of g.investment) { i.perfIndex = this.getPerformanceIndex(i.timestamp); }
    for (let d of g.Deposits) { d.withdrawal = txIdMap.Withdrawals[d]; d.depositedValue = d.value; d.entryPerf = this.performance[d.perfIndex][1]; 
      d.depositStatus = (d.withdrawal ? stati.Deposits.Withdrawn : (txIdMap.Pending_Withdrawals[d] ? stati.Deposits.Pending_Withdrawal : stati.Deposits.Active));  
//      let startPerf = ; // (startPerf[0] >= d.timestamp) ? startPerf[1] : endPerf; 
      d.exitPerf = this.performance[D(d.withdrawal?.perfIndex) ? d.withdrawal?.perfIndex : (this.performance.length - 1)][1]; d.appliedPerf = d.exitPerf.div(d.entryPerf);
      d.satoshiBN = d.value = d.currentValue = (d.entryPerf.isZero() || !D(d.value)) ? U : BN(d.value.times(d.appliedPerf).toFixed(0));
    } 
    for (let w of g.Withdrawals) A(A(w, { deposit: txIdMap.Deposits(w)}), P(w.deposit, T("depositedValue currentValue"))); 
    for (let wr of g.Pending_Withdrawals) wr.status = txIdMap.Withdrawals(wr) ? stati.Pending_Withdrawals.Processed : stati.Pending_Withdrawals.Pending;
//    for (let i of g.investment) i.accCurrentValue = (currentValueAcc = D(currentValueAcc) && D(i.currentValue) ? currentValueAcc[isDeposit(i) ? "plus" : "minus"](i.currentValue) : U); 
    g.valueSeries = () => g.computedValues = g.computedValues || (() => { L('Computing series...')
      let interestEvents = [], lastIndex = -1, deposits = BN(0), interests = BN(0), withdrawals = BN(0), calcTotal = () => deposits.plus(interests).minus(withdrawals);  
      let w = timestamp => ({ timestamp, deposits, interests, withdrawals, total: calcTotal() });
      for (let ix = 0; ix < g.investment.length; ++ix) { let i = g.investment[ix];
        for (let pi = Math.max(0, lastIndex); pi < i.perfIndex; ++pi) { let [timestamp, , perf] = this.performance[pi];
          interests = interests.plus(calcTotal().times(perf.minus(BN(1.0))));
          interestEvents.push(w(timestamp));
        } 
        lastIndex = i.perfIndex;
        if (i.action === "0") { deposits = deposits.plus(i.depositedValue); } else { withdrawals = withdrawals.plus(i.currentValue); }
        A(i, w()).total = calcTotal();
      }
      g.investmentValue = calcTotal();
      return F(T("deposits interests withdrawals total").map(k => [k, (g.investment.concat(interestEvents)).map(x => [1000*x.timestamp, satoshiToBTCFloat(x[k])])]))
    })(); 
//    L(P(g, T("investmentValue")));
    return this.setSync(getInvestorDataKey(investor), g);
  }

  async checkConsistency(investor) {
    try {
      investor.derivedEthAddress = pubKeyToEthAddress(investor.pubKey, true); 
      investor.btcAddress = pubKeyToBtcAddress(investor.pubKey);   
      investor.anomalous = anomalousInvestorIndexMap[investor.index] ? "Yes" : "No";
      if (investor.derivedEthAddress.toLowerCase() !== investor.data.toLowerCase()) L(`Investor (${investor.index}): Address discrepancy ${investor.data} !== ${investor.derivedEthAddress}`)
    } catch (err) { investor.pubKeys = []; investor.error = "Yes"; investor.anomalous = "Yes"; } 
  }

  getInvestorData(investor) { return this.investorData[investor] = D(this.investorData[investor]) ? this.investorData[investor] : this.computeInvestorData(investor); }

  async destroy() { await this.idb.close(); }
}

//L(`032b54175dac49b86d33528488dc1770223be678fe9e283ff210d6841f109230c7 ==> ${S({btc: pubKeyToBtcAddress("032b54175dac49b86d33528488dc1770223be678fe9e283ff210d6841f109230c7"),
//eth: pubKeyToEthAddress("032b54175dac49b86d33528488dc1770223be678fe9e283ff210d6841f109230c7")})}`)

let data = new Data(), createData = () => data = new Data(), resetData = () => { return data ? data.destroy().then(createData()) : (createData()); }
//createData();
  
export { Transaction, tableStrucMap, stati, ethInterfaceUrls, btcRpcUrl, btcFields, ethBasicFields, getInvestorDataKey, getInvestorWalletDataKey, data, resetData, amfeixFeeFields, amfeixAddressLists };