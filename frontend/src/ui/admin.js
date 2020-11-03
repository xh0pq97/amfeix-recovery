import React from 'react';
// eslint-disable-next-line
import { D, E, F, G, L, S, V, oO } from '../tools';
import { w3, data } from '../core/data';

// eslint-disable-next-line
import { loadingComponent, applyListHeaders, commonTableHeaders, genHeaders, ValidatableComp, OpenDialogButton, Comp, TabbedView, List, tabulize, TabTimeline, form, preamble } from './components';
import { InvestorList, EthTxView, applyWithdrawalRequestStatus } from './investor';
import { Typography } from '@material-ui/core';

class Approve_deposits_form extends Comp {
  ren(p, s) {
    return form(preamble("Approve deposits", "Approve all pending deposits"), [[]])
  }
}
class Approve_all_pending_deposits extends Comp { ren(p, s) { return <TabTimeline tabs={{ Approve_deposits_form }} onAccept={p.onAccept} />; } }

class Approve_all_pending_withdrawals extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }

class Set_chart_data extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }
class Set_AUM extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }

class Deposits extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "fundDeposits"); }
  ren(p, s) { return loadingComponent(s.fundDeposits, <TabbedView tabs={F(E(s.fundDeposits).map(([k, v], i) => [`Deposit address #${i}`, () => <List data={v} headers={V(genHeaders(v))}/>]))}/>) }
}

class Investors extends Comp { 
  ren(p, s) { return tabulize(1/3, [[<InvestorList onChangedSelectedInvestor={investor => this.setState({ investor })} EDeveloperMode={p.EDeveloperMode} />], 
    [D(s.investor) ? <EthTxView investor={s.investor} EDeveloperMode={p.EDeveloperMode} /> : tabulize(5/3, [[<Typography>{'Select an investor to show their transactions'}</Typography>]])]]) }
}

class Change_data extends Comp { 
  ren(p, s) { return tabulize(5/3, [[<OpenDialogButton id="Set_chart_data" comp={Set_chart_data} />, <OpenDialogButton id="Set_AUM" comp={Set_AUM} />]]) }
}

class Pending_Deposits extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "pendingDeposits"); }
  approveAll() {
    for (let d in data) {
//      w3.web3.accounts.sign(w3.amfeixM().depositAdmin(address, txid, publicKey), password)
    }
  }
  ren(p, s) { return loadingComponent(s.pendingDeposits, tabulize(5/3, [
    [<OpenDialogButton id="Approve_all_pending_deposits" comp={Approve_all_pending_deposits} onAccept={() => this.approveAll()}/>],
    [<TabbedView tabs={F(E(s.pendingDeposits).map(([k, v], i) => [`Deposit address #${i}`, () => <List data={v} headers={V(genHeaders(v))}/>]))}/>]
  ])) }
}

class Withdrawal_Requests extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "withdrawalRequests"); }
  ren(p, s) { return loadingComponent(s.withdrawalRequests, tabulize(5/3, [
    [<OpenDialogButton id="Approve_all_pending_withdrawals" comp={Approve_all_pending_withdrawals} />],
    [<List data={s.withdrawalRequests} headers={V(applyWithdrawalRequestStatus(genHeaders(s.withdrawalRequests)))} />]
  ])) }
}

export class Admin extends Comp { 
  ren(p, s) { return <TabbedView tabs={{ Investors, Withdrawal_Requests, Deposits, Pending_Deposits, Change_data }} parentProps={{ EDeveloperMode: p.EDeveloperMode }}/>; }
}
