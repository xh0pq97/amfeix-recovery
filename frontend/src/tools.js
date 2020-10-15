let S = JSON.stringify;
let L = x => { console.log(S(x)); return x; }
let K = Object.keys;
let V = Object.values;
let D = x => typeof x !== "undefined";
let E = Object.entries;
let F = Object.fromEntries;
let oF = f => f || (() => {});
let oA = a => a || [];
let oO = o => o || {};

export { D, E, F, K, L, S, V, oA, oO, oF }