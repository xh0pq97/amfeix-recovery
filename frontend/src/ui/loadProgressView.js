import React from 'react';
// eslint-disable-next-line
import { D, E, L, S, U, oO } from '../tools';
import { data } from '../core/data';
import { tabulize, Comp } from './components'; 
import { LinearProgress } from '@material-ui/core' 

export class Load_Progress extends Comp {
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

  ren(p, s) { return <div>{tabulize(1/2, E((oO(s.loadProgress))).map(([key, data]) => [key, 
    D(data.index) ? tabulize(1/7, [[`${data.index} / ${D(data.length) ? data.length : '?'}`], 
         [<LinearProgress variant={D(data.length) ? "determinate" : U} value={D(data.length) ? ((100*data.index)/data.length) : U} />]])
    : `${S(data)} ms`
  ]))}</div>; }
}
