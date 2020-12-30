/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
/* eslint no-unused-vars: 0 */
import React from 'react';  
// eslint-disable-next-line
import { A, C, D, E, F, G, H, I, K, L, P, S, T, U, V, oA, oO, oS, asA, makeEnum, singleKeyObject } from './common/tools';  
// eslint-disable-next-line
import { FormControlLabel, Switch, List, ListItem, ListItemText, ListItemIcon, AppBar, Toolbar, Typography, Button, Box, TextField, Paper, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import { createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
// eslint-disable-next-line
import { Sidebar, ProgressDialog, OpenDialogButton, DialogWrap, cleanText, Selector, ValidatableComp, Comp, TabbedView, button, tabulize, formTable, TabTimeline, form, preamble } from './ui/components'; 
import { Admin } from './ui/admin';
import { LogIn } from './ui/login';
import { Network } from './ui/network';
import { Progress, SimpleProgress, ProgressDependentView } from './ui/loadProgressView'
import { Impact_Fund } from './ui/impactFund';
import { Bitcoin_Wallet } from './ui/wallet'; 
// eslint-disable-next-line
import { InvestorID, InvestorList, EthTxView, InvestorDependentView } from './ui/investor';
//import ImpactFundIcon from './assets/impactFund.svg'
import { wallet } from './core/wallet';
import { testStatusIcons } from './ui/icons.js';
import { pubKeyToEthAddress, pubKeyToBtcAddress } from "./common/pubKeyConvertor.mjs";
// eslint-disable-next-line
import { basePallette, getMainLightness, seriesColors, getMainColor, darkMode } from './ui/colors';
import { version } from './version.js'; 
import { data, ethInterfaceUrls } from './core/data'; 
// eslint-disable-next-line
import { EPallette, EUserMode, EDeveloperMode, ETestStatus, enumDefault, enumDefObj } from './core/enums';   
import { instantiateTests } from './index.test.js';


let url = new URL(window.location.href);
let getUrlParam = k => (v => v === null ? U : v)(url.searchParams.get(k));
let urlParams = F(T("asEthAddress asPublicKey asBtcAddress").map(k => [k, getUrlParam(k)]));
urlParams.testMode = D(L(getUrlParam("8e763620037a1054b3656092dece8d324eef5dd5efd4e4d5c1bbc125c9c74996")));

class Settings extends Comp {
  ethInterfaceChanged(v) { data.setEthRPCUrl(ethInterfaceUrls[v]) }
  ren(p, s) { 
    return tabulize(1/3, [
      [<Selector options={ethInterfaceUrls} onChanged={v => this.ethInterfaceChanged(v)}/>],
      [button("Compute data", () => { data.computeAllInvestorData(); })],
    ]) 
  }
}

class Cache extends Comp {
  ethInterfaceChanged(v) { data.setEthRPCUrl(ethInterfaceUrls[v]) }
  ren(p, s) { return tabulize(1/3, [
    [button("Clear data cache",  () => data.clearCache())],
    ...T('btc eth').map(x => [button(`Clear ${x} transaction cache`, () => data.clearTransactionCache(x))])
  ]) }
}

class TestContext extends Comp { ren(p, s) { let c = oO(p.context); let z = { textAlign: "left", verticalAlign: "top" };
  return <div style={{ border: "1px solid #778", borderRadius: "0.333em" }}>{tabulize(1/3, [[c.name], 
  [tabulize(1/3, oA(c.children).map((t, i) => <div key={i}>{tabulize(1/9, [[`[${i}]`, <TestContext context={t}/>]], [[{ width: "2.5em", ...z }, z]])}</div>).map(x => [x]))], 
  [tabulize(1/3, oA(c.tests).map((t, i) => { let O = testStatusIcons[(K(t.getStatus())[0])]; return <div key={i}>{tabulize(1/9, [[<O/>,  t.name]], [[{ width: "2.5em", ...z }, z]])}</div>; }).map(x => [x]))]], 
  [[{...z, fontWeight: "bold"}]])}</div>; 
} }

class Test extends Comp { constructor() { super(); this.state = { r: instantiateTests() } }
  ren(p, s) { return <>{button("Start", () => this.state.r.execute(() => this.setState({ r: G(this.state.r, v => v) })))}<TestContext context={this.state.r}/></> } }
 
// wc52mNR2qTpFfNP 
class MainView extends ProgressDependentView { //constructor(p, s) { super(p, s);} 
  ren(p, s) { let tabs = A(p.EUserMode.Admin ? ({ Test, Progress, Admin, Network, Settings, Cache }) : ({}), { Bitcoin_Wallet, Impact_Fund });
//    {p.EUserMode.Admin ? <OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/> : null}
    return <><SimpleProgress/>{(p.EUserMode.User && !D(p.investor)) ? <LogIn onAccept={d => this.onAcceptLogIn(d)}/> :
    <div title="Main" style={{width: "100%", height: "100%"}}><><AppBar position="static"><Toolbar>{p.EDeveloperMode.Developer ? <OpenDialogButton id="LogIn" comp={LogIn} onAccept={d => this.onAcceptLogIn(d)}/> : null}
      {D(p.investor) ? <>{`You are logged in to wallet '${p.investor.name}'`}{button("Log out", () =>  ({ }))}</> : 'You are not logged in'}
    </Toolbar></AppBar>
    <TabbedView tabs={tabs} parentProps={{...P(p, T("EDeveloperMode EUserMode dark urlParams investor")) }} TabsControl={props => 
    tabulize(0, [[<Paper><img alt="amfeix-logo" style={{width: "100%", height: "100%"}} src="amfeix.png"/></Paper>], [<hr/>], [<Sidebar tabs={tabs} {...props}/>]])} horizontal={true}/> 
    <ProgressDialog open={s.progressDialogOpen || false} title={`${s.walletOperation} wallet...`} progress={s.walletCodecProgress} /></></div>}</>
} }

let investorChosen;
if (urlParams.asEthAddress) investorChosen = { data: urlParams.asEthAddress };
if (urlParams.asPublicKey) investorChosen = { data: L("0x" + pubKeyToEthAddress(urlParams.asPublicKey)), pubKey: urlParams.asPublicKey, btcAddress: L(pubKeyToBtcAddress(urlParams.asPublicKey)) }

L(`Initializing with investor ${S(investorChosen)}`);

//if (investor) simulateWithUser(investor);

/*
0x20D79A69eE74fd126889a6ac9c3c9e56C88d566b -- 02563b8cd535a191858d01f67ccf7572112d6c9910f1649b2204bea7d38dd8737e -- 1Ak8tjBRuK2JuQjuDPRHkTUZdRAnQkeYhP -- 20d79a69ee74fd126889a6ac9c3c9e56c88d566b
0x4A31d6AaDD57Ffe1624f87A43E170060d199A574 -- 02f1b2a982dbe744305a37f9dfd69d7d7c6eeaa5c34c1aba3bd277567df5b972fb 
0x4A4432Ce76855B05ED7B15b5153402b4BBe847F4 
0x7868382355A068bDCa578304aee7FeE4B83Bcb5d 
0xa644039B0FbE1185958E6F77028fdAA6E1268EEf 
0x63069CB12712aC4C8F7AdaEeA501C82014050688 
0x84F5634f650baAa08E1D7B25e86824c53b2C198b 
0x9Be31098Bf7bc1241f54b221f2577c1D81F4Ee4c 
0x25bc9eb983eC1f3c36aaB1574662723d6671E65d 
0xC93c8C37e54f55c8680c3227117A4667D93C94dC
	
*/
class InvestorForm extends ValidatableComp { constructor(p, s) { super(p, {...s, activeWallet: s.wallet?.lastLogin || s.investor}, "publicKey ethAddress btcAddress"); }
  ren(p, s) { return tabulize(1/3, [[this.genTextField("publicKey"), this.genTextField("ethAddress"), this.genTextField("btcAddress")]]); }
  validate() { let e = {}; return ((this.setErrors(e)) && (this.state.values)); }
}

class App extends Comp { constructor(p) { super(p, { wallet, investorChosen, ...G({EDeveloperMode, EUserMode, EPallette}, enumDefObj)}); this.state.theme = this.createTheme(); } 
  startWalletOp(walletOperation, f) { this.setState({ walletOperation, progressDialogOpen: true }, () => setTimeout(async () => { await f(); this.setState({ progressDialogOpen: false }, this.updateActiveWallet()) }, 500));  }
  async loadActiveWalletData() { await data.futs.basicLoad.promise; 
    await data.setMode(EUserMode.User); await data.futs.mode.promise; 
    if (this.state.activeWallet?.data) data.registerInvestorAddress(this.state.activeWallet?.data); 
  }
  updateActiveWallet() { this.setState({ investor: this.state.wallet?.lastLogin || this.state.investorChosen }, () => this.loadActiveWalletData()); }
  simulateWithUser(i) { L(`simulate for ${S(i)}`); if (D(i)) { i.data = i.data || i.ethAddress; this.setState({ investorChosen: i }, async () => this.updateActiveWallet()); } };
  acceptLogIn(d) { 
    if (d.seedWords) { this.startWalletOp("Encrypting", () => wallet.add(d.creds, d.seedWords, status => this.setState({ walletCodecProgress: status.percent }))); }
    else { this.startWalletOp("Decrypting", () => wallet.open(d.creds, status => this.setState({ walletCodecProgress: status.percent }))); }
    return true;
  }
  componentDidUpdate(prevProps, prevState) { if (prevState.EUserMode !== this.state.EUserMode) data.setMode(this.state.EUserMode); }
  isDark() { let s = this.state; return !D((s.EPallette)) || s.EPallette.Default ? darkMode : D(s.EPallette.Dark) }
  createTheme() { let dark = this.isDark();
    A(document.body.style, { color: getMainColor(true, dark), backgroundColor: getMainColor(false, dark) });
    return createMuiTheme({ palette: { type: dark ? 'dark' : 'light' } }) ;
  } 
  ren(p, s) { 
    return <div title="App" style={{width: "100%", height: "100%"}}><ThemeProvider theme={s.theme}>{urlParams.testMode ? <>
      {tabulize(1/3, [[...E({EUserMode, EDeveloperMode, EPallette}).map(([k, v]) => <Selector options={K(v).map(cleanText)} horizontal={true} onChanged={i => this.setState((singleKeyObject(k, singleKeyObject(K(v)[i], V(v)[i]))), () => this.setState({ theme: this.createTheme() }))}/>)]])}
      <InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState(({ investor }))} {...(P(s, T("EUserMode EDeveloperMode")))} />
      <InvestorID investor={s.activeWallet} />
    </> : null}
    {tabulize(1/3, [[<InvestorForm onChanged={userToSimulate => this.setState({ userToSimulate })}/>, button("Simulate", () => this.simulateWithUser(s.userToSimulate))]])}
    <p>{`Future UI (work in progress, version >= ${version}) below this line.  Numbers shown may be inaccurate or entirely incorrect due to the development process being in progress.`}</p>
    <hr/>
    <MainView {...(P(s, T("EUserMode EDeveloperMode investor")))} onAcceptLogIn={d => this.acceptLLogIn(d)} urlParams={urlParams} dark={this.isDark()}/></ThemeProvider></div>
  } 
} 

export { App }