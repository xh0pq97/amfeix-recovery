

import React from 'react';
import { App } from './app';  
import { data, resetData } from './core/data'; 
import { I, K, L, D, E, R, S, T, oS, singleKeyObject } from './common/tools'; 
import { EUserMode } from './core/enums'; 

import { newit, assert, syncCacheHas, idbCount } from './core/test';

global.document = {}; global.window = { document }

describe('Frontend App starts', () => {  
  beforeAll(async () => { jest.setTimeout(70000) });

  newit('App renders', async () => expect(await render(<App/>).findByTitle("App")).toBeInTheDocument());
  newit('data constructor completed', () => assert(data.constructorCompleted));
});

let test_Data_Initialization = data => {
  describe('DB initialization completes', () => { 
    beforeAll(async () => { jest.setTimeout(20000); await data.futs.dbInit.promise; });
    newit('db initialized', () => assert((data.getSync("dbInitialized")))); 
  });
}; 

let test_Data_BasicFields = data => { 
  describe('Basic load', () => { 
    beforeAll(async () => { jest.setTimeout(25000); await data.futs.basicLoad.promise; });
    beforeEach(async () => { global.document = {}; global.window = { document }; });
    
    describe('Has data fields', () => { T("time amount feeAddresses fundDepositAddresses").forEach(k => newit(`has ${k}`, () => assert(D(data[k])))); });
    newit('data syncCache has "time" and "amount" with equal length', () => assert(data.time.length === data.amount.length));
    newit('data syncCache has "time" with length >= 472 ', () => assert(data.time.length >= 472)); 
    newit('data syncCache has "fundDepositAddresses" with length >= 1 ', () => assert(data.fundDepositAddresses.length >= 1)); 
    newit('data syncCache has "feeAddresses" with length >= 2 ', () => assert(data.feeAddresses.length >= 1));   

    newit('data syncCache has "time" with length == 472 ', () => assert(data.time.length == 472)); 
  });
}

let test_Data_BasicLoad = data => { 
  describe('Basic load', () => { 
    beforeAll(async () => { jest.setTimeout(40000); await data.futs.computePerformance.promise; });
    beforeEach(async () => { global.document = {}; global.window = { document }; });
    
    describe('Has data fields', () => T("dailyChange roi performance timeData").forEach(k => newit(`has ${k}`, () => assert(D(data.getSync(k))))));  
    newit('data has "performance" with length >= 472', () => assert((data.performance.length >= 472))); 
    newit('data has "performance" with length === 472', () => assert((data.performance.length === 472))); 
  });
}

describe('Data test', () => {  

  let dataTest = (data, mode) => { let sch = k => syncCacheHas(data, k);
    
    test_Data_Initialization(data);
    test_Data_BasicFields(data);
    test_Data_BasicLoad(data);
  
    describe(`Mode ${K(mode)} specific`, () => { beforeAll(async () => { jest.setTimeout(40000); data.setMode(mode); });
    newit('data setMode called', async () => { await data.futs.modeSet.promise; });
    newit(`data mode matches '${(K(mode)[0])}'`, async () => { await data.futs.modeSet.promise; assert(D(data.mode[K(mode)[0]])); });
    newit('data setMode completed', async () => { await data.futs.mode.promise; });

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
    beforeAll(async () => { jest.setTimeout(30000);// await resetData(); await data.setMode(m); 
    });
    dataTest(data, singleKeyObject(m, true));
    afterAll(async () => {});//await data.destroy());
  })
});
