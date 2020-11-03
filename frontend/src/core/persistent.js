import { A, L, P, S, oO } from '../tools'

export class Persistent {
  constructor(persistanceKey, storedFieldNames, defaults) {
    A(this, { persistanceKey, storedFieldNames })
    A(this, (d => d ? A(oO(defaults), P(JSON.parse(d), this.storedFieldNames)) : oO(defaults))((localStorage.getItem(this.persistanceKey))));
    //L(`Loaded ${persistanceKey}: ${S(P(this, L(this.storedFieldNames)))}`)
  }

  persist() { 
    localStorage.setItem(this.persistanceKey, S(P(this, this.storedFieldNames))); 
  }
}