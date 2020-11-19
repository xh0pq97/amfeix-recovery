import React from 'react';
// eslint-disable-next-line
import { D, E, L, S, U, oO } from '../tools';
import { data } from '../core/data';
import { tabulize, Comp, List } from './components'; 
import { LinearProgress } from '@material-ui/core' 

export class Progress extends Comp {
  componentDidMount() {
//    L("componentDidMount: LoadProgressView");
    let displayDelay = 500, lastUpdate = (Date.now() - displayDelay);
    this.addSyncObserver(data, "loadProgress", newProgress => {
      let loadProgress = newProgress;
      let currentTime = Date.now(), deltaS = (currentTime - lastUpdate), update = () => { //L({currentTime});
        this.updateTimeout = false;
        displayDelay = Math.min(4000, 1.17 * displayDelay);
        lastUpdate = currentTime; 
        return !this.unmounted && this.setState({ loadProgress: { ...loadProgress } });
      };
//      L({deltaS, displayDelay});
      if ((deltaS >= displayDelay)) { update(); } else if (!(this.updateTimeout)) { this.updateTimeout = setTimeout(update, displayDelay - deltaS); }
    });
  } 

  ren(p, s) { return tabulize(1/2, [
    [tabulize(1/2, E((oO(oO(s.loadProgress).progress))).map(([key, data]) => [key, 
    D(data.index) ? tabulize(1/7, [[`${data.index} / ${D(data.length) ? data.length : '?'}`], 
         [<LinearProgress variant={D(data.length) ? "determinate" : U} value={D(data.length) ? ((100*data.index)/data.length) : U} />]])
    : `${S(data)} ms`
  ]))],
  [<List data={E((oO(oO(s.loadProgress).timings))).map(([key, data]) => ({ key, timing: `${S(data)} ms` }))} />]
  ]); }
}
