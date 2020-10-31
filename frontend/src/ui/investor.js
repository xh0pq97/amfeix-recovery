import React from 'react';
// eslint-disable-next-line
import { A, D, E, F, G, I, K, L, S, T, V, oA, oF, oO, singleKeyObject } from '../tools';
import { data, getInvestorDataKey, stati } from '../data';
// eslint-disable-next-line
import { commonTableHeaders, applyListHeaders, extractHeaders, genHeaders, ValidatableComp, wrapEllipsisDiv, displayBtcTransaction, OpenDialogButton, Comp, TabbedView, List, cleanText, button, TabTimeline } from './components';

export class InvestorDependentView extends Comp {
  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { if (prevP.investor !== this.props.investor) this.updateInvestor(this.props.investor); }
  updateInvestor(investor) { L(`New Investor: ${S(investor)}`); if (investor) { this.addSyncKeyObserver(data, getInvestorDataKey(investor.index)); data.retrieveInvestorData(investor); } }
  getInvestorData() { return oO(this.props.investor && this.state[getInvestorDataKey(this.props.investor.index)]); }
}

/*{  
  txId: { caption: "BTC Transaction", displayFunc: displayBtcTransaction },
  timestamp: { caption: "Time", align: "left", alignCaption: "left", displayFunc: formatTimestamp },
  pubKey: { caption: "Public key", displayFunc: wrapEllipsisDiv },
  value: { caption: "Amount (BTC)", align: "right", alignCaption: "right" }
});*/
let applyWithdrawalRequestStatus = wr => { A(oO(wr.status), { caption: "Action", displayFunc: (v, d) => (v === stati.Withdrawal_Requests.Pending) ? button("Approve", () => this.onApproveWithdrawal(d)) : cleanText(v) }); return wr; };
class Withdraw extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }

export class EthTxView extends InvestorDependentView { 
  ren(p, s) { let i = this.getInvestorData(); 
    let headers = F(T("Deposits Withdrawals Withdrawal_Requests").map(k => [k, genHeaders(i[k])]));
    A(oO(headers.Deposits.status), { caption: "Action", displayFunc: (v, d) => (v !== stati.Deposits.Active) ? cleanText(v) : <OpenDialogButton id="Withdraw" comp={Withdraw} onAccept={I} /> });
    applyWithdrawalRequestStatus(headers.Withdrawal_Requests);
    headers = G(headers, v => V(v).filter(h => p.mode.dev || T("status value txId pubKey timestamp").includes(h.label)));
    return <TabbedView style={{ display: D(p.investor) ? "block" : "none" }} caption={`Investor ${oO(p.investor).data}`} tabs={G(headers, (v, k) => () => <List data={i[k]} headers={v} />)} />;
  }
}

export class InvestorList extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "investorsAddresses"); }
  ren(p, s) { return <List caption={p.caption || "Investors"} data={s.investorsAddresses} onChange={d => oF(p.onChangedSelectedInvestor)(oA(s.investorsAddresses)[d.selectedIx])} />; }
}

export { applyWithdrawalRequestStatus }