import React from 'react';
import { A, D, E, F, G, I, K, L, U, V, S, oA, oF, oO, oS, singleKeyObject } from '../tools';
import { CircularProgress, TextField, Dialog, Box, Button, RadioGroup, Radio, FormControl, FormControlLabel, Tab, Tabs, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter } from '@material-ui/core';
import { HistoryIcon, AttachMoneyIcon, CallMadeIcon } from '@material-ui/icons';

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
  setStateKV(k, v, onDone) { this.setState(singleKeyObject(k, v, onDone)) }
  addSyncKeyObserver(data, key, context) { this.addSyncObserver(data, key, d => this.setStateKV(key, d), context); }
  addSyncObserver(data, key, onChange, context) { this.observers.push(data.syncCache.watch(key, onChange, context)); }
}  

class Selector extends Comp { constructor(p) { super(p); A(this.state, { selectedIx: 0 }); oF(p.onChanged)(this.state.selectedIx) }
  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) { return <FormControl component="fieldset"><RadioGroup aria-label="" name="" value={s.selectedIx} onChange={e => this.setSelectedIx(L(parseInt(e.target.value)))}>
    {(oA(p.options).map((x, i) => <FormControlLabel key={i} value={i} label={x} control={<Radio />}/>))}</RadioGroup></FormControl> }
}  

function sort(a, comp) { return a.map((e, i) => [e, i]).sort((a, b) => (comp && comp(a[0], b[0])) || (a[1] - b[1])).map(e => e[0]); }
let styles = ({ visuallyHidden: { border: 0, clip: 'rect(0 0 0 0)', height: 1, margin: -1, overflow: 'hidden', padding: 0, position: 'absolute', top: 20, width: 1, }, });
let classes = styles;
class THead extends Comp {
  ren(p, s) {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = p;
    const createSortHandler = (property) => (event) => { onRequestSort(event, property); }; 
    return <TableHead><TableRow>
      {p.checkable ? <TableCell padding="checkbox"><Checkbox indeterminate={numSelected > 0 && numSelected < rowCount} checked={rowCount > 0 && numSelected === rowCount} onChange={onSelectAllClick} inputProps={{ 'aria-label': 'select all desserts' }} /></TableCell> : null}
      {oA(p.headers).map((h, i) => <TableCell key={i} align={h.alignCaption} padding={h.disablePadding ? 'none' : 'default'} sortDirection={orderBy === i ? order : false}>
        <TableSortLabel active={orderBy === i} direction={orderBy === i ? order : 'asc'} onClick={createSortHandler(i)}>
          {h.caption}{orderBy === i ? <span style={styles.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span> : null}
        </TableSortLabel>
      </TableCell>)}
    </TableRow></TableHead>;
  }
}
 
class List extends Comp {
  constructor(p) { super(p); this.state = { page: 0, rowsPerPage: 5, checked: {}, selectedIx: null }; } 
  ren(p, s) {
    let headers = p.headers || K(oO(oA(p.data)[0])).map(h => ({ label: h, caption: h }));
    let rows = oA(p.data).map((d, _id) => ({ _id, ...d }));
    let X = d => this.setState(d, oF(p.onChange)(d));
    let isChecked = d => s.checked[d.index], isSelected = d => s.selectedIx === d._id;
    let columnCount = headers.length + (p.checkable ? 1 : 0);
    let offset = s.page * s.rowsPerPage, end = Math.min(rows.length, offset + s.rowsPerPage);//, emptyRows = offset + s.rowsPerPage - end;
    let dense = true, order = "asc", orderBy = 0, onRequestSort = () => { }; 
    return <TableContainer component={Box}><p>{p.caption || null}</p><Table className={classes.table} aria-labelledby={p.title} size={(dense ? 'small' : 'medium')} aria-label={p.title}>
        <THead headers={headers} classes={classes} checkable={p.checkable} numSelected={V(s.checked).filter(v => D(v)).length} order={order} orderBy={orderBy} onSelectAllClick={() => { }} onRequestSort={onRequestSort} rowCount={rows.length} />
        <TableBody>{sort(rows).slice(offset, (s.page + 1) * s.rowsPerPage).map((d, i) => <TableRow key={i} hover onClick={() => X({ selectedIx: d._id })} aria-checked={isChecked(d)} tabIndex={-1} selected={isSelected(d)}>
          {p.checkable ? <TableCell padding="checkbox"><Checkbox checked={isChecked(d)} inputProps={{ 'aria-labelledby': i }} /></TableCell> : null}
          {headers.map((h, j) => <TableCell key={j} align={h.align || "center"}>{(h.displayFunc || I)(d[h.label], d)}</TableCell>)}
        </TableRow>)}</TableBody>
        {oA(p.data).length > 5 ? <TableFooter><TableRow><TablePagination component={TableCell} colSpan={L(columnCount - 1)} rowsPerPageOptions={[5, 10, 25]} count={rows.length} rowsPerPage={s.rowsPerPage} page={s.page} onChangePage={(e, page) => X({ page })} onChangeRowsPerPage={e => X({ rowsPerPage: parseInt(e.target.value, 10) })} /></TableRow></TableFooter> : null}
      </Table></TableContainer>   
  }
}
 
class TabbedView extends Comp { constructor(p) { super(p, { selectedTabIx: 0 }); this.fers.visibleTab = {}; }
  getVisibleTab() { return this.fers.visibleTab.current; }
  ren(p, s) {let selTabIx = (D(p.selectedTabIx) ? p.selectedTabIx : s.selectedTabIx) || 0;
    return <><Tabs value={selTabIx} indicatorColor="primary" textColor="primary" onChange={(e, selectedTabIx) => this.setState({ selectedTabIx }, oF(p.onChangeSelectedTabIx)(selectedTabIx))} aria-label="tabs" centered>{E(p.tabs).map(([title, control], i) => <Tab key={i} label={cleanText(title)} disabled={(oO(p.tabProps)[title])}/>)}</Tabs>
    {React.createElement(V(p.tabs)[selTabIx], {...p.parentProps, childRef: this.fers.visibleTab})}
  </> }
}

let button = (caption, onClick, color) => <Button variant="contained" color={["primary", "secondary"][color || 0]} onClick={onClick}>{caption}</Button>

class TabTimeline extends Comp { constructor(p) { super(p, { selectedTabIx: 0 }); this.fers.tabbedView = React.createRef(); this.fers.visibleTab = {}; }
  getTabbedView() { return this.fers.tabbedView.current; } 
  getVisibleTab() { return this.fers.visibleTab.current; }
  ren(p, s) { let last = (i, o) => (i === (K(o).length - 1));
    let f = o => G(o, (V, k, i) => () => tabulize(1/2, [[<Box><V childRef={this.fers.visibleTab}/></Box>], [<Box>{tabulize(1/2, [[
      p.onCancel && button("Cancel", oF(p.onCancel)), 
      (i > 0) && button("Start over", () => this.setState({ selectedTabIx: 0 })),
      !last(i, o) && button("Next", () => { let r = this.getVisibleTab().validate(); if (r) { 
        this.setState(L({ selectedTabIx: s.selectedTabIx + 1 }), () => (t => oF(t.setPrecedingResult).bind(t)(r))(this.getVisibleTab())); 
      }}),
      last(i, o) && button(p.acceptText || "Finish", () => { let vt = this.getVisibleTab(); if (vt) { let r = vt.validate(); L(`>> r = ${S(r)}`); if (L(r)) oF((p.onAccept))(r); } })
    ].filter(I)])}</Box>]]));
    return <TabbedView onChangeSelectedTabIx={selectedTabIx => this.setState({selectedTabIx})} selectedTabIx={s.selectedTabIx} ref={this.fers.tabbedView} tabs={f(oO(p.tabs))} tabProps={G((p.tabs), (v, k, i) => (i !== (s.selectedTabIx)))} parentProps={p.parentProps}/>
  }
}

class ValidatableComp extends Comp {
  constructor(p, s, fers) { super(p, { values: {}, errors: {}, ...s }, fers);  }
  setErrors(errors) { this.setState({ errors }, () => L(`New errors = ${S(this.state.errors)}`)); return (((K(errors).filter(I)).length) === 0); } 
  validate() { return true; }
  genTextField(k, p) { let s = this.state; return <TextField error={(D(s.errors[k]))} variant="outlined" ref={this.fers[k]} id={k} label={cleanText(k)} onChange={e => this.setState({ values: { ...s.values, ...singleKeyObject(k, e.target.value)}})} {...p} helperText={s.errors[k] || oO(p).helperText}/> }
}

let tabulize = (borderSpacing, cells) => <table style={{borderSpacing: `${borderSpacing || 0}em`}}><tbody>{cells.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table> 
let formTable = cells => tabulize(1.5, cells)
let form = (preamble, cells) => <form noValidate autoComplete="off">{preamble}{formTable(cells)}</form>

class DialogWrap extends Comp { constructor(p, s) { super(p, {...s, open: false}); }
  show() { this.setState({ open: true }); }
  ren(p, s) { let C = p.comp; let id = cleanText(p.id);
    return <Dialog aria-labelledby={id} open={s.open} onClose={() => { oF(p.onClose)(); this.setState({ open: false }); }}><h2>{id}</h2>
      <C onCancel={() => { oF(p.onCancel)(); this.setState({ open: false }); }} onAccept={d => { this.setState(({ open: false }), () => oF(p.onAccept)(d)); }}/></Dialog> }
} 

class OpenDialogButton extends Comp { constructor(p, s) { super(p, s, "dlg"); }
  ren(p, s) { return <>{button(cleanText(p.id), () => this.fers.dlg.current.show())}<DialogWrap ref={this.fers.dlg} comp={p.comp} id={p.id} onAccept={p.onAccept} onCancel={p.onCancel}/></> }
}

class ProgressDialog extends Comp { ren(p, s) { let id = cleanText(p.title); 
  return <Dialog aria-labelledby={id} open={p.open} onClose={oF(p.onClose)}><h2>{cleanText(id)}</h2>{tabulize(3, [[<CircularProgress  value={p.progress} />]])}</Dialog> 
} }

let wrapEllipsisDiv = v => <div style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>{v}</div>;
let displayBtcTransaction = v => <>{wrapEllipsisDiv(<a href={`https://www.blockchain.com/en/btc/tx/${v}`}>{v}</a>)}</>;
let displayBtcAddress = v => <>{wrapEllipsisDiv(<a href={`https://www.blockchain.com/en/btc/address/${v}`}>{v}</a>)}</>;

let applyListHeaders = (h, mods)  => { E(mods).forEach(([k, v]) => A(oO(h[k]), v)); return h; };

export { applyListHeaders, wrapEllipsisDiv, displayBtcTransaction, displayBtcAddress, Comp, ValidatableComp, DialogWrap, ProgressDialog, List, TabbedView, Selector, captionMap, OpenDialogButton, cleanText, TabTimeline, button, tabulize, formTable, form }