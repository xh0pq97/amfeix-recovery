import { A, B, D, E, F, I, K, L, P, R, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import Memcached from 'memcached';
import dotenv from "dotenv"; import request from "request";
dotenv.config(); const cfg = process.env;  
let memcached = new Memcached("localhost:11211");

import mariadb from  'mariadb';
const pool = mariadb.createPool({ host: cfg.DB_HOST, user: cfg.DB_USER, password: cfg.DB_PWD, connectionLimit: 3 }); 
 

/*
let select = (conn, table, obj) => conn.query(`SELECT * FROM ${table} WHERE ${K(obj).map(k => `${k} = ?`).join(" AND ")}`, V(obj));
let insertIfNotExists = async (conn, table, obj, idKeys) => { let r = await select(conn, table, P(obj, idKeys || K(obj)));
  return (r.length === 0) ? { ...obj, id: oO(await conn.query(`INSERT INTO ${table} (${K(obj).join(", ")}) VALUES (${K(obj).map(() => '?').join(", ")})`, V(obj))).insertId } : r[0]
}
*/
// DB Init  
let objGenesis = [ "USE transfers",
  "CREATE TABLE IF NOT EXISTS block (id INT PRIMARY KEY AUTO_INCREMENT, height INT, time TIMESTAMP, hash BINARY(32), processed BOOL, INDEX height (height), INDEX hash (hash))",
  "CREATE TABLE IF NOT EXISTS transaction (id INT PRIMARY KEY AUTO_INCREMENT, idBlock INT, v BINARY(32), INDEX idBlock (idBlock), INDEX v (v))", 
  "CREATE TABLE IF NOT EXISTS pubKey (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(33), INDEX v (v))",
  "CREATE TABLE IF NOT EXISTS vout (id INT PRIMARY KEY AUTO_INCREMENT, ix INT, idToAddress INT, idTransaction INT, value BIGINT, INDEX ix (ix), INDEX idToAddress (idToAddress), INDEX idTransaction (idTransaction), INDEX value (value))",
  "CREATE TABLE IF NOT EXISTS vin (id INT PRIMARY KEY AUTO_INCREMENT, idSourceTransaction INT, idTransaction INT, voutIx INT, idPubKey INT, INDEX idTransaction (idTransaction), INDEX idSourceTransaction (idSourceTransaction), INDEX voutIx (voutIx), INDEX idPubKey (idPubKey))",
  "CREATE TABLE IF NOT EXISTS address (id INT PRIMARY KEY AUTO_INCREMENT, v BINARY(21), INDEX v (v))"
  //, "CREATE TABLE IF NOT EXISTS coin (id INT PRIMARY KEY AUTO_INCREMENT, value VARBINARY(16), idSourceTx INT, idDestTx INT, idAddress INT, INDEX idSourceTx (idSourceTx), INDEX idDestTx (idDestTx), INDEX idAddress (idAddress))" 
];
let objRename = T("block transaction pubKey vout vin address coin").map(q => `ALTER TABLE ${q} RENAME TO _${q}`);  


let Q = async (conn, sql, parms) => { try { return await conn.query((sql), (oA(parms))); } catch(e) { throw new Error(LL(`Error in '${sql}': ${S(e)}`)); } }

let select = (conn, table, obj) => Q(conn, `SELECT * FROM ${table} WHERE ${K(obj).map(k => `${k} = ?`).join(" AND ")}`, V(obj));
let insertIfNotExists = async (conn, table, obj, idKeys) => { let key = P(obj, idKeys || K(obj));
  let r = (await select(conn, table, key));
 //   if (r.length > 0) memcached.set(keyString, S(r[0]), 60*60, (e) => { if (e) throw new Error(e); } );
  return (r.length === 0) ? { ...obj, id: oO(await Q(conn, `INSERT INTO ${table} (${K(obj).join(", ")}) VALUES (${K(obj).map(() => '?').join(", ")})`, V(obj))).insertId } : r[0]
}

let initDB = async conn => { for (let x of objGenesis) await Q(conn, x); }
let initDatabase = async () => { await initDB(await pool.getConnection()); }

let dbMethod = async f => { let c = await pool.getConnection(); if (c) { try { await initDB(c); return await f(c); } 
catch(e) { L(`Error in dbMethod: ${S(e)} (${e.message})`); }
finally { c.release(); } } } 

export { Q, select, insertIfNotExists, dbMethod, initDatabase }