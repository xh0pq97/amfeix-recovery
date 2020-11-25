import React from 'react';
// eslint-disable-next-line
import { A, D, E, F, G, I, K, L, S, T, V, oA, oF, oO, singleKeyObject } from '../tools';
import { data, getInvestorWalletDataKey, getInvestorDataKey, stati } from '../core/data';
// eslint-disable-next-line
import { tabulize, commonDataTypes, genHeaders, ValidatableComp, Comp, TabbedView, List, cleanText, button, TabTimeline } from './components'; 

class DataDependentView extends Comp {
  componentDidMount() { this.componentDidUpdate({}); }
  componentDidUpdate(prevP) { if (prevP.investor !== this.props.investor) this.updateInvestor(this.props.investor); } 
} 
class InvestorDependentView_Eth extends DataDependentView { 
  updateInvestor(investor) { if (investor) { this.addSyncKeyObserver(data, getInvestorDataKey(investor)); data.retrieveInvestorData(investor); } }
  getInvestorData() { return oO(this.props.investor && this.state[getInvestorDataKey(this.props.investor)]); }
} 

class InvestorDependentView_Btc extends DataDependentView { 
  updateInvestor(investor) { if (investor) { this.addSyncKeyObserver(data, getInvestorWalletDataKey(investor)); data.retrieveInvestorWalletData(investor); } }
  getInvestorWalletData() { return oO(this.props.investor && this.state[getInvestorWalletDataKey(this.props.investor)]); }
} 

let applyWithdrawalRequestStatus = wr => { A(oO(wr.status), { caption: "Action", displayFunc: (v, d) => (v === stati.Withdrawal_Requests.Pending) ? button("Approve", () => this.onApproveWithdrawal(d)) : cleanText(v) }); return wr; };
class Withdraw extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }

class InvestorID extends Comp {
  ren(p, s) { let i = oO(p.investor); return tabulize(1/7, [['Public key', i.pubKey || '?'], ['Investor address (eth)', i.data || '?'], ['Wallet address (btc)', i.btcAddress || '?']]) }
}

class EthTxView extends InvestorDependentView_Eth { 
  ren(p, s) { let i = this.getInvestorData(); 
    let headers = F(T("Deposits Withdrawals Withdrawal_Requests").map(k => [k, genHeaders(i[k])]));
    A(oO(headers.Deposits.status), { caption: "Status", displayFunc: cleanText });
    applyWithdrawalRequestStatus(headers.Withdrawal_Requests);
    headers = G(headers, v => V(v).filter(h => (p.EDeveloperMode.Developer) || T("status value txId pubKey timestamp").includes(h.label)));
    return <TabbedView style={{ display: D(p.investor) ? "block" : "none" }} caption={`Investor ${oO(p.investor).data}`} tabs={G(headers, (v, k) => () => <List data={i[k]} headers={v} />)} />;
  }
}

class InvestorList extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "investorsAddresses"); }
  ren(p, s) { 
    let h = genHeaders(s.investorsAddresses);
    A(oO(h.data), { caption: "Address", displayFunc: commonDataTypes.btcAddress.displayFunc });
    return <List caption={p.caption || "Investors"} data={s.investorsAddresses} headers={V(h)} onChange={d => oF(p.onChangedSelectedInvestor)(oA(s.investorsAddresses)[d.selectedIx])} />; }
}

export { InvestorList, InvestorID, EthTxView, applyWithdrawalRequestStatus, InvestorDependentView_Eth, InvestorDependentView_Btc }