import React from 'react';
// eslint-disable-next-line
import { Box, TextField } from '@material-ui/core';
// eslint-disable-next-line
import { Comp, ValidatableComp, TabbedView, TabTimeline, button, formTable, form, preamble } from './components'; 
// eslint-disable-next-line
import { A, D, E, F, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 
import * as bip39 from 'bip39';
import LockIcon from '@material-ui/icons/Lock';
import { generateSeedWords } from "../core/crypto";

//let defaultWords = 'gorilla endorse hat lumber old price route put goose sail lemon raise'.split(" ");

class SeedView extends ValidatableComp {
  constructor(p, s) { super(p, s);  
    this.setNewInitialWords();
    this.initRefs(K(this.state).join(" "));
    this.constructed = true;
  }
  setNewInitialWords() {  
     let values = {};
     for (let q = 0; q < 12; ++q) values[this.getKey(q)] = oS(oA(this.props.initialWords)[q]);  
     if (this.constructed) { this.setState({ values }); } else { this.state.values = values; }
  }
  checkWordsInList(wordList) { //L(`checkWordsInList: ${wordList}`);
    return this.setErrors(F(this.getWords().map((w, i) => (!(wordList.includes(w))) ? `Word '${w}' is not an accepted word.` : U).filter(I).map((r, i) => [this.getKey(i), (r)])));  
  }
  checkWordsEqual(expectedWords) { let gotWords = this.getWords();  
    return this.setErrors(F(gotWords.map((w, i) =>  (!(w === expectedWords[i])) ? `This word is not correct.` : U).filter(I).map((r, i) => [this.getKey(i), r])));  
  }
  componentDidUpdate(prevP) { if (prevP.initialWords !== this.props.initialWords) this.setNewInitialWords(); }
  getKey(x) { return `Word_${x}`}
  getWords() { let result = []; for (let q = 0; q < 12; ++q) result.push(this.state.values[this.getKey(q)]);  return result; }
  ren(p, s) { return formTable([0, 1, 2].map(a => [0, 1, 2, 3].map(b => this.genTextField(this.getKey(4*a + b), { disabled: p.disabled })))) }
}

class Setup_password extends ValidatableComp { constructor(p, s) { super(p, s, "Wallet Password Confirm_password"); }
  ren(p, s) { return form(preamble("Setup password", "Your wallet will be password protected and encrypted. Please, choose a strong password."), 
    [[this.genTextField("Wallet")], [this.genTextField("Password", { type: "password" })], [this.genTextField("Confirm_password", { type: "password" } )]]) }
  validate() { let e = {};
    if (this.state.values.Password !== this.state.values.Confirm_password) { e["Password"] = "Passwords don't match"; e["Confirm_password"] = "Passwords don't match"; } 
    if (oS(this.state.values.Password).length < 8) e["Password"] = "Please use at least 8 characters";
    if (oS(this.state.values.Wallet).length < 1) e["Wallet"] = "Please choose a name for your wallet";
    return ((this.setErrors(e)) && (this.state.values));
  }
}

class Enter_credentials extends ValidatableComp { constructor(p, s) { super(p, s, "Wallet Password"); }
  ren(p, s) { return formTable([[preamble("Unlock your wallet", "Select a wallet, type the password and unlock it.")], [<LockIcon fontSize={"large"}/>], 
    [this.genTextField("Wallet")], [this.genTextField("Password", { type: "password" })]]) }
  validate() { let e = {};
    if (oS(this.state.values.Password).length < 1) e["Password"] = "Please enter your password";
    if (oS(this.state.values.Wallet).length < 1) e["Wallet"] = "Please choose a wallet";
    return this.setErrors(e) && { creds: this.state.values };
  }
}

class Backup_seed extends ValidatableComp { constructor(p, s) { super(p, s, "seedView"); }
  validate() { return { creds: this.state.creds, words: this.state.words }; }
  componentDidMount() { super.componentDidMount(); this.setState({ words: generateSeedWords() }) }
  setPrecedingResult(creds) { this.setState({ creds }) }
  ren(p, s) {
    return <form noValidate autoComplete="off">
      {preamble("Backup seed", "Please write these 12 words down, in order, and keep them somewhere safe offline. With them you will be able to recover your wallet.", "Never give your seed keys to anyone, we will never ask you to share them with us.")}
      <SeedView ref={this.fers.seedView} initialWords={s.words} disabled={true} /></form>;
  }
}

class Verify_seed extends ValidatableComp { constructor(p, s) { super(p, s, "seedView"); }
  setPrecedingResult(input) { this.setState({ ...input }) }
  validate() { let sv = this.fers.seedView.current; return sv.checkWordsEqual(oA(this.state.words)) && { creds: this.state.creds, seedWords: this.state.words }; }
  ren(p, s) {
    return <form noValidate autoComplete="off">{preamble("Verify seed", "Your seed is very important! If your lose your seed your funds will be permantently lost.")}
      <SeedView ref={this.fers.seedView}/></form>;
  }
}

class Input_seed extends ValidatableComp { constructor(p, s) { super(p, s, "seedView"); }
  setPrecedingResult(creds) { this.setState({ creds }) }
  validate() { let sv = this.fers.seedView.current; return sv.checkWordsInList(bip39.wordlists.english) && { creds: this.state.creds, seedWords: sv.getWords() }; } 
  ren(p, s) { return <form noValidate autoComplete="off">{preamble('Input seed', 'Restore your wallet from your previously backed up seed.', 'Never give your seed keys to anyone, we will never ask you to share them with us.')}
    <SeedView ref={this.fers.seedView}/></form>;
  }
} 

class Unlock_wallet extends Comp { ren(p, s) { return <TabTimeline tabs={{ Enter_credentials }} onAccept={p.onAccept} onCancel={p.onCancel} acceptText="Unlock"/>; } }
class Create_wallet extends Comp { ren(p, s) { return <TabTimeline tabs={{ Setup_password, Backup_seed, Verify_seed }} onAccept={p.onAccept} onCancel={p.onCancel}/>; } }
class Seed_Login extends Comp { ren(p, s) { return <TabTimeline tabs={{ Setup_password, Input_seed }} onAccept={p.onAccept} onCancel={p.onCancel}/>; } }

export class Log_in extends Comp { 
  ren(p, s) { return <TabbedView tabs={{ Unlock_wallet, Create_wallet, Seed_Login }} parentProps={{ onAccept: p.onAccept, onCancel: p.onCancel }}/>; } 
}