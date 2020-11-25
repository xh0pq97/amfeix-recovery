import { BN }  from './bignumber'; 

let coin = BN(10).pow(18);

let satoshiToBTCString = s => s.div(coin).toString(); 
let btcToString = s => s.toString(); 
let satoshiToBTCFloat = s => parseFloat(satoshiToBTCString(s));

export { btcToString, satoshiToBTCString, satoshiToBTCFloat }