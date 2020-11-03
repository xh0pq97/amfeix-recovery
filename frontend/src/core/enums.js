import { V, makeEnum, singleKeyObject } from '../tools'

let EUserMode = makeEnum("User Admin");
let EDeveloperMode = makeEnum("Production Developer");
let EPallette = makeEnum("Default Dark Light");

let enumDefault = x => V(x)[0];
let enumDefObj = x => singleKeyObject(enumDefault(x), true);

export { EPallette, EUserMode, EDeveloperMode, enumDefault, enumDefObj }