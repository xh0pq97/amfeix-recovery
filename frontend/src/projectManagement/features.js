
// eslint-disable-next-line
import { L } from "../tools";
import { Persistent } from "../core/persistent"

let mapFeature = ([name, subFeatures]) => ({ name, subFeatures: subFeatures && subFeatures.map(mapFeature) })

let titleAndText = [["Title"], ["Text"]];
let featureList = mapFeature(["App", [
  ["Ensure user mode does not load data for all investors"],
  ["Fix bitcoin deposit list to not show duplicate deposits"],
  ["Log in page", [
    ["Unlock wallet", [["Header icon"], ...titleAndText, 
      ["Enter wallet name", [
        ["Select name from available wallets"]
      ]],
      ["Enter password"],
      ["Hide password"],
      ["Toggle password show/hide"]
  ]],
    ["Create wallet", [["Header icon"], 
      ["Setup password", [...titleAndText,
        ["Wallet name"],
        ["Password"],
        ["Confirm password"],
        ["Check password quality"],
        ["Check password is equal to confirmed password"],
        ["Hide password"],
        ["Toggle password show/hide"]
      ]],
      ["Backup seed", [...titleAndText,
        ["Show generated seed words"]
      ]],
      ["Verify seed", [...titleAndText,
        ["Enter seedwords"],
        ["Check if entered seed words match those generated"]
      ]],
    ]],
    ["Seed Login", [["Header icon"], ...titleAndText,
      ["Setup password", [...titleAndText,
      ]],
      ["Input seed", [...titleAndText,
      ]],
    ]]
  ]],
  ["Bitcoin wallet", [
    ["Transactions", [
      ["Deposits"],
      ["Withdrawals"]
    ]],
    ["Invest", [
      ["Show invest explanation"],
      ["Show qr code"],
      ["Show investment address"],
    ]],
    ["Confirm", [
      ["Confirm your investment", [
        ["Title"],
        ["Explanation"]
      ]],
      ["Review"],
      ["Done"]
    ]],
    ["Withdraw"]
  ]],
  ["AMFEIX Fund", [
    ["Investment value", [
      ['Convert to other currencies']
    ]],
    ["ROI"],
    ["Fund index chart"],
    ["Daily change"],
    ["AUM"],
    ["BTC Price"],
    ["Investment value chart"],
    ["Transactions", [
      ["Deposits", [
        ["Date"],
        ["Transaction ID"],
        ["Initial investment"],
      ]],
      ["Withdrawals"],
      ["Pending withdrawals"]
    ]],  
  ]],
  ['Profile', [
    ['KYC', [
      ['']
    ]]
  ]]
]])

class Features extends Persistent {
  constructor() { super("features", ["features"], { features: featureList }); }
}

let features = new Features();

export { features }