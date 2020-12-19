// eslint-disable-next-line
import { A, D, E, H, I, K, L, P, R, S, T, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../common/tools.mjs'; 
import { decryptWallet, getWalletRoot, getAmfeixPublicKey, btcAddressFromPubKey, pubKeyBufferToPoint, ethAddressFromPubKey, encryptSeedWords, rootFromSeed, getAmfeixPrivateKey } from '../common/crypto';
import { Persistent } from './persistent'

class Wallet extends Persistent { 
  constructor() { super("wallet", ["accounts"], { accounts: {} }); L('Creating Wallet class instance.'); }

  async openWallet(creds, wallet) {// L(`openWallet: ${S(creds)} wallet: ${S(wallet)}`)
    let w = await decryptWallet(P(wallet, T("privateKey chainCode")), creds.Password); 
    let root = getWalletRoot(w);
    let pub = getAmfeixPublicKey(root);
    return ({ privateKey: w.privateKey, chainCode: w.chainCode, publicKey: pub.toString('hex'), btcAddress: btcAddressFromPubKey(pubKeyBufferToPoint(pub)), ethAddress: ethAddressFromPubKey(pub) }); 
  }

  async add(creds, seedWords) { 
    let w = await encryptSeedWords(seedWords, creds.Password); 
    let d = await this.openWallet(creds, w); 
    let root = rootFromSeed(seedWords);
    if (root.privateKey.toString('hex') !== d.privateKey.privateKey.toString('hex')) throw R("Encryption error (private key mismatch)");
    if (root.chainCode.toString('hex') !== d.chainCode.privateKey.toString('hex')) throw R("Encryption error (chainCode mismatch)");
    this.accounts[creds.Wallet] = { name: creds.Wallet, ...w, ...P(d, T("publicKey btcAddress ethAddress")) };
    this.persist(); 
    return this.lastLogin = this.accounts[creds.Wallet];
  } 

  async getPrivateKey(creds) {
    let d = await this.openWallet(creds, this.accounts[creds.Wallet]);
    return getAmfeixPrivateKey(getWalletRoot(d)).toString('hex');
  }

  async open(creds) { 
    let d = await this.openWallet(creds, this.accounts[creds.Wallet]);
    (A(this.accounts[creds.Wallet], { name: creds.Wallet, ...P(d, T("publicKey btcAddress ethAddress")) }));
    return this.lastLogin = this.accounts[creds.Wallet]; 
  }
}

let wallet = new Wallet();

export { wallet }
//nStMSFYWGfFL5QW