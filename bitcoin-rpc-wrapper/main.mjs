import express from "express"; //import bodyParser from "body-parser"; import fetch from "node-fetch";
import dotenv from "dotenv"; import request from "request";
//const rpcMethods = require("./routes/api");

dotenv.config(); const cfg = process.env; 
const app = express();
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const url = `http://${cfg.rpcuser}:${cfg.rpcpassword}@127.0.0.1:8332/`;
const headers = { "content-type": "text/plain;" };

//let getMethods = "getblockcount getbestblockhash getconnectioncount getdifficulty getblockchaininfo getmininginfo getpeerinfo getrawmempool".split(" ");
let getMethods = "getblockcount getconnectioncount getdifficulty getblockchaininfo".split(" ");
let postMethods = "getrawtransaction".split(" ");

let generateCall = (method) => (req, ans) => { let params = req.body && req.body.params;
  const data = {jsonrpc: "1.0", id: 0, method, params };
  console.log("Params = " + JSON.stringify(params));
  console.log("Body = " + JSON.stringify(req.body));
  let options = ({ headers, url, method: "POST", 
  //    mode: 'cors', // no-cors, *cors, same-origin
  //    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  //    credentials: 'same-origin', // include, *same-origin, omit 
  //    redirect: 'follow', // manual, *follow, error
  //    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
 
//    console.log(options); 
    request(options, (err, r, body) =>  { console.log(body); ans.send((!err  && r.statusCode == 200) ? JSON.parse(body) : ({ err, body }))});  
//  res.send((await fetch(url, options)).json());
};

getMethods.forEach(method => app.get(`/${method}/`, generateCall(method)));
postMethods.forEach(method => app.post(`/${method}/`, generateCall(method)));

(p => app.listen(p, () => console.log(`Server running on port ${p}`)))(cfg.port = cfg.port || 4444)