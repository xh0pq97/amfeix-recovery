import React from 'react'; import ReactDOM from 'react-dom';
import Highcharts from 'highcharts'; import HighchartsReact from 'highcharts-react-official';
import * as serviceWorker from './serviceWorker';
import { A, D, E, F, I, L, S, U, oA, oF, oO, asA, singleKeyObject } from './tools'; 
import { ethInterfaceUrl, ganacheInterfaceUrl, btcRpcUrl, btcFields, amfeixFeeFields, ethBasicFields, data, getInvestorDataKey } from './data';
import { Button, Box, TextField, Tab, Tabs, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter } from '@material-ui/core';
import {   createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
import { Selector, Comp, TabbedView, List, captionMap } from './components'; 
import ImpactFundIcon from './assets/impactFund.svg'

const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

class InvestorDependentView extends Comp {
  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { let investor = this.props.investor; if (prevP.investor !== investor) this.updateInvestor(investor); }
  updateInvestor(investor) { L(`New Investor: ${S(investor)}`); if (investor) {  this.addSyncKeyObserver(data, getInvestorDataKey(investor.index)); data.retrieveInvestorData(investor); } }
  getInvestorData() { return oO(this.props.investor && this.state[getInvestorDataKey(this.props.investor.index)]) }
}

class InvestorView extends InvestorDependentView {
  ren(p, s) { let i = this.getInvestorData(); 
    return  <TabbedView style={{ display: D(p.investor) ? "block" : "none" }} caption={`Investor ${oO(p.investor).data}`} tabs={{ Deposits: <List data={i.deposits} />, Withdrawals: <List data={i.withdrawals} />, Withdrawal_Requests: <List data={i.withdrawalRequests} /> }}/> }
}

class LoadProgressView extends Comp {
  componentDidMount() {
    let displayDelay = 4000, lastUpdate = (Date.now() - displayDelay); 
    this.addSyncObserver(data, "loadProgress", loadProgress => {   
      let currentTime = Date.now(), deltaS = (currentTime - lastUpdate), update = loadProgress => { lastUpdate = currentTime; return this.setState({ loadProgress }) };
      if (deltaS >= displayDelay) { update(loadProgress); } else { clearTimeout(this.updateTimeout); this.updateTimeout = setTimeout(() => update(loadProgress), displayDelay - deltaS); }
    }); 
  }

  ren(p, s) { return <List data={ E(oO(s.loadProgress)).map(([key, data]) => ({ key, ...data })) } /> }
}

class InvestorList extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "investorsAddresses"); }
  ren(p, s) { return <List caption={p.caption || "Investors"} data={s.investorsAddresses} onChange={d => oF(p.onChangedSelectedInvestor)(oA(s.investorsAddresses)[d.selectedIx]) } /> }
}

let simpleTableRows = rows => <table><tbody>{rows.map((r, i) => <tr key={i}><td>{r}</td></tr>)}</tbody></table>

class AdminView extends Comp { 
  submitAUM() {

  }
  submitChartDataNow() {

  }
  ren(p, s) { let butt = (caption, action) => <Button variant="contained" color="primary" onClick={() => this[action]()}>{caption}</Button>
    return <TabbedView tabs={{ LoadProgress: <LoadProgressView />, 
    Investors: simpleTableRows([<InvestorList onChangedSelectedInvestor={investor => this.setState({ investor })} />, <InvestorView investor={s.investor} />]),
    Withdrawals: <TabbedView tabs={{ Pending: <List />, In_flight: <List /> }} />,
    Change_data: <List data={[
      { name: "Chart data for current block", input: <Box><TextField variant="outlined" /></Box>, action: butt("Submit", "submitCharDataNow") },
      { name: "Set AUM", input: <div><TextField variant="outlined" /></div>, action: butt("Submit", "submitAUM") }]} /> 
  }} /> }
}

class BitcoinWallet extends Comp {
  ren(p, s) { return <TabbedView tabs={{ History: <Box/>, Invest: <Box/>, Withdraw: <Box/> }} /> }
}

let getMainLightness = fg => (prefersDarkMode ^ fg) ? 0 : 1;
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

class FundView extends InvestorDependentView {
  componentDidMount() { super.componentDidMount(); ethBasicFields.concat(["roi", "dailyChange", "timeData"]).map(k => this.addSyncKeyObserver(data, k)); } 

  ren(p, s) { let changePerc = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : ''; //L(`Fundview inv = ${S(p.investor)}`);
    let iData = this.getInvestorData();
  // let txMap = oO(s.bitcoinTxs); 
//    let transactionList = d => <List headers={["timestamp", "txId", "value", "_"]} data={oA(d).map(({timestamp, txId}) => ({timestamp, txId, value: txMap[txId] || "?", x: "TODO"}))} />
    let displayTrafo = { dailyChange: changePerc, aum: v => `${parseInt(v)/Math.pow(10, s.decimals)} BTC` }
    return <table><tbody>
      <tr><td colSpan={3}><table><tbody><tr><td><table><tbody>
        <tr><td style={{align: "right"}}><Paper><p>{D(iData.investmentValue) ? `${iData.investmentValue} BTC` : null}</p><p>{`Investment Value`}</p></Paper></td></tr>
        <tr><td><Paper style={{align: "right"}}><p>{changePerc(s.roi)}</p><p>{`ROI`}</p></Paper></td></tr>
      </tbody></table></td><td><FundIndexChart /></td></tr></tbody></table></td></tr>
      <tr>{"dailyChange aum btcPrice".split(" ").map((v, i) => <td key={i}><Paper>{`${v}: ${(displayTrafo[v] || I)(s[v])}`}</Paper></td>)}</tr>
      <tr><td colSpan={3}><HighchartsReact highcharts={Highcharts} options={chartOpts('Investment Performance', " BTC", [timeDataTrafo("Investment", iData.investment), timeDataTrafo("Value", iData.value)], "Investment")} /></td></tr>
      <tr><td colSpan={3}><InvestorView investor={p.investor}/></td></tr>
    </tbody></table>
  }
}

class BitcoinP2PNet extends Comp { componentDidMount() { btcFields.forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return <List data={[{ name: "RPC url", value: btcRpcUrl }].concat(btcFields.map(name => ({ name, value: S(oO(s[name]).result) })))} /> }
}
let amfeixAddressLists = ["fundDepositAddresses", "feeAddresses"], ethFields = ["owner"].concat(amfeixFeeFields);
class EthereumP2PNet extends Comp { componentDidMount() { amfeixAddressLists.concat(ethFields).forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return <table><tbody>
    <tr><td colSpan={2}><Paper><List data={[{ name: "RPC url", value: <Selector options={[ethInterfaceUrl, ganacheInterfaceUrl]}/> }].concat(ethFields.map(name => ({ name, value: S(oO(s[name])) })))} /></Paper></td></tr> 
    <tr>{amfeixAddressLists.map((k, i) => <td key={i}><Paper><List caption={captionMap[k]} data={L(oA(s[k]))} /></Paper></td>)}</tr>
  </tbody></table> } 
}

class NetworkView extends Comp { ren(p, s) { return <TabbedView tabs={{Bitcoin: <BitcoinP2PNet/>, Ethereum: <EthereumP2PNet/> }} /> } }
class MainView extends Comp { ren(p, s) { return <TabbedView orientation={"vertical"} tabs={{ Admin: <AdminView/>, Bitcoin_Wallet: <BitcoinWallet/>, Impact_Fund: <FundView investor={p.investor}/>, Network: <NetworkView/> }} /> } }

class App extends Comp { constructor(p) { super(p, { prefersDarkMode, theme: createMuiTheme({ palette: { type: prefersDarkMode ? 'dark' : 'light', } }) }); } 
  ren(p, s) { return <ThemeProvider theme={s.theme}><InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState({ investor })}/>
  <p>UI below this line</p>
  <hr />
  <MainView investor={s.investor} /></ThemeProvider> } 
} 

document.body.style.color = getMainColor(true);
document.body.style.backgroundColor = getMainColor(false);
ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();