import React from 'react';
// eslint-disable-next-line
import { A, D, E, F, G, I, K, L, U, V, S, oA, oB, oF, oO, oS, isO, singleKeyObject } from '../common/tools';
// eslint-disable-next-line
import { List, ListItem, ListItemText, ListItemIcon, Hidden, Drawer, Stepper, Step, StepLabel, CircularProgress, TextField, Dialog, Box, Button, RadioGroup, Radio, FormControl, FormControlLabel, Tab, Tabs, Paper, Table, Typography, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter } from '@material-ui/core';
// eslint-disable-next-line
//import { HistoryIcon, AttachMoneyIcon, CallMadeIcon } from '@material-ui/icons';
import { btcToString, satoshiToBTCString } from '../core/satoshi';
import LockIcon from '@material-ui/icons/Lock';
import { captionIconMap } from './icons';
import { formatTimestamp } from './formatting'; 
import { BN } from '../core/bignumber'

let captionMap = {
  timestamp: "Time", value: "Value", txId: "Transaction ID", deposits: "Deposits", withdrawals: "Withdrawals", withdrawalRequests: "Withdrawal Requests", fundDepositAddresses: "Fund deposit addresses", feeAddresses: "Fee addresses", _: ""
};
//let displayFunctions = { timestamp: formatTimestamp };

let cleanText = s => oS(s).replace(/_/g, " ").trim();

class Comp extends React.Component {
  constructor(p, s, sors) { super(p); A(this, { state: {...s}, fers: {}, observers: [] }); this.initRefs(oS(sors)); }
  render() { return this.ren(this.props, this.state); }
  ren(p, s) { return <div/> }
  initRefs(spacedOutRefString) { this.fers = F(spacedOutRefString.split(" ").map(k => [k, React.createRef()])); }
  updateChildRef(newV) { if (D(this.props.childRef)) this.props.childRef.current = newV; }
  componentDidMount() { this.updateChildRef(this); }
  componentWillUnmount() { this.updateChildRef(U); for (let o of this.observers) o.detach(); this.unmounted = true; }
  setStateKV(k, v, onDone) { //L(`setStateKV(${k}, ${S(v)})`); 
  this.setState(singleKeyObject(k, v, onDone)) }
  addSyncKeyObserver(data, key, context) { this.addSyncObserver(data, key, d => { if (!this.unmounted) this.setStateKV(key, d) }, context); }
  addSyncObserver(data, key, onChange, context) { this.observers.push(data.syncCache.watch(key, onChange, context)); }
}  

class Selector extends Comp { constructor(p) { super(p); A(this.state, { selectedIx: 0 }); oF(p.onChanged)(this.state.selectedIx) }
  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) { return <FormControl component="fieldset"><RadioGroup row={p.horizontal || U} aria-label="" name="" value={s.selectedIx} onChange={e => this.setSelectedIx(L(parseInt(e.target.value)))}>
    {(oA(p.options).map((x, i) => <FormControlLabel key={i} value={i} label={x} control={<Radio />}/>))}</RadioGroup></FormControl> }
}  

function sort(a, comp) { return a.map((e, i) => [e, i]).sort((a, b) => (comp && comp(a[0], b[0])) || (a[1] - b[1])).map(e => e[0]); }
let styles = ({ visuallyHidden: { border: 0, clip: 'rect(0 0 0 0)', height: 1, margin: -1, overflow: 'hidden', padding: 0, position: 'absolute', top: 20, width: 1, }, });
let classes = styles;
class THead extends Comp {
  ren(p, s) {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = p;
    const createSortHandler = (property) => (event) => { onRequestSort(property, event); }; 
    return <TableHead><TableRow>
      {p.checkable ? <TableCell padding="checkbox"><Checkbox indeterminate={numSelected > 0 && numSelected < rowCount} checked={rowCount > 0 && numSelected === rowCount} onChange={onSelectAllClick} inputProps={{ 'aria-label': 'select all desserts' }} /></TableCell> : null}
      {oA(p.headers).map((h, i) => { let sortDirection = ['asc', 'desc', false][orderBy === i ? order : 2];
        return <TableCell key={i} align={h.alignCaption} padding={h.disablePadding ? 'none' : 'default'} sortDirection={sortDirection}>
          <TableSortLabel active={orderBy === i} direction={sortDirection || 'asc'} onClick={createSortHandler(i)}>
            {h.caption}{orderBy === i ? <span style={styles.visuallyHidden}>{order === 1 ? 'sorted descending' : 'sorted ascending'}</span> : null}
          </TableSortLabel>
        </TableCell>})}
    </TableRow></TableHead>;
  }
}
 
class ListView extends Comp {
  constructor(p) { super(p); this.state = { page: 0, rowsPerPage: 5, checked: {}, selectedIx: null, sortOrder: 0 }; } 
  ren(p, s) {
    let headers = p.headers || K(oO(oA(p.data)[0])).map(h => ({ label: h, caption: h }));
    let rows = oA(p.data).map((d, _id) => ({ _id, ...d }));
    if (D(s.sortColumn)) rows = rows.sort((a, b) => { let h = headers[s.sortColumn];
      let x = (h.compare || ((x, y) => (x === y ? 0 : (x < y ? -1 : 1))))(a[h.label], b[h.label]);
      return [x, -x][s.sortOrder];
    });
    let elimObjects = (d, h) => { if (isO(d)) { L(`${h} is an object: ${S(K(d))}`); } else return d; };
    let X = (d, f) => this.setState(d, () => { oF(p.onChange)(d); oF(f)(d); });
    let isChecked = d => s.checked[d.index], isSelected = d => s.selectedIx === d._id;
    let columnCount = headers.length + (p.checkable ? 1 : 0);
    let prevRowsPerPage = s.rowsPerPage;
    let offset = s.page * s.rowsPerPage, end = Math.min(rows.length, offset + s.rowsPerPage);//, emptyRows = offset + s.rowsPerPage - end;
    let dense = true, onRequestSort = sortColumn => { this.setState({ sortColumn, sortOrder: this.state.sortOrder ^ ((this.state.sortColumn === sortColumn) ? 1 : 0) })}; 
    return <TableContainer component={Box}><p>{p.caption || null}</p><Table className={classes.table} aria-labelledby={p.title} size={(dense ? 'small' : 'medium')} aria-label={p.title}>
        <THead headers={headers} classes={classes} checkable={p.checkable} numSelected={V(s.checked).filter(v => D(v)).length} order={s.sortOrder} orderBy={s.sortColumn} onSelectAllClick={() => { }} onRequestSort={onRequestSort} rowCount={rows.length} />
        <TableBody>{sort(rows).slice(offset, (s.page + 1) * s.rowsPerPage).map((d, i) => <TableRow key={i} hover onClick={() => X({ selectedIx: d._id })} aria-checked={isChecked(d)} tabIndex={-1} selected={isSelected(d)}>
          {p.checkable ? <TableCell padding="checkbox"><Checkbox checked={isChecked(d)} inputProps={{ 'aria-labelledby': i }} /></TableCell> : null}
          {headers.map((h, j) => <TableCell key={j} align={h.align || "center"}>{(h.displayFunc || I)(d[h.label], d)}</TableCell>)}
        </TableRow>)}</TableBody>
        <TableFooter><TableRow><TablePagination component={TableCell} colSpan={(columnCount - 1)} rowsPerPageOptions={[5, 10, 25, 50, 100, 250, 500, 1000]} count={rows.length} rowsPerPage={s.rowsPerPage} page={s.page} onChangePage={(e, page) => X({ page })} onChangeRowsPerPage={e => X({ rowsPerPage: parseInt(e.target.value, 10) }, d => X({ page: Math.min(Math.round(s.page*(prevRowsPerPage/d.rowsPerPage)), Math.floor((rows.length - 1)/d.rowsPerPage) )}))} /></TableRow></TableFooter>
      </Table></TableContainer>   
  }
}
 
class Sidebar extends Comp {
  ren(p, s) {  
    return <List>{E(p.tabs).map(([title, control], i) => { let color = p.value === i ? "secondary" : "primary";
      return <ListItem button onClick={() => oF(p.onChange)(U, i)} key={i}>{tabulize(0, [[
        <ListItemIcon>{(C => D(C) ? <C color={color}/> : null)(captionIconMap[title])}</ListItemIcon>, 
        <Typography color={color}>{cleanText(title)}</Typography>
      ]], [[{width: "2em"}, U]])}</ListItem>})}
    </List>; 
  }
}

class TabbedView extends Comp { constructor(p) { super(p, { selectedTabIx: 0 }); this.fers.visibleTab = {}; }
  getVisibleTab() { return this.fers.visibleTab.current; }
  ren(p, s) {let selTabIx = (D(p.selectedTabIx) ? p.selectedTabIx : s.selectedTabIx) || 0;
    let TabsControl = D(p.tabsControl) ? p.tabsControl : U;
    let horizontal = p.horizontal;
    let tabsProps = { value: selTabIx, onChange: (e, selectedTabIx) => this.setState({ selectedTabIx }, oF(p.onChangeSelectedTabIx)(selectedTabIx)) };
    let tabs = p.TabsControl ? p.TabsControl(tabsProps) : <Tabs indicatorColor="primary" textColor="primary" {...tabsProps} aria-label="tabs" centered>{E(p.tabs).map(([title, control], i) => <Tab key={i} label={cleanText(title)} disabled={(oO(p.tabProps)[title])}/>)}</Tabs>;
    //L(`TabbedView: pp: ${S(p.parentProps)}`)
    let activeTab = K(p.tabs).length > 0 ? React.createElement(V(p.tabs)[selTabIx], ({...p.parentProps, childRef: this.fers.visibleTab})) : null;
    return tabulize(0, horizontal ? [[tabs, activeTab]] : [[tabs], [activeTab]], horizontal ? [[{width: "13em", verticalAlign: "top"}, U]] : [[U], [U]]);
  }
}

let button = (caption, onClick, color) => <Button variant="contained" color={["primary", "secondary"][color || 0]} onClick={onClick}>{caption}</Button>

class TabTimeline extends Comp { constructor(p) { super(p, { selectedTabIx: 0 }); this.fers.tabbedView = React.createRef(); this.fers.visibleTab = {}; }
  getTabbedView() { return this.fers.tabbedView.current; } 
  getVisibleTab() { return this.fers.visibleTab.current; }
  ren(p, s) { let last = (i, o) => (i === (K(o).length - 1));
    let f = o => G(o, (V, k, i) => () => tabulize(1/2, [[<Box><V {...p.parentProps} childRef={this.fers.visibleTab}/></Box>], [<Box>{tabulize(1/2, [[
      p.onCancel && button("Cancel", oF(p.onCancel)), 
      (i > 0) && button("Start over", () => this.setState({ selectedTabIx: 0 })),
      !last(i, o) && button("Next", () => { let r = this.getVisibleTab().validate(); if (r) { 
        this.setState(L({ selectedTabIx: s.selectedTabIx + 1 }), () => (t => oF(t.setPrecedingResult).bind(t)(r))(this.getVisibleTab())); 
      }}),
      last(i, o) && button(p.acceptText || "Finish", () => { let vt = this.getVisibleTab(); if (vt) { let r = vt.validate(); L(`>> r = ${S(r)}`); if (L(r)) oF((p.onAccept))(r); } })
    ].filter(I)])}</Box>]]));
    //L(`TabTimeLine:: ${S(p.parentProps)}`);
    return <TabbedView onChangeSelectedTabIx={selectedTabIx => this.setState({selectedTabIx})} selectedTabIx={s.selectedTabIx} ref={this.fers.tabbedView} tabs={f(oO(p.tabs))} tabProps={G((p.tabs), (v, k, i) => (i !== (s.selectedTabIx)))} parentProps={p.parentProps}/>
  }
}

class TabTimelineNew extends Comp { constructor(p) { super(p, { selectedTabIx: 0 }); this.fers.visibleTab = {}; }
  ren(p, s) { let C = V(p.tabs)[s.selectedTabIx];
    return K(p.tabs).length === 1 ? <C childRef={this.fers.visibleTab} {...p.parentProps}/> :
    <><Stepper activeStep={s.selectedTabIx} alternativeLabel>{K(oO(p.tabs)).map(label => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}</Stepper>
    <C childRef={this.fers.visibleTab} {...p.parentProps}/>
    </>
  }
}

class ValidatableComp extends Comp {
  constructor(p, s, fers) { super(p, { values: {}, errors: {}, ...s }, fers);  }
  setErrors(errors) { this.setState({ errors }, () => L(`New errors = ${S(this.state.errors)}`)); return (((K(errors).filter(I)).length) === 0); } 
  validate() { return true; }
  genTextField(k, p) { let s = this.state; return <TextField error={(D(s.errors[k]))} variant="outlined" ref={this.fers[k]} id={k} label={cleanText(k)} onChange={e => this.setState({ values: { ...s.values, ...singleKeyObject(k, e.target.value)}})} value={oS(s.values[k])} {...p} helperText={s.errors[k] || oO(p).helperText}/> }
}

let tabulize = (borderSpacing, cells, cellStyles) => <table style={{borderSpacing: `${borderSpacing || 0}em`}}><tbody>{cells.map((r, i) => <tr key={i}>{r.map((c, j) => 
  <td key={j} style={cellStyles && oO(oA(oA(cellStyles)[i])[j])}>{c}</td>)}</tr>)}</tbody></table> 
let formTable = cells => tabulize(1.5, cells)
let form = (preamble, cells) => <form noValidate autoComplete="off">{preamble}{formTable(cells)}</form>

class DialogWrap extends Comp { //constructor(p, s) { super(p, {...s, open: false}); }
//  show() { this.setState({ open: true }); }
  ren(p, s) { 
    //L(`DialogWrap parentProps = ${S(p.parentProps)}`)
    let C = p.comp; let id = cleanText(p.id);
    return <Dialog aria-labelledby={id} open={p.open} onClose={() => { oF(p.onClose)(); this.setState({ open: false }); }}><h2>{id}</h2>
      <C {...p.parentProps} onCancel={p.onCancel} onAccept={p.onAccept}/></Dialog> }
} 

class OpenDialogButton extends Comp { constructor(p, s) { super(p, { ...s, open: false }); }
  ren(p, s) { return <>{button(cleanText(p.id), () => this.setState({ open: true }))}
    <DialogWrap open={s.open} comp={p.comp} id={p.id} onAccept={d => { p.onAccept(d); this.setState({ open: false }); }} onCancel={() => { oF(p.onCancel)(); this.setState({ open: false }); }} parentProps={p.parentProps}/></> }
}
 
class GetPasswordView extends ValidatableComp {
  constructor(p, s) { super(p, s, "Password"); }
  ren(p, s) { return formTable([[preamble("Please enter your password to confirm", `Enter the password for wallet '${p.walletName}'`)], [<LockIcon fontSize={"large"}/>], 
    [this.genTextField("Password", { type: "password" })]]) }
  validate() { return this.state.values; }
}

class GetPasswordDialog extends Comp { //constructor(p, s) { super(p, s, "dlg"); }
  ren(p, s) { return <DialogWrap open={oB(p.open)} comp={() => <TabTimeline tabs={{GetPasswordView}} walletName={p.walletName} onAccept={p.onAccept} onCancel={p.onCancel} />}/> }
}

class ProgressDialog extends Comp { ren(p, s) { let id = cleanText(p.title); 
  return <Dialog aria-labelledby={id} open={p.open} onClose={oF(p.onClose)}><h2>{cleanText(id)}</h2>{tabulize(3, [[<CircularProgress  value={p.progress} />]])}</Dialog> 
} }

let testModeComp = (testMode, C) => (testMode ? <div style={{borderStyle: "dashed", borderWidth: "1px", borderRadius: `0.333em`, borderColor: '#7A7'}}><C/></div> : null)

let wrapEllipsisDiv = v => <div style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>{v}</div>;
let newTabRef = (link, caption) => <a target="_blank" rel="noopener noreferrer" href={link}>{caption}</a>;
let aLink = (src, caption) => wrapEllipsisDiv(newTabRef(src, caption)); 
let extractHeaders = d => F(K(oO(oA(d)[0])).map(h => [h, { label: h, caption: h }]));
let genHeaders = d => applyListHeaders(extractHeaders(d), commonTableHeaders);

let applyListHeaders = (h, mods)  => { E(mods).forEach(([k, v]) => A(oO(h[k]), v)); return h; };

let compareStrings = (a, b) => a.localeCompare(b);
let compareBNs = (a, b) => a.isLessThan(b); 
let commonDataTypes = {
  btcAddress: { caption: "BTC address", displayFunc: v => aLink(`https://www.blockchain.com/en/btc/address/${v}`, v), compare: compareStrings },
  ethAddress: { caption: "ETH address", displayFunc: v => aLink(`https://etherscan.io/address/${v}`, v), compare: compareStrings },
  btcTx: { caption: "Bitcoin transaction", displayFunc: v => aLink(`https://www.blockchain.com/en/btc/tx/${v}`, v), compare: compareStrings },
  pubKey: { caption: "Public key", displayFunc: wrapEllipsisDiv, compare: compareStrings },
  status: { caption: "Status", displayFunc: cleanText, compare: compareStrings },
  btcSatoshis: { caption: "Amount (BTC)", align: "right", alignCaption: "right", displayFunc: x => satoshiToBTCString(x), compare: compareBNs },
  btc: { caption: "Amount (BTC)", align: "right", alignCaption: "right", displayFunc: x => btcToString(x), compare: compareBNs }
}
let commonTableHeaders = G({ txId: { type: "btcTx" }, btcAddress: { type: "btcAddress" }, ethAddress: { type: "ethAddress" }, pubKey: { type: "pubKey" }, satoshiBN: { type: "btcSatoshis" }, finalValue: { type: "btcSatoshis" }, value: { type: "btcSatoshis" }, status: { type: "status" }, 
  fundDepositAddress: { caption: "Fund deposit address", type: "btcAddress"}, 
  fromPubKey: { caption: "From public key", type: "pubKey" }, fromBtcAddress: { caption: "From BTC address", type: "btcAddress" },
  derivedEthAddress: { caption: "Derived ETH Address", type: "ethAddress" }, 
  timestamp: { caption: "Time", align: "left", alignCaption: "left", displayFunc: formatTimestamp },
}, v => ({...(D(v.type) ? commonDataTypes[v.type] : {}), ...v}));
 
let applyHeaders = h => applyListHeaders(h, {
  //  txId: { caption: "BTC Transaction", displayFunc: displayBtcTransaction },
    name: { caption: "Wallet name" },
    privateKey: { caption: "Encrypted Private Key", displayFunc: wrapEllipsisDiv },
    chainCode: { caption: "Encrypted Chain Code", displayFunc: wrapEllipsisDiv },
    publicKey: { caption: "Public Key", displayFunc: wrapEllipsisDiv },
    btcAddress: { caption: "Bitcoin Wallet Address", displayFunc: wrapEllipsisDiv },
    ethAddress: { caption: "Ethereum Investor address", displayFunc: wrapEllipsisDiv },
  //  value: { caption: "Amount (BTC)", align: "right", alignCaption: "right" }
  });
    
let preamble = (title, text, warning) => <><h2 style={{textAlign: "left"}}>{title}</h2><p style={{textAlign: "left"}}>{text}</p><p style={{textAlign: "left", color: "#FF2170"}}>{warning}</p></>;
let loadingComponent = (data, c) => D(data) ? c  : tabulize(5, [[<CircularProgress/>]]);

let dataSummary = (n, data) => (d => tabulize(1/3, [[`Number of pending ${n}s:`, d.length], [`Total ${n} value:`, satoshiToBTCString(d.reduce((p, c) => p.plus((c.satoshiBN)), BN(0)))],
  [`Time of first ${n}:`, formatTimestamp(d.reduce((p, c) => D(p) ? Math.min(p, c.timestamp) : c.timestamp, U))],
  [`Time of last ${n}:`, formatTimestamp(d.reduce((p, c) => D(p) ? Math.max(p, c.timestamp) : c.timestamp, U))]
]))(oA(data))

export { dataSummary, testModeComp, GetPasswordDialog, preamble, loadingComponent, commonTableHeaders, applyListHeaders, extractHeaders, genHeaders, wrapEllipsisDiv, Sidebar, Comp, ValidatableComp, DialogWrap, ProgressDialog, ListView as List, TabbedView, Selector, captionMap, OpenDialogButton, cleanText, TabTimeline, button, tabulize, formTable, form, commonDataTypes }