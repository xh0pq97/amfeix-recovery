import { BigNumber } from 'bignumber.js'

let ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

BigNumber.config({ ALPHABET }); //DECIMAL_PLACES: 20 });

let BN = (v, b) => new BigNumber(v ,b);
//let bnClone = d => BigNumber.clone(d);

export { BN, ALPHABET }