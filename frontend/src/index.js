import React from 'react';
import ReactDOM from 'react-dom';
import Web3 from 'web3';
import HighCharts from 'highcharts';
import Exporting from 'highcharts/modules/exporting';

import amfeixCjson from './amfeixC.json'; 
import * as serviceWorker from './serviceWorker';
import { K, L, S, oA, oO, oF } from './tools';

Exporting(HighCharts);

let web3;
const ethEnabled = () => { if (window.web3) {    
    web3 = window.web3 = new Web3(window.web3.currentProvider);    
    window.ethereum.enable();    
    return true;  
  } else { return false; }
}

ethEnabled();

class Component extends React.Component { 
  constructor(p) { super(p); this.state = {}; } 
  render() { return this.ren(this.props, this.state); }
}

class Selector extends Component {
  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) {
    let onClick = i => () => this.setSelectedIx((i));
    let style = i => (sel => ({ backgroundColor: sel ? "#AEC" : "000", color: sel ? "#000" : "#FFF" }))((i === s.selectedIx));
    return <table><tbody>{oA(p.options).map((x, i) => <tr key={i} style={style(i)}><td onClick={onClick(i)}>{x}</td></tr>)}</tbody></table>
  }
}

let optionalComps = (x, comps, altComps) => <>{x ? comps : (altComps || <></>)}</>

class InvestorSelector extends Component {
  ren(p, s) { return optionalComps(p.options, <Selector options={p.options} onChanged={p.onChanged} />, <p>Loading...</p>) }
}

class Wallet extends Component { 
  componentDidUpdate(prevProps) {
    if (this.props.investor !== prevProps.investor) {

    }
  }

  ren(p, s) { return <><h2>Wallet for investor {p.investor}</h2>
  <Selector options={["Deposits", "Withdrawals"]} />
  </> }
}

class Fund extends Component {
  ren(p, s) { return <h1>Fund</h1> }
}

class InvestorData extends Component {
  ren(p, s) { return optionalComps(p.investor, <>
  <Selector options={["Bitcoin Wallet", "Impact Fund"]} />
    <Wallet investor={p.investor}/>
    <Fund />
    </>)
  }
}

class Chart extends Component {
  constructor(p) { super(p);
    this.container = React.createRef();
  } 

  componentDidUpdate() {
    this.chart = HighCharts.chart(this.props.id, { title: { text: this.props.title },   rangeSelector: {selected: 1},  navigator: {enabled: !0}, credits: {enabled: !1},
      plotOptions: {areaspline: {fillColor: "rgba(124, 181, 236, 0.2)"}},
      yAxis: { labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + " %"; } } },
      series: [ { name: "ROI", type: "areaspline", tooltip: {valueSuffix: " %"}, color: "#000000", data: this.props.data }]
    });
  }

  ren(p, s) {
    return <div ref={this.container} id={p.id}></div>
  }
}

class App extends Component {
  constructor(p) { super(p);
  } 

  componentDidMount() {
    if (web3) {
      let amfeixContractAddress = "0xb0963da9baef08711583252f5000Df44D4F56925";
      let amfeixC = new window.web3.eth.Contract(amfeixCjson.abi, amfeixContractAddress);
      L(K(amfeixC.methods));
      let getData = async () => { 
        let aum = parseInt(await amfeixC.methods.aum().call());
        let decimals = await amfeixC.methods.decimals().call();
        this.setState({ aum, decimals });
        this.setState({ btcPrice: await amfeixC.methods.btcPrice().call() });
        this.setState({ investors: await amfeixC.methods.getAllInvestors().call() });
        let timeData = await amfeixC.methods.getAll().call();
//        let l = timeData[1].length, acc = 0;
        let data = [];
        for (var x = 0, l = timeData[1].length, acc = 0; x < l; ++x) data.push((acc += parseInt(timeData[1][x]))/Math.pow(10, decimals)); 
        this.setState({ timeData: [ timeData[0], data ] });
      }
    
      getData();
    } else L("Web3 not available.")
  }

  ren(p, s) { 
    let formatAum = (aum, decimals) => (s => (s ? (s.slice(0, s.length - decimals) + '.' + s.slice(s.length - decimals)) : "Loading..."))((S(aum)))
  return <><p>{`AUM: ${formatAum(s.aum, s.decimals)} BtcPrice: ${L(s.btcPrice)}`}</p>
      <Chart id={'FundIndex'} title={'Fund Index'} data={s.timeData ? s.timeData[0].map((x, i) => [new Date(1000*x), s.timeData[1][i]]) : []} />
      <table><tbody><tr>
        <td><InvestorSelector options={s.investors} onChanged={i => { this.setState(L({ selectedInvestor: oA(s.investors)[i]}))}}/></td>
        <td style={{verticalAlign: "top"}}><InvestorData investor={s.selectedInvestor} /></td>
      </tr></tbody></table>
      <h2>Data</h2>
      <Selector options={s.timeData ? s.timeData[0].map((x, i) => `${i}: ${new Date(1000*x)} => ${s.timeData[1][i]}`) : []}/>
    </>
  }
}
//      <div><p>Investors</p><Selector options={d.allData} /></div> 

ReactDOM.render(<React.StrictMode><App /></React.StrictMode>, document.getElementById('root')); 
serviceWorker.unregister();