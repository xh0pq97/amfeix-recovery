import { L, V, makeEnum, singleKeyObject } from '../common/tools'

let EUserMode = makeEnum("Admin User");
let EDeveloperMode = makeEnum("Production Developer");
let EPallette = makeEnum("Default Dark Light");
let ETransactionType = makeEnum("Outgoing Incoming Investment");

let enumDefault = x => V(x)[0];
let enumDefObj = x => singleKeyObject(enumDefault(x), true);
L({ETransactionType})

export { EPallette, EUserMode, EDeveloperMode, ETransactionType, enumDefault, enumDefObj }