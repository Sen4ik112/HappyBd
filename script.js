/* ============ ЗВУКИ (шляхи беруться з config.js; порожній шлях = без звуку) ============ */
const sounds = {};
for (const k in SOUND_FILES) {
  if (SOUND_FILES[k]) { const a = new Audio(SOUND_FILES[k]); a.preload = "auto"; sounds[k] = a; }
}
function play(name, loop=false){
  const a = sounds[name]; if (!a) return;
  try { a.loop = loop; a.currentTime = 0; const p = a.play(); if (p) p.catch(()=>{}); } catch(e){}
}
// iOS/Safari: перший дотик "розблоковує" звуки, щоб spin/win могли заграти пізніше без кліку
document.addEventListener("pointerdown", () => {
  ["spin","win"].forEach(n => { const a = sounds[n]; if (!a) return;
    a.muted = true; const p = a.play();
    if (p) p.then(()=>{ a.pause(); a.currentTime = 0; a.muted = false; }).catch(()=>{ a.muted = false; });
  });
}, {once:true});
function stopSound(name){ const a = sounds[name]; if (!a) return; try{ a.pause(); a.currentTime = 0; }catch(e){} }

/* ============ ЗБЕРЕЖЕННЯ ПРОГРЕСУ ============ */
const KEY = "giftTest_v1";
function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch(e){ return null; } }
function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){} }
let state = load() || { answers: [], idx: 0, spin: null }; // spin: {target, rotation, done}

/* ============ ЕЛЕМЕНТИ ============ */
const $ = id => document.getElementById(id);
const quiz=$("quiz"), wheelBox=$("wheelBox"), main=$("main"), overlay=$("overlay");

/* ============ ТЕСТ ============ */
const STAR_PATH = "M26 4 L32.5 19 L48.5 20.2 L36.3 30.8 L40.2 46.5 L26 38 L11.8 46.5 L15.7 30.8 L3.5 20.2 L19.5 19 Z";

function renderQuestion(){
  const q = QUESTIONS[state.idx];
  const cur = state.answers[state.idx];
  $("counter").textContent = `Питання ${state.idx+1} з ${QUESTIONS.length}`;
  $("bar").style.width = (state.idx / QUESTIONS.length * 100) + "%";
  $("qText").textContent = q.t;
  const box = $("answers"); box.innerHTML = "";

  if (q.type === "stars"){
    const wrap = document.createElement("div"); wrap.className = "stars";
    for (let i=1;i<=5;i++){
      const b = document.createElement("button"); b.className = "star" + (cur && i<=cur ? " on":"");
      b.setAttribute("aria-label", i+" з 5");
      b.innerHTML = `<svg viewBox="0 0 52 52"><path d="${STAR_PATH}"/></svg>`;
      b.onclick = () => { setAnswer(i); wrap.querySelectorAll(".star").forEach((s,k)=>s.classList.toggle("on",k<i)); };
      wrap.appendChild(b);
    }
    box.appendChild(wrap);
  }
  if (q.type === "five"){
    const row = document.createElement("div"); row.className = "fiveRow";
    const cfg = [ {s:56,c:"c-green"},{s:42,c:"c-green"},{s:28,c:"c-gray"},{s:42,c:"c-red"},{s:56,c:"c-red"} ];
    cfg.forEach((d,i)=>{
      const w = document.createElement("div"); w.className="dotWrap";
      const b = document.createElement("button");
      b.className = `dot ${d.c}` + (cur===i+1?" on":""); b.style.width=b.style.height=d.s+"px";
      b.onclick = () => { setAnswer(i+1); row.querySelectorAll(".dot").forEach((x,k)=>x.classList.toggle("on",k===i)); };
      w.appendChild(b); row.appendChild(w);
    });
    box.appendChild(row);
    const labs = document.createElement("div"); labs.className = "fiveLabels";
    labs.innerHTML = "<span></span><span></span>";
    labs.children[0].textContent = q.labels[0];
    labs.children[1].textContent = q.labels[1];
    box.appendChild(labs);
  }
  if (q.type === "yn"){
    const row = document.createElement("div"); row.className="yn";
    [["Так","g"],["Ні","r"]].forEach(([txt,cls])=>{
      const b = document.createElement("button"); b.className=`btn ${cls}`+(cur===txt?" on":""); b.textContent=txt;
      b.onclick = () => { setAnswer(txt); row.querySelectorAll(".btn").forEach(x=>x.classList.toggle("on",x===b)); };
      row.appendChild(b);
    });
    box.appendChild(row);
  }
  if (q.type === "ab"){
    const row = document.createElement("div"); row.className="yn";
    q.opts.forEach((txt,i)=>{
      const b = document.createElement("button"); b.className="btn neutral"+(cur===txt?" on":""); b.textContent=txt;
      b.onclick = () => { setAnswer(txt); row.querySelectorAll(".btn").forEach(x=>x.classList.toggle("on",x===b)); };
      row.appendChild(b);
    });
    box.appendChild(row);
  }
  $("nextBtn").disabled = cur === undefined || cur === null;
  $("nextBtn").textContent = state.idx === QUESTIONS.length-1 ? "До колеса 🎡" : "Далі";
}
function setAnswer(v){ state.answers[state.idx] = v; save(); $("nextBtn").disabled = false; }

$("nextBtn").onclick = () => {
  if (state.idx < QUESTIONS.length-1){ state.idx++; save(); renderQuestion(); }
  else { state.idx = QUESTIONS.length; save(); showWheel(); }
};

/* звук тапу на всі кнопки */
document.addEventListener("click", e => { if (e.target.closest("button")) play("tap"); });

/* ============ КОЛЕСО ============ */
const SLICES = 10, SLICE_DEG = 360/SLICES;
const wheel = $("wheel"), ctx = wheel.getContext("2d");

function drawWheel(){
  const W = wheel.width, R = W/2;
  ctx.clearRect(0,0,W,W);
  for (let i=0;i<SLICES;i++){
    const a0 = (-90 + i*SLICE_DEG) * Math.PI/180, a1 = a0 + SLICE_DEG*Math.PI/180;
    ctx.beginPath(); ctx.moveTo(R,R); ctx.arc(R,R,R-6,a0,a1); ctx.closePath();
    ctx.fillStyle = SLICE_COLORS[i]; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#222"; ctx.stroke();

    // фігура + знак питання, повернуті вздовж променя
    const mid = (a0+a1)/2;
    ctx.save(); ctx.translate(R,R); ctx.rotate(mid + Math.PI/2);
    ctx.fillStyle = "#000";
    const k = SHAPE_ORDER[i], tw = WHEEL.tweak[k] || {};
    ctx.save(); ctx.translate((tw.dx||0)*R, -R*WHEEL.shapeRadius + (tw.dy||0)*R); ctx.rotate((tw.rot||0)*Math.PI/180);
    SHAPES[k](ctx, R*WHEEL.shapeSize*(tw.size||1), SLICE_COLORS[i]); ctx.restore();
    ctx.font = "bold "+(R*WHEEL.questionSize)+"px Segoe UI, sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("?", 0, -R*WHEEL.questionRadius);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(R,R,R-6,0,7); ctx.lineWidth=8; ctx.strokeStyle="#222"; ctx.stroke();
}

function setRotation(deg, animate){
  wheel.style.transition = animate ? "" : "none";
  wheel.style.transform = `rotate(${deg}deg)`;
}

function showWheel(){
  stopMusic();
  quiz.style.display = "none"; wheelBox.style.display = "block";
  drawWheel();
  if (state.spin){
    // refresh не дає перекрутити заново
    setRotation(state.spin.rotation, false);
    if (state.spin.done) finishUI(false);
    else { $("spinBtn").disabled = true; finishSpinNow(); }
  }
}

$("spinBtn").onclick = () => {
  if (state.spin) return;
  const target = SHAPE_ORDER.indexOf(WIN_SHAPE); // завжди випадає виграшна фігура
  const center = (target + .5) * SLICE_DEG;
  const rotation = 360*7 + (360 - center) + (Math.random()*SLICE_DEG*0.6 - SLICE_DEG*0.3);
  state.spin = { target, rotation, done:false };
  save();                                   // результат зафіксований ДО обертання
  $("spinBtn").disabled = true;
  play("spin", true);
  setRotation(0,false); void wheel.offsetWidth;
  setRotation(rotation,true);
  wheel.addEventListener("transitionend", onEnd, {once:true});
};
function onEnd(){ stopSound("spin"); state.spin.done = true; save(); finishUI(true); }
function finishSpinNow(){ setRotation(state.spin.rotation,false); state.spin.done = true; save(); finishUI(false); } // оновили сторінку посеред обертання

function finishUI(withShow){
  $("spinBtn").disabled = true;
  main.classList.add("blurred");
  overlay.style.display = "flex";
  if (withShow){ play("win"); fireCannon(); }
}

/* ============ КОНФЕТІ НА ФОНІ ============ */
const CONF = ["#e5383b","#2fb344","#ffd60a","#2d7ff9","#ffffff"];
const bg = $("bgConfetti"), bctx = bg.getContext("2d");
let bgP = [];
function sizeCanvas(c){ c.width = innerWidth; c.height = innerHeight; }
function resize(){ sizeCanvas(bg); sizeCanvas(cannon); }
const cannon = $("cannon"), cctx = cannon.getContext("2d");
addEventListener("resize", resize); resize();

function newBg(initial){
  return { x:Math.random()*bg.width, y: initial ? Math.random()*bg.height : -20,
    w:6+Math.random()*8, h:10+Math.random()*10, vy:.6+Math.random()*1.4, vx:(Math.random()-.5)*.6,
    r:Math.random()*6, vr:(Math.random()-.5)*.06, c:CONF[Math.floor(Math.random()*CONF.length)] };
}
for (let i=0;i<70;i++) bgP.push(newBg(true));
function drawP(c,p){ c.save(); c.translate(p.x,p.y); c.rotate(p.r); c.fillStyle=p.c; c.fillRect(-p.w/2,-p.h/2,p.w,p.h);
  if (p.c==="#ffffff"){ c.strokeStyle="rgba(0,0,0,.15)"; c.strokeRect(-p.w/2,-p.h/2,p.w,p.h);} c.restore(); }
function loopBg(){
  bctx.clearRect(0,0,bg.width,bg.height);
  bgP.forEach((p,i)=>{ p.y+=p.vy; p.x+=p.vx; p.r+=p.vr; if(p.y>bg.height+20) bgP[i]=newBg(false); drawP(bctx,p); });
  requestAnimationFrame(loopBg);
}
loopBg();

/* ============ ВИСТРІЛ ХЛОПУШКИ ============ */
let shots = [];
function fireCannon(){
  const W = cannon.width, H = cannon.height;
  [[0,H,-1],[W,H,1]].forEach(([x,y,side])=>{
    for (let i=0;i<110;i++){
      const ang = (-Math.PI/2) + side*(-0.15 - Math.random()*0.6) * -1; // вгору, до центру
      const sp = 9 + Math.random()*13;
      shots.push({ x, y, vx:Math.cos(ang)*sp*(side===-1?1:1)*(side===-1?1:-1)*-1*(side===-1?-1:1)*-1 || 0,
        vy:Math.sin(ang)*sp, w:6+Math.random()*8, h:10+Math.random()*10, r:Math.random()*6,
        vr:(Math.random()-.5)*.3, c:CONF[Math.floor(Math.random()*CONF.length)] });
    }
  });
  // горизонтальна швидкість: ліва труба стріляє вправо, права вліво
  shots.forEach((p,i)=>{ const left = p.x===0; p.vx = (left?1:-1) * (2 + Math.random()*7); });
  if (!firing){ firing = true; loopShots(); }
}
let firing = false;
function loopShots(){
  cctx.clearRect(0,0,cannon.width,cannon.height);
  shots.forEach(p=>{ p.vy += .28; p.vx *= .992; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; drawP(cctx,p); });
  shots = shots.filter(p=> p.y < cannon.height+40);
  if (shots.length) requestAnimationFrame(loopShots); else { firing=false; cctx.clearRect(0,0,cannon.width,cannon.height); }
}

/* ============ ФОНОВА МУЗИКА ============ */
const musicBtn = $("musicBtn");
let music = null;

if (!MUSIC_FILE) {
  musicBtn.style.display = "none";
} else {
  music = new Audio(MUSIC_FILE);
  music.loop = true;
  music.volume = MUSIC_VOLUME;
  musicBtn.onclick = () => {
    if (music.paused) {
      music.play().catch(()=>{});
      musicBtn.classList.add("on");
      musicBtn.textContent = "🔊";
    } else {
      music.pause();
      musicBtn.classList.remove("on");
      musicBtn.textContent = "🎵";
    }
  };
}

// зупиняє музику і ховає кнопку (викликається, коли починається колесо)
function stopMusic(){
  if (music) { music.pause(); music.currentTime = 0; }
  musicBtn.style.display = "none";
}

/* ============ СТАРТ ============ */
if (state.idx >= QUESTIONS.length) showWheel();
else renderQuestion();
