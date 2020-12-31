/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
/* eslint no-unused-vars: 0 */
// eslint-disable-next-line
import React from 'react';
// eslint-disable-next-line
import { App } from './app';  
// eslint-disable-next-line
import { amfeixFeeFields, data, resetData } from './core/data'; 
// eslint-disable-next-line
import { A, U, G, I, K, L, D, E, P, R, S, T, oS, singleKeyObject, makeEnum, future } from './common/tools'; 
import { EUserMode, ETestStatus } from './core/enums'; 
import _investorsAddresses from './test/investorsAddresses.json'
import _fundDepositAddresses from './test/fundDepositAddresses.json'
import _feeAddresses from './test/feeAddresses.json'
// eslint-disable-next-line
//import { render, unmountComponentAtNode } from "react-dom";

//import { newit, assert, syncCacheHas, idbCount } from './core/test';

//import { oS } from '../common/tools';

//global.document = {}; global.window = { document }
class Test { constructor(name, t) { A(this, { name, t, fut: future() }); }
  async execute() { try { this.started = true; let r = await this.t(); this.done = true; this.fut.resolve(r); } catch(e) { this.err = e; } }
  getStatus() { 
    if (D(this.err)) { return ETestStatus.Failed; } 
    if (!this.started) { return ETestStatus.Described; }
    if (!this.done) { return ETestStatus.Running; }
    return ETestStatus.Success;
  }
}
class Context { constructor(name, descriptor, preparedFut, timeout, parent) { 
    A(this, { name, descriptor, parent, preparedFut, timeout, beforeAll: [], beforeEach: [], tests: [], children: [] }); 
    if (parent) parent.addChild(this);
  }
  addChild(c) { this.children.push(c); } 
  computeSummary() { let s = G(ETestStatus, () => 0); 
    let sum = (a, b) => G(ETestStatus, (v, k) => a[k] + b[k]);
    for (let c of this.children) s = sum(s, c.summ);
    for (let t of this.tests) s[K(t.getStatus())[0]]++;
    this.summ = s;
  }
  async execute(onUpdate) { if (this.preparedFut) await this.preparedFut.promise;
    for (let c of this.children) { await c.execute(onUpdate); }
    await Promise.all(this.beforeAll.map(f => f()));
    let testsDone = 0;
    for (let t of this.tests) {  //L(`Testing <${t.name}>`);this.computeSummary();
      await Promise.all(this.beforeEach.map(f => f())); await t.execute(onUpdate); onUpdate({ testsDone: ++testsDone }); 
    }
    this.computeSummary();
  }
  allSuccessful() { let summ = this.summ; return summ && ((summ.Failed + summ.Running + summ.Described) === 0); }
}
let testStack = [], activeContext = () => testStack[testStack.length - 1];

let describe = (k, preparedFut, f, timeout) => { let c = new Context(k, f, preparedFut, timeout, activeContext()); testStack.push(c); f(); testStack.pop(); }
let beforeAll = f => activeContext().beforeAll.push(f), beforeEach = f => activeContext().beforeEach.push(f); 
let assert = (a, msg) => { if (!a) throw new Error(msg ? msg : ""); }, expect = assert;
let test = (name, t) => activeContext().tests.push(new Test(name, t, ETestStatus.Described)); 

//let newit = (msg, f) => { test(msg, async () => { try { await f(); } catch (e) { } }); };
//let assert = (v, msg) => { if (!v) { fail(oS(msg)); } };
//let delay = t => new Promise(resolve => setTimeout(resolve, t));
//let startTime = Date.now();
//let waitUntil = async (timeSinceStart) => await delay(Math.max(0, (startTime + 1000 * timeSinceStart) - Date.now()));

let syncCacheHas = (data, k) => test(`data syncCache has "${k}"`, () => assert(D(data.getSync(k))));
let idbCount = (k, expVF) => test(`data idb has "${k}" of specific count`, async () => assert((await data.idb.count(k)) === expVF()));

//export { newit, assert, delay, waitUntil, syncCacheHas, idbCount }

let setTimeout = (timeOut) => activeContext().timeOut = timeOut;

//global.document = {}; global.window = { document }

let assertEqualObjs = (a, b) => {
  K(a).forEach(k => assert(D(b[(k)]) && a[k] === b[k]));;
  K(b).forEach(k => assert(D(a[(k)]) && a[k] === b[k]));;
}
let assertEqualArrays = (a, b) => { 
  if (a.length !== b.length) throw new Error(`Length of a (${a.length}) != length of b (${b.length})`);
  a.forEach((x, i) => assertEqualObjs(x, b[i]));
}

let expConstants = { decimals: "8", btcPrice: "0", fee1: "9", fee2: "1", fee3: "10", aum: "654300000000", owner: "0xADBfBEd800B49f84732F6D95fF5C924173C2C06A" };

let createTests = () => { testStack = [new Context("/", () => {})];
  let fieldCheck = (data, fields) => describe(`Has data fields (${(fields).join(", ")})`, U, () => fields.forEach(k => test(`has ${k}`, () => assert(D(data[k]))))); 

  describe('Frontend App starts', U, () => {   
//    test('App renders', async () => expect(await render(<App/>).findByTitle("App")).toBeInTheDocument());
    test('data constructor completed', () => assert(data.constructorCompleted));
  }, 70000);

  describe('Data test', U, () => {  
    let dataTest = (data, mode) => { let sch = k => syncCacheHas(data, k);
      describe('DB initialization completes', data.futs.dbInit, () => {  
        test('db initialized', () => assert((data.getSync("dbInitialized")))); 
      }, 20000); 
      
      describe('Basic load', U, () => { 
        describe('Time and amount', data.futs.loadTimeData, () => { fieldCheck(data, T("time amount"));   
          test('time, amount: equal length', () => assert(data.time.length === data.amount.length));
          test('time: length >= 472 ', () => assert(data.time.length >= 472)); 
          test('time: length == 472 ', () => assert(data.time.length === 472));  
        }, 25000); 
      
        describe('Constants', data.futs.loadConstants, () => { fieldCheck(data, K(expConstants));   
          E(expConstants).map(([k, v]) => test(`${k} == ${v}`, () => assert(data[k] === v)));
        }, 25000); 
      
        describe('Address lists', data.futs.loadAddressLists, () => { fieldCheck(data, T("feeAddresses fundDepositAddresses")); 
          test('data.fundDepositAddresses.length >= 1 ', () => assert(L(data.fundDepositAddresses).length >= 1)); 
          test('data.feeAddresses.length >= 2 ', () => assert(L(data.feeAddresses).length >= 2));    
          test(`Loaded data.feeAddresses matches exp`, () => assertEqualArrays(_feeAddresses, data.feeAddresses));
          test(`Loaded data.fundDepositAddresses matches exp`, () => assertEqualArrays(_fundDepositAddresses, data.fundDepositAddresses));
        }, 25000); 

        describe('Compute performance', data.futs.computePerformance, () => { fieldCheck(data, T("performance timeData roi dailyChange"))
          test('data.performance.length >= 472', () => assert((data.performance.length >= 472))); 
          test('data.performance.length === 472', () => assert((data.performance.length === 472))); 
          test('Data has "timeData" with length >= 472', () => assert((data.timeData.length >= 472))); 
          test('Data has "timeData" with length === 472', () => assert((data.timeData.length === 472))); 
        });
      }, 25000); 
    
      describe('Basic load finally', data.futs.basicLoad, () => { 
        fieldCheck(data, T("time amount feeAddresses fundDepositAddresses").concat(K(expConstants))); 
      });

      describe('Fetch fund deposits', data.futs.fetchFundDeposits, () => {
        fieldCheck(data, T("fundDeposits"));
      })
    
      let expectedInvestorCount = 4855;
      describe('Load investors addresses', data.futs.investorsAddressesLoad, () => { beforeAll(() => { L(data.investorsAddresses); })
        test(`Data syncCache has "investorsAddresses" with length >= ${expectedInvestorCount}`, () => assert((data.investorsAddresses.length >= expectedInvestorCount)));  
        test(`Data syncCache has "investorsAddresses" with length == ${expectedInvestorCount}`, () => assert((data.investorsAddresses.length === expectedInvestorCount)));   
        test(`All addresses match with known addresses`, () => assertEqualArrays(_investorsAddresses, data.investorsAddresses.map(x => P(x, T("index data")))));
      })

      describe('After updateRegisteredEthTransactions', data.futs.updateRegisteredEthTransactions, () => {  
        idbCount(data.tables.eth.ntx, () => data.investorsAddresses.length);   
        idbCount(data.tables.eth.rtx, () => data.investorsAddresses.length);   
      }, 300000);
        
      describe('Compute all investor data', data.futs.computeAllInvestorData, () => { fieldCheck(data, T("investors withdrawalRequests pendingDeposits")); 
        test(`Computed ${expectedInvestorCount} investor data structures`, () => assert(data.investors.length === expectedInvestorCount));
      }); 
          
/*      describe(`Mode ${K(mode)} specific`, U, () => { beforeAll(async () => { data.setMode(mode); });
        test('data setMode called', () => data.futs.modeSet.promise);
        test(`data mode matches '${(K(mode)[0])}'`, async () => { await data.futs.modeSet.promise; assert(D(data.mode[K(mode)[0]])); });
        test('data setMode completed', () => data.futs.mode.promise);
      });*/
    }

//    for (let m of K(EUserMode)) describe(`User mode '${m}'`, U, () => { dataTest(data, singleKeyObject(m, true));  })
    describe(`User mode '${EUserMode.Admin}'`, U, () => { dataTest(data, EUserMode.Admin);  })
  });

  describe("Data futures resolve", U, () => {
    K(data.futs).forEach(k => { test(k, async () => await data.futs[k].promise); });
  })

  return testStack[0];
}

let tests;
let instantiateTests = () => (tests = tests || createTests());
export { instantiateTests }