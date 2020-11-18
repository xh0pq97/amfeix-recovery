import ganache from 'ganache-core';
import Web3 from 'web3';
import { K, L, S } from './tools.mjs';
import BN from 'bn.js';
//import amfeixCjson from './amfeixC.json';  

let amfeixOwner = "0xADBfBEd800B49f84732F6D95fF5C924173C2C06A";
let balance = (new BN(10)).pow(new BN(18)).muln(100);
let server = ganache.server({ verbose: true, fork: 'http://172.17.0.2:8545/', blockTime: 10, default_balance_ether: balance, accounts: [{ balance }], unlocked_accounts: [amfeixOwner], logger: console });
let provider = server.provider;
L('a');
L({manager: K(provider.manager)})
L({state: K(provider.manager.state)})
L({accounts: S(provider.manager.state.accounts)})
L({personal_accounts: K(provider.manager.state.personal_accounts)})
L({unlocked_accounts: S(provider.manager.state.unlocked_accounts)})
 
L(`args = ${process.argv}`);
/*
let web3 = new Web3(provider); 
let amfeixC = new web3.eth.Contract(amfeixCjson.abi); 
;
L({ accounts: K(web3.accounts) });
L({ accounts: K(web3.eth.accounts) });
L({ accounts: K(ganache.accounts) });
let deployedAmfeixC = await amfeixC.deploy({ data: amfeixCjson.bytecode }).send({ from: web3.eth.accounts[0] });
L(`deployedAmfeixCK = ${K(deployedAmfeixC)}`);
let amfeixM = new web3.eth.Contract(amfeixCjson.abi, deployedAmfeixC.address).methods;
L(`amfeixM K = ${K(amfeixM)}`);

let owner = await amfeixM.owner().call()
;
L({owner});
*/
//      let web3 = new Web3(ganache.provider({ fork: "http://localhost:80" }));
//ganache.provider(); 
  
L('b');

let web3 = new Web3(provider);
(async () => { L({blockNumber: await web3.eth.getBlockNumber()}); })();
//web3.eth.sendTransaction(L({ from: K(provider.manager.state.accounts)[0], to: amfeixOwner, value: balance.divn(2) }));

server.listen(9656, function(err, blockchain) {
   if (err !== null) { L(`Ganache error: ${S(err)}\nBlockchain: ${K(blockchain)}`); } 
   else {
    L(`Ganache started: with options ${S((blockchain.options))}`);
    L(`VM: ${((blockchain.vm))}`);
  }
});  

/*
nache started: [\"options\",\"blockchain\",\"vm\",\"stateTrie\",\"accounts\",\"secure\",\"account_passwords\",\"personal_accounts\",\"total_accounts\",\"coinbase\",\"latest_filter_id\",\"action_queue\",\"action_processing\",\"snapshots\",\"logger\",\"net_version\",\"mnemonic\",\"wallet\",\"wallet_hdpath\",\"gasPriceVal\",\"is_mining\",\"blockTime\",\"is_mining_on_interval\",\"mining_interval_timeout\",\"_provider\",\"unlocked_accounts\"]"
*/ 