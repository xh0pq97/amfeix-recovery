/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
/* eslint no-unused-vars: 0 */
import React from 'react';
// eslint-disable-next-line
import { Box, TextField } from '@material-ui/core';
// eslint-disable-next-line
import { commonDataTypes, dataSummary, testModeComp, wrapEllipsisDiv, applyListHeaders, loadingComponent, OpenDialogButton, DialogWrap, Comp, ValidatableComp, tabulize, form, formTable, TabbedView, TabTimeline, button, List, genHeaders, dataList } from './components'; 
// eslint-disable-next-line
import { A, D, E, F, H, I, K, L, P, S, T, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../common/tools'; 
import { InvestorDependentView_Btc, InvestorID, EthTxView } from './investor'
// eslint-disable-next-line
import QRCode from 'qrcode-svg';
import { pubKeyToBtcAddress } from '../common/pubKeyConvertor';
// wc52mNR2qTpFfNP
// eslint-disable-next-line
class _Withdraw_ extends Comp { ren(p, s) { return <TabTimeline tabs={{ Withdraw, Review, Done }} onCancel={p.onCancel} onAccept={p.onAccept}/>; } }

class Account extends Comp { constructor(p, s) { super(p, s, "dlgWithdraw"); }
  ren(p, s) { I(`account: ${S(p.wallets)}`); let headers = V(applyListHeaders(F(T("name privateKey chainCode publicKey btcAddress ethAddress").map(k => [k, ({ label: k, caption: k })]))));
  return formTable([[<List data={(E(oO(oO(p.wallet).accounts)).map(([name, wallet]) => ({ name, ...wallet})))} headers={headers}/>], 
  //  [<OpenDialogButton id="Withdraw" comp={WithdrawDialog} onAccept={I} onCancel={I}/>]
  ])}
}

let investorCompIfTestMode = (p) => testModeComp(p.urlParams.testMode, () => <InvestorID investor={p.investor} />); 

class History extends InvestorDependentView_Btc { 
  ren(p, s) { let walletData = (this.getInvestorWalletData()), selectedTx = oO(oA(walletData.txs)[s.selectedTx]); //, allLoaded = txTypes.reduce((p, c) => p && D(walletData[c]), true); //L(`p.wallet = ${S(p.wallet)}`)
//    let All_transactions = () => loadingComponent(allLoaded, simpleList(L(txTypes).map(type => oA(walletData[type]).map(d => ({...d, type: type.slice(0, type.length - 1) }))).flat()));
L({walletData});
    return tabulize(1/3, [[tabulize(1/3, [['Final balance', loadingComponent(walletData.finalBalance, commonDataTypes.btcSatoshis.displayFunc(walletData.finalBalance))]])], 
    [dataList(L(oA(walletData.txs).map(tx => P(tx, T("time txId type delta fee")))), { onChange: selectedTx => this.setState({ selectedTx })})],
    [tabulize(1/3, [[dataList(selectedTx.ins), dataList(selectedTx.outs)]])]]); 
  } 
}

class Invest extends ValidatableComp { ren(p, s) { L(`investor = ${S(p.investor)}`); let btcAddress = oS(oO(p.investor).btcAddress); let dim = 256;
  let qrCode = btcAddress.length > 0 ? (new QRCode({ content: btcAddress, ecl: "H", width: dim, height: dim, join: true, container: "svg-viewbox", xmlDeclaration: false })).svg() : U;
  return tabulize(1/3, [[qrCode ? <div style={{width: "30em", height: "30em"}} dangerouslySetInnerHTML={{ __html: qrCode }} /> : null], [this.genTextField("Bitcoin personal Investment address", { value: btcAddress, disabled: true })]]); 
} } 

class Done extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Review extends ValidatableComp { ren(p, s) { return <Box/>; } }
class Withdraw extends ValidatableComp { ren(p, s) { return form(null, [[this.genTextField("To", "The address of the recipient")], [this.genTextField("Amount", "Amount to be sent")], [this.genTextField("Fees")]]); } }

export class Bitcoin_Wallet extends Comp { ren(p, s) { let investor = p.investor || oO(oO(p.wallet).lastLogin);
  if (!D(investor.btcAddress) && D(investor.pubKey)) investor.btcAddress = pubKeyToBtcAddress(investor.pubKey);
  return <>{investorCompIfTestMode(p)}{tabulize(1/3, [
    [<TabbedView tabs={{ History, Invest, _Withdraw_ }} parentProps={{investor, ...(P(p, T("urlParams wallet")))}} />],
  [<EthTxView investor={p.investor} EDeveloperMode={p.EDeveloperMode}/>]
])}</>
} }
