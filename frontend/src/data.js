import Web3 from 'web3';
import BigNumber from 'bignumber.js'; 
import amfeixCjson from './amfeixC.json'; 
import { A, D, E, F, H, I, K, L, S, U, V, oA, oO, oF, isO, isA, singleKeyObject, makeEnum } from './tools'; 
import { IndexedDB } from './db'; 
let BN = v => new BigNumber(v);

let newDB = false //|| true; 

let stati = { Deposits: makeEnum("Active Withdrawn Withdrawal_Requested"), Withdrawal_Requests: makeEnum("Pending Processed") }; 

const btcRpcUrl = `http://157.245.35.34/`, 
ganacheInterfaceUrl = "http://46.101.6.38:8545",
ethInterfaceUrl = "ws://46.101.6.38/ws"; 
//ethInterfaceUrl = "http://46.101.6.38:8547/"; 
//const web3 =  new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
const web3 = new Web3(new (ethInterfaceUrl.indexOf("ws://") === 0 ? Web3.providers.WebsocketProvider : Web3.providers.HttpProvider)(ethInterfaceUrl));
let amfeixAddress = "0xb0963da9baef08711583252f5000Df44D4F56925";
let amfeixC = new web3.eth.Contract(amfeixCjson.abi, amfeixAddress); 
let amfeixM = () => amfeixC.methods;

let amfeixFeeFields = "fee1 fee2 fee3".split(" ");
let invMap = (countTable, dataTable) => ({countTable, dataTable});
let arrays = "investorsAddresses time amount".split(" "), indexMaps = "feeAddresses fundDepositAddresses".split(" "), investorMaps = [invMap("ntx", "fundTx"), invMap("rtx", "reqWD")]; 
let ethBasicFields = "owner aum decimals btcPrice".split(" ").concat(amfeixFeeFields).concat(indexMaps.map(k => `${k}Length`));
const btcFields = "blockcount connectioncount difficulty blockchaininfo".split(" ");

let btcRpc = async (method, func, params) => ((await fetch(`${btcRpcUrl}${func}/${method === "GET" ? `?${E(oO(params)).map(x => x.map(encodeURIComponent).join("=")).join("&")}` : ''}`, 
 { method, mode: 'cors', headers: { "content-type": "application/json" }, ...(method === "POST" ? { body: S({params}) }: {}) })).json());

let invMapDBStruc = ({countTable, dataTable}) => ({ ...singleKeyObject(countTable, struc(["investorIx"])), ...singleKeyObject(dataTable, struc(["investorIx", "index"])) })
 
export let tableStrucMap = {}
let hierName = (o, p) => F(E(o).map(([k, v]) => { let q = p ? [p, k].join("-") : k; return [k, isA(v) ? (tableStrucMap[q] = {...v[0], table: q}, q) : hierName(v, q)]; }));
let struc = (keyPath, indices) => [{ keyPath, indices }];
let tables = hierName({ 
  eth: { ...F(arrays.concat(indexMaps).map(k => [k, struc(["index"])])),  constants: struc(["name"], [["name", "name", true]]), ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1]) }, 
  btc: {  constants: struc(["name"], [["name", "name", true]]), ...invMapDBStruc(investorMaps[0]), ...invMapDBStruc(investorMaps[1])  } 
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
  eth: name => async () => ({ name, value: await amfeixM()[name]().call() })
}

let schedule = (action, interval) => {
  let perform = async () => {
    await action();
    setTimeout(() => schedule(action, interval), interval);
  };
}
 
let getInvestorDataKey = investorIx => `investor_${investorIx}`;

class Data {
  constructor() { 
    this.localData = (d => d ? L(JSON.parse(d)) : { dbix: 60 })((localStorage.getItem("_")));
    if (newDB) this.localData.dbix++;
    A(this, { tables, tableStrucMap, investorData: {}, observers: {}, data: {}, syncCache: new SyncCache(), idb: new IndexedDB(S(this.localData.dbix)) }); 
    for (let q = 0; q < this.localData.dbix; ++q) this.idb.deleteDB(S(q));
//    this.localData = { dbix: 63 };
    (this.saveLocalData = () => localStorage.setItem("_", S(this.localData)))();

    this.loadProgress = {};
    let onLoadProgress = name => d => { this.loadProgress[name] = d; this.syncCache.setData("loadProgress", this.loadProgress); };
    (async () => { await this.idb.init(); 
      L('Load phase 0: Single shots for simple arrays on fresh DB');
      await Promise.all([this.loadTimeDataSingleShot(onLoadProgress("timeData")), this.loadInvestorsAddressesSingleShot(onLoadProgress("allInvestors"))]);
      L('Load phase 1: Constants, investor addresses, fund chart (time/amount)')
      await Promise.all([...arrays.map(l => this.updateSimpleArray(onLoadProgress(l), l)), ...indexMaps.map(l => this.updateSimpleArray(onLoadProgress(l), l, `${l}Length`)),
        ...E(constantFields).map(([t, f]) => f.map(name => this.getData(tables[t].constants, { name }, constantRetrievers[t](name)))).flat()]);  
      L('Load phase 1 done');
      for (let t of "investorsAddresses time amount fundDepositAddresses feeAddresses".split(" ")) this.syncCache.setData(t, await this.idb.getAll(tables.eth[t]));
      for (let t in constantFields) for (let name of constantFields[t]) this.syncCache.setData(name, (await this.getData(tables[t].constants, { name })).value);
      this.computeTimeDataFromTimeAndAmount();
      L('Load phase 2: Deposits, withdrawals, withdrawal requests');
      await Promise.all([...investorMaps.map(m => this.updateInvestorMappedArray(onLoadProgress(`investors:${m.dataTable}`), m))]);
      L('Load phase 3: Bitcoin transactions');
      await Promise.all([...investorMaps.map(m => this.updateBitcoinTxs(onLoadProgress(`btcTx:${m.dataTable}`), m))]);
      L('Load phase 4: Computing data');
      (async () => {
        this.investors = {};
        this.withdrawalRequests = [];
        let investorsAddresses = this.syncCache.getData("investorsAddresses"); let olp = onLoadProgress("investorData");
        for (let ix = 0; ix < investorsAddresses.length; ++ix) { this.updateLoadProgress(olp, ix, investorsAddresses.length);
          let investor = await this.retrieveInvestorData(investorsAddresses[ix]);
          let i = { index: investorsAddresses[ix].index, address: investorsAddresses[ix].data, investmentValue: investor.investmentValue, Withdrawal_Requests: investor.Withdrawal_Requests };
          this.investors[i.index] = i;
          this.withdrawalRequests.push(i.Withdrawal_Requests);
        } 
        this.syncCache.setData("investors", V(this.investors));
        this.syncCache.setData("withdrawalRequests", this.withdrawalRequests.flat());
      this.updateLoadProgress(olp, investorsAddresses.length, investorsAddresses.length);
      })();
    })();
  }

  getFactor() { return BN(10).pow(this.syncCache.getData('decimals')); } 

  computeTimeDataFromTimeAndAmount() {
    let performance = [], [time, amount] = "time amount".split(" ").map(t => this.syncCache.getData(t)).map(y => y.map(x => x.data));  
    let f = this.getFactor(), ff = f.times(100);// L({factor: f})
    for (let x = 0, acc = BN(1.0); x < amount.length; ++x) performance.push([time[x], (acc = (acc.times((BN(amount[x])).plus(ff))).div(ff)).plus(0)]);  
    E(({ timeData: performance.map(([t, d]) => [t, parseFloat(d.times(100).toString())]), roi: parseFloat(performance[performance.length - 1][1].times(100).minus(100).toString()), dailyChange: parseFloat((BN(amount[amount.length - 1]).div(f)).toString()) }))
    .map(([k, v]) => this.syncCache.setData(k, v));
    this.performance = performance;
  }

  getPerformanceIndex(time, lowIndex, highIndex) { let p = this.performance;
    let low = lowIndex || 0, high = highIndex || (p.length - 1); // L(`gpi(${time}, ${low}, ${high})`)
    while (high > low) { let m = low + ((high - low) >> 1); 
//      L(`low = ${low} m = ${m} high = ${high}`);
    //  L(`low = ${low} (${p[low][0]}) m = ${m} (${p[m][0]}) high = ${high} (${p[high][0]})`);
      if (p[m][0] > time) { high = m; } else if (low < m) { low = m; } else break;
    }
  //  L(`gpi result = ${high} (${p[high][0]}) for time (${time}) [-1: (${(high > 0) && p[high - 1][0]})] | +1: (${(high + 1 < p.length) && p[high + 1][0]})]`)
    return high;
  }

  async loadTimeDataSingleShot(onLoadProgress) { let countKey = name => ({ name: `${name}.counts` });
    let sIx = async name => oO(await this.getData(tables.eth.constants, countKey(name))).startIndex || 0;
    let length;
    if ((await sIx("time") === 0) && (await sIx("amount") === 0)) {
      this.updateLoadProgress(onLoadProgress, 0);
      let timeData = await amfeixM().getAll().call();
      length = timeData[0].length;
      for (let index = 0; index < length; ++index) {
        await Promise.all(["time", "amount"].map((t, i) => this.setData(tables.eth[t], { index, data: (i === 0 ? parseInt : I)(timeData[i][index]) }))).then(() => {
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
      let investorsAddresses = await amfeixM().getAllInvestors().call();
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
    let alsi = oO(await this.getData(countTable, countKey, lengthName && (async () => ({ ...countKey, length: parseInt(await amfeixM()[lengthName](...oA(parms)).call()) }))));
    this.updateLoadProgress(onLoadProgress, alsi.startIndex, alsi.length);
    //L(`galsi(${countTable}, ${S(countKey)}, ${lengthName}, ${parms}) ==> ${S({ length, startIndex })}`) 
    return ({ startIndex: 0, ...alsi });
  } 

  updateLoadProgress(onLoadProgress, index, length, done) { onLoadProgress({ index, length: D(length) ? length : (done ? index : "unknown") }); }

  async updateGenericArray(onLoadProgress, name, { length, startIndex }, countKey, countTable, dataTable, parms) {
    //L(`Array '${name}' ${S({ countTable, dataTable })} start index: ${startIndex} (${length ? `known length = ${length}` : 'unknown length'})`)
    this.updateLoadProgress(onLoadProgress, startIndex, length);
    let index = startIndex;
    let catchWrap = p => p.catch(e => { throw L(e) });
    let masterKeys = F(oA(tableStrucMap[dataTable].keyPath).map(k => [k, countKey[k]]));
    try { while (!D(length) || (index < length)) { //L(`Processing item ${index} for ${name} (${dataTable}) with parms = ${S(parms)}`);
      let data = await (amfeixM()[name](...oA(parms), index).call()); //L('C');
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

  setData(table, data) { return this.idb.write(table, data); }
  async getData(table, data, retriever) { return (await this.idb.get(table, data)) || (retriever && (await this.setData(table, await retriever()))); } 

  async retrieveInvestorData(investor) { 
    let cached = await this.syncCache.getData(getInvestorDataKey(investor.index));
    if (cached) return cached;
    let invKey = { investorIx: investor.index }; //L(`Retrieving investor ${investor} data`);
    let ethDataMap = x => ({ timestamp: parseInt(x.timestamp), txId: x.txId, pubKey: x.pubKey, signature: x.signature, action: x.action });
    let dataMaps = { eth: x => ({index: x.index, ...ethDataMap(oO(x.data))}), btc: x => ({index: x.index, value: x.value}) }
    let getList = async m => { let length = ((oO(await this.idb.get((tables.eth[(m).countTable]), (invKey)))).length || 0);
      let [e, b] = await Promise.all(['eth', 'btc'].map(async t => {
        let r  = []; for (let index = 0; index < length; ++index) r.push(await this.idb.get(tables[t][m.dataTable], ({...invKey, index}))); return r.map(oO).map(dataMaps[t]);
      }));
      for (let index = 0; index < length; ++index) e[index].value = b[index].value;
      return e;
    };
    let [txs, reqWD] = await Promise.all(investorMaps.map(getList));
    let toObj = a => F(a.map(e => [e.txId, e]));
    let dedup = d => V(toObj(d)); // XXX: does not check if duplicates are identical -- only retains one of them with same txId  
    let data = { ...F(["Deposits", "Withdrawals"].map((k, i) => [k, dedup(txs.filter(x => x.action === S(i)))])), Withdrawal_Requests: dedup(reqWD) }
    let objs = F(E(data).map(([k, v]) => [k, toObj(v)]));
    let has = F(E(objs).map(([k, v]) => [k, x => D(v[x.txId])]));  
    let g = ({ 
      Deposits: data.Deposits.map(d => d),// hasWithdrawalRequest: has.withdrawalRequest(d) })), 
      Withdrawal_Requests: data.Withdrawal_Requests.filter(x => has.Deposits(x) && !has.Withdrawals(x)), 
      Withdrawals: data.Withdrawals.filter(x => has.Deposits(x) && has.Withdrawal_Requests(x)) 
    });

//    let oneBtc = (new BigNumber(10)).pow(18);
    let investment = g.Deposits.concat(g.Withdrawals).sort((a, b) => a.timestamp - b.timestamp);
    //let toSatoshi = btc => new BigNumber(btc);//).times(oneBtc).toFixed();
  //  L(objs.withdrawalRequest);    return {};
 //   L(K(has));    L(objs); L({reqWD})
//    let finalPerf = this.performance[this.performance.length - 1][1];
    let acc = BN(0), currentValueAcc = BN(0);
    for (let d of g.Deposits) { d.status = ((has.Withdrawals(d)) ? stati.Deposits.Withdrawn : (has.Withdrawal_Requests(d) ? stati.Deposits.Withdrawal_Requested : stati.Deposits.Active));
      let endTimestamp = (oO(objs.Withdrawal_Requests[d.txId]) || oO(objs.Withdrawals[d.txId])).timestamp || 0;
      let endIx = (d.status === stati.Deposits.Active) ? this.performance.length - 1 : this.getPerformanceIndex(endTimestamp);
     // if ((d.status !== stati.Deposits.active) && !D(objs.Withdrawal_Requests[(d.txId)])) L(`Can't find wrq for ${d.txId} (${(d)})`);
     // let endIx = this.performance.length - 1;
      let startIx = this.getPerformanceIndex(d.timestamp), startPerf = this.performance[startIx];
      let endPerf = this.performance[endIx][1];
      let perf = endPerf.div((startPerf[0] >= d.timestamp) ? startPerf[1] : endPerf);
      //L(`Deposit timestamp ${d.timestamp} (${new Date(d.timestamp)}) performance starttime ${startPerf[0]} (${new Date(startPerf[0])}) startPerf ${startPerf[1].toString()} endPerf ${endPerf.toString()} f = ${perf}`);
      d.performance = perf.toString();
      d.finalValue = BN(d.value).times(perf);
      d.hasWithdrawalRequest = has.Withdrawal_Requests(d) ? "Yes" : "No";
      d.hasWithdrawal = has.Withdrawals(d) ? "Yes" : "No";
//      L(perf.toString());
    }
    for (let wr of g.Withdrawal_Requests) wr.status = has.Withdrawals(wr) ? stati.Withdrawal_Requests.Processed : stati.Withdrawal_Requests.Pending;
    for (let i of investment) { let v = BN(i.value); 
      i.accValue = parseFloat((acc = (i.action === "0" ? acc.plus(v) : acc.minus(v))).plus(0).toString()); 
      i.accCurrentValue = parseFloat((currentValueAcc = (i.action === "0" ? currentValueAcc.plus(i.finalValue) : currentValueAcc.minus(v))).plus(0).toString()); 
    }
    g.investment = investment.map(x => [x.timestamp, x.accValue]);
    g.investmentValue = parseFloat(currentValueAcc.toString());
    g.value = investment.map(x => [x.timestamp, x.accCurrentValue]);;
    for (let d of g.Deposits) d.finalValue = d.finalValue.toString();
      //L(g);
    return this.syncCache.setData(getInvestorDataKey(investor.index), g);
  }

  getInvestorData(investor) { return this.investorData[investor] = D(this.investorData[investor]) ? this.investorData[investor] : this.retrieveInvestorData(investor); }
}

let data = new Data(); 
  
export { stati, ethInterfaceUrl, btcRpcUrl, btcFields, ethBasicFields, getInvestorDataKey, data, amfeixFeeFields, ganacheInterfaceUrl };