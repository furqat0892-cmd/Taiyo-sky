/* v10.0: Yuklama tahlili (shamol, qor) va tayanch reaksiyalari.
   Yadro: oldindan tortilgan membrananing 3 o'lchamli dinamik relaksatsiyasi (CST, to'liq Lagrange).
   Taxminiy: bir tekis oldindan taranglik, chegara qotirilgan, kichik siljish. */
(function(){
"use strict";
const $=(s,r)=>(r||document).querySelector(s);
const H=()=>window.MH;
const tr=t=>{try{return H().tr(t);}catch(e){return t;}};

/* ---------------- 1. Yadro ---------------- */
function prep(g,o){
  const p=g.pos,ix=g.idx,nv=p.length/3,nt=ix.length/3;
  const ec=new Map();
  for(let t=0;t<nt;t++){const a=ix[t*3],b=ix[t*3+1],c=ix[t*3+2];
    [[a,b],[b,c],[c,a]].forEach(e=>{const k=e[0]<e[1]?e[0]+"_"+e[1]:e[1]+"_"+e[0];ec.set(k,(ec.get(k)||0)+1);});}
  const fixed=new Uint8Array(nv);
  ec.forEach((n,k)=>{if(n===1){const q=k.split("_");fixed[+q[0]]=1;fixed[+q[1]]=1;}});
  (g.sup||[]).forEach(s=>{let bi=-1,bd=0.6*0.6;
    for(let i=0;i<nv;i++){const dx=p[i*3]-s.x,dy=p[i*3+1]-s.top,dz=p[i*3+2]-s.z,d=dx*dx+dy*dy+dz*dz;if(d<bd){bd=d;bi=i;}}
    if(bi>=0)fixed[bi]=1;});
  /* uchburchak etalonlari */
  const T=[];
  for(let t=0;t<nt;t++){
    const a=ix[t*3],b=ix[t*3+1],c=ix[t*3+2];
    const d1=[p[b*3]-p[a*3],p[b*3+1]-p[a*3+1],p[b*3+2]-p[a*3+2]],d2=[p[c*3]-p[a*3],p[c*3+1]-p[a*3+1],p[c*3+2]-p[a*3+2]];
    const l1=Math.hypot(d1[0],d1[1],d1[2]);if(l1<1e-9)continue;
    const ux=d1[0]/l1,uy=d1[1]/l1,uz=d1[2]/l1;
    const cx=d2[0]*ux+d2[1]*uy+d2[2]*uz;
    const rx=d2[0]-cx*ux,ry=d2[1]-cx*uy,rz=d2[2]-cx*uz,dd=Math.hypot(rx,ry,rz);
    if(dd<1e-9)continue;
    const A0=0.5*l1*dd;if(A0<1e-9)continue;
    /* Dm = [[l1,cx],[0,dd]] */
    T.push({a:a,b:b,c:c,l1:l1,cx:cx,dd:dd,A0:A0});
  }
  return {nv:nv,nt:T.length,T:T,fixed:fixed};
}
/* ichki kuch: out ga yoziladi; K (massa uchun) ixtiyoriy */
function fint(P,x,S0,Et,out,Kn,sig){
  out.fill(0);if(Kn)Kn.fill(0);
  const T=P.T;
  for(let q=0;q<T.length;q++){
    const t=T[q],a=t.a*3,b=t.b*3,c=t.c*3;
    const d1x=x[b]-x[a],d1y=x[b+1]-x[a+1],d1z=x[b+2]-x[a+2],d2x=x[c]-x[a],d2y=x[c+1]-x[a+1],d2z=x[c+2]-x[a+2];
    const ia=1/t.l1,ic=-t.cx/(t.l1*t.dd),id=1/t.dd;
    const fux=d1x*ia,fuy=d1y*ia,fuz=d1z*ia;
    const fvx=d1x*ic+d2x*id,fvy=d1y*ic+d2y*id,fvz=d1z*ic+d2z*id;
    const C00=fux*fux+fuy*fuy+fuz*fuz,C01=fux*fvx+fuy*fvy+fuz*fvz,C11=fvx*fvx+fvy*fvy+fvz*fvz;
    const s0=S0[q],S00=s0+Et*0.5*(C00-1),S01=Et*0.5*C01,S11=s0+Et*0.5*(C11-1);
    if(sig){sig[q*3]=S00;sig[q*3+1]=S11;sig[q*3+2]=S01;}
    /* P = F S */
    const pux=fux*S00+fvx*S01,puy=fuy*S00+fvy*S01,puz=fuz*S00+fvz*S01;
    const pvx=fux*S01+fvx*S11,pvy=fuy*S01+fvy*S11,pvz=fuz*S01+fvz*S11;
    /* ∇N1=(1/l1,-cx/(l1 dd)), ∇N2=(0,1/dd), ∇N0=-(∇N1+∇N2) */
    const g1u=ia,g1v=ic,g2u=0,g2v=id,g0u=-(g1u+g2u),g0v=-(g1v+g2v),A=t.A0;
    out[a]-=A*(pux*g0u+pvx*g0v);out[a+1]-=A*(puy*g0u+pvy*g0v);out[a+2]-=A*(puz*g0u+pvz*g0v);
    out[b]-=A*(pux*g1u+pvx*g1v);out[b+1]-=A*(puy*g1u+pvy*g1v);out[b+2]-=A*(puz*g1u+pvz*g1v);
    out[c]-=A*(pux*g2u+pvx*g2v);out[c+1]-=A*(puy*g2u+pvy*g2v);out[c+2]-=A*(puz*g2u+pvz*g2v);
    if(Kn){
      /* qirra uzunliklari kvadrati (etalon) */
      const ea=(t.l1-t.cx)*(t.l1-t.cx)+t.dd*t.dd,eb=t.cx*t.cx+t.dd*t.dd,ec2=t.l1*t.l1;
      const kk=(S0[q]+Et)/(4*A);
      Kn[t.a]+=kk*ea;Kn[t.b]+=kk*eb;Kn[t.c]+=kk*ec2;
    }
  }
}
/* tashqi yuk: shamol bosimi pw (kN/m², sirtga qarab +), qor sk (kN/m² reja), o'z og'irligi wt (kN/m²) */
function extLoad(g,P,o){
  const p=g.pos,ix=g.idx,nv=P.nv,f=new Float64Array(nv*3);let tot=[0,0,0];
  for(let t=0;t<ix.length/3;t++){
    const a=ix[t*3],b=ix[t*3+1],c=ix[t*3+2];
    const ux=p[b*3]-p[a*3],uy=p[b*3+1]-p[a*3+1],uz=p[b*3+2]-p[a*3+2],vx=p[c*3]-p[a*3],vy=p[c*3+1]-p[a*3+1],vz=p[c*3+2]-p[a*3+2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const A2=Math.hypot(nx,ny,nz);if(A2<1e-12)continue;
    const A=A2/2;nx/=A2;ny/=A2;nz/=A2;if(ny<0){nx=-nx;ny=-ny;nz=-nz;}
    const Fx=-o.pw*A*nx,Fy=-o.pw*A*ny-o.sk*A*ny-o.wt*A,Fz=-o.pw*A*nz;
    [a,b,c].forEach(i=>{f[i*3]+=Fx/3;f[i*3+1]+=Fy/3;f[i*3+2]+=Fz/3;});
    tot[0]+=Fx;tot[1]+=Fy;tot[2]+=Fz;
  }
  return {f:f,tot:tot};
}
/* shakl muvozanatda bo'lishi uchun har bir uchburchakdagi oldindan tarangliklarni topish (force-density usuli) */
function fitPrestress(P,x0,s0,lam){
  const T=P.T,nt=T.length,G=new Float64Array(nt*9),sg=new Float64Array(nt).fill(s0),lo=0.08*s0,hi=6*s0;
  const one=new Float64Array(nt).fill(1);
  /* G: sigma=1 uchun tugun kuchlari */
  const tmp=new Float64Array(P.nv*3);
  for(let q=0;q<nt;q++){
    const t=T[q],a=t.a*3,b=t.b*3,c=t.c*3;
    const d1x=x0[b]-x0[a],d1y=x0[b+1]-x0[a+1],d1z=x0[b+2]-x0[a+2],d2x=x0[c]-x0[a],d2y=x0[c+1]-x0[a+1],d2z=x0[c+2]-x0[a+2];
    const ia=1/t.l1,ic=-t.cx/(t.l1*t.dd),id=1/t.dd;
    const fux=d1x*ia,fuy=d1y*ia,fuz=d1z*ia,fvx=d1x*ic+d2x*id,fvy=d1y*ic+d2y*id,fvz=d1z*ic+d2z*id;
    const g1u=ia,g1v=ic,g2u=0,g2v=id,g0u=-(g1u+g2u),g0v=-(g1v+g2v),A=t.A0;
    const gg=[[g0u,g0v],[g1u,g1v],[g2u,g2v]];
    for(let k=0;k<3;k++){G[q*9+k*3]=-A*(fux*gg[k][0]+fvx*gg[k][1]);G[q*9+k*3+1]=-A*(fuy*gg[k][0]+fvy*gg[k][1]);G[q*9+k*3+2]=-A*(fuz*gg[k][0]+fvz*gg[k][1]);}
  }
  const r=new Float64Array(P.nv*3),rd=new Float64Array(P.nv*3),gr=new Float64Array(nt);
  const idx=q=>[T[q].a,T[q].b,T[q].c];
  function resid(v,out,sub){out.fill(0);for(let q=0;q<nt;q++){const I=idx(q);for(let k=0;k<3;k++){const i=I[k];if(P.fixed[i])continue;out[i*3]+=v[q]*G[q*9+k*3];out[i*3+1]+=v[q]*G[q*9+k*3+1];out[i*3+2]+=v[q]*G[q*9+k*3+2];}}}
  for(let it=0;it<260;it++){
    resid(sg,r);
    for(let q=0;q<nt;q++){const I=idx(q);let gq=lam*(sg[q]-s0);for(let k=0;k<3;k++){const i=I[k];if(P.fixed[i])continue;gq+=G[q*9+k*3]*r[i*3]+G[q*9+k*3+1]*r[i*3+1]+G[q*9+k*3+2]*r[i*3+2];}gr[q]=gq;}
    /* chegaradagi qiymatlarda gradient pastga bo'lsa, proyeksiya */
    for(let q=0;q<nt;q++){if((sg[q]<=lo*1.0001&&gr[q]>0)||(sg[q]>=hi*0.9999&&gr[q]<0))gr[q]=0;}
    resid(gr,rd);let num=0,den=0;
    for(let q=0;q<nt;q++){num+=gr[q]*gr[q];den+=lam*gr[q]*gr[q];}
    for(let i=0;i<rd.length;i++)den+=rd[i]*rd[i];
    if(den<1e-18||num<1e-14)break;
    const al=num/den;
    for(let q=0;q<nt;q++){let v=sg[q]-al*gr[q];sg[q]=v<lo?lo:v>hi?hi:v;}
  }
  resid(sg,r);let rm=0;for(let i=0;i<r.length;i++)rm=Math.max(rm,Math.abs(r[i]));
  let pin=0,at=0,atot=0;for(let q=0;q<nt;q++){atot+=T[q].A0;if(sg[q]<=lo*1.05){pin+=T[q].A0;}}
  return {sg:sg,resMax:rm,pinned:atot?pin/atot*100:0};
}
function createSolver(g,o){
  const P=prep(g,o),nv=P.nv,x0=Float64Array.from(g.pos),x=Float64Array.from(g.pos);
  const s0=o.s0,Et=o.Et;
  const fp=fitPrestress(P,x0,s0,0.01),S0=fp.sg;
  const f0=new Float64Array(nv*3),fi=new Float64Array(nv*3),Kn=new Float64Array(nv);
  fint(P,x0,S0,Et,f0,Kn,null);
  const L=extLoad(g,P,o),fe=L.f;
  const m=new Float64Array(nv);for(let i=0;i<nv;i++)m[i]=Math.max(1e-3,Kn[i]*2.4);
  const v=new Float64Array(nv*3);let Ep=0,it=0,res=1e9;
  const maxL=Math.max(1e-6,...Array.from(fe).map(Math.abs).slice(0,5000));
  const tol=Math.max(1e-6,maxL*2e-4);
  function step(n){
    for(let k=0;k<n;k++){
      fint(P,x,S0,Et,fi,null,null);
      let E=0;res=0;
      for(let i=0;i<nv;i++){
        if(P.fixed[i])continue;
        const im=1/m[i];
        for(let d=0;d<3;d++){const j=i*3+d,r=fi[j]-f0[j]+fe[j];v[j]+=r*im;E+=m[i]*v[j]*v[j];const ar=Math.abs(r);if(ar>res)res=ar;}
      }
      if(E<Ep){v.fill(0);Ep=0;}
      else{Ep=E;for(let i=0;i<nv;i++){if(P.fixed[i])continue;x[i*3]+=v[i*3];x[i*3+1]+=v[i*3+1];x[i*3+2]+=v[i*3+2];}}
      it++;
      if(it>30&&res<tol)return true;
    }
    return it>=o.maxIt;
  }
  function finish(){
    const nt=P.nt,sig=new Float64Array(nt*3);
    fint(P,x,S0,Et,fi,null,sig);
    const nvv=nv,disp=new Float64Array(nvv),smax=new Float64Array(nvv),smin=new Float64Array(nvv),w=new Float64Array(nvv);
    let dmax=0,di=0;
    for(let i=0;i<nvv;i++){const d=Math.hypot(x[i*3]-x0[i*3],x[i*3+1]-x0[i*3+1],x[i*3+2]-x0[i*3+2]);disp[i]=d;if(d>dmax){dmax=d;di=i;}}
    let area=0,aSlack=0,aWr=0,smaxAll=0;
    for(let q=0;q<nt;q++){
      const t=P.T[q],a=sig[q*3],b=sig[q*3+1],c=sig[q*3+2],mid=(a+b)/2,rr=Math.hypot((a-b)/2,c),s1=mid+rr,s2=mid-rr;
      area+=t.A0;if(s2<0.1*s0)aSlack+=t.A0;if(s2<=0)aWr+=t.A0;if(s1>smaxAll)smaxAll=s1;
      [t.a,t.b,t.c].forEach(i=>{smax[i]+=s1*t.A0;smin[i]+=s2*t.A0;w[i]+=t.A0;});
    }
    for(let i=0;i<nvv;i++){if(w[i]){smax[i]/=w[i];smin[i]/=w[i];}}
    /* reaksiyalar: tayanchga tushadigan kuch Q = f_int + f_ext (qotirilgan tugunlarda) */
    const sups=(g.sup||[]).map(s=>({x:s.x,z:s.z,top:s.top,k:s.k,Q:[0,0,0],dQ:[0,0,0],n:0}));
    const glob={Q:[0,0,0],dQ:[0,0,0],M:[0,0,0]};
    for(let i=0;i<nvv;i++){
      if(!P.fixed[i])continue;
      const Q=[fi[i*3]+fe[i*3],fi[i*3+1]+fe[i*3+1],fi[i*3+2]+fe[i*3+2]],dQ=[Q[0]-f0[i*3],Q[1]-f0[i*3+1],Q[2]-f0[i*3+2]];
      /* eng yaqin tayanch (reja bo'yicha) */
      let bs=-1,bd=1e18;for(let s=0;s<sups.length;s++){const dx=x0[i*3]-sups[s].x,dz=x0[i*3+2]-sups[s].z,d=dx*dx+dz*dz;if(d<bd){bd=d;bs=s;}}
      if(bs>=0){for(let d=0;d<3;d++){sups[bs].Q[d]+=Q[d];sups[bs].dQ[d]+=dQ[d];}sups[bs].n++;}
      for(let d=0;d<3;d++){glob.Q[d]+=Q[d];glob.dQ[d]+=dQ[d];}
      const rx=x0[i*3],ry=x0[i*3+1],rz=x0[i*3+2];
      glob.M[0]+=ry*dQ[2]-rz*dQ[1];glob.M[1]+=rz*dQ[0]-rx*dQ[2];glob.M[2]+=rx*dQ[1]-ry*dQ[0];
    }
    const bal=Math.hypot(glob.dQ[0]-L.tot[0]*0,0,0);
    const lt=Math.hypot(L.tot[0],L.tot[1],L.tot[2])||1,err=Math.hypot(glob.dQ[0]-L.tot[0],glob.dQ[1]-L.tot[1],glob.dQ[2]-L.tot[2])/lt*100;
    return {x:x,x0:x0,disp:disp,smax:smax,smin:smin,dmax:dmax,dpos:[x0[di*3],x0[di*3+1],x0[di*3+2]],area:area,
      slack:area?aSlack/area*100:0,wrinkle:area?aWr/area*100:0,smaxAll:smaxAll,s0:s0,sups:sups,glob:glob,load:L.tot,balErr:err,prePin:fp.pinned,preRes:fp.resMax,iters:it,res:res,tol:tol,converged:res<tol*3,fixed:P.fixed};
  }
  return {step:step,finish:finish,P:P};
}

/* ---------------- 2. Rang xaritasi (Taiyo Sky: dengiz to'lqini → quyosh) ---------------- */
const STOPS=[[0.04,0.18,0.23],[0.05,0.44,0.52],[0.56,0.83,0.78],[0.96,0.66,0.24],[0.89,0.34,0.18]];
function cmap(t){t=Math.max(0,Math.min(1,t));const n=STOPS.length-1,k=Math.min(n-1,Math.floor(t*n)),u=t*n-k,a=STOPS[k],b=STOPS[k+1];
  return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];}
const cssGrad="linear-gradient(90deg,#0B2F3A,#0E6F85,#8FD3C8,#F4A93D,#E4572E)";

/* ---------------- 3. Interfeys ---------------- */
const st={res:null,sig:"",map:"disp",show:true,scale:20,cs:"wind_p",busy:false};
function sigOf(g){const p=g.pos,n=p.length;let s=n+":";for(let i=0;i<n;i+=Math.max(3,Math.floor(n/37)*3))s+=p[i].toFixed(2)+","+p[i+1].toFixed(2)+",";return s;}
function caseParams(cs,R,S,T){
  const q=(R.chk&&R.chk.q)||0.6,sk=S.sk||0,wt=(T.weight||1.2)*0.00981;
  if(cs==="wind_p")return {pw:0.8*q,sk:0,wt:wt,name:"Shamol bosimi"};
  if(cs==="wind_s")return {pw:-0.9*q,sk:0,wt:wt,name:"Shamol so'rishi"};
  if(cs==="snow")return {pw:0,sk:sk,wt:wt,name:"Qor"};
  return {pw:0.8*q,sk:sk,wt:wt,name:"Qor + shamol bosimi"};
}
const HTML=`<h3>Yuklama tahlili</h3>
<p class="hint">Membrana oldindan tortilgan holatdan shamol yoki qor ostida qanchalik siljishini, qayerda taranglik yetmay qolishini va tayanchlarga qancha kuch tushishini hisoblaydi. Taxminiy: bir tekis taranglik, chekkalar qotirilgan, kichik siljish. Qaror qabul qilishdan oldin muhandis hisobi bilan tasdiqlang.</p>
<div class="seg" id="ld-cs"><button type="button" data-c="wind_p" aria-pressed="true">Shamol bosimi</button><button type="button" data-c="wind_s" aria-pressed="false">Shamol so'rishi</button><button type="button" data-c="snow" aria-pressed="false">Qor</button><button type="button" data-c="mix" aria-pressed="false">Qor + shamol</button></div>
<div class="fld"><label for="ld-s0"><span>Oldindan taranglik (kN/m)</span> <em id="ld-s0-v"></em></label><input type="range" id="ld-s0" min="0.5" max="12" step="0.1" style="width:100%;accent-color:var(--accent)"></div>
<div class="vrow"><button type="button" class="plain prim" id="ld-go">Hisoblash</button></div>
<div class="note" id="ld-note" hidden></div>
<div id="ld-out" hidden>
 <div class="kv" id="ld-kv"></div>
 <h3 style="margin-top:14px">3D da ko'rsatish</h3>
 <div class="seg" id="ld-map"><button type="button" data-m="disp" aria-pressed="true">Siljish</button><button type="button" data-m="smax" aria-pressed="false">Taranglik</button><button type="button" data-m="smin" aria-pressed="false">Bo'shashish</button><button type="button" data-m="off" aria-pressed="false">Oddiy</button></div>
 <label class="ffl" style="display:flex;align-items:center;gap:8px;margin:8px 0"><input type="checkbox" id="ld-def" checked style="width:20px;height:20px;accent-color:var(--accent)"> <span>Siljigan shaklni ko'rsatish</span></label>
 <div class="fld"><label for="ld-sc"><span>Siljishni kattalashtirish</span> <em id="ld-sc-v"></em></label><input type="range" id="ld-sc" min="1" max="100" step="1" style="width:100%;accent-color:var(--accent)"></div>
 <div id="ld-leg" style="margin:8px 0"></div>
 <h3 style="margin-top:14px">Tayanch reaksiyalari</h3>
 <div class="tw"><table class="vt" id="ld-tbl"></table></div>
 <div class="hint" id="ld-hint"></div>
</div>`;
function fmt(v,d){const f=H().fmt1;return f?f(v,d):v.toFixed(d);}
function kv(items){return items.map(i=>"<div><b"+(i[2]?' class="'+i[2]+'"':"")+">"+i[1]+"</b><span>"+tr(i[0])+"</span></div>").join("");}
function legend(r){
  const mp=st.map;if(mp==="off")return "";
  let lo,hi,unit;
  if(mp==="disp"){lo=0;hi=r.dmax*1000;unit="mm";}else if(mp==="smax"){lo=0;hi=r.smaxAll;unit="kN/m";}else{lo=Math.min(0,...Array.from(r.smin));hi=r.s0*1.2;unit="kN/m";}
  return '<div style="height:14px;border-radius:7px;background:'+cssGrad+'"></div><div style="display:flex;justify-content:space-between;font-size:12px;margin-top:3px"><span>'+fmt(lo,mp==="disp"?1:1)+" "+unit+'</span><span>'+fmt(hi,mp==="disp"?1:1)+" "+unit+"</span></div>";
}
function colors(r){
  const nv=r.disp.length,col=new Float32Array(nv*3);
  let lo=0,hi=1,arr;
  if(st.map==="disp"){arr=r.disp;hi=Math.max(1e-6,r.dmax);}
  else if(st.map==="smax"){arr=r.smax;hi=Math.max(1e-6,r.smaxAll);}
  else{arr=r.smin;lo=Math.min(0,...Array.from(arr));hi=r.s0*1.2;}
  for(let i=0;i<nv;i++){const c=cmap((arr[i]-lo)/Math.max(1e-9,hi-lo));col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];}
  return col;
}
function render(){
  const r=st.res;if(!r)return;
  $("#ld-out").hidden=false;
  const mmax=r.dmax*1000;
  const kvs=[["Eng katta siljish",fmt(mmax,0)+" mm"],["Siljish joyi (balandlik)",fmt(r.dpos[1],1)+" m"],
    ["Eng katta taranglik",fmt(r.smaxAll,1)+" kN/m"],["Bo'shashgan maydon (<10%)",fmt(r.slack,1)+"%",r.slack>5?"bad":""],["Ajin bosadigan maydon",fmt(r.wrinkle,1)+"%",r.wrinkle>0.5?"bad":""],
    ["Jami yuk",fmt(Math.hypot(r.load[0],r.load[1],r.load[2]),0)+" kN"]];
  $("#ld-kv").innerHTML=kv(kvs);
  $("#ld-leg").innerHTML=legend(r);
  const rows=r.sups.filter(s=>s.n>0);
  let h="<tr><th>№</th><th>"+tr("Vertikal")+"</th><th>"+tr("Gorizontal")+"</th><th>"+tr("Yukdan")+"</th></tr>";
  rows.forEach((s,i)=>{const Fv=-s.Q[1],Fh=Math.hypot(s.Q[0],s.Q[2]),dv=-s.dQ[1];
    h+="<tr><td>"+(s.k==="main"?"M":"P")+(i+1)+"</td><td>"+fmt(Fv,1)+" kN</td><td>"+fmt(Fh,1)+" kN</td><td>"+(dv>=0?"+":"")+fmt(dv,1)+" kN</td></tr>";});
  const M=Math.hypot(r.glob.M[0],r.glob.M[2]);
  h+="<tr><td><b>"+tr("Jami")+"</b></td><td>"+fmt(-r.glob.Q[1],0)+" kN</td><td>"+fmt(Math.hypot(r.glob.Q[0],r.glob.Q[2]),0)+" kN</td><td>"+fmt(-r.glob.dQ[1],0)+" kN</td></tr>";
  $("#ld-tbl").innerHTML=h;
  $("#ld-hint").textContent=tr("Vertikal: tayanchga pastga tushadigan kuch (manfiy bo'lsa tortib oladi). «Yukdan» ustuni faqat shamol/qor ta'siridagi o'zgarish.")+" "+tr("Poydevordagi ag'darish momenti")+": "+fmt(M,0)+" kN·m. "+tr("Muvozanat xatosi")+": "+fmt(r.balErr,1)+"%."+(r.converged?"":" "+tr("Hisob to'liq yaqinlashmadi: natija taxminiy."));
}
function mesh3(T3){return T3&&T3.group&&T3.group.children.find(o=>o.name==="membrane");}
function post3d(T3,P5,g,T,S,TH){
  const r=st.res;if(!r||sigOf(g)!==st.sig)return;
  const G=T3.group,mesh=mesh3(T3);if(!mesh||!mesh.geometry)return;
  const posA=mesh.geometry.attributes.position;
  if(st.show&&posA&&posA.count===r.disp.length){
    const k=st.scale;
    for(let i=0;i<posA.count;i++){posA.setXYZ(i,r.x0[i*3]+(r.x[i*3]-r.x0[i*3])*k,r.x0[i*3+1]+(r.x[i*3+1]-r.x0[i*3+1])*k,r.x0[i*3+2]+(r.x[i*3+2]-r.x0[i*3+2])*k);}
    posA.needsUpdate=true;mesh.geometry.computeVertexNormals();
  }
  if(st.map!=="off"&&mesh.geometry.attributes.position.count===r.disp.length){
    mesh.geometry.setAttribute("color",new TH.BufferAttribute(colors(r),3));
    const old=mesh.material;mesh.material=new TH.MeshBasicMaterial({vertexColors:true,side:TH.DoubleSide,toneMapped:false});
    if(old&&old.dispose)old.dispose();mesh.castShadow=false;
  }
  /* reaksiya o'qlari */
  const rows=r.sups.filter(s=>s.n>0);let mx=0;rows.forEach(s=>{mx=Math.max(mx,Math.hypot(s.dQ[0],s.dQ[1],s.dQ[2]));});
  const dim=Math.max(S.L||20,S.W||20)*0.3;
  rows.forEach(s=>{
    const f=[s.dQ[0],s.dQ[1],s.dQ[2]],m=Math.hypot(f[0],f[1],f[2]);if(m<1e-6||!mx)return;
    const dir=new TH.Vector3(f[0]/m,f[1]/m,f[2]/m),len=Math.max(1.5,dim*m/mx);
    const ar=new TH.ArrowHelper(dir,new TH.Vector3(s.x,s.top,s.z),len,0xE4572E,Math.min(1.6,len*0.3),Math.min(0.9,len*0.18));
    ar.name="reac";G.add(ar);
  });
}
function run(){
  if(st.busy)return;const Hh=H(),R=Hh.R,S=Hh.S;if(!R||!R.g||!R.g.pos)return;
  const g=R.g,T=S.types[S.mtype]||{},cp=caseParams(st.cs,R,S,T);
  const s0=+($("#ld-s0").value)||T.p0||4,Et=T.ea||1000;
  const note=$("#ld-note");note.hidden=false;note.textContent=tr("Hisoblanmoqda")+" …";
  st.busy=true;$("#ld-go").disabled=true;
  let solver;
  try{solver=createSolver(g,{s0:s0,Et:Et,pw:cp.pw,sk:cp.sk,wt:cp.wt,maxIt:6000});}catch(e){note.textContent=String(e&&e.message||e);st.busy=false;$("#ld-go").disabled=false;return;}
  const t0=Date.now();
  (function loop(){
    let done=false;
    try{done=solver.step(120);}catch(e){note.textContent=String(e&&e.message||e);st.busy=false;$("#ld-go").disabled=false;return;}
    if(!done&&Date.now()-t0<25000){note.textContent=tr("Hisoblanmoqda")+" … "+Math.round((Date.now()-t0)/1000)+" s";setTimeout(loop,0);return;}
    const r=solver.finish();st.res=r;st.sig=sigOf(g);r.caseName=cp.name;
    st.scale=Math.max(1,Math.min(100,Math.round(0.04*Math.max(S.L||20,S.W||20)/Math.max(r.dmax,1e-3))));$("#ld-sc").value=st.scale;$("#ld-sc-v").textContent="×"+st.scale;
    note.textContent=tr(cp.name)+": "+tr("hisob tugadi")+" ("+r.iters+")";
    st.busy=false;$("#ld-go").disabled=false;render();
    try{Hh.refresh();}catch(e){}
  })();
}
function init(){
  const anchor=$("#gal-card")||$("#vr-card")||$("#rl-note");if(!anchor||!H()||$("#ld-card"))return;
  const card=document.createElement("div");card.className="card cardx";card.id="ld-card";card.innerHTML=HTML;
  (anchor.id==="rl-note"?anchor.parentNode:anchor).insertAdjacentElement("afterend",card);
  const T=()=>H().S.types[H().S.mtype]||{};
  const sl=$("#ld-s0");sl.value=T().p0||4;$("#ld-s0-v").textContent=fmt(+sl.value,1)+" kN/m";
  sl.addEventListener("input",()=>{$("#ld-s0-v").textContent=fmt(+sl.value,1)+" kN/m";});
  const sc=$("#ld-sc");sc.value=st.scale;$("#ld-sc-v").textContent="×"+st.scale;
  $("#ld-cs").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.cs=b.dataset.c;Array.from($("#ld-cs").children).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));});
  $("#ld-map").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.map=b.dataset.m;Array.from($("#ld-map").children).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));if(st.res){$("#ld-leg").innerHTML=legend(st.res);try{H().refresh();}catch(x){}}});
  $("#ld-def").addEventListener("change",e=>{st.show=e.target.checked;try{H().refresh();}catch(x){}});
  let dt=0;sc.addEventListener("input",()=>{st.scale=+sc.value;$("#ld-sc-v").textContent="×"+st.scale;clearTimeout(dt);dt=setTimeout(()=>{try{H().refresh();}catch(x){}},120);});
  $("#ld-go").addEventListener("click",run);
  const old=window.MH3_post;window.MH3_post=function(){if(old)old.apply(this,arguments);try{post3d.apply(null,arguments);}catch(e){}};
}
window.addEventListener("load",()=>setTimeout(()=>setTimeout(init,0),50));
window.MH10={createSolver:createSolver,cmap:cmap,st:st,run:run,caseParams:caseParams};
})();
