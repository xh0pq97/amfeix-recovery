import React from 'react';
// eslint-disable-next-line
import { Box, TextField } from '@material-ui/core';
// eslint-disable-next-line
import { wrapEllipsisDiv, applyListHeaders, OpenDialogButton, DialogWrap, Comp, ValidatableComp, form, formTable, TabbedView, TabTimeline, button, List  } from './components'; 
// eslint-disable-next-line
import { A, D, E, F, H, I, K, L, S, T, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 

// eslint-disable-next-line
class WithdrawDialog extends Comp { ren(p, s) { return <TabTimeline tabs={{ Withdraw, Review, Done }} onCancel={p.onCancel} onAccept={p.onAccept}/>; } }

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
  return formTable([[<List data={(E(oO(p.wallets)).map(([name, wallet]) => ({ name, ...wallet})))} headers={headers}/>], 
  //  [<OpenDialogButton id="Withdraw" comp={WithdrawDialog} onAccept={I} onCancel={I}/>]
  ])}
}

class History extends Comp { ren(p, s) { return <Box/> } }
// eslint-disable-next-line
class Invest extends ValidatableComp { ren(p, s) { return form(null, [[this.genTextField("Bitcoin personal Investment address", U, p.bitcoinAddress)]]) } } 

class Done extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Review extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Withdraw extends ValidatableComp { ren(p, s) { return form(null, [[this.genTextField("To", "The address of the recipient")], [this.genTextField("Amount", "Amount to be sent")], [this.genTextField("Fees")]]); } }

export class Bitcoin_Wallet extends Comp { ren(p, s) { return !D(p.wallets) ? <Box/> : <>{formTable([[<Account wallets={(p.wallets)} />]])}<History /></> 
  // <Invest bitcoinAddress={oO(p.wallet).bitcoinAddress}/>
} }
