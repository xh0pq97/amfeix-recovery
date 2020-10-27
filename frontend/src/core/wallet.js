
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import keccak256 from 'keccak256';
import secp256k1 from 'secp256k1';
import { A, D, E, F, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 



import  { publicKeyConvert } from 'secp256k1';
//const createKeccakHash = require('keccak')
//const { toChecksumAddress } = require('ethereum-checksum-address') 
//const seed = bip39.mnemonicToSeedSync(mnemonic);
//const node = bip32.fromSeed(seed)
// wallet 3: gorilla endorse hat lumber  old price route put  goose sail lemon raise
// --> first btc address: 1GhpYYZdrED3BvciZ9yWrmWB5ho1FkZJbF
// Ethereum address: 0x88c2c5eff60149c011f97aabdf41fb78a9f7421b  
// Investor address: 0x75c64e396aa707472ac57deace2dc33ddd1a4a74

function getBitcoinAddress(node, network) {
  return bitcoin.payments.p2pkh({ pubkey: node.publicKey, network }).address;
}

export class Wallet {
  constructor(seedWords) { 
    seedWords = seedWords || 'gorilla endorse hat lumber old price route put goose sail lemon raise'.split(" ");
    let seed = bip39.mnemonicToSeedSync(seedWords.join(" "));
    let defaultDerivationPaths = {bitcoin: "m/44'/0'/0'", ethereum: "m/44'/60'/0'"};
    const root = bip32.fromSeed(seed);
    const coinNodes = F(E(defaultDerivationPaths).map(([k, v]) => [k, root.derivePath(v)]));
    E(coinNodes).forEach(([k, v]) => L(`coinNodes ${k} base58 = ${v.publicKey.toString('hex')}`));
//    E(coins).forEach(([k, v]) => L(`${k} pubkey = ${v.publicKey.toString('hex')} (${v.publicKey.toString('hex').length})`));
    const coinXPubKeys = F(E(coinNodes).map(([k, v]) => [k, bip32.fromPublicKey(v.publicKey, v.chainCode)]));
    E(coinXPubKeys).forEach(([k, v]) => L(`coinXPubKeys ${k} base58 = ${v.toBase58()}`));
    let getPubKey = (t, e, coin) => coinXPubKeys[coin].derive(t).derive(e).publicKey;
    let pubKeys = (F(E(coinXPubKeys).map(([k, v]) => [k, getPubKey(0, 0, k)])));

    L(S(F(E(coinNodes).map(([k, v]) => [k, L(`getPubKey = ${pubKeys[k].toString('hex')}`)]))));
    let getEthAddress = pubKey =>  keccak256(pubKey).toString('hex').slice(-40);  
    this.btcAddress = getBitcoinAddress(coinXPubKeys.bitcoin.derive(0).derive(0));
    L(`this.btcAddress = ${this.btcAddress}`);

    let toBuffer = v => { var b = Buffer.alloc(v.length); for (var i = 0; i < b.length; ++i) b[i] = v[i]; return b; }
    this.addresses = F(E(coinXPubKeys).map(([k, v]) => [k, getEthAddress(toBuffer(secp256k1.publicKeyConvert(v.derive(0).derive(0).publicKey, false).slice(1)))]));
    L(`addrs = ${S(this.addresses)}`)
    //    E(coinNodes).forEach(([k, v]) => L(`${k} chainCode = ${v.chainCode.toString('hex').slice(-40)}`));
  //  E(coinNodes).forEach(([k, v]) => L(`${k} address = ${getAddress(v)}`));
    //L(`bitcoin public derivable key = ${bip32.fromPublicKey(coinNodes.bitcoin.publicKey, coinNodes.bitcoin.chainCode).toBase58()}`)
//    L(`pubKey = ${node.publicKey}  address = ${getAddress((node))}`)
  }
}