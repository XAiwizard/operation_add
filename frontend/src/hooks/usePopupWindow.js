export default function usePopupWindow() {
  const openPopup = (title, htmlContent, w = 950, h = 720) => {
    const left = (window.screen.width - w) / 2;
    const top = (window.screen.height - h) / 2;
    const popup = window.open('', '_blank',
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`);
    if (!popup) { alert('팝업을 허용해주세요.'); return null; }

    const popupStyle = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI','Apple SD Gothic Neo',sans-serif;background:#f4f6f8;color:#333;padding:24px}
.container{background:#fff;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.08);padding:28px;min-height:500px}
h2{color:#2c3e50;font-size:1.3rem;margin-bottom:18px;padding-bottom:10px;border-bottom:3px solid #3498db}
h3{color:#34495e;font-size:1.05rem;margin:16px 0 10px}
table.mt{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:.92rem}
table.mt th{background:#34495e;color:#fff;padding:10px 14px;text-align:left;font-weight:600}
table.mt td{padding:9px 14px;border-bottom:1px solid #eee}table.mt tr:nth-child(even){background:#f8f9fa}
table.st{width:100%;border-collapse:collapse;margin:10px 0;font-size:.88rem}
table.st th,table.st td{padding:7px 10px;border:1px solid #ddd;text-align:right}table.st th{background:#f0f0f0;text-align:center}
.cw{background:#fdfdfd;border:1px solid #eee;border-radius:8px;padding:15px;margin:12px 0;text-align:center}canvas{max-width:100%}
.tb{display:flex;border-bottom:2px solid #3498db;margin-bottom:16px}
.tbtn{padding:10px 22px;cursor:pointer;border:none;background:none;font-size:.95rem;font-weight:600;color:#7f8c8d;border-bottom:3px solid transparent;transition:all .2s}
.tbtn.active{color:#3498db;border-bottom-color:#3498db}.tbtn:hover{color:#2c3e50}
.tc{display:none}.tc.active{display:block}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.82rem;font-weight:600}
.bg{background:#d4edda;color:#155724}.bw{background:#fff3cd;color:#856404}.bb{background:#f8d7da;color:#721c24}
.bcl{margin-top:20px;padding:10px 24px;background:#e74c3c;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:.95rem;float:right}.bcl:hover{background:#c0392b}
.note{background:#eaf6ff;border-left:4px solid #3498db;padding:10px 14px;margin:10px 0;font-size:.88rem;color:#004085;border-radius:0 6px 6px 0}
.owarn{background:#f8d7da;border-left:4px solid #e74c3c;padding:10px;margin:10px 0;border-radius:0 6px 6px 0;font-size:.9rem}`;

    popup.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${title}</title><style>${popupStyle}</style></head><body><div class="container">${htmlContent}<button class="bcl" onclick="window.close()">닫기</button></div>
<script>function showTab(b,id){document.querySelectorAll('.tc').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tbtn').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');b.classList.add('active');}<\/script></body></html>`);
    popup.document.close();
    return popup;
  };

  return { openPopup };
}
