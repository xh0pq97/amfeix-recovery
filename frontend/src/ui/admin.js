import React from 'react';
// eslint-disable-next-line
import { D, E, F, G, K, L, S, U, V, oA, oO } from '../tools';
import { w3, data } from '../core/data';

// eslint-disable-next-line
import { GetPasswordDialog, loadingComponent, applyListHeaders, commonTableHeaders, genHeaders, ValidatableComp, OpenDialogButton, Comp, TabbedView, List, tabulize, TabTimeline, form, preamble } from './components';
import { InvestorList, EthTxView, applyWithdrawalRequestStatus } from './investor';
import { Typography } from '@material-ui/core';
import BN from 'bn.js';
import { satoshiToBTCString } from '../core/satoshi';
import { formatTimestamp } from './formatting';
import { pubKeyToEthAddress } from '../core/wallet';

class Approve_deposits_form extends ValidatableComp {
  validate() {
    return this.props.pendingDeposits;
  }
  ren(p, s) { 
    return form(preamble("Approve deposits", "Click 'Confirm' to approve all pending deposits."), [
      ['Number of pending deposits:', oA(p.pendingDeposits).length],
      ['Total deposit value:', satoshiToBTCString(oA(p.pendingDeposits).reduce((p, c) => p.add(c.satoshiBN), new BN(0)))],
      ['Time of first deposit:', formatTimestamp(oA(p.pendingDeposits).reduce((p, c) => D(p) ? Math.min(p, c.timestamp) : c.timestamp, U))],
      ['Time of last deposit:', formatTimestamp(oA(p.pendingDeposits).reduce((p, c) => D(p) ? Math.max(p, c.timestamp) : c.timestamp, U))]
    ])
  }
}

class Approve_all_pending_deposits extends Comp { ren(p, s) { 
  return <TabTimeline tabs={{ Approve_deposits_form }} acceptText="Confirm" onAccept={p.onAccept} onCancel={() => { L('onCancel'); }} parentProps={{pendingDeposits: p.pendingDeposits}} />;
} }

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

class Pending_Deposits extends Comp { constructor(p, s) { super(p, { ...s, getPwdDialogOpen: false }); }
  componentDidMount() { this.addSyncKeyObserver(data, "pendingDeposits"); }
  approveAll(approvedDeposits) { 
    L(`Approving ${approvedDeposits.length} deposits`);
    let depositTransactions = approvedDeposits.map(d => w3.amfeixM().depositAdmin(pubKeyToEthAddress(d.pubKey, true), d.txId, d.pubKey, "").encodeABI());
    L(`ABIs encoded for ${approvedDeposits.length} deposits`);
    this.setState({ getPwdDialogOpen: true, depositTransactions });
    // Get password
//    for (let d in approvedDeposits) {
//      w3.web3.accounts.sign(w3.amfeixM().depositAdmin(address, txid, publicKey), password)
  //  }
  }
  approveWithPassword(creds) { L(`approveWithCreds : ${S(creds)}`)
    let privateKey = U;
    let signedTx = this.state.depositTransactions.map(t => w3.web3.accounts.sign(t, privateKey));
    this.setState({ depositTransactions: [] })
  }
  ren(p, s) { let pendingDeposits = oA(V(oO(s.pendingDeposits))[0]); //L(`Pending_Deposits: ${S(pendingDeposits)}`);
    return loadingComponent(s.pendingDeposits, tabulize(5/3, [
    [<><OpenDialogButton id="Approve_all_pending_deposits" parentProps={{ pendingDeposits }} comp={Approve_all_pending_deposits} onAccept={d => this.approveAll(d)}/>
     <GetPasswordDialog open={s.getPwdDialogOpen} onAccept={creds => this.approveWithPassword(creds)} onCancel={() => this.setState({ depositTransactions: [] })}/></>],
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
