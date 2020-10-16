let D = x => typeof x !== "undefined";
let E = Object.entries;
let F = Object.fromEntries;
let K = Object.keys;
let L = x => { console.log(S(x)); return x; }
let S = JSON.stringify;
let V = Object.values;

// Optionals
let oA = a => a || [];
let oF = f => f || (() => {});
let oO = o => o || {};

// Tests
let isF = f => typeof f === "function"
let isP = o => D(o.then) && isF(o.then)

let singleKeyObject = (k, v) => { let o = {}; o[k] = v; return o; }

export { D, E, F, K, L, S, V, oA, oO, oF, isF, isP, singleKeyObject }