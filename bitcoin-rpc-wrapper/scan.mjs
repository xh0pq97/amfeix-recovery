import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
import * as bip32 from 'bip32';
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js';
import bs58check from 'bs58check'; 
import { A, D, E, F, I, K, L, P, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import mariadb from  'mariadb';
dotenv.config(); const cfg = process.env;  

const verbose = true; 
let LOG = d => verbose ? L(d) : d; 

L(`args = ${process.argv}`);

let offset = parseInt(process.argv[2]), groupSize = parseInt(process.argv[3]);
L({offset, groupSize})
// DB Init 
const pool = mariadb.createPool({ host: cfg.DB_HOST, user: cfg.DB_USER, password: cfg.DB_PWD, connectionLimit: 7 });
let objGenesis = [ "USE transfers",
  "CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, time TIMESTAMP, hash BINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
  "CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(32), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(33), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS vout (id INT PRIMARY KEY AUTO_INCREMENT, ix INT, idToAddress INT, idBlock INT, idTransaction INT, value VARBINARY(16), INDEX ix (ix), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX value (value))",
  "CREATE TABLE IF NOT EXISTS vin (id INT PRIMARY KEY AUTO_INCREMENT, idSourceTransaction INT, idTransaction INT, voutIx INT, idPubKey INT, INDEX idTransaction (idTransaction), INDEX idSourceTransaction (idSourceTransaction), INDEX voutIx (voutIx), INDEX idPubKey (idPubKey))",
  "CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(21), INDEX v (v))",
//  "CREATE TABLE IF NOT EXISTS transfer (id INT PRIMARY KEY AUTO_INCREMENT, idToAddress INT, idBlock INT, idTransaction INT, idPubKey INT, value BINARY(16), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX idPubKey (idPubKey))",
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

let select = (conn, table, obj) => conn.query(`SELECT * FROM ${table} WHERE ${K(obj).map(k => `${k} = ?`).join(" AND ")}`, V(obj));
let insertIfNotExists = async (conn, table, obj, idKeys) => { let r = await select(conn, table, P(obj, idKeys || K(obj)));
  return (r.length === 0) ? { ...obj, id: oO(await conn.query(`INSERT INTO ${table} (${K(obj).join(", ")}) VALUES (${K(obj).map(() => '?').join(", ")})`, V(obj))).insertId } : r[0]
}

let coin = (new BigNumber(10)).pow(18);

let pubKeyFromScriptSig = ss => { let asm = oS(oO(ss).asm), k = "[ALL] "; let p = asm.indexOf(k); return p >= 0 ? asm.substr(p + k.length) : U; }

let blockScan = (async (offset) => { let conn = await pool.getConnection(); //LOG('DB connection opened.') // Create db
  try {
    for (let x of objGenesis) await conn.query((x)); 
    let blockHeights = [570802, 617005];
    let blockCount = await rpc("getblockcount", []);
    for (let height = blockHeights[0] - (blockHeights[0] % groupSize) + offset; height <= blockCount; height += groupSize) if (height <= blockCount) { process.stdout.write(`[${height}]`);
      let blockHash = await rpc("getblockhash", [height]);
      let r = (await insertIfNotExists(conn, "block", { height, hash: htb(blockHash) })); 
      let idBlock = r.id;
      if (D(idBlock) && !(r.processed === 1)) { 
        let block = await rpc("getblock", [blockHash]);
        await conn.query("UPDATE block SET time = FROM_UNIXTIME(?)", [block.time]);
        for (let txHash of block.tx) { 
          let tx = await rpc("decoderawtransaction", [(await rpc("getrawtransaction", [txHash]))]);
          let idTransaction = (await insertIfNotExists(conn, "transaction", { v:  htb(tx.txid) })).id; 
          for (let ix = 0; ix < tx.vin.length; ++ix) { let vin = tx.vin[ix];
            let pubKey = pubKeyFromScriptSig(vin.scriptSig);
            pubKey = pubKey && pubKey.length === 66 ? pubKey : U; 
            let idPubKey = pubKey ? (await insertIfNotExists(conn, "pubKey", { v: htb(pubKey) })).id : U;
            let idSourceTransaction = D(vin.txid) ? (await insertIfNotExists(conn, "transaction", { v : htb(vin.txid) })).id : U;
            if (idSourceTransaction) { let srcTx = { voutIx: vin.vout, idPubKey, idTransaction, idSourceTransaction };
              await insertIfNotExists(conn, "vin", P(srcTx, K(srcTx).filter(k => D(srcTx[k]))));
            }
          }

          for (let ix = 0; ix < tx.vout.length; ++ix) { let vout = tx.vout[ix]; 
            if (D(vout.scriptPubKey)) {
              for (let toAddress of oA(vout.scriptPubKey.addresses)) {
                if ((toAddress[0] === "1") || (toAddress === "33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw")) {
                  let idToAddress = (await insertIfNotExists(conn, "address", { v: bs58check.decode(toAddress) })).id;
                  if (D(idToAddress)) {
                    let value = (new BigNumber(new BigNumber(vout.value).multipliedBy(coin).toFixed())).toString(16);
                    if (value.length % 2 === 1) value = '0' + value; 
                    await insertIfNotExists(conn, "vout", { idToAddress, idBlock, idTransaction, ix, value: htb(value) }, T("idToAddress idBlock idTransaction ix")); 
                  }
                }
              }
            }
          } 
        } 
        await conn.query("UPDATE block SET processed = 1 WHERE id = ?", [idBlock]); 
      }
    }
  } finally { if (conn) conn.release(); }
});

blockScan(offset);