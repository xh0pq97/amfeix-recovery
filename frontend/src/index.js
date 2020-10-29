import React from 'react'; import ReactDOM from 'react-dom';
import Highcharts from 'highcharts/highstock'; import HighchartsReact from 'highcharts-react-official';
import * as serviceWorker from './serviceWorker';
import { A, D, E, F, G, H, I, K, L, S, T, U, V, oA, oF, oO, oS, asA, singleKeyObject } from './tools'; 
import { ethInterfaceUrl, ganacheInterfaceUrl, btcRpcUrl, btcFields, amfeixFeeFields, ethBasicFields, data, getInvestorDataKey, stati } from './data';
import { AppBar, Toolbar, Button, Box, TextField, Paper } from '@material-ui/core';
import {   createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
import { wrapEllipsisDiv, displayBtcTransaction, displayBtcAddress, ProgressDialog, OpenDialogButton, DialogWrap, Selector, ValidatableComp, Comp, TabbedView, List, captionMap, cleanText, button, tabulize, formTable, TabTimeline } from './ui/components'; 
import { Log_in } from './ui/login';
import { Bitcoin_Wallet } from './ui/wallet';
//import ImpactFundIcon from './assets/impactFund.svg'
import { Wallet } from './core/wallet';
 
let darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

class InvestorDependentView extends Comp {
  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { let investor = this.props.investor; if (prevP.investor !== investor) this.updateInvestor(investor); }
  updateInvestor(investor) { L(`New Investor: ${S(investor)}`); if (investor) {  this.addSyncKeyObserver(data, getInvestorDataKey(investor.index)); data.retrieveInvestorData(investor); } }
  getInvestorData() { return oO(this.props.investor && this.state[getInvestorDataKey(this.props.investor.index)]) }
}

let formatDate = date => {
  let fmt = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
  let d = G(fmt, (v, k) => new Intl.DateTimeFormat('en', { hour12: false, ...singleKeyObject(k, v)}).format(date)); 
  return `${d.month} ${d.day}, ${d.year} @ ${d.hour}:${d.minute}:${d.second}`;
}, formatTimestamp = timestamp => formatDate(new Date(1000 * timestamp));

let applyHeaders = h => { E({ 
txId: { caption: "BTC Tx", displayFunc: displayBtcTransaction }, 
    pubKey: { caption: "Pub key" },//, displayFunc: wrapEllipsisDiv },
    timestamp: { caption: "Time", align: "left", alignCaption: "left", displayFunc: formatTimestamp }, 
    value: { caption: "Amount (BTC)", align: "right", alignCaption: "right" }
  }).forEach(([k, v]) => A(oO(h[k]), v))
  return h;
}
let extractHeaders = d => F(K(oO(oA(d)[0])).map(h => [h, { label: h, caption: h }]))
let genHeaders = d => applyHeaders(extractHeaders(d));

let applyWithdrawalRequestStatus = wr => { A(oO(wr.status), { caption: "Action", displayFunc: (v, d) => (v === stati.Withdrawal_Requests.Pending) ? button("Approve", () => this.onApproveWithdrawal(d)) : cleanText(v) }); return wr; }

class Withdraw extends Comp { ren(p, s) { return <TabTimeline tabs={{ValidatableComp}} onAccept={p.onAccept} /> } }

class InvestorView extends InvestorDependentView {
  onWithdrawDeposit() {}
  onApproveWithdrawal() {}
  ren(p, s) { let i = this.getInvestorData(); 
    let lists = "Deposits Withdrawals Withdrawal_Requests".split(" ");
    let headers = F(lists.map(k => [k, genHeaders(i[k])])); 
    if (headers.Deposits.status) A(headers.Deposits.status, { caption: "Action", displayFunc: (v, d) => (v !== stati.Deposits.Active) ? cleanText(v) :
      <OpenDialogButton id="Withdraw" comp={Withdraw} onAccept={I}/>});
    applyWithdrawalRequestStatus(headers.Withdrawal_Requests);
    headers = G(headers, v => V(v).filter(h => p.mode.dev || T("status value txId pubKey timestamp").includes(h.label))); 
    return <TabbedView style={{ display: D(p.investor) ? "block" : "none" }} caption={`Investor ${oO(p.investor).data}`} tabs={F(lists.map(k => [k, () => <List data={i[k]} headers={headers[k]}/>]))} /> } 
}

class LoadProgressView extends Comp {
  componentDidMount() { L("componentDidMount: LoadProgressView")
    let displayDelay = 500, lastUpdate = (Date.now() - displayDelay); 
    this.addSyncObserver(data, "loadProgress", loadProgress => {   
      let currentTime = Date.now(), deltaS = (currentTime - lastUpdate), update = loadProgress => { 
        displayDelay = Math.min(4000, 1.41*displayDelay);
        lastUpdate = (currentTime); return !this.unmounted && this.setState({ loadProgress }) 
      };
      if ((deltaS >= displayDelay)) { update({...loadProgress}); } else { clearTimeout(this.updateTimeout); this.updateTimeout = setTimeout(() => update({...loadProgress}), displayDelay - deltaS); }
    }); 
  }
 
  ren(p, s) { return <div>{E((oO(s.loadProgress))).map(([key, data]) => <p key={key} style={{display: "inline", padding: '0.1em 1em 0.1em 1em'}}>{`(${data.index}/${data.length} ${key})`}</p>)}</div> }
}

class InvestorList extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "investorsAddresses"); }
  ren(p, s) { return <List caption={p.caption || "Investors"} data={s.investorsAddresses} onChange={d => oF(p.onChangedSelectedInvestor)(oA(s.investorsAddresses)[d.selectedIx]) } /> }
}

let simpleTableRows = rows => <table><tbody>{rows.map((r, i) => <tr key={i}><td>{r}</td></tr>)}</tbody></table>

class Approve_all_withdrawal_requests extends Comp { ren(p, s) { return <TabTimeline tabs={{ValidatableComp}} onAccept={p.onAccept} /> } }
class Set_chart_data extends Comp { ren(p, s) { return <TabTimeline tabs={{ValidatableComp}} onAccept={p.onAccept} /> } }
class Set_AUM extends Comp { ren(p, s) { return <TabTimeline tabs={{ValidatableComp}} onAccept={p.onAccept} /> } }

class Admin extends Comp { 
  componentDidMount() { this.addSyncKeyObserver(data, "withdrawalRequests"); } 
  approveAllWithdrawalRequests() {

  }
  ren(p, s) { return <TabbedView tabs={{ LoadProgressView, 
    Investors: () => simpleTableRows([<InvestorList onChangedSelectedInvestor={investor => this.setState({ investor })} mode={p.mode}/>, <InvestorView investor={s.investor} mode={p.mode}/>]),
    Withdrawal_Requests: () => <>{formTable([[<OpenDialogButton id="Approve_all_withdrawal_requests" comp={Approve_all_withdrawal_requests} />]])}
      <List data={s.withdrawalRequests} headers={V(applyWithdrawalRequestStatus(genHeaders(s.withdrawalRequests)))}/></>,
    Pending_Deposits: () => <></>,
    Change_data: () => formTable([[<OpenDialogButton id="Set_chart_data" comp={Set_chart_data} />, <OpenDialogButton id="Set_AUM" comp={Set_AUM} /> ]])  
  }} /> }
}

let getMainLightness = (fg, dm) => ((D(dm) ? dm : darkMode) ^ fg) ? 0 : 1;
let getMainColor = (fg, dm) => ["#000", "#FFF"][getMainLightness(fg, dm)]; 
let basePallette = dark => ({ color: getMainColor(true, dark), backgroundColor: getMainColor(false, dark) });

let seriesColors = (i, dark) => (`#FF2170`);
let chartOpts = (title, valueSuffix, datas, dark) => ({ rangeSelector: {selected: 1}, title: { text: title }, navigator: {enabled: true}, credits: {enabled: false}, chart: { zoomType: "x", ...basePallette(dark)}, plotOptions: { areaspline: { fillColor: `hsla(240, 75%, ${100*getMainLightness(true, dark)}%, 20%)` } }, yAxis: [{ labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + valueSuffix; } } }], series: datas.map((series, i) => ({ name: series.name, type: "areaspline", tooltip: { valueSuffix }, color: seriesColors(i, dark), data: series.data || [] })) })

let timeDataTrafo = (name, data) => ({ name, data })//: oA(data).map(([t, d]) => [1000*t, d]) })

class FundIndexChart extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "timeData"); }
  ren(p, s) { return <Box><HighchartsReact constructorType={"stockChart"} highcharts={Highcharts} options={chartOpts('Fund Index', " %", [timeDataTrafo("ROI", s.timeData)], p.dark)} /></Box> }
}

class Impact_Fund extends InvestorDependentView {
  componentDidMount() { super.componentDidMount(); ethBasicFields.concat(T("roi dailyChange timeData")).map(k => this.addSyncKeyObserver(data, k)); } 

  ren(p, s) { let changePerc = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : ''; //L(`Fundview inv = ${S(p.investor)}`);
    let iData = this.getInvestorData(); //L(`p.dark = ${p.dark}`);
    //L(`iData.value[0] = ${S(oA(oO(iData).value)[0])}`)
    let displayTrafo = { dailyChange: changePerc, aum: v => `${parseInt(v)/Math.pow(10, s.decimals)} BTC` }
    return <table><tbody>
      <tr><td colSpan={3}><table><tbody><tr><td><table><tbody>
        <tr><td style={{align: "right"}}><Box><p>{D(iData.investmentValue) ? `${iData.investmentValue} BTC` : null}</p><p>{`Investment Value`}</p></Box></td></tr>
        <tr><td><Box style={{align: "right"}}><p>{changePerc(s.roi)}</p><p>{`ROI`}</p></Box></td></tr>
      </tbody></table></td><td><FundIndexChart dark={p.dark}/></td></tr></tbody></table></td></tr>
      <tr>{T("dailyChange aum btcPrice").map((v, i) => <td key={i}><Box>{`${v}: ${(displayTrafo[v] || I)(s[v])}`}</Box></td>)}</tr>
      <tr><td colSpan={3}><HighchartsReact constructorType={"stockChart"} highcharts={Highcharts} options={chartOpts('Investment Performance', " BTC", [timeDataTrafo("Value", iData.value)], p.dark)} /></td></tr>
      <tr><td colSpan={3}><InvestorView investor={p.investor} mode={p.mode}/></td></tr>
    </tbody></table>
  }
}

class Bitcoin_P2P_Network extends Comp { componentDidMount() { btcFields.forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return <List data={[{ name: "RPC url", value: btcRpcUrl }].concat(btcFields.map(name => ({ name, value: S(oO(s[name]).result) })))} /> }
}
let amfeixAddressLists = ["fundDepositAddresses", "feeAddresses"], ethFields = ["owner"].concat(amfeixFeeFields);
class Ethereum_P2P_Network extends Comp { componentDidMount() { amfeixAddressLists.concat(ethFields).forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return tabulize(2/3, [
    [<List data={[{ name: "RPC url", value: <Selector options={[ethInterfaceUrl, ganacheInterfaceUrl]}/> }].concat(ethFields.map(name => ({ name, value: S(oO(s[name])) })))} />],
    [tabulize(1/3, [amfeixAddressLists.map(k => { let h = genHeaders(s[k]);
      A(oO(h.data), { caption: "Address", displayFunc: displayBtcAddress });
      return <List caption={captionMap[k]} data={(oA(s[k]))} headers={V(h)} />; })])]
  ]) } 
}
let wallet = new Wallet();

class Network extends Comp { ren(p, s) { return <TabbedView tabs={({Bitcoin_P2P_Network, Ethereum_P2P_Network })} /> } }
class MainView extends Comp { constructor(p, s) { super(p, s); this.state.wallets = wallet.wallets; } 
  startWalletOp(walletOperation, f) { this.setState({ walletOperation, progressDialogOpen: true }, () => setTimeout(async () => { await f(); this.setState({ progressDialogOpen: false, wallets: L(wallet.wallets) }) }, 500));  }
  acceptLogIn(d) {
    L(`d = ${S(d)}`)
    if (d.seedWords) { this.startWalletOp("Encrypting", () => wallet.add(d.creds, d.seedWords, status => { this.setState({ walletCodecProgress: L(status.percent) }); })); }
    else { this.startWalletOp("Decrypting", () => wallet.open(d.creds, status => this.setState({ walletCodecProgress: status.percent }))); }
    return true;
  }
  ren(p, s) { return <><AppBar position="static"><Toolbar>
    <OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/>
    <ProgressDialog open={s.progressDialogOpen || false} title={`${s.walletOperation} wallet...`} progress={s.walletCodecProgress} />
    {D(s.wallet) ? button("Log out", () => this.setState({ wallet: U })) : null}
  </Toolbar></AppBar>
  <TabbedView orientation={"vertical"} tabs={{Bitcoin_Wallet, Admin, Impact_Fund, Network}} parentProps={{ mode: p.mode, investor: p.investor, wallets: s.wallets, dark: p.dark }}/></>
} }

class App extends Comp { 
  constructor(p) { super(p); this.state.theme = this.createTheme(); } 
  createTheme() { let s = this.state;
    A(document.body.style, { color: getMainColor(true, s.dark), backgroundColor: getMainColor(false, s.dark) });
    return createMuiTheme({ palette: { type: s.dark ? 'dark' : 'light' } }) ;
  }
  ren(p, s) { let mode = {dev: s.dev, admin: s.admin};
    return <ThemeProvider theme={s.theme}>
    <table><tbody><tr>
      <td><Selector options={["Admin mode", "User mode"]} onChanged={i => this.setState({ admin: i === 0 })}/></td>
      <td><Selector options={["Developer view", "Production preview"]} onChanged={i => this.setState({ dev: i === 0 })}/></td>
      <td><Selector options={["Default", "Dark", "Light"]} onChanged={i => this.setState({ dark: (i === 0) ? darkMode : (i === 1) }, () => this.setState({ theme: this.createTheme() }))}/></td>
    </tr></tbody></table>
    <InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState({ investor })} mode={mode}/>
  <p>Future UI (work in progress) below this line.  Numbers shown may be inaccurate or entirely incorrect due to the development process being in progress.</p><hr/>
  <MainView investor={s.investor} mode={mode} wallet={s.wallet} dark={s.dark}/></ThemeProvider> } 
} 

ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();