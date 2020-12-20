import React from 'react';
import { render } from '@testing-library/react';
import { App } from './app';  
import { data } from './core/data';
import { L, D, oS } from './common/tools';
 
let delay = t => new Promise(resolve => setTimeout(resolve, t));
let startTime = Date.now();
let waitUntil = async (timeSinceStart) => await delay(Math.max(0, (1000*startTime + timeSinceStart) - 1000*Date.now));

let assert = (v, msg) => { if (!v) { fail(oS(msg)); } }

describe('Frontend App starts', () => {  
  beforeAll(async () => { jest.setTimeout(70000) });

  it('App renders', async () => { expect(await render(<App/>).findByTitle("App")).toBeInTheDocument(); });
  it('data constructor completed', () => { assert(data.constructorCompleted); })
});

describe('After x secs', () => {  
  beforeAll(async () => { jest.setTimeout(20000); await delay(2000); });

  it('db initialized', () => assert((data.getSync("dbInitialized")))); 
});

describe('After y secs', () => {   
  beforeAll(async () => { jest.setTimeout(20000); await delay(15000); });
 
  it('data syncCache has "time"', () => assert(D(data.time))); 
  it('data syncCache has "amount"', () => assert(D(data.amount)));
  it('data syncCache has "time" and "amount" with equal length', () => { assert(data.time.length === data.amount.length); });
  it('data syncCache has "time" with length >= 472 ', () => assert(data.time.length >= 472));
  it('data syncCache has "fundDepositAddresses"', () => assert(D(data.fundDepositAddresses))); 
  it('data syncCache has "fundDepositAddresses" with length >= 1 ', () => assert(data.fundDepositAddresses.length >= 1));
  it('data syncCache has "feeAddresses"', () => assert(D(data.feeAddresses))); 
  it('data syncCache has "feeAddresses" with length >= 2 ', () => assert(data.feeAddresses.length >= 1));
  it('data syncCache has "investorsAddresses"', () => assert(D(data.investorsAddresses))); 
  it('data syncCache has "investorsAddresses" with length >= 4855', () => { assert((data.investorsAddresses.length >= 4855)); }); 


  it('data syncCache has "time" with length == 472 ', () => { assert(data.time.length == 472); });
  it('data syncCache has "investorsAddresses" with length = 4855', () => { assert((data.investorsAddresses.length === 4855)); }); 
  it('data syncCache has "investorsAddresses" with length != 0', () => { assert((data.investorsAddresses.length != 0)); }); 
  it('data syncCache has "investorsAddresses" with length >= 1', () => { assert((data.investorsAddresses.length >= 1)); }); 
  it('data syncCache has "investorsAddresses" with length >= 4000', () => { assert((data.investorsAddresses.length >= 4000)); }); 
});

/*
describe('After 30 secs', () => {  
  beforeAll(async () => { jest.setTimeout(40000); await delay(30000); });

  it('Main page renders', async () => {
    expect(await render(<App/>).findByTitle("Main")).toBeInTheDocument();
  });
});
*/