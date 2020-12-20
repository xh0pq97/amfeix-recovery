import { SyncCache } from './syncCache';
import * as crypto from './crypto';
import { F, T } from './tools';

let pubKeyConvertors = { btc: crypto.pubKeyToBtcAddress, eth: crypto.pubKeyToEthAddress };
let pubKeySyncCaches = { btc: new SyncCache(), eth: new SyncCache() };

let pubKeyCachedConvertors = F(T("btc eth").map(k => [k, pubKey => pubKeySyncCaches[k].getData(pubKey, () => pubKeyConvertors[k](pubKey))]));
let pubKeyToBtcAddress = pubKeyCachedConvertors.btc;
let pubKeyToEthAddress = pubKeyCachedConvertors.eth;

export { pubKeyToEthAddress, pubKeyToBtcAddress }
