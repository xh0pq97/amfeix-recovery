import React from 'react';
import { A, D, E, F, K, L, V, oA, oO, oF, singleKeyObject } from './tools';
import { Tab, Tabs, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox, TableFooter } from '@material-ui/core';

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
  constructor(p) { super(p); A(this, { state: {}, observers: [] }); }
  render() { return this.ren(this.props, this.state); }
  initRefs(spacedOutRefString) { this.fers = F(spacedOutRefString.split(" ").map(k => [k, React.createRef()])); }
  componentWillUnmount() { this.unmounted = true; this.observers.map(o => o.detach()); }
  setStateIfMounted(s, onDone) { if (!this.unmounted) this.setState(s, onDone); return !this.unmounted; }
  addSyncObserver(data, key, context) { this.observers.push(data.syncCache.watch(key, d => this.setState((singleKeyObject(key, d))), context)); }
}

class Selector extends Comp {
  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); }
  ren(p, s) { let z = (a, b) => s => (s ? a : b), y = (a, b) => i => z(a, b)(i === s.selectedIx);
    let style = i => ({ backgroundColor: y("#AEC", "#000")(i), color: y("#000", "#FFF")(i) });
    let elemF = (x, k) => z(<tr key={k}><td>{x}</td></tr>, <td key={k}>{x}</td>)(p.vertical), wrapF = x => z(x, <tr>{x}</tr>)(p.vertical);
    return <table><tbody>{wrapF(oA(p.options).map((x, i) => elemF(<div style={style((i))} onClick={() => this.setSelectedIx(i)}>{x}</div>, i)))}</tbody></table>
  }
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
      <TableCell padding="checkbox"><Checkbox indeterminate={numSelected > 0 && numSelected < rowCount} checked={rowCount > 0 && numSelected === rowCount} onChange={onSelectAllClick} inputProps={{ 'aria-label': 'select all desserts' }} /></TableCell>
      {oA(p.headers).map((h, i) => <TableCell key={i} align={h.numeric ? 'right' : 'left'} padding={h.disablePadding ? 'none' : 'default'} sortDirection={orderBy === i ? order : false}>
        <TableSortLabel active={orderBy === i} direction={orderBy === i ? order : 'asc'} onClick={createSortHandler(i)}>
          {h.label}{orderBy === i ? <span style={styles.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span> : null}
        </TableSortLabel>
      </TableCell>)}
    </TableRow></TableHead>;
  }
}

class List extends Comp {
  constructor(p) { super(p); this.state = { page: 0, rowsPerPage: 10, checked: {} }; }
  //  setSelectedIx(selectedIx) { if (this.state.selectedIx !== selectedIx) this.setState({ selectedIx }, () => oF(this.props.onChanged)(selectedIx)); } 
  ren(p, s) {
    let headers = p.headers || K(oO(oA(p.data)[0]));
    let X = d => this.setState(d, oF(p.onChange)(d));
    let isChecked = d => s.checked[d.index];
    let isSelected = d => s.selectedIx == d.index;
    let rows = oA(p.data);
    let offset = s.page * s.rowsPerPage, end = Math.min(rows.length, offset + s.rowsPerPage), emptyRows = offset + s.rowsPerPage - end;
    let dense = true;
    let order = "asc", orderBy = 0, onRequestSort = () => { };
    //<EnhancedTableToolbar numSelected={selected.length} />
    //        
    return <Paper><TableContainer><Table className={classes.table} aria-labelledby="tableTitle" size={(dense ? 'small' : 'medium')} aria-label="enhanced table">
        <THead headers={headers.map(h => ({ label: h }))} classes={classes} numSelected={V(s.checked).filter(v => D(v)).length} order={order} orderBy={orderBy} onSelectAllClick={() => { }} onRequestSort={onRequestSort} rowCount={rows.length} />
        <TableBody>{sort(rows).slice(offset, (s.page + 1) * s.rowsPerPage).map((d, i) => <TableRow key={i} hover onClick={() => X({ selectedIx: d.index })} aria-checked={isChecked(d)} tabIndex={-1} selected={isSelected(d)}>
          <TableCell padding="checkbox"><Checkbox checked={isChecked(d)} inputProps={{ 'aria-labelledby': i }} /></TableCell>
          {headers.map((x, j) => <TableCell key={j} align="center">{(displayFunctions[x] || (e => e))(d[x], d)}</TableCell>)}
        </TableRow>)}
        {emptyRows > 0 && <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}><TableCell colSpan={oA(p.headers).length + 1} /></TableRow>}</TableBody>
      </Table></TableContainer>
      <TablePagination component="div" rowsPerPageOptions={[5, 10, 25, 50, 100]} count={rows.length} rowsPerPage={s.rowsPerPage} page={s.page} onChangePage={(e, page) => X({ page })} onChangeRowsPerPage={e => X({ rowsPerPage: parseInt(e.target.value, 10) })} />
    </Paper>;
  }
}

class TabbedView extends Comp {
  componentDidMount() { this.setState({ selectTabIx: 0 }); }
  ren(p, s) { return <><Paper><Tabs value={s.selectedTabIx || 0} indicatorColor="primary" textColor="primary" onChange={(e, selectedTabIx) => this.setState({ selectedTabIx })} aria-label="tabs" centered>{E(p.tabs).map(([title, control], i) => <Tab key={i} label={title.replace(/_/g, ' ')} />)}</Tabs></Paper>{V(p.tabs)[s.selectedTabIx || 0]}</>; }
}

export { Comp, List, TabbedView, Selector, captionMap }