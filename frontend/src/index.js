import React from 'react'; import ReactDOM from 'react-dom';
import { App } from './app'
import * as serviceWorker from './serviceWorker';

let $ = (t, p) => { let e = document.createElement(t); p.appendChild(e); return e; }

ReactDOM.render((<React.StrictMode><App title="App" /></React.StrictMode>), $("div", document.body)); 
serviceWorker.unregister();
