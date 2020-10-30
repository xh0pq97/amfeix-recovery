import React from 'react'; import ReactDOM from 'react-dom';
import Highcharts from 'highcharts/highstock'; import HighchartsReact from 'highcharts-react-official';
import * as serviceWorker from './serviceWorker';
import { A, D, H, I, L, S, T, U, oS, asA } from './tools'; 
import { ethBasicFields, data } from './data';
import { AppBar, Toolbar, Button, Box, TextField, Paper } from '@material-ui/core';
import { createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
import { ProgressDialog, OpenDialogButton, DialogWrap, Selector, ValidatableComp, Comp, TabbedView, button, tabulize, formTable } from './ui/components'; 
import { Log_in } from './ui/login';
import { Network } from './ui/network';
import { Admin } from './ui/admin';
import { Bitcoin_Wallet } from './ui/wallet'; 
import { InvestorList, EthTxView, InvestorDependentView } from './ui/investor';
//import ImpactFundIcon from './assets/impactFund.svg'
import { Wallet } from './core/wallet';
import { basePallette, getMainLightness, seriesColors, getMainColor, darkMode } from './ui/colors';
import { version } from './version.js'
 
let chartOpts = (title, valueSuffix, datas, dark) => ({ rangeSelector: {selected: 1}, title: { text: title }, navigator: {enabled: true}, credits: {enabled: false}, chart: { zoomType: "x", ...basePallette(dark)}, plotOptions: { areaspline: { fillColor: `hsla(240, 75%, ${100*getMainLightness(true, dark)}%, 20%)` } }, yAxis: [{ labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + valueSuffix; } } }], series: datas.map((series, i) => ({ name: series.name, type: "areaspline", tooltip: { valueSuffix }, color: seriesColors(i, dark), data: series.data || [] })) })

let timeDataTrafo = (name, data) => ({ name, data })//: oA(data).map(([t, d]) => [1000*t, d]) })

class FundIndexChart extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "timeData"); }
  ren(p, s) { return <Box><HighchartsReact constructorType={"stockChart"} highcharts={Highcharts} options={chartOpts('Fund Index', " %", [timeDataTrafo("ROI", s.timeData)], p.dark)} /></Box> }
}

class Impact_Fund extends InvestorDependentView {
  componentDidMount() { super.componentDidMount(); ethBasicFields.concat(T("roi dailyChange timeData")).map(k => this.addSyncKeyObserver(data, k)); } 

  ren(p, s) { let changePerc = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : ''; //L(`Fundview inv = ${S(p.investor)}`);
    let iData = this.getInvestorData(); 
    let displayTrafo = { dailyChange: changePerc, aum: v => `${parseInt(v)/Math.pow(10, s.decimals)} BTC` }
    let parfs = p => p.map((e, i) => <p key={i}>{e}</p>);
    return tabulize(1/3, [
      [tabulize(1/3, [[tabulize(1/3, [[parfs([D(iData.investmentValue) && `${iData.investmentValue} BTC`, `Investment Value`])], [parfs([changePerc(s.roi), `ROI`])]]), <FundIndexChart dark={p.dark}/>]])],
      [tabulize(1/3, [T("dailyChange aum btcPrice").map((v, i) => `${v}: ${(displayTrafo[v] || I)(s[v])}`)])],
      [<HighchartsReact constructorType={"stockChart"} highcharts={Highcharts} options={chartOpts('Investment Performance', " BTC", [timeDataTrafo("Value", iData.value)], p.dark)} />],
      [<EthTxView investor={p.investor} mode={p.mode}/>]
    ]) 
  }
}

let wallet = new Wallet();

class MainView extends Comp { constructor(p, s) { super(p, s); this.state.wallets = wallet.wallets; } 
  startWalletOp(walletOperation, f) { this.setState({ walletOperation, progressDialogOpen: true }, () => setTimeout(async () => { await f(); this.setState({ progressDialogOpen: false, wallets: (wallet.wallets) }) }, 500));  }
  acceptLogIn(d) {
//    L(`d = ${S(d)}`)
    if (d.seedWords) { this.startWalletOp("Encrypting", () => wallet.add(d.creds, d.seedWords, status => { this.setState({ walletCodecProgress: L(status.percent) }); })); }
    else { this.startWalletOp("Decrypting", () => wallet.open(d.creds, status => this.setState({ walletCodecProgress: status.percent }))); }
    return true;
  }
  ren(p, s) { return <><AppBar position="static"><Toolbar>
    <OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/>{D(s.wallet) ? button("Log out", () => this.setState({ wallet: U })) : null}
<p>{`Version ${version}`}</p>
  </Toolbar></AppBar>
  <ProgressDialog open={s.progressDialogOpen || false} title={`${s.walletOperation} wallet...`} progress={s.walletCodecProgress} />
  <TabbedView orientation={"vertical"} tabs={{Bitcoin_Wallet, Admin, Impact_Fund, Network}} parentProps={{ mode: p.mode, investor: p.investor, wallets: s.wallets, dark: p.dark }}/></>
} }

class App extends Comp { 
  constructor(p) { super(p); this.state.theme = this.createTheme(); } 
  createTheme() { let s = this.state;
    A(document.body.style, { color: getMainColor(true, s.dark), backgroundColor: getMainColor(false, s.dark) });
    return createMuiTheme({ palette: { type: s.dark ? 'dark' : 'light' } }) ;
  }
  ren(p, s) { let mode = {dev: s.dev, admin: s.admin};
    return <ThemeProvider theme={s.theme}>{tabulize(1/3, [[
      <Selector options={["Admin mode", "User mode"]} onChanged={i => this.setState({ admin: i === 0 })}/>,
      <Selector options={["Developer view", "Production preview"]} onChanged={i => this.setState({ dev: i === 0 })}/>,
      <Selector options={["Default", "Dark", "Light"]} onChanged={i => this.setState({ dark: (i === 0) ? darkMode : (i === 1) }, () => this.setState({ theme: this.createTheme() }))}/>
    ]])} 
    <InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState({ investor })} mode={mode}/>
  <p>Future UI (work in progress) below this line.  Numbers shown may be inaccurate or entirely incorrect due to the development process being in progress.</p><hr/>
  <MainView investor={s.investor} mode={mode} wallet={s.wallet} dark={s.dark}/></ThemeProvider> } 
} 

ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();