import React from 'react'; import ReactDOM from 'react-dom';
import Web3 from 'web3';
import Highcharts from 'highcharts'; import HighchartsReact from 'highcharts-react-official';

import amfeixCjson from './amfeixC.json'; 
import * as serviceWorker from './serviceWorker';
import { D, E, F, K, L, S, V, oA, oO, oF } from './tools'; 

let formatDate = date => { 
  let d = F(E({ year: 'numeric', month: 'short', day: '2-digit' }).map(([k, v]) => { let o = {}; o[k] = v; return [k, new Intl.DateTimeFormat('en', o).format(date)]; })); 
  return `${d.month} ${d.day}, ${d.year}`;
}, formatTimestamp = timestamp => formatDate(new Date(1000*timestamp));

let captionMap = { timestamp: "Date", txId: "Transaction ID", deposits: "Deposits", withdrawals: "Withdrawals", withdrawalRequests: "Withdrawal Requests", _: "" };
let displayFunctions = { timestamp: formatTimestamp };

const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/efc3fa619c294bc194161b66d8f3585e"));
let amfeixContractAddress = "0xb0963da9baef08711583252f5000Df44D4F56925";
let amfeixC = new web3.eth.Contract(amfeixCjson.abi, amfeixContractAddress); 

class Component extends React.Component { constructor(p) { super(p); this.state = {}; } 
  render() { return this.ren(this.props, this.state); }
}

class Selector extends Component {
  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) { let z = (a, b) => s => (s ? a : b), y = (a, b) => i => z(a, b)(i === s.selectedIx);
    let style = i => ({ backgroundColor: y("#AEC", "#000")(i), color: y("#000", "#FFF")(i) });
    let elemF = (x, k) => z(<tr key={k}><td>{x}</td></tr>, <td key={k}>{x}</td>)(p.vertical);
    let wrapF = x => z(x, <tr>{x}</tr>)(p.vertical);
    return <table><tbody>{wrapF(oA(p.options).map((x, i) => elemF(<div style={style((i))} onClick={() => this.setSelectedIx(i)}>{x}</div>, i)))}</tbody></table>
  }
}

let optionalComps = (x, comps, altComps) => <>{x ? comps : (altComps || <></>)}</> 

class List extends Component {
  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) {  
  return <table style={{height: "100%", overflow: "scroll"}}><thead><tr>{oA(p.headers).map((x, i) => <td key={i}>{captionMap[x] || x}</td>)}</tr></thead>
      <tbody style={{overflow: "scroll"}}>{oA(p.data).map((d, i) => <tr key={i}>{oA(p.headers).map((x, j) => <td key={j}>{(displayFunctions[x] || (e => e))(d[x], d)}</td>)}</tr>)}</tbody>
    </table>
  }
}  

class TabControl extends Component {
  ren(p, s) { return <table><thead><tr><th><Selector options={p.tabs.map(x => x.title)} onChanged={i => this.setState({ selectedTabIx: i })}/></th></tr></thead>
    <tbody><tr><td>{p.tabs.map((x, j) => <div key={j} style={{ display: (j === s.selectedTabIx) ? undefined : "none" }}>{x.control}</div>)}</td></tr></tbody>
  </table> }
}

class App extends Component { constructor(p) { super(p); } 
  onInvestorUpdated(investor) {
    let getWithdrawalsAndDeposits = async (investor) => {
      let getList = async (numName, mapName) => { 
        let a = n => { let r = []; for (var x = 0; x < n; ++x) r.push(0); return r; }
        return await Promise.all(a(await amfeixC.methods[numName](investor).call()).map((d, x) => amfeixC.methods[mapName](investor, S(x)).call()));
      }
      let dedup = d => V(F(d.map(e => [e.txId, e])));
      let txs = dedup(await getList("ntx", "fundTx")); 
      let deposits = txs.filter(x => x.action === "0");
      let depositsObj = F(deposits.map(d => [d.txId, d]));
      let hasDeposit = x => D(depositsObj[x.txId]);
      this.setState({ deposits, withdrawals: txs.filter(x => x.action === "1" && hasDeposit(x)) });
      this.setState({ withdrawalRequests: dedup(await getList("rtx", "reqWD")).filter(hasDeposit) });
    }

    if (investor) { getWithdrawalsAndDeposits(investor); } else this.setState({ deposits: [], withdrawals: [], withdrawalRequests: [] });
  }

  componentDidUpdate(prevProps, prevState) {// L(`did update App (this.state.investor = ${this.state.investor} ?== ${prevState.investor} prevState.investor))`)
    if (this.state.investor !== prevState.investor) this.onInvestorUpdated(this.state.investor);
  }

  componentDidMount() {
    this.onInvestorUpdated(this.props.investor);

    if (web3) {
      //L(K(amfeixC.methods));
      let getData = async () => { 
        let aum = parseInt(await amfeixC.methods.aum().call());
        let decimals = await amfeixC.methods.decimals().call();
        this.setState({ aum, decimals });
        this.setState({ btcPrice: await amfeixC.methods.btcPrice().call() });
        this.setState({ fee1: await amfeixC.methods.fee1().call() });
        this.setState({ fee2: await amfeixC.methods.fee2().call() });
        this.setState({ fee3: await amfeixC.methods.fee3().call() });
        this.setState({ investors: await amfeixC.methods.getAllInvestors().call() });
        let timeData = await amfeixC.methods.getAll().call();
//        let l = timeData[1].length, acc = 0;
        let data = [];
        let factor = Math.pow(10, decimals);
        for (var x = 0, l = timeData[1].length, acc = 100 * factor; x < l; ++x) data.push((acc += parseInt(timeData[1][x]))/factor); 
        this.setState({ timeData: [ timeData[0], data ], roi: data[data.length - 1] - 100, dailyChange: parseInt(timeData[1][data.length - 1])/factor });
      }
    
      getData();
    } else L("Web3 not available.");
  }

  ren(p, s) { 
    let transactionList = d => <List headers={["timestamp", "txId", "value", "_"]} data={oA(d).map(({timestamp, txId}) => ({timestamp, txId, value: "TODO", x: "TODO"}))} />
    return <><table><tbody><tr>
      <td style={{width: "15%", verticalAlign: "top"}}><p>Investor list (possibly truncated)</p>
        <Selector options={oA(s.investors).slice(0, 25)} onChanged={i => this.setState({ investor: oA(s.investors)[i]})} vertical={true}/>
      </td>
      <td><TabControl tabs={[
        { title: "Bitcoin Wallet", control: <TabControl tabs={[{ title: "History" }, { title: "Invest" }, { title: "Withdraw" }]} /> },
        { title: "AMFEIX Fund", control: <table><tbody>
          <tr>
            <td><div>Investment Value: TODO</div></td>
            <td colSpan={2} rowSpan={2}><HighchartsReact highcharts={Highcharts} options={{ title: { text: 'Fund Index' }, rangeSelector: {selected: 1}, navigator: {enabled: !0}, credits: {enabled: !1},
              plotOptions: { areaspline: { fillColor: "rgba(124, 181, 236, 0.2)" } },
              yAxis: { labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + " %"; } } },
              series: [ { name: "ROI", type: "areaspline", tooltip: { valueSuffix: " %" }, color: "#000000", data: s.timeData ? s.timeData[0].map((x, i) => [new Date(1000*x), s.timeData[1][i]]) : [] }]
            }} /></td>
          </tr>
          <tr><td><div>{`ROI: ${s.roi >= 0 ? "+" : "-"}${s.roi}%`}</div></td></tr>
          <tr><td colSpan={3}><div id={'Investment performance'} title={'Investment performance'} data={[]} /></td></tr>
          <tr><td><div>{`Daily Change: ${s.dailyChange}`}</div></td><td><div>{`AUM: ${s.aum / Math.pow(10, s.decimals)} BTC`}</div></td><td><div>{`BTC Price: ${s.btcPrice}`}</div></td></tr>  
          <tr><td><div>{`Fee 1: ${s.fee1}`}</div></td><td><div>{`Fee 2: ${s.fee2}`}</div></td><td><div>{`Fee 3: ${s.fee3}`}</div></td></tr>  
          <tr><td colSpan={3}><TabControl tabs={["deposits", "withdrawals", "withdrawalRequests"].map(k => ({ title: `${captionMap[k]} ${s[k] ? `(${s[k].length})` : ''}`, control: transactionList(s[k]) }))} /></td></tr>
        </tbody></table> },
        { title: "Referral", control: <div /> }
      ]}/></td>
    </tr></tbody></table></>
  }
}
//      <div><p>Investors</p><Selector options={d.allData} /></div> 

ReactDOM.render(<React.StrictMode><App /></React.StrictMode>, document.getElementById('root')); serviceWorker.unregister();

/* 

      let toObj = a => F(a.map(e => [e.txId, e]));
      let dedup = d => V(toObj(d)); // XXX: does not check if duplicates are identical -- only retains one of them with same txId 
      let txs = dedup(await getList("ntx", "fundTx")); 
      let data = {
         deposit: txs.filter(x => x.action === "0"),
         withdrawal: txs.filter(x => x.action === "1"),
         withdrawalRequest: dedup(await getList("rtx", "reqWD"))
      }
      let objs = F(E(data).map(([k, v]) => [k, toObj(v)]));
      let has = F(E(objs).map(([k, v]) => [k, x => D(v[x.txId])]));  
      this.setState({ deposits: data.deposit.map(d => ({...d, hasWithdrawalRequest: has.withdrawalRequest(d) })), 
                      withdrawalRequests: data.withdrawalRequest.filter(x => has.deposit(x) && !has.withdrawal(x)), 
                      withdrawals: data.withdrawal.filter(has.deposit) });

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