/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
// eslint-disable-next-line
import React from 'react'; //import ReactDOM from 'react-dom';
import Highcharts from 'highcharts/highstock'; import HighchartsReact from 'highcharts-react-official';
// eslint-disable-next-line
import { basePallette, getMainLightness, seriesColors, getMainColor, darkMode } from './colors';
import { ethBasicFields, data } from '../core/data';
// eslint-disable-next-line
import { ProgressDialog, OpenDialogButton, DialogWrap, Selector, ValidatableComp, Comp, TabbedView, button, tabulize, formTable } from './components'; 
// eslint-disable-next-line
import { AppBar, Toolbar, Button, Box, TextField, Paper } from '@material-ui/core';
// eslint-disable-next-line
import { A, D, H, I, L, S, T, U, oA, oF, oS, asA } from '../common/tools'; 
// eslint-disable-next-line
import { InvestorID, InvestorList, EthTxView, InvestorDependentView_Eth } from './investor';
// eslint-disable-next-line
import { satoshiToBTCFloat, satoshiToBTCString } from '../core/satoshi';

let chart = (title, valueSuffix, datas, dark) => <HighchartsReact constructorType={"stockChart"} highcharts={Highcharts} options={{ 
  rangeSelector: {selected: 1}, title: { text: title }, navigator: {enabled: true}, credits: {enabled: false}, 
  chart: { zoomType: "x", ...basePallette(dark),
   events: { load: function() { //let n = Date.now(); let x =  this.xAxis[0]; if (D(x)) { x.setExtremes((n - 30*24*60*60*1000), n); this.showResetZoom(); } } 
  } } 
}, 
  plotOptions: { areaspline: { fillColor: `hsla(240, 75%, ${100*getMainLightness(true, dark)}%, 20%)` } }, 
  yAxis: [{ labels: { formatter: function () { return this.axis.defaultLabelFormatter.call(this) + valueSuffix; } } }],  
  xAxis: { events: { aferSetExtremes: function(e) {  } }}, 
  series: datas.map((series, i) => ({ name: series.name, type: "areaspline", tooltip: { valueSuffix }, color: seriesColors(i, dark), data: series.data || [] })) 
}}/>;

let timeDataTrafo = (name, data) => ({ name, data })//: oA(data).map(([t, d]) => [t, d]) })

class FundIndexChart extends Comp { componentDidMount() { this.addSyncKeyObserver(data, "timeData");  }
  ren(p, s) { return <Box>{chart('Fund Index', " %", [timeDataTrafo("ROI", s.timeData)], p.dark)}</Box> }
}

export class Impact_Fund extends InvestorDependentView_Eth {
  componentDidMount() { super.componentDidMount(); ethBasicFields.concat(T("roi dailyChange timeData")).map(k => this.addSyncKeyObserver(data, k)); } 

  ren(p, s) { let changePerc = v => D(v) ? `${v >= 0 ? "+" : "-"}${v}%` : ''; //L(`Fundview inv = ${S(p.investor)}`);
    let iData = this.getInvestorData(); 
    let displayTrafo = { dailyChange: changePerc, aum: v => `${parseInt(v)/Math.pow(10, s.decimals)} BTC` }
    let parfs = p => p.map((e, i) => <p key={i}>{e}</p>);
    return tabulize(1/3, [p.urlParams.testMode ? [<InvestorID investor={p.investor}/>] : U,
      [tabulize(1/3, [[tabulize(1/3, [[parfs(D(iData.investmentValue)  ? [`${satoshiToBTCString(iData.investmentValue)} BTC`, `Investment Value`] : [])], [parfs([changePerc(s.roi), `ROI`])]]), <FundIndexChart dark={p.dark}/>]])],
      [tabulize(1/3, [T("dailyChange aum btcPrice").map((v, i) => `${v}: ${(displayTrafo[v] || I)(s[v])}`)])],
      [iData.valueSeries && chart('Investment Performance', " BTC", T("deposits interests withdrawals total").map(k => timeDataTrafo(k, oF(iData.valueSeries)()[k])), p.dark)],
      [<EthTxView investor={p.investor} EDeveloperMode={p.EDeveloperMode}/>]
    ].filter(D)) 
  }
}
