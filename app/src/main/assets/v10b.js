/* v10.1: (1) Bichim qo'shimchalari: chok zaxirasi, panel raqamlari va o'lchamlari, mato rulonida joylashtirish.
          (2) Optimallashtirish: balandlik va oldindan tarangligi bo'yicha eng yaxshi variantni qidirish.
   Barcha shakllar uchun ishlaydi (erkin shakl uchun v9 dagi bichim bo'limi bor). Taxminiy, konsept darajasida. */
(function(){
"use strict";
const $=(s,r)=>(r||document).querySelector(s);
const H=()=>window.MH;
const tr=t=>{try{return H().tr(t);}catch(e){return t;}};
const fmt=(v,d)=>{const f=H().fmt1;return f?f(v,d):(+v).toFixed(d);};
const kv=items=>items.map(i=>"<div><b"+(i[2]?' class="'+i[2]+'"':"")+">"+i[1]+"</b><span>"+tr(i[0])+"</span></div>").join("");
const seg=(id,arr)=>'<div class="seg" id="'+id+'">'+arr.map((a,i)=>'<button type="button" data-v="'+a[0]+'" aria-pressed="'+(i===0)+'">'+a[1]+"</button>").join("")+"</div>";
const slider=(id,label,min,max,step)=>'<div class="fld"><label for="'+id+'"><span>'+label+'</span> <em id="'+id+'-v"></em></label><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" style="width:100%;accent-color:var(--accent)"></div>';
const mat=()=>{const S=H().S;return S.types[S.mtype]||{};};
function bindSeg(id,fn){const e=$("#"+id);e.addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;Array.from(e.children).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));fn(b.dataset.v);});}
const segVal=id=>{const b=$("#"+id+' [aria-pressed="true"]');return b?b.dataset.v:"";};

const CSS=`
.pt2svg{overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:6px;margin-top:10px}
.pt2svg svg{display:block;width:100%;height:auto;min-width:340px}
.pt2svg .cut{fill:var(--p2f,#EAF3F4);stroke:var(--p2c,#0B3C49);stroke-width:var(--sw,4)}
.pt2svg .sew{fill:none;stroke:#D98A1F;stroke-dasharray:18 12;stroke-width:var(--sw,4)}
.pt2svg .lab{fill:var(--p2c,#0B3C49);font-weight:700;text-anchor:middle}
.pt2svg .dim{fill:var(--mute,#5B6B79);text-anchor:middle}
.pt2svg .rollbox{fill:none;stroke:var(--mute,#5B6B79);stroke-dasharray:30 20;stroke-width:var(--sw,4)}
:root{--p2f:#EAF3F4;--p2c:#0B3C49}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--p2f:#16313A;--p2c:#BFE3E8}}
:root[data-theme="dark"]{--p2f:#16313A;--p2c:#BFE3E8}
.opg{border-collapse:separate;border-spacing:3px;width:100%;table-layout:fixed}
.opg th{font-size:11px;font-weight:600;color:var(--mute);padding:2px;text-align:center}
.opg td{border-radius:8px;height:38px;text-align:center;font-size:11px;font-weight:700;cursor:pointer;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45);padding:0}
.opg td.best{outline:3px solid var(--accent);outline-offset:1px}
.opg td.cur{box-shadow:inset 0 0 0 2px #fff}
.opg td.bad{opacity:.38}
.opg td.na{background:var(--line);color:var(--mute);text-shadow:none;cursor:default}
.opb{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:13px}
.opb i{display:block;height:10px;border-radius:5px;background:linear-gradient(90deg,#0E6F85,#8FD3C8)}
.opb.sel i{background:linear-gradient(90deg,#D98A1F,#F4A93D)}
`;

/* ================= 1. BICHIM QO'SHIMCHALARI ================= */
const PT=`<h3>Bichim: chok zaxirasi va rulon</h3>
<p class="hint">Membrana tasmalarga bo'linib yoyiladi. Har bir panelga chok zaxirasi qo'shiladi, raqam va o'lcham yoziladi, so'ng panellar mato rulonida joylashtirilib, mato sarfi va chiqindi hisoblanadi. Barcha shakllar uchun. Taxminiy: ishlab chiqarishdan oldin bichim dasturida tekshiring.</p>
<div class="grid">
${slider("pt2-rw","Mato eni (m)",1,5,0.1)}
${slider("pt2-sa","Chok zaxirasi (mm, har tomonga)",0,100,5)}
${slider("pt2-cmp","Kompensatsiya (%)",0,6,0.5)}
</div>
${seg("pt2-ax",[["auto","Avto"],["x","X bo'yicha kesish"],["z","Y bo'yicha kesish"]])}
<div class="vrow" style="margin-top:8px"><button type="button" class="plain prim" id="pt2-go">Bichimni hisoblash</button></div>
<div class="note warn" id="pt2-warn" hidden></div>
<div id="pt2-out" hidden>
 <div class="kv" id="pt2-kv"></div>
 ${seg("pt2-vw",[["roll","Rulonda joylashtirish"],["flat","Panellar"]])}
 <div class="pt2svg" id="pt2-prev"></div>
 <div class="tw"><table class="vt" id="pt2-tbl"></table></div>
 <div class="vrow"><button type="button" class="plain" id="pt2-svg">SVG</button><button type="button" class="plain" id="pt2-dxf">DXF</button></div>
 <div class="note" id="pt2-note" hidden></div>
</div>`;
const P2={res:null,key:"",lay:null};

function signed(p){let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;}
function offset(pts,a){
  const p=[];pts.forEach(x=>{const l=p[p.length-1];if(!l||Math.hypot(x[0]-l[0],x[1]-l[1])>1e-6)p.push(x);});
  if(p.length>2&&Math.hypot(p[0][0]-p[p.length-1][0],p[0][1]-p[p.length-1][1])<1e-6)p.pop();
  if(p.length<3||a<=0)return p.map(x=>x.slice());
  const ccw=signed(p)>0,n=p.length,o=[];
  for(let i=0;i<n;i++){
    const A=p[(i+n-1)%n],B=p[i],C=p[(i+1)%n];
    const nrm=(u,v)=>{const dx=v[0]-u[0],dy=v[1]-u[1],l=Math.hypot(dx,dy)||1;return ccw?[dy/l,-dx/l]:[-dy/l,dx/l];};
    const n1=nrm(A,B),n2=nrm(B,C),d=1+n1[0]*n2[0]+n1[1]*n2[1];
    let vx=(n1[0]+n2[0])/Math.max(d,0.25)*a,vy=(n1[1]+n2[1])/Math.max(d,0.25)*a;
    const m=Math.hypot(vx,vy);if(m>3*a){vx*=3*a/m;vy*=3*a/m;}
    o.push([B[0]+vx,B[1]+vy]);
  }
  return o;
}
const bbox=p=>{let a=1e18,b=1e18,c=-1e18,d=-1e18;p.forEach(x=>{a=Math.min(a,x[0]);b=Math.min(b,x[1]);c=Math.max(c,x[0]);d=Math.max(d,x[1]);});return [a,b,c,d];};

/* panellarni tayyorlash: mahalliy koordinata (uzunlik X bo'ylab), chok zaxirali kontur */
function prepare(res,sa){
  const items=res.panels.map(q=>{
    const loc=q.outline.map(a=>q.swap?[a[1],a[0]]:[a[0],a[1]]);
    const b0=bbox(loc);const sew=loc.map(a=>[a[0]-b0[0],a[1]-b0[1]]);
    const cut=offset(sew,sa);const b=bbox(cut);
    return {id:q.id,sew:sew,cut:cut,bb:b,len:b[2]-b[0],wid:b[3]-b[1],area:Math.abs(signed(sew)),carea:Math.abs(signed(cut)),flag:q.flag,strain:q.smax,len0:q.len,wid0:q.wid};
  });
  return items;
}
/* rulonda joylashtirish: tokchalar (NFDH): rulon eni bo'yicha yonma-yon, uzunligi bo'yicha ketma-ket */
function layRoll(items,rw,gap){
  const sorted=items.slice().sort((a,b)=>b.len-a.len);
  const shelves=[];let cur=null;
  sorted.forEach(it=>{
    if(!cur||cur.w+it.wid+gap>rw+1e-9){cur={w:0,l:0,items:[]};shelves.push(cur);}
    it.ry=cur.w;cur.w+=it.wid+gap;cur.l=Math.max(cur.l,it.len);cur.items.push(it);
  });
  let x=0;
  shelves.forEach(s=>{s.x=x;s.items.forEach(it=>{it.rx=x;});x+=s.l+gap;});
  return {shelves,length:Math.max(0,x-gap),rw};
}
function layFlat(items,res){
  const rowW=Math.max(8,res.rw*4,items.reduce((m,i)=>Math.max(m,i.len),0)*1.0);let cx=0,cy=0,rh=0;const g=0.15;
  items.forEach(it=>{
    if(cx>0&&cx+it.len>rowW){cx=0;cy+=rh+g;rh=0;}
    it.fx=cx;it.fy=cy;cx+=it.len+g;rh=Math.max(rh,it.wid);
  });
  return {w:items.reduce((m,i)=>Math.max(m,i.fx+i.len),0),h:cy+rh};
}
function toSvg(items,mode,W,Hh,rw,themed,title){
  const sc=1000,pad=0.35,vw=(W+pad*2)*sc,vh=(Hh+pad*2)*sc,sw=Math.max(3,Math.round(vw/420));
  const fs=Math.max(220,Math.round(vw/34));
  let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+vw.toFixed(0)+" "+vh.toFixed(0)+'"'+(themed?"":' width="'+((W+pad*2)*100).toFixed(0)+'mm" height="'+((Hh+pad*2)*100).toFixed(0)+'mm"')+' style="--sw:'+sw+'">\n';
  if(!themed)s+='<style>.cut{fill:#EAF3F4;stroke:#0B3C49;stroke-width:'+sw+'}.sew{fill:none;stroke:#D98A1F;stroke-dasharray:18 12;stroke-width:'+sw+'}.lab{fill:#0B3C49;font-family:sans-serif;font-weight:700;text-anchor:middle}.dim{fill:#5B6B79;font-family:sans-serif;text-anchor:middle}.rollbox{fill:none;stroke:#5B6B79;stroke-dasharray:30 20;stroke-width:'+sw+'}</style>\n';
  s+='<!-- Units: mm (viewBox). '+(title||"Membrane cutting layout")+'. Solid = cut line (with seam allowance), dashed = sewn/weld line -->\n';
  if(mode==="roll")s+='<rect class="rollbox" x="'+(pad*sc)+'" y="'+(pad*sc)+'" width="'+(W*sc).toFixed(0)+'" height="'+(rw*sc).toFixed(0)+'"/>\n';
  const P=a=>((a[0])*sc).toFixed(0)+","+((a[1])*sc).toFixed(0);
  items.forEach(it=>{
    const ox=(mode==="roll"?it.rx:it.fx)+pad-it.bb[0],oy=(mode==="roll"?it.ry:it.fy)+pad-it.bb[1];
    const mv=p=>[p[0]+ox,p[1]+oy];
    s+='<polygon class="cut" points="'+it.cut.map(a=>P(mv(a))).join(" ")+'"/>\n';
    if(it.cut!==it.sew&&Math.abs(it.carea-it.area)>1e-6)s+='<polygon class="sew" points="'+it.sew.map(a=>P(mv(a))).join(" ")+'"/>\n';
    const c=it.sew.reduce((m,a)=>[m[0]+a[0],m[1]+a[1]],[0,0]).map(v=>v/it.sew.length),cc=mv(c);
    s+='<text class="lab" font-size="'+fs+'" x="'+(cc[0]*sc).toFixed(0)+'" y="'+(cc[1]*sc).toFixed(0)+'">P'+it.id+'</text>\n';
    s+='<text class="dim" font-size="'+Math.round(fs*0.6)+'" x="'+(cc[0]*sc).toFixed(0)+'" y="'+((cc[1]*sc)+fs*0.95).toFixed(0)+'">'+it.len0.toFixed(2)+" × "+it.wid0.toFixed(2)+" m</text>\n";
    /* ip yo'nalishi (arqoq-o'rim): rulon uzunligi bo'ylab strelka */
    const ax=cc[0]*sc,ay=cc[1]*sc-fs*0.95,ln=Math.min(it.len*sc*0.28,fs*3);
    s+='<path d="M'+(ax-ln).toFixed(0)+","+ay.toFixed(0)+" L"+(ax+ln).toFixed(0)+","+ay.toFixed(0)+" M"+(ax+ln-fs*0.35).toFixed(0)+","+(ay-fs*0.25).toFixed(0)+" L"+(ax+ln).toFixed(0)+","+ay.toFixed(0)+" L"+(ax+ln-fs*0.35).toFixed(0)+","+(ay+fs*0.25).toFixed(0)+'" fill="none" stroke="#D98A1F" stroke-width="'+sw+'"/>\n';
  });
  return s+"</svg>\n";
}
function toDxf(items,mode){
  const L=["0","SECTION","2","ENTITIES"],add=(...a)=>a.forEach(x=>L.push(String(x)));
  items.forEach(it=>{
    const ox=(mode==="roll"?it.rx:it.fx)-it.bb[0],oy=(mode==="roll"?it.ry:it.fy)-it.bb[1];
    const poly=(pts,layer)=>{add(0,"POLYLINE",8,layer,66,1,70,1);pts.forEach(a=>add(0,"VERTEX",8,layer,10,((a[0]+ox)*1000).toFixed(2),20,((a[1]+oy)*1000).toFixed(2),30,0));add(0,"SEQEND",8,layer);};
    poly(it.cut,"CUT");if(Math.abs(it.carea-it.area)>1e-6)poly(it.sew,"SEW");
    const c=it.sew.reduce((m,a)=>[m[0]+a[0],m[1]+a[1]],[0,0]).map(v=>v/it.sew.length);
    add(0,"TEXT",8,"LABEL",10,((c[0]+ox)*1000).toFixed(1),20,((c[1]+oy)*1000).toFixed(1),30,0,40,200,1,"P"+it.id);
  });
  add(0,"ENDSEC",0,"EOF");return L.join("\n")+"\n";
}
const ptKey=()=>{const S=H().S,g=H().R&&H().R.g;const p=(g&&g.pos)||[];let s=p.length+":";for(let i=0;i<p.length;i+=Math.max(3,Math.floor(p.length/37)*3))s+=p[i].toFixed(2)+",";return s+"|"+[S.shape,S.L,S.W,S.Hb,S.Hr,S.mtype].join(",")+"|"+[$("#pt2-rw").value,$("#pt2-sa").value,$("#pt2-cmp").value,segVal("pt2-ax")].join(",");};
function ptRender(){
  const r=P2.res;if(!r)return;
  const mode=segVal("pt2-vw")||"roll",T=mat();
  const W=mode==="roll"?Math.max(P2.lay.length,1):Math.max(P2.flat.w,1),Hh=mode==="roll"?P2.lay.rw:Math.max(P2.flat.h,0.5);
  $("#pt2-prev").innerHTML=toSvg(P2.items,mode,W,Hh,P2.lay.rw,true,"Taiyo Sky");
  $("#pt2-tbl").innerHTML="<tr><th>№</th><th>"+tr("Uzunlik")+"</th><th>"+tr("Eni")+"</th><th>"+tr("Maydon")+"</th></tr>"+P2.items.map(p=>"<tr"+(p.flag?' style="color:var(--bad)"':"")+"><td>P"+p.id+"</td><td>"+fmt(p.len0,2)+" m</td><td>"+fmt(p.wid0,2)+" m</td><td>"+fmt(p.area,1)+" m²</td></tr>").join("");
}
function ptRun(){
  const Hh=H();if(!Hh.R||!Hh.R.g||!Hh.R.g.pos||!window.MH9)return;
  const b=$("#pt2-go"),T=mat(),warn=$("#pt2-warn");b.disabled=true;b.textContent=tr("Hisoblanmoqda...");
  setTimeout(()=>{
    try{
      const rw=+$("#pt2-rw").value,sa=(+$("#pt2-sa").value)/1000;
      const res=window.MH9.flatten(Hh.R.g,{rw:rw-2*sa>0.2?rw-2*sa:rw,cmp:+$("#pt2-cmp").value,axis:segVal("pt2-ax")});
      const items=prepare(res,sa);
      const lay=layRoll(items,rw,0.02),flat=layFlat(items,res);
      P2.res=res;P2.items=items;P2.lay=lay;P2.flat=flat;P2.key=ptKey();
      const cutA=items.reduce((m,i)=>m+i.carea,0),netA=items.reduce((m,i)=>m+i.area,0),rollA=lay.length*rw;
      const waste=rollA>0?(1-cutA/rollA)*100:0,rolls=Math.ceil(lay.length/(T.rollL||50)),mcost=rollA*(T.price||0)*(T.layers||1);
      let seam=0;items.forEach(it=>{const p=it.sew;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];seam+=Math.hypot(q[0]-p[i][0],q[1]-p[i][1]);}});
      const wide=items.filter(i=>i.wid>rw+1e-6).length;
      $("#pt2-kv").innerHTML=kv([["Panellar soni",String(items.length)],["Rulon uzunligi",fmt(lay.length,1)+" m"],["Mato sarfi",fmt(rollA,0)+" m²"],["Kesilgan maydon",fmt(cutA,0)+" m²"],["Chiqindi",fmt(waste,1)+"%",waste>25?"bad":""],["Rulonlar ("+(T.rollL||50)+" m)",String(rolls)],["Material narxi",H().usd?H().usd(mcost):fmt(mcost,0)],["Chok uzunligi",fmt(seam/2,0)+" m"]]);
      const msgs=[];
      if(wide)msgs.push(tr("Ba'zi panellar chok zaxirasi bilan mato enidan keng. Mato enini kattalashtiring yoki zaxirani kamaytiring."));
      if(res.nflag)msgs.push(tr("Qizil panellarda deformatsiya katta (ustun uchi yoki keskin burchak yaqinida): ularda naqsh taxminiy, qo'shimcha kesish yoki halqa kerak."));
      warn.hidden=!msgs.length;warn.innerHTML=msgs.map(m=>"<div>"+m+"</div>").join("");
      $("#pt2-out").hidden=false;ptRender();
    }catch(e){warn.hidden=false;warn.textContent=String(e&&e.message||e);}
    b.disabled=false;b.textContent=tr("Bichimni hisoblash");
  },30);
}
function ptStale(){
  const free=H().S.shape==="free",card=$("#pt2-card");if(!card)return;
  card.style.display=free?"none":"";
  const rwe=$("#pt2-rw"),T=mat();if(rwe&&!rwe.dataset.t&&T.rollW&&Math.abs(+rwe.value-T.rollW)>1e-9){rwe.value=T.rollW;$("#pt2-rw-v").textContent=fmt(T.rollW,1)+" m";}
  if(P2.res&&P2.key!==ptKey()){P2.res=null;$("#pt2-out").hidden=true;$("#pt2-warn").hidden=false;$("#pt2-warn").textContent=tr("Shakl yoki sozlama o'zgardi. Naqshni qayta hisoblang.");}
}
function ptInit(anchor){
  const card=document.createElement("div");card.className="card cardx";card.id="pt2-card";card.innerHTML=PT;
  anchor.insertAdjacentElement("afterend",card);
  const T=mat(),rw=$("#pt2-rw"),sa=$("#pt2-sa"),cm=$("#pt2-cmp");
  rw.value=T.rollW||2.5;sa.value=30;cm.value=1.5;
  const lab=()=>{$("#pt2-rw-v").textContent=fmt(+rw.value,1)+" m";$("#pt2-sa-v").textContent=sa.value+" mm";$("#pt2-cmp-v").textContent=cm.value+"%";};lab();
  [rw,sa,cm].forEach(e=>e.addEventListener("input",lab));
  rw.addEventListener("input",()=>{rw.dataset.t="1";});P2.rwType=T.rollW||2.5;
  bindSeg("pt2-ax",()=>{});bindSeg("pt2-vw",()=>ptRender());
  $("#pt2-go").addEventListener("click",ptRun);
  $("#pt2-svg").addEventListener("click",()=>{if(!P2.res)return;const m=segVal("pt2-vw")||"roll";H().exportFile("membrane-"+m+"-layout.svg","image/svg+xml",toSvg(P2.items,m,m==="roll"?P2.lay.length:P2.flat.w,m==="roll"?P2.lay.rw:P2.flat.h,P2.lay.rw,false,"Taiyo Sky"),"#pt2-note");});
  $("#pt2-dxf").addEventListener("click",()=>{if(!P2.res)return;const m=segVal("pt2-vw")||"roll";H().exportFile("membrane-"+m+"-layout.dxf","application/dxf",toDxf(P2.items,m),"#pt2-note");});
}

/* ================= 2. OPTIMALLASHTIRISH ================= */
const OP=`<h3>Optimallashtirish</h3>
<p class="hint">Balandlik (Hr, Hb) bo'yicha ko'p variant tez hisoblanadi: narx va zaxira koeffitsiyenti. Eng yaxshi 3 tasi uchun to'liq yuklama tahlili o'tkaziladi, keyin eng yaxshisining oldindan tarangligi tanlanadi. Maqsadni tanlang va qidiring.</p>
${seg("op-goal",[["cost","Eng arzon"],["safe","Eng ishonchli"],["bal","Muvozanat"]])}
<div class="vrow" style="margin-top:8px"><button type="button" class="plain prim" id="op-go">Eng yaxshisini qidirish</button></div>
<div class="note" id="op-note" hidden></div>
<div id="op-out" hidden>
 <div class="kv" id="op-kv"></div>
 <h3 style="margin-top:14px">Variantlar xaritasi</h3>
 ${seg("op-map",[["cost","Narx"],["eta","Zaxira (η)"],["area","Maydon"]])}
 <div style="overflow-x:auto;margin-top:8px"><table class="opg" id="op-grid"></table></div>
 <div class="hint" id="op-legend"></div>
 <h3 style="margin-top:14px">Oldindan taranglik</h3>
 <div id="op-ps"></div>
 <div class="vrow" style="margin-top:10px"><button type="button" class="plain prim" id="op-apply">Eng yaxshisini qo'llash</button><button type="button" class="plain" id="op-reset">Asl holatga</button></div>
 <div class="hint" id="op-hint"></div>
</div>`;
const O={busy:false,cells:[],best:null,orig:null,s0opt:null,psRows:[],HR:[],HB:[],hbUsed:true};

function evalVar(Hr,Hb){
  const S=H().S,Hr0=S.Hr,Hb0=S.Hb;
  S.Hr=Hr;S.Hb=Hb;
  try{
    const r=H().compute(),m=S.sfMode==="partial"?r.chk.partial:r.chk.global;
    return {Hr:Hr,Hb:Hb,cost:r.cost,price:r.price,area:r.net,eta:m.eta,nmin:m.nmin,ok:m.eta<=0.8&&m.nmin>=0};
  }catch(e){return null;}finally{S.Hr=Hr0;S.Hb=Hb0;}
}
function pickBest(cells,goal){
  const v=cells.filter(c=>c);if(!v.length)return null;
  const ok=v.filter(c=>c.ok);let pool=ok;
  if(!pool.length){const me0=Math.min.apply(null,v.map(c=>c.eta));pool=v.filter(c=>c.eta<=me0*1.05);goal=goal==="cost"?"cost":goal;}
  const mc=Math.min.apply(null,pool.map(c=>c.cost)),me=Math.min.apply(null,pool.map(c=>c.eta));
  const sc=c=>goal==="cost"?c.cost:goal==="safe"?c.eta:0.5*c.cost/mc+0.5*c.eta/Math.max(me,1e-6);
  const sorted=pool.slice().sort((a,b)=>sc(a)-sc(b));
  return {best:sorted[0],top:sorted.slice(0,3),feasible:ok.length>0};
}
function gridRender(){
  const metric=segVal("op-map")||"cost",rows=O.hbUsed?O.HB:[O.HB[0]],tbl=$("#op-grid");
  const val=c=>metric==="cost"?c.cost:metric==="eta"?c.eta:c.area;
  const all=O.cells.filter(c=>c),lo=Math.min.apply(null,all.map(val)),hi=Math.max.apply(null,all.map(val));
  const cs=window.MH10&&window.MH10.cmap;
  const fm=metric==="cost"?v=>(H().usdK?H().usdK(v):fmt(v,0)):metric==="eta"?v=>fmt(v,2):v=>fmt(v,0);
  let h="<tr><th>"+(O.hbUsed?"Hb \\ Hr":"Hr")+"</th>"+O.HR.map(x=>"<th>"+fmt(x,1)+"</th>").join("")+"</tr>";
  rows.forEach((hb,j)=>{
    h+="<tr><th>"+(O.hbUsed?fmt(hb,1):"")+"</th>";
    O.HR.forEach((hr,i)=>{
      const c=O.cells[j*O.HR.length+i];
      if(!c){h+='<td class="na">–</td>';return;}
      const t=hi>lo?(val(c)-lo)/(hi-lo):0.5,col=cs?cs(metric==="area"?t:t):[0.1,0.5,0.6];
      const cls=(O.best&&c.Hr===O.best.Hr&&c.Hb===O.best.Hb?" best":"")+(Math.abs(c.Hr-O.orig.Hr)<1e-9&&Math.abs(c.Hb-O.orig.Hb)<1e-9?" cur":"")+(c.ok?"":" bad");
      h+='<td class="'+cls.trim()+'" data-i="'+(j*O.HR.length+i)+'" style="background:rgb('+col.map(x=>Math.round(x*255)).join(",")+')">'+fm(val(c))+"</td>";
    });
    h+="</tr>";
  });
  tbl.innerHTML=h;
  $("#op-legend").innerHTML=tr("Kichik")+" → "+tr("katta")+" ("+fm(lo)+" … "+fm(hi)+"). "+tr("Qalin ramka: eng yaxshisi. Oq ichki chiziq: hozirgi. Xira katak: zaxira yetmaydi (η>0,8 yoki tarang yo'qoladi).");
}
function summary(){
  const o=O.orig,b=O.best;if(!b)return;
  const d=(a,c)=>(c-a)/a*100,sg=v=>(v>0?"+":"")+fmt(v,1)+"%";
  $("#op-kv").innerHTML=kv([["Eng yaxshi Hr",fmt(b.Hr,1)+" m"],["Eng yaxshi Hb",fmt(b.Hb,1)+" m"],["Narx o'zgarishi",sg(d(o.cost,b.cost)),b.cost<=o.cost?"":"bad"],["Zaxira η: hozirgi → yangi",fmt(o.eta,2)+" → "+fmt(b.eta,2),b.eta>0.8?"bad":""],["Membrana maydoni",fmt(b.area,0)+" m² ("+sg(d(o.area,b.area))+")"]]);
}
function runOpt(){
  if(O.busy)return;const Hh=H(),S=Hh.S;
  const note=$("#op-note");note.hidden=false;
  if(S.shape==="free"){note.textContent=tr("Erkin shakl uchun optimallashtirish yo'q: nuqtalarni o'zingiz o'zgartiring.");return;}
  O.busy=true;$("#op-go").disabled=true;
  const Hr0=S.Hr,Hb0=S.Hb,f=[0.5,0.65,0.8,1,1.2,1.4,1.65],fb=[0.6,0.8,1,1.25,1.5];
  O.orig=evalVar(Hr0,Hb0)||{Hr:Hr0,Hb:Hb0,cost:0,eta:0,area:0};
  O.HR=f.map(k=>Math.round(Hr0*k*10)/10);O.HB=fb.map(k=>Math.round(Hb0*k*10)/10);
  /* Hb shaklga ta'sir qiladimi? */
  const a1=evalVar(O.HR[3],O.HB[0]),a2=evalVar(O.HR[3],O.HB[4]);
  O.hbUsed=!!(a1&&a2&&Math.abs(a1.area-a2.area)+Math.abs(a1.cost-a2.cost)>1e-6);
  const rowsB=O.hbUsed?O.HB:[Hb0];if(!O.hbUsed)O.HB=[Hb0];
  O.cells=[];const jobs=[];rowsB.forEach(hb=>O.HR.forEach(hr=>jobs.push([hr,hb])));
  let k=0;
  const fail=e=>{note.textContent=String(e&&e.message||e);O.busy=false;$("#op-go").disabled=false;try{Hh.refresh();}catch(x){}};
  (function sweep(){
    try{
      const t0=Date.now();
      while(k<jobs.length&&Date.now()-t0<60){O.cells.push(evalVar(jobs[k][0],jobs[k][1]));k++;}
      note.textContent=tr("Variantlar hisoblanmoqda")+" … "+k+"/"+jobs.length;
      if(k<jobs.length){setTimeout(sweep,0);return;}
      const pk=pickBest(O.cells,segVal("op-goal"));
      if(!pk){fail("hisob xatosi");return;}
      O.best=pk.best;O.feasible=pk.feasible;
      stage2(pk.top.slice(0,2));
    }catch(e){fail(e);}
  })();
}
/* 2-bosqich: eng yaxshi 3 variant uchun to'liq yuklama tahlili, so'ng taranglik */
function solveCase(Hr,Hb,s0f,cb){
  const Hh=H(),S=Hh.S,Hr0=S.Hr,Hb0=S.Hb,M10=window.MH10;
  S.Hr=Hr;S.Hb=Hb;let r,solver;
  try{
    r=Hh.compute();const T=r.T||mat();
    const cp=M10.caseParams(M10.st.cs,r,S,T),s0=(T.p0||4)*s0f;
    solver=M10.createSolver(r.g,{s0:s0,Et:T.ea||1000,pw:cp.pw,sk:cp.sk,wt:cp.wt,maxIt:6000});
    var T0=T,S0=s0;
  }catch(e){S.Hr=Hr0;S.Hb=Hb0;cb(null);return;}
  S.Hr=Hr0;S.Hb=Hb0;
  const t0=Date.now();
  (function loop(){
    let done=false;try{done=solver.step(120);}catch(e){cb(null);return;}
    if(!done&&Date.now()-t0<10000){setTimeout(loop,0);return;}
    const q=solver.finish();cb({s0:S0,smaxAll:q.smaxAll,slack:q.slack,wrinkle:q.wrinkle,dmax:q.dmax,uts:T0.uts||80,conv:q.converged});
  })();
}
function stage2(top){
  const note=$("#op-note"),S=H().S;let i=0;const out=[];
  const next=()=>{
    if(i>=top.length){chooseS(out);return;}
    note.textContent=tr("Yuklama tahlili")+" "+(i+1)+"/"+top.length+" …";
    const c=top[i];solveCase(c.Hr,c.Hb,1,r=>{if(r){c.sol=r;out.push(c);}i++;next();});
  };
  next();
}
function chooseS(sols){
  const note=$("#op-note");
  /* yuklama tahlili bo'yicha qayta saralash: tarang yo'qolmagan + eng kam kuchlanish */
  const goal=segVal("op-goal");
  if(sols.length){
    const good=sols.filter(c=>c.sol.conv&&c.sol.wrinkle<=1);const pool=good.length?good:sols;
    pool.sort((a,b)=>goal==="cost"?a.cost-b.cost:goal==="safe"?a.sol.smaxAll-b.sol.smaxAll:(a.cost/pool[0].cost+a.sol.smaxAll/pool[0].sol.smaxAll)-(b.cost/pool[0].cost+b.sol.smaxAll/pool[0].sol.smaxAll));
    O.best=pool[0];
  }
  const b=O.best,fs=[0.8,1,1.4];let j=0;O.psRows=[];
  const next=()=>{
    if(j>=fs.length){finish();return;}
    note.textContent=tr("Oldindan taranglik tanlanmoqda")+" "+(j+1)+"/"+fs.length+" …";
    const f=fs[j];solveCase(b.Hr,b.Hb,f,r=>{if(r){r.f=f;O.psRows.push(r);}j++;next();});
  };
  next();
}
function finish(){
  const note=$("#op-note");
  const rows=O.psRows;let best=null;
  rows.forEach(r=>{r.util=r.smaxAll/r.uts*100;r.okk=r.conv&&r.wrinkle<=0.5&&r.slack<=5;});
  const ok=rows.filter(r=>r.okk);
  if(ok.length)best=ok.reduce((a,c)=>c.smaxAll<a.smaxAll?c:a);
  const anyConv=rows.some(r=>r.conv);
  O.s0opt=best;
  $("#op-out").hidden=false;summary();gridRender();
  const mx=Math.max.apply(null,rows.map(r=>r.smaxAll),1);
  $("#op-ps").innerHTML=rows.length?rows.map(r=>'<div class="opb'+(r===best?" sel":"")+'"><span style="width:92px">'+fmt(r.s0,1)+" kN/m</span><i style=\"width:"+Math.round(r.smaxAll/mx*55)+'%"></i><span>σmax '+fmt(r.smaxAll,1)+" · "+tr("bo'shash")+" "+fmt(r.slack,0)+"%"+(r.conv?"":" · "+tr("yaqinlashmadi"))+(r.wrinkle>0.5?" · "+tr("g'ijim")+" "+fmt(r.wrinkle,0)+"%":"")+(r===best?" ★":"")+"</span></div>").join(""):'<div class="hint">'+tr("Hisob bajarilmadi")+"</div>";
  $("#op-hint").textContent=!best?(anyConv?tr("Hech bir taranglik bo'shashmaslikni ta'minlamadi: mato yoki shakl o'zgartirilsin."):tr("Bu shakl uchun yuklama tahlili ishonchsiz (yechim yaqinlashmadi, chekkalar erkin bo'lishi mumkin): faqat variantlar xaritasiga tayaning.")):tr("★: eng kam kuchlanish va bo'shashmaydigan oldindan taranglik")+" ("+fmt(best.s0,1)+" kN/m). "+tr("Hisob taxminiy: yakuniy qiymatni muhandis tasdiqlaydi.");
  note.textContent=O.feasible?tr("Qidiruv tugadi."):tr("Hech bir variant zaxira talabini bajarmadi: eng yaxshisi ko'rsatildi. Mato yoki ustun balandligini o'zgartirib ko'ring.");
  O.busy=false;$("#op-go").disabled=false;
  try{H().refresh();}catch(x){}
}
function applyBest(){
  const b=O.best;if(!b)return;const S=H().S;
  S.Hr=b.Hr;S.Hb=b.Hb;
  try{H().syncFields();}catch(e){}
  if(O.s0opt){const sl=$("#ld-s0");if(sl){sl.value=O.s0opt.s0;sl.dispatchEvent(new Event("input"));}}
  H().refresh();
  $("#op-note").hidden=false;$("#op-note").textContent=tr("Qo'llandi")+": Hr "+fmt(b.Hr,1)+" m, Hb "+fmt(b.Hb,1)+" m";
}
function resetOrig(){
  if(!O.orig)return;const S=H().S;S.Hr=O.orig.Hr;S.Hb=O.orig.Hb;
  try{H().syncFields();}catch(e){}
  H().refresh();$("#op-note").hidden=false;$("#op-note").textContent=tr("Asl holatga qaytarildi.");
}
function opInit(anchor){
  const card=document.createElement("div");card.className="card cardx";card.id="op-card";card.innerHTML=OP;
  anchor.insertAdjacentElement("afterend",card);
  bindSeg("op-goal",()=>{});bindSeg("op-map",()=>{if(O.cells.length)gridRender();});
  $("#op-go").addEventListener("click",runOpt);
  $("#op-apply").addEventListener("click",applyBest);
  $("#op-reset").addEventListener("click",resetOrig);
  $("#op-grid").addEventListener("click",e=>{
    const td=e.target.closest("td[data-i]");if(!td)return;const c=O.cells[+td.dataset.i];if(!c)return;
    O.best=c;summary();gridRender();
  });
}

function init(){
  const anchor=$("#ld-card");if(!anchor||!H()||$("#pt2-card"))return;
  const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
  ptInit(anchor);opInit($("#pt2-card"));
  const old=window.MH_refresh;window.MH_refresh=function(){if(old)old.apply(this,arguments);try{ptStale();}catch(e){}};
  ptStale();
}
window.addEventListener("load",()=>setTimeout(()=>setTimeout(init,0),120));
window.MH10b={prepare:prepare,layRoll:layRoll,offset:offset,runOpt:runOpt,ptRun:ptRun,O:O,P2:P2};
})();
