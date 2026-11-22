'use strict';
const D=JSON.parse(document.getElementById('ocean-data').textContent), M=OceanMath;
const $=id=>document.getElementById(id), whole=[D.x[0],D.y[0],D.x.at(-1),D.y.at(-1)];
const state={t:0,z:0,x:Math.floor(D.x.length/2),y:Math.floor(D.y.length/2),name:D.initial,mode:'point',box:[...whole],line:null};
let timer=null, start=null, currentSection=null, currentPairs=[];
const extent=(values,fallback=[0,1])=>{let lo=Infinity,hi=-Infinity;for(const v of values)if(M.valid(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}return lo===Infinity?fallback:lo===hi?[lo-.5,hi+.5]:[lo,hi];};
const color=(v,range)=>{if(!M.valid(v))return '#e4ebef';const t=Math.max(0,Math.min(1,(v-range[0])/(range[1]-range[0])));return `hsl(${230-220*t} 67% ${36+18*t}%)`;};
const fmt=v=>M.valid(v)?Number(v.toPrecision(5)).toString():'缺测';
const ranges=Object.fromEntries(Object.entries(D.variables).map(([n,v])=>[n,extent(v.values)]));
function setup(id,xrange,yrange,xlabel,ylabel,invert=false){
  const canvas=$(id), rect=canvas.getBoundingClientRect(), ratio=window.devicePixelRatio||1;
  canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.round(rect.height*ratio);
  const c=canvas.getContext('2d');c.scale(ratio,ratio);
  const w=rect.width,h=rect.height,p={l:66,r:w-18,t:18,b:h-49};
  const sx=v=>p.l+(v-xrange[0])/(xrange[1]-xrange[0])*(p.r-p.l);
  const sy=v=>invert?p.t+(v-yrange[0])/(yrange[1]-yrange[0])*(p.b-p.t):p.b-(v-yrange[0])/(yrange[1]-yrange[0])*(p.b-p.t);
  c.fillStyle='#fff';c.fillRect(0,0,w,h);c.font='11px system-ui';
  for(let i=0;i<5;i++){
    const x=xrange[0]+(xrange[1]-xrange[0])*i/4,y=yrange[0]+(yrange[1]-yrange[0])*i/4;
    c.strokeStyle='#e5edf1';c.beginPath();c.moveTo(sx(x),p.t);c.lineTo(sx(x),p.b);c.moveTo(p.l,sy(y));c.lineTo(p.r,sy(y));c.stroke();
    c.fillStyle='#526b7b';c.textAlign='center';c.fillText(fmt(x),sx(x),p.b+16);c.textAlign='right';c.fillText(fmt(y),p.l-7,sy(y)+4);
  }
  c.fillStyle='#284d60';c.textAlign='center';c.fillText(xlabel,(p.l+p.r)/2,h-8);c.save();c.translate(13,(p.t+p.b)/2);c.rotate(-Math.PI/2);c.fillText(ylabel,0,0);c.restore();
  return {canvas,c,p,sx,sy,xrange,yrange};
}
function curve(plot,pairs){const {c,sx,sy}=plot;c.strokeStyle='#137b99';c.lineWidth=2;c.beginPath();let open=false;for(const [x,y] of pairs){if(!M.valid(x)||!M.valid(y)){open=false;continue;}if(open)c.lineTo(sx(x),sy(y));else c.moveTo(sx(x),sy(y));open=true;}c.stroke();for(const [x,y] of pairs){if(!M.valid(x)||!M.valid(y))continue;c.beginPath();c.arc(sx(x),sy(y),2.5,0,Math.PI*2);c.fillStyle='#137b99';c.fill();}}
function bounds(values){if(values.length===1)return [values[0]-.5,values[0]+.5];return [values[0]-(values[1]-values[0])/2,...values.slice(1).map((v,i)=>(v+values[i])/2),values.at(-1)+(values.at(-1)-values.at(-2))/2];}
const xb=bounds(D.x),yb=bounds(D.y),zb=bounds(D.z),depthRange=extent(D.z);
let mapPlot;
function drawMap(){
  const q=mapPlot=setup('map',[xb[0],xb.at(-1)],[yb[0],yb.at(-1)],'经度 (°E)','纬度 (°N)'),{c,sx,sy}=q,range=ranges[state.name];
  D.y.forEach((_,y)=>D.x.forEach((_,x)=>{c.fillStyle=color(M.at(D,state.name,state.t,state.z,y,x),range);c.fillRect(sx(xb[x]),sy(yb[y+1]),sx(xb[x+1])-sx(xb[x])+0.5,sy(yb[y])-sy(yb[y+1])+0.5);}));
  if($('currents').checked&&D.u&&D.v){
    const step=Math.max(1,Math.ceil(Math.max(D.x.length,D.y.length)/18));
    for(let y=0;y<D.y.length;y+=step)for(let x=0;x<D.x.length;x+=step){const u=M.at(D,D.u,state.t,state.z,y,x),v=M.at(D,D.v,state.t,state.z,y,x);if(!M.valid(u)||!M.valid(v)||Math.hypot(u,v)===0)continue;const cosLat=Math.cos(D.y[y]*Math.PI/180);if(Math.abs(cosLat)<1e-6)continue;const dx=u/cosLat*(q.p.r-q.p.l)/(q.xrange[1]-q.xrange[0]),dy=-v*(q.p.b-q.p.t)/(q.yrange[1]-q.yrange[0]),angle=Math.atan2(dy,dx),px=sx(D.x[x]),py=sy(D.y[y]),len=12,ex=px+Math.cos(angle)*len,ey=py+Math.sin(angle)*len;c.strokeStyle='#173447';c.lineWidth=1.4;c.beginPath();c.moveTo(px,py);c.lineTo(ex,ey);c.lineTo(ex-4*Math.cos(angle-.55),ey-4*Math.sin(angle-.55));c.moveTo(ex,ey);c.lineTo(ex-4*Math.cos(angle+.55),ey-4*Math.sin(angle+.55));c.stroke();}
  }
  c.strokeStyle='#091f31';c.lineWidth=2;c.setLineDash([5,3]);c.strokeRect(sx(state.box[0]),sy(state.box[3]),sx(state.box[2])-sx(state.box[0]),sy(state.box[1])-sy(state.box[3]));c.setLineDash([]);
  if(state.line){c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.moveTo(sx(state.line[0][0]),sy(state.line[0][1]));c.lineTo(sx(state.line[1][0]),sy(state.line[1][1]));c.stroke();c.strokeStyle='#18394c';c.lineWidth=2;c.stroke();}
  c.beginPath();c.arc(sx(D.x[state.x]),sy(D.y[state.y]),6,0,Math.PI*2);c.fillStyle='white';c.fill();c.strokeStyle='#103848';c.stroke();
  $('scale').textContent=`固定全时深色标：${fmt(range[0])} → ${fmt(range[1])} ${D.variables[state.name].units}；灰色＝缺测。${$('currents').checked?'箭头等长表示流向，不表示速度大小。':''}`;
}
function render(){
  $('quality').textContent=state.name+'：'+D.variables[state.name].quality+'。区域均值随当前水层变化；温盐图包含区域全部深度。';
  $('timeLabel').textContent=D.times[state.t];$('depthLabel').textContent=fmt(D.z[state.z]);
  drawMap();
  const unit=D.variables[state.name].units, pairs=M.profile(D,state.name,state.t,state.y,state.x),q=setup('profile',ranges[state.name],extent(D.z),`${state.name} (${unit})`,D.verticalLabel,true);curve(q,pairs);
  q.c.fillStyle='#e98527';q.c.beginPath();if(M.valid(pairs[state.z][0])){q.c.arc(q.sx(pairs[state.z][0]),q.sy(D.z[state.z]),5,0,Math.PI*2);q.c.fill();}
  $('pointInfo').textContent=`最近格点：${fmt(D.x[state.x])}°E，${fmt(D.y[state.y])}°N · 当前层 ${fmt(pairs[state.z][0])} ${unit}`;
  const series=M.series(D,state.name,state.z,state.box),sq=setup('series',extent(D.times.map((_,i)=>i)),extent(series),'时间索引（点击切换）',`${state.name} (${unit})`);curve(sq,series.map((v,i)=>[i,v]));
  sq.c.strokeStyle='#e98527';sq.c.beginPath();sq.c.moveTo(sq.sx(state.t),sq.p.t);sq.c.lineTo(sq.sx(state.t),sq.p.b);sq.c.stroke();
  $('regionInfo').textContent=`[${state.box.map(fmt).join(', ')}] · cos(纬度)有效格点加权 · 当前有效格点 ${M.mean(D,state.name,state.t,state.z,state.box).count}`;
  currentSection=null;
  const sec=state.line?M.section(D,state.name,state.t,state.line):null,sc=setup('section',sec?extent(sec.points.map(p=>p.distance)):[0,1],extent(D.z),'沿线距离 (km)',D.verticalLabel,true);
  if(sec){currentSection=sec;const eb=bounds(sec.points.map(p=>p.distance));sc.c.save();sc.c.beginPath();sc.c.rect(sc.p.l,sc.p.t,sc.p.r-sc.p.l,sc.p.b-sc.p.t);sc.c.clip();sec.values.forEach((row,z)=>row.forEach((v,i)=>{sc.c.fillStyle=color(v,ranges[state.name]);sc.c.fillRect(sc.sx(eb[i]),sc.sy(zb[z]),sc.sx(eb[i+1])-sc.sx(eb[i])+1,sc.sy(zb[z+1])-sc.sy(zb[z])+1);}));sc.c.restore();$('sectionInfo').textContent=`${state.line.map(p=>p.map(fmt).join('°, ')).join(' → ')} · ${fmt(sec.points.at(-1).distance)} km · 100 个最近格点采样，缺测不插值`;}
  else $('sectionInfo').textContent='选择“绘制断面”后，在地图上拖动指定两个端点。';
  const temp=$('temperature').value,salt=$('salinity').value;currentPairs=salt?M.ts(D,temp,salt,state.t,state.box):[];
  const tq=setup('ts',salt?ranges[salt]:[0,1],ranges[temp],salt?`${salt} (${D.variables[salt].units})`:'盐度',`${temp} (${D.variables[temp].units})`);
  for(const [s,t,z]of currentPairs){tq.c.fillStyle=color(z,depthRange);tq.c.globalAlpha=.55;tq.c.fillRect(tq.sx(s)-1.5,tq.sy(t)-1.5,3,3);}tq.c.globalAlpha=1;
  $('tsInfo').textContent=salt?`当前时间、框选区域、全部深度：${currentPairs.length} 个有效配对；颜色表示${D.verticalLabel}。${temp}：${D.variables[temp].quality}；${salt}：${D.variables[salt].quality}。不自动判定水团。`:'生成浏览视图时加入 salinity_variable，即可联动温盐关系图。';
}
for(const [name] of Object.entries(D.variables)){for(const id of ['variable','temperature','salinity']){const o=document.createElement('option');o.value=name;o.textContent=name;$ (id).append(o);}}
$('variable').value=D.initial;$('temperature').value=D.initial;
if(D.salinity)$('salinity').value=D.salinity;else{const o=document.createElement('option');o.value='';o.textContent='未提供盐度';$('salinity').prepend(o);$('salinity').value='';}
$('depthTitle').textContent=D.verticalLabel;$('quality').textContent=D.quality+'。区域均值随当前水层变化；温盐图包含区域全部深度。';
$('time').max=D.times.length-1;$('depth').max=D.z.length-1;$('currents').disabled=!(D.u&&D.v);$('play').disabled=D.times.length<2;
$('time').oninput=e=>{state.t=Number(e.target.value);render();};$('depth').oninput=e=>{state.z=Number(e.target.value);render();};
$('variable').onchange=e=>{state.name=e.target.value;render();};$('temperature').onchange=render;$('salinity').onchange=render;$('currents').onchange=render;
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(el=>el.classList.toggle('active',el===b));});
$('reset').onclick=()=>{state.box=[...whole];state.line=null;render();};
$('play').onclick=()=>{if(timer){clearInterval(timer);timer=null;$('play').textContent='播放时间';}else{timer=setInterval(()=>{state.t=(state.t+1)%D.times.length;$('time').value=state.t;render();},700);$('play').textContent='暂停';}};
function locationAt(e){const r=$('map').getBoundingClientRect(),{p,xrange,yrange}=mapPlot,xx=e.clientX-r.left,yy=e.clientY-r.top;return [Math.max(whole[0],Math.min(whole[2],xrange[0]+(xx-p.l)/(p.r-p.l)*(xrange[1]-xrange[0]))),Math.max(whole[1],Math.min(whole[3],yrange[1]-(yy-p.t)/(p.b-p.t)*(yrange[1]-yrange[0])))];}
$('map').onpointerdown=e=>{start=locationAt(e);$('map').setPointerCapture(e.pointerId);};
$('map').onpointerup=e=>{if(!start)return;const end=locationAt(e);if(state.mode==='point'){state.x=M.nearest(D.x,end[0]);state.y=M.nearest(D.y,end[1]);}else if(state.mode==='box'){state.box=[Math.min(start[0],end[0]),Math.min(start[1],end[1]),Math.max(start[0],end[0]),Math.max(start[1],end[1])];}else{if(Math.abs(end[0]-start[0])>180){$('error').textContent='跨日期变更线断面请先将经度转换为连续坐标并裁剪区域。';start=null;return;}state.line=[start,end];}$('error').textContent='';start=null;render();};
$('map').onpointercancel=()=>{start=null;};
$('series').onclick=e=>{const r=$('series').getBoundingClientRect();state.t=Math.max(0,Math.min(D.times.length-1,Math.round((e.clientX-r.left-66)/(r.width-84)*(D.times.length-1))));$('time').value=state.t;render();};
$('profile').onclick=e=>{const r=$('profile').getBoundingClientRect(),v=D.z[0]+(e.clientY-r.top-18)/(r.height-67)*(D.z.at(-1)-D.z[0]);state.z=M.nearest(D.z,v);$('depth').value=state.z;render();};
function csv(kind){let rows=[];if(kind==='profile')rows=[['time','longitude','latitude',D.verticalLabel,state.name+' ('+D.variables[state.name].units+')'],...M.profile(D,state.name,state.t,state.y,state.x).map(([v,z])=>[D.times[state.t],D.x[state.x],D.y[state.y],z,v])];
  if(kind==='series')rows=[['time',D.verticalLabel,'area_mean','valid_cells'],...D.times.map((t,i)=>{const m=M.mean(D,state.name,i,state.z,state.box);return[t,D.z[state.z],m.value,m.count];})];
  if(kind==='section'&&currentSection)rows=[['time','distance_km','longitude_requested','latitude_requested','longitude_selected','latitude_selected',D.verticalLabel,state.name],...currentSection.values.flatMap((row,z)=>row.map((v,i)=>{const p=currentSection.points[i];return[D.times[state.t],p.distance,p.lon,p.lat,D.x[p.ix],D.y[p.iy],D.z[z],v];}))];
  if(kind==='ts')rows=[['time','salinity','temperature',D.verticalLabel],...currentPairs.map(p=>[D.times[state.t],...p])];
  if(!rows.length){$('error').textContent='请先绘制断面。';return;}
  const text=rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const a=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='ocean_'+kind+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>csv(b.dataset.export));
window.addEventListener('resize',render);render();
