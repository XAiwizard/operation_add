const CC = ['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#16a085','#c0392b','#8e44ad','#d35400'];

export function drawBarChart(ctx, labels, values, opt={}) {
  const W=ctx.canvas.width, H=ctx.canvas.height, p={t:40,b:60,l:60,r:20};
  const colors=opt.colors||CC, mx=Math.max(...values)*1.15||1;
  const bw=Math.min(50,(W-p.l-p.r)/labels.length*0.7), gap=(W-p.l-p.r)/labels.length;
  ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<=5;i++){const y=p.t+(H-p.t-p.b)*(1-i/5);ctx.strokeStyle='#eee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();ctx.fillStyle='#888';ctx.font='11px sans-serif';ctx.textAlign='right';ctx.fillText((mx*i/5).toFixed(opt.dec||0),p.l-8,y+4);}
  if (opt.horizontal) {
    const gapH=(H-p.t-p.b)/labels.length, bh=Math.min(30,gapH*0.7), mxH=Math.max(...values)*1.15||1;
    labels.forEach((lb,i)=>{const y=p.t+gapH*i+gapH/2-bh/2,w=(values[i]/mxH)*(W-p.l-p.r);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(p.l,y,w,bh);ctx.fillStyle='#333';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(values[i].toFixed(opt.dec||0),p.l+w+6,y+bh/2+4);ctx.textAlign='right';ctx.fillText(lb,p.l-6,y+bh/2+4);});
  } else {
    labels.forEach((lb,i)=>{const x=p.l+gap*i+gap/2-bw/2,h=(values[i]/mx)*(H-p.t-p.b),y=H-p.b-h;ctx.fillStyle=colors[i%colors.length];ctx.fillRect(x,y,bw,h);ctx.fillStyle='#333';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(values[i].toFixed(opt.dec||0),x+bw/2,y-6);ctx.fillStyle='#555';ctx.font='11px sans-serif';ctx.save();ctx.translate(x+bw/2,H-p.b+10);if(lb.length>6){ctx.rotate(-0.4);ctx.textAlign='right';}ctx.fillText(lb,0,8);ctx.restore();});
  }
  if(opt.title){ctx.fillStyle='#2c3e50';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(opt.title,W/2,22);}
}

export function drawLineChart(ctx, labels, datasets, opt={}) {
  const W=ctx.canvas.width,H=ctx.canvas.height,p={t:40,b:60,l:60,r:20};
  const colors=['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6'];
  let aV=[];datasets.forEach(d=>aV.push(...d.values));
  const mx=Math.max(...aV)*1.15,mn=Math.min(0,Math.min(...aV)),rng=mx-mn;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  if(opt.grid!==false){for(let i=0;i<=5;i++){const y=p.t+(H-p.t-p.b)*(1-i/5);ctx.strokeStyle='#eee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();ctx.fillStyle='#888';ctx.font='11px sans-serif';ctx.textAlign='right';ctx.fillText((mn+rng*i/5).toFixed(0),p.l-8,y+4);}}
  const gap=(W-p.l-p.r)/(labels.length-1||1);
  datasets.forEach((ds,di)=>{ctx.strokeStyle=colors[di%5];ctx.lineWidth=2.5;ctx.beginPath();ds.values.forEach((v,i)=>{const x=p.l+gap*i,y=p.t+(H-p.t-p.b)*(1-(v-mn)/rng);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();
  if(opt.markers!==false){ds.values.forEach((v,i)=>{const x=p.l+gap*i,y=p.t+(H-p.t-p.b)*(1-(v-mn)/rng);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=colors[di%5];ctx.fill();});}});
  labels.forEach((lb,i)=>{ctx.fillStyle='#555';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(lb,p.l+gap*i,H-p.b+18);});
  if(datasets.length>1){const ly=opt.legendPos==='bottom'?H-15:p.t-25;datasets.forEach((ds,di)=>{const lx=p.l+di*120;ctx.fillStyle=colors[di%5];ctx.fillRect(lx,ly,14,10);ctx.fillStyle='#333';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(ds.label||`S${di+1}`,lx+18,ly+9);});}
  if(opt.title){ctx.fillStyle='#2c3e50';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(opt.title,W/2,22);}
}

export function drawPieChart(ctx, labels, values, opt={}) {
  const W=ctx.canvas.width,H=ctx.canvas.height,total=values.reduce((a,b)=>a+b,0);
  const cx=W/2-60,cy=H/2,R=Math.min(W,H)/2-50;
  const innerR=opt.donut?R*0.55:0;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  let sa=-Math.PI/2;
  labels.forEach((lb,i)=>{const sl=(values[i]/total)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(sa)*innerR,cy+Math.sin(sa)*innerR);ctx.arc(cx,cy,R,sa,sa+sl);ctx.arc(cx,cy,innerR,sa+sl,sa,true);ctx.closePath();ctx.fillStyle=CC[i%CC.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  if(opt.showPercent!==false){const mid=sa+sl/2,lx=cx+Math.cos(mid)*R*0.65,ly=cy+Math.sin(mid)*R*0.65;ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';if(values[i]/total>0.05)ctx.fillText((values[i]/total*100).toFixed(1)+'%',lx,ly+4);}
  sa+=sl;});
  labels.forEach((lb,i)=>{const lx=W-140,ly=30+i*22;ctx.fillStyle=CC[i%CC.length];ctx.fillRect(lx,ly,12,12);ctx.fillStyle='#333';ctx.font='12px sans-serif';ctx.textAlign='left';ctx.fillText(`${lb} (${values[i]})`,lx+18,ly+10);});
  if(opt.title){ctx.fillStyle='#2c3e50';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(opt.title,W/2,18);}
}

export function drawScatterPlot(ctx, xV, yV, opt={}) {
  const W=ctx.canvas.width,H=ctx.canvas.height,p={t:40,b:55,l:60,r:20};
  const xMx=Math.max(...xV)*1.1,xMn=Math.min(...xV)*0.9,yMx=Math.max(...yV)*1.1,yMn=Math.min(...yV)*0.9;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  for(let i=0;i<=5;i++){const y=p.t+(H-p.t-p.b)*(1-i/5);ctx.strokeStyle='#eee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();ctx.fillStyle='#888';ctx.font='10px sans-serif';ctx.textAlign='right';ctx.fillText((yMn+(yMx-yMn)*i/5).toFixed(0),p.l-6,y+4);}
  for(let i=0;i<=5;i++){const x=p.l+(W-p.l-p.r)*i/5;ctx.fillStyle='#888';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText((xMn+(xMx-xMn)*i/5).toFixed(0),x,H-p.b+16);}
  const alpha=opt.alpha||0.6;
  const sizes=opt.sizes||null;
  xV.forEach((xv,i)=>{const x=p.l+(xv-xMn)/(xMx-xMn)*(W-p.l-p.r),y=p.t+(1-(yV[i]-yMn)/(yMx-yMn))*(H-p.t-p.b);const r=sizes?Math.max(3,Math.min(20,sizes[i])):4.5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  const hueColors=opt.hueColors;
  ctx.fillStyle=hueColors?hueColors[i]:`rgba(52,152,219,${alpha})`;ctx.fill();ctx.strokeStyle=hueColors?hueColors[i]:'#2980b9';ctx.lineWidth=1;ctx.stroke();});
  if(opt.regressionLine){const n=xV.length,sx=xV.reduce((a,b)=>a+b,0),sy=yV.reduce((a,b)=>a+b,0),sxy=xV.reduce((a,v,i)=>a+v*yV[i],0),sx2=xV.reduce((a,v)=>a+v*v,0);const slope=(n*sxy-sx*sy)/(n*sx2-sx*sx),intercept=(sy-slope*sx)/n;const x1=xMn,y1=slope*x1+intercept,x2=xMx,y2=slope*x2+intercept;const px1=p.l+(x1-xMn)/(xMx-xMn)*(W-p.l-p.r),py1=p.t+(1-(y1-yMn)/(yMx-yMn))*(H-p.t-p.b),px2=p.l+(x2-xMn)/(xMx-xMn)*(W-p.l-p.r),py2=p.t+(1-(y2-yMn)/(yMx-yMn))*(H-p.t-p.b);ctx.strokeStyle='#e74c3c';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(px1,py1);ctx.lineTo(px2,py2);ctx.stroke();ctx.setLineDash([]);}
  if(opt.xLabel){ctx.fillStyle='#555';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(opt.xLabel,(p.l+W-p.r)/2,H-8);}
  if(opt.yLabel){ctx.save();ctx.translate(14,(p.t+H-p.b)/2);ctx.rotate(-Math.PI/2);ctx.fillStyle='#555';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(opt.yLabel,0,0);ctx.restore();}
  if(opt.title){ctx.fillStyle='#2c3e50';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(opt.title,W/2,22);}
}

export function drawBoxPlot(ctx, datasets, labels, opt={}) {
  const W=ctx.canvas.width,H=ctx.canvas.height,p={t:40,b:50,l:60,r:20};
  const colors=['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
  let all=[];datasets.forEach(d=>all.push(...d));const mx=Math.max(...all)*1.1,mn=Math.min(...all)*0.9;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  for(let i=0;i<=5;i++){const y=p.t+(H-p.t-p.b)*(1-i/5);ctx.strokeStyle='#eee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();ctx.fillStyle='#888';ctx.font='10px sans-serif';ctx.textAlign='right';ctx.fillText((mn+(mx-mn)*i/5).toFixed(0),p.l-6,y+4);}
  const gap=(W-p.l-p.r)/datasets.length,bw=Math.min(50,gap*0.5),toY=v=>p.t+(1-(v-mn)/(mx-mn))*(H-p.t-p.b);
  datasets.forEach((data,i)=>{const s=[...data].sort((a,b)=>a-b),q1=s[Math.floor(s.length*0.25)],q2=s[Math.floor(s.length*0.5)],q3=s[Math.floor(s.length*0.75)],dMin=s[0],dMax=s[s.length-1],cx=p.l+gap*i+gap/2;
  ctx.strokeStyle='#555';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,toY(dMin));ctx.lineTo(cx,toY(dMax));ctx.stroke();ctx.beginPath();ctx.moveTo(cx-bw/4,toY(dMin));ctx.lineTo(cx+bw/4,toY(dMin));ctx.stroke();ctx.beginPath();ctx.moveTo(cx-bw/4,toY(dMax));ctx.lineTo(cx+bw/4,toY(dMax));ctx.stroke();
  ctx.fillStyle=colors[i%6]+'44';ctx.fillRect(cx-bw/2,toY(q3),bw,toY(q1)-toY(q3));ctx.strokeStyle=colors[i%6];ctx.lineWidth=2;ctx.strokeRect(cx-bw/2,toY(q3),bw,toY(q1)-toY(q3));
  ctx.strokeStyle='#c0392b';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx-bw/2,toY(q2));ctx.lineTo(cx+bw/2,toY(q2));ctx.stroke();
  if(opt.showOutliers!==false){const iqr=q3-q1,lo=q1-1.5*iqr,hi=q3+1.5*iqr;data.forEach(v=>{if(v<lo||v>hi){const oy=toY(v);ctx.beginPath();ctx.arc(cx,oy,3,0,Math.PI*2);ctx.fillStyle='#e74c3c';ctx.fill();}});}
  ctx.fillStyle='#555';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(labels[i]||'',cx,H-p.b+16);});
  if(opt.title){ctx.fillStyle='#2c3e50';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(opt.title,W/2,22);}
}

export function drawHeatmap(ctx, matrix, labels, opt={}) {
  const W=ctx.canvas.width,H=ctx.canvas.height,n=matrix.length,p={t:50,b:20,l:90,r:60};
  const cW=(W-p.l-p.r)/n,cH=(H-p.t-p.b)/n;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  matrix.forEach((row,i)=>{row.forEach((v,j)=>{const x=p.l+j*cW,y=p.t+i*cH;let r,g,b;if(v>=0){r=255;g=Math.floor(255*(1-v));b=Math.floor(255*(1-v));}else{r=Math.floor(255*(1+v));g=Math.floor(255*(1+v));b=255;}ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(x,y,cW,cH);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(x,y,cW,cH);ctx.fillStyle=Math.abs(v)>0.5?'#fff':'#333';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(v.toFixed(2),x+cW/2,y+cH/2+4);});});
  labels.forEach((lb,i)=>{ctx.fillStyle='#333';ctx.font='11px sans-serif';ctx.textAlign='right';ctx.fillText(lb,p.l-6,p.t+i*cH+cH/2+4);ctx.save();ctx.translate(p.l+i*cW+cW/2,p.t-6);ctx.rotate(-0.6);ctx.textAlign='right';ctx.fillText(lb,0,0);ctx.restore();});
  if(opt.title){ctx.fillStyle='#2c3e50';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(opt.title,W/2,18);}
}

export function drawHistogram(ctx, values, opt={}) {
  const bins=opt.bins||10,mn=Math.min(...values),mx=Math.max(...values),bw=(mx-mn)/bins||1,counts=Array(bins).fill(0);
  values.forEach(v=>{let b=Math.floor((v-mn)/bw);if(b>=bins)b=bins-1;counts[b]++;});
  if(opt.normalize){const total=values.length;counts.forEach((_,i)=>{counts[i]=counts[i]/total;});}
  if(opt.cumulative){for(let i=1;i<counts.length;i++)counts[i]+=counts[i-1];}
  drawBarChart(ctx,counts.map((_,i)=>(mn+bw*i+bw/2).toFixed(0)),counts,{...opt,colors:['#3498db']});
  if(opt.kde){const h=1.06*Math.sqrt(values.reduce((a,v)=>a+(v-values.reduce((s,x)=>s+x,0)/values.length)**2,0)/values.length)*Math.pow(values.length,-0.2);const W=ctx.canvas.width,H=ctx.canvas.height,p={t:40,b:60,l:60,r:20};const mxC=Math.max(...counts)*1.15;const pts=100;ctx.strokeStyle='#e74c3c';ctx.lineWidth=2;ctx.beginPath();for(let px=0;px<pts;px++){const xv=mn+(mx-mn)*px/pts;let kde=0;values.forEach(v=>{kde+=Math.exp(-0.5*((xv-v)/h)**2)/(h*Math.sqrt(2*Math.PI));});kde/=values.length;const sv=kde*(mx-mn)/bins*values.length;const x=p.l+(xv-mn)/(mx-mn)*(W-p.l-p.r);const y=H-p.b-(sv/mxC)*(H-p.t-p.b);px===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
}

export function drawConfusionMatrix(ctx, matrix, labels) {
  const W=ctx.canvas.width,H=ctx.canvas.height,n=matrix.length,p={t:50,b:40,l:70,r:20};
  const cW=(W-p.l-p.r)/n,cH=(H-p.t-p.b)/n,mx=Math.max(...matrix.flat());
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  matrix.forEach((row,i)=>{row.forEach((v,j)=>{const x=p.l+j*cW,y=p.t+i*cH,int=v/mx;ctx.fillStyle=i===j?`rgba(39,174,96,${0.2+int*0.7})`:`rgba(231,76,60,${0.1+int*0.5})`;ctx.fillRect(x,y,cW,cH);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x,y,cW,cH);ctx.fillStyle='#2c3e50';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText(v,x+cW/2,y+cH/2+7);});});
  labels.forEach((lb,i)=>{ctx.fillStyle='#333';ctx.font='bold 12px sans-serif';ctx.textAlign='right';ctx.fillText(lb,p.l-10,p.t+i*cH+cH/2+5);ctx.textAlign='center';ctx.fillText(lb,p.l+i*cW+cW/2,p.t-10);});
  ctx.fillStyle='#555';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('Predicted',(p.l+W-p.r)/2,p.t-30);
  ctx.save();ctx.translate(15,(p.t+H-p.b)/2);ctx.rotate(-Math.PI/2);ctx.fillText('Actual',0,0);ctx.restore();
}

export function drawTreeVisualization(ctx, features, maxDepth) {
  const W=ctx.canvas.width,H=ctx.canvas.height,depth=Math.min(maxDepth,4);
  const nc=['#3498db','#2ecc71','#f39c12','#e74c3c','#9b59b6'],nw=110,nh=36,vG=70;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  function dn(x,y,w,h,text,col,leaf){
    if(leaf){ctx.fillStyle=col+'33';ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();}
    else{ctx.fillStyle=col+'22';ctx.strokeStyle=col;ctx.lineWidth=2;const r=6;ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.fillStyle='#2c3e50';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(text,x+w/2,y+h/2+4);
  }
  function de(x1,y1,x2,y2,lb){ctx.strokeStyle='#999';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.fillStyle='#e74c3c';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(lb,(x1+x2)/2-10,(y1+y2)/2-3);}
  const rx=W/2-nw/2,ry=15;
  dn(rx,ry,nw,nh,`${features[0%features.length]} <= 50`,nc[0],false);
  const l1y=ry+nh+vG;
  de(W/2,ry+nh,W/4,l1y,'True');de(W/2,ry+nh,W*3/4,l1y,'False');
  dn(W/4-nw/2,l1y,nw,nh,`${features[1%features.length]} <= 600`,nc[1],false);
  dn(W*3/4-nw/2,l1y,nw,nh,`${features[2%features.length]} <= 3`,nc[1],false);
  if(depth>=2){const l2y=l1y+nh+vG;de(W/4,l1y+nh,W/8,l2y,'T');de(W/4,l1y+nh,W*3/8,l2y,'F');de(W*3/4,l1y+nh,W*5/8,l2y,'T');de(W*3/4,l1y+nh,W*7/8,l2y,'F');
  dn(W/8-nw/2,l2y,nw,nh,'Class: 0',nc[2],true);dn(W*3/8-nw/2,l2y,nw,nh,`${features[0%features.length]} <= 35`,nc[2],false);dn(W*5/8-nw/2,l2y,nw,nh,'Class: 1',nc[2],true);dn(W*7/8-nw/2,l2y,nw,nh,'Class: 0',nc[2],true);
  if(depth>=3){const l3y=l2y+nh+vG;de(W*3/8,l2y+nh,W*5/16,l3y,'T');de(W*3/8,l2y+nh,W*7/16,l3y,'F');dn(W*5/16-nw/2,l3y,nw,nh,'Class: 1',nc[3],true);dn(W*7/16-nw/2,l3y,nw,nh,'Class: 0',nc[3],true);}}
  ctx.fillStyle='#2c3e50';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('Decision Tree Structure',W/2,H-10);
}

export { CC };
