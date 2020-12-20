import { BN }  from './bignumber'; 
import { D, U } from '../common/tools';
let coin = BN(10).pow(8);

let satoshiToBTCString = s => D(s) ? s.div(coin).toString() : U; 
let btcToString = s => s.toString(); 
let satoshiToBTCFloat = s => D(s) ? s.div(coin).toNumber(s) : U;

export { btcToString, satoshiToBTCString, satoshiToBTCFloat }