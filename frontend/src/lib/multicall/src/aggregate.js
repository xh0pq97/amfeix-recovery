/*
MIT License

Copyright (c) 2019 Maker Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import { id as keccak256 } from 'ethers/utils/hash';
import invariant from 'invariant';
import { strip0x, ethCall, encodeParameters, decodeParameters } from './helpers.js';
import memoize from 'lodash/memoize';

const INSIDE_EVERY_PARENTHESES = /\(.*?\)/g;
const FIRST_CLOSING_PARENTHESES = /^[^)]*\)/;

export function _makeMulticallData(calls) {
  const values = [
    calls.map(({ target, method, args, returnTypes }) => [
      target,
      keccak256(method).substr(0, 10) +
        (args && args.length > 0
          ? strip0x(encodeParameters(args.map(a => a[1]), args.map(a => a[0])))
          : '')
    ])
  ];
  const calldata = encodeParameters(
    [
      {
        components: [{ type: 'address' }, { type: 'bytes' }],
        name: 'data',
        type: 'tuple[]'
      }
    ],
    values
  );
  return calldata;
}

const makeMulticallData = memoize(_makeMulticallData, (...args) => JSON.stringify(args));

export default async function aggregate(calls, config) {
  calls = Array.isArray(calls) ? calls : [calls];

  const keyToArgMap = calls.reduce((acc, { call, returns }) => {
    const [, ...args] = call;
    if (args.length > 0) {
      for (let returnMeta of returns) {
        const [key] = returnMeta;
        acc[key] = args;
      }
    }
    return acc;
  }, {});

  calls = calls.map(({ call, target, returns }) => {
    if (!target) target = config.multicallAddress;
    const [method, ...argValues] = call;
    const [argTypesString, returnTypesString] = method
      .match(INSIDE_EVERY_PARENTHESES)
      .map(match => match.slice(1, -1));
    const argTypes = argTypesString.split(',').filter(e => !!e);
    invariant(
      argTypes.length === argValues.length,
      `Every method argument must have exactly one type.
          Comparing argument types ${JSON.stringify(argTypes)}
          to argument values ${JSON.stringify(argValues)}.
        `
    );
    const args = argValues.map((argValue, idx) => [argValue, argTypes[idx]]);
    const returnTypes = !!returnTypesString ? returnTypesString.split(',') : [];
    return {
      method: method.match(FIRST_CLOSING_PARENTHESES)[0],
      args,
      returnTypes,
      target,
      returns
    };
  });

  const callDataBytes = makeMulticallData(calls, false);
  const outerResults = await ethCall(callDataBytes, config);
  const returnTypeArray = calls
    .map(({ returnTypes }) => returnTypes)
    .reduce((acc, ele) => acc.concat(ele), []);
  const returnDataMeta = calls
    .map(({ returns }) => returns)
    .reduce((acc, ele) => acc.concat(ele), []);

  invariant(
    returnTypeArray.length === returnDataMeta.length,
    'Missing data needed to parse results'
  );

  const outerResultsDecoded = decodeParameters(['uint256', 'bytes[]'], outerResults);
  const blockNumber = outerResultsDecoded.shift();
  const parsedVals = outerResultsDecoded.reduce((acc, r) => {
    r.forEach((results, idx) => {
      const types = calls[idx].returnTypes;
      const resultsDecoded = decodeParameters(types, results);
      acc.push(
        ...resultsDecoded.map((r, idx) => {
          if (types[idx] === 'bool') return r.toString() === 'true';
          return r;
        })
      );
    });
    return acc;
  }, []);

  const retObj = { blockNumber, original: {}, transformed: {} };

  for (let i = 0; i < parsedVals.length; i++) {
    const [name, transform] = returnDataMeta[i];
    retObj.original[name] = parsedVals[i];
    retObj.transformed[name] = transform !== undefined ? transform(parsedVals[i]) : parsedVals[i];
  }

  return { results: retObj, keyToArgMap };
}
