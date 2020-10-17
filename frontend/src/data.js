import Web3 from 'web3';
import amfeixCjson from './amfeixC.json'; 
import { D, E, F, K, L, S, V, oA, oO, oF } from './tools'; 

let btcRpcUrl = `http://157.245.35.34/getrawtransaction/`; 
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
const amfeixC = new web3.eth.Contract(amfeixCjson.abi, "0xb0963da9baef08711583252f5000Df44D4F56925"); 

let amfeixFeeFields = "fee1 fee2 fee3".split(" ");
let ethBasicFields = "aum decimals btcPrice".split(" ").concat(amfeixFeeFields);

let getList = async (numName, mapName, parms) => { 
  let a = n => { let r = []; for (var x = 0; x < n; ++x) r.push(0); return r; }
  return await Promise.all(a(await amfeixC.methods[numName](...oA(parms)).call()).map((d, x) => amfeixC.methods[mapName](...oA(parms), S(x)).call()));
} 

class Data {
  constructor() { let i = this; 
    this.investorData = {};
    this.observers = {};
    this.data = {};

    (async () => { 
      
      await Promise.all(ethBasicFields.map(async k => this.setData(k, await amfeixC.methods[k]().call())));
      let retrieveList = async l => this.setData(l, await getList(`${l}Length`, l)); 
      this.setData("investors", await amfeixC.methods.getAllInvestors().call());
      let timeData = await amfeixC.methods.getAll().call(); 
      let data = []; 
      for (var x = 0, l = timeData[1].length, acc = 100 * this.getFactor(); x < l; ++x) data.push((acc += parseInt(timeData[1][x]))/this.getFactor()); 
      let td = data.map((d, i) => [parseInt(timeData[0][i]), d]); 
      this.setData("timeData", td);
      this.setData("roi", td[td.length - 1][1] - 100);
      this.setData("dailyChange", parseInt(timeData[1][timeData.length - 1])/this.getFactor());
      await Promise.all([retrieveList("fundDepositAddresses"), retrieveList("feeAddresses")]);
    })(); 
  }

  addObserver(key, onChange, context) { L(`addObserver(${(key)})`);
    (this.observers[key] = oA(this.observers[key])).push({ onChange, context });
    onChange(this[key], context);
  }

  setData(key, data) { L(`setData(${(key)}, ?)`);
    this.data[key] = data;
    let obs = oA(this.observers[key]);
    let retain = obs.map(o => o.onChange(data, o.context));
    if (retain.length > 0) this.observers[key] = obs.filter((o, i) => retain[i]);
  }

  retrieveInvestorData(investor) { (async (investor) => { //L(`Retrieving investor ${investor} data`);
    let setData = (k, d) => { this.setData(`investorData.${investor}.${k}`, d); }
    let toObj = a => F(a.map(e => [e.txId, e]));
    let dedup = d => V(toObj(d)); // XXX: does not check if duplicates are identical -- only retains one of them with same txId 
    let txs = (await getList("ntx", "fundTx", [investor]));  
    let data = {
      deposit: dedup(txs.filter(x => x.action === "0")),
      withdrawal: dedup(txs.filter(x => x.action === "1")),
      withdrawalRequest: dedup(await getList("rtx", "reqWD", [investor]))
    }
    let objs = F(E(data).map(([k, v]) => [k, toObj(v)]));
    let has = F(E(objs).map(([k, v]) => [k, x => D(v[x.txId])]));  
    let g = { 
      deposits: data.deposit.map(d => ({...d, hasWithdrawalRequest: has.withdrawalRequest(d) })), 
      withdrawalRequests: data.withdrawalRequest.filter(x => has.deposit(x) && !has.withdrawal(x)), 
      withdrawals: data.withdrawal.filter(x => has.deposit(x) && has.withdrawalRequest(x)) 
    };
    K(g).forEach(k => setData(k, g[k]));
    let allTxIds = g.deposits.map(d => d.txId);
    L({allTxIds});
    let getBtcTx = async txId => (await fetch(btcRpcUrl, { method: "POST", mode: 'cors', headers: { "content-type": "application/json"}, body: S(L({ params: [txId, true] })) })).json();
    g.bitcoinTxs = F(await Promise.all(allTxIds.map(async txId => [txId, 
       L(oA(oO((await getBtcTx(txId)).result).vout).map(({value, scriptPubKey: {addresses}}) => ({value, address: addresses[0]})).filter(x => this.data.fundDepositAddresses.includes(x.address)).map(x => x.value))])));
    setData("bitcoinTxs", g.bitcoinTxs);
    return L(g);
  })(investor); }

  getFactor() { return Math.pow(10, this.data.decimals); } 
  getInvestorData(investor) { return this.investorData[investor] = D(this.investorData[investor]) ? this.investorData[investor] : this.retrieveInvestorData(investor); }
}

let data = new Data();

export { ethBasicFields, data, amfeixFeeFields };