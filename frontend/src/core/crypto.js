import * as bip32 from 'bip32';
import * as bip38 from 'bip38';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import keccak256 from 'keccak256';
import secp256k1 from 'secp256k1';
import { F, G, T } from '../tools';

let defaultDerivationPaths = { bitcoin: "m/44'/0'/0'", ethereum: "m/44'/60'/0'" };
//02f1b2a982dbe744305a37f9dfd69d7d7c6eeaa5c34c1aba3bd277567df5b972fb
let rootFromSeed = (seedWords) => bip32.fromSeed(bip39.mnemonicToSeedSync(seedWords.join(" ")));
let deriveFromNode = (node, t, e) => node.derive(t || 0).derive(e || 0);
let coinNodesFromRoot = root => G(defaultDerivationPaths, v => root.derivePath(v));
// eslint-disable-next-line
let xpubsFromCoinNodes = coinNodes => G(coinNodes, v => bip32.fromPublicKey(v.publicKey, v.chainCode));
let toBuffer = v => { var b = Buffer.alloc(v.length); for (var i = 0; i < b.length; ++i) b[i] = v[i]; return b; };
let getEthAddress = pubKey => keccak256(pubKey).toString('hex').slice(-40);
let ethAddressFromPubKey = pubKey => getEthAddress(toBuffer(secp256k1.publicKeyConvert(pubKey, false).slice(1)));
let btcAddressFromPubKey = (pubkey, network) => bitcoin.payments.p2pkh({ pubkey, network }).address;
let pubKeyBufferToPoint = pubKeyBuffer => bitcoin.ECPair.fromPublicKey(pubKeyBuffer).publicKey;
let privKeyBufferToPoint = privKeyBuffer => bitcoin.ECPair.fromPrivateKey(privKeyBuffer).privateKey;
let encryptKey = (key, password, onProgress) => bip38.encrypt(key, true, password, onProgress);
let encryptSeedWords = (seedWords, password, onProgress) => {
  let root = rootFromSeed(seedWords);
  return (F(T("privateKey chainCode").map(k => [k, encryptKey(root[k], password, onProgress)])));
};
let decryptWallet = (encryptedKeys, password, onProgress) => (G(encryptedKeys, v => bip38.decrypt(v, password, onProgress)));
let getAmfeixNode = root => (deriveFromNode(coinNodesFromRoot(root).bitcoin));
let getAmfeixPublicKey = root => getAmfeixNode(root).publicKey;
let getAmfeixPrivateKey = root => getAmfeixNode(root).privateKey;
//let hexToUI8A = h => new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16))); 
let hexOnly = s => (s.slice(0, 2) === "0x") ? s.slice(2) : s;
let pubKeyToEthAddress = (pubKeyHex, prefix) => (prefix ? "0x" : "") + ethAddressFromPubKey(pubKeyBufferToPoint(Buffer.from(hexOnly(pubKeyHex), 'hex')));
let pubKeyToBtcAddress = pubKeyHex => btcAddressFromPubKey(pubKeyBufferToPoint(Buffer.from(hexOnly(pubKeyHex), 'hex')));
let getWalletRoot = w => (bip32.fromPrivateKey(privKeyBufferToPoint(w.privateKey.privateKey), w.chainCode.privateKey));
let generateSeedWords = () => T(bip39.generateMnemonic());

export { pubKeyToEthAddress, pubKeyToBtcAddress, rootFromSeed, ethAddressFromPubKey, btcAddressFromPubKey, pubKeyBufferToPoint, encryptSeedWords, decryptWallet, getAmfeixPublicKey, getAmfeixPrivateKey, getWalletRoot };