import React from 'react'; import ReactDOM from 'react-dom';
import Highcharts from 'highcharts'; import HighchartsReact from 'highcharts-react-official';
import * as serviceWorker from './serviceWorker';
import { D, E, F, L, S, U, oA, oO, singleKeyObject } from './tools'; 
import { ethInterfaceUrl, btcRpcUrl, btcFields, amfeixFeeFields, ethBasicFields, data } from './data';
//import { Toolbar } from '@material-ui/core';  
//import { lighten, makeStyles } from '@material-ui/core/styles';
import { Comp, TabbedView, List, captionMap } from './components';

class InvestorView extends Comp {
  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { let investor = this.props.investor; if (prevP.investor !== investor) this.updateInvestor(investor); }
  updateInvestor(investor) { let fields = "deposits withdrawals withdrawalRequests bitcoinTxs investmentValue timeData".split(" ");
    if (investor) {
      data.addDataObserver(data.tables.eth.fundTx, { investorIx: investor.index }, fundTx => this.setStateIfMounted({ fundTx })); 

//      fields.forEach(k => data.addObserver(data.tables.eth.`${this.getInvestorKey()}.${k}`, (d, ctxInv) => (investor === ctxInv) && this.setStateIfMounted(L(singleKeyObject(k, d))), investor)); 
      //data.retrieveInvestorData(investor);
    } else this.setState(F(fields.map(f => [f, false])));
  }
  ren(p, s) { //L(`fundTx length = ${oA(s.fundTx).length}`);
    return <div style={{ display: D(p.investor) ? "block" : "none"}}><p>{`Investor ${oO(p.investor).data}`}</p><TabbedView tabs={{
    Deposits: <List data={s.fundTx}/>,
    Withdrawals: <List />,
    Withdrawal_Requests: <List />,
  }} /></div> }
}

class AdminView extends Comp { 
//  componentDidMount() { }
  ren(p, s) { return <TabbedView tabs={{ 
    Investors: <table><tbody>
      <tr><td><List data={p.investors} onChange={d => this.setState({ investorIx: d.selectedIx })} /></td></tr>
      <tr><td><InvestorView investor={oA(p.investors)[s.investorIx]} /></td></tr>
    </tbody></table>,
    Change_data: <table><tbody><tr><td></td></tr></tbody></table> 
  }} /> }
}

class BitcoinWallet extends Comp {
  ren(p, s) { return <TabbedView tabs={{History: <div/>, Invest: <div/>, Wiithdraw: <div/> }} /> }
}

let chartOpts = (title, valueSuffix, data, dataName) => ({ title: { text: title }, rangeSelector: {selected: 1}, navigator: {enabled: !0}, credits: {enabled: !1},
  chart: {zoomType: "x"},
  rangeSelector: {selected: 1},
  plotOptions: { areaspline: { fillColor: "rgba(124, 181, 236, 0.2)" } }, yAxis: { labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + valueSuffix; } } },
  series: [ { name: dataName, type: "areaspline", tooltip: { valueSuffix }, color: "#000", data }]
})

let timeDataTrafo = td => td ? td.map(([t, d]) => [new Date(1000*t), d]) : []

class FundView extends Comp {
  componentDidMount() { ethBasicFields.concat(["roi", "dailyChange", "timeData"]).map(k => data.addObserver(k, d => this.setStateIfMounted(singleKeyObject(k, d)))); }

  ren(p, s) { let changePerc = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : '';
    return <table><tbody>
      <tr><td><div>{`AUM: ${parseInt(s.aum)/Math.pow(10, s.decimals)} BTC`}</div></td><td><div>{`ROI: ${changePerc(s.roi)}`}</div></td><td><div>{`Daily Change: ${changePerc(s.dailyChange)}`}</div></td><td><div>{`BTC Price: ${s.btcPrice}`}</div></td></tr>  
      <tr><td colSpan={4}><HighchartsReact highcharts={Highcharts} options={chartOpts('Fund Index', " %", timeDataTrafo(s.timeData), "ROI")} /></td></tr> 
    </tbody></table>
  }

  ren(p, s) { let txMap = oO(s.bitcoinTxs);
    let transactionList = d => <List headers={["timestamp", "txId", "value", "_"]} data={oA(d).map(({timestamp, txId}) => ({timestamp, txId, value: txMap[txId] || "?", x: "TODO"}))} />
    return <table><tbody><tr><td><div>{`Investment Value: ${s.investmentValue}`}</div></td></tr>
      <tr><td><HighchartsReact highcharts={Highcharts} options={chartOpts('Investment Performance', " BTC", timeDataTrafo(s.timeData), "Investment")} /></td></tr>
      <tr><td><InvestorView /></td></tr>
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
  componentDidMount() { (btcFields).forEach(f => data.addObserver(`btc.${f}`, d => this.setStateIfMounted((singleKeyObject(f, d))))); }
  ren(p, s) { return <table><tbody><tr><td>RPC url:</td><td>{btcRpcUrl}</td></tr>{btcFields.map((f, i) => <tr key={i}><td>{f}</td><td>{S(oO(s[f]).result)}</td></tr>)}</tbody></table> }
}
class EthereumP2PNet extends Comp { ren(p, s) { return <table><tbody><tr><td>{`Interface url: ${ethInterfaceUrl}`}</td><td><EthereumContract /></td></tr></tbody></table> } }
class NetworkView extends Comp { ren(p, s) { return <TabbedView tabs={{Bitcoin: <BitcoinP2PNet/>, Ethereum: <EthereumP2PNet/> }} /> } }
class MainView extends Comp { 
  ren(p, s) { return <TabbedView tabs={{Admin: <AdminView investors={p.investors}/>, Bitcoin_Wallet: <BitcoinWallet/>, Impact_Fund: <FundView/>, Network: <NetworkView/> }} /> } 
}

class App extends Comp { constructor(p) { super(p); this.initRefs("mode"); }
  componentDidMount() { 
    let displayDelay = 4000, lastProgressUpdate = Date.now() - displayDelay; 
    data.addObserver("loadProgress", loadProgress => { let update = () => { lastProgressUpdate = currentProgressUpdate; return this.setStateIfMounted({ loadProgress }) };
      let currentProgressUpdate = Date.now(), deltaS = (currentProgressUpdate - lastProgressUpdate);
      if (deltaS > displayDelay) { return update(); } else {
        clearTimeout(this.loadProgressDisplayTimeout);
        this.loadProgressDisplayTimeout = setTimeout(update, displayDelay - deltaS);
        return !this.unmounted;
      }
    }); 
    data.addDataObserver(data.tables.eth.investorsAddresses, U, investorsAddresses => (this.setStateIfMounted({ investorsAddresses }))); 
//    this.fers.mode.current.setSelectedIx(0);
  }

  ren(p, s) { return <><table><tbody><tr> 
        <td style={{width: "20%", maxWidth: "20%", verticalAlign: "top"}}><p>{`Investors`}</p><List data={p.investors} /></td>
        <td><MainView investor={s.investor} investors={oA(s.investorsAddresses)} dev={s.dev} /></td>
      </tr>
      <tr><td colSpan={2}><table><tbody><tr>{E(oO(s.loadProgress)).map(([k, v], i) => <td key={i}><p>{k}</p><p>{v.msg}</p></td>)}</tr></tbody></table></td></tr>
    </tbody></table></>
  }
}
// <Selector options={oA(s.investors).slice(0, investorViewLimit)} onChanged={i => this.setState({ investor: oA(s.investors)[i]})} vertical={true}/>
// <Selector ref={this.fers.mode} options={["Development", "Original"]} onChanged={i => this.setState({ dev: i === 0 })} />
ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();