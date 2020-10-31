import React from 'react';
// eslint-disable-next-line
import { D, E, L, S, oO } from '../tools';
import { data } from '../data';
import { Comp } from './components';

export class LoadProgressView extends Comp {
  componentDidMount() {
    //L("componentDidMount: LoadProgressView");
    let displayDelay = 500, lastUpdate = (Date.now() - displayDelay);
    this.addSyncObserver(data, "loadProgress", loadProgress => {
      let currentTime = Date.now(), deltaS = (currentTime - lastUpdate), update = loadProgress => {
        displayDelay = Math.min(4000, 1.41 * displayDelay);
        lastUpdate = (currentTime); return !this.unmounted && this.setState({ loadProgress });
      };
      if ((deltaS >= displayDelay)) { update({ ...loadProgress }); } else { clearTimeout(this.updateTimeout); this.updateTimeout = setTimeout(() => update({ ...loadProgress }), displayDelay - deltaS); }
    });
  } 

  ren(p, s) { return <div>{E((oO(s.loadProgress))).map(([key, data]) => <p key={key} style={{ display: "inline", padding: '0.1em 1em 0.1em 1em' }}>
    {D(data.index) ? `(${data.index}/${data.length} ${key})` : `${key}: ${S(data)} ms`}</p>)}
  </div>; }
}
