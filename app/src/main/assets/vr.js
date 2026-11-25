/* v9.3: "Haqiqiy rasm" - 3D ko'rinishdan Gemini rasm modeli yordamida konsept rasm */
(function(){
"use strict";
window.addEventListener("load",function(){
const MH=window.MH,M8=window.MH8;if(!MH||!M8||!M8.capture)return;
const $=MH.$,t=s=>M8.t?M8.t(s):s;
const anchor=document.getElementById("rl-note");if(!anchor)return;
const card=document.createElement("div");card.className="card cardx";card.id="vr-card";
card.innerHTML='<h3>Haqiqiy rasm (AI)</h3>'+
 '<div class="hint">Dasturdagi 3D shakldan ekran rasmi olinadi va rasm chizadigan Gemini xizmatiga yuboriladi. Internet va «AI» bo\'limidagi API kalit kerak. Natija taxminiy konsept rasm: shakl biroz o\'zgarishi mumkin va u hisob uchun emas.</div>'+
 '<div class="seg" id="vr-time"><button type="button" data-v="golden" aria-pressed="true">Quyosh botishi</button><button type="button" data-v="day" aria-pressed="false">Kunduz</button><button type="button" data-v="night" aria-pressed="false">Kechasi</button></div>'+
 '<div class="fld"><label for="vr-extra">Qo\'shimcha istak (ixtiyoriy, inglizcha yaxshiroq)</label><input type="text" id="vr-extra" autocomplete="off" placeholder="masalan: more water features"></div>'+
 '<div class="fld"><label for="vr-model">Model</label><input type="text" id="vr-model" autocomplete="off" value="gemini-3.1-flash-image"></div>'+
 '<div class="vrow"><button type="button" class="plain prim" id="vr-go">Rasm yaratish</button></div>'+
 '<div class="note" id="vr-note" hidden></div>'+
 '<img id="vr-img" alt="" hidden style="width:100%;border-radius:12px;margin-top:8px">'+
 '<div class="vrow"><button type="button" class="plain" id="vr-save" hidden>Rasmni saqlash</button></div>';
anchor.parentNode.insertAdjacentElement("afterend",card);
const note=m=>{const n=$("#vr-note");n.hidden=!m;n.textContent=m||"";};
let time="golden",last=null,busy=false;
$("#vr-time").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;time=b.dataset.v;[].forEach.call(document.querySelectorAll("#vr-time button"),x=>x.setAttribute("aria-pressed",String(x===b)));});
try{const m=localStorage.getItem("mh-vr-model");if(m)$("#vr-model").value=m;}catch(e){}
function prompt(){
  const S=MH.S,sh=S.shape,mat=S.mtype==="ETFE"?"translucent ETFE foil cushions":S.mtype==="PTFE"?"translucent white PTFE-coated glass-fibre membrane":"translucent white architectural PVC/PVDF membrane";
  const place={sa:"Saudi Arabia: a luxurious landscaped plaza with palm trees, shallow reflecting pools and fountains, polished stone paving, rugged desert mountains and a white mosque with minarets in the distance, a few people in white thobes and black abayas",
    jp:"Japan: a clean modern urban park plaza with maple and cherry trees, a calm pond, polished paving, mountains far away, a few pedestrians",
    uz:"Uzbekistan: a landscaped city plaza with plane trees, fountains, ornamental paving with subtle Central Asian patterns, mountains far away, a few pedestrians"}[S.region]||"a landscaped public plaza";
  const tm={golden:"golden hour just before sunset, soft pink and blue sky, the membrane glowing warmly from inside with elegant LED lighting",day:"bright clear daylight, deep blue sky with a few thin clouds, crisp shadows",night:"early blue-hour dusk, the membrane glowing warmly from inside, reflected in the water"}[time];
  const ex=($("#vr-extra").value||"").trim();
  return "Create a photorealistic, high-end architectural concept visualization. The attached image is a rough 3D model of the structure: keep EXACTLY its geometry, proportions, number and arrangement of roof elements and the camera angle. Turn it into a finished building: a tensile membrane structure covered with "+mat+", with a slender, elegant white-gold steel frame, ribs and cable details, glass and light below, a graceful central tower or columns where the model has them. Setting: "+place+". Lighting: "+tm+". Magazine-quality 3D architectural render, ultra detailed, realistic materials and reflections. No text, no logos, no watermark, no captions."+(ex?" Extra wish: "+ex+".":"");
}
function ext(m){return /png/.test(m)?"png":/webp/.test(m)?"webp":"jpg";}
$("#vr-go").addEventListener("click",function(){
  if(busy)return;
  if(!M8.st.aiKey){note(t("Avval «AI» bo'limida Gemini API kalitini kiriting."));return;}
  const cap=M8.capture(1024,"image/jpeg");
  if(!cap){note(t("Avval 3D ko'rinishni oching, so'ng qayta urinib ko'ring."));return;}
  const model=($("#vr-model").value||"gemini-3.1-flash-image").trim();try{localStorage.setItem("mh-vr-model",model);}catch(e){}
  const ar=cap.w/cap.h<0.7?"9:16":cap.w/cap.h<0.95?"3:4":cap.w/cap.h<1.25?"1:1":cap.w/cap.h<1.6?"4:3":"16:9";
  const txt0=prompt(),img0=cap.url.split(",")[1];
  const mk=gc=>JSON.stringify({contents:[{parts:[{text:txt0},{inline_data:{mime_type:"image/jpeg",data:img0}}]}],generationConfig:gc});
  const forms=[{responseModalities:["TEXT","IMAGE"],responseFormat:{image:{aspectRatio:ar,imageSize:"1K"}}},{responseModalities:["TEXT","IMAGE"],imageConfig:{aspectRatio:ar}},{responseModalities:["TEXT","IMAGE"]}];
  busy=true;$("#vr-go").disabled=true;let s=0;note(t("Rasm yaratilmoqda")+" … 0 s");
  const tm=setInterval(()=>{s++;note(t("Rasm yaratilmoqda")+" … "+s+" s");},1000);
  const url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent";
  const send=k=>M8.httpReq("POST",url,mk(forms[k]),{"Content-Type":"application/json","x-goog-api-key":M8.st.aiKey},true).then(r=>{
    if(r.status===400&&k<forms.length-1&&/unknown|invalid|responseFormat|imageConfig|aspect|JSON/i.test(r.text))return send(k+1);return r;});
  send(0).then(r=>{
    clearInterval(tm);
    if(r.status===0){note(t("Internetga ulanib bo'lmadi."));return;}
    let j;try{j=JSON.parse(r.text);}catch(e){note(t("Javobni o'qib bo'lmadi."));return;}
    if(r.status>=400){note(t("Xato")+" "+r.status+": "+((j.error&&j.error.message)||"").slice(0,200));return;}
    const parts=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
    let img=null,txt="";parts.forEach(p=>{const d=p.inlineData||p.inline_data;if(d&&d.data&&!p.thought)img=d;else if(p.text)txt+=p.text;});
    if(!img){note(txt?txt.slice(0,200):t("Javob bo'sh keldi."));return;}
    const mt=img.mimeType||img.mime_type||"image/png";last={b64:img.data,mt:mt};
    const im=$("#vr-img");im.src="data:"+mt+";base64,"+img.data;im.hidden=false;$("#vr-save").hidden=false;note(t("Tayyor. Rasmni saqlashingiz mumkin."));try{window.MH_galAdd&&window.MH_galAdd(im.src).then(()=>{});}catch(e){}
  }).catch(()=>{clearInterval(tm);note(t("Internetga ulanib bo'lmadi."));}).then(()=>{busy=false;$("#vr-go").disabled=false;});
});
$("#vr-save").addEventListener("click",function(){
  if(!last)return;const im=new Image();
  im.onload=function(){
    const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext("2d").drawImage(im,0,0);
    const url=c.toDataURL("image/png"),name="haqiqiy-rasm-"+Date.now()+".png";let ok=false;
    try{if(window.AndroidApp&&window.AndroidApp.saveImage){const res=String(window.AndroidApp.saveImage(name,url.split(",")[1]));if(res.indexOf("OK:")===0){note(t("Rasm saqlandi:")+" "+res.slice(3));ok=true;}}}catch(e){}
    if(!ok){const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();note(t("Rasm yuklab olindi."));}
  };
  im.src="data:"+last.mt+";base64,"+last.b64;
});

/* ---- Loyiha rasmlari (galereya) ---- */
const gal=document.createElement("div");gal.className="card cardx";gal.id="gal-card";
gal.innerHTML='<h3>Loyiha rasmlari</h3><div class="hint">Gemini yoki ChatGPT tayyorlagan rasmni telefondan qo\'shing. Rasmni bossangiz, u hisobotning tepasiga qo\'yiladi (yana bossangiz olib tashlanadi).</div><div id="gal-list" style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0"></div><div class="vrow"><button type="button" class="plain prim" id="gal-add">Rasm qo\'shish</button><button type="button" class="plain" id="gal-del" hidden>Tanlanganni o\'chirish</button></div><input type="file" id="gal-file" accept="image/*" hidden><div class="note" id="gal-note" hidden></div>';
card.insertAdjacentElement("afterend",gal);
const gnote=m=>{const n=$("#gal-note");n.hidden=!m;n.textContent=m||"";};
let db=null,hero=null,sel=null;try{hero=localStorage.getItem("mh-hero");}catch(e){}
function idb(){return new Promise((res,rej)=>{if(db)return res(db);const q=indexedDB.open("mh-gal",1);q.onupgradeneeded=()=>q.result.createObjectStore("img",{keyPath:"id"});q.onsuccess=()=>{db=q.result;res(db);};q.onerror=()=>rej(q.error);});}
const tx=(mode,f)=>idb().then(d=>new Promise((res,rej)=>{const t0=d.transaction("img",mode),st=t0.objectStore("img"),r=f(st);t0.oncomplete=()=>res(r&&r.result);t0.onerror=()=>rej(t0.error);}));
const all=()=>tx("readonly",st=>st.getAll());
function draw(){
  all().then(L=>{L=(L||[]).sort((a,b)=>b.id-a.id);const h=$("#gal-list");
    const heroRec=L.find(x=>String(x.id)===hero);M8.heroImg=heroRec?heroRec.url:null;
    h.innerHTML=L.map(x=>'<img data-id="'+x.id+'" src="'+x.url+'" alt="" style="width:30%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:3px solid '+(String(x.id)===hero?"#E8B65C":(String(x.id)===sel?"#1B58C9":"transparent"))+'">').join("")||'<div class="hint">'+t("Hozircha rasm yo'q.")+'</div>';
    $("#gal-del").hidden=!sel;}).catch(()=>gnote(t("Rasmlarni o'qib bo'lmadi.")));
}
$("#gal-list").addEventListener("click",e=>{const im=e.target.closest("img");if(!im)return;const id=im.dataset.id;
  if(hero===id){hero=null;try{localStorage.removeItem("mh-hero");}catch(x){}}else{hero=id;try{localStorage.setItem("mh-hero",id);}catch(x){}}
  sel=id;draw();});
function addDataUrl(url){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const m=1400,k=Math.min(1,m/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");
  c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
  const id=Date.now();tx("readwrite",st=>st.put({id:id,url:c.toDataURL("image/jpeg",0.85)})).then(()=>res(id),rej);};im.onerror=()=>rej(new Error("img"));im.src=url;});}
$("#gal-add").addEventListener("click",()=>$("#gal-file").click());
$("#gal-file").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;
  const fr=new FileReader();fr.onload=()=>addDataUrl(fr.result).then(id=>{hero=String(id);try{localStorage.setItem("mh-hero",hero);}catch(x){}sel=hero;gnote(t("Rasm qo'shildi va hisobotga qo'yildi."));draw();}).catch(()=>gnote(t("Rasmni o'qib bo'lmadi.")));fr.readAsDataURL(f);});
$("#gal-del").addEventListener("click",()=>{if(!sel)return;const id=+sel;tx("readwrite",st=>st.delete(id)).then(()=>{if(hero===sel){hero=null;try{localStorage.removeItem("mh-hero");}catch(x){}}sel=null;draw();});});
window.MH_galAdd=addDataUrl;draw();
});
})();
