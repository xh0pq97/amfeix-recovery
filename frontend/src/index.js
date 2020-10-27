import React from 'react'; import ReactDOM from 'react-dom';
import Highcharts from 'highcharts'; import HighchartsReact from 'highcharts-react-official';
import * as serviceWorker from './serviceWorker';
import { A, D, E, F, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from './tools'; 
import { ethInterfaceUrl, ganacheInterfaceUrl, btcRpcUrl, btcFields, amfeixFeeFields, ethBasicFields, data, getInvestorDataKey, stati } from './data';
import { SimpleDialog, AppBar, Toolbar, Button, Box, TextField, Tab, Tabs, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter } from '@material-ui/core';
import {   createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
import { Selector, Comp, TabbedView, List, captionMap, removeUnderscores, button } from './ui/components'; 
import { Bitcoin_Wallet } from './ui/wallet';
import ImpactFundIcon from './assets/impactFund.svg'
import { Wallet } from './core/wallet';
 
const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

class InvestorDependentView extends Comp {
  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { let investor = this.props.investor; if (prevP.investor !== investor) this.updateInvestor(investor); }
  updateInvestor(investor) { L(`New Investor: ${S(investor)}`); if (investor) {  this.addSyncKeyObserver(data, getInvestorDataKey(investor.index)); data.retrieveInvestorData(investor); } }
  getInvestorData() { return oO(this.props.investor && this.state[getInvestorDataKey(this.props.investor.index)]) }
}

let formatDate = date => {
  let fmt = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
  let d = F(E(fmt).map(([k, v]) => [k, new Intl.DateTimeFormat('en', { hour12: false, ...singleKeyObject(k, v)}).format(date)])); 
  return `${d.month} ${d.day}, ${d.year} @ ${d.hour}:${d.minute}:${d.second}`;
}, formatTimestamp = timestamp => formatDate(new Date(1000 * timestamp));

let wrapEllipsisDiv = v => <div style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>{v}</div>;
let applyHeaders = h => {
  A(oO(h.txId), { caption: "BTC Tx", displayFunc: wrapEllipsisDiv });
  A(oO(h.pubKey), { caption: "Pub key", displayFunc: wrapEllipsisDiv });
  A(oO(h.timestamp), { caption: "Time", align: "left", alignCaption: "left", displayFunc: formatTimestamp });
  A(oO(h.value), { caption: "Amount (BTC)", align: "right", alignCaption: "right" });
  return h;
}
let extractHeaders = d => F(K(oO(oA(d)[0])).map(h => [h, { label: h, caption: h }]))
let genHeaders = d => applyHeaders(extractHeaders(d));

let applyWithdrawalRequestStatus = wr => { A(oO(wr.status), { caption: "Action", displayFunc: (v, d) => (v === stati.Withdrawal_Requests.Pending) ? button("Approve", () => this.onApproveWithdrawal(d)) : removeUnderscores(v) }); return wr; }

class InvestorView extends InvestorDependentView {
  onWithdrawDeposit() {}
  onApproveWithdrawal() {}
  ren(p, s) { let i = this.getInvestorData(); 
    let lists = "Deposits Withdrawals Withdrawal_Requests".split(" ");
    let headers = F(lists.map(k => [k, genHeaders(i[k])])); 
    if (headers.Deposits.status) A(headers.Deposits.status, { caption: "Action", displayFunc: (v, d) => 
      (v === stati.Deposits.Active) ? button("Withdraw", () => this.onWithdrawDeposit(d)) : removeUnderscores(v) 
    });
    applyWithdrawalRequestStatus(headers.Withdrawal_Requests);
    headers = F(E(headers).map(([k, v]) => [k, V(v).filter(h => p.mode.dev || "status value txId pubKey timestamp".split(" ").includes(h.label))])); 

    return <TabbedView style={{ display: D(p.investor) ? "block" : "none" }} caption={`Investor ${oO(p.investor).data}`} tabs={F(lists.map(k => [removeUnderscores(k), () => <List data={i[k]} headers={headers[k]}/>]))} /> } 
}

class LoadProgressView extends Comp {
  componentDidMount() { L("componentDidMount: LoadProgressView")
    let displayDelay = 500, lastUpdate = (Date.now() - displayDelay); 
    this.addSyncObserver(data, "loadProgress", loadProgress => {   
      let currentTime = Date.now(), deltaS = (currentTime - lastUpdate), update = loadProgress => { 
        displayDelay = Math.min(4000, 1.41*displayDelay);
        lastUpdate = (currentTime); return this.setState({ loadProgress }) 
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

class Admin extends Comp { 
  componentDidMount() { this.addSyncKeyObserver(data, "withdrawalRequests"); }
  submitAUM() {

  }
  submitChartDataNow() {

  }
  approveAllWithdrawalRequests() {

  }
  ren(p, s) {  
    return <TabbedView tabs={{ LoadProgress: <LoadProgressView />, 
    Investors: simpleTableRows([<InvestorList onChangedSelectedInvestor={investor => this.setState({ investor })} mode={p.mode}/>, <InvestorView investor={s.investor} mode={p.mode}/>]),
    Withdrawal_Requests: <>{button("Approve all", () => this.approveAllWithdrawalRequests())}<List data={s.withdrawalRequests} headers={V(applyWithdrawalRequestStatus(genHeaders(s.withdrawalRequests)))}/></>,
    Pending_Deposits: <></>,
    Change_data: [
      { name: "Chart data for current block", input: <Box><TextField variant="outlined" /></Box>, action: button("Submit", () => this.submitChartDataNow()) },
      { name: "Set AUM", input: <div><TextField variant="outlined" /></div>, action: button("Submit", () => this.submitAUM()) }]
    .map(v => <Paper><table><tbody><tr><td>{v.name}</td><td>{v.input}</td><td>{v.action}</td></tr></tbody></table></Paper>)  
  }} /> }
}

let getMainLightness = fg => (darkMode ^ fg) ? 0 : 1;
let getMainColor = fg => ["#000", "#FFF"][getMainLightness(fg)]; 
let basePallette = { color: getMainColor(true), backgroundColor: getMainColor(false) };

let seriesColors = i => (`hsl(${120*i}, 50%, ${25 + 50*getMainLightness(true)}%)`);
let chartOpts = (title, valueSuffix, datas) => ({ title: { text: title }, rangeSelector: {selected: 1}, navigator: {enabled: !0}, credits: {enabled: !1},  rangeSelector: {selected: 1},
  chart: {zoomType: "x", ...basePallette},
  plotOptions: { areaspline: { fillColor: `hsla(240, 75%, ${100*getMainLightness(true)}%, 20%)`
 } }, yAxis: { labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + valueSuffix; } } },
  series: datas.map((series, i) => ({ name: series.name, type: "areaspline", tooltip: { valueSuffix }, color: seriesColors(i), data: series.data }))
})

let timeDataTrafo = (name, data) => ({ name, data: oA(data).map(([t, d]) => [new Date(1000*t), d]) })

class FundIndexChart extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "timeData"); }
  ren(p, s) { return <Paper><HighchartsReact highcharts={Highcharts} options={chartOpts('Fund Index', " %", [timeDataTrafo("ROI", s.timeData)], "ROI")} /></Paper> }
}

class Impact_Fund extends InvestorDependentView {
  componentDidMount() { super.componentDidMount(); ethBasicFields.concat(["roi", "dailyChange", "timeData"]).map(k => this.addSyncKeyObserver(data, k)); } 

  ren(p, s) { let changePerc = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : ''; //L(`Fundview inv = ${S(p.investor)}`);
    let iData = this.getInvestorData();
    let displayTrafo = { dailyChange: changePerc, aum: v => `${parseInt(v)/Math.pow(10, s.decimals)} BTC` }
    return <table><tbody>
      <tr><td colSpan={3}><table><tbody><tr><td><table><tbody>
        <tr><td style={{align: "right"}}><Paper><p>{D(iData.investmentValue) ? `${iData.investmentValue} BTC` : null}</p><p>{`Investment Value`}</p></Paper></td></tr>
        <tr><td><Paper style={{align: "right"}}><p>{changePerc(s.roi)}</p><p>{`ROI`}</p></Paper></td></tr>
      </tbody></table></td><td><FundIndexChart /></td></tr></tbody></table></td></tr>
      <tr>{"dailyChange aum btcPrice".split(" ").map((v, i) => <td key={i}><Paper>{`${v}: ${(displayTrafo[v] || I)(s[v])}`}</Paper></td>)}</tr>
      <tr><td colSpan={3}><HighchartsReact highcharts={Highcharts} options={chartOpts('Investment Performance', " BTC", [timeDataTrafo("Investment", iData.investment), timeDataTrafo("Value", iData.value)], "Investment")} /></td></tr>
      <tr><td colSpan={3}><InvestorView investor={p.investor} mode={p.mode}/></td></tr>
    </tbody></table>
  }
}

class Bitcoin_P2P_Network extends Comp { componentDidMount() { btcFields.forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return <List data={[{ name: "RPC url", value: btcRpcUrl }].concat(btcFields.map(name => ({ name, value: S(oO(s[name]).result) })))} /> }
}
let amfeixAddressLists = ["fundDepositAddresses", "feeAddresses"], ethFields = ["owner"].concat(amfeixFeeFields);
class Ethereum_P2P_Network extends Comp { componentDidMount() { amfeixAddressLists.concat(ethFields).forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return <table><tbody>
    <tr><td colSpan={2}><Paper><List data={[{ name: "RPC url", value: <Selector options={[ethInterfaceUrl, ganacheInterfaceUrl]}/> }].concat(ethFields.map(name => ({ name, value: S(oO(s[name])) })))} /></Paper></td></tr> 
    <tr>{amfeixAddressLists.map((k, i) => <td key={i}><Paper><List caption={captionMap[k]} data={L(oA(s[k]))} /></Paper></td>)}</tr>
  </tbody></table> } 
}

class Network extends Comp { ren(p, s) { return <TabbedView tabs={({Bitcoin_P2P_Network, Ethereum_P2P_Network })} /> } }
class MainView extends Comp { ren(p, s) { 
  return <><AppBar position="static"><Toolbar><Button color="inherit" onClick={() => {}}>Login</Button></Toolbar></AppBar>
  <TabbedView orientation={"vertical"} tabs={F(E({Bitcoin_Wallet, Admin, Impact_Fund, Network}).map(([k, V]) => [removeUnderscores(k), () => <V mode={p.mode} investor={p.investor}/>]))}/></>
} }

class App extends Comp { constructor(p) { super(p); A(this.state, { theme: createMuiTheme({ palette: { type: darkMode ? 'dark' : 'light' } }) }); } 
  ren(p, s) { let mode = {dev: s.dev, admin: s.admin};
    return <ThemeProvider theme={s.theme}>
    <table><tbody><tr>
      <td><Selector options={["Admin mode", "User mode"]} onChanged={i => this.setState({ admin: i === 0 })}/></td>
      <td><Selector options={["Developer mode", "Production preview"]} onChanged={i => this.setState({ dev: i === 0 })}/></td>
    </tr></tbody></table>
    <InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState({ investor })} mode={mode}/>
  <p>Future UI (work in progress) below this line.  Numbers shown may be inaccurate or entirely incorrect due to the development process being in progress.</p><hr/>
  <MainView investor={s.investor} mode={mode} /></ThemeProvider> } 
} 

document.body.style.color = getMainColor(true);
document.body.style.backgroundColor = getMainColor(false);
ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();