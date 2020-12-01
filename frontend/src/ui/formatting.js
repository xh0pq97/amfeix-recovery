import { G, singleKeyObject } from '../common/tools';

let formatDate = date => {
  let make2Digit = s => (s.length === 1) ? '0' + s : s;
  let fmt = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
  let d = G(fmt, (v, k) => new Intl.DateTimeFormat('en', { hour12: false, ...singleKeyObject(k, v) }).format(date));
  return `${d.month} ${d.day}, ${d.year} ${make2Digit(d.hour)}:${make2Digit(d.minute)}:${make2Digit(d.second)}`;
}, formatTimestamp = timestamp => timestamp && formatDate(new Date(1000 * timestamp));

export { formatTimestamp, formatDate }