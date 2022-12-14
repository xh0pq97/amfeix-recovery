/* eslint no-unused-vars: 0 */
/* eslint no-loop-func: 0 */
import Web3 from 'web3';
import amfeixCjson from '../amfeixC.json';
import { A, F, I, L, S, oA, oO } from '../common/tools';
import { BN } from './bignumber';
import aggregate from '../lib/multicall/src/aggregate';
//import nodeFetch from 'node-fetch';
//global.fetch = nodeFetch;

export let amfeixAddress = "0xb0963da9baef08711583252f5000Df44D4F56925";
 
class ABI { constructor(abi) { this.methodMap = F(abi.filter(x => x.type === "function").map(x => [x.name, x])); } }

let abi = new ABI(amfeixCjson.abi);

class MultiCallBatch { constructor() { this.calls = []; }
  add(target, method, params, onSuccess, onError) { this.calls.push(({ target, method, params, onSuccess, onError })); }
  async execute(rpcUrl) { 
    let calls = this.calls.map((c, i) => { let m = abi.methodMap[c.method];
      return ({ target: c.target, call: [`${c.method}(${m.inputs.map(x => x.type).join(",")})(${m.outputs.map(x => x.type).join(",")})`, ...c.params], returns: m.outputs.map((x, j) => [`${i}_${j}`, I]) });
    });
    //    L({calls});
    let results = (await aggregate(calls, { rpcUrl, multicallAddress: '0x5e227AD1969Ea493B43F840cfF78d08a6fc17796' }))?.results?.original;
    L(`MultiCallBatch results = ${S(results)}`)
    this.calls.forEach((c, i) => { let q = abi.methodMap[c.method].outputs.map((x, j) => (r => (r?._hex) ? BN(r._hex.slice(2), 16).toString() : r)(results[`${i}_${j}`]));
      //      L({method: c.method, parms: c.params, q});
      return c.onSuccess(q.length === 1 ? q[0] : q);
    });
  }
}

class AmfeixContract {
  setWeb3Url(url) {
    A(this, { url, queuedOps: [], batchIx: 0, processedOpCount: 0, queuedBatches: [], processing: false, inFlight: [], maxInFlight: 4, nextIx: 0, batchSize: 32, activeBatch: Promise.resolve() });
    this.web3 = new Web3(new (this.url.indexOf("ws://") === 0 ? Web3.providers.WebsocketProvider : Web3.providers.HttpProvider)(this.url, { timeout: 60000 }));
    this.amfeixM = () => (new this.web3.eth.Contract(amfeixCjson.abi, amfeixAddress, { from: this.from })).methods;
  } 

  setFrom(address) { this.from = address; }

  async execute(op) { try { return await amfx.amfeixM()[op.method](...oA(op.params)).call(); } catch (err) { return { err }; } }

  queueOp(method, params, onSuccess, onError) {  this.queuedOps.push(({ method, params, onSuccess, onError })); }
  async executeBatch() {
    let batch = new MultiCallBatch();
    for (let op of this.queuedOps.slice(0, this.batchSize)) batch.add(amfeixAddress, op.method, oA(op.params), op.onSuccess, op.onError);
    this.queuedOps = this.queuedOps.slice(this.batchSize);
    let q = this.activeBatch;
    this.activeBatch = (async () => { await q; await batch.execute(this.url); })();
  }

  async actualFlushBatch() { while (this.queuedOps.length > 0) {
      //      L({length: this.inFlight.length, queued: this.queuedOps.length, mif: this.maxInFlight});
      if (this.inFlight.length === this.maxInFlight) { await this.inFlight[0]; this.inFlight.shift(); }
      if (this.inFlight.length > this.maxInFlight) L(`>> ${S({ length: this.inFlight.length, mif: this.maxInFlight })}`);
      this.inFlight.push(this.executeBatch());
      //      await Promise.all(this.inFlight);
  } }

  async flushBatch() { await new Promise((resolve, reject) => { try { setTimeout(async () => resolve(await this.actualFlushBatch()), 0); } catch (err) { reject(err); } }); }
}

export let amfx = new AmfeixContract();