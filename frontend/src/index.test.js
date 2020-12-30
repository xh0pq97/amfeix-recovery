

import React from 'react';
import { App } from './app';  
// eslint-disable-next-line
import { amfeixFeeFields, data, resetData } from './core/data'; 
// eslint-disable-next-line
import { A, U, I, K, L, D, E, R, S, T, oS, singleKeyObject, makeEnum, future } from './common/tools'; 
import { EUserMode, ETestStatus } from './core/enums'; 
// eslint-disable-next-line
//import { render, unmountComponentAtNode } from "react-dom";

//import { newit, assert, syncCacheHas, idbCount } from './core/test';

//import { oS } from '../common/tools';

//global.document = {}; global.window = { document }
class Test {
  constructor(name, t) { A(this, { name, t, fut: future() }); }
  async execute() { try { this.started = true; let r = await this.t(); this.done = true; this.fut.resolve(r); } catch(e) { this.err = e; } }
  getStatus() { 
    if (D(this.err)) { return ETestStatus.Failed; } 
    if (!this.started) { return ETestStatus.Described; }
    if (!this.done) { return ETestStatus.Running; }
    return ETestStatus.Success;
  }
}
class Context { constructor(name, descriptor, parent) { 
    A(this, { name, descriptor, parent, beforeAll: [], beforeEach: [], tests: [], children: [] }); 
    if (parent) parent.addChild(this);
  }
  addChild(c) { this.children.push(c); } 
  async execute(onUpdate) { L(`Executing [${this.name}] (${this.children.count} ${this.tests.count})`);
    for (let c of this.children) await c.execute(onUpdate);
    await Promise.all(this.beforeAll.map(f => f()));
    let testsDone = 0;
    for (let t of this.tests) { L(`Testing <${t.name}>`);
      await Promise.all(this.beforeEach.map(f => f())); await t.execute(onUpdate); onUpdate({ testsDone: ++testsDone }); 
    }
  }
}
let testStack = [], activeContext = () => testStack[testStack.length - 1];

let describe = (k, f) => { let c = new Context(k, f, activeContext()); testStack.push(c); f(); testStack.pop(); }
let beforeAll = f => activeContext().beforeAll.push(f), beforeEach = f => activeContext().beforeEach.push(f); 
let assert = (a, msg) => { if (!a) throw new Error(msg ? msg : ""); }, expect = assert;
let test = (name, t) => activeContext().tests.push(new Test(name, t, ETestStatus.Described)); 

//let newit = (msg, f) => { test(msg, async () => { try { await f(); } catch (e) { } }); };
//let assert = (v, msg) => { if (!v) { fail(oS(msg)); } };
//let delay = t => new Promise(resolve => setTimeout(resolve, t));
//let startTime = Date.now();
//let waitUntil = async (timeSinceStart) => await delay(Math.max(0, (startTime + 1000 * timeSinceStart) - Date.now()));

let syncCacheHas = (data, k) => test(`data syncCache has "${k}"`, () => assert(D(data.getSync(k))));
//let idbCount = (k, expVF) => test(`data idb has "${k}" of specific count`, async () => assert((await data.idb.count(k)) === expVF()));

//export { newit, assert, delay, waitUntil, syncCacheHas, idbCount }

let setTimeout = (timeOut) => activeContext().timeOut = timeOut;

//global.document = {}; global.window = { document }

let createTests = () => { testStack = [new Context("/", () => {})];
  describe('Frontend App starts', () => {  
    beforeAll(async () => { setTimeout(70000) });

//    test('App renders', async () => expect(await render(<App/>).findByTitle("App")).toBeInTheDocument());
    test('data constructor completed', () => assert(data.constructorCompleted));
  });

  let test_Data_Initialization = data => {
    describe('DB initialization completes', () => { 
      beforeAll(async () => { setTimeout(20000); await data.futs.dbInit.promise; });
      test('db initialized', () => assert((data.getSync("dbInitialized")))); 
    });
  }; 

  let test_Data_BasicFields = data => { 
    describe('Basic load', () => { 
      beforeAll(async () => { setTimeout(25000); await data.futs.basicLoad.promise; });
//      beforeEach(async () => { global.document = {}; global.window = { document }; });
      
      describe('Has data fields', () => { T("time amount feeAddresses fundDepositAddresses").concat(amfeixFeeFields).forEach(k => test(`has ${k}`, () => assert(D(data[k])))); });
      test('time, amount: equal length', () => assert(data.time.length === data.amount.length));
      test('"time": length >= 472 ', () => assert(data.time.length >= 472)); 
      test('"fundDepositAddresses": length >= 1 ', () => assert(data.fundDepositAddresses.length >= 1)); 
      test('"feeAddresses": length >= 2 ', () => assert(data.feeAddresses.length >= 1));   

      test('time: length == 472 ', () => assert(data.time.length == 472)); 
      test('time: length == 473 ', () => assert(data.time.length == 473)); 
    });
  }

  let test_Data_BasicLoad = data => { 
    describe('Basic load', () => { 
      beforeAll(async () => { setTimeout(40000); await data.futs.computePerformance.promise; });
//      beforeEach(async () => { global.document = {}; global.window = { document }; });
      
      describe('Has data fields', () => T("dailyChange roi performance timeData").forEach(k => test(`has ${k}`, () => assert(D(data.getSync(k))))));  
      test('data has "performance" with length >= 472', () => assert((data.performance.length >= 472))); 
      test('data has "performance" with length === 472', () => assert((data.performance.length === 472))); 
    });
  }

  describe('Data test', () => {  

    let dataTest = (data, mode) => { let sch = k => syncCacheHas(data, k);
      test_Data_Initialization(data);
      test_Data_BasicFields(data);
      test_Data_BasicLoad(data);
    
      describe(`Mode ${K(mode)} specific`, () => { beforeAll(async () => { setTimeout(40000); data.setMode(mode); });
      test('data setMode called', () => data.futs.modeSet.promise);
      test(`data mode matches '${(K(mode)[0])}'`, async () => { await data.futs.modeSet.promise; assert(D(data.mode[K(mode)[0]])); });
      test('data setMode completed', () => data.futs.mode.promise);

  /*      if (mode.User) describe('After updateInvestorsAddresses_Promise', () => { beforeAll(async () => { jest.setTimeout(30000); await data.futs.updateInvestorsAddresses.promise; });
          T("investorsAddresses").forEach(sch); 
          
          let expectedMinLength = 4855;
          newit(`data syncCache has "investorsAddresses" with length >= ${expectedMinLength}`, () => assert((data.investorsAddresses.length >= expectedMinLength)));  
        }); */
        
      /*
        describe('After updateRegisteredEthTransactions_Promise', () => { beforeAll(async () => { jest.setTimeout(300000); await data.updateRegisteredEthTransactions_Promise; });
          idbCount(data.tables.eth.ntx, () => data.investorsAddresses.length);   
          idbCount(data.tables.eth.rtx, () => data.investorsAddresses.length);   
        });

        describe('After computeAllInvestorData_Promise', () => { beforeAll(async () => { jest.setTimeout(300000); await data.computeAllInvestorData_Promise; });
          T("investors withdrawalRequests pendingDeposits").forEach(sch); 
        });*/
      if (mode.Admin) {/*
        describe('Data futures complete', () => { beforeAll(async () => { jest.setTimeout(180000); });
          E(data.futs).forEach(([k, f]) => newit(`Future '${k}' completes`, async () => await f.promise)); 
        });
    
        describe('After updateInvestorsAddresses_Promise', () => { beforeAll(async () => { jest.setTimeout(40000);  await data.futs.mode.promise; await data.futs.updateInvestorsAddresses.promise; });
          T("investorsAddresses").forEach(sch); 
          
          let expectedMinLength = 4855;
          newit(`data syncCache has "investorsAddresses" with length >= ${expectedMinLength}`, () => assert((data.investorsAddresses.length >= expectedMinLength)));  
        });
        
      
        describe('After updateRegisteredEthTransactions_Promise', () => { beforeAll(async () => { jest.setTimeout(900*1000); await data.futs.updateRegisteredEthTransactions.promise; });
          idbCount(data.tables.eth.ntx, () => data.investorsAddresses.length);   
          idbCount(data.tables.eth.rtx, () => data.investorsAddresses.length);   
        });*/
      }
  /*
        describe('After computeAllInvestorData_Promise', () => { beforeAll(async () => { jest.setTimeout(300000); await data.computeAllInvestorData_Promise; });
          T("investors withdrawalRequests pendingDeposits").forEach(sch); 
        });*/
      });
    }

    for (let m of K(EUserMode)) describe(`User mode '${m}'`, () => { 
      beforeAll(async () => { setTimeout(30000);// await resetData(); await data.setMode(m); 
      });
      dataTest(data, singleKeyObject(m, true));
      //afterAll(async () => {});//await data.destroy());
    })
  });

  describe("Data futures resolve", () => {
    K(data.futs).forEach(k => { test(k, async () => await data.futs[k].promise); });
  })

  return testStack[0];
}

let tests;
let instantiateTests = () => (tests = tests || createTests());
export { instantiateTests }