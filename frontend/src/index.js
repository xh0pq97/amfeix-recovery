import React from 'react'; import ReactDOM from 'react-dom';
import Highcharts from 'highcharts'; import HighchartsReact from 'highcharts-react-official';
import * as serviceWorker from './serviceWorker';
import { D, E, F, K, L, S, V, oA, oO, oF, singleKeyObject } from './tools'; 
import { amfeixFeeFields, ethBasicFields, data } from './data';

let formatDate = date => { let fmt = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
  let d = F(E(fmt).map(([k, v]) => [k, new Intl.DateTimeFormat('en', singleKeyObject(k, v)).format(date)])); 
  return `${d.month} ${d.day}, ${d.year} @ ${d.hour}:${d.minute}:${d.second}`;
}, formatTimestamp = timestamp => formatDate(new Date(1000*timestamp));

let captionMap = { timestamp: "Time", txId: "Transaction ID", deposits: "Deposits", withdrawals: "Withdrawals", withdrawalRequests: "Withdrawal Requests", 
 fundDepositAddresses: "Fund deposit addresses", feeAddresses: "Fee Addresses", _: "" };
let displayFunctions = { timestamp: formatTimestamp };

class Component extends React.Component { constructor(p) { super(p); this.state = {}; }  
  render() { return this.ren(this.props, this.state); } 
  initRefs(spacedOutRefString) { this.fers = F(spacedOutRefString.split(" ").map(k => [k, React.createRef()])); }
  componentWillUnmount() { this.unmounted = true; }
  setStateIfMounted(s) { if (!this.unmounted) this.setState(s); return !this.unmounted; }
}

class Selector extends Component {
  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) { let z = (a, b) => s => (s ? a : b), y = (a, b) => i => z(a, b)(i === s.selectedIx);
    let style = i => ({ backgroundColor: y("#AEC", "#000")(i), color: y("#000", "#FFF")(i) });
    let elemF = (x, k) => z(<tr key={k}><td>{x}</td></tr>, <td key={k}>{x}</td>)(p.vertical), wrapF = x => z(x, <tr>{x}</tr>)(p.vertical);
    return <table><tbody>{wrapF(oA(p.options).map((x, i) => elemF(<div style={style((i))} onClick={() => this.setSelectedIx(i)}>{x}</div>, i)))}</tbody></table>
  }
}

class List extends Component {
//  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) { return <table style={{height: "100%", overflow: "scroll"}}><thead><tr>{oA(p.headers).map((x, i) => <td key={i}>{captionMap[x] || x}</td>)}</tr></thead>
    <tbody style={{overflow: "scroll"}}>{oA(p.data).map((d, i) => <tr key={i}>{oA(p.headers).map((x, j) => <td key={j}>{(displayFunctions[x] || (e => e))(d[x], d)}</td>)}</tr>)}</tbody></table>
  }
}  

class TabView extends Component {
  constructor(p) { super(p); this.initRefs("selector"); }
  setSelectedTabIx(i) { this.fers.selector.current.setSelectedIx(i); }
  ren(p, s) { return <table><thead><tr><th><Selector ref={this.fers.selector} options={p.tabs.map(x => x.title)} onChanged={i => this.setState({ selectedTabIx: i })}/></th></tr></thead>
    <tbody><tr><td>{p.tabs.map((x, j) => <div key={j} style={{ display: (j === s.selectedTabIx) ? undefined : "none" }}>{x.control}</div>)}</td></tr></tbody></table> 
  }
}

class TabbedView extends Component { constructor(p) { super(p); this.initRefs("tabControl"); } 
  componentDidMount() { this.fers.tabControl.current.setSelectedTabIx(0); }
  ren(p, s) { return <TabView ref={this.fers.tabControl} tabs={p.tabs.map(([title, control]) => ({title, control}))} /> }
}

class AdminView extends Component { 
  ren(p, s) { return <TabbedView tabs={[
    ["Investors", <Selector options={oA(s.investors).slice(0, 25)} vertical={true} />],
    ["Set Contract Data"], 
    ["Set AUM"], 
    ["Set new investor"], 
    ["Remove investor"], 
    ["Validate deposits"], 
    ["Validate withdrawals"] 
  ]} /> }
}

class BitcoinWallet extends Component {
  ren(p, s) { return <TabbedView tabs={[["History"], ["Invest"], ["Withdraw"]]} /> }
}

class FundView extends Component {
  componentDidMount() { ethBasicFields.concat(["dailyChange", "timeData"]).map(k => data.addObserver(k, d => this.setStateIfMounted(singleKeyObject(k, d)))); }

  ren(p, s) { let changePercentage = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : '';
    return  <table><tbody>
    <tr><td><div>{`Daily Change: ${changePercentage(s.dailyChange)}`}</div></td><td><div>{`AUM: ${parseInt(s.aum) / Math.pow(10, s.decimals)} BTC`}</div></td><td><div>{`BTC Price: ${s.btcPrice}`}</div></td></tr>  
    <tr><td colSpan={3}><HighchartsReact highcharts={Highcharts} options={{ title: { text: 'Fund Index' }, rangeSelector: {selected: 1}, navigator: {enabled: !0}, credits: {enabled: !1},
      plotOptions: { areaspline: { fillColor: "rgba(124, 181, 236, 0.2)" } },
      yAxis: { labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + " %"; } } },
      series: [ { name: "ROI", type: "areaspline", tooltip: { valueSuffix: " %" }, color: "#000", data: s.timeData ? s.timeData.map(([t, d]) => [new Date(1000*t), d]) : [] }]
    }} /></td></tr>
    <tr><td colSpan={3}><div>{`ROI: ${changePercentage(s.roi)}`}</div></td></tr> 
    </tbody></table>
  }
}

class InvestorView extends Component {
  updateInvestor(investor) { let fields = "deposits withdrawals withdrawalRequests bitcoinTxs".split(" ");
    if (investor) {
      fields.forEach(k => data.addObserver(`investorData.${this.props.investor}.${k}`, (d, ctxInv) => (investor === ctxInv) && this.setStateIfMounted(L(singleKeyObject(k, d))), investor)); 
      data.retrieveInvestorData(investor);
    } else this.setState(F(fields.map(f => [f, false])));
  }

  componentDidMount() { this.updateInvestor(this.props.investor); }
  componentDidUpdate(prevP) { let investor = this.props.investor; if (prevP.investor !== investor) this.updateInvestor(investor); }

  ren(p, s) { let txMap = oO(s.bitcoinTxs);
    let transactionList = d => <List headers={["timestamp", "txId", "value", "_"]} data={oA(d).map(({timestamp, txId}) => ({timestamp, txId, value: txMap[txId] || "?", x: "TODO"}))} />
    return <table><tbody> 
      <tr><td><div>Investment Value: TODO</div></td></tr>
      <tr><td colSpan={3}><TabbedView tabs={["deposits", "withdrawals", "withdrawalRequests"].map(k => ([`${captionMap[k]} ${s[k] ? `(${s[k].length})` : ''}`, transactionList(s[k])]))} /></td></tr>
    </tbody></table>
  }
}

let btcMethods = "blockcount connectioncount difficulty blockchaininfo".split(" ").map(v => `get${v}`);
class BitcoinP2PNet extends Component {
  ren(p, s) { return <table><tbody>{(E(oO(s.data))).map(([k, v], i) => <tr key={i}><td>{`${k}: ${S(v)}`}</td></tr>)}</tbody></table> }
}

class EthereumP2PNet extends Component {
  ren(p, s) { return <div /> }
}

let amfeixAddressLists = ["fundDepositAddresses", "feeAddresses"];
class EthereumContract extends Component {
  componentDidMount() { amfeixAddressLists.concat(amfeixFeeFields).forEach(k => data.addObserver(k, d => this.setStateIfMounted((singleKeyObject(k, d))))); }
  ren(p, s) { return <table><tbody>
      <tr><td colSpan={2}><table><tbody><tr><td><div>{`Fee 1: ${s.fee1}`}</div></td><td><div>{`Fee 2: ${s.fee2}`}</div></td><td><div>{`Fee 3: ${s.fee3}`}</div></td></tr></tbody></table></td></tr>
      <tr>{amfeixAddressLists.map((k, i) => <td key={i}><p>{k}</p><List headers={["address"]} data={oA(s[k]).map(address => ({address}))} /></td>)}</tr>
    </tbody></table> }
}

class MainView extends Component {
  ren(p, s) { return <TabbedView tabs={[["Investment", <InvestorView investor={p.investor} /> ], ["FundView", <FundView /> ], ["BitcoinWallet", <BitcoinWallet />],
    ["BitcoinP2PNet", <BitcoinP2PNet />], ["EthereumP2PNet", <EthereumP2PNet />], ["EthereumContract", <EthereumContract />], ["Admin", <AdminView />]
  ]}/> }
}

class App extends Component { constructor(p) { super(p); }
  componentDidMount() { data.addObserver("investors", investors => this.setStateIfMounted({ investors })); }

  ren(p, s) { let investorViewLimit = 33;
    return <><table><tbody><tr>
      <td style={{width: "20%", verticalAlign: "top"}}><p>{`Investors (${investorViewLimit > 0 ? `first ${investorViewLimit}` : S(oA(s.investors.length))})`}</p>
        <Selector options={oA(s.investors).slice(0, investorViewLimit)} onChanged={i => this.setState({ investor: oA(s.investors)[i]})} vertical={true}/>
      </td>
      <td><MainView investor={s.investor} /></td>
    </tr></tbody></table></>
  }
} 

ReactDOM.render(<React.StrictMode><App /></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();

/* 


        var ob13 = {
          chart: {zoomType: "x"},
          rangeSelector: {selected: 1},
          title: {text: "INVESTMENT PERFORMANCE"},
          credits: {enabled: !1},
          plotOptions: {areaspline: {fillColor: "rgba(124, 181, 236, 0.2)"}},
          yAxis: {
            labels: {
              formatter: function () {
                return this.axis.defaultLabelFormatter.call(this) + " BTC";
              },
            },
            minRange: 0.05,
          },
          series: [
            {
              name: "Investment Value",
              data: investmentData[0].map(function (e, n) {
                return [Date.parse(e), +investmentData[1][n]];
              }),
              type: "areaspline",
              tooltip: {valueSuffix: " BTC"},
              color: "#000000",
            },
          ],
          */