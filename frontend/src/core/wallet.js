
import * as bip32 from 'bip32';
import * as bip38 from 'bip38';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import keccak256 from 'keccak256';
import secp256k1 from 'secp256k1';
import { A, D, E, F, G, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 
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

let encryptPrivateKey = (privateKey, password, onProgress) => bip38.encrypt(privateKey, true, password, onProgress);
let encryptSeedWords = (seedWords, password, onProgress) => encryptPrivateKey(L(rootFromSeed(seedWords)).privateKey, password, onProgress);
let decryptWallet = (encryptedKey, password, onProgress) => bip38.decrypt(encryptedKey, password, onProgress);
//
let hexToUI8A = h => new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16))); 
let testPubKey = hexToUI8A("02f1b2a982dbe744305a37f9dfd69d7d7c6eeaa5c34c1aba3bd277567df5b972fb");
L(`ethAddressFromPubKey = ${ethAddressFromPubKey(testPubKey)}`);
//L(`K = ${K(bitcoin.networks)}`)
//L(`K = ${K(bitcoin.ECPair)}`)
L(`btcAddressFromPubKey = ${btcAddressFromPubKey(pubKeyBufferToPoint(toBuffer(testPubKey)))}`);

export class Wallet {
  constructor() {
    this.wallets = (d => d ? L(JSON.parse(d)) : { })((localStorage.getItem("wallets")));
  }
  save() { localStorage.setItem("wallets", S(this.wallets)); }
  async openWallet(creds, wallet) { 
    let ow = await decryptWallet(wallet, creds.Password);
    L({openedWallet: ow});
    let root = bip32.fromPrivateKey(ow.privateKey, pubKeyBufferToPoint(toBuffer(ow.privateKey)));
    let deriv = deriveFromNode(coinNodesFromRoot(root).bitcoin);
    return { privateKey: ow.privateKey.toString('hex'), publicKey: deriv.pubKey.toString('hex'), btcAddress: btcAddressFromPubKey(deriv.pubKey), ethAddress: ethAddressFromPubKey(deriv.pubKey) }; 
  }
  async add(creds, seedWords) { 
    let w = await encryptSeedWords(seedWords, creds.Password); 
    let d = await this.openWallet(creds, w);
//    L(`rootFromSeed(seedWords).privateKey.toString('hex') = ${rootFromSeed(seedWords).privateKey.toString('hex')}`);
  //  L(`d.toString('hex') = ${d.privateKey.toString('hex')}`);
    if (rootFromSeed(seedWords).privateKey.toString('hex') !== d.privateKey.toString('hex')) throw { err: "Encryption error" }
    this.wallets[creds.Wallet] = { encryptedKey: w, publicKey: d.publicKey, btcAddress: d.btcAddress, ethAddress: d.ethAddress };
    this.save(); 
  }
  async open(creds) { return this.openWallet(this.wallets[creds.Wallet], creds); }
}
/*
export class Wallet { 
  constructor(name, seedWords) { 
    L(`seedWords = ${S(seedWords)}`)
    seedWords = seedWords || 'gorilla endorse hat lumber old price route put goose sail lemon raise'.split(" ");
    this.mnemonic = seedWords;
    L(`seedWords++ = ${S(seedWords)}`)
    let seed = bip39.mnemonicToSeedSync(seedWords.join(" "));
    let defaultDerivationPaths = { bitcoin: "m/44'/0'/0'", ethereum: "m/44'/60'/0'" };
    const root = bip32.fromSeed(seed);
    const coinNodes = G(defaultDerivationPaths, v => root.derivePath(v));
    E(coinNodes).forEach(([k, v]) => L(`coinNodes ${k} base58 = ${v.publicKey.toString('hex')}`));
//    E(coins).forEach(([k, v]) => L(`${k} pubkey = ${v.publicKey.toString('hex')} (${v.publicKey.toString('hex').length})`));
    const coinXPubKeys = F(E(coinNodes).map(([k, v]) => [k, bip32.fromPublicKey(v.publicKey, v.chainCode)]));
    E(coinXPubKeys).forEach(([k, v]) => L(`coinXPubKeys ${k} base58 = ${v.toBase58()}`));
    let getPubKey = (t, e, coin) => coinXPubKeys[coin].derive(t).derive(e).publicKey;
    let pubKeys = G(coinXPubKeys, (v, k) => getPubKey(0, 0, k));

    let privKey = root.privateKey;
    L({privKey});
    let encryptedKey = bip38.encrypt(privKey, true, 'TestingOneTwoThree');
    L({encryptedKey});
    let decryptKey = bip38.decrypt(encryptedKey, 'TestingOneTwoThree', status => L(`percent = ${status.percent}%`)); // will print the percent every time current increases by 1000
    L({decryptKey});
// <CircularProgressWithLabel value={progress} />
    L(S(G(coinNodes, (v, k) => L(`getPubKey = ${pubKeys[k].toString('hex')}`))));
    let getEthAddress = pubKey =>  keccak256(pubKey).toString('hex').slice(-40);  
    this.bitcoinAddress = getBitcoinAddress(coinXPubKeys.bitcoin.derive(0).derive(0));
    L(`this.btcAddress = ${this.btcAddress}`);

    let addresses = G(coinXPubKeys, v => getEthAddress(toBuffer(secp256k1.publicKeyConvert(v.derive(0).derive(0).publicKey, false).slice(1))));
    L(`addrs = ${S(addresses)}`)
    this.ethereumAddress = addresses.ethereum;

//    this.bitcoinAddress = addresses.ethereum;
    //    E(coinNodes).forEach(([k, v]) => L(`${k} chainCode = ${v.chainCode.toString('hex').slice(-40)}`));
  //  E(coinNodes).forEach(([k, v]) => L(`${k} address = ${getAddress(v)}`));
    //L(`bitcoin public derivable key = ${bip32.fromPublicKey(coinNodes.bitcoin.publicKey, coinNodes.bitcoin.chainCode).toBase58()}`)
//    L(`pubKey = ${node.publicKey}  address = ${getAddress((node))}`)
  }   

  getEncryptedMnemonic() {
    var encryptedKey = '6PRVWUbkzzsbcVac2qwfssoUJAN1Xhrg6bNk8J7Nzm5H7kxEbn2Nh2ZoGg'
    var decryptedKey = bip38.decrypt(encryptedKey, 'TestingOneTwoThree', function (status) {
      console.log(status.percent) // will print the percent every time current increases by 1000
    })
  } 
} */