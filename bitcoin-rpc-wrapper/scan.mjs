import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
//import * as bip32 from 'bip32';
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js'; 
import { A, D, E, F, I, K, L, P, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import mariadb from  'mariadb';
import { investors } from './investorData.mjs';
import { select, insertIfNotExists } from './utils.mjs';
import { pubKeyToBtcAddress } from './pubKeyConvertor.mjs';
import bs58check from 'bs58check'; 
import fs from 'fs';
import blockHeights from 'blockHeights.json';

dotenv.config(); const cfg = process.env;  

const verbose = true; 
let LOG = d => verbose ? L(d) : d; 

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
  "CREATE TABLE IF NOT EXISTS coin (id INT PRIMARY KEY AUTO_INCREMENT, value VARBINARY(16), idSourceTx INT, idDestTx INT, idAddress INT, INDEX idSourceTx (idSourceTx), INDEX idDestTx (idDestTx), INDEX idAddress (idAddress))",
//  "CREATE TABLE IF NOT EXISTS transfer (id INT PRIMARY KEY AUTO_INCREMENT, idToAddress INT, idBlock INT, idTransaction INT, idPubKey INT, value BINARY(16), INDEX idToAddress (idToAddress), INDEX idBlock (idBlock), INDEX idTransaction (idTransaction), INDEX idPubKey (idPubKey))",
];
let objRename = T("block transaction pubKey vout vin address coin").map(q => `ALTER TABLE ${q} RENAME TO _${q}`); 
let objGenesisCoins = [ "USE coins",
"CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, time TIMESTAMP, hash BINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
"CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(32), idBlock INT, INDEX v (v), INDEX idBlock (idBlock))",
"CREATE TABLE IF NOT EXISTS coin (id INT PRIMARY KEY AUTO_INCREMENT, value VARBINARY(16), idSourceTx INT, idDestTx INT, voutIx INT, idFromAddress INT, idToAddress INT, INDEX idSourceTx (idSourceTx), INDEX idDestTx (idDestTx), INDEX idFromAddress (idFromAddress), INDEX idToAddress (idToAddress), INDEX idSourceTxVoutIx (idSourceTx, voutIx))",
"CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(33), INDEX v (v))",
"CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(21), idPubKey INT, INDEX idPubKey (idPubKey), INDEX v (v))",
];

let initDB = async conn => { for (let x of objGenesis) await conn.query((x)); }

let mapPublicKeysToAddresses = async () => { let conn = await pool.getConnection(); if (conn) { try { await initDB(conn);
  try { await conn.query("USE transfers");
    let q = await conn.query('SELECT * FROM pubKey', []);
    process.stdout.write(`count = ${q.length} --`);
    let i = 0;
    for (let pk of q) { if ((i++ % 1000) === 0) process.stdout.write(`${i}:`); 
      let btcAddress = pubKeyToBtcAddress(pk.v.toString('hex'));
      let binBtcAddress = bs58check.decode(btcAddress);
      let r = await conn.query("SELECT * FROM address WHERE v = ?", [binBtcAddress]);
      if (r.length === 1) { await conn.query("UPDATE address SET idPubKey = ? WHERE v = ?", L([pk.id, binBtcAddress])); } 
      else { await conn.query("INSERT INTO address (v, idPubKey) VALUES (?, ?)", L([binBtcAddress, pk.id])) }
    };
  } catch(e) { L(`Error in 'USE transfers': ${S(e)}`); }
} finally { if (conn) conn.release(); } } } 

let dbMethod = async f => { L('dbMethod'); let conn = await pool.getConnection(); if (conn) { try { await initDB(conn); L('DB inited.');
  try { await conn.query("USE transfers"); L('Starting func'); return await f(conn);
  } catch(e) { L(`Error in 'USE transfers': ${S(e)}`); }
} finally { if (conn) conn.release(); } } } 

let getBlockHeights = () => dbMethod(async conn => {
  L('Getting block heights...');
  let r = await conn.query("select height from vout, transaction, block WHERE vout.idTransaction = transaction.id AND vout.idBlock = block.id GROUP BY height ORDER BY height");
  L('Saving block heights...');
  fs.writeFileSync('blockHeights.json', S(r.map(x => x.height)));
  L('Saved block heights.');
})

let htb = h => Buffer.from(h, "hex");

let coin = (new BigNumber(10)).pow(18);

let pubKeyFromScriptSig = ss => { let asm = oS(oO(ss).asm), k = "[ALL] "; let p = asm.indexOf(k); return p >= 0 ? asm.substr(p + k.length) : U; }

let fundDepositAddresses = ["33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw"], fundDepositPubKeys = ["03f1da9523bf0936bfe1fed5cd34921e94a78cac1ea4cfd36b716e440fb8de90aa"];

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
  let idTransaction, getIdTransaction = async () => (D(idTransaction) ? idTransaction : (idTransaction = (await insertIfNotExists(conn, "transaction", { v:  htb(tx.txid) })).id)); 

  let foundWatchedToAddress = false;
  for (let ix = 0; ix < tx.vout.length; ++ix) { let vout = tx.vout[ix];  
    if (D(vout.scriptPubKey)) for (let toAddress of oA(vout.scriptPubKey.addresses)) {
      if (watchedToAddressesMap[toAddress]) { foundWatchedToAddress = true;
        let idToAddress = (await insertIfNotExists(conn, "address", { v: bs58check.decode((toAddress)) })).id;
        if (D(idToAddress)) {
          let value = (new BigNumber(new BigNumber(vout.value).multipliedBy(coin).toFixed())).toString(16);
          if (value.length % 2 === 1) value = '0' + value; 
          await insertIfNotExists(conn, "vout", ({ idToAddress, idBlock, idTransaction: await getIdTransaction(), ix, value: htb(value) }), T("idToAddress idBlock idTransaction ix")); 
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
/*
let objGenesisCoins = [ "USE coins",
"CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, time TIMESTAMP, hash BINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
"CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(32), idBlock INT, INDEX v (v), INDEX idBlock (idBlock))",
"CREATE TABLE IF NOT EXISTS coin (id INT PRIMARY KEY AUTO_INCREMENT, value VARBINARY(16), idSourceTx INT, idDestTx INT, voutIx INT, idFromAddress INT, idToAddress INT, INDEX idSourceTx (idSourceTx), INDEX idDestTx (idDestTx), INDEX idFromAddress (idFromAddress), INDEX idToAddress (idToAddress), INDEX idSourceTxVoutIx (idSourceTx, voutIx))",
"CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(33), INDEX v (v))",
"CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(21), idPubKey INT, INDEX idPubKey (idPubKey), INDEX v (v))",
];
*/
let _processTransaction = async (tx, idBlock, conn) => {
  let idTransaction;
  let getIdTransaction = async () => (D(idTransaction) ? idTransaction : (idTransaction = (await insertIfNotExists(conn, "transaction", { v:  htb(tx.txid) })).id)); 

  let foundWatchedToAddress = false;
  for (let ix = 0; ix < tx.vout.length; ++ix) { let vout = tx.vout[ix];  
    if (D(vout.scriptPubKey)) for (let toAddress of oA(vout.scriptPubKey.addresses)) {
      if (watchedToAddressesMap[toAddress]) { foundWatchedToAddress = true;
        let idToAddress = (await insertIfNotExists(conn, "address", { v: bs58check.decode((toAddress)) })).id;
        if (D(idToAddress)) {
          let value = (new BigNumber(new BigNumber(vout.value).multipliedBy(coin).toFixed())).toString(16);
          if (value.length % 2 === 1) value = '0' + value; 
          await insertIfNotExists(conn, "vout", ({ idToAddress, idBlock, idTransaction: await getIdTransaction(), ix, value: htb(value) }), T("idToAddress idBlock idTransaction ix")); 
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
let commands = { mapPublicKeysToAddresses, getBlockHeights,
  decodeTx: async () => { let txHash = args[argOffset++]; L(await getDecodedTx(txHash)); },
  blockTimeScan: async () => { 
    let offset = parseInt(args[argOffset++]), groupSize = parseInt(args[argOffset++]);
    blockTimeScan(offset, groupSize);
  },
  processBlockAtHeight: async () => {
    let height = parseInt(args[argOffset++]);
    let conn = await pool.getConnection();
    await conn.query("USE transfers");
    await processBlockAtHeight(height, conn);
  },
  scanBlocks: async () => {
    let offset = parseInt(args[argOffset++]), groupSize = parseInt(args[argOffset++]);
    blockScan(offset, groupSize); 
  }
}

let c = commands[command];
if (D(c)) { c(); L("### Done."); } else { L(`Unknown command '${command}'.`) } 

