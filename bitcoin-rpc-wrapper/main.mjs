import express from "express"; import bodyParser from "body-parser"; //import fetch from "node-fetch";
import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
import * as bip32 from 'bip32';
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js';
import bs58check from 'bs58check'; 
import { D, E, F, K, L, S, V, oA, oO, oF, singleKeyObject } from './tools.mjs'; 
import mariadb from  'mariadb';
dotenv.config(); const cfg = process.env;  

const verbose = true; 
let LOG = d => verbose ? L(d) : d; 

// DB Init
const pool = mariadb.createPool({ host: cfg.DB_HOST, user: cfg.DB_USER, password: cfg.DB_PWD, connectionLimit: 5 });
let objGenesis = [ "USE transfers",
  "CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, hash VARBINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
  "CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(32), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v VARBINARY(21), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS transfer (id INT PRIMARY KEY AUTO_INCREMENT, idToAddress INT, idBlock INT, idTransaction INT, value VARBINARY(16), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction))",
]
 
const url = `http://${cfg.rpcuser}:${cfg.rpcpassword}@127.0.0.1:8332/`;
const headers = { "content-type": "text/plain;" };

LOG({url});

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

(async () => { let conn = await pool.getConnection(); LOG('DB connection opened.') // Create db
  try {
    for (let x of objGenesis) await conn.query(LOG(x));
    L(`DB initialized.`);
    // Block background scan;
    let blockCount = await rpc("getblockcount", []);
    let blockHash = await rpc("getblockhash", [blockCount]);
    LOG({blockCount, blockHash}); 
    for (let height = blockCount; height > 0; height--) { L(`[${height}]`);
      let htb = h => Buffer.from(h, "hex");
      let binBlockHash = htb(blockHash);
      let r = await conn.query("SELECT * FROM block WHERE height = ? AND hash = ?", [height, (binBlockHash)]); 
//      L(`processed = ${oO(r[0]).processed}`)
      let idBlock = (r.length === 0) ? oO(await conn.query("INSERT INTO block (height, hash, processed) VALUES (?, ?, ?)", [height, (binBlockHash), false])).insertId : r[0].id; 
      let coin = (new BigNumber(10)).pow(18);
      if (D(idBlock) && !(oO(r[0]).processed === 1)) {
        let block = await rpc("getblock", [blockHash]);
        for (let txHash of block.tx) { //LOG({txHash});
          let tx = await rpc("decoderawtransaction", [await rpc("getrawtransaction", [txHash])]);
          let binTxid = htb(tx.txid);
          let rTx = await conn.query("SELECT * FROM transaction WHERE v = ?", [(binTxid)]);
          let idTransaction = (rTx.length === 0) ? oO(await conn.query("INSERT INTO transaction (v) VALUES (?)", [(binTxid)])).insertId : rTx[0].id;
          if (D(idTransaction)) {
            for (let vout of oA(tx.vout)) { let spk = vout.scriptPubKey;
              if (D(spk)) {
                for (let toAddress of oA(spk.addresses)) {
                  if (toAddress[0] === "1") {
                    let binToAddress = bs58check.decode(toAddress);
                    let rToAddress = await conn.query("SELECT * FROM address WHERE v = ?", [binToAddress]);
                    let idToAddress = (rToAddress.length === 0) ? oO(await conn.query("INSERT INTO address (v) VALUES (?)", [binToAddress])).insertId : rToAddress[0].id;
                    if (D(idToAddress)) {
                      let rTransfer = await conn.query("SELECT * FROM transfer WHERE idToAddress = ? AND idBlock = ? AND idTransaction = ?", [idToAddress, idBlock, idTransaction]); 
                      let value = (new BigNumber(new BigNumber(vout.value).multipliedBy(coin).toFixed())).toString(16);
                      let idTransfer = (rTransfer.length === 0) ? oO(await conn.query("INSERT INTO transfer (idToAddress, idBlock, idTransaction, value) VALUES (?, ?, ?, ?)", [idToAddress, idBlock, idTransaction, htb(value)])).insertId : rTransfer[0].id;
                     // L(`tx ${tx.txid}: ${value} to ${toAddress} (${toAddress.length}) --> ${bs58check.decode(toAddress).toString('hex')} (${bs58check.decode(toAddress).length})`)
                    }
                  }
                }
              }
            }
          }
        }
        let updateR = await conn.query("UPDATE block SET processed = 1 WHERE id = ?", [idBlock]);
        L(`updateR = ${S(updateR)}`)
      }
    }
  } finally { if (conn) conn.release(); }
})();

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

app.post(`/getvaluesfordeposittxs/`, (r, a) => { let [txHashes, depositAddresses] = req.body && req.body.params;

});

(p => app.listen(p, () => L(`Server running on port ${p}`)))(cfg.port = cfg.port || 4444)