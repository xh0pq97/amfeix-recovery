import React from 'react';
import { render } from '@testing-library/react';
import { App } from './app';  
import { data } from './core/data';
import { L, D, T, oS } from './common/tools';
 
let delay = t => new Promise(resolve => setTimeout(resolve, t));
let startTime = Date.now();
let waitUntil = async (timeSinceStart) => await delay(Math.max(0, (startTime + 1000*timeSinceStart) - Date.now()));

let assert = (v, msg) => { if (!v) { fail(oS(msg)); } }

describe('Frontend App starts', () => {  
  beforeAll(async () => { jest.setTimeout(70000) });

  it('App renders', async () => { expect(await render(<App/>).findByTitle("App")).toBeInTheDocument(); });
  it('data constructor completed', () => { assert(data.constructorCompleted); })
});

describe('After x secs', () => { beforeAll(async () => { jest.setTimeout(20000); await data.dbInit_Promise; });
  it('db initialized', () => assert((data.getSync("dbInitialized")))); 
});

let syncCacheHas = k => it(`data syncCache has "${k}"`, () => assert(D(data.getSync(k))));
describe('After basicLoad_Promise', () => { beforeAll(async () => { jest.setTimeout(30000); await data.basicLoad_Promise; });
  T("time amount feeAddresses fundDepositAddresses").forEach(syncCacheHas); 
  it('data syncCache has "time" and "amount" with equal length', () => assert(data.time.length === data.amount.length));
  it('data syncCache has "time" with length >= 472 ', () => assert(data.time.length >= 472)); 
  it('data syncCache has "fundDepositAddresses" with length >= 1 ', () => assert(data.fundDepositAddresses.length >= 1)); 
  it('data syncCache has "feeAddresses" with length >= 2 ', () => assert(data.feeAddresses.length >= 1));  
  it('data has "performance"', () => assert(D(data.performance))); 
  it('data has "performance" with length >= 472', () => assert(D(data.performance.length >= 472))); 
 
  it('data syncCache has "time" with length == 472 ', () => assert(data.time.length == 472)); 
});

let idbCount = (k, expVF) => it(`data idb has "${k}" of specific count`, async () => assert((await data.idb.count(k)) === expVF()));

describe('After updateInvestorsAddresses_Promise', () => { beforeAll(async () => { jest.setTimeout(30000); await data.updateInvestorsAddresses_Promise; });
  T("investorsAddresses").forEach(syncCacheHas);  
  it('data syncCache has "investorsAddresses" with length >= 4855', () => assert((data.investorsAddresses.length >= 4855)));  
//  idbCount(data.tables.eth.investorsAddresses, () => data.investorsAddresses.length);   
  it('data syncCache has "investorsAddresses" with length = 4855', () => assert((data.investorsAddresses.length === 4855)));  
});
/*
describe('After updateRegisteredEthTransactions_Promise secs', () => { beforeAll(async () => { jest.setTimeout(300000); await data.updateRegisteredEthTransactions_Promise; });
  idbCount(data.tables.eth.ntx, () => data.investorsAddresses.length);   
  idbCount(data.tables.eth.rtx, () => data.investorsAddresses.length);   
});*/
 /*
describe('After z secs', () => { beforeAll(async () => { jest.setTimeout(300000); await delay(240000); });
  it('data syncCache has "investors"', () => assert(D(data.getSync("investors")))); 
  it('data syncCache has "withdrawalRequests"', () => assert(D(data.getSync("withdrawalRequests")))); 
  it('data syncCache has "pendingDeposits"', () => assert(D(data.getSync("pendingDeposits")))); 
});*/

/*
describe('After 30 secs', () => {  
  beforeAll(async () => { jest.setTimeout(40000); await delay(30000); });

  it('Main page renders', async () => {
    expect(await render(<App/>).findByTitle("Main")).toBeInTheDocument();
  });
});
*/