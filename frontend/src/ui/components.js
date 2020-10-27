import React from 'react';
import { A, D, E, F, I, K, L, U, V, S, oA, oF, oO, oS, singleKeyObject } from '../tools';
import { Box, Button, RadioGroup, Radio, FormContolLabel, FormControl, FormControlLabel, Tab, Tabs, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter, withStyles } from '@material-ui/core';

let captionMap = {
  timestamp: "Time", value: "Value", txId: "Transaction ID", deposits: "Deposits", withdrawals: "Withdrawals", withdrawalRequests: "Withdrawal Requests", fundDepositAddresses: "Fund deposit addresses", feeAddresses: "Fee addresses", _: ""
};
//let displayFunctions = { timestamp: formatTimestamp };

let removeUnderscores = s => oS(s).replace(/_/g, " ");

class Comp extends React.Component {
  constructor(p, s) { super(p); A(this, { state: {...s}, fers: {}, observers: [] }); }
  render() { return this.ren(this.props, this.state); }
  initRefs(spacedOutRefString) { this.fers = F(spacedOutRefString.split(" ").map(k => [k, React.createRef()])); }
  updateChildRef(newV) { if (D(this.props.childRef)) this.props.childRef.current = newV; }
  componentDidMount() { this.updateChildRef(this); }
  componentWillUnmount() { this.updateChildRef(U); for (let o of this.observers) o.detach(); }
  setStateKV(k, v, onDone) { this.setState(singleKeyObject(k, v, onDone)) }
  addSyncKeyObserver(data, key, context) { this.addSyncObserver(data, key, d => this.setStateKV(key, d), context); }
  addSyncObserver(data, key, onChange, context) { this.observers.push(data.syncCache.watch(key, onChange, context)); }
} 

class FunComp extends Comp {
  constructor(f) { super(); this.fers.childRef = {}; this.f = f; }
  ren(p, s) { return (C => <C childRef={this.fers.childRef}/>)(this.f()); }
}
let FunC = f => new FunComp(f);

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

let nullArray = length => { let r = []; for (let q = 0; q < length; ++q) r.push(null); return r; }
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
    return <TableContainer component={Paper}><p>{p.caption || null}</p><Table className={classes.table} aria-labelledby={p.title} size={(dense ? 'small' : 'medium')} aria-label={p.title}>
        <THead headers={headers} classes={classes} checkable={p.checkable} numSelected={V(s.checked).filter(v => D(v)).length} order={order} orderBy={orderBy} onSelectAllClick={() => { }} onRequestSort={onRequestSort} rowCount={rows.length} />
        <TableBody>{sort(rows).slice(offset, (s.page + 1) * s.rowsPerPage).map((d, i) => <TableRow key={i} hover onClick={() => X({ selectedIx: d._id })} aria-checked={isChecked(d)} tabIndex={-1} selected={isSelected(d)}>
          {p.checkable ? <TableCell padding="checkbox"><Checkbox checked={isChecked(d)} inputProps={{ 'aria-labelledby': i }} /></TableCell> : null}
          {headers.map((h, j) => <TableCell key={j} align={h.align || "center"}>{(h.displayFunc || I)(d[h.label], d)}</TableCell>)}
        </TableRow>)}</TableBody>
        <TableFooter>
      <TableRow><TablePagination component={TableCell} colSpan={L(columnCount - 1)} rowsPerPageOptions={[5, 10, 25]} count={rows.length} rowsPerPage={s.rowsPerPage} page={s.page} onChangePage={(e, page) => X({ page })} onChangeRowsPerPage={e => X({ rowsPerPage: parseInt(e.target.value, 10) })} /></TableRow></TableFooter>
      </Table></TableContainer>   
  }
}

let expandTabs = I;//o => F(E(o).map(([k, V]) => [k, V]));

class TabbedView extends Comp { constructor(p) { super(p); this.fers.visibleTab = {}; }
  componentDidMount() { super.componentDidMount(); this.setSelectedTabIx(0); }
  setSelectedTabIx(selectedTabIx, onDone) { this.setState({ selectedTabIx }, onDone); }
  getVisibleTab() { L(`gvt = ${K(this.fers.visibleTab)}:${S(this.fers.visibleTab)}`); return this.fers.visibleTab.current; }
  ren(p, s) { return <Paper>
    <Tabs value={s.selectedTabIx || 0} indicatorColor="primary" textColor="primary" onChange={(e, selectedTabIx) => this.setState({ selectedTabIx })} aria-label="tabs" centered>{E(p.tabs).map(([title, control], i) => <Tab key={i} label={removeUnderscores(title)} />)}</Tabs>
    {React.createElement(V(expandTabs(p.tabs))[s.selectedTabIx || 0], {...p.parentProps, childRef: this.fers.visibleTab})}
  </Paper>; }
}

let button = (caption, onClick) => <Button variant="contained" color="primary" onClick={onClick}>{caption}</Button>

class TabTimeline extends Comp { constructor(p) { super(p); this.fers.tabbedView = React.createRef();  this.fers.visibleTab = {}; }
  getTabbedView() { return this.fers.tabbedView.current; } 
  getVisibleTab() { return this.fers.visibleTab.current; }
  setSelectedTabIx(i, onDone) { this.getTabbedView().setSelectedTabIx(i, onDone); }
  ren(p, s) { let last = (i, o) => (i === (K(o).length - 1));
    let f = o => F(E(o).map(([k, V], i) => [k, () => <><Box><V childRef={this.fers.visibleTab}/></Box><Box>
      {(i > 0) && button("Start over", () => this.setSelectedTabIx(0))}
      {!last(i, o) && button("Next", () => { let r = this.getVisibleTab().validate(); if (r) { 
        this.setSelectedTabIx(L(this.getTabbedView().state.selectedTabIx + 1), () => (t => oF(t.setPrecedingResult).bind(t)(r))(this.getVisibleTab())); 
      }})} 
      {last(i, o) && button("Finish", () => { let r = this.getVisibleTab().validate(); L(`>> r = ${S(r)}`); if (r) oF(this.props.onAccept)(r); })} 
    </Box></>]));
    return <TabbedView ref={this.fers.tabbedView} tabs={f(p.tabs)} parentProps={p.parentProps}/>
  }
}

export { Comp, List, TabbedView, Selector, captionMap, removeUnderscores, TabTimeline, button }