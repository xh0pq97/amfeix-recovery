// Type-checking
let isA = Array.isArray;
let isF = f => typeof f === "function";
let isP = o => D(o.then) && isF(o.then);
let isO = o => typeof o === "object" && o != null;

let A = Object.assign;
let D = x => typeof x !== "undefined";
let E = Object.entries;
let F = Object.fromEntries;
let H = (f, o) => F(E(o).map(([k, v], i) => [k, isO(v) ? H(f, v) : f(v, k, i, o)]));
let K = Object.keys;
let L = x => { console.log(S(x)); return x; }
let S = JSON.stringify;
let V = Object.values;

// Optionals
let oA = a => a || [];
let oF = f => f || (() => {});
let oO = o => o || {};

let singleKeyObject = (k, v) => { let o = {}; o[k] = v; return o; }

export { A, D, E, F, H, K, L, S, V, oA, oO, oF, isA, isO, isF, isP, singleKeyObject }