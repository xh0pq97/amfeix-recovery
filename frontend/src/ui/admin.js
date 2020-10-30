import React from 'react';
import { V } from '../tools';
import { data } from '../data';
import { ValidatableComp, OpenDialogButton, Comp, TabbedView, List, tabulize, TabTimeline } from './components';
import { LoadProgressView } from './loadProgressView'
import { InvestorList, EthTxView, applyWithdrawalRequestStatus, genHeaders } from './investor';

class Approve_all_withdrawal_requests extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }
class Set_chart_data extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }
class Set_AUM extends Comp { ren(p, s) { return <TabTimeline tabs={{ ValidatableComp }} onAccept={p.onAccept} />; } }

export class Admin extends Comp {
  componentDidMount() { this.addSyncKeyObserver(data, "withdrawalRequests"); }
  ren(p, s) {
    return <TabbedView tabs={{
      LoadProgressView,
      Investors: () => tabulize(1 / 3, [[<InvestorList onChangedSelectedInvestor={investor => this.setState({ investor })} mode={p.mode} />], [<EthTxView investor={s.investor} mode={p.mode} />]]),
      Withdrawal_Requests: () => <>{tabulize(1 / 3, [[<OpenDialogButton id="Approve_all_withdrawal_requests" comp={Approve_all_withdrawal_requests} />]])}
        <List data={s.withdrawalRequests} headers={V(applyWithdrawalRequestStatus(genHeaders(s.withdrawalRequests)))} /></>,
      Pending_Deposits: () => <></>,
      Change_data: () => tabulize(1 / 3, [[<OpenDialogButton id="Set_chart_data" comp={Set_chart_data} />, <OpenDialogButton id="Set_AUM" comp={Set_AUM} />]])
    }} />;
  }
}
