export function getNumericColumns(columns, types) {
  return columns.filter((_, i) => types[i] !== 'str' && types[i] !== 'category');
}

export function getCategoricalColumns(columns, types) {
  return columns.filter((_, i) => types[i] === 'str' || types[i] === 'category');
}

export function getAllColumns(columns) {
  return [...columns];
}

export function getColValues(columns, rows, col) {
  const ci = columns.indexOf(col);
  if (ci === -1) return [];
  return rows.map(r => r[ci]).filter(v => v !== null && v !== undefined && v !== '');
}

export function getNumColValues(columns, rows, col) {
  return getColValues(columns, rows, col).map(Number).filter(v => !isNaN(v));
}

export function countMissing(rows) {
  let count = 0;
  rows.forEach(r => r.forEach(v => {
    if (v === null || v === undefined || v === '') count++;
  }));
  return count;
}

export function getColumnIndex(columns, col) {
  return columns.indexOf(col);
}
