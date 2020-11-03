import React from 'react'; import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
// eslint-disable-next-line
import { A, D, E, F, G, H, I, K, L, P, S, T, U, V, oA, oS, asA, makeEnum, singleKeyObject } from './tools';  
// eslint-disable-next-line
import { FormControlLabel, Switch, List, ListItem, ListItemText, ListItemIcon, AppBar, Toolbar, Typography, Button, Box, TextField, Paper, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import { createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
// eslint-disable-next-line
import { Sidebar, ProgressDialog, OpenDialogButton, DialogWrap, cleanText, Selector, ValidatableComp, Comp, TabbedView, button, tabulize, formTable } from './ui/components'; 
import { Admin } from './ui/admin';
import { Log_in } from './ui/login';
import { Network } from './ui/network';
import { Impact_Fund } from './ui/impactFund';
import { Load_Progress } from './ui/loadProgressView'
import { Bitcoin_Wallet } from './ui/wallet'; 
// eslint-disable-next-line
import { InvestorList, EthTxView, InvestorDependentView } from './ui/investor';
//import ImpactFundIcon from './assets/impactFund.svg'
import { wallet, pubKeyToEthAddress, pubKeyToBtcAddress } from './core/wallet';
// eslint-disable-next-line
import { basePallette, getMainLightness, seriesColors, getMainColor, darkMode } from './ui/colors';
import { version } from './version.js';
import { features } from './projectManagement/features';
import { data, ethInterfaceUrl, ganacheInterfaceUrl } from './core/data';
// eslint-disable-next-line
import { EPallette, EUserMode, EDeveloperMode, enumDefault, enumDefObj } from './core/enums'; 

let url = new URL(window.location.href);
let getUrlParam = k => (v => v === null ? U : v)(url.searchParams.get(k))
let testMode = D(L(getUrlParam("8e763620037a1054b3656092dece8d324eef5dd5efd4e4d5c1bbc125c9c74996")));
let params = F(T("asEthAddress asPublicKey asBtcAddress").map(k => [k, getUrlParam(k)]));

class Settings extends Comp {
  ren(p, s) { 
    return tabulize(1/3, [[ <Selector options={[ethInterfaceUrl, ganacheInterfaceUrl]} />],
     [button("Clear data cache", () => {})]]) 
  }
}

class Features extends Comp { ren(p, s) { // <Typography><div style={{textAlign: "left", backgroundColor: 'hsla(0, 0, 0, 10%)'}}>{f.name}</div></Typography>
    let mapFeature = (f, i) => <div key={i} style={{borderStyle: "solid", borderWidth: "1px", borderRadius: "0.3em", borderColor: "#27F"}}>{tabulize(0, [
      [tabulize(1/9, [[<div style={{textAlign: "left"}}>{f.name}</div>, <FormControlLabel control={<Switch/>} label={"Done"}/>, <FormControlLabel control={<Switch/>} label={"Tested"}/>]])],
      [<div>{D(f.subFeatures) ? tabulize(1/9, (f.subFeatures ? mapFeatures(f.subFeatures) : []).map(x => [x])) : null}</div>]
    ])}</div>
    let mapFeatures = v => oA(v).map(mapFeature); 
    return mapFeatures([features]);
  }
}
// wc52mNR2qTpFfNP 
class MainView extends Comp { constructor(p, s) { super(p, s); this.state.openWallet = U; } 
  startWalletOp(walletOperation, f) { this.setState({ walletOperation, progressDialogOpen: true }, () => setTimeout(async () => { let openWallet = await f(); this.setState({ progressDialogOpen: false, openWallet }) }, 500));  }
  acceptLogIn(d) { 
    if (d.seedWords) { this.startWalletOp("Encrypting", () => wallet.add(d.creds, d.seedWords, status => { this.setState({ walletCodecProgress: L(status.percent) }); })); }
    else { this.startWalletOp("Decrypting", () => wallet.open(d.creds, status => this.setState({ walletCodecProgress: status.percent }))); }
    return true;
  }
  ren(p, s) { let tabs = A({ Bitcoin_Wallet, Impact_Fund, Load_Progress }, p.EUserMode.Admin ? ({ Admin, Network, Settings, Features }) : ({}));
//    {p.EUserMode.Admin ? <OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/> : null}
    return <><AppBar position="static"><Toolbar><p>{`Version >= ${version}`}</p><OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/>
      {D(s.wallet) ? button("Log out", () => this.setState({ openWallet: U })) : null}
    </Toolbar></AppBar> 
    <TabbedView tabs={tabs} parentProps={{...P(p, T("EDeveloperMode investor dark")), openWallet: s.openWallet, investor: p.investor }} TabsControl={props => <div>{tabulize(0, [[<Paper><img style={{width: "100%", height: "100%"}} src="amfeix.png"/></Paper>], [<hr/>], [<Sidebar tabs={tabs} {...props}/>]])}</div>} horizontal={true}/> 
    <ProgressDialog open={s.progressDialogOpen || false} title={`${s.walletOperation} wallet...`} progress={s.walletCodecProgress} /></> 
} }

let investor;
if (params.asEthAddress) investor = { data: params.asEthAddress };
if (params.asPublicKey) investor = { data: L("0x" + pubKeyToEthAddress(params.asPublicKey)), publicKey: params.asPublicKey, btcAddress: L(pubKeyToBtcAddress(params.asPublicKey)) }

if (D(investor)) data.runWhenDBInitialized(() => data.registerInvestorAddress(investor.data));

//let g = "024fbc46924b16f5ec5cc562ac0097094b6269f746bd0a5ce1dc9654a604abbedc"; L(`g: eth = ${pubKeyToEthAddress(g)} btc = ${pubKeyToBtcAddress(g)}`)

class App extends Comp { constructor(p) { super(p, { investor, ...G({EDeveloperMode, EUserMode, EPallette}, enumDefObj)}); this.state.theme = this.createTheme(); } 
  isDark() { let s = this.state; return !D(s.EPallette) || s.EPallette.Default ? darkMode : D(s.EPallette.Dark) }
  createTheme() { let s = this.state; let dark = this.isDark();
    A(document.body.style, { color: getMainColor(true, dark), backgroundColor: getMainColor(false, dark) });
    return createMuiTheme({ palette: { type: dark ? 'dark' : 'light' } }) ;
  } 
  ren(p, s) { 
    return <ThemeProvider theme={s.theme}>{testMode ? <>
      {tabulize(1/3, [[...E({EUserMode, EDeveloperMode, EPallette}).map(([k, v]) => <Selector options={K(v).map(cleanText)} onChanged={i => this.setState(singleKeyObject(k, singleKeyObject(V(v)[i], true)), 
        () => {
          if (this.state.EUserMode.Admin) data.adminLoad();
          this.setState({ theme: this.createTheme() });
        })}/>)]])}
      <InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState({ investor: L(investor) })}  {...(P(s, T("EUserMode EDeveloperMode")))} />
    </> : null}
       <p>Future UI (work in progress) below this line.  Numbers shown may be inaccurate or entirely incorrect due to the development process being in progress.</p>
      {D(investor) ? <p>{`Initialized for investor ${S(investor)}`}</p> : null}
    <hr/>
    <MainView {...(P(s, T("investor EUserMode EDeveloperMode")))} dark={this.isDark()}/></ThemeProvider> 
  } 
} 

ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();