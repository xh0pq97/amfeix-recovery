import { BN }  from './bignumber'; 
import { D, U } from '../common/tools.mjs';
let coin = BN(10).pow(18);

let satoshiToBTCString = s => D(s) ? s.div(coin).toString() : U; 
let btcToString = s => s.toString(); 
let satoshiToBTCFloat = s => parseFloat(satoshiToBTCString(s));

export { btcToString, satoshiToBTCString, satoshiToBTCFloat }