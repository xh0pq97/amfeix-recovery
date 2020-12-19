/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
/* eslint react/display-name: 0 */
import React from 'react';
// eslint-disable-next-line
import { A, D, E, F, G, I, K, L, S, T, U, V, oA, oO } from '../common/tools.mjs';
import { Transaction, data } from '../core/data';
// eslint-disable-next-line
import { form, formTable, ProgressDialog, GetPasswordDialog, loadingComponent, applyListHeaders, commonTableHeaders, genHeaders, ValidatableComp, OpenDialogButton, Comp, TabbedView, List, tabulize, TabTimeline, preamble, button } from './components';
import { InvestorList, EthTxView } from './investor';
import { Typography } from '@material-ui/core';
import { BN }  from '../core/bignumber';
import { satoshiToBTCString } from '../core/satoshi';
import { formatTimestamp } from './formatting';
import { wallet } from '../core/wallet';
import { pubKeyToEthAddress } from "../common/crypto";

class Approve_actions_Form extends ValidatableComp { constructor(p, s, actionName, propertyLabel) { super(p, s); A(this, { actionName, propertyLabel });  }
  validate() { return this.props[this.propertyLabel]; }
  ren(p, s) { let d = oA(p[this.propertyLabel]), n = this.actionName;
    return form(preamble(`Approve ${n}s`, `Click 'Confirm' to approve all pending ${n}s.`), [
      [`Number of pending ${n}s:`, d.length],
      [`Total ${n} value:`, satoshiToBTCString(d.reduce((p, c) => p.plus((c.satoshiBN)), BN(0)))],
      [`Time of first ${n}:`, formatTimestamp(d.reduce((p, c) => D(p) ? Math.min(p, c.timestamp) : c.timestamp, U))],
      [`Time of last ${n}:`, formatTimestamp(d.reduce((p, c) => D(p) ? Math.max(p, c.timestamp) : c.timestamp, U))]
    ])
  }
}

class Approve_deposits_Form extends Approve_actions_Form { constructor(p, s) { super(p, s, "deposit", "pendingDeposits"); } }
class Approve_withdrawals_Form extends Approve_actions_Form { constructor(p, s) { super(p, s, "withdrawal", "pendingWithdrawals"); } }

class Approve_all_pending_deposits extends Comp { ren(p, s) { 
  return <TabTimeline tabs={{ Approve_deposits_Form }} acceptText="Confirm" onAccept={p.onAccept} onCancel={p.onCancel} parentProps={{pendingDeposits: p.pendingDeposits}} />;
} } 

class Approve_all_pending_withdrawals extends Comp { ren(p, s) { 
  return <TabTimeline tabs={{ Approve_withdrawals_Form }} acceptText="Confirm" onAccept={p.onAccept} onCancel={p.onCancel} parentProps={{pendingWithdrawals: p.pendingWithdrawals}} />;
} }

let textField = (title) => ({ title });
let generateForm = (preambleText, aa) => {
  return class extends ValidatableComp { constructor(p, s) { super(p, s, aa.flat().map(x => x.title).join(" ")); }
    ren(p, s) { return form(preamble(preambleText), aa.map(a => a.map(tf => this.genTextField(tf.title)))) }
    validate() { return this.state.values; }
  }
}

let changeDataForms = {
  Owner: generateForm("Please enter the new Owner", [[textField("Owner")]]),
  AUM: generateForm("Please enter the new AUM", [[textField("AUM")]]),
  BtcPrice: generateForm("Please enter the new BtcPrice", [[textField("BtcPrice")]]),
  RequestGas: generateForm("Please enter the new AUM", [[textField("RequestGas")]]),
  Daily_change: generateForm("Please enter the new Daily_change", [[textField("Daily_change")]]),
  Fees: generateForm("Please enter the new Fees", [T("fee1 fee2 fee3").map(textField)]),
  Fund_deposit_address: generateForm("Please enter the new Fund_deposit_address", [[textField("Fund_deposit_address")]]),
  Fee_address: generateForm("Please enter the new Fee_address", [[textField("Fee_address")]])
} 

let wrapFormInTabTimeline = f => p => <TabTimeline tabs={{ _0: f }} onAccept={p.onAccept} onCancel={p.onCancel} />;
let adminSetters = G(changeDataForms, wrapFormInTabTimeline);

class Deposits extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "fundDeposits"); }
  ren(p, s) { return loadingComponent(s.fundDeposits, <TabbedView tabs={F(E(s.fundDeposits).map(([k, v], i) => [`Deposit address #${i}`, () => <List data={v} headers={V(genHeaders(v))}/>]))}/>) }
}

class Investors extends Comp { 
  ren(p, s) { return tabulize(1/3, [[<InvestorList onChangedSelectedInvestor={investor => this.setState({ investor })} EDeveloperMode={p.EDeveloperMode} />], 
    [D(s.investor) ? <EthTxView investor={s.investor} EDeveloperMode={p.EDeveloperMode} /> : tabulize(5/3, [[<Typography>{'Select an investor to show their transactions'}</Typography>]])]]) }
}

let qEthTx = (method, params) => data.queuedEthTransactions.push(L(new Transaction(method, params))); 
class Change_data extends Comp { 
  Owner(d) { qEthTx("transferOwnership", [BN(d["Owner"]).toString()]); }
  AUM(d) { qEthTx("setAum", [BN(d["AUM"]).times(data.getFactor()).toString()]); }
  BtcPrice(d) { qEthTx("setBtcPrice", [BN(d["BtcPrice"]).times(data.getFactor()).toString()]); }
  RequestGas(d) { qEthTx("setRequestGas", [BN(d["RequestGas"]).toString()]); }
  Daily_change(d) { qEthTx("setDataBlock", [(BN(d["Daily_change"]).times(data.getFactor())).toFixed().toString()]); }
  Fees(d) { d = G(d, x => BN(x).toString()); qEthTx("setFee", [d["fee1"], d["fee2"], d["fee3"]]); }
  Fund_deposit_address(d) { qEthTx("setfundDepositAddress", [d["Fund_deposit_address"]]) }
  Fee_address(d) { qEthTx("setFeeAddress", [d["Fee_address"]]); }

  ren(p, s) { return tabulize(5/3, V(G(adminSetters, (v, k) => [<OpenDialogButton id={k} comp={v} onAccept={d => this[k](d)} onCancel={I}/>]))) }
}

class Pending_Deposits extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "pendingDeposits"); }
  approveAll(deps) { data.queuedEthTransactions.push(...deps.map(d => new Transaction("depositAdmin", [pubKeyToEthAddress(d.pubKey, true), d.txId, d.pubKey, ""]))) }  
  ren(p, s) { let pendingDeposits = oA(V(oO(s.pendingDeposits))[0]); //L(`Pending_Deposits: ${S(pendingDeposits)}`);
    L(`admin wallet last login: ${S(oO(p.wallet).lastLogin)}`);
    return loadingComponent(s.pendingDeposits, tabulize(5/3, [
      [<OpenDialogButton id="Approve_all_pending_deposits" parentProps={{ pendingDeposits }} comp={Approve_all_pending_deposits} onAccept={d => this.approveAll(d)}/>],
      [<TabbedView tabs={F(E(s.pendingDeposits).map(([k, v], i) => [`Deposit address #${i}`, () => <List data={v} headers={V(genHeaders(v))}/>]))}/>]
    ].filter(I))) 
  }
}

class Pending_Withdrawals extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "withdrawalRequests"); }
  approveAll(withs) { data.queuedEthTransactions.push(...withs.map(d => new Transaction("returnInvestment", [pubKeyToEthAddress(d.pubKey, true), d.txId, d.pubKey, ""]))) }
  ren(p, s) {  let pendingWithdrawals = oA(s.withdrawalRequests);
    return loadingComponent(s.withdrawalRequests, tabulize(5/3, [
    [<OpenDialogButton id="Approve_all_pending_withdrawals" parentProps={{ pendingWithdrawals }} comp={Approve_all_pending_withdrawals} onAccept={d => this.approveAll(d)} />],
    [<List data={s.withdrawalRequests} headers={V((genHeaders(s.withdrawalRequests)))} />]
  ])) }
}

class Queued_Eth_Transactions extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "queuedEthTransactions"); }
  signAndSubmit(creds) { L(`signAndSubmit : ${S(creds)}`);
     this.setState({ progressDialogOpen: true, progressDialogTitle: "Decrypting wallet..." }, () => setTimeout(async () => await this.performApproveWithCreds(creds), 500))
  }
  async performApproveWithCreds(creds) { //L(`performApproveWithCreds : ${S(creds)}`)
    let privateKey = await wallet.getPrivateKey(creds); 
    this.setState({ progressDialogOpen: true, progressDialogTitle: "Signing transactions..." }, () => setTimeout(async () => {
      await data.signAndSubmitQueuedEthTransactions(privateKey); 
      data.queuedEthTransactions = data.queuedEthTransactions.map(x => ({ ...x, status: "Submitted" }))
      this.setState({ progressDialogOpen: false, getPwdDialogOpen: false });
    }, 500));
  } 
  ren(p, s) { let Wallet = oO(oO(p.wallet).lastLogin).name;
    return tabulize(5/3, [ 
      [<>{button("Sign and submit queued transactions", () => this.setState({ getPwdDialogOpen: true }))}<ProgressDialog open={s.progressDialogOpen || false} title={s.progressDialogTitle} progress={U} />
      <GetPasswordDialog open={s.getPwdDialogOpen} walletName={Wallet} onAccept={creds => this.signAndSubmit({ ...creds, Wallet })} onCancel={() => this.setState({ getPwdDialogOpen: false })}/></>],
      [<List data={s.queuedEthTransactions} headers={V((genHeaders(s.queuedEthTransactions)))} />]
    ]) 
  }
}

export class Admin extends Comp {
  ren(p, s) { //L(`admin wallet: ${S(p.wallet)}`);
    return <TabbedView tabs={{ Investors, Pending_Withdrawals, Deposits, Pending_Deposits, Change_data, Queued_Eth_Transactions }} parentProps={{ wallet: p.wallet, EDeveloperMode: p.EDeveloperMode }}/>; }
}
