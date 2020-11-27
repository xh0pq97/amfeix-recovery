import { G, singleKeyObject } from '../common/tools';

let formatDate = date => {
  let fmt = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
  let d = G(fmt, (v, k) => new Intl.DateTimeFormat('en', { hour12: false, ...singleKeyObject(k, v) }).format(date));
  return `${d.month} ${d.day}, ${d.year} ${d.hour}:${d.minute}:${d.second}`;
}, formatTimestamp = timestamp => timestamp && formatDate(new Date(1000 * timestamp));

export { formatTimestamp, formatDate }