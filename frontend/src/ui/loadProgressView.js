/* eslint react/jsx-key: 0 */
/* eslint react/prop-types: 0 */
import React from 'react';
// eslint-disable-next-line
import { D, E, L, S, U, oO } from '../common/tools';
import { data } from '../core/data';
import { tabulize, Comp, List } from './components'; 
import { LinearProgress } from '@material-ui/core' 

class ProgressDependentView extends Comp {
  componentDidMount() { 
    let displayDelay = 500, lastUpdate = (Date.now() - displayDelay);
    this.addSyncObserver(data, "loadProgress", newProgress => {
      let loadProgress = newProgress;
      let currentTime = Date.now(), deltaS = (currentTime - lastUpdate), update = () => { //L({currentTime});
        this.updateTimeout = false;
        displayDelay = Math.min(4000, 1.17 * displayDelay);
        lastUpdate = currentTime; 
        return !this.unmounted && this.setState({ loadProgress: { ...loadProgress } });
      }; 
      if ((deltaS >= displayDelay)) { update(); } else if (!(this.updateTimeout)) { this.updateTimeout = setTimeout(update, displayDelay - deltaS); }
    });
  }  

  isLoaded() { let d = oO(this.state.loadProgress?.progress)["Loading..."]; return D(d?.length) && (d.index === d.length); }
}

class Progress extends ProgressDependentView { 
  ren(p, s) { return tabulize(1/2, [
    [tabulize(1/2, E((oO(oO(s.loadProgress).progress))).map(([key, d]) => [key, 
    D(d.index) ? tabulize(1/7, [[`${d.index} / ${D(d.length) ? d.length : '?'}` + (D(d.length) ? ` (${Math.round(100*(d.index/d.length))}%)` : '')], 
         [<LinearProgress variant={D(d.length) ? "determinate" : U} value={D(d.length) ? ((100*d.index)/d.length) : U} />]])
    : `${S(d)} ms`
  ]))],
  [<List data={E((oO(oO(s.loadProgress).timings))).map(([key, data]) => ({ key, timing: `${S(data)} ms` }))} />]
  ]); }
}

class SimpleProgress extends ProgressDependentView { ren(p, s) { let d = oO(s?.loadProgress?.progress)["Loading..."]; 
  return !this.isLoaded() ? tabulize(1/2, [["Loading..."], [<LinearProgress variant={D(d?.length) ? "determinate" : U} value={D(d?.length) ? ((100*d.index)/d.length) : U} />]]) : null;
} }

export { Progress, ProgressDependentView, SimpleProgress }