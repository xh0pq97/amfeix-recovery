import React from 'react';
// eslint-disable-next-line
import { Box, TextField } from '@material-ui/core';
// eslint-disable-next-line
import { wrapEllipsisDiv, applyListHeaders, OpenDialogButton, DialogWrap, Comp, ValidatableComp, form, formTable, TabbedView, TabTimeline, button, List  } from './components'; 
// eslint-disable-next-line
import { A, D, E, F, H, I, K, L, S, T, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 

// eslint-disable-next-line
class _Withdraw_ extends Comp { ren(p, s) { return <TabTimeline tabs={{ Withdraw, Review, Done }} onCancel={p.onCancel} onAccept={p.onAccept}/>; } }

let applyHeaders = h => applyListHeaders(h, {
//  txId: { caption: "BTC Transaction", displayFunc: displayBtcTransaction },
  name: { caption: "Wallet name" },
  privateKey: { caption: "Encrypted Private Key", displayFunc: wrapEllipsisDiv },
  chainCode: { caption: "Encrypted Chain Code", displayFunc: wrapEllipsisDiv },
  publicKey: { caption: "Public Key", displayFunc: wrapEllipsisDiv },
  btcAddress: { caption: "Bitcoin Wallet Address", displayFunc: wrapEllipsisDiv },
  ethAddress: { caption: "Ethereum Investor address", displayFunc: wrapEllipsisDiv },
//  value: { caption: "Amount (BTC)", align: "right", alignCaption: "right" }
});

class Account extends Comp { constructor(p, s) { super(p, s, "dlgWithdraw"); }
  ren(p, s) { I(`account: ${S(p.wallets)}`); let headers = V(applyHeaders(F(T("name privateKey chainCode publicKey btcAddress ethAddress").map(k => [k, ({ label: k, caption: k })]))));
  return formTable([[<List data={(E(oO(oO(p.wallet).accounts)).map(([name, wallet]) => ({ name, ...wallet})))} headers={headers}/>], 
  //  [<OpenDialogButton id="Withdraw" comp={WithdrawDialog} onAccept={I} onCancel={I}/>]
  ])}
}

class All_transactions extends Comp { ren(p, s) { return <Box/>; } }
class Deposits extends Comp { 
  
  ren(p, s) { return <Box/>; } 
}
class Withdrawals extends Comp { ren(p, s) { return <Box/>; } }
class Investments extends Comp { ren(p, s) { return <Box/>; } }
class Returns extends Comp { ren(p, s) { return <Box/>; } }
  
class History extends Comp { 
//  componentDidMount() { this.addSyncKeyObserver(data, data.getInvestorWalletDepositsKey()); }
  //ren(p, s) { return loadingComponent(s.fundDeposits, <TabbedView tabs={F(E(s.fundDeposits).map(([k, v], i) => [`Deposit address #${i}`, () => <List data={v} headers={V(genHeaders(v))}/>]))}/>) }
  ren(p, s) { return <TabbedView tabs={{ All_transactions, Deposits, Withdrawals, Investments, Returns }} parentProps={{ wallet: p.openWallet }} />; } 
}
// eslint-disable-next-line
class Invest extends ValidatableComp { 
  ren(p, s) { 
    L(`wall = ${S(p.wallet)}`);
    return form(null, [[this.genTextField("Bitcoin personal Investment address", { value: oO(p.wallet).btcAddress, disabled: true })]]) 
  } 
} 

class Done extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Review extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Withdraw extends ValidatableComp { ren(p, s) { return form(null, [[this.genTextField("To", "The address of the recipient")], [this.genTextField("Amount", "Amount to be sent")], [this.genTextField("Fees")]]); } }

export class Bitcoin_Wallet extends Comp { ren(p, s) { 
  L(`wallet = ${S(p.openWallet)}`)
  //return !D(p.wallet) ? <Box/> : <>{formTable([[<Account wallet={(p.wallet)} />]])}
  return <TabbedView tabs={{ History, Invest, _Withdraw_ }} parentProps={{ wallet: p.openWallet }} />
  // <Invest bitcoinAddress={oO(p.wallet).bitcoinAddress}/>
} }
