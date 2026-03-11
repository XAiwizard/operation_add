import { FEATURE_STORE_DATA } from '../../utils/constants';

export default function openFeatureStorePopup(onSelectData, addLog) {
  const w = 900, h = 650;
  const left = (window.screen.width - w) / 2;
  const top = (window.screen.height - h) / 2;
  const popup = window.open('', '_blank',
    `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`);
  if (!popup) { alert('팝업을 허용해주세요.'); return; }

  const style = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Apple SD Gothic Neo',sans-serif;background:#f4f6f8;color:#333;padding:20px}
.container{background:#fff;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.08);padding:24px}
h2{color:#2c3e50;font-size:1.3rem;margin-bottom:16px;padding-bottom:10px;border-bottom:3px solid #2ecc71}
.ds-card{border:2px solid #e8e8e8;border-radius:8px;padding:16px;margin-bottom:14px;cursor:pointer;transition:all .2s}
.ds-card:hover{border-color:#2ecc71;background:#f0fdf4;transform:translateY(-1px);box-shadow:0 2px 8px rgba(46,204,113,.15)}
.ds-card.selected{border-color:#2ecc71;background:#e8f8f5}
.ds-name{font-size:1.05rem;font-weight:700;color:#2c3e50;margin-bottom:4px}
.ds-desc{font-size:.88rem;color:#666;margin-bottom:8px}
.ds-meta{display:flex;gap:16px;font-size:.82rem;color:#888}
.ds-meta span{background:#f0f0f0;padding:2px 8px;border-radius:10px}
.preview{margin-top:14px;max-height:180px;overflow:auto;border:1px solid #eee;border-radius:6px}
.preview table{width:100%;border-collapse:collapse;font-size:.82rem}
.preview th{background:#34495e;color:#fff;padding:6px 10px;position:sticky;top:0;text-align:left}
.preview td{padding:5px 10px;border-bottom:1px solid #f0f0f0}
.preview tr:nth-child(even){background:#fafafa}
.actions{display:flex;gap:10px;margin-top:18px;justify-content:flex-end}
.btn{padding:10px 24px;border:none;border-radius:6px;font-size:.95rem;font-weight:600;cursor:pointer;transition:background .2s}
.btn-load{background:#2ecc71;color:#fff}.btn-load:hover{background:#27ae60}
.btn-load:disabled{background:#bbb;cursor:not-allowed}
.btn-close{background:#e74c3c;color:#fff}.btn-close:hover{background:#c0392b}`;

  const cards = FEATURE_STORE_DATA.map((ds, i) => `
    <div class="ds-card" id="card_${i}" onclick="selectDS(${i})">
      <div class="ds-name">📊 ${ds.name}</div>
      <div class="ds-desc">${ds.desc}</div>
      <div class="ds-meta">
        <span>📋 ${ds.rows.toLocaleString()} rows</span>
        <span>📐 ${ds.cols} cols</span>
        <span>🕐 ${ds.updated}</span>
      </div>
      <div class="preview" id="preview_${i}" style="display:none">
        <table>
          <tr>${ds.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          ${ds.data.map(row => `<tr>${row.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}
        </table>
      </div>
    </div>`).join('');

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>학습용 데이터 목록</title><style>${style}</style></head>
<body><div class="container">
<h2>📂 학습용 데이터 목록 (Feature Store)</h2>
${cards}
<div class="actions">
  <button class="btn btn-load" id="btnLoad" disabled onclick="loadData()">데이터 불러오기</button>
  <button class="btn btn-close" onclick="window.close()">닫기</button>
</div>
</div>
<script>
let selectedIdx = -1;
function selectDS(idx) {
  document.querySelectorAll('.ds-card').forEach((c,i) => {
    c.classList.toggle('selected', i===idx);
    document.getElementById('preview_'+i).style.display = i===idx ? 'block' : 'none';
  });
  selectedIdx = idx;
  document.getElementById('btnLoad').disabled = false;
}
function loadData() {
  if (selectedIdx >= 0) {
    window.opener.__featureStoreCallback(selectedIdx);
    window.close();
  }
}
<\/script></body></html>`;

  popup.document.write(html);
  popup.document.close();

  // Register callback on opener
  window.__featureStoreCallback = (idx) => {
    const ds = FEATURE_STORE_DATA[idx];
    if (ds) {
      // Infer types from first data row
      const types = ds.data[0].map(v => {
        if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
        return 'str';
      });
      onSelectData(ds.headers, types, ds.data, ds.name);
      addLog(`[Feature Store] "${ds.name}" 로드 완료 (${ds.data.length}행 × ${ds.headers.length}열)`, 'success');
    }
  };
}
