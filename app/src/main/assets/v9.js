/* v9.0: Form-finding, xaritalar va bichim naqshi.
   Yadro (relax, analyze, flatten) sof funksiyalar: DOM'ga bog'liq emas.
   Interfeys qismi oxirida, sahifa to'liq yuklangandan keyin ishga tushadi. */
(function(){
"use strict";
const D2R=Math.PI/180;
const DEF={on:true,ratio:1,ang:0,cab:false,cr:15,s:0,pw:1.0,ps:0.6,map:"off",seams:false,rw:0,cmp:2,axis:"auto"};
function params(F){
  if(!F.ff||typeof F.ff!=="object")F.ff={};
  const f=F.ff;for(const k in DEF)if(f[k]===undefined)f[k]=DEF[k];
  return f;
}
/* mesh keshi uchun faqat shaklga ta'sir qiladigan maydonlar */
function ffKey(F){const f=params(F);return [f.on?1:0,f.ratio,f.ang,f.cab?1:0,f.cr].join("|");}

/* ---------------------------------------------------------------
   1. FORM-FINDING: dinamik relaksatsiya (kinetik so'ndirish)
   V: [[x,y,z]] reja x,y; z balandlik. T: uchburchaklar. bnd: chegara belgisi.
   pin: ustun nuqtalari (qotirilgan). n: burchak nuqtalari soni (V ning boshida).
   Mato: bir tekis oldindan taranglik (prestress) sw (arqoq) / sf (ip).
   Faqat z siljiydi (grafik sirt, shakl normal muvozanatdan aniqlanadi);
   erkin chegara arqonida x,y ham siljiydi.
   --------------------------------------------------------------- */
function relax(c){
  const V=c.V,T=c.T,nv=V.length,ff=c.ff,nt=T.length;
  const sw=ff.ratio,sf=1,smax=Math.max(sw,sf);
  const th=ff.ang*D2R,wx=Math.cos(th),wy=Math.sin(th);
  const cable=!!ff.cab,Tc=Math.max(1,ff.cr);          /* arqon kuchi / mato kuchi, metr */
  const x=new Float64Array(nv),y=new Float64Array(nv),z=new Float64Array(nv);
  for(let i=0;i<nv;i++){x[i]=V[i][0];y[i]=V[i][1];z[i]=V[i][2];}
  /* qo'shnilar va chegara zanjiri */
  const NB=V.map(()=>new Set());
  for(const t of T){NB[t[0]].add(t[1]);NB[t[0]].add(t[2]);NB[t[1]].add(t[0]);NB[t[1]].add(t[2]);NB[t[2]].add(t[0]);NB[t[2]].add(t[1]);}
  const chain=new Map();
  c.BE.forEach(k=>{const p=k.split("_").map(Number);(chain.get(p[0])||chain.set(p[0],[]).get(p[0])).push(p[1]);(chain.get(p[1])||chain.set(p[1],[]).get(p[1])).push(p[0]);});
  const mode=new Uint8Array(nv);   /* 0 qotirilgan, 1 faqat z, 2 x,y,z */
  for(let i=0;i<nv;i++){
    if(c.pin.has(i))mode[i]=0;
    else if(c.bnd[i]){mode[i]=(cable&&i>=c.n&&(chain.get(i)||[]).length===2)?2:0;}
    else mode[i]=1;
  }
  const fx=new Float64Array(nv),fy=new Float64Array(nv),fz=new Float64Array(nv),K=new Float64Array(nv);
  const vx=new Float64Array(nv),vy=new Float64Array(nv),vz=new Float64Array(nv),m=new Float64Array(nv);
  let lastRes=0,totIt=0;
  function forces(withK){
    fx.fill(0);fy.fill(0);fz.fill(0);if(withK)K.fill(0);
    for(let q=0;q<nt;q++){
      const t=T[q],a=t[0],b=t[1],d=t[2];
      const ux=x[b]-x[a],uy=y[b]-y[a],uz=z[b]-z[a],px=x[d]-x[a],py=y[d]-y[a],pz=z[d]-z[a];
      let nx=uy*pz-uz*py,ny=uz*px-ux*pz,nz=ux*py-uy*px;
      const A2=Math.sqrt(nx*nx+ny*ny+nz*nz);if(A2<1e-12)continue;
      nx/=A2;ny/=A2;nz/=A2;
      /* arqoq yo'nalishi (reja bo'yicha wx,wy) tekislikka proyeksiya */
      let e1x=wx,e1y=wy,e1z=0;const dp=e1x*nx+e1y*ny;
      e1x-=dp*nx;e1y-=dp*ny;e1z-=dp*nz;
      let l1=Math.sqrt(e1x*e1x+e1y*e1y+e1z*e1z);
      if(l1<1e-6){e1x=-wy;e1y=wx;e1z=0;const d2=e1x*nx+e1y*ny;e1x-=d2*nx;e1y-=d2*ny;e1z-=d2*nz;l1=Math.sqrt(e1x*e1x+e1y*e1y+e1z*e1z)||1;}
      e1x/=l1;e1y/=l1;e1z/=l1;
      const e2x=ny*e1z-nz*e1y,e2y=nz*e1x-nx*e1z,e2z=nx*e1y-ny*e1x;
      const U=[x[a]*e1x+y[a]*e1y+z[a]*e1z,x[b]*e1x+y[b]*e1y+z[b]*e1z,x[d]*e1x+y[d]*e1y+z[d]*e1z];
      const W=[x[a]*e2x+y[a]*e2y+z[a]*e2z,x[b]*e2x+y[b]*e2y+z[b]*e2z,x[d]*e2x+y[d]*e2y+z[d]*e2z];
      const bi=[W[1]-W[2],W[2]-W[0],W[0]-W[1]],ci=[U[2]-U[1],U[0]-U[2],U[1]-U[0]];
      const id=[a,b,d];
      for(let k=0;k<3;k++){
        const s1=-0.5*sw*bi[k],s2=-0.5*sf*ci[k],i=id[k];
        fx[i]+=s1*e1x+s2*e2x;fy[i]+=s1*e1y+s2*e2y;fz[i]+=s1*e1z+s2*e2z;
        if(withK){const o1=id[(k+1)%3],o2=id[(k+2)%3];const ex=x[o1]-x[o2],ey=y[o1]-y[o2],ez=z[o1]-z[o2];K[i]+=smax*(ex*ex+ey*ey+ez*ez)/(2*A2);}
      }
    }
    /* erkin chegara arqoni */
    if(cable){
      for(let i=0;i<nv;i++){
        if(mode[i]!==2)continue;const nb=chain.get(i);let lsum=0;
        for(const j of nb){const dx=x[j]-x[i],dy=y[j]-y[i],dz=z[j]-z[i],l=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-9;fx[i]+=Tc*dx/l;fy[i]+=Tc*dy/l;fz[i]+=Tc*dz/l;lsum+=l;}
        if(withK)K[i]+=2*Tc/Math.max(1e-3,lsum/2);
      }
    }
  }
  function smooth(){
    for(let it=0;it<10;it++)for(let i=0;i<nv;i++){
      if(mode[i]!==1)continue;let sx=0,sy=0,k=0;for(const j of NB[i]){sx+=x[j];sy+=y[j];k++;}
      if(k){x[i]=sx/k;y[i]=sy/k;}
    }
  }
  function dr(maxIt){
    vx.fill(0);vy.fill(0);vz.fill(0);let Ep=0;
    for(let it=0;it<maxIt;it++){
      const wk=(it%30===0);
      forces(wk);
      if(wk)for(let i=0;i<nv;i++)m[i]=Math.max(1e-3,K[i]*(mode[i]===2?1.6:1.05));
      let E=0,res=0;
      for(let i=0;i<nv;i++){
        const md=mode[i];if(md===0)continue;
        const im=1/m[i];
        vz[i]+=fz[i]*im;E+=m[i]*vz[i]*vz[i];res=Math.max(res,Math.abs(fz[i]));
        if(md===2){vx[i]+=fx[i]*im;vy[i]+=fy[i]*im;E+=m[i]*(vx[i]*vx[i]+vy[i]*vy[i]);res=Math.max(res,Math.abs(fx[i]),Math.abs(fy[i]));}
      }
      if(E<Ep){vx.fill(0);vy.fill(0);vz.fill(0);Ep=0;}
      else{
        Ep=E;
        for(let i=0;i<nv;i++){
          const md=mode[i];if(md===0)continue;
          z[i]+=vz[i];if(md===2){x[i]+=vx[i];y[i]+=vy[i];}
        }
      }
      lastRes=res;totIt++;
      if(res<4e-5&&it>10)break;
    }
  }
  const rounds=cable?5:1;
  for(let rd=0;rd<rounds;rd++){
    if(rd>0)smooth();
    dr(rd===rounds-1?900:500);
  }
  if(cable){smooth();dr(500);}
  for(let i=0;i<nv;i++){V[i][0]=x[i];V[i][1]=y[i];V[i][2]=z[i];}
  return {iters:totIt,res:lastRes};
}

/* ---------------------------------------------------------------
   2. TAHLIL: qiyalik, egrilik, yuk zaxirasi (membrana muvozanati p = s*k)
   g.pos: x, y(yuqori), z. Natija: har bir tugun uchun qiymatlar.
   --------------------------------------------------------------- */
function analyze(g,o){
  const p=g.pos,ix=g.idx,nv=p.length/3,nt=ix.length/3;
  const A=new Float64Array(nv),Th=new Float64Array(nv),N=new Float64Array(nv*3),Lc=new Float64Array(nv*3);
  const ec=new Map(),NB=[];for(let i=0;i<nv;i++)NB.push(new Set());
  const cot=(ax,ay,az,bx,by,bz)=>{const cx=ay*bz-az*by,cy=az*bx-ax*bz,cz=ax*by-ay*bx;const cr=Math.sqrt(cx*cx+cy*cy+cz*cz)||1e-12;return (ax*bx+ay*by+az*bz)/cr;};
  let area=0;
  for(let t=0;t<nt;t++){
    const I=[ix[t*3],ix[t*3+1],ix[t*3+2]];
    const P=I.map(i=>[p[i*3],p[i*3+1],p[i*3+2]]);
    const e01=[P[1][0]-P[0][0],P[1][1]-P[0][1],P[1][2]-P[0][2]],e02=[P[2][0]-P[0][0],P[2][1]-P[0][1],P[2][2]-P[0][2]];
    const nx=e01[1]*e02[2]-e01[2]*e02[1],ny=e01[2]*e02[0]-e01[0]*e02[2],nz=e01[0]*e02[1]-e01[1]*e02[0];
    const a2=Math.sqrt(nx*nx+ny*ny+nz*nz);if(a2<1e-12)continue;
    area+=a2/2;
    for(let k=0;k<3;k++){
      const i=I[k],j=I[(k+1)%3],l=I[(k+2)%3];
      const Pj=P[(k+1)%3],Pl=P[(k+2)%3],Pi=P[k];
      const aj=[Pj[0]-Pi[0],Pj[1]-Pi[1],Pj[2]-Pi[2]],al=[Pl[0]-Pi[0],Pl[1]-Pi[1],Pl[2]-Pi[2]];
      /* burchak i nuqtada */
      const dd=aj[0]*al[0]+aj[1]*al[1]+aj[2]*al[2],lj=Math.hypot(aj[0],aj[1],aj[2]),ll=Math.hypot(al[0],al[1],al[2]);
      Th[i]+=Math.acos(Math.max(-1,Math.min(1,dd/(lj*ll||1e-12))));
      A[i]+=a2/6;
      N[i*3]+=nx;N[i*3+1]+=ny;N[i*3+2]+=nz;
      /* kotangens: i nuqtadagi burchak (j,l) qirrasiga qarama-qarshi */
      const c=Math.max(-8,Math.min(8,cot(aj[0],aj[1],aj[2],al[0],al[1],al[2])));
      /* qirra j-l: unga c qo'shiladi (j va l uchun) */
      const ajl=[Pl[0]-Pj[0],Pl[1]-Pj[1],Pl[2]-Pj[2]];
      Lc[j*3]+=c*(Pl[0]-Pj[0]);Lc[j*3+1]+=c*(Pl[1]-Pj[1]);Lc[j*3+2]+=c*(Pl[2]-Pj[2]);
      Lc[l*3]-=c*ajl[0];Lc[l*3+1]-=c*ajl[1];Lc[l*3+2]-=c*ajl[2];
      NB[i].add(j);NB[i].add(l);
      const key=j<l?j+"_"+l:l+"_"+j;ec.set(key,(ec.get(key)||0)+1);
    }
  }
  const bnd=new Uint8Array(nv);
  ec.forEach((v,k)=>{if(v===1){const q=k.split("_");bnd[+q[0]]=1;bnd[+q[1]]=1;}});
  /* normalni yuqoriga qaratish */
  let sy=0;for(let i=0;i<nv;i++)sy+=N[i*3+1];
  const sg=sy<0?-1:1;
  const slope=new Float64Array(nv),Kg=new Float64Array(nv),k1=new Float64Array(nv),k2=new Float64Array(nv);
  for(let i=0;i<nv;i++){
    let nx=N[i*3]*sg,ny=N[i*3+1]*sg,nz=N[i*3+2]*sg;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
    slope[i]=Math.acos(Math.max(0,Math.min(1,ny)))/D2R;
    const Ai=A[i]||1e-9;
    Kg[i]=((bnd[i]?Math.PI:2*Math.PI)-Th[i])/Ai;
    const dX=[Lc[i*3]/(2*Ai),Lc[i*3+1]/(2*Ai),Lc[i*3+2]/(2*Ai)];
    /* Lc har bir qirra uchun kotangens yig'indisini beradi; Laplas-Beltrami: (1/2A) * sum(cot a + cot b)(xj - xi) */
    const Hs=0.5*(dX[0]*nx+dX[1]*ny+dX[2]*nz)*(-1);
    const dis=Math.sqrt(Math.max(0,Hs*Hs-Kg[i]));
    k1[i]=Hs+dis;k2[i]=Hs-dis;
  }
  /* chegarani ichki qo'shnilardan to'ldirish, so'ng silliqlash */
  const sm=(arr)=>{
    for(let i=0;i<nv;i++){if(!bnd[i])continue;let s=0,k=0;NB[i].forEach(j=>{if(!bnd[j]){s+=arr[j];k++;}});if(k)arr[i]=s/k;}
    for(let r=0;r<2;r++){const c=Float64Array.from(arr);for(let i=0;i<nv;i++){let s=c[i],k=1;NB[i].forEach(j=>{s+=c[j];k++;});arr[i]=s/k;}}
  };
  [slope,Kg,k1,k2].forEach(sm);
  const sp=o&&o.s>0?o.s:3,pw=o&&o.pw>0?o.pw:1,ps=o&&o.ps>0?o.ps:0.6;
  const sfDn=new Float64Array(nv),sfUp=new Float64Array(nv);
  for(let i=0;i<nv;i++){
    const up=Math.max(k1[i],k2[i],0),dn=Math.max(-k1[i],-k2[i],0);
    sfDn[i]=sp*up/ps;           /* pastga yuk (qor): botiq (kosa) yo'nalish ko'taradi */
    sfUp[i]=sp*dn/pw;           /* yuqoriga yuk (shamol so'rishi): qubba (arka) yo'nalish ko'taradi */
  }
  /* statistika: maydon bo'yicha ulushlar */
  const fr=(arr,f)=>{let s=0,tot=0;for(let t=0;t<nt;t++){const I=[ix[t*3],ix[t*3+1],ix[t*3+2]];let v=0;for(const i of I)v+=arr[i];v/=3;const ax=p[I[1]*3]-p[I[0]*3],ay=p[I[1]*3+1]-p[I[0]*3+1],az=p[I[1]*3+2]-p[I[0]*3+2],bx=p[I[2]*3]-p[I[0]*3],by=p[I[2]*3+1]-p[I[0]*3+1],bz=p[I[2]*3+2]-p[I[0]*3+2];const a=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)/2;tot+=a;if(f(v))s+=a;}return tot?s/tot*100:0;};
  const stats={
    area,flat:fr(slope,v=>v<10),vflat:fr(slope,v=>v<5),
    snowBad:fr(sfDn,v=>v<1),windBad:fr(sfUp,v=>v<1),
    anti:fr(Kg,v=>v<-1e-4),
    maxSlope:Math.max(...slope),minSlope:Math.min(...slope)
  };
  return {nv,slope,K:Kg,k1,k2,sfDn,sfUp,stats,bnd,NB};
}
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(c1,c2,t)=>[lerp(c1[0],c2[0],t),lerp(c1[1],c2[1],t),lerp(c1[2],c2[2],t)];
const RED=[0.86,0.22,0.2],ORA=[0.95,0.58,0.16],YEL=[0.96,0.84,0.25],GRN=[0.25,0.7,0.4],BLU=[0.2,0.45,0.85],GRY=[0.75,0.77,0.8];
function ramp3(v,lo,mid,hi,a,b,c){ /* v lo..mid..hi */
  if(v<=mid)return mix(a,b,Math.max(0,Math.min(1,(v-lo)/(mid-lo))));
  return mix(b,c,Math.max(0,Math.min(1,(v-mid)/(hi-mid))));
}
function colorOf(map,an,i,sc){
  switch(map){
    case "slope":{const v=an.slope[i];return v<5?RED:v<10?ORA:v<20?YEL:GRN;}
    case "curv":{const v=an.K[i]/(sc||1);return v<0?mix(GRY,BLU,Math.min(1,-v)):mix(GRY,ORA,Math.min(1,v));}
    case "snow":return ramp3(an.sfDn[i],0,1,2.5,RED,YEL,GRN);
    case "wind":return ramp3(an.sfUp[i],0,1,2.5,RED,YEL,GRN);
    case "dist":{const v=(an.dist?an.dist[i]:0)/(sc||1);return v<0?mix(GRY,BLU,Math.min(1,-v)):mix(GRY,RED,Math.min(1,v));}
  }
  return GRY;
}
function curvScale(an){const a=Array.from(an.K).map(Math.abs).sort((x,y)=>x-y);return a[Math.floor(a.length*0.95)]||1e-3;}

/* ---------------------------------------------------------------
   3. BICHIM NAQSHI: tasmalarga bo'lish va tekislikka yoyish
   --------------------------------------------------------------- */
function flatten(g,o){
  const p=g.pos,ix=g.idx,nt=ix.length/3,nv=p.length/3;
  let mnx=1e18,mxx=-1e18,mnz=1e18,mxz=-1e18;
  for(let i=0;i<nv;i++){mnx=Math.min(mnx,p[i*3]);mxx=Math.max(mxx,p[i*3]);mnz=Math.min(mnz,p[i*3+2]);mxz=Math.max(mxz,p[i*3+2]);}
  const ex=mxx-mnx,ez=mxz-mnz;
  const axis=o.axis==="x"||o.axis==="z"?o.axis:(ex<ez?"x":"z");     /* tasmalar shu koordinata bo'yicha kesiladi */
  const c0=axis==="x"?mnx:mnz,ext=axis==="x"?ex:ez,rw=o.rw>0?o.rw:2.5;
  const N0=Math.max(1,Math.ceil(ext/(rw*0.9)));let N=N0,res=null;
  for(let tries=0;tries<5;tries++){
    res=build(N);
    if(res.maxW<=rw*0.995||N>=N0*2+2)break;
    N=Math.min(N0*2+2,Math.max(N+1,Math.ceil(N*res.maxW/(rw*0.97))));
  }
  return res;

  function build(N){
    const sp=splitMesh(g.pos,g.idx,axis==="x"?0:2,c0,ext,N);
    const p=sp.pos,ix=sp.idx,nt=ix.length/3,nv=p.length/3,nv0=g.pos.length/3,co=axis==="x"?0:2,step=ext/N;
    const band=new Int32Array(nt);
    for(let t=0;t<nt;t++){const cc=(p[ix[t*3]*3+co]+p[ix[t*3+1]*3+co]+p[ix[t*3+2]*3+co])/3;band[t]=Math.min(N-1,Math.max(0,Math.floor((cc-c0-0.0137)/step)));}
    /* qirra -> uchburchaklar */
    const em=new Map();
    for(let t=0;t<nt;t++)for(let k=0;k<3;k++){const a=ix[t*3+k],b=ix[t*3+(k+1)%3];const key=a<b?a+"_"+b:b+"_"+a;(em.get(key)||em.set(key,[]).get(key)).push(t);}
    /* komponentlar */
    const comp=new Int32Array(nt).fill(-1);let nc=0;const tri2=[];
    for(let t=0;t<nt;t++){
      if(comp[t]>=0)continue;
      const st=[t],list=[];comp[t]=nc;
      while(st.length){
        const u=st.pop();list.push(u);
        for(let k=0;k<3;k++){const a=ix[u*3+k],b=ix[u*3+(k+1)%3];const key=a<b?a+"_"+b:b+"_"+a;
          for(const w of em.get(key)){if(comp[w]<0&&band[w]===band[u]){comp[w]=nc;st.push(w);}}}
      }
      tri2.push(list);nc++;
    }
    const panels=[];let maxW=0,tot=0,strainSum=0,strainN=0,nflag=0;
    const vstrain=new Float64Array(nv),vcnt=new Float64Array(nv);
    tri2.forEach((list,ci)=>{
      if(list.length<2)return;
      const vm=new Map(),vl=[];
      const lv=i=>{let r=vm.get(i);if(r===undefined){r=vl.length;vm.set(i,r);vl.push(i);}return r;};
      const T=list.map(t=>[lv(ix[t*3]),lv(ix[t*3+1]),lv(ix[t*3+2])]);
      const n=vl.length,u=new Float64Array(n),v=new Float64Array(n);
      for(let i=0;i<n;i++){u[i]=p[vl[i]*3];v[i]=p[vl[i]*3+2];}
      const ed=new Map();
      for(const t of T)for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3];const key=a<b?a+"_"+b:b+"_"+a;if(!ed.has(key)){const A=vl[a],B=vl[b];ed.set(key,[a,b,Math.hypot(p[A*3]-p[B*3],p[A*3+1]-p[B*3+1],p[A*3+2]-p[B*3+2])]);}}
      const E=Array.from(ed.values());
      for(let it=0;it<1400;it++){
        let md=0;
        for(const e of E){
          const a=e[0],b=e[1],dx=u[b]-u[a],dy=v[b]-v[a],d=Math.hypot(dx,dy)||1e-9,df=(d-e[2])/d*0.5;
          u[a]+=dx*df;v[a]+=dy*df;u[b]-=dx*df;v[b]-=dy*df;md=Math.max(md,Math.abs(d-e[2]));
        }
        if(md<2e-4)break;
      }
      /* deformatsiya (qirra bo'yicha o'rtacha) */
      const st=new Float64Array(n),sc=new Float64Array(n);
      let pmax=0;for(const e of E){const d=Math.hypot(u[e[1]]-u[e[0]],v[e[1]]-v[e[0]]),s=(d-e[2])/e[2];st[e[0]]+=s;st[e[1]]+=s;sc[e[0]]++;sc[e[1]]++;strainSum+=Math.abs(s);strainN++;if(e[2]>0.25)pmax=Math.max(pmax,Math.abs(s));}
      for(let i=0;i<n;i++)if(sc[i]){vstrain[vl[i]]+=st[i]/sc[i];vcnt[vl[i]]++;}
      /* bosh o'q bo'yicha burish */
      let mu=0,mv=0;for(let i=0;i<n;i++){mu+=u[i];mv+=v[i];}mu/=n;mv/=n;
      let sxx=0,syy=0,sxy=0;for(let i=0;i<n;i++){const a=u[i]-mu,b=v[i]-mv;sxx+=a*a;syy+=b*b;sxy+=a*b;}
      const ang=0.5*Math.atan2(2*sxy,sxx-syy),ca=Math.cos(-ang),sa=Math.sin(-ang);
      let u0=1e18,u1=-1e18,v0=1e18,v1=-1e18;
      const k=1-(o.cmp||0)/100;
      for(let i=0;i<n;i++){const a=u[i]-mu,b=v[i]-mv;u[i]=(a*ca-b*sa)*k;v[i]=(a*sa+b*ca)*k;u0=Math.min(u0,u[i]);u1=Math.max(u1,u[i]);v0=Math.min(v0,v[i]);v1=Math.max(v1,v[i]);}
      for(let i=0;i<n;i++){u[i]-=u0;v[i]-=v0;}
      const len=u1-u0,wid=v1-v0;
      /* kontur: bir marta uchraydigan qirralar */
      const cnt=new Map();
      for(const t of T)for(let q=0;q<3;q++){const a=t[q],b=t[(q+1)%3];const key=a<b?a+"_"+b:b+"_"+a;cnt.set(key,(cnt.get(key)||0)+1);}
      const adj=new Map();
      cnt.forEach((c,key)=>{if(c===1){const q=key.split("_").map(Number);(adj.get(q[0])||adj.set(q[0],[]).get(q[0])).push(q[1]);(adj.get(q[1])||adj.set(q[1],[]).get(q[1])).push(q[0]);}});
      const used=new Set(),loops=[];
      adj.forEach((_,s)=>{
        if(used.has(s))return;const lp=[s];used.add(s);let prev=-1,cur=s;
        for(let g2=0;g2<n+2;g2++){const nb=adj.get(cur)||[];let nx=nb.find(w=>w!==prev&&!used.has(w));if(nx===undefined)break;lp.push(nx);used.add(nx);prev=cur;cur=nx;}
        if(lp.length>2)loops.push(lp);
      });
      const la=lp=>{let a=0;for(let i=0;i<lp.length;i++){const q=lp[(i+1)%lp.length];a+=u[lp[i]]*v[q]-u[q]*v[lp[i]];}return a/2;};
      loops.sort((a,b)=>Math.abs(la(b))-Math.abs(la(a)));
      const outline=(loops[0]||[]).map(i=>[u[i],v[i]]);
      let ar=0;for(const t of T){const a=t[0],b=t[1],c=t[2];ar+=Math.abs((u[b]-u[a])*(v[c]-v[a])-(u[c]-u[a])*(v[b]-v[a]))/2;}
      const w=Math.min(len,wid),flag=pmax>0.04;if(!flag)maxW=Math.max(maxW,w);else nflag++;tot+=ar;
      panels.push({id:0,band:band[list[0]],outline:dpSimplify(outline,0.004),len:Math.max(len,wid),wid:w,area:ar,tri:list.length,ox:0,oy:0,swap:wid>len,smax:pmax,flag});
    });
    panels.sort((a,b)=>a.band-b.band);
    panels.forEach((q,i)=>{q.id=i+1;});
    for(let i=0;i<nv;i++)vstrain[i]=vcnt[i]?vstrain[i]/vcnt[i]:0;
    /* tikuv chiziqlari (3D): turli panelga tegishli qo'shni uchburchaklar orasidagi qirralar */
    const seams=[];
    em.forEach((ts,key)=>{if(ts.length===2&&comp[ts[0]]!==comp[ts[1]]){const q=key.split("_").map(Number),a=q[0],b=q[1];seams.push(p[a*3],p[a*3+1],p[a*3+2],p[b*3],p[b*3+1],p[b*3+2]);}});
    /* joylashtirish: qatorlar bo'yicha */
    const rowW=Math.max(8,rw*4);let cx=0,cy=0,rh=0;
    panels.forEach(q=>{
      let L=q.len,W=q.wid;
      if(cx>0&&cx+L>rowW){cx=0;cy+=rh+0.25;rh=0;}
      q.ox=cx;q.oy=cy;cx+=L+0.25;rh=Math.max(rh,W);
    });
    const totalH=cy+rh,totalW=panels.reduce((m,q)=>Math.max(m,q.ox+q.len),0);
    return {axis,N,panels,maxW,area:tot,seams,vstrain:vstrain.subarray(0,nv0),w:totalW,h:totalH,strain:strainN?strainSum/strainN:0,rw,cmp:o.cmp||0,nflag};
  }
}
function splitMesh(pos0,idx0,co,c0,ext,N){
  let pos=Array.from(pos0),ix=Array.from(idx0);const step=ext/N,OFF=0.0137;
  for(let k=1;k<N;k++){
    const pl=c0+k*step+OFF,cache=new Map(),out=[];
    const val=i=>pos[i*3+co]-pl;
    const mid=(a,b)=>{const key=a<b?a+"_"+b:b+"_"+a;let m=cache.get(key);if(m===undefined){const da=val(a),db=val(b),t=da/(da-db);m=pos.length/3;for(let c=0;c<3;c++)pos.push(pos[a*3+c]+(pos[b*3+c]-pos[a*3+c])*t);cache.set(key,m);}return m;};
    for(let t=0;t<ix.length;t+=3){
      const a=ix[t],b=ix[t+1],c=ix[t+2],sa=val(a)>0,sb=val(b)>0,sc=val(c)>0;
      if(sa===sb&&sb===sc){out.push(a,b,c);continue;}
      let v,u,w;
      if(sa!==sb&&sa!==sc){v=a;u=b;w=c;}else if(sb!==sa&&sb!==sc){v=b;u=c;w=a;}else{v=c;u=a;w=b;}
      const m1=mid(v,u),m2=mid(w,v);
      out.push(v,m1,m2,m1,u,w,m1,w,m2);
    }
    ix=out;
  }
  return {pos,idx:ix};
}
function dpSimplify(pts,tol){
  if(pts.length<5)return pts;
  const keep=new Uint8Array(pts.length);keep[0]=1;keep[pts.length-1]=1;
  const st=[[0,pts.length-1]];
  while(st.length){
    const s=st.pop(),a=pts[s[0]],b=pts[s[1]];let md=0,mi=-1;
    const dx=b[0]-a[0],dy=b[1]-a[1],dl=Math.hypot(dx,dy)||1e-12;
    for(let i=s[0]+1;i<s[1];i++){const d=Math.abs((pts[i][0]-a[0])*dy-(pts[i][1]-a[1])*dx)/dl;if(d>md){md=d;mi=i;}}
    if(md>tol&&mi>0){keep[mi]=1;st.push([s[0],mi],[mi,s[1]]);}
  }
  return pts.filter((_,i)=>keep[i]);
}
/* panelning konturini (rotatsiyadan keyingi) uning joylashuvi bilan qaytaradi */
function panelPts(q){
  return q.outline.map(a=>q.swap?[a[1]+q.ox,a[0]+q.oy]:[a[0]+q.ox,a[1]+q.oy]);
}
function svgText(res,title){
  const pad=0.4,W=res.w+pad*2,H=res.h+pad*2,sc=1000;
  let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(W*sc).toFixed(0)+" "+(H*sc).toFixed(0)+'" width="'+(W*100).toFixed(0)+'mm" height="'+(H*100).toFixed(0)+'mm">\n';
  s+='<!-- Units: mm (viewBox). '+(title||"Membrane cutting pattern")+' -->\n<g fill="none" stroke="#222" stroke-width="'+Math.max(3,Math.round(W*sc/450))+'">\n';
  res.panels.forEach(q=>{
    const pts=panelPts(q).map(a=>((a[0]+pad)*sc).toFixed(1)+","+((a[1]+pad)*sc).toFixed(1));
    s+='<polygon id="P'+q.id+'" points="'+pts.join(" ")+'" fill="#f3efe4"/>\n';
    const c=panelPts(q).reduce((m,a)=>[m[0]+a[0],m[1]+a[1]],[0,0]);const n=panelPts(q).length||1;
    s+='<text x="'+((c[0]/n+pad)*sc).toFixed(0)+'" y="'+((c[1]/n+pad)*sc).toFixed(0)+'" font-size="'+Math.max(260,Math.round(W*sc/55))+'" text-anchor="middle" fill="#222" stroke="none">P'+q.id+"</text>\n";
  });
  return s+"</g>\n</svg>\n";
}
function dxfText(res){
  const L=["0","SECTION","2","ENTITIES"];
  const add=(...a)=>a.forEach(x=>L.push(String(x)));
  res.panels.forEach(q=>{
    const pts=panelPts(q);
    add(0,"POLYLINE",8,"PANEL_"+q.id,66,1,70,1);
    pts.forEach(a=>add(0,"VERTEX",8,"PANEL_"+q.id,10,(a[0]*1000).toFixed(2),20,(a[1]*1000).toFixed(2),30,0));
    add(0,"SEQEND",8,"PANEL_"+q.id);
    const c=pts.reduce((m,a)=>[m[0]+a[0],m[1]+a[1]],[0,0]);
    add(0,"TEXT",8,"LABEL",10,(c[0]/pts.length*1000).toFixed(1),20,(c[1]/pts.length*1000).toFixed(1),30,0,40,200,1,"P"+q.id);
  });
  add(0,"ENDSEC",0,"EOF");
  return L.join("\n")+"\n";
}

window.MH9={DEF,params,ffKey,relax,analyze,colorOf,curvScale,flatten,svgText,dxfText,panelPts,
  st:{pat:null,patKey:"",an:null,anKey:""}};
})();

/* ---------------------------------------------------------------
   4. INTERFEYS (Erkin shakl bo'limiga qo'shiladi) va 3D ulanishi
   --------------------------------------------------------------- */
(function(){
"use strict";
const M9=window.MH9;
const HTML=`
<div id="ff9">
<h3>Form-finding: muvozanat shakli</h3>
<p class="hint">Mato oldindan tortilganda o'zi egiladigan tabiiy shakl hisoblanadi (sovun pardasiga o'xshash). Chegara nuqtalari yoki ustunlar o'zgarsa, shakl avtomatik qayta topiladi.</p>
<label class="ffl"><input type="checkbox" id="ff-on"> <span>Form-finding yoqilgan</span></label>
<div id="ff-opts">
 <div class="fld"><label for="ff-ratio"><span>Taranglik nisbati (arqoq / ip)</span> <em id="ff-ratio-v"></em></label><input type="range" id="ff-ratio" min="0.3" max="3" step="0.05" style="width:100%;accent-color:var(--accent)"></div>
 <div class="fld"><label for="ff-ang"><span>Arqoq yo'nalishi (reja bo'yicha burchak)</span> <em id="ff-ang-v"></em></label><input type="range" id="ff-ang" min="0" max="90" step="5" style="width:100%;accent-color:var(--accent)"></div>
 <label class="ffl"><input type="checkbox" id="ff-cab"> <span>Erkin chegara arqoni (chekka ichkariga egiladi)</span></label>
 <div class="fld" id="ff-cr-w"><label for="ff-cr"><span>Arqon kuchi / mato kuchi (m)</span> <em id="ff-cr-v"></em></label><input type="range" id="ff-cr" min="4" max="60" step="1" style="width:100%;accent-color:var(--accent)"></div>
</div>
<div class="hint" id="ff-res"></div>

<h3>Tahlil xaritasi</h3>
<p class="hint">Xarita shu yerda va 3D bo'limida membrana ustida ko'rinadi. Hisob dastlabki loyiha uchun taxminiy: membrana muvozanati (yuk = taranglik × egrilik) asosida.</p>
<div class="seg" id="ff-map"><button type="button" data-m="off">Oddiy</button><button type="button" data-m="slope">Qiyalik</button><button type="button" data-m="curv">Egrilik</button><button type="button" data-m="snow">Qor yuki</button><button type="button" data-m="wind">Shamol so'rishi</button><button type="button" data-m="dist">Yoyilma deformatsiyasi</button></div>
<div class="grid">
 <div class="fld"><label for="ff-s"><span>Oldindan taranglik (kN/m)</span> <em id="ff-s-v"></em></label><input type="range" id="ff-s" min="0.5" max="10" step="0.1" style="width:100%;accent-color:var(--accent)"></div>
 <div class="fld"><label for="ff-ps"><span>Qor yuki (kN/m²)</span> <em id="ff-ps-v"></em></label><input type="range" id="ff-ps" min="0.1" max="3" step="0.1" style="width:100%;accent-color:var(--accent)"></div>
 <div class="fld"><label for="ff-pw"><span>Shamol so'rishi (kN/m²)</span> <em id="ff-pw-v"></em></label><input type="range" id="ff-pw" min="0.2" max="3" step="0.1" style="width:100%;accent-color:var(--accent)"></div>
</div>
<canvas id="ff-cv" style="width:100%;height:230px;border:1px solid var(--line);border-radius:12px;background:var(--surface)"></canvas>
<div class="hint" id="ff-leg" style="margin-top:6px"></div>
<div class="kv" id="ff-kv"></div>

<h3>Bichim naqshi</h3>
<p class="hint">Membrana tasmalarga bo'linadi va har bir tasma tekislikka yoyiladi. Natija: SVG va DXF (mm), kesish uskunasi uchun.</p>
<div class="grid">
 <div class="fld"><label for="pt-rw"><span>Mato eni (m)</span> <em id="pt-rw-v"></em></label><input type="range" id="pt-rw" min="1" max="5" step="0.1" style="width:100%;accent-color:var(--accent)"></div>
 <div class="fld"><label for="pt-cmp"><span>Kompensatsiya (%)</span> <em id="pt-cmp-v"></em></label><input type="range" id="pt-cmp" min="0" max="6" step="0.5" style="width:100%;accent-color:var(--accent)"></div>
</div>
<div class="seg" id="pt-axis"><button type="button" data-a="auto">Avto</button><button type="button" data-a="x">X bo'yicha kesish</button><button type="button" data-a="z">Y bo'yicha kesish</button></div>
<label class="ffl"><input type="checkbox" id="pt-seam"> <span>Tikuv chiziqlarini 3D da ko'rsatish</span></label>
<div class="vrow"><button type="button" class="plain" id="pt-go">Naqshni hisoblash</button><button type="button" class="plain" id="pt-svg" disabled>SVG</button><button type="button" class="plain" id="pt-dxf" disabled>DXF</button></div>
<div class="note warn" id="pt-warn" hidden></div>
<div class="kv" id="pt-kv"></div>
<div id="pt-prev" style="margin-top:10px;overflow:auto"></div>
<div class="tw"><table class="vt" id="pt-tbl"></table></div>
<div class="note" id="pt-note" hidden></div>
</div>`;
const CSS=`#ff9 .ffl{display:flex;align-items:center;gap:8px;margin:8px 0;font-size:14px}#ff9 .ffl input{width:20px;height:20px;accent-color:var(--accent)}#ff9 .fld label em{font-style:normal;font-weight:600;margin-left:4px}#ff9 .lg{display:inline-flex;align-items:center;gap:5px;margin:2px 10px 2px 0}#ff9 .lg i{display:inline-block;width:14px;height:14px;border-radius:4px}#pt-prev svg{max-width:100%;height:auto;display:block}`;
let UI=null,busy=0;
const $=(s,r)=>(r||document).querySelector(s);
const H=()=>window.MH;
const tr=t=>{try{return H().tr(t);}catch(e){return t;}};
const rgb=c=>"rgb("+Math.round(c[0]*255)+","+Math.round(c[1]*255)+","+Math.round(c[2]*255)+")";
function mat(){const S=H().S;return S.types[S.mtype]||{};}
function F(){return H().S.free;}
function ff(){return M9.params(F());}
function curKey(){const f=F(),q=ff();return JSON.stringify([f.pts,f.masts,M9.ffKey(f),q.rw,q.cmp,q.axis]);}
function getAn(g){
  const q=ff(),k=[q.s,q.pw,q.ps].join("|");
  if(g._an&&g._an.k===k)return g._an.v;
  const v=M9.analyze(g,{s:q.s,pw:q.pw,ps:q.ps});g._an={k,v};return v;
}
function withDist(an){
  const pt=M9.st.pat;an.dist=(pt&&pt.key===curKey())?pt.res.vstrain:null;return an;
}
function distScale(an){const a=an.dist?Array.from(an.dist).map(Math.abs).sort((x,y)=>x-y):[];return a.length?(a[Math.floor(a.length*0.95)]||0.001):0.001;}
function colsFor(g,map,an){
  const nv=g.pos.length/3,col=new Float32Array(nv*3);
  const sc=map==="curv"?M9.curvScale(an):map==="dist"?distScale(an):1;
  for(let i=0;i<nv;i++){const c=M9.colorOf(map,an,i,sc);col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];}
  return col;
}
/* ---- 3D ulanishi ---- */
function post3d(T3,P5,g,T,S,TH){
  if(S.shape!=="free"||!S.free)return;
  const q=M9.params(S.free),G=T3.group;
  if(q.map!=="off"){
    const an=withDist(getAn(g));
    if(q.map!=="dist"||an.dist){
      const mesh=G.children.find(o=>o.name==="membrane");
      if(mesh&&mesh.geometry){
        mesh.geometry.setAttribute("color",new TH.BufferAttribute(colsFor(g,q.map,an),3));
        const old=mesh.material;
        mesh.material=new TH.MeshBasicMaterial({vertexColors:true,side:TH.DoubleSide,toneMapped:false});
        if(old&&old.dispose)old.dispose();
        mesh.castShadow=false;
      }
    }
  }
  const pt=M9.st.pat;
  if(q.seams&&pt&&pt.key===curKey()&&pt.res.seams.length){
    const pos=[],lift=0.04,sm=pt.res.seams;
    for(let i=0;i<sm.length;i+=6)pos.push(sm[i],sm[i+1]+lift,sm[i+2],sm[i+3],sm[i+4]+lift,sm[i+5]);
    const geo=new TH.BufferGeometry();geo.setAttribute("position",new TH.Float32BufferAttribute(pos,3));
    const ln=new TH.LineSegments(geo,new TH.LineBasicMaterial({color:0xff6a00,toneMapped:false}));ln.name="seams";G.add(ln);
  }
}
/* ---- mini reja ko'rinishi ---- */
function drawPlan(){
  const cv=$("#ff-cv");if(!cv||!H().R||!H().R.g)return;
  const g=H().R.g,q=ff(),W=cv.clientWidth||320,Hh=cv.clientHeight||230,dpr=2;
  cv.width=W*dpr;cv.height=Hh*dpr;const c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,Hh);
  const p=g.pos,ix=g.idx,nv=p.length/3;
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,y0=1e9,y1=-1e9;
  for(let i=0;i<nv;i++){x0=Math.min(x0,p[i*3]);x1=Math.max(x1,p[i*3]);z0=Math.min(z0,p[i*3+2]);z1=Math.max(z1,p[i*3+2]);y0=Math.min(y0,p[i*3+1]);y1=Math.max(y1,p[i*3+1]);}
  const pad=10,k=Math.min((W-pad*2)/Math.max(0.1,x1-x0),(Hh-pad*2)/Math.max(0.1,z1-z0));
  const ox=(W-(x1-x0)*k)/2,oy=(Hh-(z1-z0)*k)/2;
  const X=i=>ox+(p[i*3]-x0)*k,Y=i=>oy+(p[i*3+2]-z0)*k;
  let an=null,col=null;
  if(q.map!=="off"){an=withDist(getAn(g));if(q.map!=="dist"||an.dist)col=colsFor(g,q.map,an);}
  for(let t=0;t<ix.length;t+=3){
    const a=ix[t],b=ix[t+1],d=ix[t+2];let cr,cg,cb;
    if(col){cr=(col[a*3]+col[b*3]+col[d*3])/3;cg=(col[a*3+1]+col[b*3+1]+col[d*3+1])/3;cb=(col[a*3+2]+col[b*3+2]+col[d*3+2])/3;}
    else{const h=((p[a*3+1]+p[b*3+1]+p[d*3+1])/3-y0)/Math.max(0.1,y1-y0);cr=0.78-0.35*h;cg=0.82-0.25*h;cb=0.88-0.1*h;}
    c.fillStyle=rgb([cr,cg,cb]);c.strokeStyle=c.fillStyle;c.lineWidth=0.6;
    c.beginPath();c.moveTo(X(a),Y(a));c.lineTo(X(b),Y(b));c.lineTo(X(d),Y(d));c.closePath();c.fill();c.stroke();
  }
  const pt=M9.st.pat;
  if(pt&&pt.key===curKey()){
    c.strokeStyle="#ff6a00";c.lineWidth=2;c.beginPath();
    const sm=pt.res.seams,PX=v=>ox+(v-x0)*k,PY=v=>oy+(v-z0)*k;
    for(let i=0;i<sm.length;i+=6){c.moveTo(PX(sm[i]),PY(sm[i+2]));c.lineTo(PX(sm[i+3]),PY(sm[i+5]));}
    c.stroke();
  }
}
function legendFor(map){
  const L={
    slope:[[[0.86,0.22,0.2],"<5° suv to'planadi"],[[0.95,0.58,0.16],"5–10°"],[[0.96,0.84,0.25],"10–20°"],[[0.25,0.7,0.4],">20°"]],
    curv:[[[0.2,0.45,0.85],"Egar (ikki yo'nalishda qarama-qarshi egrilik)"],[[0.75,0.77,0.8],"Tekis"],[[0.95,0.58,0.16],"Qubba yoki kosa"]],
    snow:[[[0.86,0.22,0.2],"Yetmaydi"],[[0.96,0.84,0.25],"Chegarada"],[[0.25,0.7,0.4],"Yetarli"]],
    wind:[[[0.86,0.22,0.2],"Yetmaydi"],[[0.96,0.84,0.25],"Chegarada"],[[0.25,0.7,0.4],"Yetarli"]],
    dist:[[[0.2,0.45,0.85],"Siqilish"],[[0.75,0.77,0.8],"Deformatsiyasiz"],[[0.86,0.22,0.2],"Cho'zilish"]]
  }[map];
  if(!L)return "";
  return L.map(r=>'<span class="lg"><i style="background:'+rgb(r[0])+'"></i>'+tr(r[1])+"</span>").join("");
}
function kvHtml(items){return items.map(i=>"<div><b"+(i[2]?' class="'+i[2]+'"':"")+">"+i[1]+"</b><span>"+tr(i[0])+"</span></div>").join("");}
function renderAll9(){
  if(!UI||!H().R)return;
  const on=H().S.shape==="free";
  if(!on)return;
  const g=H().R.g,q=ff(),fmt1=H().fmt1,T0=mat();
  if(!(q.s>0))q.s=T0.p0||3;if(!(q.rw>0))q.rw=T0.rollW||2.5;
  $("#ff-on").checked=q.on;$("#ff-opts").style.display=q.on?"":"none";
  $("#ff-cab").checked=q.cab;$("#ff-cr-w").style.display=q.cab?"":"none";
  const set=(id,v,txt)=>{const e=$("#"+id);if(e&&document.activeElement!==e)e.value=v;const t=$("#"+id+"-v");if(t)t.textContent=txt;};
  set("ff-ratio",q.ratio,fmt1(q.ratio,2)+" : 1");set("ff-ang",q.ang,q.ang+"°");set("ff-cr",q.cr,q.cr+" m");
  set("ff-s",q.s,fmt1(q.s,1)+" kN/m");set("ff-ps",q.ps,fmt1(q.ps,1)+" kN/m²");set("ff-pw",q.pw,fmt1(q.pw,1)+" kN/m²");
  set("pt-rw",q.rw,fmt1(q.rw,1)+" m");set("pt-cmp",q.cmp,q.cmp+"%");
  $("#pt-seam").checked=q.seams;
  Array.from($("#ff-map").children).forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.m===q.map)));
  Array.from($("#pt-axis").children).forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.a===q.axis)));
    $("#ff-res").textContent=q.on?tr("Muvozanat shakli hisoblandi."):tr("O'chirilgan: oddiy interpolyatsiya ishlatilmoqda.");
  if(!g||!g.pos)return;
  const an=withDist(getAn(g)),st=an.stats;
  $("#ff-leg").innerHTML=(q.map==="dist"&&!an.dist)?tr("Avval pastda naqshni hisoblang."):legendFor(q.map);
  const pc=v=>fmt1(v,0)+"%";
  $("#ff-kv").innerHTML=kvHtml([["Membrana maydoni",fmt1(st.area,0)+" m²"],["Eng kichik qiyalik",fmt1(st.minSlope,0)+"°"],["Qiyalik <10° (suv to'planishi)",pc(st.flat),st.flat>15?"bad":""],["Qor yuki yetmaydi",pc(st.snowBad),st.snowBad>20?"bad":""],["Shamol so'rishi yetmaydi",pc(st.windBad),st.windBad>20?"bad":""],["Egar shaklidagi maydon",pc(st.anti)]]);
  drawPlan();
  /* naqsh eskirganmi */
  const pt=M9.st.pat;
  if(pt&&pt.key!==curKey()){
    $("#pt-kv").innerHTML="";$("#pt-prev").innerHTML="";$("#pt-tbl").innerHTML="";$("#pt-svg").disabled=true;$("#pt-dxf").disabled=true;
    $("#pt-warn").hidden=false;$("#pt-warn").textContent=tr("Shakl yoki sozlama o'zgardi. Naqshni qayta hisoblang.");M9.st.pat=null;
  }
}
function showPattern(res){
  const q=ff();
  const kv=[["Panellar soni",String(res.panels.length)],["Eng keng panel",H().fmt1(res.maxW,2)+" m",res.maxW>res.rw?"bad":""],["Yoyilma maydoni",H().fmt1(res.area,0)+" m²"],["O'rtacha cho'zilish",H().fmt1(res.strain*100,2)+"%"],["Tasmalar",String(res.N)]];
  if(res.nflag)kv.push(["Yuqori deformatsiyali panellar",String(res.nflag),"bad"]);
  $("#pt-kv").innerHTML=kvHtml(kv);
  let svg=M9.svgText(res,"Taiyo Sky");
  svg=svg.replace(/width="[^"]*mm" height="[^"]*mm"/,"").replace(/stroke="#222"/g,'stroke="currentColor"').replace(/fill="#f3efe4"/g,'fill="var(--surface)"').replace(/fill="#222"/g,'fill="currentColor"');
  $("#pt-prev").innerHTML=svg;
  $("#pt-tbl").innerHTML="<tr><th>№</th><th>"+tr("Uzunlik")+"</th><th>"+tr("Eni")+"</th><th>"+tr("Maydon")+"</th><th>"+tr("Cho'zilish")+"</th></tr>"+res.panels.map(p=>"<tr"+(p.flag?' style="color:var(--bad)"':"")+"><td>P"+p.id+"</td><td>"+H().fmt1(p.len,2)+" m</td><td>"+H().fmt1(p.wid,2)+" m</td><td>"+H().fmt1(p.area,1)+" m²</td><td>"+H().fmt1(p.smax*100,1)+"%</td></tr>").join("");
  const w=$("#pt-warn");
  const msgs=[];
  if(res.maxW>res.rw)msgs.push(tr("Ba'zi panellar mato enidan keng. Mato enini kattaroq tanlang yoki kesish yo'nalishini o'zgartiring."));
  if(res.nflag)msgs.push(tr("Qizil panellarda deformatsiya katta (ustun uchi yoki keskin burchak yaqinida): ularda naqsh taxminiy, qo'shimcha kesish yoki halqa kerak."));
  w.hidden=!msgs.length;w.innerHTML=msgs.map(m=>"<div>"+m+"</div>").join("");
  $("#pt-svg").disabled=false;$("#pt-dxf").disabled=false;
}
function init(){
  if(!H()||!$("#free-ed")||UI)return;
  UI=true;
  const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
  $("#free-ed").insertAdjacentHTML("beforeend",HTML);
  const q=ff(),T=mat();
  if(!q.s)q.s=T.p0||3;if(!q.rw)q.rw=T.rollW||2.5;
  let dT=0;const defer=ms=>{clearTimeout(dT);dT=setTimeout(()=>H().refresh(),ms);};
  const shape=()=>defer(160);
  const bind=(id,key,fn,num)=>{const e=$("#"+id);e.addEventListener(e.type==="checkbox"?"change":"input",()=>{const v=e.type==="checkbox"?e.checked:parseFloat(e.value);ff()[key]=v;if(fn)fn();});};
  bind("ff-on","on",shape);bind("ff-ratio","ratio",shape);bind("ff-ang","ang",shape);bind("ff-cab","cab",shape);bind("ff-cr","cr",shape);
  const light=()=>defer(70);
  bind("ff-s","s",light);bind("ff-ps","ps",light);bind("ff-pw","pw",light);
  bind("pt-rw","rw",light);bind("pt-cmp","cmp",light);bind("pt-seam","seams",light);
  $("#ff-map").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;ff().map=b.dataset.m;Array.from($("#ff-map").children).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));light();});
  $("#pt-axis").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;ff().axis=b.dataset.a;Array.from($("#pt-axis").children).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));light();});
  $("#pt-go").addEventListener("click",()=>{
    const b=$("#pt-go"),g=H().R.g,qq=ff();b.disabled=true;b.textContent=tr("Hisoblanmoqda...");
    setTimeout(()=>{
      try{
        const res=M9.flatten(g,{rw:qq.rw,cmp:qq.cmp,axis:qq.axis});
        M9.st.pat={key:curKey(),res};
        showPattern(res);
        if(qq.seams||qq.map==="dist")H().refresh();
        drawPlan();
      }catch(e){$("#pt-warn").hidden=false;$("#pt-warn").textContent=String(e&&e.message||e);}
      b.disabled=false;b.textContent=tr("Naqshni hisoblash");
    },30);
  });
  $("#pt-svg").addEventListener("click",()=>{const p=M9.st.pat;if(p)H().exportFile("membrane-pattern.svg","image/svg+xml",M9.svgText(p.res,"Taiyo Sky"),"#pt-note");});
  $("#pt-dxf").addEventListener("click",()=>{const p=M9.st.pat;if(p)H().exportFile("membrane-pattern.dxf","application/dxf",M9.dxfText(p.res),"#pt-note");});
  const old=window.MH_refresh;window.MH_refresh=function(){if(old)old.apply(this,arguments);try{renderAll9();}catch(e){}};
  const oldPost=window.MH3_post;window.MH3_post=function(){if(oldPost)oldPost.apply(this,arguments);try{post3d.apply(null,arguments);}catch(e){}};
  const fe=$("#free-ed");new MutationObserver(()=>{});
  renderAll9();
}
window.addEventListener("load",()=>setTimeout(init,0));
M9.post3d=post3d;M9.renderAll9=renderAll9;
})();
