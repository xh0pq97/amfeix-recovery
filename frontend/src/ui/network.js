import React from 'react';
import { A, S, V, oA, oO } from '../tools';
import { ethInterfaceUrl, ganacheInterfaceUrl, btcRpcUrl, btcFields, amfeixFeeFields, data } from '../data';
import { displayBtcAddress, Selector, Comp, TabbedView, List, captionMap, tabulize } from './components';
import { genHeaders } from './investor';

class Bitcoin_P2P_Network extends Comp {
  componentDidMount() { btcFields.forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) { return <List data={[{ name: "RPC url", value: btcRpcUrl }].concat(btcFields.map(name => ({ name, value: S(oO(s[name]).result) })))} />; }
}

let amfeixAddressLists = ["fundDepositAddresses", "feeAddresses"], ethFields = ["owner"].concat(amfeixFeeFields);

class Ethereum_P2P_Network extends Comp {
  componentDidMount() { amfeixAddressLists.concat(ethFields).forEach(f => this.addSyncKeyObserver(data, f)); }
  ren(p, s) {
    return tabulize(2 / 3, [
      [<List data={[{ name: "RPC url", value: <Selector options={[ethInterfaceUrl, ganacheInterfaceUrl]} /> }].concat(ethFields.map(name => ({ name, value: S(oO(s[name])) })))} />],
      [tabulize(1 / 3, [amfeixAddressLists.map(k => {
        let h = genHeaders(s[k]);
        A(oO(h.data), { caption: "Address", displayFunc: displayBtcAddress });
        return <List caption={captionMap[k]} data={(oA(s[k]))} headers={V(h)} />;
      })])]
    ]);
  }
}

export class Network extends Comp { ren(p, s) { return <TabbedView tabs={({ Bitcoin_P2P_Network, Ethereum_P2P_Network })} />; } }
