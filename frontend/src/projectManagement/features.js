import { L } from "../tools";

let mapFeature = ([name, subFeatures]) => ({ name, subFeatures: subFeatures && subFeatures.map(mapFeature) })

let features = mapFeature(["App", [
  ["Log in dialog", [
    ["Unlock wallet", [
      ["Header icon"],
      ["Title"],
      ["Text"],
      ["Enter wallet name", [
        ["Select name from available wallets"]
      ]],
      ["Enter password"]
    ]],
    ["Create wallet", [
      ["Header icon"],
      ["Setup password"],
      ["Backup seed"],
      ["Verify seed"],
    ]],
    ["Seed import", [
      ["Setup password"],
      ["Input seed"],
    ]]
  ]],
  ["Bitcoin wallet", [
    ["Transactions", [
      ["Deposits"],
      ["Withdrawals"]
    ]],
    ["Invest"],
    ["Withdraw"]
  ]],
  ["AMFEIX Fund", [
    ["Investment value", [
      ['']
    ]],
    ["ROI"],
    ["Fund index chart"],
    ["Investment value chart"],
    ["Transactions", [
      ["Deposits"],
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

export { features }