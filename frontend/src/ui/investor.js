/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
/* eslint no-unused-vars: 0 */
import React from 'react';
// eslint-disable-next-line
import { A, D, E, F, G, I, K, L, S, T, V, oA, oF, oO, singleKeyObject } from '../common/tools';
import { data, getInvestorWalletDataKey, getInvestorDataKey, stati } from '../core/data';
// eslint-disable-next-line
import { dataSummary, tabulize, commonDataTypes, genHeaders, ValidatableComp, Comp, TabbedView, List, cleanText, button, TabTimeline } from './components'; 

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

class InvestorID extends Comp {
  ren(p, s) { let i = oO(p.investor); return tabulize(1/7, [
    ['Public key', i.pubKey || '?'], 
    ['Investor address (eth)', commonDataTypes.ethAddress.displayFunc(i.data) || '?'], 
    ['Wallet address (btc)', commonDataTypes.btcAddress.displayFunc(i.btcAddress) || '?']]) }
}

class EthTxView extends InvestorDependentView_Eth { 
  ren(p, s) { let i = this.getInvestorData(); 
    let headers = F(T("Deposits Withdrawals Withdrawal_Requests").map(k => [k, genHeaders(i[k])]));
    headers = G(headers, v => V(v).filter(h => (p.EDeveloperMode.Developer) || T("status value txId pubKey timestamp").includes(h.label)));
    return <TabbedView style={{ display: D(p.investor) ? "block" : "none" }} caption={`Investor ${oO(p.investor).data}`} tabs={G(headers, (v, k) => () => 
    tabulize(1/2, [[dataSummary(k.slice(0, -1), i[k])], [<List data={i[k]} headers={v} />]]))} />;
  }
}

class InvestorList extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "investorsAddresses"); }
  ren(p, s) { 
    let h = genHeaders(s.investorsAddresses);
    A(oO(h.data), { caption: "Address", ...commonDataTypes.ethAddress });
    return <List caption={p.caption || "Investors"} data={s.investorsAddresses} headers={V(h)} onChange={d => oF(p.onChangedSelectedInvestor)(oA(s.investorsAddresses)[d.selectedIx])} />; 
  }
}

export { InvestorList, InvestorID, EthTxView, InvestorDependentView_Eth, InvestorDependentView_Btc }