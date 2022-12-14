// Type-checking
let isA = Array.isArray;
let isF = f => typeof f === "function";
let isP = o => D(o.then) && isF(o.then);
let isO = o => typeof o === "object" && o != null && !isA(o);
let isS = s => typeof s === "string";

let A = Object.assign;
let B = (a, k, t) => { let r = {}; a.forEach(b => { let y = r[b[(t || I)(k)]]; if (y) { y.push(b); } else { r[b[(t || I)(k)]] = [b]; } }); return r; }
let C = x => x && P(x, K(x));
let D = x => typeof x !== "undefined";
let E = o => Object.entries(oO(o));
let F = Object.fromEntries; 
let G = (o, f) => F(E(o).map(([k, v], i) => [k, f(v, k, i, o)]));
let GA = async (o, f) => F(await E(oO(o)).map(async ([k, v], i) => [k, await f(v, k, i, o)]));
let H = (f, o) => G(o, (v, k, i, o) => isO(v) ? H(f, v) : f(v, k, i, o));
let I = x => x;
let K = Object.keys;
let LL = x => { console.log(S(x)); return x; }
let L = x => {  if (process.env.NODE_ENV === "development") LL(x); return x; }
let P = (o, keys) => F(keys.map(k => [k, o[k]]));
let R = (msg, data) => A(new Error(msg), oO(data));
let S = JSON.stringify;
let T = s => oS(s).split(" ");
let U = undefined;
let V = Object.values; 
let W = async o => F(await Promise.all(E(o).map(async ([k, v]) => [k, await v])));

// Optionals
let oA = a => a || [];
let oB = b => b || false;
let oF = f => f || (() => {});
let oO = o => o || {};
let oS = s => isS(s) ? s : ""; 

let asA = a => (b => isA(b) ? b : [b])(oA(a))

let singleKeyObject = (k, v) => { let o = {}; o[k] = v; return o; }
let makeEnum = soo => Object.freeze(F(T(soo).map(k => [k, singleKeyObject(k, true)]))); 

class Future { 
  constructor() { A(this, { creationTime: Date.now(), promise: new Promise((resolve, reject) => A(this, { resolve: x => { this.resolveTime = Date.now(); resolve(x) }, reject })) }); } 
  async resolveWithPromise(p) { try { return this.resolve(await p); } catch(e) { return this.reject(e); } }
}
let future = () => new Future();

export { A, B, C, D, E, F, G, GA, H, I, K, L, LL, P, R, S, T, U, V, W, oA, oB, oO, oS, oF, isA, isO, isF, isS, isP, asA, Future, future, singleKeyObject, makeEnum }