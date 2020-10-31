import React from 'react'; import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
// eslint-disable-next-line
import { A, D, H, I, L, S, T, U, oA, oS, asA } from './tools'; 
//import { ethBasicFields, data } from './data';
// eslint-disable-next-line
import { AppBar, Toolbar, Typography, Button, Box, TextField, Paper, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import { createMuiTheme, ThemeProvider}  from '@material-ui/core/styles';
// eslint-disable-next-line
import { Sidebar, ProgressDialog, OpenDialogButton, DialogWrap, Selector, ValidatableComp, Comp, TabbedView, button, tabulize, formTable } from './ui/components'; 
import { Admin } from './ui/admin';
import { Log_in } from './ui/login';
import { Network } from './ui/network';
import { Impact_Fund } from './ui/impactFund';
import { Bitcoin_Wallet } from './ui/wallet'; 
// eslint-disable-next-line
import { InvestorList, EthTxView, InvestorDependentView } from './ui/investor';
//import ImpactFundIcon from './assets/impactFund.svg'
import { Wallet } from './core/wallet';
// eslint-disable-next-line
import { basePallette, getMainLightness, seriesColors, getMainColor, darkMode } from './ui/colors';
import { version } from './version.js';
import { features } from './projectManagement/features';

let url = new URL(window.location.href);
let getUrlParam = k => (v => v === null ? U : v)(url.searchParams.get(k))
let testMode = D(L(getUrlParam("8e763620037a1054b3656092dece8d324eef5dd5efd4e4d5c1bbc125c9c74996")));

let wallet = new Wallet();

class Settings extends Comp {
  ren(p, s) { 
    return <>
      {button("Clear data cache", () => {})}
    </> 
  }
}

class Features extends Comp { //</Accordion><AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1bh-content" id="panel1bh-header" >
ren(p, s) { 
  let mapFeature = (f, i) => <><div style={{display: "block"}}><table key={i}><tbody><tr><td style={{width: "1.5em", verticalAlign: "top"}}>{'•'}</td><td><Accordion expanded={true}>
    <AccordionSummary><Typography>{f.name}</Typography></AccordionSummary>
    <AccordionDetails>{oA(f.subFeatures).map(mapFeature)}</AccordionDetails>
  </Accordion></td></tr></tbody></table></div><br/></>;
  return mapFeature(features) 
  }
}

class MainView extends Comp { constructor(p, s) { super(p, s); this.state.wallets = wallet.wallets; } 
  startWalletOp(walletOperation, f) { this.setState({ walletOperation, progressDialogOpen: true }, () => setTimeout(async () => { await f(); this.setState({ progressDialogOpen: false, wallets: (wallet.wallets) }) }, 500));  }
  acceptLogIn(d) { 
    if (d.seedWords) { this.startWalletOp("Encrypting", () => wallet.add(d.creds, d.seedWords, status => { this.setState({ walletCodecProgress: L(status.percent) }); })); }
    else { this.startWalletOp("Decrypting", () => wallet.open(d.creds, status => this.setState({ walletCodecProgress: status.percent }))); }
    return true;
  }
  ren(p, s) { return <><AppBar position="static"><Toolbar><p>{`Version >= ${version}`}</p>
    <OpenDialogButton id="Log_in" comp={Log_in} onAccept={d => this.acceptLogIn(d)}/>{D(s.wallet) ? button("Log out", () => this.setState({ wallet: U })) : null}
  </Toolbar></AppBar> 
  <ProgressDialog open={s.progressDialogOpen || false} title={`${s.walletOperation} wallet...`} progress={s.walletCodecProgress} />
  <TabbedView orientation={"vertical"} tabs={{ Admin, Bitcoin_Wallet, Impact_Fund, Network, Settings }} parentProps={{ mode: p.mode, investor: p.investor, wallets: s.wallets, dark: p.dark }}/></>
} }

class App extends Comp { constructor(p) { super(p, { investor: U, dark: darkMode }); this.state.theme = this.createTheme(); } 
  createTheme() { let s = this.state;
    A(document.body.style, { color: getMainColor(true, s.dark), backgroundColor: getMainColor(false, s.dark) });
    return createMuiTheme({ palette: { type: s.dark ? 'dark' : 'light' } }) ;
  }
  ren(p, s) { let mode = { dev: s.dev, admin: s.admin };
    return <ThemeProvider theme={s.theme}>{testMode ? <>{tabulize(1/3, [[
      <Selector options={["Admin mode", "User mode"]} onChanged={i => this.setState({ admin: i === 0 })}/>,
      <Selector options={["Developer view", "Production preview"]} onChanged={i => this.setState({ dev: i === 0 })}/>,
      <Selector options={["Default", "Dark", "Light"]} onChanged={i => this.setState({ dark: (i === 0) ? darkMode : (i === 1) }, () => this.setState({ theme: this.createTheme() }))}/>
    ]])}
    <InvestorList caption={"Choose an investor to simulate the UI"} onChangedSelectedInvestor={investor => this.setState({ investor })} mode={mode}/></> : null}
  <p>Future UI (work in progress) below this line.  Numbers shown may be inaccurate or entirely incorrect due to the development process being in progress.</p><hr/>
  <MainView investor={s.investor} mode={mode} wallet={s.wallet} dark={s.dark}/></ThemeProvider> } 
} 

ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();