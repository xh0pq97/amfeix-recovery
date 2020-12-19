/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
import React from 'react';
import { A, S, V, oA, oO } from '../common/tools.mjs';
import { amfeixAddressLists, btcRpcUrl, btcFields, data, ethBasicFields } from '../core/data';
// eslint-disable-next-line
import { button, genHeaders, commonDataTypes, Selector, Comp, TabbedView, List, captionMap, tabulize } from './components';
//import { genHeaders } from './investor';

class Bitcoin_P2P_Network extends Comp {
  componentDidMount() { btcFields.forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return tabulize(1/3, [
    [tabulize(1/3, [["RPC url", btcRpcUrl]])], 
    [<List data={(btcFields.map(name => ({ name, value: S(oO(s[name]).result) })))} />], 
    [button("Refresh", data.updateConstants['btc'])]
  ]); }
} 

class Ethereum_P2P_Network extends Comp {
  componentDidMount() { amfeixAddressLists.concat(ethBasicFields).concat(["ethRPCUrl"]).forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) {
    return tabulize(2/3, [
      [tabulize(1/3, [["RPC url", s.ethRPCUrl]])],
      [<List data={ethBasicFields.map(name => ({ name, value: S(oO(s[name])) }))} />],
      [button("Refresh", data.updateConstants['eth'])],
      [tabulize(1/3, [amfeixAddressLists.map(k => {
        let h = genHeaders(s[k]);
        A(oO(h.data), { caption: "Address", displayFunc: commonDataTypes.btcAddress.displayFunc });
        return tabulize(1/3, [[<List caption={captionMap[k]} data={(oA(s[k]))} headers={V(h)} />], [button("Refresh", () => data.updateFixedLengthArray(k))]]);
      })])]
    ]);
  }
}

export class Network extends Comp { ren(p, s) { return <TabbedView tabs={({ Bitcoin_P2P_Network, Ethereum_P2P_Network })} />; } }
