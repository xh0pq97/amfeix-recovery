
import * as bip32 from 'bip32';
import * as bip38 from 'bip38';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import keccak256 from 'keccak256';
import secp256k1 from 'secp256k1';
import { A, D, E, F, G, H, I, K, L, S, T, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 
//import * as miscreant from "miscreant";


import  { publicKeyConvert } from 'secp256k1';
//const createKeccakHash = require('keccak')
//const { toChecksumAddress } = require('ethereum-checksum-address') 
//const seed = bip39.mnemonicToSeedSync(mnemonic);
//const node = bip32.fromSeed(seed)
// wallet 3: gorilla endorse hat lumber  old price route put  goose sail lemon raise
// --> first btc address: 1GhpYYZdrED3BvciZ9yWrmWB5ho1FkZJbF
// Ethereum address: 0x88c2c5eff60149c011f97aabdf41fb78a9f7421b  
// Investor address: 0x75c64e396aa707472ac57deace2dc33ddd1a4a74

let defaultDerivationPaths = { bitcoin: "m/44'/0'/0'", ethereum: "m/44'/60'/0'" };
//02f1b2a982dbe744305a37f9dfd69d7d7c6eeaa5c34c1aba3bd277567df5b972fb
let rootFromSeed = (seedWords) => bip32.fromSeed(bip39.mnemonicToSeedSync(seedWords.join(" ")));
let deriveFromNode = (node, t, e) => node.derive(t || 0).derive(e || 0); 
let coinNodesFromRoot = root => G(defaultDerivationPaths, v => root.derivePath(v))
let xpubsFromCoinNodes = coinNodes => G(coinNodes, v => bip32.fromPublicKey(v.publicKey, v.chainCode))

let toBuffer = v => { var b = Buffer.alloc(v.length); for (var i = 0; i < b.length; ++i) b[i] = v[i]; return b; }
let getEthAddress = pubKey =>  keccak256(pubKey).toString('hex').slice(-40);
let ethAddressFromPubKey = pubKey => getEthAddress(toBuffer(secp256k1.publicKeyConvert(pubKey, false).slice(1)));
let btcAddressFromPubKey = (pubkey, network) => bitcoin.payments.p2pkh({ pubkey, network }).address;
let pubKeyBufferToPoint = pubKeyBuffer => bitcoin.ECPair.fromPublicKey(pubKeyBuffer).publicKey;
let privKeyBufferToPoint = privKeyBuffer => bitcoin.ECPair.fromPrivateKey(privKeyBuffer).privateKey;

let encryptKey = (key, password, onProgress) => bip38.encrypt(key, true, password, onProgress);
let encryptSeedWords = (seedWords, password, onProgress) => { let root = rootFromSeed(seedWords);
  return (F(T("privateKey chainCode").map(k => [k, encryptKey(root[k], password, onProgress)])));
}
let decryptWallet = (encryptedKeys, password, onProgress) => (G(encryptedKeys, v => bip38.decrypt(v, password, onProgress)));
//let hexToUI8A = h => new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16))); 

export class Wallet {
  constructor() {
    this.wallets = (d => d ? (JSON.parse(d)) : { })((localStorage.getItem("wallets")));
  }
  save() { localStorage.setItem("wallets", S(G(this.wallets, ({ privateKey, chainCode }) => ({ privateKey, chainCode })))); }
  async openWallet(creds, wallet) { //L(`openWallet: ${S(creds)} wallet: ${S(wallet)}`)
    let ow = await decryptWallet(wallet, creds.Password); 
    let root = (bip32.fromPrivateKey(privKeyBufferToPoint(ow.privateKey.privateKey), ow.chainCode.privateKey));
    let pub = (deriveFromNode(coinNodesFromRoot(root).bitcoin)).publicKey;
    return ({ privateKey: ow.privateKey, chainCode: ow.chainCode, publicKey: pub.toString('hex'), btcAddress: btcAddressFromPubKey(pubKeyBufferToPoint(pub)), ethAddress: ethAddressFromPubKey(pub) }); 
  }
  async add(creds, seedWords) { 
    let w = await encryptSeedWords(seedWords, creds.Password); 
    let d = await this.openWallet(creds, w);
//    L(`rootFromSeed(seedWords).privateKey.toString('hex') = ${rootFromSeed(seedWords).privateKey.toString('hex')}`);
  //  L(`d.toString('hex') = ${d.privateKey.toString('hex')}`);
    let root = rootFromSeed(seedWords);
    if (root.privateKey.toString('hex') !== d.privateKey.privateKey.toString('hex')) throw { err: "Encryption error (private key mismatch)" }
    if (root.chainCode.toString('hex') !== d.chainCode.privateKey.toString('hex')) throw { err: "Encryption error (chainCode mismatch)" }
    //L(`d == ${S(d)}`)
    this.wallets[creds.Wallet] = { privateKey: w.privateKey, chainCode: w.chainCode, publicKey: d.publicKey, btcAddress: d.btcAddress, ethAddress: d.ethAddress };
    //L(`post: ${S(this.wallets)}`);
    this.save(); 
    //L(`postsave: ${S(this.wallets)}`);
  }
  async open(creds) { 
    let d = await this.openWallet(creds, this.wallets[creds.Wallet]);
    (A(this.wallets[creds.Wallet], ({ publicKey: d.publicKey, btcAddress: d.btcAddress, ethAddress: d.ethAddress })));
    return d; 
  }
}