import React from 'react';
import { Box, TextField } from '@material-ui/core';
import { Comp, TabbedView, TabTimeline, button  } from './components'; 
import { A, D, E, F, H, I, K, L, S, U, V, oA, oF, oO, oS, asA, singleKeyObject } from '../tools'; 

class Account extends Comp { ren(p, s) { return <p>{S(p.wallet)}</p> } }
class History extends Comp { ren(p, s) { return <Box/> } }
class Invest extends Comp { ren(p, s) { return <Box/> } }
class Withdraw extends Comp { ren(p, s) { return <Box/> } }

export class Bitcoin_Wallet extends Comp { ren(p, s) { return <TabbedView tabs={{ Account, History, Invest, Withdraw }} parentProps={{ wallet: p.wallet }}/>; } }
