import React from 'react';
import { Box, TextField } from '@material-ui/core';
import { Comp, ValidatableComp, TabbedView, TabTimeline, button, formTable, form } from './components'; 
import { A, D, E, F, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 
import * as bip39 from 'bip39';

let defaultWords = 'gorilla endorse hat lumber old price route put goose sail lemon raise'.split(" ");
let preamble = (title, text, warning) => <><h2 style={{textAlign: "left"}}>{title}</h2><p style={{textAlign: "left"}}>{text}</p><p style={{textAlign: "left", color: "#FF2170"}}>{warning}</p></>;

class SeedView extends ValidatableComp {
  constructor(p, s) { super(p, s); 
//    let mnemonic = 'praise you muffin lion enable neck grocery crumble super myself license ghost'.split(" ");
    for (let q = 0; q < 12; ++q) this.state.values[this.getKey(q)] = defaultWords[q];  
    this.initRefs(K(this.state).join(" "));
  }
  checkWordsInList(wordList) { L(`checkWordsInList: ${wordList}`);
    let errs = F(this.getWords().map((w, i) => { if (!(wordList.includes(w))) return `Word '${w}' is not an accepted word.`; }).map((r, i) => [this.getKey(i), L(r)]).filter(([k, v]) => D(v)));
    L(`errs = ${S(errs)} (${S(K(errs))})`);
    return this.setErrors(errs);  
  }
  checkWordsEqual(expectedWords) { 
    let errs = F(this.getWords().map((w, i) => { if (!(w === expectedWords[i])) return `This word is not correct.` }).map((r, i) => [this.getKey(i), r]).filter(([k, v]) => D(v)));
    return this.setErrors(errs);  
  }
  getKey(x) { return `Word_${x}`}
  getWords() { let result = []; for (let q = 0; q < 12; ++q) result.push(this.state.values[this.getKey(q)]); L(`getWords = ${result}`); return result; }
  ren(p, s) { return formTable([0, 1, 2].map(a => [0, 1, 2, 3].map(b => this.genTextField(this.getKey(4*a + b), U, defaultWords[4*a + b])))) }
}

class Setup_password extends ValidatableComp { constructor(p, s) { super(p, s, "Wallet Password Confirm_password"); }
  ren(p, s) { return form(preamble("Setup password", "Your wallet will be password protected and encrypted. Please, choose a strong password."), 
    [[this.genTextField("Wallet")], [this.genTextField("Password")], [this.genTextField("Confirm_password")]]) }
  validate() { let e = {};
    if (this.state.values.Password !== this.state.values.Confirm_password) { e["Password"] = "Passwords don't match"; e["Confirm_password"] = "Passwords don't match"; } 
    if (oS(this.state.values.Password).length < 8) e["Password"] = "Please use at least 8 characters";
    if (oS(this.state.values.Wallet).length < 1) e["Wallet"] = "Please choose a name for your wallet";
    return L(L(this.setErrors(e)) && L(this.state.values));
  }
}

class Enter_credentials extends ValidatableComp { constructor(p, s) { super(p, s, "Wallet Password"); }
  ren(p, s) { return formTable([[this.genTextField("Wallet")], [this.genTextField("Password")]]) }
  validate() { let e = {};
    if (oS(this.state.values.Password).length < 1) e["Password"] = "Please enter your password";
    if (oS(this.state.values.Wallet).length < 1) e["Wallet"] = "Please choose a wallet";
    return this.setErrors(e) && this.state.values;
  }
}

class Backup_seed extends ValidatableComp {
  validate() { return L(this.state.input); }
  setPrecedingResult(input) { L(`Backup_seed: precedingresult: ${S(input)}`); this.setState({ input }) }
  ren(p, s) {
    return <form noValidate autoComplete="off">
      {preamble("Backup seed", "Please write these 12 words down, in order, and keep them somewhere safe offline. With them you will be able to recover your wallet.", "Never give your seed keys to anyone, we will never ask you to share them with us.")}
      <SeedView /></form>;
  }
}

class Verify_seed extends ValidatableComp { constructor(p, s) { super(p, s, "seedView"); }
  setPrecedingResult(input) { L(`Verify_seed: precedingresult: ${S(input)}`); this.setState({ input }) }
  validate() { let sv = this.fers.seedView.current; return sv.checkWordsEqual(oA(oO(this.state.input).words)) && { words: sv.getWords() }; }
  ren(p, s) {
    return <form noValidate autoComplete="off">{preamble("Verify seed", "Your seed is very important! If your lose your seed your funds will be permantently lost.")}
      <SeedView ref={this.fers.seedView}/></form>;
  }
}

class Input_seed extends ValidatableComp { constructor(p, s) { super(p, s, "seedView"); }
  setPrecedingResult(input) { L(`Input_seed: precedingresult: ${S(input)}`); this.setState({ input }) }
  validate() { let sv = this.fers.seedView.current; return sv.checkWordsInList(bip39.wordlists.english) && { words: sv.getWords() }; } 
  ren(p, s) { return <form noValidate autoComplete="off">{preamble('Input seed', 'Restore your wallet from your previously backed up seed.', 'Never give your seed keys to anyone, we will never ask you to share them with us.')}
    <SeedView ref={this.fers.seedView}/></form>;
  }
} 

class Unlock_wallet extends Comp { ren(p, s) { return <TabTimeline tabs={{ Enter_credentials }} onAccept={this.props.onAccept} acceptText="Unlock"/>; } }
class Create_wallet extends Comp { ren(p, s) { return <TabTimeline tabs={{ Setup_password, Backup_seed, Verify_seed }} onAccept={this.props.onAccept}/>; } }
class Seed_Login extends Comp { ren(p, s) { return <TabTimeline tabs={{ Setup_password, Input_seed }} onAccept={this.props.onAccept}/>; } }

export class Log_in extends Comp { 
  ren(p, s) { return <TabbedView tabs={{ Unlock_wallet, Create_wallet, Seed_Login }} parentProps={{ onAccept: p.onAccept }}/>; } 
}