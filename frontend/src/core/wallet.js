
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import { A, D, E, F, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 


//const seed = bip39.mnemonicToSeedSync(mnemonic);
//const node = bip32.fromSeed(seed)

export class Wallet {
  constructor(seedWords) {
    let seed = bip39.mnemonicToSeedSync(seedWords.join(" "));
    const node = bip32.fromSeed(seed);
    L(`address = ${bip32.getAddress(node)}`)
  }
}