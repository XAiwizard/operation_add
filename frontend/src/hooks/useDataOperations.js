import { useData } from '../contexts/DataContext';
import { useLog } from '../contexts/LogContext';

export default function useDataOperations() {
  const { columns, types, rows, setColumns, setTypes, setRows, updateRows } = useData();
  const { addLog } = useLog();

  const execDeleteColumns = (colNames) => {
    if (!colNames.length) { addLog('[경고] 컬럼을 선택하세요.', 'warn'); return; }
    const indices = colNames.map(c => columns.indexOf(c)).filter(i => i >= 0).sort((a,b) => b-a);
    const newCols = [...columns]; const newTypes = [...types];
    const newRows = rows.map(r => [...r]);
    indices.forEach(i => { newCols.splice(i,1); newTypes.splice(i,1); newRows.forEach(r => r.splice(i,1)); });
    setColumns(newCols); setTypes(newTypes); setRows(newRows);
    addLog(`[완료] ${colNames.join(', ')} 삭제됨`, 'success');
  };

  const execDeleteByMissingRate = (threshold) => {
    const toDelete = [];
    columns.forEach((col, ci) => {
      const missing = rows.filter(r => r[ci] === null || r[ci] === undefined || r[ci] === '').length;
      if ((missing / rows.length) * 100 >= threshold) toDelete.push(col);
    });
    if (!toDelete.length) { addLog(`[정보] 결측률 ${threshold}% 이상인 컬럼 없음`, 'info'); return; }
    execDeleteColumns(toDelete);
  };

  const execMissingValue = (targetCols, method, customValue) => {
    const newRows = rows.map(r => [...r]);
    let fixed = 0;

    if (method === 'drop_row') {
      const before = newRows.length;
      const filtered = newRows.filter(r => !r.some((c, ci) => {
        if (!targetCols.includes(columns[ci])) return false;
        return c === null || c === undefined || c === '';
      }));
      fixed = before - filtered.length;
      setRows(filtered);
      addLog(`[완료] ${fixed}행 삭제됨`, 'success');
      return;
    }

    if (method === 'drop_column') {
      const colsWithMissing = targetCols.filter(col => {
        const ci = columns.indexOf(col);
        return rows.some(r => r[ci] === null || r[ci] === undefined || r[ci] === '');
      });
      if (colsWithMissing.length) execDeleteColumns(colsWithMissing);
      return;
    }

    targetCols.forEach(col => {
      const ci = columns.indexOf(col);
      if (ci === -1) return;
      const vals = newRows.map(r => r[ci]).filter(v => v !== null && v !== undefined && v !== '');
      const numVals = vals.map(Number).filter(v => !isNaN(v));

      newRows.forEach((r, ri) => {
        if (r[ci] === null || r[ci] === undefined || r[ci] === '') {
          let rep;
          switch (method) {
            case 'mean': rep = numVals.length ? parseFloat((numVals.reduce((a,b)=>a+b,0)/numVals.length).toFixed(2)) : 0; break;
            case 'median': {
              const s = [...numVals].sort((a,b)=>a-b);
              rep = s.length%2===0 ? (s[s.length/2-1]+s[s.length/2])/2 : s[Math.floor(s.length/2)];
              break;
            }
            case 'mode': {
              const freq = {}; vals.forEach(x => { freq[x]=(freq[x]||0)+1; });
              rep = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || 0;
              if (!isNaN(rep)) rep = Number(rep);
              break;
            }
            case 'zero': rep = 0; break;
            case 'custom': rep = customValue; break;
            case 'ffill': {
              for (let k = ri-1; k >= 0; k--) {
                if (newRows[k][ci] !== null && newRows[k][ci] !== undefined && newRows[k][ci] !== '') {
                  rep = newRows[k][ci]; break;
                }
              }
              if (rep === undefined) rep = 0;
              break;
            }
            case 'bfill': {
              for (let k = ri+1; k < newRows.length; k++) {
                if (newRows[k][ci] !== null && newRows[k][ci] !== undefined && newRows[k][ci] !== '') {
                  rep = newRows[k][ci]; break;
                }
              }
              if (rep === undefined) rep = 0;
              break;
            }
            case 'interpolation': {
              let prev = null, next = null;
              for (let k = ri-1; k >= 0; k--) { if (newRows[k][ci] != null && newRows[k][ci] !== '') { prev = Number(newRows[k][ci]); break; } }
              for (let k = ri+1; k < newRows.length; k++) { if (newRows[k][ci] != null && newRows[k][ci] !== '') { next = Number(newRows[k][ci]); break; } }
              rep = (prev !== null && next !== null) ? parseFloat(((prev+next)/2).toFixed(2))
                : prev !== null ? prev : next !== null ? next : 0;
              break;
            }
            default: rep = 0;
          }
          newRows[ri][ci] = rep;
          fixed++;
        }
      });
    });

    setRows(newRows);
    addLog(`[완료] ${fixed}건 처리 (${method})`, 'success');
  };

  const execScaling = (targetCols, scalerType) => {
    if (!targetCols.length) { addLog('[경고] 컬럼을 선택하세요.', 'warn'); return; }
    const newRows = rows.map(r => [...r]);
    const newTypes = [...types];

    targetCols.forEach(col => {
      const ci = columns.indexOf(col);
      const vals = newRows.map(r => Number(r[ci])).filter(v => !isNaN(v));
      if (!vals.length) return;

      const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
      const std = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0) / vals.length) || 1;
      const mn = Math.min(...vals), mx = Math.max(...vals);
      const sorted = [...vals].sort((a,b)=>a-b);
      const q1 = sorted[Math.floor(sorted.length*0.25)];
      const q3 = sorted[Math.floor(sorted.length*0.75)];
      const iqr = q3-q1||1;
      const med = sorted[Math.floor(sorted.length*0.5)];
      const maxAbs = Math.max(...vals.map(Math.abs)) || 1;

      newRows.forEach(r => {
        const v = Number(r[ci]);
        if (isNaN(v)) return;
        switch (scalerType) {
          case 'standard': r[ci] = parseFloat(((v-mean)/std).toFixed(4)); break;
          case 'minmax': r[ci] = parseFloat(((v-mn)/(mx-mn||1)).toFixed(4)); break;
          case 'robust': r[ci] = parseFloat(((v-med)/iqr).toFixed(4)); break;
          case 'maxabs': r[ci] = parseFloat((v/maxAbs).toFixed(4)); break;
          case 'log': r[ci] = parseFloat(Math.log1p(Math.max(0, v)).toFixed(4)); break;
          case 'boxcox': r[ci] = v > 0 ? parseFloat(((Math.pow(v, 0.5) - 1) / 0.5).toFixed(4)) : 0; break;
          case 'yeojohnson': r[ci] = v >= 0 ? parseFloat(((Math.pow(v+1, 0.5)-1)/0.5).toFixed(4)) : parseFloat((-(Math.pow(-v+1,2-0.5)-1)/(2-0.5)).toFixed(4)); break;
          default: break;
        }
      });
      newTypes[ci] = 'float';
    });

    setRows(newRows); setTypes(newTypes);
    addLog(`[완료] ${targetCols.join(', ')} 스케일링 (${scalerType})`, 'success');
  };

  const execEncoding = (targetCols, encodingType) => {
    if (!targetCols.length) { addLog('[경고] 컬럼을 선택하세요.', 'warn'); return; }
    let newCols = [...columns], newTypes = [...types], newRows = rows.map(r => [...r]);

    targetCols.forEach(col => {
      const ci = newCols.indexOf(col);
      if (ci === -1) return;

      switch (encodingType) {
        case 'onehot': {
          const uv = [...new Set(newRows.map(r => r[ci]))].filter(v => v !== null);
          uv.forEach(u => {
            newCols.push(`${col}_${u}`);
            newTypes.push('int');
            newRows.forEach(r => r.push(r[ci] === u ? 1 : 0));
          });
          const idx = newCols.indexOf(col);
          newCols.splice(idx, 1); newTypes.splice(idx, 1);
          newRows.forEach(r => r.splice(idx, 1));
          break;
        }
        case 'label': {
          const uv = [...new Set(newRows.map(r => r[ci]))].filter(v => v !== null).sort();
          const map = {}; uv.forEach((v, i) => { map[v] = i; });
          newRows.forEach(r => { if (r[ci] !== null) r[ci] = map[r[ci]] ?? r[ci]; });
          newTypes[ci] = 'int';
          break;
        }
        case 'ordinal': {
          const uv = [...new Set(newRows.map(r => r[ci]))].filter(v => v !== null).sort();
          const map = {}; uv.forEach((v, i) => { map[v] = i; });
          newRows.forEach(r => { if (r[ci] !== null) r[ci] = map[r[ci]] ?? r[ci]; });
          newTypes[ci] = 'int';
          break;
        }
        case 'frequency': {
          const freq = {}; newRows.forEach(r => { const v = r[ci]; if (v !== null) freq[v] = (freq[v]||0)+1; });
          const total = newRows.length;
          newRows.forEach(r => { if (r[ci] !== null) r[ci] = parseFloat((freq[r[ci]]/total).toFixed(4)); });
          newTypes[ci] = 'float';
          break;
        }
        case 'target': {
          addLog('[정보] Target Encoding은 백엔드 연동 후 지원 예정', 'info');
          break;
        }
        default: break;
      }
    });

    setColumns(newCols); setTypes(newTypes); setRows(newRows);
    addLog(`[완료] ${targetCols.join(', ')} 인코딩 (${encodingType})`, 'success');
  };

  const execTypeConversion = (col, targetType, dateFormat) => {
    const ci = columns.indexOf(col);
    if (ci === -1) return;
    const newRows = rows.map(r => [...r]);
    const newTypes = [...types];

    newRows.forEach(r => {
      switch (targetType) {
        case 'int': r[ci] = parseInt(r[ci]) || 0; break;
        case 'float': r[ci] = parseFloat(r[ci]) || 0; break;
        case 'str': r[ci] = String(r[ci] ?? ''); break;
        case 'bool': r[ci] = Boolean(r[ci]) ? 1 : 0; break;
        case 'datetime': r[ci] = String(r[ci]); break;
        case 'category': break; // type label change only
        default: break;
      }
    });
    newTypes[ci] = targetType;
    setRows(newRows); setTypes(newTypes);
    addLog(`[완료] ${col} → ${targetType}`, 'success');
  };

  const execTranspose = () => {
    // Pure matrix transpose without adding extra columns
    const nR = rows.length, nC = columns.length;
    const newRows = [];
    for (let ci = 0; ci < nC; ci++) {
      newRows.push(rows.map(r => r[ci]));
    }
    // Use first row values as new column names if they look like headers, else generate C1..Cn
    const newCols = rows.map((_, i) => `C${i + 1}`);
    const newTypes = newCols.map(() => 'str');
    setColumns(newCols); setTypes(newTypes); setRows(newRows);
    addLog(`[완료] 전치 (${nR}×${nC} → ${newRows.length}×${newCols.length})`, 'success');
  };

  return {
    execDeleteColumns, execDeleteByMissingRate,
    execMissingValue, execScaling, execEncoding,
    execTypeConversion, execTranspose,
  };
}
