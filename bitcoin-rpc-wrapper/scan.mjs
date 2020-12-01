import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
//import * as bip32 from 'bip32';
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js';
import bs58check from 'bs58check'; 
import { A, D, E, F, I, K, L, P, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import mariadb from  'mariadb';
import Memcached from 'memcached';
import { investors } from './investorData.mjs';
dotenv.config(); const cfg = process.env;  

const verbose = true; 
let LOG = d => verbose ? L(d) : d; 

let memcached = new Memcached("localhost:11211");

const url = `http://${cfg.rpcuser}:${cfg.rpcpassword}@127.0.0.1:8332/`; LOG({url});
const headers = { "content-type": "text/plain;" };
 
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

let getDecodedTx = async txHash => await rpc("decoderawtransaction", [(await rpc("getrawtransaction", [txHash]))]);

//if (offset < 0) { L(S(memcached.settings((e, d) => L(`Memcache stats = ${S(e)} ${S(d)}`)))); process.exit(0); }
// DB Init 
const pool = mariadb.createPool({ host: cfg.DB_HOST, user: cfg.DB_USER, password: cfg.DB_PWD, connectionLimit: 7 });
let objGenesis = [ "USE transfers",
  "CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, time TIMESTAMP, hash BINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
  "CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(32), INDEX v (v))",
//  "CREATE TABLE IF NOT EXISTS investment (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(32), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(33), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS vout (id INT PRIMARY KEY AUTO_INCREMENT, ix INT, idToAddress INT, idBlock INT, idTransaction INT, value VARBINARY(16), INDEX ix (ix), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX value (value))",
  "CREATE TABLE IF NOT EXISTS vin (id INT PRIMARY KEY AUTO_INCREMENT, idSourceTransaction INT, idTransaction INT, voutIx INT, idPubKey INT, INDEX idTransaction (idTransaction), INDEX idSourceTransaction (idSourceTransaction), INDEX voutIx (voutIx), INDEX idPubKey (idPubKey))",
  "CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(21), INDEX v (v))",
//  "CREATE TABLE IF NOT EXISTS transfer (id INT PRIMARY KEY AUTO_INCREMENT, idToAddress INT, idBlock INT, idTransaction INT, idPubKey INT, value BINARY(16), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX idPubKey (idPubKey))",
]
 
let htb = h => Buffer.from(h, "hex");

let select = (conn, table, obj) => conn.query(`SELECT * FROM ${table} WHERE ${K(obj).map(k => `${k} = ?`).join(" AND ")}`, V(obj));
let insertIfNotExists = async (conn, table, obj, idKeys) => { let key = P(obj, idKeys || K(obj));
  let keyString = (`${table}:${V(key).map(x => Buffer.isBuffer(x) ? x.toString('base64') : x).join("|")}`);
  let r; 
  memcached.get(keyString, (e, d) => { if (e) throw new Error(e); if (D(d)) { r = JSON.parse(d); } });
  if (!D(r)) {
    r = (await select(conn, table,key));
    if (r.length > 0) memcached.set(keyString, S(r[0]), 60*60, (e) => { if (e) throw new Error(e); } );
  } else { return r; }
  return (r.length === 0) ? { ...obj, id: oO(await conn.query(`INSERT INTO ${table} (${K(obj).join(", ")}) VALUES (${K(obj).map(() => '?').join(", ")})`, V(obj))).insertId } : r[0]
}

let coin = (new BigNumber(10)).pow(18);

let pubKeyFromScriptSig = ss => { let asm = oS(oO(ss).asm), k = "[ALL] "; let p = asm.indexOf(k); return p >= 0 ? asm.substr(p + k.length) : U; }

let fundDepositAddresses = ["33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw"];
let fundDepositPubKeys = ["03f1da9523bf0936bfe1fed5cd34921e94a78cac1ea4cfd36b716e440fb8de90aa"];

// Deposits --> Transfer to inv btc address 
// Withdrawals --> Transfer from inv pub key
// Returns --> Transfer from fund deposit pub key to inv btc address
// --> Scan for transfers 
// * to inv btc address 
// * from inv pub key

let watchedToAddresses = fundDepositAddresses.concat(investors.map(x => x.btcAddress));
let watchedFromPubKeys = fundDepositPubKeys.concat(investors.map(x => x.pubKey));
let watchedToAddressesMap = F(watchedToAddresses.map(k => [k, true]));
let watchedFromPubKeysMap = F(watchedFromPubKeys.map(k => [k, true]));

let processTransaction = async (tx, idBlock, conn) => {
  let idTransaction;
  let getIdTransaction = async () => (D(idTransaction) ? idTransaction : (idTransaction = (await insertIfNotExists(conn, "transaction", { v:  htb(tx.txid) })).id)); 

  let foundWatchedToAddress = false;
  for (let ix = 0; ix < tx.vout.length; ++ix) { let vout = tx.vout[ix]; process.stdout.write(':');
//    if (tx.txid.toLowerCase() === "934db754e9133c29dcdca8e4061f8141973152ec39f624391b44b7a0e1a1f1aa") L('found 934db754e9133c29dcdca8e4061f8141973152ec39f624391b44b7a0e1a1f1aa');
    let LL = (tx.txid.toLowerCase() === "934db754e9133c29dcdca8e4061f8141973152ec39f624391b44b7a0e1a1f1aa") ? L : I;
    if (D(vout.scriptPubKey)) for (let toAddress of oA(vout.scriptPubKey.addresses)) {
      if (watchedToAddressesMap[toAddress]) { foundWatchedToAddress = true;
        let idToAddress = (await insertIfNotExists(conn, "address", { v: bs58check.decode(LL(toAddress)) })).id;
        if (D(idToAddress)) {
          let value = (new BigNumber(new BigNumber(vout.value).multipliedBy(coin).toFixed())).toString(16);
          if (value.length % 2 === 1) value = '0' + value; 
          await insertIfNotExists(conn, "vout", LL({ idToAddress, idBlock, idTransaction: await getIdTransaction(), ix, value: htb(value) }), T("idToAddress idBlock idTransaction ix")); 
        }
      }
    }
  } 

  let foundWatchedFromPubKey = false;
  if (foundWatchedToAddress) L({foundWatchedToAddress});
  for (let ix = 0; ix < tx.vin.length; ++ix) { let vin = tx.vin[ix];
    let pubKey = pubKeyFromScriptSig(vin.scriptSig);
    vin.pubKey = pubKey && pubKey.length === 66 ? pubKey : U; 
    if (watchedFromPubKeysMap[vin.pubKey]) foundWatchedFromPubKey = true;
  }
  if (foundWatchedFromPubKey || foundWatchedToAddress) for (let ix = 0; ix < tx.vin.length; ++ix) { let vin = tx.vin[ix];
    let idSourceTransaction = D(vin.txid) ? (await insertIfNotExists(conn, "transaction", { v : htb(vin.txid) })).id : U;
    let idPubKey = vin.pubKey ? (await insertIfNotExists(conn, "pubKey", { v: htb(vin.pubKey) })).id : U;
    if (idSourceTransaction) { let srcTx = { voutIx: vin.vout, idPubKey, idTransaction: await getIdTransaction(), idSourceTransaction };
      await insertIfNotExists(conn, "vin", P(srcTx, K(srcTx).filter(k => D(srcTx[k]))));
    }
  }
}

let processBlockAtHeight = async (height, conn) => { process.stdout.write(`[${height}]`);
  let blockHash = await rpc("getblockhash", [height]);
  let r = (await insertIfNotExists(conn, "block", { height, hash: htb(blockHash) }));
  let idBlock = r.id;
  if (D(idBlock) && !(r.processed === 1)) { let block = await rpc("getblock", [blockHash]);
    await conn.query("UPDATE block SET time = FROM_UNIXTIME(?) WHERE id = ?", [block.time, idBlock]);
    for (let txHash of block.tx) await processTransaction(await rpc("decoderawtransaction", [(await rpc("getrawtransaction", [txHash]))]), idBlock, conn);
    await conn.query("UPDATE block SET processed = 1 WHERE id = ?", [idBlock]);
  }
}

let blockScan = (async (offset, groupSize) => { let conn = await pool.getConnection(); //LOG('DB connection opened.') // Create db
  L({offset, groupSize});
  try {
    for (let x of objGenesis) await conn.query((x)); 
    let blockHeights = [570802, 617005]; // 570650
    let firstBlock = 570650, blockCount = await rpc("getblockcount", []);
//    for (let height = blockHeights[0] - (blockHeights[0] % groupSize) + offset; height <= blockCount; height += groupSize) if (height <= blockCount) { process.stdout.write(`[${height}]`);
    for (let height = firstBlock - (blockCount % groupSize) - groupSize + offset; height >= 0; height += groupSize) if (height >= 0) await processBlockAtHeight(height, conn);
  } finally { if (conn) conn.release(); }
});

let blockTimeScan = (async (offset, groupSize) => { let conn = await pool.getConnection(); //LOG('DB connection opened.') // Create db
  L({blockTimeScan: true, offset, groupSize});
  try {
    for (let x of objGenesis) await conn.query((x)); 
    let blockHeights = [570802, 617005]; // 570650
    let firstBlock = 570650, blockCount = await rpc("getblockcount", []);
//    for (let height = blockHeights[0] - (blockHeights[0] % groupSize) + offset; height <= blockCount; height += groupSize) if (height <= blockCount) { process.stdout.write(`[${height}]`);
    for (let height = firstBlock ; height < blockCount; height += 1) if (height >= 0) { process.stdout.write(`[${height}]`);
      let blockHash = await rpc("getblockhash", [height]);
      let r = (await insertIfNotExists(conn, "block", { height, hash: htb(blockHash) })); 
      let idBlock = r.id;
      if (D(idBlock)) { 
        let block = await rpc("getblock", [blockHash]);
        await conn.query("UPDATE block SET time = FROM_UNIXTIME(?) WHERE id = ?", ([(block.time), idBlock]));
      }
    }
  } finally { if (conn) conn.release(); }
});

let argOffset = 0, args = process.argv.slice(2), command = (args[argOffset++]); L(`args = ${process.argv}`); L({command}); 
if (command === "decodeTx") {
  let txHash = args[argOffset++];
  (async () => {
    L(await getDecodedTx(txHash));
  })();
} else if (command === "blockTimeScan") {
  let offset = parseInt(args[argOffset++]), groupSize = parseInt(args[argOffset++]);
  blockTimeScan(offset, groupSize);
} else if (command === "processBlockAtHeight") {
  let height = parseInt(args[argOffset++]);
  let conn = await pool.getConnection();
  await conn.query("USE transfers");
  await processBlockAtHeight(height, conn);
  L('done');
} else {
  let offset = parseInt(args[argOffset++]), groupSize = parseInt(args[argOffset++]);
  blockScan(offset, groupSize);
}


