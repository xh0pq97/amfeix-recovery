import React from 'react';
import { Box, TextField } from '@material-ui/core';
import { OpenDialogButton, DialogWrap, Comp, ValidatableComp, form, formTable, TabbedView, TabTimeline, button, List  } from './components'; 
import { A, D, E, F, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 

class WithdrawDialog extends Comp { ren(p, s) { return <TabTimeline tabs={{ Withdraw, Review, Done }} onCancel={p.onCancel} onAccept={p.onAccept}/>; } }

class Account extends Comp { constructor(p, s) { super(p, s, "dlgWithdraw"); }
ren(p, s) { return formTable([
  [<List data={L(E(oO(p.wallets)).map(([name, wallet]) => ({ name, ...wallet})))} />], 
  [<OpenDialogButton id="Withdraw" comp={WithdrawDialog} onAccept={I} onCancel={I}/>]])   
  }
}

class History extends Comp { ren(p, s) { return <Box/> } }
class Invest extends ValidatableComp { ren(p, s) { return form(null, [[this.genTextField("Bitcoin personal Investment address", U, p.bitcoinAddress)]]) } } 

class Done extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Review extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Withdraw extends ValidatableComp { ren(p, s) { return form(null, [[this.genTextField("To", "The address of the recipient")], [this.genTextField("Amount", "Amount to be sent")], [this.genTextField("Fees")]]); } }

export class Bitcoin_Wallet extends Comp { ren(p, s) { return !D(p.wallet) ? <Box/> :
  <>{formTable([[<Account wallets={L(p.wallets)} />, <Invest bitcoinAddress={oO(p.wallet).bitcoinAddress}/>]])}<History /></> 
} }
