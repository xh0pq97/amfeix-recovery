import React from 'react';
// eslint-disable-next-line
import { Box, TextField } from '@material-ui/core';
// eslint-disable-next-line
import { testModeComp, wrapEllipsisDiv, applyListHeaders, OpenDialogButton, DialogWrap, Comp, ValidatableComp, tabulize, form, formTable, TabbedView, TabTimeline, button, List, genHeaders  } from './components'; 
// eslint-disable-next-line
import { A, D, E, F, H, I, K, L, P, S, T, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 
import { InvestorDependentView_Btc, InvestorID } from './investor'
// eslint-disable-next-line
import QRCode from 'qrcode-svg';
// wc52mNR2qTpFfNP
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

let investorCompIfTestMode = (p) => testModeComp(p.urlParams.testMode, () => <InvestorID investor={p.investor} />)

let walletLists = T("Deposits Investments Returns Withdrawals");
let simpleList = data => <List data={data} headers={V(genHeaders(data))}/>; 
class History extends InvestorDependentView_Btc { 
  ren(p, s) { let walletData = this.getInvestorWalletData(); L(`p.wallet = ${S(p.wallet)}`)
    let All_transactions = () => simpleList(walletLists.map(type => oA(oO(walletData)[type]).map(d => ({...d, type }))).flat());
    return <>{investorCompIfTestMode(p)}<TabbedView tabs={{ All_transactions, ...F(walletLists.map(l => [l, () => simpleList(oO(walletData)[l])])) }} parentProps={{ walletData, wallet: oO(p.wallet).lastLogin }} /></>; 
  } 
}

class Invest extends ValidatableComp {  
  ren(p, s) { L(`investor = ${S(p.investor)}`); let btcAddress = oS(oO(p.investor).btcAddress); let dim = 256;
    let qrCode = btcAddress.length > 0 ? (new QRCode({ content: btcAddress, ecl: "H", width: dim, height: dim, join: true, container: "svg-viewbox", xmlDeclaration: false })).svg() : U;
    return tabulize(1/3, [[qrCode ? <div style={{width: "30em", height: "30em"}} dangerouslySetInnerHTML={{ __html: qrCode }} /> : null], [this.genTextField("Bitcoin personal Investment address", { value: btcAddress, disabled: true })]]); 
  } 
} 

class Done extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Review extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Withdraw extends ValidatableComp { ren(p, s) { return form(null, [[this.genTextField("To", "The address of the recipient")], [this.genTextField("Amount", "Amount to be sent")], [this.genTextField("Fees")]]); } }

export class Bitcoin_Wallet extends Comp { ren(p, s) { 
  L(`Lastlogin = ${S(p.wallet)}`); L(`invstor = ${S(p.investor)}`);
  let investor = p.investor || oO(oO(p.wallet).lastLogin);
  //return !D(p.wallet) ? <Box/> : <>{formTable([[<Account wallet={(p.wallet)} />]])}
  return <>{investorCompIfTestMode(p)}<TabbedView tabs={{ History, Invest, _Withdraw_ }} parentProps={{investor, ...(P(p, T("urlParams wallet")))}} /></>
  // <Invest bitcoinAddress={oO(p.wallet).bitcoinAddress}/>
} }
