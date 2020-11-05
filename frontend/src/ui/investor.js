import React from 'react';
// eslint-disable-next-line
import { A, D, E, F, G, I, K, L, S, T, V, oA, oF, oO, singleKeyObject } from '../tools';
import { data, getInvestorWalletDataKey, getInvestorDataKey, stati } from '../core/data';
// eslint-disable-next-line
import { tabulize, commonTableHeaders, applyListHeaders, extractHeaders, genHeaders, ValidatableComp, wrapEllipsisDiv, displayBtcTransaction, OpenDialogButton, Comp, TabbedView, List, cleanText, button, TabTimeline } from './components'; 

class InvestorDependentView extends Comp {
  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { if (prevP.investor !== this.props.investor) this.updateInvestor(this.props.investor); } 
} 

class InvestorDependentView_Eth extends InvestorDependentView { 
  updateInvestor(investor) { if (investor) { this.addSyncKeyObserver(data, getInvestorDataKey(investor)); data.retrieveInvestorData(investor); } }
  getInvestorData() { return oO(this.props.investor && this.state[getInvestorDataKey(this.props.investor)]); }
} 

class InvestorDependentView_Btc extends InvestorDependentView { 
  updateInvestor(investor) { if (investor) { this.addSyncKeyObserver(data, getInvestorWalletDataKey(investor)); data.retrieveInvestorWalletData(investor); } }
  getInvestorWalletData() { return oO(this.props.investor && this.state[getInvestorWalletDataKey(this.props.investor)]); }
} 

let applyWithdrawalRequestStatus = wr => { A(oO(wr.status), { caption: "Action", displayFunc: (v, d) => (v === stati.Withdrawal_Requests.Pending) ? button("Approve", () => this.onApproveWithdrawal(d)) : cleanText(v) }); return wr; };
class Withdraw extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }

class InvestorID extends Comp {
  ren(p, s) { let i = oO(p.investor); return <div style={{borderStyle: "solid", borderWidth: "1px", borderRadius: `0.3em`, borderColor: '#777'}}>{
    tabulize(1/7, [['Public key', i.publicKey || '?'], ['Investor address (eth)', i.data || '?'], ['Wallet address (btc)', i.btcAddress || '?']])
  }</div> }
}

class EthTxView extends InvestorDependentView_Eth { 
  ren(p, s) { let i = this.getInvestorData(); 
    let headers = F(T("Deposits Withdrawals Withdrawal_Requests").map(k => [k, genHeaders(i[k])]));
    A(oO(headers.Deposits.status), { caption: "Action", displayFunc: (v, d) => (v !== stati.Deposits.Active) ? cleanText(v) : <OpenDialogButton id="Withdraw" comp={Withdraw} onAccept={I} /> });
    applyWithdrawalRequestStatus(headers.Withdrawal_Requests);
    headers = G(headers, v => V(v).filter(h => (p.EDeveloperMode.Developer) || T("status value txId pubKey timestamp").includes(h.label)));
    return <TabbedView style={{ display: D(p.investor) ? "block" : "none" }} caption={`Investor ${oO(p.investor).data}`} tabs={G(headers, (v, k) => () => <List data={i[k]} headers={v} />)} />;
  }
}

class InvestorList extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "investorsAddresses"); }
  ren(p, s) { return <List caption={p.caption || "Investors"} data={s.investorsAddresses} onChange={d => oF(p.onChangedSelectedInvestor)(oA(s.investorsAddresses)[d.selectedIx])} />; }
}

export { InvestorList, InvestorID, EthTxView, applyWithdrawalRequestStatus, InvestorDependentView_Eth, InvestorDependentView_Btc }