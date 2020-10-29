// Type-checking
let isA = Array.isArray;
let isF = f => typeof f === "function";
let isP = o => D(o.then) && isF(o.then);
let isO = o => typeof o === "object" && o != null && !isA(o);

let A = Object.assign;
let D = x => typeof x !== "undefined";
let E = Object.entries;
let F = Object.fromEntries; 
let G = (o, f) => F(E(oO(o)).map(([k, v], i) => [k, f(v, k, i, o)]));
let H = (f, o) => G(o, (v, k, i, o) => isO(v) ? H(f, v) : f(v, k, i, o));
let I = x => x;
let K = Object.keys;
let L = x => { console.log(S(x)); return x; }
let S = JSON.stringify;
let T = s => oS(s).split(" ");
let U = undefined;
let V = Object.values; 

// Optionals
let oA = a => a || [];
let oF = f => f || (() => {});
let oO = o => o || {};
let oS = s => s || "";

let asA = a => (b => isA(b) ? b : [b])(oA(a))

let singleKeyObject = (k, v) => { let o = {}; o[k] = v; return o; }
let makeEnum = soo => Object.freeze(F(T(soo).map(k => [k, k])));

export { A, D, E, F, G, H, I, K, L, S, T, U, V, oA, oO, oS, oF, isA, isO, isF, isP, asA, singleKeyObject, makeEnum }