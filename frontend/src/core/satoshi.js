import BN from 'bn.js'; 

let coin = (new BN(10)).pow(new BN(18));

let satoshiToBTCString = (s) => {
  let d = s.div(coin).toString(10);
  let r = s.mod(coin).toString(10);
  let q ;
  for (q = r.length - 1; q >= 0; q--) if (r[q] !== '0') { q++; break; }
  r = r.slice(0, q);
  return `${d}${(r.length > 0 ? '.' : '') + r}`;
}
let satoshiToBTCFloat = s => parseFloat(s.div(coin).toString());

export { satoshiToBTCString, satoshiToBTCFloat }