import { D } from '../tools';

export let darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
export let getMainLightness = (fg, dm) => ((D(dm) ? dm : darkMode) ^ fg) ? 0 : 1;
export let getMainColor = (fg, dm) => ["#000", "#FFF"][getMainLightness(fg, dm)];
export let basePallette = dark => ({ color: getMainColor(true, dark), backgroundColor: getMainColor(false, dark) });
export let seriesColors = (i, dark) => (`#FF2170`);
