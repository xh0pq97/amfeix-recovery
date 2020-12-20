/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
/* eslint no-unused-vars: 0 */
import React from 'react';  
// eslint-disable-next-line
import { A, D, E, F, G, H, I, K, L, P, S, T, U, V, oA, oO, oS, asA, makeEnum, singleKeyObject } from './common/tools';  
// eslint-disable-next-line
import { FormControlLabel, Switch, List, ListItem, ListItemText, ListItemIcon, AppBar, Toolbar, Typography, Button, Box, TextField, Paper, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import { createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
// eslint-disable-next-line
import { Sidebar, ProgressDialog, OpenDialogButton, DialogWrap, cleanText, Selector, ValidatableComp, Comp, TabbedView, button, tabulize, formTable } from './ui/components'; 
import { Admin } from './ui/admin';
import { Log_in } from './ui/login';
import { Network } from './ui/network';
import { Progress, SimpleProgress, ProgressDependentView } from './ui/loadProgressView'
import { Impact_Fund } from './ui/impactFund';
import { Bitcoin_Wallet } from './ui/wallet'; 
// eslint-disable-next-line
import { InvestorID, InvestorList, EthTxView, InvestorDependentView } from './ui/investor';
//import ImpactFundIcon from './assets/impactFund.svg'
import { wallet } from './core/wallet';
import { pubKeyToEthAddress, pubKeyToBtcAddress } from "./common/pubKeyConvertor.mjs";
// eslint-disable-next-line
import { basePallette, getMainLightness, seriesColors, getMainColor, darkMode } from './ui/colors';
import { version } from './version.js'; 
import { data, ethInterfaceUrls } from './core/data'; 
// eslint-disable-next-line
import { EPallette, EUserMode, EDeveloperMode, enumDefault, enumDefObj } from './core/enums';   

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
  ren(p, s) { 
    return tabulize(1/3, [
      [button("Clear data cache", async () => { await data.clearCache() })],
      [button("Clear bitcoin transaction cache", async () => { await data.clearTransactionCache('btc'); })],  
      [button("Clear ethereum registered transaction cache", async () => { await data.clearTransactionCache('eth'); })]
    ]) 
  }
}
 
// wc52mNR2qTpFfNP 
class MainView extends ProgressDependentView { //constructor(p, s) { super(p, s);} 
  startWalletOp(walletOperation, f) { this.setState({ walletOperation, progressDialogOpen: true }, () => setTimeout(async () => { await f(); this.setState({ progressDialogOpen: false }) }, 500));  }
  acceptLogIn(d) { 
    if (d.seedWords) { this.startWalletOp("Encrypting", () => wallet.add(d.creds, d.seedWords, status => { this.setState({ walletCodecProgress: L(status.percent) }); })); }
    else { this.startWalletOp("Decrypting", () => wallet.open(d.creds, status => this.setState({ walletCodecProgress: status.percent }))); }
    return true;
  }
  ren(p, s) {
    let activeWallet = oO(p.wallet).lastLogin; 
    let tabs = A({ Bitcoin_Wallet, Impact_Fund }, p.EUserMode.Admin ? ({ Progress, Admin, Network, Settings, Cache }) : ({}));
//    {p.EUserMode.Admin ? <OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/> : null}
    return !(p.EUserMode.Admin || this.isLoaded()) ? <SimpleProgress/> : <><SimpleProgress/>{p.EUserMode.User && !D(activeWallet) ? <Log_in onAccept={d => this.acceptLogIn(d)}/> :
    <div title="Main" style={{width: "100%", height: "100%"}}><><AppBar position="static"><Toolbar>{p.EDeveloperMode.Developer ? <OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/> : null}
      {D(activeWallet) ? <>{`You are logged in to wallet '${activeWallet.name}'`}{button("Log out", () =>  ({ }))}</> : 'You are not logged in'}
    </Toolbar></AppBar> 
    <TabbedView tabs={tabs} parentProps={{...P(p, T("EDeveloperMode EUserMode investor dark urlParams wallet")) }} TabsControl={props => 
    tabulize(0, [[<Paper><img alt="amfeix-logo" style={{width: "100%", height: "100%"}} src="amfeix.png"/></Paper>], [<hr/>], [<Sidebar tabs={tabs} {...props}/>]])} horizontal={true}/> 
    <ProgressDialog open={s.progressDialogOpen || false} title={`${s.walletOperation} wallet...`} progress={s.walletCodecProgress} /></></div>}</>
} }

let investor;
if (urlParams.asEthAddress) investor = { data: urlParams.asEthAddress };
if (urlParams.asPublicKey) investor = { data: L("0x" + pubKeyToEthAddress(urlParams.asPublicKey)), pubKey: urlParams.asPublicKey, btcAddress: L(pubKeyToBtcAddress(urlParams.asPublicKey)) }

L(`Initializing with investor ${S(investor)}`);

if (D(investor)) data.runWhenDBInitialized(() => data.registerInvestorAddress(investor.data)); 

class App extends Comp { constructor(p) { super(p, { wallet, investor, ...G({EDeveloperMode, EUserMode, EPallette}, enumDefObj)}); this.state.theme = this.createTheme(); } 
  isDark() { let s = this.state; return !D(s.EPallette) || s.EPallette.Default ? darkMode : D(s.EPallette.Dark) }
  createTheme() { let dark = this.isDark();
    A(document.body.style, { color: getMainColor(true, dark), backgroundColor: getMainColor(false, dark) });
    return createMuiTheme({ palette: { type: dark ? 'dark' : 'light' } }) ;
  } 
  ren(p, s) { 
    return <div title="App" style={{width: "100%", height: "100%"}}><ThemeProvider theme={s.theme}>{urlParams.testMode ? <>
      {tabulize(1/3, [[...E({EUserMode, EDeveloperMode, EPallette}).map(([k, v]) => <Selector options={K(v).map(cleanText)} horizontal={true} onChanged={i => this.setState(singleKeyObject(k, singleKeyObject(V(v)[i], true)), this.setState({ theme: this.createTheme() }))}/>)]])}
      <InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState(L({ investor }))} {...(P(s, T("EUserMode EDeveloperMode")))} />
      <InvestorID investor={s.investor} />
    </> : null}
    <p>{`Future UI (work in progress, version >= ${version}) below this line.  Numbers shown may be inaccurate or entirely incorrect due to the development process being in progress.`}</p>
    <hr/>
    <MainView {...(P(s, T("investor EUserMode EDeveloperMode wallet")))} urlParams={urlParams} dark={this.isDark()}/></ThemeProvider></div>
  } 
} 

export { App }