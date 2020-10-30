import express from "express"; import bodyParser from "body-parser"; //import fetch from "node-fetch";
import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
import * as bip32 from 'bip32';
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js';
import bs58check from 'bs58check'; 
import { D, E, F, K, L, S, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import mariadb from  'mariadb';
dotenv.config(); const cfg = process.env;  

const verbose = true; 
let LOG = d => verbose ? L(d) : d; 

// DB Init
let groupSize = 16;
const pool = mariadb.createPool({ host: cfg.DB_HOST, user: cfg.DB_USER, password: cfg.DB_PWD, connectionLimit: groupSize + 5 });
let objGenesis = [ "USE transfers",
  "CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, hash VARBINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
  "CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(32), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(33), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(21), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS transfer (id INT PRIMARY KEY AUTO_INCREMENT, idToAddress INT, idBlock INT, idTransaction INT, idPubKey INT, value VARBINARY(16), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX idPubKey (idPubKey))",
]
 
const url = `http://${cfg.rpcuser}:${cfg.rpcpassword}@127.0.0.1:8332/`;
const headers = { "content-type": "text/plain;" };

LOG({url});
let htb = h => Buffer.from(h, "hex");

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
//02f1b2a982dbe744305a37f9dfd69d7d7c6eeaa5c34c1aba3bd277567df5b972fb
let blockScan = (async (offset) => { let conn = await pool.getConnection(); //LOG('DB connection opened.') // Create db
  try {
    for (let x of objGenesis) await conn.query((x));
    //L(`DB initialized.`);
    // Block background scan;
    let blockHeights = [570802, 617005];
    let blockCount = await rpc("getblockcount", []);
    for (let height = blockHeights[0] - (blockHeights[0] % groupSize) + offset; height <= blockCount; height += groupSize) if (height <= blockCount) { process.stdout.write(`[${height}]`);
//    for (let height = blockCount - (blockCount % groupSize) + offset; height > 0; height -= groupSize) if (height <= blockCount) { L(`[${height}]`);
      let blockHash = await rpc("getblockhash", [height]);
      //L(`blockHash ${blockHash}`)
      let binBlockHash = htb(blockHash);
      let r = await conn.query("SELECT * FROM block WHERE height = ? AND hash = ?", [height, (binBlockHash)]); 
//      L(`processed = ${oO(r[0]).processed}`)
      let idBlock = (r.length === 0) ? oO(await conn.query("INSERT INTO block (height, hash, processed) VALUES (?, ?, ?)", [height, (binBlockHash), 0])).insertId : r[0].id; 
      let coin = (new BigNumber(10)).pow(18);
      //L(`${typeof oO(r[0]).processed}`)
      if (D(idBlock)) {//} && !(oO(r[0]).processed === 1)) {
        let block = await rpc("getblock", [blockHash]);
        for (let txHash of block.tx) { //LOG({txHash});
          let tx = await rpc("decoderawtransaction", [await rpc("getrawtransaction", [txHash])]);
          let binTxid = htb(tx.txid);
          let rTx = await conn.query("SELECT * FROM transaction WHERE v = ?", [(binTxid)]);
          let idTransaction = (rTx.length === 0) ? oO(await conn.query("INSERT INTO transaction (v) VALUES (?)", [(binTxid)])).insertId : rTx[0].id;
          if (D(idTransaction)) {
            if (tx.vin.length === 1) {
              let asm = oS(oO(tx.vin[0].scriptSig).asm);
              let k = "[ALL] ";
              let p = asm.indexOf(k);
              let pubKey = asm.substr(p + k.length);
              if (pubKey.length === 66) {
                let binPubKey = htb(pubKey);
                let rPubKey = await conn.query("SELECT * FROM pubKey WHERE v = ?", [binPubKey]);
                let idPubKey = (rPubKey.length === 0) ? oO(await conn.query("INSERT INTO pubKey (v) VALUES (?)", [(binPubKey)])).insertId : rPubKey[0].id;
                if (D(idPubKey)) {
                  for (let vout of oA(tx.vout)) { let spk = vout.scriptPubKey;
//                    if (oA(oO(spk).addresses).includes("33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw")) L(`toAddress: ${33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw}`);
                    if (D(spk)) {
                      for (let toAddress of oA(spk.addresses)) {
                        if ((toAddress[0] === "1") || (toAddress === "33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw")) {
                          let binToAddress = bs58check.decode(toAddress);
                          let rToAddress = await conn.query("SELECT * FROM address WHERE v = ?", [binToAddress]);
                          let idToAddress = (rToAddress.length === 0) ? oO(await conn.query("INSERT INTO address (v) VALUES (?)", [binToAddress])).insertId : rToAddress[0].id;
                          if (D(idToAddress)) {
                            let rTransfer = await conn.query("SELECT * FROM transfer WHERE idToAddress = ? AND idBlock = ? AND idTransaction = ? AND idPubKey = ?", [idToAddress, idBlock, idTransaction, idPubKey]); 
                            let value = (new BigNumber(new BigNumber(vout.value).multipliedBy(coin).toFixed())).toString(16);
                            let idTransfer = (rTransfer.length === 0) ? oO(await conn.query("INSERT INTO transfer (idToAddress, idBlock, idTransaction, idPubKey, value) VALUES (?, ?, ?, ?, ?)", [idToAddress, idBlock, idTransaction, idPubKey, htb(value)])).insertId : rTransfer[0].id;
                          // L(`tx ${tx.txid}: ${value} to ${toAddress} (${toAddress.length}) --> ${bs58check.decode(toAddress).toString('hex')} (${bs58check.decode(toAddress).length})`)
                          }
                        }
                      }
                    }
                  }
                } 
              }
            }
          }
        } 
//        L('Done');
  //      break;
        let updateR = await conn.query("UPDATE block SET processed = 1 WHERE id = ?", [idBlock]);
//        L(`updateR = ${S(updateR)}`)
      }
    }
  } finally { if (conn) conn.release(); }
});

for (let q = 0; q < groupSize; ++q) blockScan(q);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//let getMethods = "getblockcount getbestblockhash getconnectioncount getdifficulty getblockchaininfo getmininginfo getpeerinfo getrawmempool".split(" ");
let getMethods = "getblockcount getconnectioncount getdifficulty getblockchaininfo".split(" ");
let postMethods = "getrawtransaction".split(" ");

let generateCall = (method) => async (req, ans) => { try { ans.send(await rpcRequest(method, LOG(req.body && req.body.params))); } catch(e) { ans.send(e); } };

getMethods.forEach(method => app.get(`/${method}/`, generateCall(method)));
postMethods.forEach(method => app.post(`/${method}/`, generateCall(method)));

/*
app.get(`/getincomingtxdata/`, (req, ans) => {

});*/
async processBlockTransactions => {

}

//app.get(`/getTxValueForOutput/`, )
/*
"CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, hash VARBINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
"CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(32), INDEX v (v))",
"CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(33), INDEX v (v))",
"CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(21), INDEX v (v))",
"CREATE TABLE IF NOT EXISTS transfer (id INT PRIMARY KEY AUTO_INCREMENT, idToAddress INT, idBlock INT, idTransaction INT, idPubKey INT, value VARBINARY(16), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX idPubKey (idPubKey))",
*/
app.get(`/getdeposits/toAddress/:toAddress/`, async (req, a) => { let conn = await pool.getConnection(); 
  //let [txHashes, depositAddresses] = req.body && req.body.params;
  try { let binToAddress = bs58check.decode(req.params.toAddress);
    try { let r = await conn.query("USE transfers");
      try { let rToAddress = await conn.query("SELECT * FROM address WHERE v = ?", [binToAddress]);
        if (rToAddress.length === 0) { a.send(S({ err: "Address not found" })) } 
        else {
          let idToAddress = rToAddress[0].id;
          let q = await conn.query("SELECT transaction.v as transaction, transfer.value as value, pubKey.v as pubKey FROM transfer, pubKey, transaction WHERE idToAddress = ? AND transfer.idPubKey = pubKey.id AND transaction.id = transfer.idTransaction", [idToAddress]);
          let p = q.map(v => [v.value.toString('hex'), v.transaction.toString('hex'), v.pubKey.toString('hex')]);
          a.send(S({ params : r.params, count: p.length, data: p }))
        }
      } catch(e) { a.send(S({ err: `Failed to open db: ${S(e)}` })) }
    } catch(e) { a.send(S({ err: `DB error: ${S(e)}` })) }
  } catch(e) { a.send(S({ err: `Invalid address: ${S(e)}` })) }
});

app.get(`/getdeposits/fromPubKey/:pubKey/`, async (r, a) => { let conn = await pool.getConnection(); 
  //let [txHashes, depositAddresses] = req.body && req.body.params;
  try {
    let binPubKey = htb(r.params.pubKey);
    try {
      let r = await conn.query("USE transfers");
      let rPubKey = await conn.query("SELECT * FROM pubKey LIMIT 1");//, [binPubKey]);
//      let idPubKey = (rPubKey.length === 0) ? oO(await conn.query("INSERT INTO pubKey (v) VALUES (?)", [(binPubKey)])).insertId : rPubKey[0].id;

      //let idToAddress = (rToAddress.length === 0) ? oO(await conn.query("INSERT INTO address (v) VALUES (?)", [binToAddress])).insertId : rToAddress[0].id;
    
      a.send(S({ params : r.params, reponse: { binToAddress: rPubKey } }))
    } catch(e) { a.send(S({ err: `DB error: ${S(e)}` })) }
  } catch(e) { a.send(S({ err: `Invalid pub key: ${S(e)}` })) }
});

(p => app.listen(p, () => L(`Server running on port ${p}`)))(cfg.port = cfg.port || 4444)