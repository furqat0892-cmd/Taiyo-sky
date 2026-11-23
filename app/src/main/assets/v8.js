/* ===== v8.1 core: sozlamalar, valyuta, shaharlar, umumiy yordamchilar ===== */
(function(){
"use strict";
const MH=window.MH;
if(!MH){return;}
const M8=window.MH8={};
const $=MH.$,$$=MH.$$,clamp=MH.clamp;
M8.esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
M8.cv2d=cv=>{
  const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return null;
  const d=Math.min(2,window.devicePixelRatio||1),W=Math.round(w*d),H=Math.round(h*d);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  const c=cv.getContext("2d");c.setTransform(d,0,0,d,0,0);return {c:c,w:w,h:h};
};
M8.tok=n=>{const v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return v||"#888";};

/* ---------- Ilova sozlamalari (loyihadan tashqari) ---------- */
const KEY="mh8-settings";
const RATES0={USD:1,JPY:159.7,SAR:3.75,UZS:11973,EUR:0.9015};
const DATE0="2026-11-13";
M8.st={cur:"USD",rates:Object.assign({},RATES0),ratesDate:DATE0,aiKey:"",aiModel:"gemini-flash-latest",theme:"auto",chat:[]};
try{const o=JSON.parse(localStorage.getItem(KEY)||"null");if(o){
  Object.assign(M8.st,o);M8.st.rates=Object.assign({},RATES0,o.rates||{});
  if(!M8.st.chat||!Array.isArray(M8.st.chat))M8.st.chat=[];}}catch(e){}
M8.saveSt=()=>{try{localStorage.setItem(KEY,JSON.stringify(M8.st));}catch(e){}};
M8.RATES0=RATES0;M8.DATE0=DATE0;
M8.CURS=["USD","JPY","SAR","UZS","EUR"];

/* valyuta: asosiy hisob AQSH dollarida, ko'rsatish tanlangan valyutada */
M8.setCur=(code,noRefresh)=>{
  if(M8.CURS.indexOf(code)<0)code="USD";
  M8.st.cur=code;M8.st.rates=Object.assign({},RATES0,M8.st.rates);
  const C=window.MH_CUR;C.code=code;C.rates=M8.st.rates;
  M8.saveSt();
  if(!noRefresh)MH.refresh("cur");
};
M8.applyTheme=()=>{
  const t=M8.st.theme,h=document.documentElement;
  if(t==="light"||t==="dark")h.setAttribute("data-theme",t);else h.removeAttribute("data-theme");
};

/* ---------- Shaharlar (taxminiy iqlim ko'rsatkichlari) ---------- */
/* tmax: eng issiq oyning o'rtacha kunduzgi harorati; tdes: hisobiy yozgi harorat; ghi: yillik o'rtacha, kWh/m2 kuniga;
   cs: sovutish mavsumining ulushi; f: xususiyatlar */
M8.CITIES={
  riyadh:{n:"Riyoz",c:"sa",lat:24.7,tmax:43,tdes:45,ghi:6.0,cs:0.65,f:{dust:1}},
  jeddah:{n:"Jidda",c:"sa",lat:21.5,tmax:38,tdes:42,ghi:5.8,cs:0.85,f:{dust:1,coast:1}},
  dammam:{n:"Dammam",c:"sa",lat:26.4,tmax:44,tdes:46,ghi:5.6,cs:0.7,f:{dust:1,coast:1}},
  tabuk:{n:"Tabuk (NEOM hududi)",c:"sa",lat:28.4,tmax:39,tdes:42,ghi:6.1,cs:0.5,f:{dust:1}},
  tokyo:{n:"Tokio",c:"jp",lat:35.7,tmax:31,tdes:34,ghi:3.7,cs:0.3,f:{coast:1,quake:1,snow:1}},
  osaka:{n:"Osaka",c:"jp",lat:34.7,tmax:33,tdes:35,ghi:3.9,cs:0.35,f:{coast:1,quake:1}},
  tashkent:{n:"Toshkent",c:"uz",lat:41.3,tmax:36,tdes:39,ghi:4.6,cs:0.35,f:{cold:1,quake:1}},
  samarkand:{n:"Samarqand",c:"uz",lat:39.7,tmax:35,tdes:38,ghi:4.8,cs:0.35,f:{cold:1,quake:1}},
  jizzakh:{n:"Jizzax",c:"uz",lat:40.1,tmax:37,tdes:40,ghi:4.9,cs:0.4,f:{cold:1,dust:1,quake:1}}
};
M8.DEFCITY={sa:"riyadh",jp:"osaka",uz:"tashkent"};
M8.KWH={sa:0.055,jp:0.19,uz:0.075};
M8.MAT={
  PVC:{tau:10,co2:6,life:20,U:5.5},
  PTFE:{tau:13,co2:10,life:40,U:5.0},
  ETFE:{tau:50,co2:9,life:35,U:2.9}
};

/* loyiha bilan birga saqlanadigan v8 maydonlari */
M8.V=()=>{
  const S=MH.S;if(!S.v8||typeof S.v8!=="object")S.v8={};
  const v=S.v8;
  if(v.cr!==S.region||!M8.CITIES[v.city]){
    if(!M8.CITIES[v.city]||v.cr!==S.region)v.city=M8.DEFCITY[S.region]||"riyadh";
    v.cr=S.region;
  }
  if(v.tauFor!==S.mtype||typeof v.tau!=="number"){v.tau=M8.MAT[S.mtype].tau;v.tauFor=S.mtype;}
  if(!v.space)v.space="semi";
  if(typeof v.cop!=="number")v.cop=3;
  if(typeof v.kwh!=="number"||v.kwhFor!==S.region){v.kwh=M8.KWH[S.region]||0.08;v.kwhFor=S.region;}
  if(typeof v.orient!=="number")v.orient=0;
  if(typeof v.hour!=="number")v.hour=12;
  if(typeof v.day!=="number")v.day=172;
  if(!v.cmp||typeof v.cmp!=="object")v.cmp={};
  return v;
};
M8.city=()=>M8.CITIES[M8.V().city];

/* ---------- Bo'lim ro'yxati va render kancalari ---------- */
M8.renderers={};
M8.reg=(tab,fn)=>{M8.renderers[tab]=fn;};
window.MH_show=t=>{const f=M8.renderers[t];if(f){try{f();}catch(e){console.error(e);}}};
let hdrKey="";
window.MH_refresh=()=>{
  const lab=$("#st-price")&&$("#st-price").parentNode&&$("#st-price").parentNode.querySelector("span");
  if(lab){const t=MH.tr("Narx")+" · "+M8.st.cur;if(lab.textContent!==t)lab.textContent=t;}
  M8.V();
  const f=M8.renderers[MH.cur];if(f&&hdrKey!==MH.cur+"x"){/* hozirgi bo'lim yangilanadi */}
  if(f){try{f();}catch(e){console.error(e);}}
};

/* ---------- Matn yordamchilari ---------- */
M8.t=s=>MH.tr(s);
M8.kv=(host,items)=>{host.innerHTML=items.map(i=>'<div><b'+(i[2]?' class="'+i[2]+'"':'')+'>'+i[1]+'</b><span>'+M8.esc(i[0])+'</span></div>').join("");};
M8.chk=(host,items)=>{host.innerHTML=items.map(c=>'<div class="ck '+(c[0]?"ok":"wn")+'"><i></i><span>'+M8.esc(c[1])+'</span><b>'+M8.esc(c[2]||"")+'</b></div>').join("");};
M8.fillSelect=(sel,opts,val)=>{
  const h=opts.map(o=>'<option value="'+M8.esc(o[0])+'">'+M8.esc(o[1])+'</option>').join("");
  if(sel.__h!==h){sel.innerHTML=h;sel.__h=h;}
  sel.value=val;
};
M8.toast=(host,msg)=>{host.hidden=false;host.textContent=msg;};

M8.init=()=>{
  M8.applyTheme();
  M8.setCur(M8.st.cur,true);
  try{if(MH.cur&&M8.renderers[MH.cur])M8.renderers[MH.cur]();}catch(e){}
  MH.refresh("v8");
};
})();

/* ===== v8.1 modullar: iqlim, solishtirish, quyosh, hisobot, saqlash, AI, sozlamalar ===== */
(function(){
"use strict";
const MH=window.MH,M8=window.MH8;if(!MH||!M8)return;
const $=MH.$,$$=MH.$$,esc=M8.esc,fmt=MH.fmt,fmt1=MH.fmt1,usd=MH.usd,usdK=MH.usdK,t=M8.t;
const num=(el,fn)=>el.addEventListener("input",()=>{const v=parseFloat(String(el.value).replace(",","."));if(isFinite(v)){fn(v);MH.save();MH.refresh("v8");}});
const D2R=Math.PI/180;

/* ---------- IQLIM ---------- */
function monthlyGHI(c){
  const lat=c.lat*D2R,days=[31,28,31,30,31,30,31,31,30,31,30,31];let n=0,raw=[];
  days.forEach(d=>{n+=d/2;const dec=23.44*D2R*Math.sin(2*Math.PI*(284+n)/365);n+=d/2;
    const x=-Math.tan(lat)*Math.tan(dec),ws=Math.acos(Math.max(-1,Math.min(1,x)));
    const e=1+0.033*Math.cos(2*Math.PI*n/365);
    raw.push(e*(ws*Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.sin(ws))*(0.5+0.0));});
  const mean=raw.reduce((a,b)=>a+b,0)/12;return raw.map(v=>v/mean*c.ghi);
}
const SPACES=[["open","Ochiq maydon (sovutilmaydi)"],["semi","Yarim yopiq (shamollatiladi)"],["ac","Konditsionerli yopiq joy"]];
const SF={open:0,semi:0.3,ac:0.6};
function climate(){
  const v=M8.V(),c=M8.city(),R=MH.R,A=R.g.plan,tau=v.tau/100;
  const ghiY=c.ghi*365;
  const under=ghiY*A*(1-tau);              // tom to'sgan quyosh energiyasi
  const gain=ghiY*A*tau;                   // o'tgan energiya
  const load=gain*SF[v.space]*c.cs;        // sovutish yuklamasi
  const el=load/Math.max(1,v.cop),cost=el*v.kwh;
  return {v,c,A,tau,ghiY,under,gain,load,el,cost};
}
function renderClimate(){
  if(!MH.R)return;const k=climate(),v=k.v,c=k.c,S=MH.S;
  M8.fillSelect($("#cl-city"),Object.keys(M8.CITIES).map(i=>[i,M8.CITIES[i].n]),v.city);
  M8.fillSelect($("#cl-space"),SPACES,v.space);
  const set=(id,val)=>{const e=$(id);if(document.activeElement!==e)e.value=val;};
  set("#cl-tau",v.tau);set("#cl-kwh",v.kwh);set("#cl-cop",v.cop);
  M8.kv($("#cl-kv"),[
    ["Quyosh nuri (yillik, gorizontal), kWh/m²",fmt(k.ghiY)],
    ["Tom to'sgan quyosh energiyasi, MWh/yil",fmt(k.under/1000)],
    ["Tom ostiga o'tgan energiya, MWh/yil",fmt(k.gain/1000)],
    ["Sovutish uchun elektr, MWh/yil",fmt1(k.el/1000,1)],
    ["Sovutish xarajati, yiliga",usd(k.cost)],
    ["Eng issiq oy kunduzi, °C",fmt(c.tmax)]
  ]);
  const cv=$("#cl-cv"),cx=M8.cv2d(cv);
  if(cx){const m=monthlyGHI(c),mx=Math.max.apply(null,m)*1.1,c2=cx.c,w=cx.w,h=cx.h,pl=28,pb=20,bw=(w-pl)/12;
    c2.clearRect(0,0,w,h);c2.font="11px sans-serif";c2.textAlign="center";
    const ink=M8.tok("--muted"),acc=M8.tok("--sun");
    for(let i=0;i<12;i++){const bh=(h-pb-8)*m[i]/mx,x=pl+i*bw+bw*0.15;
      c2.fillStyle=acc;c2.globalAlpha=0.9;c2.fillRect(x,h-pb-bh,bw*0.7,bh);c2.globalAlpha=1;
      c2.fillStyle=ink;c2.fillText(String(i+1),x+bw*0.35,h-5);
      c2.fillText(m[i].toFixed(1),x+bw*0.35,h-pb-bh-3);}
    c2.textAlign="left";c2.fillText("kWh/m²·kun",2,10);}
  const ch=[],f=c.f,T=S.mtype;
  ch.push([!(T==="PVC"&&c.tmax>=40),"Issiqlik va material","PVC "+c.tmax+"°C da tez eskiradi: PTFE yoki PVDF qoplamali materialni ko'ring"].slice(0,3));
  ch[0][1]="Material issiqqa chidamliligi";ch[0][2]=ch[0][0]?"Mos":"PVC bu haroratda tez eskiradi, PTFE yaxshiroq";
  ch.push([!(k.tau>0.3&&v.space==="ac"),"Yorug'lik va issiqlik kirishi",k.tau>0.3&&v.space==="ac"?"Shaffof tom konditsionerli joyda issiqlikni oshiradi":"Mos"]);
  if(f.dust)ch.push([true,"Chang va tozalash","Changli hudud: tomni yiliga 1-2 marta yuving, sirti silliq qoplamali material tanlang"]);
  if(f.snow||f.cold)ch.push([S.sk>=0.3,"Qor yuklamasi",S.sk>=0.3?"Qor yuklamasi hisobga olingan":"Bu shaharda qor bo'ladi, qor yuklamasini kiriting (Kuchlanish bo'limida)"]);
  if(f.coast)ch.push([S.V>=30,"Shamol tezligi",S.V>=30?"Hisobiy shamol yetarli":"Qirg'oqda kuchli shamol/to'fon bo'ladi, tezlikni oshiring"]);
  if(f.quake)ch.push([true,"Zilzila","Zilzilabop hudud: tayanch tugunlari va ustunlarni seysmik hisobga tekshiring"]);
  M8.chk($("#cl-chk"),ch);
  $("#cl-note").textContent="Eslatma: gorizontal tekislikdagi yillik o'rtacha. Haqiqiy loyihada Meteonorm yoki NASA POWER ma'lumotidan foydalaning.";
}
M8.reg("climate",renderClimate);
$("#cl-city").addEventListener("change",e=>{M8.V().city=e.target.value;MH.save();MH.refresh("v8");});
$("#cl-space").addEventListener("change",e=>{M8.V().space=e.target.value;MH.save();MH.refresh("v8");});
num($("#cl-tau"),x=>{M8.V().tau=Math.max(0,Math.min(90,x));});
num($("#cl-kwh"),x=>{M8.V().kwh=Math.max(0,x);});
num($("#cl-cop"),x=>{M8.V().cop=Math.max(1,x);});

/* ---------- SOLISHTIRISH ---------- */
function compare(){
  const S=MH.S,R=MH.R,v=M8.V(),cm=v.cmp,g=R.g,A=g.plan;
  const d=(k,x)=>typeof cm[k]==="number"?cm[k]:x;
  const steelx=d("steelx",3.2),clad=d("clad",55),rcm3=d("rcm3",260),cs=d("cs",1.8),cr=d("cr",520);
  const idx=0.5+0.5*MH.REG[S.region].lab;
  const span=S.shape==="stad"?(1-S.ri)*Math.min(S.L,S.W)/2:Math.min(S.L,S.W);
  const kgS=18+1.6*span,th=0.12+0.008*span;
  const rcWt=th*2500,rcCo=th*cr;
  const mem={cost:R.direct/A,wt:(R.memW+R.steelKg)/A,co2:(R.memW*M8.MAT[S.mtype].co2+R.steelKg*cs)/A};
  const st={cost:(kgS*steelx+clad)*idx,wt:kgS,co2:kgS*cs};
  const rc={cost:th*rcm3*idx*1.0+30*idx,wt:rcWt,co2:rcCo};
  return {A,span,mem,st,rc,impr:span>40,cm:{steelx,clad,rcm3,cs,cr}};
}
function bars(host,rows,f){
  const mx=Math.max.apply(null,rows.map(r=>r[1]))||1;
  host.innerHTML=rows.map(r=>'<div class="row"><span>'+esc(r[0])+'</span><b>'+f(r[1])+'</b><i><u style="width:'+Math.max(2,r[1]/mx*100)+'%"'+(r[2]?' class="'+r[2]+'"':'')+'></u></i></div>').join("");
}
function renderCompare(){
  if(!MH.R)return;const k=compare(),cm=k.cm;
  const set=(id,val)=>{const e=$(id);if(document.activeElement!==e)e.value=val;};
  set("#cp-steelx",cm.steelx);set("#cp-clad",cm.clad);set("#cp-rcm3",cm.rcm3);set("#cp-cs",cm.cs);set("#cp-cr",cm.cr);
  const sv=(1-k.mem.cost/k.st.cost)*100,w=(1-k.mem.wt/k.st.wt)*100,co=(1-k.mem.co2/k.st.co2)*100;
  M8.kv($("#cp-kv"),[["Narx, po'latga nisbatan",(sv>=0?"−":"+")+fmt(Math.abs(sv))+"%"],["Og'irlik, po'latga nisbatan",(w>=0?"−":"+")+fmt(Math.abs(w))+"%"],["CO₂, po'latga nisbatan",(co>=0?"−":"+")+fmt(Math.abs(co))+"%"],["Oraliq (span), m",fmt(k.span)]]);
  const nm=[t("Membrana"),t("Po'lat konstruksiya"),t("Temir-beton")];
  const rows=p=>[[nm[0],k.mem[p],"acc"],[nm[1],k.st[p]],[nm[2],k.rc[p]]];
  bars($("#cp-cost"),rows("cost"),x=>usd(x)+"/m²");
  bars($("#cp-wt"),rows("wt"),x=>fmt(x)+" kg/m²");
  bars($("#cp-co2"),rows("co2"),x=>fmt(x)+" kg/m²");
  const wn=$("#cp-warn");wn.hidden=!k.impr;if(k.impr)wn.textContent="Bu oraliqda (40 m dan ortiq) temir-beton tom amalda qo'llanmaydi, qiyoslash faqat nazariy.";
}
M8.reg("compare",renderCompare);
[["#cp-steelx","steelx"],["#cp-clad","clad"],["#cp-rcm3","rcm3"],["#cp-cs","cs"],["#cp-cr","cr"]].forEach(a=>num($(a[0]),x=>{M8.V().cmp[a[1]]=Math.max(0,x);}));

/* ---------- QUYOSH VA SOYA ---------- */
const MONTHS=[["172","21-iyun (yozgi kun to'xtashi)"],["80","21-mart (tengkunlik)"],["264","23-sentabr (tengkunlik)"],["355","21-dekabr (qishki kun to'xtashi)"],["105","15-aprel"],["227","15-avgust"]];
function sunPos(latDeg,n,hr){
  const lat=latDeg*D2R,dec=23.44*D2R*Math.sin(2*Math.PI*(284+n)/365),h=15*(hr-12)*D2R;
  const sa=Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(h),alt=Math.asin(Math.max(-1,Math.min(1,sa)));
  const az=Math.atan2(Math.sin(h),Math.cos(h)*Math.sin(lat)-Math.tan(dec)*Math.cos(lat))+Math.PI;
  return {alt:alt,az:az};
}
M8.sunPos=sunPos;
const OFF=document.createElement("canvas");
function shadowMasks(g,sp,th,ext,N){
  /* ext: {x0,x1,z0,z1} ko'rish oynasi; N piksel; qaytaradi shadow va footprint maskalari */
  const p=g.pos,ix=g.idx,tn=Math.tan(sp.alt),ux=Math.sin(sp.az-th),uz=-Math.cos(sp.az-th);
  const W=N,H=Math.round(N*(ext.z1-ext.z0)/(ext.x1-ext.x0)),sx=W/(ext.x1-ext.x0),sz=H/(ext.z1-ext.z0);
  OFF.width=W;OFF.height=H;const c=OFF.getContext("2d",{willReadFrequently:true});
  const draw=(f)=>{c.clearRect(0,0,W,H);c.fillStyle="#000";c.strokeStyle="#000";c.lineWidth=0.7;
    for(let i=0;i<ix.length;i+=3){c.beginPath();for(let k=0;k<3;k++){const j=ix[i+k]*3,q=f(p[j],p[j+1],p[j+2]);
      const X=(q[0]-ext.x0)*sx,Y=(q[1]-ext.z0)*sz;k?c.lineTo(X,Y):c.moveTo(X,Y);}c.closePath();c.fill();c.stroke();}
    return c.getImageData(0,0,W,H).data;};
  const sh=tn>0.02?draw((x,y,z)=>[x-y*ux/tn,z-y*uz/tn]):null;
  const fp=draw((x,y,z)=>[x,z]);
  let a=0,b=0,both=0;
  for(let i=3;i<fp.length;i+=4){const f=fp[i]>127,s=sh&&sh[i]>127;if(f)a++;if(s)b++;if(f&&s)both++;}
  return {W:W,H:H,sh:sh,fp:fp,a:a,b:b,both:both,cell:1/(sx*sz)};
}
function sunExt(g,th){
  const bx=MH.gbox(g),maxy=Math.max(bx.y1,1),R=Math.max(bx.x1-bx.x0,bx.z1-bx.z0);
  const pad=Math.max(maxy*2.2,R*0.35),cx=(bx.x0+bx.x1)/2,cz=(bx.z0+bx.z1)/2,half=Math.max(bx.x1-bx.x0,bx.z1-bx.z0)/2+pad;
  return {x0:cx-half,x1:cx+half,z0:cz-half,z1:cz+half,half:half};
}
const S0=()=>MH.S;
function renderSun(){
  if(!MH.R)return;const v=M8.V(),c=M8.city(),g=MH.R.g;
  M8.fillSelect($("#sn-m"),MONTHS,String(MONTHS.some(m=>+m[0]===v.day)?v.day:172));
  $("#sn-h").value=v.hour;$("#sn-o").value=v.orient;
  const hh=Math.floor(v.hour),mm=Math.round((v.hour-hh)*60);
  $("#sn-hv").textContent=hh+":"+(mm<10?"0":"")+mm;$("#sn-ov").textContent=v.orient+"°";
  const th=v.orient*D2R,ext=sunExt(g,th),sp=sunPos(c.lat,v.day,v.hour);
  const cv=$("#sn-cv"),cx=M8.cv2d(cv);
  const up=sp.alt>0.02;
  const mk=shadowMasks(g,sp,th,ext,150);
  if(cx){const c2=cx.c,w=cx.w,h=cx.h,s=Math.min(w,h);const ox=(w-s)/2,oy=(h-s)/2;
    c2.clearRect(0,0,w,h);
    const bg=M8.tok("--surface2");c2.fillStyle=bg;c2.fillRect(0,0,w,h);
    const m2=document.createElement("canvas");m2.width=mk.W;m2.height=mk.H;const mc=m2.getContext("2d"),im=mc.createImageData(mk.W,mk.H);
    for(let i=0;i<mk.W*mk.H;i++){const f=mk.fp[i*4+3]>127,sd=mk.sh&&mk.sh[i*4+3]>127;
      if(sd){im.data[i*4]=20;im.data[i*4+1]=30;im.data[i*4+2]=60;im.data[i*4+3]=150;}
      else if(f){im.data[i*4]=232;im.data[i*4+1]=182;im.data[i*4+2]=92;im.data[i*4+3]=200;}}
    mc.putImageData(im,0,0);
    c2.imageSmoothingEnabled=false;c2.drawImage(m2,ox,oy,s,s*mk.H/mk.W);
    /* shimol o'qi va quyosh yo'nalishi */
    const cxp=ox+s/2,cyp=oy+s/2,ang=sp.az-th;
    c2.strokeStyle=M8.tok("--muted");c2.fillStyle=M8.tok("--ink");c2.font="12px sans-serif";c2.lineWidth=1.5;
    const nx=-Math.sin(-th)*0,ny=0;
    c2.save();c2.translate(26,26);c2.rotate(th);c2.beginPath();c2.moveTo(0,10);c2.lineTo(0,-12);c2.lineTo(-4,-5);c2.moveTo(0,-12);c2.lineTo(4,-5);c2.stroke();c2.fillText("N",-4,-16);c2.restore();
    if(up){const r=s*0.42,sxp=cxp+Math.sin(ang)*r,syp=cyp-Math.cos(ang)*r*-1*-1;
      const xx=cxp+Math.sin(ang)*r,yy=cyp+(-(-Math.cos(ang)))*r*-1;
      c2.fillStyle=M8.tok("--sun");c2.beginPath();c2.arc(cxp+Math.sin(ang)*r,cyp+Math.cos(ang)*r*-1*-1*-1,9,0,7);c2.fill();}
  }
  const cover=mk.a?mk.both/mk.a*100:0;
  M8.kv($("#sn-kv"),[["Quyosh balandligi",up?fmt(sp.alt/D2R)+"°":"ufqdan past"],["Azimut (shimoldan)",up?fmt(((sp.az/D2R)%360+360)%360)+"°":"-"],["Tom ostidagi soya, %",up?fmt(cover)+"%":"-"],["Soya maydoni, m²",up?fmt(mk.b*mk.cell):"-"]]);
  /* kunlik grafik */
  const dv=$("#sn-day"),dx=M8.cv2d(dv);
  if(dx){const c2=dx.c,w=dx.w,h=dx.h,pl=30,pb=20,xs=i=>pl+(i-5)/14*(w-pl-6);c2.clearRect(0,0,w,h);
    c2.fillStyle=M8.tok("--muted");c2.font="11px sans-serif";c2.textAlign="center";
    const ck=[g.area,g.plan,v.day,v.orient,c.lat,S0().shape,S0().L,S0().W,S0().Hr].join("|");
    if(!renderSun.dc||renderSun.dc.k!==ck){
      clearTimeout(renderSun.tm);
      renderSun.tm=setTimeout(()=>{const gg=MH.R.g,e2=sunExt(gg,th);let sum=0,cnt=0;const pts=[];
        for(let hr=5;hr<=19;hr+=1){const s2=sunPos(c.lat,v.day,hr);let y=0;
          if(s2.alt>0.087){const m=shadowMasks(gg,s2,th,e2,60);y=m.a?m.both/m.a*100:0;sum+=y;cnt++;}
          pts.push([hr,y,s2.alt>0.087]);}
        renderSun.dc={k:ck,pts:pts,avg:cnt?sum/cnt:0};if(MH.cur==="sun")renderSun();},160);
      if(!renderSun.dc)renderSun.dc={k:"",pts:[],avg:0};}
    const pts=renderSun.dc.pts,sum=renderSun.dc.avg,cnt=1;
    c2.strokeStyle=M8.tok("--line");[0,50,100].forEach(p=>{const y=h-pb-(h-pb-8)*p/100;c2.beginPath();c2.moveTo(pl,y);c2.lineTo(w-4,y);c2.stroke();c2.textAlign="right";c2.fillText(p+"%",pl-3,y+3);});
    c2.textAlign="center";[6,9,12,15,18].forEach(hr=>c2.fillText(hr,xs(hr),h-5));
    c2.strokeStyle=M8.tok("--accent");c2.lineWidth=2;c2.beginPath();let st=false;
    pts.forEach(p=>{if(!p[2])return;const X=xs(p[0]),Y=h-pb-(h-pb-8)*p[1]/100;st?c2.lineTo(X,Y):c2.moveTo(X,Y);st=true;});c2.stroke();
    const cur=Math.min(19,Math.max(5,v.hour));c2.strokeStyle=M8.tok("--sun");c2.beginPath();c2.moveTo(xs(cur),4);c2.lineTo(xs(cur),h-pb);c2.stroke();
    $("#sn-note").textContent="Kun bo'yicha o'rtacha soya: "+fmt(sum)+"% (quyosh balandligi 5° dan yuqori bo'lgan soatlar). Soya geometrik hisob, bulut va yorug'lik sochilishi hisobga olinmagan.";}
}
M8.reg("sun",renderSun);M8.reg("sun2",renderSun);
M8.renderers.sun=renderSun;
$("#sn-m").addEventListener("change",e=>{M8.V().day=+e.target.value;MH.save();renderSun();});
$("#sn-h").addEventListener("input",e=>{M8.V().hour=+e.target.value;renderSun();});
$("#sn-o").addEventListener("input",e=>{M8.V().orient=+e.target.value;renderSun();});
$("#sn-h").addEventListener("change",()=>MH.save());$("#sn-o").addEventListener("change",()=>MH.save());

/* ---------- HISOBOT ---------- */
const LAB={material:"Membrana materiali",fab:"Ishlab chiqarish",steel:"Po'lat konstruksiya",cable:"Kabellar",found:"Poydevor",install:"Montaj",transport:"Transport",design:"Loyihalash",overhead:"Umumiy xarajat",reserve:"Risk zaxirasi"};
function reportHTML(){
  const S=MH.S,R=MH.R,g=R.g,v=M8.V(),k=climate(),cp=compare(),b=S.bim||{};
  const title=b.title||MH.SHAPES[S.shape].n,au=b.author||"";
  const P=MH.PAL_PR;let svg1="",svg2="";
  try{const a=MH.drawView("plan",g,{pal:P,cut:0}),c=MH.drawView("elev",g,{pal:P,cut:0});
    svg1='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+a.vb+'" width="100%">'+a.b+'</svg>';
    svg2='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+c.vb+'" width="100%">'+c.b+'</svg>';}catch(e){}
  const m=S.sfMode==="partial"?R.chk.partial:R.chk.global;
  const row=(a,b2)=>'<tr><td>'+esc(a)+'</td><td class="r">'+b2+'</td></tr>';
  let cost="";Object.keys(LAB).forEach(x=>{if(R.c[x])cost+=row(t(LAB[x]),usd(R.c[x]));});
  const top=R.rr.slice().sort((a,b2)=>b2.emv-a.emv).slice(0,5).map(r=>row(t(r.r.n||r.r.name||"Risk"),usd(r.emv))).join("");
  const dt=new Date().toLocaleDateString();
  return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>'
  +'@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:12px/1.45 Arial,Helvetica,sans-serif;color:#0D1830;margin:0;padding:14px}'
  +'.hd{background:#0A1B40;color:#fff;padding:16px 18px;border-radius:8px;border-bottom:4px solid #E8B65C}.hd h1{margin:0;font-size:20px}.hd p{margin:4px 0 0;color:#C9D4EE;font-size:11px}'
  +'h2{font-size:13px;margin:16px 0 6px;color:#1B58C9;border-bottom:1px solid #D5DCEB;padding-bottom:3px;break-after:avoid}table{width:100%;border-collapse:collapse}td{padding:4px 6px;border-bottom:1px solid #E6EAF3}.r{text-align:right;font-weight:600}'
  +'.k{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.k div{border:1px solid #D5DCEB;border-radius:6px;padding:8px}.k b{display:block;font-size:15px}.k span{font-size:10px;color:#5B6785}'
  +'.dr{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dr svg{border:1px solid #D5DCEB;border-radius:6px}.f{margin-top:18px;font-size:10px;color:#5B6785;border-top:1px solid #D5DCEB;padding-top:6px}</style></head><body>'
  +'<div class="hd"><h1>'+esc(title)+'</h1><p>'+esc(t("Membrana hisobchisi"))+' · '+esc(au)+' · '+esc(dt)+'</p></div>'
  +'<h2>'+t("Asosiy ko'rsatkichlar")+'</h2><div class="k">'
  +'<div><b>'+fmt(R.gross)+' m²</b><span>'+t("Membrana")+'</span></div><div><b>'+usd(R.price)+'</b><span>'+t("Narx")+'</span></div><div><b>'+usd(R.profit)+'</b><span>'+t("Foyda")+'</span></div>'
  +'<div><b>'+fmt(g.plan)+' m²</b><span>'+t("Reja maydoni")+'</span></div><div><b>'+fmt(m.eta*100)+'%</b><span>'+t("Kuchlanish ishlatilishi")+'</span></div><div><b>'+fmt(R.mc.p80)+' $</b><span>'+t("Tannarx P80 (USD)")+'</span></div></div>'
  +'<h2>'+t("Chizmalar")+'</h2><div class="dr"><div>'+svg1+'</div><div>'+svg2+'</div></div>'
  +'<h2>'+t("Xarajat tarkibi")+'</h2><table>'+cost+row(t("Jami tannarx"),usd(R.cost))+'</table>'
  +'<h2>'+t("Iqlim va energiya")+' · '+esc(k.c.n)+'</h2><table>'
  +row(t("Tom to'sgan quyosh energiyasi, MWh/yil"),fmt(k.under/1000))+row(t("Sovutish uchun elektr, MWh/yil"),fmt1(k.el/1000,1))+row(t("Sovutish xarajati, yiliga"),usd(k.cost))+'</table>'
  +'<h2>'+t("Po'lat va betonga nisbatan")+'</h2><table>'
  +row(t("Membrana")+" / "+t("Po'lat konstruksiya")+" / "+t("Temir-beton")+", $/m²",usd(cp.mem.cost)+" / "+usd(cp.st.cost)+" / "+usd(cp.rc.cost))
  +row("kg/m²",fmt(cp.mem.wt)+" / "+fmt(cp.st.wt)+" / "+fmt(cp.rc.wt))+row("CO₂, kg/m²",fmt(cp.mem.co2)+" / "+fmt(cp.st.co2)+" / "+fmt(cp.rc.co2))+'</table>'
  +'<h2>'+t("Eng katta risklar (kutilgan qiymat)")+'</h2><table>'+top+'</table>'
  +'<div class="f">'+t("Bu taxminiy konsept hisob. Yakuniy o'lcham, kuchlanish va narx muhandis hisobi hamda ta'minotchi taklifi bilan tasdiqlanishi shart.")+'</div></body></html>';
}
function reportText(){
  const S=MH.S,R=MH.R,m=S.sfMode==="partial"?R.chk.partial:R.chk.global,b=S.bim||{};
  return (b.title||"Membrana loyihasi")+"\n"+S.shape+" "+S.L+"x"+S.W+" m, "+S.mtype+", "+MH.REG[S.region].n+"\nMembrana: "+fmt(R.gross)+" m2\nNarx: "+usd(R.price)+"\nFoyda: "+usd(R.profit)+"\nKuchlanish: "+fmt(m.eta*100)+"%\nTannarx P80: "+usd(R.mc.p80)+"\n(Membrana hisobchisi)";
}
function renderReport(){
  if(!MH.R)return;const b=MH.S.bim||(MH.S.bim={title:"",author:"",no:"A-101"});
  const a=$("#rp-title"),c=$("#rp-author");if(document.activeElement!==a)a.value=b.title||"";if(document.activeElement!==c)c.value=b.author||"";
  $("#rp-prev").srcdoc=reportHTML();
}
M8.reg("report",renderReport);
["title","author"].forEach(k=>$("#rp-"+k).addEventListener("input",e=>{(MH.S.bim||(MH.S.bim={title:"",author:"",no:"A-101"}))[k]=e.target.value;MH.save();clearTimeout(renderReport.tm);renderReport.tm=setTimeout(()=>{$("#rp-prev").srcdoc=reportHTML();},400);}));
$("#rp-pdf").addEventListener("click",()=>{
  const n=$("#rp-note"),h=reportHTML();n.hidden=false;
  try{if(window.AndroidApp&&window.AndroidApp.printHtml){window.AndroidApp.printHtml((MH.S.bim&&MH.S.bim.title)||"Hisobot",h);n.textContent=t("Chop etish oynasida «PDF sifatida saqlash» ni tanlang.");return;}}catch(e){}
  try{const f=$("#rp-prev");f.contentWindow.focus();f.contentWindow.print();n.textContent=t("Chop etish oynasida «PDF sifatida saqlash» ni tanlang.");}catch(e){MH.exportFile("hisobot.html","text/html",h,"#rp-note");}
});
$("#rp-share").addEventListener("click",()=>share("Hisobot",reportText(),"#rp-note"));
function share(title,text,sel){
  const n=$(sel);n.hidden=false;
  try{if(window.AndroidApp&&window.AndroidApp.shareText){window.AndroidApp.shareText(title,text);n.textContent="";n.hidden=true;return;}}catch(e){}
  try{if(navigator.share){navigator.share({title:title,text:text});return;}}catch(e){}
  try{navigator.clipboard.writeText(text).then(()=>{n.textContent=t("Matn nusxalandi.");},()=>{n.textContent=text;});}catch(e){n.textContent=text;}
}

/* ---------- SAQLASH, KOD VA QR ---------- */
function isObj(o){return o&&typeof o==="object"&&!Array.isArray(o);}
function diff(a,b){
  if(isObj(a)&&isObj(b)){const o={};let any=false;Object.keys(b).forEach(k=>{const d=diff(a[k],b[k]);if(d!==undefined){o[k]=d;any=true;}});return any?o:undefined;}
  return JSON.stringify(a)===JSON.stringify(b)?undefined:b;
}
function merge(a,d){
  if(isObj(a)&&isObj(d)){const o=Object.assign({},a);Object.keys(d).forEach(k=>{o[k]=merge(a[k],d[k]);});return o;}
  return d;
}
const b64=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64=s=>decodeURIComponent(escape(atob(s.replace(/-/g,"+").replace(/_/g,"/"))));
function makeCode(){const d=diff(MH.DEF(),MH.S)||{};return "MH1:"+b64(JSON.stringify(d));}
function readCode(txt){
  const m=String(txt).trim().match(/MH1:[A-Za-z0-9_-]+/);if(!m)throw new Error("kod");
  const d=JSON.parse(unb64(m[0].slice(4)));return merge(MH.DEF(),d);
}
let lastCode="";
function renderSave(){
  if(!MH.R)return;const code=makeCode();
  if(code===lastCode)return;lastCode=code;
  $("#sv-code").value=code;
  const q=$("#sv-qr");q.innerHTML="";
  try{if(code.length>2300)throw 0;const qr=window.qrcode(0,"L");qr.addData(code);qr.make();q.innerHTML=qr.createSvgTag(4,2);}
  catch(e){q.textContent=t("Kod QR uchun juda uzun. Kodni nusxalab yuboring.");}
}
M8.reg("save",renderSave);
$("#sv-share").addEventListener("click",()=>share("Membrana loyihasi",(MH.S.bim&&MH.S.bim.title?MH.S.bim.title+"\n":"")+$("#sv-code").value,"#sv-note"));
$("#sv-copy").addEventListener("click",()=>{const n=$("#sv-note");n.hidden=false;try{navigator.clipboard.writeText($("#sv-code").value).then(()=>{n.textContent=t("Kod nusxalandi.");},()=>{$("#sv-code").select();n.textContent=t("Kodni belgilab nusxalang.");});}catch(e){$("#sv-code").select();n.textContent=t("Kodni belgilab nusxalang.");}});
$("#sv-paste").addEventListener("click",()=>{try{navigator.clipboard.readText().then(x=>{$("#sv-in").value=x;});}catch(e){}});
$("#sv-open").addEventListener("click",()=>{const n=$("#sv-note2");n.hidden=false;
  try{const o=readCode($("#sv-in").value);MH.applyState(o);n.textContent=t("Loyiha ochildi.");lastCode="";}catch(e){n.textContent=t("Kod noto'g'ri. Qaytadan nusxalab ko'ring.");}});

/* ---------- AI YORDAMCHI ---------- */
const CHIPS=["Natijalarni oddiy tilda tushuntir","Narxni qanday kamaytirish mumkin?","Eng katta risklar nima?","Bu hududda nimalarga e'tibor berish kerak?"];
function ctxText(){
  const S=MH.S,R=MH.R,k=climate(),m=S.sfMode==="partial"?R.chk.partial:R.chk.global;
  return "Loyiha: shakl="+S.shape+", o'lcham="+S.L+"x"+S.W+" m, balandlik="+S.Hb+"/"+S.Hr+" m, hudud="+MH.REG[S.region].n+", shahar="+k.c.n+", material="+S.mtype+", shamol="+S.V+" m/s, qor="+S.sk+" kN/m2. "
  +"Natija: membrana "+Math.round(R.gross)+" m2, reja "+Math.round(R.g.plan)+" m2, tannarx "+Math.round(R.cost)+" USD, narx "+Math.round(R.price)+" USD, foyda "+Math.round(R.profit)+" USD, kuchlanish ishlatilishi "+Math.round(m.eta*100)+"%, tannarx P80 "+Math.round(R.mc.p80)+" USD, qimmat risklar: "
  +R.rr.slice().sort((a,b)=>b.emv-a.emv).slice(0,3).map(r=>(r.r.n||r.r.name||"risk")+" "+Math.round(r.emv)+" USD").join("; ")+". Sovutish elektr "+Math.round(k.el)+" kWh/yil.";
}
const SYS="Sen tortilgan membrana konstruksiyalari bo'yicha tajribali muhandis-maslahatchisan. Foydalanuvchi ilovasidagi loyiha ma'lumotlari quyida berilgan. Qisqa, aniq, amaliy javob ber. Javob tilini foydalanuvchi savol tili bilan bir xil qil. Aniq bilmagan narsani taxmin ekanini ayt. Yakuniy qaror muhandis hisobiga bog'liqligini zarur joyda eslat. ";
let httpSeq=0;const httpCB={};
window.__mhHttp=(id,status,body)=>{const f=httpCB[id];if(f){delete httpCB[id];f(status,body);}};
function httpReq(method,url,body,headers){
  return new Promise((res,rej)=>{
    if(window.AndroidApp&&window.AndroidApp.httpReq){const id=++httpSeq;let got=false;httpCB[id]=(s,b)=>{got=true;res({status:s,text:b});};
      try{window.AndroidApp.httpReq(id,method,url,body||"",JSON.stringify(headers||{}));}catch(e){rej(e);return;}
      setTimeout(()=>{if(got)return;fetch(url,{method:method,headers:headers,body:method==="GET"?undefined:body}).then(r=>r.text().then(x=>{if(!got){got=true;res({status:r.status,text:x});}})).catch(()=>{});},12000);
      return;}
    fetch(url,{method:method,headers:headers,body:method==="GET"?undefined:body}).then(r=>r.text().then(x=>res({status:r.status,text:x}))).catch(rej);
  });
}
function md(s){
  let h=esc(s);
  h=h.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/^\s*[-*]\s+(.+)$/gm,"• $1").replace(/\n/g,"<br>");return h;
}
function renderChat(){
  const L=M8.st.chat,host=$("#ai-log");
  host.innerHTML=L.length?L.map(m=>'<div class="msg '+(m.r==="u"?"me":"bot")+'">'+md(m.t)+'</div>').join(""):'<div class="hint">'+esc(t("Savol bering yoki quyidagi tayyor savollardan birini tanlang."))+'</div>';
  host.scrollTop=host.scrollHeight;
}
function renderAI(){
  const ch=$("#ai-chips");if(!ch.__d){ch.__d=1;ch.innerHTML=CHIPS.map(c=>'<button type="button" class="chip">'+esc(c)+'</button>').join("");}
  if(!$("#ai-key").__d){$("#ai-key").__d=1;$("#ai-key").value=M8.st.aiKey||"";$("#ai-model").value=M8.st.aiModel;}
  $("#ai-keybox").open=!M8.st.aiKey;renderChat();
}
M8.reg("ai",()=>{if(!$("#ai-log").__d){$("#ai-log").__d=1;renderAI();}});
$("#ai-keysave").addEventListener("click",()=>{M8.st.aiKey=$("#ai-key").value.trim();M8.st.aiModel=$("#ai-model").value.trim()||"gemini-flash-latest";M8.saveSt();$("#ai-keybox").open=false;});
$("#ai-keydel").addEventListener("click",()=>{M8.st.aiKey="";$("#ai-key").value="";M8.saveSt();$("#ai-keybox").open=true;});
$("#ai-clear").addEventListener("click",()=>{M8.st.chat=[];M8.saveSt();renderChat();});
$("#ai-chips").addEventListener("click",e=>{const b=e.target.closest(".chip");if(b)ask(b.__src||b.getAttribute("data-q")||CHIPS[$$(".chip",$("#ai-chips")).indexOf(b)]);});
let busy=false;
function ask(q){
  q=String(q||"").trim();if(!q||busy)return;
  if(!M8.st.aiKey){$("#ai-keybox").open=true;return;}
  busy=true;$("#ai-send").disabled=true;M8.st.chat.push({r:"u",t:q});$("#ai-in").value="";
  M8.st.chat=M8.st.chat.slice(-24);renderChat();
  const wait={r:"b",t:"…"};M8.st.chat.push(wait);renderChat();
  const hist=M8.st.chat.slice(0,-1).slice(-10).map(m=>({role:m.r==="u"?"user":"model",parts:[{text:m.t}]}));
  const body=JSON.stringify({systemInstruction:{parts:[{text:SYS+ctxText()}]},contents:hist,generationConfig:{maxOutputTokens:2048,temperature:0.4}});
  const url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(M8.st.aiModel||"gemini-flash-latest")+":generateContent";
  let secs=0;const tmr=setInterval(()=>{secs++;wait.t="… "+secs+" s";if(secs>=100){clearInterval(tmr);}renderChat();},1000);
  let done=false;const fin=()=>{if(done)return false;done=true;clearInterval(tmr);return true;};
  setTimeout(()=>{if(fin()){wait.t=t("Javob kelmadi. Internetni tekshirib, qayta urinib ko'ring.");busy=false;$("#ai-send").disabled=false;M8.saveSt();renderChat();}},100000);
  httpReq("POST",url,body,{"Content-Type":"application/json","x-goog-api-key":M8.st.aiKey}).then(r=>{
    if(!fin())return;let txt="";
    if(r.status===0){wait.t=t("Internetga ulanib bo'lmadi.");return;}
    try{const j=JSON.parse(r.text);
      if(r.status>=400)txt=t("Xato")+" "+r.status+": "+((j.error&&j.error.message)||"").slice(0,160);
      else txt=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts||[]).map(p=>p.text||"").join("")||t("Javob bo'sh keldi.");}
    catch(e){txt=t("Javobni o'qib bo'lmadi.");}
    wait.t=txt;
  }).catch(()=>{if(fin())wait.t=t("Internetga ulanib bo'lmadi.");}).then(()=>{busy=false;$("#ai-send").disabled=false;M8.saveSt();renderChat();});
}
$("#ai-send").addEventListener("click",()=>ask($("#ai-in").value));
$("#ai-in").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask($("#ai-in").value);}});

/* ---------- SOZLAMALAR ---------- */
const CN={USD:"$ Dollar",JPY:"¥ Iyena",SAR:"﷼ Riyal",UZS:"So'm",EUR:"€ Yevro"};
function renderSet(){
  const sc=$("#set-cur");sc.innerHTML=M8.CURS.map(c=>'<button type="button" data-c="'+c+'" aria-pressed="'+(M8.st.cur===c)+'">'+esc(CN[c])+'</button>').join("");
  const th=$("#set-theme");th.innerHTML=[["auto","Avtomatik"],["light","Yorug'"],["dark","Qorong'i"]].map(a=>'<button type="button" data-t="'+a[0]+'" aria-pressed="'+(M8.st.theme===a[0])+'">'+esc(a[1])+'</button>').join("");
  const rh=$("#set-rates");if(!rh.__d){rh.__d=1;rh.innerHTML=M8.CURS.filter(c=>c!=="USD").map(c=>'<div class="fld"><label for="rt-'+c+'">1 $ = '+c+'</label><input type="number" id="rt-'+c+'" step="any" inputmode="decimal"></div>').join("");
    M8.CURS.filter(c=>c!=="USD").forEach(c=>num($("#rt-"+c),x=>{if(x>0){M8.st.rates[c]=x;M8.saveSt();}}));}
  M8.CURS.filter(c=>c!=="USD").forEach(c=>{const e=$("#rt-"+c);if(document.activeElement!==e)e.value=M8.st.rates[c];});
  $("#set-rnote").textContent=t("Boshlang'ich kurslar sanasi:")+" "+M8.st.ratesDate;
}
M8.reg("set",renderSet);
$("#set-cur").addEventListener("click",e=>{const b=e.target.closest("button");if(b){M8.setCur(b.dataset.c);renderSet();}});
$("#set-theme").addEventListener("click",e=>{const b=e.target.closest("button");if(b){M8.st.theme=b.dataset.t;M8.saveSt();M8.applyTheme();renderSet();}});
$("#set-rdef").addEventListener("click",()=>{M8.st.rates=Object.assign({},M8.RATES0);M8.st.ratesDate=M8.DATE0;M8.saveSt();MH.refresh("cur");renderSet();});
$("#set-rupd").addEventListener("click",()=>{const n=$("#set-rnote");n.textContent="…";
  httpReq("GET","https://open.er-api.com/v6/latest/USD","",{}).then(r=>{const j=JSON.parse(r.text);if(!j.rates)throw 0;
    M8.CURS.forEach(c=>{if(c!=="USD"&&j.rates[c])M8.st.rates[c]=j.rates[c];});M8.st.ratesDate=new Date().toISOString().slice(0,10);M8.saveSt();MH.refresh("cur");renderSet();
  }).catch(()=>{n.textContent=t("Kurslarni yangilab bo'lmadi. Internetni tekshiring.");});});

/* tayyor namunalar */
M8.PRE={
  sa_tree:{shape:"umb",region:"sa",mtype:"PTFE",L:28,W:28,Hb:5,Hr:3.5,months:6,V:28,sk:0},
  sa_stad:{shape:"stad",region:"sa",mtype:"PTFE",L:200,W:160,Hb:24,Hr:15,ri:0.6,months:20,V:28,sk:0},
  jp_arch:{shape:"arch",region:"jp",mtype:"PTFE",L:60,W:36,Hb:9,Hr:8,months:12,V:35,sk:0.6},
  uz_hypar:{shape:"hypar",region:"uz",mtype:"PVC",L:30,W:22,Hb:4.5,Hr:6.5,months:7,V:25,sk:0.5}
};
$("#presets2").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const p=M8.PRE[b.dataset.p2];if(!p)return;
  const S=MH.S;Object.assign(S,p);S.v8=null;MH.syncFields();MH.refresh("preset");MH.show("proj");});
M8.init();
})();

/* ===== v8.2: realistik 3D (osmon, soya, material, atrof, surat) ===== */
(function(){
"use strict";
const MH=window.MH,M8=window.MH8;if(!MH||!M8)return;
const $=MH.$,$$=MH.$$,clamp=MH.clamp;
let T3=null,TH=null,H=null,envKey="",envGrp=null,lastKey="";
const st={on:true,light:"kino",ent:true,q:"high",bars:false,mc:"auto",mg:null,mo:null,ms:"auto"};
try{const o=JSON.parse(localStorage.getItem("mh9-real")||"null");if(o)Object.assign(st,o);}catch(e){}
const saveSt=()=>{try{localStorage.setItem("mh9-real",JSON.stringify(st));}catch(e){}};
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const hex=h=>new TH.Color(h);

/* ---------- protsedura teksturalari ---------- */
function cvTex(w,h,draw,rx,ry,color){
  const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
  const t=new TH.CanvasTexture(c);t.wrapS=t.wrapT=TH.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=4;
  if(color&&TH.sRGBEncoding)t.encoding=TH.sRGBEncoding;return t;}
function speckle(c,w,h,n,base,r){for(let i=0;i<n;i++){const v=(r()-0.5)*50;c.fillStyle="rgba("+(v>0?255:0)+","+(v>0?255:0)+","+(v>0?255:0)+","+Math.abs(v)/260+")";c.fillRect(r()*w,r()*h,1+r()*2.5,1+r()*2.5);}}
function groundTex(region,rep){
  const base={sa:"#D6BF95",jp:"#6A9455",uz:"#9AA168"}[region]||"#B8A98A",r=rng(7);
  return cvTex(512,512,(c,w,h)=>{c.fillStyle=base;c.fillRect(0,0,w,h);speckle(c,w,h,9000,base,r);
    if(region!=="sa"){for(let i=0;i<260;i++){c.fillStyle="rgba(30,60,20,"+(0.05+r()*0.08)+")";c.beginPath();c.arc(r()*w,r()*h,3+r()*9,0,7);c.fill();}}
    else{for(let i=0;i<40;i++){c.strokeStyle="rgba(255,240,210,.10)";c.lineWidth=2+r()*3;c.beginPath();const y=r()*h;c.moveTo(0,y);c.bezierCurveTo(w*.3,y+14,w*.6,y-14,w,y+6);c.stroke();}}},rep,rep,true);}
function plazaTex(rep,region){
  const r=rng(11),base=region==="sa"?"#CDBFA6":"#B9B6AE";
  return cvTex(256,256,(c,w,h)=>{c.fillStyle=base;c.fillRect(0,0,w,h);speckle(c,w,h,2500,base,r);
    c.strokeStyle="rgba(60,55,50,.35)";c.lineWidth=2;for(let i=0;i<=4;i++){c.beginPath();c.moveTo(i*w/4,0);c.lineTo(i*w/4,h);c.moveTo(0,i*h/4);c.lineTo(w,i*h/4);c.stroke();}},rep,rep,true);}
function seamTex(rollW,len){
  const r=rng(3);
  return cvTex(128,128,(c,w,h)=>{c.fillStyle="#fff";c.fillRect(0,0,w,h);speckle(c,w,h,1500,"#fff",r);
    c.fillStyle="rgba(120,110,95,.28)";c.fillRect(0,0,2,h);},1/rollW,1/rollW,true);}
function pitchTex(){
  return cvTex(256,256,(c,w,h)=>{for(let i=0;i<8;i++){c.fillStyle=i%2?"#3F8F4F":"#47995A";c.fillRect(i*w/8,0,w/8,h);}
    c.strokeStyle="rgba(255,255,255,.85)";c.lineWidth=3;c.strokeRect(6,6,w-12,h-12);c.beginPath();c.moveTo(w/2,6);c.lineTo(w/2,h-6);c.stroke();c.beginPath();c.arc(w/2,h/2,26,0,7);c.stroke();},1,1,true);}
function glowTex(){const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d"),g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.15,"rgba(255,240,210,.8)");g.addColorStop(1,"rgba(255,220,160,0)");x.fillStyle=g;x.fillRect(0,0,128,128);return new TH.CanvasTexture(c);}

const STEEL={white:[0xF2F3F5,0.15,0.45],steel:[0xB8BEC7,0.95,0.22],black:[0x24272C,0.7,0.35],gold:[0xD9A441,1,0.25]};
function steelMat(c,mt,rg){const k=STEEL[st.ms];return new TH.MeshStandardMaterial({color:k?k[0]:c,metalness:k?k[1]:mt,roughness:k?k[2]:rg});}
/* ---------- sifat darajalari va kino effektlari ---------- */
const QS={low:{pr:1,sh:1024,bloom:false,grade:false,fx:false},high:{pr:1.5,sh:2048,bloom:false,grade:false,fx:true},cine:{pr:2,sh:2048,bloom:true,grade:true,fx:true,cine:true}};
let fx=null,fxBloom=null,bctx=null,ma=0.0167,lowN=0;
function ensureFX(){
  if(fx)return;const stage=document.querySelector("#tab-view3d .stage");if(!stage)return;
  fx=document.createElement("div");fx.className="cinefx";
  fx.innerHTML='<canvas class="cf-bloom" width="64" height="36"></canvas><div class="cf-vig"></div><div class="cf-grain"></div><div class="cf-bar t"></div><div class="cf-bar b"></div>';
  stage.appendChild(fx);fxBloom=fx.querySelector(".cf-bloom");bctx=fxBloom.getContext("2d");
  const g=document.createElement("canvas");g.width=g.height=96;const x=g.getContext("2d"),id=x.createImageData(96,96),rr=rng(77);
  for(let i=0;i<id.data.length;i+=4){const v=Math.floor(rr()*255);id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}
  x.putImageData(id,0,0);fx.querySelector(".cf-grain").style.backgroundImage="url("+g.toDataURL()+")";
  applyFX();
}
function applyFX(){
  if(!fx||!T3)return;const q=QS[st.q]||QS.high,on=st.on;
  fx.classList.toggle("on",!!(q.fx&&on));fx.classList.toggle("grain",!!(q.grade&&on));fx.classList.toggle("bars",!!st.bars);
  fxBloom.style.display=(q.bloom&&on)?"block":"none";
  T3.renderer.domElement.style.filter=(q.grade&&on)?"contrast(1.08) saturate(1.14) brightness(1.02)":"";
  T3.cine=!!(q.cine&&on);
}
function applyQ(){
  if(!T3)return;const r=T3.renderer,cv=r.domElement;
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,QS[st.q].pr));
  if(cv.clientWidth&&cv.clientHeight)r.setSize(cv.clientWidth,cv.clientHeight,false);
  ensureFX();applyFX();ma=0.0167;lowN=0;T3.force=true;
}
window.MH3_frame=(t3,now,dt)=>{
  if(!st.on)return;
  const q=QS[st.q]||QS.high;
  if(q.bloom&&bctx){try{bctx.drawImage(t3.renderer.domElement,0,0,64,36);}catch(e){}}
  if(t3.auto&&dt>0){
    ma=ma*0.92+dt*0.08;
    if(ma>0.046)lowN++;else lowN=0;
    if(lowN>70&&st.q!=="low"){st.q=st.q==="cine"?"high":"low";saveSt();lowN=0;ma=0.0167;ui();applyQ();redo();toast(M8.t("Telefon sekin ishladi: sifat pasaytirildi."));}
  }
};

/* ---------- yoritish rejimlari ---------- */
const LIGHT={
  kino:{top:"#1E4C98",hor:"#F3D6AE",gnd:"#7C7468",hs:"#BFD0EA",hg:"#8C7C68",sunC:"#FFDDB0",sun:1.55,hemi:0.34,fog:"#DCC7AA",exp:0.98,alt:0.42,az:4.1,emis:0.26,lamp:0.5,night:false,cine:true},
  model:{top:"#7E8794",hor:"#C9C2B6",gnd:"#8E8070",hs:"#DCE3EE",hg:"#A89A86",sunC:"#FFF4E0",sun:1.0,hemi:0.42,fog:null,exp:0.82,alt:0.95,az:0.75,emis:0.12,lamp:0.25,night:false,maket:true},
  day:{top:"#2461C0",hor:"#B9D5F1",gnd:"#8A9A9E",hs:"#C7D8EC",hg:"#9C9484",sunC:"#FFF0D2",sun:1.35,hemi:0.5,fog:"#C4DBF2",exp:0.92,lamp:0.5,alt:null,emis:0.22,night:false},
  gold:{top:"#27457F",hor:"#F6B07C",gnd:"#6F6A66",hs:"#E9BE9B",hg:"#7A6A5E",sunC:"#FFB46E",sun:1.4,hemi:0.4,lamp:0.6,fog:"#F2B88A",exp:1.05,alt:0.2,az:4.4,emis:0.3,night:false},
  night:{top:"#030816",hor:"#16285A",gnd:"#10162A",hs:"#2A3C78",hg:"#141A30",sunC:"#8FA8E8",sun:0.28,hemi:0.22,lamp:0,fog:"#101C3E",exp:1.15,alt:0.7,az:2.2,emis:0.95,night:true}
};
function sunVec(P,th){
  const v=M8.V(),c=M8.city();let alt,az;
  if(P.alt!=null){alt=P.alt;az=P.az;}
  else{const sp=M8.sunPos(c.lat,v.day,v.hour);alt=sp.alt;az=sp.az;if(alt<0.2){alt=0.85;az=2.4;}}
  const ux=Math.sin(az-th),uz=-Math.cos(az-th);
  return {x:ux*Math.cos(alt),y:Math.sin(alt),z:uz*Math.cos(alt),alt:alt};
}

/* ---------- atrof: osmon, yer, daraxt, odamlar ---------- */
function disp(o){o.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{["map","bumpMap"].forEach(k=>{if(m[k])m[k].dispose();});m.dispose();});}});}
function skyCanvas(P,sv,W,Hh,mode){
  const c=document.createElement("canvas");c.width=W;c.height=Hh;const x=c.getContext("2d");
  const mix=(a,b,k)=>hex(a).lerp(hex(b),k).getStyle();
  const g=x.createLinearGradient(0,0,0,Hh);
  g.addColorStop(0,P.top);g.addColorStop(0.28,mix(P.top,P.hor,0.4));g.addColorStop(0.44,P.hor);g.addColorStop(0.5,P.hor);g.addColorStop(0.53,P.gnd);g.addColorStop(1,P.gnd);
  x.fillStyle=g;x.fillRect(0,0,W,Hh);
  const sa=Math.atan2(sv.z,mode==="env"?sv.x:-sv.x)/(Math.PI*2)+(mode==="env"?0.5:0),su=((sa%1)+1)%1*W,sy=(0.5-Math.asin(Math.max(-1,Math.min(1,sv.y)))/Math.PI)*Hh;
  if(!P.night){
    const r=rng(19);
    for(let i=0;i<44;i++){
      const el=0.1+r()*0.95,cy=(0.5-el/Math.PI)*Hh,cx=r()*W,w=W*(0.04+r()*0.09),near=Math.abs(cx-su)<W*0.12;
      const col=near?hex(P.sunC):hex("#FFFFFF");const rgb=Math.round(col.r*255)+","+Math.round(col.g*255)+","+Math.round(col.b*255);
      for(let k=0;k<5;k++){
        const px=cx+(r()-0.5)*w*1.4,py=cy+(r()-0.5)*w*0.12,rr=w*(0.35+r()*0.5);
        [0,-W,W].forEach(off=>{if(px+off<-rr||px+off>W+rr)return;
          x.save();x.translate(px+off,py);x.scale(1,0.26);
          const rg=x.createRadialGradient(0,0,0,0,0,rr);rg.addColorStop(0,"rgba("+rgb+","+(0.16+r()*0.12)+")");rg.addColorStop(1,"rgba("+rgb+",0)");
          x.fillStyle=rg;x.beginPath();x.arc(0,0,rr,0,6.283);x.fill();x.restore();});
      }
    }
  }
  x.globalCompositeOperation="lighter";
  [0,-W,W].forEach(off=>{
    const R1=W*(P.night?0.05:0.3),g1=x.createRadialGradient(su+off,sy,0,su+off,sy,R1);
    g1.addColorStop(0,"rgba(255,235,200,"+(P.night?0.12:0.5)+")");g1.addColorStop(1,"rgba(255,200,140,0)");x.fillStyle=g1;x.fillRect(su+off-R1,sy-R1,R1*2,R1*2);
    const R2=W*(P.night?0.012:0.012),g2=x.createRadialGradient(su+off,sy,0,su+off,sy,R2);
    g2.addColorStop(0,"rgba(255,255,255,1)");g2.addColorStop(0.5,"rgba(255,246,225,.9)");g2.addColorStop(1,"rgba(255,240,210,0)");x.fillStyle=g2;x.fillRect(su+off-R2,sy-R2,R2*2,R2*2);
  });
  x.globalCompositeOperation="source-over";
  return c;
}
function skyDome(P,R,sv){
  const tex=new TH.CanvasTexture(skyCanvas(P,sv,1024,512,"dome"));if(TH.sRGBEncoding)tex.encoding=TH.sRGBEncoding;
  const m=new TH.Mesh(new TH.SphereGeometry(R,40,24),new TH.MeshBasicMaterial({map:tex,side:TH.BackSide,fog:false,depthWrite:false,toneMapped:false}));m.renderOrder=-10;
  const grp=new TH.Group();grp.add(m);
  if(P.night){const n=500,a=new Float32Array(n*3),r=rng(5);for(let i=0;i<n;i++){const u=r()*6.283,v=Math.acos(r()*0.95),d=R*0.96;a[i*3]=d*Math.sin(v)*Math.cos(u);a[i*3+1]=d*Math.cos(v);a[i*3+2]=d*Math.sin(v)*Math.sin(u);}
    const sg=new TH.BufferGeometry();sg.setAttribute("position",new TH.BufferAttribute(a,3));
    grp.add(new TH.Points(sg,new TH.PointsMaterial({color:0xffffff,size:R*0.004,sizeAttenuation:true,fog:false,transparent:true,opacity:0.85})));}
  return grp;
}
function makeEnv(P,sv){
  try{
    const tex=new TH.CanvasTexture(skyCanvas(P,sv,512,256,"env"));tex.mapping=TH.EquirectangularReflectionMapping;if(TH.sRGBEncoding)tex.encoding=TH.sRGBEncoding;
    const pm=new TH.PMREMGenerator(T3.renderer),rt=pm.fromEquirectangular(tex);tex.dispose();pm.dispose();return rt.texture;
  }catch(e){return null;}
}
function person(r,mats){
  const g=new TH.Group(),h=1.62+r()*0.2,sh=mats.shirt[Math.floor(r()*mats.shirt.length)];
  const legs=new TH.Mesh(new TH.CylinderGeometry(0.1,0.12,h*0.5,8),mats.pants);legs.position.y=h*0.25;
  const body=new TH.Mesh(new TH.CylinderGeometry(0.17,0.15,h*0.36,10),sh);body.position.y=h*0.5+h*0.18-0.04;
  const head=new TH.Mesh(new TH.SphereGeometry(0.115,12,10),mats.skin);head.position.y=h-0.12;
  [legs,body,head].forEach(m=>{m.castShadow=true;g.add(m);});return g;
}
function tree(kind,r,mats){
  const g=new TH.Group(),s=0.85+r()*0.45;
  if(kind==="sa"){const h=6+r()*3,tr=new TH.Mesh(new TH.CylinderGeometry(0.16,0.26,h,8),mats.trunk);tr.position.y=h/2;tr.rotation.z=(r()-0.5)*0.12;tr.castShadow=true;g.add(tr);
    for(let i=0;i<9;i++){const f=new TH.Mesh(new TH.ConeGeometry(0.34,3.4,5),mats.palm);const a=i/9*6.283;f.position.set(Math.cos(a)*1.3,h+0.1,Math.sin(a)*1.3);f.rotation.set(Math.sin(a)*1.25,0,-Math.cos(a)*1.25);f.castShadow=true;g.add(f);}}
  else if(kind==="uz"){const h=9+r()*5,tr=new TH.Mesh(new TH.CylinderGeometry(0.2,0.3,h*0.3,8),mats.trunk);tr.position.y=h*0.15;g.add(tr);
    const cr=new TH.Mesh(new TH.SphereGeometry(1,10,8),r()>0.5?mats.leaf1:mats.leaf2);cr.scale.set(1.5,h*0.4,1.5);cr.position.y=h*0.55;cr.castShadow=true;g.add(cr);}
  else{const h=5+r()*3,tr=new TH.Mesh(new TH.CylinderGeometry(0.17,0.27,h*0.55,8),mats.trunk);tr.position.y=h*0.275;tr.castShadow=true;g.add(tr);
    const lm=r()<0.22?mats.sakura:(r()>0.5?mats.leaf1:mats.leaf2);
    for(let i=0;i<3;i++){const b=new TH.Mesh(new TH.IcosahedronGeometry(1.7-i*0.25,2),lm);b.position.set((r()-0.5)*1.5,h*0.62+i*1.1,(r()-0.5)*1.5);b.castShadow=true;g.add(b);}}
  g.scale.setScalar(s);return g;
}

const lay=(o,k)=>{o.material.polygonOffset=true;o.material.polygonOffsetFactor=-k;o.material.polygonOffsetUnits=-k;return o;};
function grassTex(rep){const r=rng(21);return cvTex(512,512,(c,w,h)=>{c.fillStyle="#3C9A2B";c.fillRect(0,0,w,h);
  for(let i=0;i<14000;i++){const v=r();c.fillStyle=v<0.5?"rgba(30,100,25,"+(0.18+r()*0.2)+")":"rgba(150,220,90,"+(0.15+r()*0.2)+")";c.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);}},rep,rep,true);}
function asphaltTex(){const r=rng(31);return cvTex(256,256,(c,w,h)=>{c.fillStyle="#6A6E74";c.fillRect(0,0,w,h);speckle(c,w,h,5000,"#666",r);
  c.fillStyle="rgba(255,255,255,.85)";for(let i=0;i<8;i++)c.fillRect(i*32+14,0,3,h*0.46),c.fillRect(i*32+14,h*0.54,3,h*0.46);},1,1,true);}
function waterTex(){const r=rng(41);return cvTex(256,64,(c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,"#2F86B5");g.addColorStop(1,"#6FC3D8");c.fillStyle=g;c.fillRect(0,0,w,h);
  c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=2;for(let i=0;i<14;i++){c.beginPath();const y=r()*h;c.moveTo(0,y);c.bezierCurveTo(w*.3,y+8,w*.6,y-8,w,y+4);c.stroke();}},1,1,true);}
function buildMaket(S,g,P,sv){
  const grp=new TH.Group(),m=Math.max(S.L,S.W),u=Math.max(0.05,m*0.0012),k=S.shape==="stad"?1.5:2.1,pw=S.L*k,pd=S.W*k,rim=m*0.035,rh=m*0.04,dep=m*0.3,r=rng(S.L*5+S.W*3+9);
  P.noSun=true;grp.add(skyDome(P,m*16,sv));
  const mk=(geo,col,rough)=>{const o=new TH.Mesh(geo,new TH.MeshStandardMaterial({color:col,roughness:rough==null?0.6:rough}));o.castShadow=true;o.receiveShadow=true;return o;};
  const fl=new TH.Mesh(new TH.CircleGeometry(m*9,48),new TH.MeshStandardMaterial({color:0x9C8C77,roughness:0.9}));fl.rotation.x=-Math.PI/2;fl.position.y=-dep-0.02;fl.receiveShadow=true;grp.add(fl);
  const body=mk(new TH.BoxGeometry(pw+rim*2,dep,pd+rim*2),0xF3F3F1);body.position.y=-dep/2;grp.add(body);
  [[pw+rim*2,rim,0,pd/2+rim/2],[pw+rim*2,rim,0,-pd/2-rim/2]].forEach(a=>{const b=mk(new TH.BoxGeometry(a[0],rh,a[1]),0xFAFAF8);b.position.set(a[2],rh/2,a[3]);grp.add(b);});
  [[pw/2+rim/2],[-pw/2-rim/2]].forEach(a=>{const b=mk(new TH.BoxGeometry(rim,rh,pd),0xFAFAF8);b.position.set(a[0],rh/2,0);grp.add(b);});
  const gr=new TH.Mesh(new TH.PlaneGeometry(pw,pd),new TH.MeshStandardMaterial({map:grassTex(pw/14),roughness:1}));gr.rotation.x=-Math.PI/2;gr.position.y=u;lay(gr,1);gr.receiveShadow=true;grp.add(gr);
  const px=S.L*1.3,pz=S.W*1.3,pl=new TH.Mesh(new TH.PlaneGeometry(px,pz),new TH.MeshStandardMaterial({map:plazaTex(Math.max(3,px/5),S.region),roughness:0.85}));
  pl.rotation.x=-Math.PI/2;pl.position.y=u*2.5;lay(pl,2);pl.receiveShadow=true;grp.add(pl);
  /* to'xtash joyi */
  const pkw=pw/2-px/2-rim*2,pkx=px/2+pkw/2+m*0.02,pkd=pd*0.62;
  const rects=[[0,0,px/2+1,pz/2+1]];
  if(pkw>m*0.12){const t=asphaltTex();t.repeat.set(Math.max(1,pkd/20),1);t.rotation=Math.PI/2;
    const pk=new TH.Mesh(new TH.PlaneGeometry(pkw,pkd),new TH.MeshStandardMaterial({map:t,roughness:0.95}));pk.rotation.x=-Math.PI/2;pk.position.set(pkx,u*3.5,0);lay(pk,3);pk.receiveShadow=true;grp.add(pk);
    rects.push([pkx,0,pkw/2+1,pkd/2+1]);
    const nc=Math.floor(pkd/3.2),cars=new TH.InstancedMesh(new TH.BoxGeometry(1.8,1.3,4.2),new TH.MeshStandardMaterial({roughness:0.4,metalness:0.3}),nc*2),M4=new TH.Matrix4(),cl=[0xd9d9d9,0x222831,0xb02a2a,0x2d5fa8,0xeeeeee,0x6b6f76];
    let ci=0;for(let i=0;i<nc;i++)for(let sd=-1;sd<=1;sd+=2){if(r()<0.35){M4.makeTranslation(1e5,1e5,1e5);}else M4.makeTranslation(pkx+sd*pkw*0.24,0.7,-pkd/2+2+i*3.2);cars.setMatrixAt(ci,M4);cars.setColorAt(ci,new TH.Color(cl[Math.floor(r()*cl.length)]));ci++;}
    cars.castShadow=true;cars.receiveShadow=true;grp.add(cars);}
  /* suv oynasi */
  const wz=pd/2-m*0.1,ww=pw*0.7,wd=m*0.12;
  const wt=waterTex(),wm=new TH.Mesh(new TH.PlaneGeometry(ww,wd),new TH.MeshStandardMaterial({map:wt,roughness:0.12,metalness:0.2}));wm.rotation.x=-Math.PI/2;wm.position.set(-pw*0.1,u*3.5,-wz);lay(wm,3);wm.receiveShadow=true;grp.add(wm);
  rects.push([-pw*0.1,-wz,ww/2+2,wd/2+2]);
  /* daraxtlar (instansli) */
  if(st.ent){
    const N=Math.round(clamp(pw*pd/230,30,130)),tr=new TH.InstancedMesh(new TH.CylinderGeometry(0.12,0.18,1,6),new TH.MeshStandardMaterial({color:0x6b4f35,roughness:1}),N),
      cr=new TH.InstancedMesh(new TH.IcosahedronGeometry(1,1),new TH.MeshStandardMaterial({roughness:0.95}),N),M4=new TH.Matrix4(),Q=new TH.Quaternion(),Sx=new TH.Vector3(),Pp=new TH.Vector3();
    const gc=[0x2F7A2A,0x3E8F34,0x276B26,0x4A9A3C,0x356F2C];let n=0,tries=0;
    while(n<N&&tries<N*20){tries++;const x=(r()-0.5)*(pw-rim*4),z=(r()-0.5)*(pd-rim*4);let bad=false;
      for(const q of rects){if(Math.abs(x-q[0])<q[2]&&Math.abs(z-q[1])<q[3]){bad=true;break;}}
      if(bad)continue;const h=clamp(5+r()*4,4,m*0.3+4),rc=h*0.33;
      Sx.set(1,h*0.5,1);Pp.set(x,h*0.25,z);M4.compose(Pp,Q,Sx);tr.setMatrixAt(n,M4);
      Sx.set(rc,rc*(0.9+r()*0.3),rc);Pp.set(x,h*0.5+rc*0.7,z);M4.compose(Pp,Q,Sx);cr.setMatrixAt(n,M4);cr.setColorAt(n,new TH.Color(gc[Math.floor(r()*gc.length)]));n++;}
    tr.count=n;cr.count=n;tr.castShadow=cr.castShadow=true;tr.receiveShadow=cr.receiveShadow=true;grp.add(tr);grp.add(cr);
  }
  grp.userData.ext=Math.max(pw,pd)/2*1.12;grp.userData.cam={y:rh};
  return grp;
}

function hills(R,S,P,r,m){
  const grp=new TH.Group(),cols={sa:["#CDB184","#BFA070"],jp:["#587F62","#46695A"],uz:["#9A9066","#7F7656"]}[S.region]||["#8F9A80","#788468"],hh={sa:0.16,jp:0.5,uz:0.36}[S.region]||0.3;
  [0,1].forEach(k=>{
    const rad=R*(k?0.9:0.78),H0=m*hh*(k?1.2:0.8),g=new TH.CylinderGeometry(rad,rad,1,128,1,true),pos=g.attributes.position;
    const ph=[r()*6,r()*6,r()*6];
    for(let i=0;i<pos.count;i++){const y=pos.getY(i),a=Math.atan2(pos.getZ(i),pos.getX(i));
      if(y>0){const n=0.5+0.25*Math.sin(a*3+ph[0])+0.15*Math.sin(a*7+ph[1])+0.1*Math.sin(a*13+ph[2]);pos.setY(i,H0*Math.max(0.12,n));}else pos.setY(i,-2);}
    g.computeVertexNormals();
    const mt=new TH.Mesh(g,new TH.MeshStandardMaterial({color:cols[k],roughness:1,side:TH.DoubleSide}));grp.add(mt);
  });
  return grp;
}
function floods(grp,S,m,P){
  const mat=new TH.MeshStandardMaterial({color:0xBFC5CE,metalness:0.6,roughness:0.4}),hm=new TH.MeshStandardMaterial({color:0xFFF4D8,emissive:0xFFE8B0,emissiveIntensity:P.night?2.2:0.7,roughness:0.5}),h=m*0.3;
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(a=>{const x=a[0]*S.L/2*1.3,z=a[1]*S.W/2*1.3,p=new TH.Mesh(new TH.CylinderGeometry(h*0.012,h*0.02,h,8),mat);p.position.set(x,h/2,z);p.castShadow=true;grp.add(p);
    const hd=new TH.Mesh(new TH.BoxGeometry(h*0.16,h*0.1,h*0.04),hm);hd.position.set(x,h,z);hd.lookAt(0,h*0.4,0);grp.add(hd);});
}
function buildEnv(S,g,P,sv){
  if(P.maket)return buildMaket(S,g,P,sv);
  const grp=new TH.Group(),m=Math.max(S.L,S.W),R=m*7,r=rng(S.L*13+S.W*7+17);
  grp.add(skyDome(P,R*1.3,sv));
  const gtex=groundTex(S.region,R/10),gm=new TH.Mesh(new TH.CircleGeometry(R,72),new TH.MeshStandardMaterial({map:gtex,bumpMap:gtex,bumpScale:1.4,roughness:1,metalness:0}));
  gm.rotation.x=-Math.PI/2;gm.position.y=-Math.max(0.12,m*0.0024);lay(gm,1);gm.receiveShadow=true;grp.add(gm);
  const pw=(S.shape==="stad"?S.L*1.35:S.L*1.25),pd=(S.shape==="stad"?S.W*1.35:S.W*1.25);
  const pl=new TH.Mesh(new TH.PlaneGeometry(pw,pd),new TH.MeshStandardMaterial({map:plazaTex(Math.max(3,pw/5),S.region),roughness:0.85}));
  pl.rotation.x=-Math.PI/2;pl.position.y=-Math.max(0.04,m*0.0008);lay(pl,2);pl.receiveShadow=true;grp.add(pl);
  grp.add(hills(R,S,P,r,m));
  if(S.shape==="stad")floods(grp,S,m,P);
  if(st.ent){
    const mats={trunk:new TH.MeshStandardMaterial({color:0x6b5a45,roughness:1}),palm:new TH.MeshStandardMaterial({color:0x4F7A3A,roughness:0.9,side:TH.DoubleSide}),
      leaf1:new TH.MeshStandardMaterial({color:0x5B8F4A,roughness:1}),leaf2:new TH.MeshStandardMaterial({color:0x46793C,roughness:1}),sakura:new TH.MeshStandardMaterial({color:0xF0B7C7,roughness:1}),
      pants:new TH.MeshStandardMaterial({color:0x2c3548,roughness:0.9}),skin:new TH.MeshStandardMaterial({color:0xd7a37f,roughness:0.8}),
      shirt:[0xd9602f,0x2f6fd9,0xf2f2f2,0x3a9a6a,0xe0b13a,0x8a3fa8].map(c=>new TH.MeshStandardMaterial({color:c,roughness:0.85}))};
    const kind=S.region,ex=S.L/2*1.28,ez=S.W/2*1.28,N=Math.round(clamp(14+m*0.25,16,34));
    for(let i=0;i<N*3&&grp.userData.nt!==N;i++){const a=r()*6.283,d=1.2+r()*1.1,x=Math.cos(a)*ex*d,z=Math.sin(a)*ez*d;
      if(Math.pow(x/(S.L/2*1.12),2)+Math.pow(z/(S.W/2*1.12),2)<1)continue;
      const t=tree(kind,r,mats);t.position.set(x,0,z);t.rotation.y=r()*6;grp.add(t);grp.userData.nt=(grp.userData.nt||0)+1;}
    const np=S.shape==="stad"?0:Math.round(clamp(S.L*S.W/60,6,18));
    for(let i=0;i<np;i++){const x=(r()-0.5)*S.L*0.9,z=(r()-0.5)*S.W*0.9,p=person(r,mats);p.position.set(x,0,z);p.rotation.y=r()*6;grp.add(p);}
    if(S.shape==="stad"){for(let i=0;i<14;i++){const a=r()*6.283,rr=1.18+r()*0.1,p=person(r,mats);p.position.set(Math.cos(a)*S.L/2*rr,0,Math.sin(a)*S.W/2*rr);grp.add(p);}}
  }
  grp.traverse(o=>{if(o.isMesh&&!o.material.map&&o!==gm&&o!==pl){o.castShadow=o.castShadow||false;}});
  return grp;
}

/* ---------- asosiy kanca: update3 oxirida ---------- */
function setup(){
  if(!T3)return;const r=T3.renderer;
  try{
    r.shadowMap.enabled=true;r.shadowMap.type=TH.PCFSoftShadowMap;r.setPixelRatio(Math.min(window.devicePixelRatio||1,QS[st.q].pr));r.shadowMap.autoUpdate=false;
    r.toneMapping=TH.ACESFilmicToneMapping;
    if(TH.sRGBEncoding)r.outputEncoding=TH.sRGBEncoding;
  }catch(e){}
  const L=T3.scene.children.filter(o=>o.isLight);
  H={h:L.find(o=>o.isHemisphereLight),d1:L.filter(o=>o.isDirectionalLight)[0],d2:L.filter(o=>o.isDirectionalLight)[1]};
  H.orig={h:H.h.intensity,d1:H.d1.intensity,d2:H.d2.intensity,p1:H.d1.position.clone()};
  T3.scene.fog=null;
  try{ensureFX();}catch(e){}
}
function restoreOff(){
  const r=T3.renderer;
  r.toneMapping=TH.NoToneMapping;r.shadowMap.enabled=false;
  if(TH.sRGBEncoding)r.outputEncoding=TH.LinearEncoding;
  H.h.intensity=H.orig.h;H.d1.intensity=H.orig.d1;H.d2.intensity=H.orig.d2;H.d1.position.copy(H.orig.p1);H.d1.castShadow=false;H.d1.color.set(0xffffff);
  T3.scene.fog=null;T3.scene.environment=null;
  if(envGrp){envGrp.visible=false;}
  r.shadowMap.needsUpdate=true;
  applyFX();
}
window.MH3_init=(t3,three)=>{T3=t3;TH=three;try{setup();}catch(e){console.error(e);}};
window.MH3_post=(t3,P5,g,T,S,three)=>{
  T3=t3;TH=three;if(!H)setup();if(!H)return;
  const G=T3.group;
  if(!st.on){G.children.forEach(o=>{if(o.name==="person")o.visible=true;});if(envKey!=="off"){restoreOff();envKey="off";}return;}
  const P=LIGHT[st.light],th=(M8.V().orient||0)*Math.PI/180,sv=sunVec(P,th),m=Math.max(S.L,S.W);
  /* atrof qayta quriladi: shakl, o'lcham, rejim o'zgarsa */
  const key=[S.shape,S.L,S.W,S.region,st.light,st.ent,sv.x.toFixed(2),sv.z.toFixed(2)].join("|");
  if(key!==envKey){
    if(envGrp){T3.scene.remove(envGrp);disp(envGrp);}
    envGrp=buildEnv(S,g,P,sv);T3.scene.add(envGrp);envKey=key;
    if(T3.scene.environment)T3.scene.environment.dispose();
    T3.scene.environment=makeEnv(P,sv);
  }
  envGrp.visible=true;
  const R=m*7;T3.scene.fog=P.fog?new TH.Fog(hex(P.fog),m*(P.cine?3.6:2.2),R*0.95):null;
  T3.renderer.toneMappingExposure=P.exp;
  H.h.color.set(P.hs);H.h.groundColor.set(P.hg);H.h.intensity=P.hemi;
  H.d1.color.set(P.sunC);H.d1.intensity=P.sun;H.d1.position.set(sv.x*m*3.5,sv.y*m*3.5,sv.z*m*3.5);H.d1.castShadow=true;
  T3.dm=m*(P.maket?18:15);const sc=H.d1.shadow,ext=envGrp.userData.ext||m*1.5,ms=QS[st.q].sh;sc.mapSize.set(ms,ms);sc.camera.left=-ext;sc.camera.right=ext;sc.camera.top=ext;sc.camera.bottom=-ext;sc.camera.near=1;sc.camera.far=m*10;sc.bias=-0.0004;sc.normalBias=Math.max(0.06,ext*2/ms*2.2);sc.camera.updateProjectionMatrix();
  H.d2.intensity=P.night?0.12:(P.cine?0.4:0.18);H.d2.color.set(P.cine?"#8FB0E8":P.hs);H.d2.position.set(-sv.x*m*2.5,Math.max(sv.y,0.25)*m*1.5,-sv.z*m*2.5);
  /* materiallar */
  const tex=seamTex(T.rollW||2);
  G.children.slice().forEach(o=>{
    switch(o.name){
    case "ground":case "grid":o.visible=false;break;
    case "person":o.visible=false;break;
    case "membrane":{
      const old=o.material,geo=o.geometry;
      if(!geo.attributes.uv){const p=geo.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i);uv[i*2+1]=p.getZ(i);}geo.setAttribute("uv",new TH.BufferAttribute(uv,2));}
      const et=S.mtype==="ETFE",col=hex(st.mc!=="auto"?st.mc:T.color);if(P.maket)col.lerp(hex("#FFFFFF"),0.65);
      o.material=new TH.MeshPhysicalMaterial({clearcoat:et?1:0.12,clearcoatRoughness:et?0.08:0.45,color:col,map:tex,bumpMap:tex,bumpScale:0.6,side:TH.DoubleSide,transparent:true,opacity:st.mo!=null?st.mo/100:(et?Math.min(old.opacity,0.55):Math.min(0.96,old.opacity)),
        roughness:st.mg!=null?(0.95-st.mg*0.0085):(et?0.12:0.62),metalness:0,emissive:P.night?hex("#FFD9A0"):col.clone(),emissiveIntensity:P.night?0.55:P.emis*0.5,envMapIntensity:et?1.4:0.5});
      old.dispose();o.castShadow=true;o.receiveShadow=false;break;}
    case "cable":{
      o.visible=false;const pts=o.geometry.getAttribute("position"),arr=[];for(let i=0;i<pts.count;i++)arr.push(new TH.Vector3(pts.getX(i),pts.getY(i),pts.getZ(i)));
      if(arr.length>3){const cu=new TH.CatmullRomCurve3(arr,false,"catmullrom",0.2),rad=clamp(m*0.0032,0.04,0.2);
        const tb=new TH.Mesh(new TH.TubeGeometry(cu,Math.min(600,arr.length*2),rad,6,false),steelMat(0xC9CED5,0.85,0.32));tb.castShadow=true;tb.name="cablet";G.add(tb);}
      break;}
    case "mast":o.material=P.maket?steelMat(0xF1F2F4,0.1,0.5):steelMat(0xD6DAE0,0.8,0.3);o.castShadow=true;o.receiveShadow=true;break;
    case "field":o.material=new TH.MeshStandardMaterial({map:pitchTex(),roughness:0.95});lay(o,5);o.position.y=Math.max(0.2,m*0.004);o.receiveShadow=true;break;
    case "ring":o.material.roughness=0.9;o.receiveShadow=true;o.castShadow=true;break;
    case "slab":o.visible=false;break;
    }
  });
  /* kechasi: ichki chiroqlar */
  if(P.night&&P5.mem>0){const lt=[[0,0],[S.L*0.25,0],[-S.L*0.25,0]];lt.forEach(a=>{const pl=new TH.PointLight(0xFFD9A0,1.4,m*1.3,1.5);pl.position.set(a[0],Math.max(2,g.maxY*0.45),a[1]);pl.name="lamp";G.add(pl);});}
  if(P.lamp&&P5.mem>0){const pl=new TH.PointLight(0xFFE6C0,P.lamp,m*1.2,1.5);pl.position.set(0,Math.max(2,g.maxY*0.5),0);pl.name="lamp";G.add(pl);}
  T3.renderer.shadowMap.needsUpdate=true;
  lastKey=sunKey();
  if(!window.__mkCam){window.__mkCam=1;setTimeout(P.maket?camM:camK,0);}
}
const sunKey=()=>{const v=M8.V();return [st.on,st.light,st.ent,v.hour,v.day,v.orient,v.city].join("|");};

/* ---------- boshqaruv ---------- */
let rdT=0;function redo(){if(rdT)return;rdT=setTimeout(()=>{rdT=0;const e=$("#o-op");if(e)e.dispatchEvent(new Event("input"));},70);}
function ui(){
  $("#rl-on").checked=st.on;$("#rl-ent").checked=st.ent;
  $$("#rl-light button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.l===st.light)));
  $$("#rl-q button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.q===st.q)));
  $("#rl-bars").checked=!!st.bars;applyFX();
}
$("#rl-q").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.q=b.dataset.q;saveSt();ui();applyQ();redo();});
$("#rl-bars").addEventListener("change",e=>{st.bars=e.target.checked;saveSt();applyFX();});
$("#rl-on").addEventListener("change",e=>{st.on=e.target.checked;saveSt();ui();redo();});
$("#rl-ent").addEventListener("change",e=>{st.ent=e.target.checked;saveSt();envKey="";redo();});
$("#rl-light").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.light=b.dataset.l;st.on=true;saveSt();ui();redo();});
function cam(phi,theta,k){
  if(!T3)return;const g=MH.R.g,m=Math.max(MH.S.L,MH.S.W);
  T3.target.set(0,g.maxY*0.3,0);T3.phi=phi;T3.theta=theta;T3.radius=m*k*Math.max(1,0.95/(T3.camera.aspect||1));
  T3.force=true;
}
const camK=()=>{cam(1.28,0.62,1.7);if(T3)T3.target.y=Math.max(0,MH.R.g.maxY*0.25);};
$("#rl-cam").addEventListener("click",()=>{if(st.light==="model")camM();else camK();});
const camM=()=>{cam(0.95,0.78,MH.S.shape==="stad"?2.45:2.9);if(T3)T3.target.y=-Math.max(MH.S.L,MH.S.W)*0.09;};
$("#rl-eye").addEventListener("click",()=>{if(!T3)return;const m=Math.max(MH.S.L,MH.S.W),g=MH.R.g;
  T3.target.set(0,Math.min(g.maxY*0.55,6),0);T3.phi=1.5;T3.theta=0.9;T3.radius=Math.max(8,m*0.75);T3.force=true;});
function toast(msg){const n=$("#rl-note");n.hidden=false;n.textContent=msg;}
$("#rl-shot").addEventListener("click",()=>{
  if(!T3)return;const r=T3.renderer,cv=r.domElement,w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  try{
    const W=1600,Hh=Math.round(W*h/w),pr=r.getPixelRatio();
    r.setPixelRatio(1);r.setSize(W,Hh,false);r.render(T3.scene,T3.camera);
    const out=document.createElement("canvas");out.width=W;out.height=Hh;const x=out.getContext("2d");x.drawImage(cv,0,0);
    const vg=x.createRadialGradient(W/2,Hh/2,Hh*0.45,W/2,Hh/2,Hh*0.95);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.32)");x.fillStyle=vg;x.fillRect(0,0,W,Hh);
    const bar=Math.round(Hh*0.085);x.fillStyle="rgba(5,15,38,.78)";x.fillRect(0,Hh-bar,W,bar);x.fillStyle="#E8B65C";x.fillRect(0,Hh-bar,W,3);
    const b=MH.S.bim||{},ttl=b.title||MH.SHAPES[MH.S.shape].n;
    x.fillStyle="#fff";x.font="600 "+Math.round(bar*0.42)+"px Arial,sans-serif";x.textBaseline="middle";x.fillText(ttl,bar*0.4,Hh-bar*0.62);
    x.fillStyle="#B9C7E8";x.font=Math.round(bar*0.28)+"px Arial,sans-serif";x.fillText(MH.S.L+" × "+MH.S.W+" m · "+MH.S.mtype+" · "+MH.REG[MH.S.region].n,bar*0.4,Hh-bar*0.25);
    x.textAlign="right";x.fillStyle="#E8B65C";x.font="700 "+Math.round(bar*0.38)+"px Arial,sans-serif";x.fillText("TAIYO SKY",W-bar*0.4,Hh-bar*0.5);
    r.setPixelRatio(pr);r.setSize(w,h,false);T3.force=true;
    const url=out.toDataURL("image/png"),name="taiyo-sky-"+Date.now()+".png";
    let ok=false;
    try{if(window.AndroidApp&&window.AndroidApp.saveImage){const res=String(window.AndroidApp.saveImage(name,url.split(",")[1]));if(res.indexOf("OK:")===0){toast(M8.t("Rasm saqlandi:")+" "+res.slice(3));ok=true;}}}catch(e){}
    if(!ok){const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();toast(M8.t("Rasm yuklab olindi."));}
  }catch(e){try{r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));r.setSize(w,h,false);}catch(x){}toast(M8.t("Rasmni olib bo'lmadi."));}
});
/* ---------- material tanlash ---------- */
function mtUI(){
  $$("#mt-col .sw").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.c===st.mc)));
  $$("#mt-st button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.s===st.ms)));
  if(st.mg!=null)$("#mt-gl").value=st.mg;if(st.mo!=null)$("#mt-op").value=st.mo;
}
$("#mt-col").addEventListener("click",e=>{const b=e.target.closest(".sw");if(!b)return;st.mc=b.dataset.c;saveSt();mtUI();redo();});
$("#mt-st").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.ms=b.dataset.s;saveSt();mtUI();redo();});
$("#mt-gl").addEventListener("input",e=>{st.mg=+e.target.value;saveSt();redo();});
$("#mt-op").addEventListener("input",e=>{st.mo=+e.target.value;saveSt();redo();});
$("#mt-reset").addEventListener("click",()=>{st.mc="auto";st.mg=null;st.mo=null;st.ms="auto";$("#mt-gl").value=40;$("#mt-op").value=90;saveSt();mtUI();redo();});
/* ---------- kamera yo'li va video ---------- */
const KF=[];let PL=null,rec=null,chunks=[],recTimer=0;
const wrapPi=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
function cpUI(){$("#cp-n").textContent=KF.length;$("#cp-dv").textContent=$("#cp-dur").value;$("#cp-play").textContent=PL?M8.t("To'xtatish"):M8.t("Ko'rish");$("#cp-rec").disabled=!!rec;}
$("#cp-dur").addEventListener("input",cpUI);
$("#cp-add").addEventListener("click",()=>{if(!T3)return;let th=T3.theta;if(KF.length)th=KF[KF.length-1].th+wrapPi(th-KF[KF.length-1].th);KF.push({th:th,ph:T3.phi,r:T3.radius,ty:T3.target.y});cpUI();toast(M8.t("Kadr qo'shildi."));});
$("#cp-clr").addEventListener("click",()=>{KF.length=0;cpUI();});
const cr=(p0,p1,p2,p3,t)=>0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
function camAt(u){
  if(KF.length<2){const b=PL.base,a=u*Math.PI*2;return {th:b.th+a,ph:clamp(b.ph+Math.sin(a)*0.05,0.12,1.5),r:b.r*(1+Math.sin(a)*0.04),ty:b.ty};}
  const e=u*u*(3-2*u),n=KF.length-1,x=e*n,i=Math.min(n-1,Math.floor(x)),t=x-i,g=k=>KF[Math.max(0,Math.min(n,k))],o={};
  ["th","ph","r","ty"].forEach(k=>{o[k]=cr(g(i-1)[k],g(i)[k],g(i+1)[k],g(i+2)[k],t);});o.ph=clamp(o.ph,0.1,1.52);return o;
}
function playPath(done){
  if(!T3)return;PL={t0:0,dur:+$("#cp-dur").value*1000,done:done,base:{th:T3.theta,ph:T3.phi,r:T3.radius,ty:T3.target.y}};
  if(KF.length>=2){const c=KF[0];T3.theta=c.th;T3.phi=c.ph;T3.radius=c.r;T3.target.y=c.ty;}
  T3.auto=false;T3.resumeAt=0;cpUI();
}
function stopPath(){if(!PL)return;const d=PL.done;PL=null;if(T3){T3.auto=$("#o-auto").checked;T3.force=true;}cpUI();if(d)d();}
window.MH3_tick=(t3,now)=>{
  if(!PL)return false;if(!PL.t0)PL.t0=now;const u=Math.min(1,(now-PL.t0)/PL.dur),c=camAt(u);
  t3.theta=c.th;t3.phi=c.ph;t3.radius=c.r;t3.target.y=c.ty;t3.auto=false;
  if(u>=1)stopPath();return true;
};
$("#cp-play").addEventListener("click",()=>{if(PL)stopPath();else playPath(null);});
function saveVideo(blob,mt){
  const ext=(mt||"").indexOf("mp4")>=0?"mp4":"webm",name="taiyo-sky-"+Date.now()+"."+ext,mime=ext==="mp4"?"video/mp4":"video/webm";
  const fr=new FileReader();
  fr.onload=()=>{
    const b64=String(fr.result).split(",")[1]||"";let ok=false;
    try{if(window.AndroidApp&&window.AndroidApp.videoOpen){
      if(String(window.AndroidApp.videoOpen(name,mime)).indexOf("OK")===0){
        const CH=393216;for(let i=0;i<b64.length;i+=CH)window.AndroidApp.videoChunk(b64.slice(i,i+CH));
        const r=String(window.AndroidApp.videoClose());if(r.indexOf("OK:")===0){toast(M8.t("Video saqlandi:")+" "+r.slice(3));ok=true;}}}}catch(e){}
    if(!ok){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast(M8.t("Video yuklab olindi."));}
    rec=null;cpUI();
  };
  fr.readAsDataURL(blob);
}
$("#cp-rec").addEventListener("click",()=>{
  if(!T3||rec)return;const cv=T3.renderer.domElement;
  if(!cv.captureStream||!window.MediaRecorder){toast(M8.t("Bu telefonda video yozib bo'lmaydi."));return;}
  const mt=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm","video/mp4"].find(x=>MediaRecorder.isTypeSupported(x));
  try{rec=new MediaRecorder(cv.captureStream(30),mt?{mimeType:mt,videoBitsPerSecond:6000000}:{});}catch(e){rec=null;toast(M8.t("Bu telefonda video yozib bo'lmaydi."));return;}
  chunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  const r0=rec;rec.onstop=()=>{clearTimeout(recTimer);toast(M8.t("Video saqlanmoqda..."));saveVideo(new Blob(chunks,{type:mt||"video/webm"}),mt);};
  rec.start(500);toast(M8.t("Video yozilmoqda..."));cpUI();
  playPath(()=>{try{r0.stop();}catch(e){}});
  recTimer=setTimeout(()=>{if(PL)stopPath();else try{r0.stop();}catch(e){}},PL.dur+3000);
});
mtUI();cpUI();
M8.reg("view3d",()=>{if(T3&&sunKey()!==lastKey)redo();});
ui();
})();
