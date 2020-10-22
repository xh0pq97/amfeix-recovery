import React from 'react'; import ReactDOM from 'react-dom';
import Highcharts from 'highcharts'; import HighchartsReact from 'highcharts-react-official';
import * as serviceWorker from './serviceWorker';
import { D, E, F, I, L, S, U, oA, oO, singleKeyObject } from './tools'; 
import { ethInterfaceUrl, btcRpcUrl, btcFields, amfeixFeeFields, ethBasicFields, data } from './data';
import { Box, Tab, Tabs, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter } from '@material-ui/core';
//import { Toolbar } from '@material-ui/core';  
//import { lighten, makeStyles } from '@material-ui/core/styles';
import { Selector, Comp, TabbedView, List, captionMap } from './components';

class InvestorView extends Comp {
  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { let investor = this.props.investor; if (prevP.investor !== investor) this.updateInvestor(investor); }
  updateInvestor(investor) { let fields = "deposits withdrawals withdrawalRequests bitcoinTxs investmentValue timeData".split(" ");
    if (investor) { L(`New Investor: ${S(investor)}`)
      data.addDataObserver(data.tables.eth.fundTx, { investorIx: investor.index }, fundTx => this.setStateIfMounted(L({ fundTx }))); 

//      fields.forEach(k => data.addObserver(data.tables.eth.`${this.getInvestorKey()}.${k}`, (d, ctxInv) => (investor === ctxInv) && this.setStateIfMounted(L(singleKeyObject(k, d))), investor)); 
      //data.retrieveInvestorData(investor);
    } else this.setState(F(fields.map(f => [f, false])));
  }
  ren(p, s) { //L(`fundTx length = ${oA(s.fundTx).length}`);
    return <div style={{ display: D(p.investor) ? "block" : "none" }}><p>{`Investor ${oO(p.investor).data}`}</p><TabbedView tabs={{
    Deposits: <List data={s.fundTx}/>,
    Withdrawals: <List />,
    Withdrawal_Requests: <List />,
  }} /></div> }
}

class LoadProgressView extends Comp {
  componentDidMount() {
    let displayDelay = 4000, lastUpdate = Date.now() - displayDelay; 
    data.addObserver("loadProgress", loadProgress => {
      let currentTime = Date.now(), deltaS = (currentTime - lastUpdate), update = () => { lastUpdate = currentTime; return this.setStateIfMounted({ loadProgress }) };
      if (deltaS > displayDelay) { return update(); } else {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(update, displayDelay - deltaS);
        return !this.unmounted;
      }
    }); 
  }

  ren(p, s) { return <List data={ E(oO(s.loadProgress)).map(([key, data]) => ({ key, ...data })) } /> }
}

class AdminView extends Comp { 
//  componentDidMount() { }
  ren(p, s) { return <TabbedView tabs={{ LoadProgress: <LoadProgressView />,
    Investors: <table><tbody>
      <tr><td><List data={p.investors} onChange={d => this.setState({ investor: oA(p.investors)[d.selectedIx] })} /></td></tr>
      <tr><td><InvestorView investor={s.investor} /></td></tr>
    </tbody></table>,
    Change_data: <table><tbody><tr><td></td></tr></tbody></table> 
  }} /> }
}

class BitcoinWallet extends Comp {
  ren(p, s) { return <TabbedView tabs={{History: <Box/>, Invest: <Box/>, Withdraw: <Box/> }} /> }
}

let chartOpts = (title, valueSuffix, data, dataName) => ({ title: { text: title }, rangeSelector: {selected: 1}, navigator: {enabled: !0}, credits: {enabled: !1},
  chart: {zoomType: "x"},
  rangeSelector: {selected: 1},
  plotOptions: { areaspline: { fillColor: "rgba(124, 181, 236, 0.2)" } }, yAxis: { labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + valueSuffix; } } },
  series: [ { name: dataName, type: "areaspline", tooltip: { valueSuffix }, color: "#000", data }]
})

let timeDataTrafo = td => td ? td.map(([t, d]) => [new Date(1000*t), d]) : []

class FundIndexChart extends Comp { componentDidMount() { this.addSyncObserver(data, "timeData"); }
  ren(p, s) { return <HighchartsReact highcharts={Highcharts} options={chartOpts('Fund Index', " %", timeDataTrafo(s.timeData), "ROI")} /> }
}

class FundView extends Comp {
  componentDidMount() { ethBasicFields.concat(["roi", "dailyChange", "timeData"]).map(k => this.addSyncObserver(data, k)); } 

  ren(p, s) { let changePerc = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : ''; L(`Fundview inv = ${p.investor}`)
  // let txMap = oO(s.bitcoinTxs); 
//    let transactionList = d => <List headers={["timestamp", "txId", "value", "_"]} data={oA(d).map(({timestamp, txId}) => ({timestamp, txId, value: txMap[txId] || "?", x: "TODO"}))} />
    let displayTrafo = { dailyChange: changePerc, aum: v => parseInt(v)/Math.pow(10, s.decimals) }
    return <table><tbody>
      <tr><td colSpan={3} ><table><tbody><tr><td><Box>{`Investment Value: ${s.investmentValue}`}</Box><Box>{`ROI: ${changePerc(s.roi)}`}</Box></td><td><FundIndexChart /></td></tr></tbody></table></td></tr>
      <tr>{"dailyChange aum btcPrice".split(" ").map((v, i) => <td key={i}><Box>{`${v}: ${(displayTrafo[v] || I)(s[v])}`}</Box></td>)}</tr>
      <tr><td colSpan={3}><HighchartsReact highcharts={Highcharts} options={chartOpts('Investment Performance', " BTC", timeDataTrafo(s.timeData), "Investment")} /></td></tr>
      <tr><td colSpan={3}><InvestorView investor={p.investor}/></td></tr>
    </tbody></table>
  }
}

let amfeixAddressLists = ["fundDepositAddresses", "feeAddresses"];
class EthereumContract extends Comp {
  componentDidMount() { amfeixAddressLists.concat(amfeixFeeFields).concat(["owner"]).forEach(k => data.addObserver(k, d => this.setStateIfMounted((singleKeyObject(k, L(d)))))); }
  ren(p, s) { return <table><tbody>
    <tr><td colSpan={2}><div>{`Owner: ${s.owner}`}</div></td></tr>
    <tr><td colSpan={2}><table><tbody><tr>{amfeixFeeFields.map((f, i) => <td key={i}><div>{`Fee ${i}: ${s[f]}`}</div></td>)}</tr></tbody></table></td></tr>
    <tr>{amfeixAddressLists.map((k, i) => <td key={i}><p>{captionMap[k]}</p><List headers={["address"]} data={oA(s[k]).map(address => ({address}))} /></td>)}</tr>
  </tbody></table> }
}

class BitcoinP2PNet extends Comp {
  componentDidMount() { btcFields.forEach(f => this.addSyncObserver(data, f)); }
  ren(p, s) { return <List data={btcFields.map(name => ({ name, value: S(oO(s[name]).result) })).concat([{ name: "RPC url", value: btcRpcUrl }])} /> }
}
class EthereumP2PNet extends Comp { ren(p, s) { return <table><tbody><tr><td>{`Interface url: ${ethInterfaceUrl}`}</td><td><EthereumContract /></td></tr></tbody></table> } }
class NetworkView extends Comp { ren(p, s) { return <TabbedView tabs={{Bitcoin: <BitcoinP2PNet/>, Ethereum: <EthereumP2PNet/> }} /> } }
class MainView extends Comp { 
  componentDidMount() { this.addSyncObserver(data, "investorsAddresses"); }
  ren(p, s) { return <TabbedView tabs={{Admin: <AdminView investors={s.investorsAddresses}/>, Bitcoin_Wallet: <BitcoinWallet/>, Impact_Fund: <FundView investor={p.investor}/>, Network: <NetworkView/> }} /> } 
}

class App extends Comp {  
  componentDidMount() { this.addSyncObserver(data, "investorsAddresses"); }
  ren(p, s) { let invs = oA(s.investorsAddresses).slice(0, 20).map(d => d.data); //L(`inv length = ${invs.length}`); L(`inv[0] = ${S(invs[0])}`);
    return <table><tbody><tr>
      <td style={{width: "20%", maxWidth: "20%", verticalAlign: "top"}}><Selector options={invs} onChanged={i => this.setState(L({ investor: invs[i] }))} vertical={true}/></td>
      <td><MainView investor={s.investor} /></td>
    </tr></tbody></table>
  }
}

ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();