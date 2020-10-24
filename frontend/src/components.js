import React from 'react';
import { A, D, E, F, K, L, V, oA, oO, oF, singleKeyObject } from './tools';
import { RadioGroup, Radio, FormContolLabel, FormControl, FormControlLabel, Tab, Tabs, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter, withStyles } from '@material-ui/core';

let formatDate = date => {
  let fmt = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
  let d = F(E(fmt).map(([k, v]) => [k, new Intl.DateTimeFormat('en', singleKeyObject(k, v)).format(date)]));
  return `${d.month} ${d.day}, ${d.year} @ ${d.hour}:${d.minute}:${d.second}`;
}, formatTimestamp = timestamp => formatDate(new Date(1000 * timestamp));

let captionMap = {
  timestamp: "Time", value: "Value", txId: "Transaction ID", deposits: "Deposits", withdrawals: "Withdrawals", withdrawalRequests: "Withdrawal Requests", fundDepositAddresses: "Fund deposit addresses", feeAddresses: "Fee addresses", _: ""
};
let displayFunctions = { timestamp: formatTimestamp };

class Comp extends React.Component {
  constructor(p, state) { super(p); A(this, { state: oO(state), observers: [] }); }
  render() { return this.ren(this.props, this.state); }
  initRefs(spacedOutRefString) { this.fers = F(spacedOutRefString.split(" ").map(k => [k, React.createRef()])); }
  componentWillUnmount() { for (let o of this.observers) o.detach(); }
  setStateKV(k, v, onDone) { this.setState(singleKeyObject(k, v, onDone)) }
  addSyncKeyObserver(data, key, context) { this.addSyncObserver(data, key, d => this.setStateKV(key, d), context); }
  addSyncObserver(data, key, onChange, context) { this.observers.push(data.syncCache.watch(key, onChange, context)); }
} 

class Selector extends Comp { constructor(p) { super(p, { selectedIx: 0 }) }
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
    /* THead.propTypes = { classes: PropTypes.object.isRequired, numSelected: PropTypes.number.isRequired, onRequestSort: PropTypes.func.isRequired, onSelectAllClick: PropTypes.func.isRequired,
      order: PropTypes.oneOf(['asc', 'desc']).isRequired, orderBy: PropTypes.string.isRequired, rowCount: PropTypes.number.isRequired, }; */
    //L(`headercount = ${oA((p.headers)).length}`)
    return <TableHead><TableRow>
      {p.checkable ? <TableCell padding="checkbox"><Checkbox indeterminate={numSelected > 0 && numSelected < rowCount} checked={rowCount > 0 && numSelected === rowCount} onChange={onSelectAllClick} inputProps={{ 'aria-label': 'select all desserts' }} /></TableCell> : null}
      {oA(p.headers).map((h, i) => <TableCell key={i} align={h.numeric ? 'right' : 'left'} padding={h.disablePadding ? 'none' : 'default'} sortDirection={orderBy === i ? order : false}>
        <TableSortLabel active={orderBy === i} direction={orderBy === i ? order : 'asc'} onClick={createSortHandler(i)}>
          {h.label}{orderBy === i ? <span style={styles.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span> : null}
        </TableSortLabel>
      </TableCell>)}
    </TableRow></TableHead>;
  }
}

let nullArray = length => { let r = []; for (let q = 0; q < length; ++q) r.push(null); return r; }
class List extends Comp {
  constructor(p) { super(p); this.state = { page: 0, rowsPerPage: 10, checked: {}, selectedIx: null }; } 
  ren(p, s) {
    let headers = (p.headers || K(oO(oA(p.data)[0]))).map(h => ({ label: h }));
    let X = d => this.setState(d, oF(p.onChange)(d));
    let isChecked = d => s.checked[d.index], isSelected = i => s.selectedIx === i;
    let rows = oA(p.data), columnCount = headers.length - (p.checkable ? 1 : 0);
    let offset = s.page * s.rowsPerPage, end = Math.min(rows.length, offset + s.rowsPerPage), emptyRows = offset + s.rowsPerPage - end;
    let dense = true, order = "asc", orderBy = 0, onRequestSort = () => { }; 
    return <TableContainer component={Paper}><p>{p.caption || null}</p><Table className={classes.table} aria-labelledby="tableTitle" size={(dense ? 'small' : 'medium')} aria-label="enhanced table">
        <THead headers={headers} classes={classes} checkable={p.checkable} numSelected={V(s.checked).filter(v => D(v)).length} order={order} orderBy={orderBy} onSelectAllClick={() => { }} onRequestSort={onRequestSort} rowCount={rows.length} />
        <TableBody>{sort(rows).slice(offset, (s.page + 1) * s.rowsPerPage).map((d, i) => <TableRow key={i} hover onClick={() => X({ selectedIx: i })} aria-checked={isChecked(d)} tabIndex={-1} selected={isSelected(i)}>
          {p.checkable ? <TableCell padding="checkbox"><Checkbox checked={isChecked(d)} inputProps={{ 'aria-labelledby': i }} /></TableCell> : null}
          {headers.map((h, j) => <TableCell key={j} align="center">{(displayFunctions[h.label] || (e => e))(d[h.label], d)}</TableCell>)}
        </TableRow>)}</TableBody>
        <TableFooter>
      <TableRow><TablePagination colSpan={columnCount} SelectProps={{width: "10em"}} rowsPerPageOptions={[5, 10, 25]} count={rows.length} rowsPerPage={s.rowsPerPage} page={s.page} onChangePage={(e, page) => X({ page })} onChangeRowsPerPage={e => X({ rowsPerPage: parseInt(e.target.value, 10) })} /></TableRow></TableFooter>
      </Table></TableContainer>   
  }
}

class TabbedView extends Comp {
  componentDidMount() { this.setState({ selectTabIx: 0 }); }
  ren(p, s) { return <Paper><Tabs value={s.selectedTabIx || 0} indicatorColor="primary" textColor="primary" onChange={(e, selectedTabIx) => this.setState({ selectedTabIx })} aria-label="tabs" centered>{E(p.tabs).map(([title, control], i) => <Tab  key={i} label={title.replace(/_/g, ' ')} />)}</Tabs>{V(p.tabs)[s.selectedTabIx || 0]}</Paper>; }
}

export { Comp, List, TabbedView, Selector, captionMap }