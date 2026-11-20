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
    if(window.AndroidApp&&window.AndroidApp.httpReq){const id=++httpSeq;httpCB[id]=(s,b)=>res({status:s,text:b});
      try{window.AndroidApp.httpReq(id,method,url,body||"",JSON.stringify(headers||{}));}catch(e){rej(e);}return;}
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
  httpReq("POST",url,body,{"Content-Type":"application/json","x-goog-api-key":M8.st.aiKey}).then(r=>{
    let txt="";
    try{const j=JSON.parse(r.text);
      if(r.status>=400)txt=t("Xato")+" "+r.status+": "+((j.error&&j.error.message)||"").slice(0,160);
      else txt=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts||[]).map(p=>p.text||"").join("")||t("Javob bo'sh keldi.");}
    catch(e){txt=t("Javobni o'qib bo'lmadi.");}
    wait.t=txt;
  }).catch(()=>{wait.t=t("Internetga ulanib bo'lmadi.");}).then(()=>{busy=false;$("#ai-send").disabled=false;M8.saveSt();renderChat();});
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
