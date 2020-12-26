import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");
//import * as bip32 from 'bip32';
import JSONBig from 'json-bigint';
import BigNumber from 'bignumber.js'; 
import { A, D, E, F, I, K, L, P, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs';  
import { investors } from './investorData.mjs';
import { Q, select, insertIfNotExists, dbMethod, initDatabase } from './utils.mjs';
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

let coin = (new BigNumber(10)).pow(new BigNumber(8));

let pubKeyFromScriptSig = ss => { let asm = oS(oO(ss).asm), k = "[ALL] "; let p = asm.indexOf(k); return p >= 0 ? asm.substr(p + k.length) : U; }

let fundDepositAddresses = ["33ns4GGpz7vVAfoXDpJttwd7XkwtnvtTjw"], fundDepositPubKeys = ["03f1da9523bf0936bfe1fed5cd34921e94a78cac1ea4cfd36b716e440fb8de90aa"];

let watchedToAddresses = fundDepositAddresses.concat(investors.map(x => x.btcAddress));
let watchedFromPubKeys = fundDepositPubKeys.concat(investors.map(x => x.pubKey));
let watchedToAddressesMap = F(watchedToAddresses.map(k => [k, true]));
let watchedFromPubKeysMap = F(watchedFromPubKeys.map(k => [k, true])); 

let filterDefined = q => P(q, K(q).filter(k => D(q[k])));
let getAddressId = async (a, conn) => { let z; try { z = (await insertIfNotExists(conn, ("address"), { v: (bs58check.decode((a))) })).id } catch(e) { } finally { return z; } };

let processTransaction = async (tx, idBlock, conn) => { try {
  if (tx.vin.some(vin => watchedFromPubKeysMap[pubKeyFromScriptSig(vin.scriptSig)]) || tx.vout.some(vout => oA(vout.scriptPubKey?.addresses).some(a => watchedToAddressesMap[a]))) {
    let idTransaction = ((await insertIfNotExists(conn, "transaction", { v: htb((tx.txid)), idBlock: (idBlock) })).id); 
    for (let vout of tx.vout) { let value = (new BigNumber((new BigNumber((vout.value))).multipliedBy(coin).toFixed())).toString();
      for (let a of oA(vout?.scriptPubKey?.addresses)) { let idToAddress = (await getAddressId((a), conn));
        let z = filterDefined(({ idToAddress, idTransaction, ix: vout.n })); 
        if (D(idToAddress)) await insertIfNotExists(conn, "vout", { ...z, value }, K(z)); 
      }
    } 
    
    for (let vin of tx.vin) { let pk = (vin.pubKey)?.length === 66 ? (vin.pubKey) : U;
      if (D(vin.pubKey)) {
        let idSourceTransaction = D(vin.txid) ? (await insertIfNotExists(conn, "transaction", { v : htb(vin.txid) })).id : U;
        let idPubKey = D(pk) ? (await insertIfNotExists(conn, "pubKey", { v: htb(pk) })).id : U;
        if (idSourceTransaction) await insertIfNotExists(conn, "vin", L(filterDefined({ voutIx: vin.vout, idPubKey, idTransaction, idSourceTransaction })));
      }
    }
  } 
} catch(e) { L(`Error in processTransaction: ${S({ idBlock })}`); }
}   

let processBlockAtHeight = async (height, conn) => { process.stdout.write(`<${height}>`);
  let blockHash = await rpc("getblockhash", [height]);
  let r = (await insertIfNotExists(conn, "block", { height, hash: htb(blockHash) }));
  let idBlock = r.id;
  if (D(idBlock) && !(r.processed === 1)) { let block = await rpc("getblock", [blockHash]);
    await Q(conn, "UPDATE block SET time = FROM_UNIXTIME(?) WHERE id = ?", [block.time, idBlock]);
    for (let txHash of block.tx) await processTransaction(await getDecodedTx(txHash), idBlock, conn);
    await Q(conn, "UPDATE block SET processed = 1 WHERE id = ?", [idBlock]);
  }
} 

let processInterleaved = async (blockCount, firstBlock, groupSize, offset, f) => { //process.stdout.write({offset, groupSize, blockCount}); 
  for (let h = firstBlock - (firstBlock % groupSize) - groupSize + offset; h <= blockCount; h += groupSize) if (h >= 0) { process.stdout.write(`[${h}]`); await f(h); }
}
//let blockHeights = [570650, 617005], firstBlock = 570650;
let blockRescan = (offset, groupSize) => dbMethod(async conn => await processInterleaved(blockHeights.length, 0, groupSize, offset, async h => await processBlockAtHeight(blockHeights[h], conn)));
let blockScan = (offset, groupSize) => dbMethod(async conn => await processInterleaved(await rpc("getblockcount", []), 570650, groupSize, offset, async h => await processBlockAtHeight(h, conn)));

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
  blockTimeScan: () => blockTimeScan(parseInt(args[argOffset++]), parseInt(args[argOffset++])),
  processBlockAtHeight: () => dbMethod(async conn => await processBlockAtHeight(parseInt(args[argOffset++]), conn)),
  rescanBlocks: () => blockRescan(parseInt(args[argOffset++]), parseInt(args[argOffset++])),
  scanBlocks: () => blockScan(parseInt(args[argOffset++]), parseInt(args[argOffset++]))
}

let c = commands[command];
if (D(c)) { (async () => { await c(); L("### Done."); })(); } else { L(`Unknown command '${command}'.`) } 

