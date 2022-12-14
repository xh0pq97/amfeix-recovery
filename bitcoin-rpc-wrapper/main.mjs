import express, { query } from "express"; import bodyParser from "body-parser"; //import fetch from "node-fetch";
import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
import { pubKeyToBtcAddress } from './pubKeyConvertor.mjs';
import bs58check from 'bs58check'; 
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js';
import { A, B, D, E, F, I, K, L, LL, P, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import { Q, select, insertIfNotExists } from './utils.mjs';
import { dbMethod } from "./utils.mjs";

dotenv.config(); const cfg = process.env;  
let BN = (v, b) => new BigNumber(v, b); 

const verbose = true;  
let LOG = d => verbose ? L(d) : d; 

L(`args = ${process.argv}`);
 
const url = `http://${cfg.rpcuser}:${cfg.rpcpassword}@127.0.0.1:8332/`; LOG({url});
const headers = { "content-type": "text/plain;" };
 
let htb = h => h && Buffer.from(h, "hex");

let getRPCData = (method, params) => ({ jsonrpc: "1.0", id: 0, method, params })
let getRPCRequestOptions = (method, params) => ({ headers, url, method: "POST", body: S(getRPCData(method, params)),
  //    mode: 'cors', // no-cors, *cors, same-origin
  //    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  //    credentials: 'same-origin', // include, *same-origin, omit   
  //    redirect: 'follow', // manual, *follow, error 
  //    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
       // body data type must match "Content-Type" header 
}) 
let rpcRequest = (method, params) => new Promise((resolve, reject) => {
  request(getRPCRequestOptions(method, params), (err, r, body) => (!err  && r.statusCode == 200) ? resolve((JSONBig.parse((body)))) : reject(LOG({ err, statusCode: oO(r).statusCode, body })));  
});
let rpc = async (method, params) => (await rpcRequest(method, params)).result;

let pubKeyFromScriptSig = ss => { let asm = oS(oO(ss).asm), k = "[ALL] "; let p = asm.indexOf(k); return p >= 0 ? asm.substr(p + k.length) : U; }

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
/*
let addCorsHeaders = ans => {
  ans.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  ans.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
}
if (false) app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
*/
//let getMethods = "getblockcount getbestblockhash getconnectioncount getdifficulty getblockchaininfo getmininginfo getpeerinfo getrawmempool".split(" ");
let getMethods = "getblockcount getconnectioncount getdifficulty getblockchaininfo".split(" ");
let postMethods = "getrawtransaction".split(" ");

let generateCall = (method) => async (req, ans) => { try { 
  ans.send(await rpcRequest(method, LOG(req.body && req.body.params))); 
} catch(e) { ans.send(e); } };

getMethods.forEach(method => app.get(`/${method}/`, generateCall(method)));
postMethods.forEach(method => app.post(`/${method}/`, generateCall(method)));


/*
  "CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, time TIMESTAMP, hash BINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
  "CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(32), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(33), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS vout (id INT PRIMARY KEY AUTO_INCREMENT, ix INT, idToAddress INT, idBlock INT, idTransaction INT, value VARBINARY(16), INDEX ix (ix), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX value (value))",
  "CREATE TABLE IF NOT EXISTS vin (id INT PRIMARY KEY AUTO_INCREMENT, idSourceTransaction INT, voutIx INT, idPubKey INT, INDEX idSourceTransaction (idSourceTransaction), INDEX voutIx (voutIx), INDEX idPubKey (idPubKey))",
  "CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(21), INDEX v (v))",
*/ 

let trimLeadingZeroes = v => { while ((v.length > 0) && (v[0] === '0')) v = v.substr(1); return v; }
let compressValue = v => htb(trimLeadingZeroes(v)).toString('base64');
let formatOutput = v => [ v.time, compressValue(v.value), v.txid.toString('base64'), v.pubKey.toString('base64'), v.voutIx ].join(" ");

let getTransfers = async (toAddress, fromPublicKey) => await dbMethod(async conn => { 
  toAddress = (toAddress.length > 1) ? toAddress : U;
  if (toAddress || (fromPublicKey.length > 1)) { 
    let binToAddress = toAddress && bs58check.decode(toAddress);
    let binFromPublicKey = (fromPublicKey.length > 1) && htb(fromPublicKey);
    L({toAddress, fromPublicKey});
    try { await conn.query("USE transfers");
      let data = [];
      try { 
        let parmConstraints = (binToAddress ? ` AND address.v = ? ` : '') + (binFromPublicKey ? ` AND pubKey.v = ? ` : '');
        let q = await conn.query(L(`SELECT UNIX_TIMESTAMP(block.time) as time, transaction.v as txid, HEX(vout.value) as value, vout.ix as voutIx, transaction.id as tIx, address.v AS address, pubKey.v AS pubKey FROM transaction, block, vout, vin, address, pubKey WHERE address.id = idToAddress AND pubKey.id = idPubKey AND transaction.id = vin.idTransaction AND transaction.id = vout.idTransaction AND block.id = idBlock ${parmConstraints} ORDER BY tIx`), L([binToAddress, binFromPublicKey].filter(I))); 
        L(`result = ${q.length}`);
        let txs = B(q, "tIx");
        for (let tx of V(txs)) {
          let ins = B(tx, "pubKey", pk => pubKeyToBtcAddress(pk.toString("hex")));
          if ((K(ins).length > 1) || (!D[ins[toAddress]])) {
            let selfDeposit = ins.reduce((p, c) => BN(c.value).plus(p), BN(0));
            let outs = B(tx, "address"); 
            for (let v of (toAddress ? outs[binToAddress] : tx)) data.push(formatOutput(v));
          }
  //        if ((K(F(tx.map(t => [t.pubKey.toString('hex'), true])))).length !== 1) { L(`Ignoring tx ${v.tIx}: Several input pubkeys`); continue; }
  //        if (K(F(tx.map(t => [t.voutIx, true]))).length !== 1) { L(`Ignoring tx ${v.tIx}: Several voutIx`); continue; } 
  //          let value = tx.reduce((p, c) => p.plus(BN(c.value, 16)), BN(0)); 
          //[ v.time, compressValue(v.value), v.txid.toString('base64'), v.pubKey.toString('base64'), v.voutIx ]);
        }
        L(`result = ${q.length} data = ${data.length}`);
      } catch(e) { return { err: `Query failed: ${S(e)}` }; }
      return { data }; 
    } catch(e) { return { err: `DB error: ${S(e)}` } } 
  }
});

let formatDeposit = v => [ (v).time, compressValue(v.value), v.txid.toString('base64'), v.fromBtcAddress ? bs58check.decode(v.fromBtcAddress).toString('base64') : U ].join(" ");
let getDeposits = async (toAddress, fromPublicKey) => await dbMethod(async conn => { if (toAddress.length <= 1) return { err: `To address required.` };
  let binToAddress = bs58check.decode(toAddress);
  L({toAddress, fromPublicKey});
  try { await conn.query("USE transfers");
    let idToAddress = oO(oA(await Q(conn, 'SELECT id FROM address WHERE address.v = ?', [binToAddress]))[0]).id;
    L({idToAddress});
    if (!D(idToAddress)) return { err: `To address '${toAddress}' not found.`}

    try {
      if (fromPublicKey.length <= 1) fromPublicKey = U;
      let fromBtcAddress = fromPublicKey && pubKeyToBtcAddress(fromPublicKey);
      let binFromPublicKey = fromPublicKey && htb(fromPublicKey);

      let data = [];
      try { 
        let txs = B(await Q(conn, L(`SELECT UNIX_TIMESTAMP(block.time) as time, transaction.v as txid, value, transaction.id as tIx FROM transaction, block, vout WHERE vout.idToAddress = ? AND transaction.id = vout.idTransaction AND block.id = transaction.idBlock`), L([idToAddress])), "tIx"); 
        for (let [tIx, tx] of E(txs)) {
          let sumValueBN = tx.reduce((p, c) => BN(c.value, 10).plus(p), BN(0));
          let vins = B(await Q(conn, (`SELECT HEX(pubKey.v) as fromPubKey FROM vin, pubKey WHERE vin.idTransaction = ? AND vin.idPubKey = pubKey.id ${fromPublicKey ? 'AND pubKey.v = ?' : ''}`), ([tIx, binFromPublicKey].filter(D))), "fromPubKey");
          if (K(vins).length === 1) { let vinFromBtcAddress = fromBtcAddress || pubKeyToBtcAddress(K(vins)[0]);
            if (vinFromBtcAddress !== toAddress) {
              let hexToBs58 = h => bs58check.encode(Buffer.from(h, 'hex'));
              let vouts = B(await Q(conn, (`SELECT HEX(address.v) as toAddress FROM vout, address WHERE vout.idTransaction = ? AND vout.idToAddress = address.id`), ([tIx])), "toAddress");
              let otherToAddresses = K(vouts).filter(a => hexToBs58(a) !== toAddress);
              if ((otherToAddresses.length <= 1) && ((otherToAddresses.length === 0) || (hexToBs58(otherToAddresses[0]) === vinFromBtcAddress))) { //L('x')
                data.push(formatDeposit(({ time: tx[0].time, value: sumValueBN.toString(16), txid: tx[0].txid, fromBtcAddress: D(fromPublicKey) ? U : vinFromBtcAddress })));
              }
            }
          }
        }
        L(`data = ${data.length}`);
      } catch(e) { return { err: `Query failed: ${S(e)}` }; }
      return { data }; 
    } catch(e) { return { err: `Invalid public key '${fromPublicKey}': ${S(e)}` } } 
  } catch(e) { return { err: `DB error: ${S(e)}` } } 
})
 

let getTransactions = async (address) => await dbMethod(async conn => { if (address.length <= 1) return { err: `Address required.` };
  let binToAddress = bs58check.decode(address);
//    L({toAddress, publicKey});
  try { await conn.query("USE transfers");
    let idToAddress = oO(oA(await Q(conn, 'SELECT id FROM address WHERE address.v = ?', [binToAddress]))[0]).id;
    L({idToAddress});
    if (!D(idToAddress)) return { err: `Address '${address}' not found.`}

    try {
////        if (publicKey.length <= 1) publicKey = U;
  ///    let fromBtcAddress = publicKey && pubKeyToBtcAddress(publicKey);
      // let binFromPublicKey = publicKey && htb(publicKey);

      try {  
        let voutTxs = await Q(conn, (`(SELECT UNIX_TIMESTAMP(block.time) as time, HEX(t.v) as txid, t.id as tIx FROM block, transaction AS t, vout WHERE block.id = t.idBlock AND vout.idToAddress = ? AND t.id = vout.idTransaction GROUP BY tIx)`),  ([idToAddress])); 
        let voutMatchesVin = 'vin.idSourceTransaction = vout.idTransaction AND vin.voutIx = vout.ix';
        let vinTxs = await Q(conn, (`SELECT t.v as txid, t.id as tIx FROM transaction AS t, vout, vin WHERE vout.idToAddress = ? AND ${voutMatchesVin} AND vin.idTransaction = t.id GROUP BY tIx`),  ([idToAddress]));
        let allTxs = K(B(voutTxs.concat(vinTxs), "tIx")), txList = `(${allTxs.join(", ")})`; 
        let vouts = B((await Q(conn, (`SELECT value, HEX(address.v) AS addr, vout.idTransaction AS tIx FROM address, vout  WHERE vout.idTransaction IN ${txList} AND vout.idToAddress = address.id`), [])), "tIx");
        let vins = B(await Q(conn, (`SELECT value, HEX(address.v) AS addr, vin.idTransaction AS tIx FROM address, vout, vin WHERE vin.idTransaction IN ${txList} AND vout.idToAddress = address.id AND ${voutMatchesVin}`), []), "tIx");

        let sumValueBN = txs => txs.reduce((p, c) => BN(c.value, 10).plus(p), BN(0));
      //   L({allTxs});
        let data = allTxs.map(tIx => { 
          let vox = B(voutTxs, "tIx")[tIx];
        //   L({tIx, vox});
        let mapTx = tx => P(tx, T("value addr"));
          let outs = oA(vouts[tIx]).map(mapTx), ins = oA(vins[tIx]).map(mapTx);
          // L({outs, ins});
          return ({ time: oA(vox)[0]?.time, txId: oA(vox)[0]?.txid, ins, outs})
        });
        L('xxx');
        return { data };
      } catch(e) { return { err: `Query failed: ${S(e)}` }; }
      return { data }; 
    } catch(e) { return { err: `Invalid public key '${fromPublicKey}': ${S(e)}` } } 
  } catch(e) { return { err: `DB error: ${S(e)}` } } 
});

let getOutTransfers = async (toAddress, fromPublicKey) => await dbMethod(async conn => { if ((toAddress.length > 1) || (fromPublicKey.length > 1)) {  
  fromPublicKey = (fromPublicKey.length > 1) ? (fromPublicKey.length > 1) : U;
  let binToAddress = (toAddress.length > 1) && bs58check.decode(toAddress);
  let binFromPublicKey = htb(fromPublicKey);
  L({toAddress, fromPublicKey});
  try { await conn.query("USE transfers");
    let fromPublicKeyId = fromPublicKey && (await conn.query(`SELECT id FROM pubKey WERE pubKey.v = ?`, [binFromPublicKey])).id;
    let fromAddress = fromPublicKey && pubKeyToBtcAddress(fromPublicKey);

    let data = [];
    try { 
      let parmConstraints = (binToAddress ? ` AND address.v = ? ` : '');
      let q = await conn.query(L(`SELECT UNIX_TIMESTAMP(block.time) as time, transaction.v as txid, HEX(vout.value) as value, vout.ix as voutIx, transaction.id as tIx, HEX(address.v) AS address, pubKey.v AS pubKey FROM transaction, block, vout, address, pubKey WHERE address.id = idToAddress AND pubKey.id = idPubKey AND transaction.id = vout.idTransaction AND block.id = idBlock ${parmConstraints} AND (SELECT COUNT(vin.id) as c FROM vin WHERE idTransaction = transaction.id AND idPubKey = ?).c = (SELECT COUNT(vin.id) as c FROM vin WHERE idTransaction = transaction.id).c ORDER BY tIx`), L([binToAddress, fromPublicKeyId].filter(x => D(x)))); 
      L(`result = ${q.length}`);
      let txs = {};
      q.forEach(transfer => { let y = txs[transfer.tIx]; if (y) { y.push(transfer); } else { txs[transfer.tIx] = [transfer]; } });
      for (let tx of V(txs)) {
        let outs = F(tx.map(x => [x.address, x]));
        if (((K(outs) === 1) && (K(outs)[0] === (toAddress))) || ((K(outs) === 2) && (K(outs).includes(toAddress) && K(outs).includes(fromAddress)))) {
          for (let v of outs[toAddress]) data.push(formatOutput(v));
        }
      }
      L(`result = ${q.length} data = ${data.length}`);
    } catch(e) { return { err: `Query failed: ${S(e)}` }; }
    return { data }; 
  } catch(e) { return { err: `DB error: ${S(e)}` } }
}})

app.get(`/getdeposits/toAddress/:toAddress/fromPublicKey/:fromPublicKey/`, async (req, a) => a.send(S(await getDeposits(L(req.params).toAddress, req.params.fromPublicKey))));
app.get(`/gettxs/address/:address/`, async (req, a) => a.send(S(await getTransactions(L(req.params).address))));
 
app.get(`/getAddressId/:toAddress/`, async (req, a) => await dbMethod(async conn => { L(`req = ${req.params}`); //addCorsHeaders(a);
  try { let binToAddress = bs58check.decode(req.params.toAddress);
    try { let r = await conn.query("USE transfers");
      try { let q = await conn.query(`SELECT  FROM address WHERE v = ?`, [binToAddress]);
        a.send(S(q));
      } catch(e) { a.send(S({ err: `Failed to open db: ${S(e)}` })) }
    } catch(e) { a.send(S({ err: `DB error: ${S(e)}` })) }
  } catch(e) { a.send(S({ err: `Invalid address: ${S(e)}` })) } 
}));

app.get(`/getDecodedTx/:hash/`, async (req, a) => { L(`req = ${req.params}`); //addCorsHeaders(a);
  a.send(S(await rpc("decoderawtransaction", [(await rpc("getrawtransaction", [req.params.hash]))]))); 
});

(p => app.listen(p, () => L(`Server running on port ${p}`)))(cfg.port = cfg.port || 4444)