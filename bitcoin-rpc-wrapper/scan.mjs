import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
//import * as bip32 from 'bip32';
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js'; 
import { A, D, E, F, I, K, L, P, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import mariadb from  'mariadb';
import { investors } from './investorData.mjs';
import { Q, select, insertIfNotExists } from './utils.mjs';
import { pubKeyToBtcAddress } from './pubKeyConvertor.mjs';
import bs58check from 'bs58check'; 
import fs from 'fs';
import blockHeights from './blockHeights.json';

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
 
// DB Init 
const pool = mariadb.createPool({ host: cfg.DB_HOST, user: cfg.DB_USER, password: cfg.DB_PWD, connectionLimit: 3 });
let objGenesis = [ "USE transfers",
  "CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, time TIMESTAMP, hash BINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
  "CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, idBlock INT, v BINARY(32), INDEX idBlock (idBlock), INDEX v (v))", 
  "CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(33), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS vout (id INT PRIMARY KEY AUTO_INCREMENT, ix INT, idToAddress INT, idTransaction INT, value BIGINT, INDEX ix (ix), INDEX idToAddress (idToAddress), INDEX idTransaction (idTransaction), INDEX value (value))",
  "CREATE TABLE IF NOT EXISTS vin (id INT PRIMARY KEY AUTO_INCREMENT, idSourceTransaction INT, idTransaction INT, voutIx INT, idPubKey INT, INDEX idTransaction (idTransaction), INDEX idSourceTransaction (idSourceTransaction), INDEX voutIx (voutIx), INDEX idPubKey (idPubKey))",
  "CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(21), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS coin (id INT PRIMARY KEY AUTO_INCREMENT, value VARBINARY(16), idSourceTx INT, idDestTx INT, idAddress INT, INDEX idSourceTx (idSourceTx), INDEX idDestTx (idDestTx), INDEX idAddress (idAddress))" 
];
let objRename = T("block transaction pubKey vout vin address coin").map(q => `ALTER TABLE ${q} RENAME TO _${q}`);  

let initDB = async conn => { for (let x of objGenesis) await Q(conn, x); }
let initDatabase = async () => { await initDB(await pool.getConnection()); }

let dbMethod = async f => { let c = await pool.getConnection(); 
  if (c) { try { await initDB(c); return await f(c); 
  } 
catch(e) { L(`Error in dbMethod: ${S(e)} (${e.message})`); }
finally { c.release(); } } } 

let mapPublicKeysToAddresses = () => dbMethod(async c => { 
  let q = await Q(c, 'SELECT * FROM pubKey', []);
  process.stdout.write(`count = ${q.length} --`);
  let i = 0;
  for (let pk of q) { if ((i++ % 1000) === 0) process.stdout.write(`${i}:`); 
    let btcAddress = pubKeyToBtcAddress(pk.v.toString('hex'));
    let binBtcAddress = bs58check.decode(btcAddress);
    let r = await Q(c, "SELECT * FROM address WHERE v = ?", [binBtcAddress]);
    if (r.length === 1) { await Q(c, "UPDATE address SET idPubKey = ? WHERE v = ?", L([pk.id, binBtcAddress])); } 
    else { await Q(c, "INSERT INTO address (v, idPubKey) VALUES (?, ?)", L([binBtcAddress, pk.id])) }
  };
}) 

let getRelevantTransactions = () => dbMethod(async conn => {
  L({investors});
  L('Getting block heights...');
//  let r = await conn.query("select height, HEX(transaction.v) AS txId from vout, transaction, block WHERE vout.idTransaction = transaction.id AND vout.idBlock = block.id ORDER BY height LIMIT 1");
  let r = await conn.query("select HEX(transaction.v) AS txId from transaction LIMIT 1");
  L({r});
  L('Saving block heights...');
//  fs.writeFileSync('relevantTransactions.json', S(r.map(x => [x.height, x.txId])));
  L('Saved block heights.');
}) 

let htb = h => Buffer.from(h, "hex");

let coin = (new BigNumber(100000000)).pow(8);

let pubKeyFromScriptSig = ss => { let asm = oS(oO(ss).asm), k = "[ALL] "; let p = asm.indexOf(k); return p >= 0 ? asm.substr(p + k.length) : U; }

let fundDepositAddresses = ["33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw"], fundDepositPubKeys = ["03f1da9523bf0936bfe1fed5cd34921e94a78cac1ea4cfd36b716e440fb8de90aa"];

let watchedToAddresses = fundDepositAddresses.concat(investors.map(x => x.btcAddress));
let watchedFromPubKeys = fundDepositPubKeys.concat(investors.map(x => x.pubKey));
let watchedToAddressesMap = F(watchedToAddresses.map(k => [k, true]));
let watchedFromPubKeysMap = F(watchedFromPubKeys.map(k => [k, true]));

let processTransaction = async (tx, idBlock, conn) => {
  let idTransaction, getIdTransaction = async () => (D(idTransaction) ? idTransaction : (idTransaction = (await insertIfNotExists(conn, "transaction", { v:  htb(tx.txid), idBlock })).id)); 

  let foundWatchedToAddress = tx.vout.some(vout => oA(vout.scriptPubKey?.addresses).some(a => watchedToAddressesMap[a]));
  let foundWatchedFromPubKey = tx.vin.some(vin => watchedFromPubKeysMap[pubKeyFromScriptSig(vin.scriptSig)]); 
  if (foundWatchedFromPubKey || foundWatchedToAddress) {
    for (let vout of tx.vout) { 
      L(S(vout?.scriptPubKey));
      for (let toAddress of oA(vout?.scriptPubKey?.addresses)) {
        let idToAddress = (await insertIfNotExists(conn, "address", { v: bs58check.decode(L(toAddress)) })).id;
        let value = (new BigNumber((new BigNumber(vout.value)).multipliedBy(coin).toFixed())).toString(); 
        if (D(idToAddress)) await insertIfNotExists(conn, "vout", ({ idToAddress, idTransaction: await getIdTransaction(), ix: vout.n, value }), T("idToAddress idTransaction ix")); 
      }
    } 
    
    for (let vin of tx.vin) { vin.pubKey = vin.pubKey?.length === 66 ? vin.pubKey : U
      let idSourceTransaction = D(vin.txid) ? (await insertIfNotExists(conn, "transaction", { v : htb(vin.txid) })).id : U;
      let idPubKey = vin.pubKey ? (await insertIfNotExists(conn, "pubKey", { v: htb(vin.pubKey) })).id : U;
      if (idSourceTransaction) { let q = { voutIx: vin.vout, idPubKey, idTransaction: await getIdTransaction(), idSourceTransaction };
        await insertIfNotExists(conn, "vin", P(q, K(q).filter(k => D(q[k]))));
      }
    }
  }
} 

let processBlockAtHeight = async (height, conn) => { process.stdout.write(`[${height}]`);
  let blockHash = await rpc("getblockhash", [height]);
  let r = (await insertIfNotExists(conn, "block", { height, hash: htb(blockHash) }));
  let idBlock = r.id;
  if (D(idBlock) //&& !(r.processed === 1)
  ) { let block = await rpc("getblock", [blockHash]);
    await Q(conn, "UPDATE block SET time = FROM_UNIXTIME(?) WHERE id = ?", [block.time, idBlock]);
    for (let txHash of block.tx) await processTransaction(await getDecodedTx(txHash), idBlock, conn);
    await Q(conn, "UPDATE block SET processed = 1 WHERE id = ?", [idBlock]);
  }
} 

let blockRescan = (offset, groupSize) => dbMethod(async conn => { L({offset, groupSize, bhl: blockHeights.length}); for (let h = offset; h < blockHeights.length; h += groupSize) await processBlockAtHeight(blockHeights[h], conn); });

let blockScan = (offset, groupSize) => dbMethod(async conn => {  
  L({offset, groupSize});
  for (let x of objGenesis) await conn.query((x)); 
  let blockHeights = [570802, 617005]; // 570650
  let firstBlock = 570650, blockCount = await rpc("getblockcount", []);
//    for (let height = blockHeights[0] - (blockHeights[0] % groupSize) + offset; height <= blockCount; height += groupSize) if (height <= blockCount) { process.stdout.write(`[${height}]`);
  for (let height = firstBlock - (blockCount % groupSize) - groupSize + offset; height >= 0; height += groupSize) if (height >= 0) await processBlockAtHeight(height, conn);
});

let blockTimeScan = (offset, groupSize) => dbMethod(async conn => {  
  let blockHeights = [570802, 617005]; // 570650
  let firstBlock = 570650, blockCount = await rpc("getblockcount", []);
//    for (let height = blockHeights[0] - (blockHeights[0] % groupSize) + offset; height <= blockCount; height += groupSize) if (height <= blockCount) { process.stdout.write(`[${height}]`);
  for (let height = firstBlock ; height < blockCount; height += 1) if (height >= 0) { process.stdout.write(`[${height}]`);
    let blockHash = await rpc("getblockhash", [height]);
    let r = (await insertIfNotExists(conn, "block", { height, hash: htb(blockHash) })); 
    if (D(r.id)) await conn.query("UPDATE block SET time = FROM_UNIXTIME(?) WHERE id = ?", ([((await rpc("getblock", [blockHash])).time), r.id]));
  }
});

let argOffset = 0, args = process.argv.slice(2), command = (args[argOffset++]); L(`args = ${process.argv}`); L({command}); 
let commands = { mapPublicKeysToAddresses, getRelevantTransactions, initDatabase, 
  decodeTx: async () => L(await getDecodedTx(args[argOffset++])),
  getTransaction: async () => L(await rpc("gettransaction", [args[argOffset++]])), 
  showBlockHeights: () => { L({blockHeights}); L(blockHeights.length); },
  blockTimeScan: async () => { 
    let offset = parseInt(args[argOffset++]), groupSize = parseInt(args[argOffset++]);
    blockTimeScan(offset, groupSize);
  },
  processBlockAtHeight: () => dbMethod(async conn => await processBlockAtHeight(parseInt(args[argOffset++]), conn)),
  rescanBlocks: () => blockRescan(parseInt(args[argOffset++]), parseInt(args[argOffset++])),
  scanBlocks: () => blockScan(parseInt(args[argOffset++]), parseInt(args[argOffset++]))
}

let c = commands[command];
if (D(c)) { (async () => { await c(); L("### Done."); })(); } else { L(`Unknown command '${command}'.`) } 

