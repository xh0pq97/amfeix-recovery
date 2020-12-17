import { A, B, D, E, F, I, K, L, P, S, T, U, V, oA, oO, oS, oF, singleKeyObject } from './tools.mjs'; 
import Memcached from 'memcached';
let memcached = new Memcached("localhost:11211");

/*
let select = (conn, table, obj) => conn.query(`SELECT * FROM ${table} WHERE ${K(obj).map(k => `${k} = ?`).join(" AND ")}`, V(obj));
let insertIfNotExists = async (conn, table, obj, idKeys) => { let r = await select(conn, table, P(obj, idKeys || K(obj)));
  return (r.length === 0) ? { ...obj, id: oO(await conn.query(`INSERT INTO ${table} (${K(obj).join(", ")}) VALUES (${K(obj).map(() => '?').join(", ")})`, V(obj))).insertId } : r[0]
}
*/

let Q = async (conn, sql, parms) => { try { return await conn.query((sql), (oA(parms))); } catch(e) { throw new Error(LL(`Error in '${sql}': ${S(e)}`)); } }

let select = (conn, table, obj) => Q(conn, `SELECT * FROM ${table} WHERE ${K(obj).map(k => `${k} = ?`).join(" AND ")}`, V(obj));
let insertIfNotExists = async (conn, table, obj, idKeys) => { let key = P(obj, idKeys || K(obj));
  let keyString = (`${table}:${V(key).map(x => Buffer.isBuffer(x) ? x.toString('base64') : x).join("|")}`);
  let r; 
  memcached.get(keyString, (e, d) => { if (e) throw new Error(e); if (D(d)) { r = JSON.parse(d); } });
  if (!D(r)) {
    r = (await select(conn, table,key));
    if (r.length > 0) memcached.set(keyString, S(r[0]), 60*60, (e) => { if (e) throw new Error(e); } );
  } else { return r; }
  return (r.length === 0) ? { ...obj, id: oO(await Q(conn, `INSERT INTO ${table} (${K(obj).join(", ")}) VALUES (${K(obj).map(() => '?').join(", ")})`, V(obj))).insertId } : r[0]
}

export { Q, select, insertIfNotExists }