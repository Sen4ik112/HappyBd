/* shapes.js — малюнки фігур на колесі (чорні силуети). Номер фігури = її місце в масиві SHAPES. */
function poly(c, pts){ c.beginPath(); pts.forEach(([x,y],i)=> i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath(); c.fill(); }
function regular(c,n,r,rot=0){ const p=[]; for(let i=0;i<n;i++){const a=rot+i*2*Math.PI/n; p.push([Math.cos(a)*r,Math.sin(a)*r]);} poly(c,p); }
function starShape(c,r){ const p=[]; for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5; const rr=i%2?r*.45:r; p.push([Math.cos(a)*rr,Math.sin(a)*rr]);} poly(c,p); }
function circ(c,x,y,rad){ c.beginPath(); c.arc(x,y,rad,0,7); c.fill(); }
function ell(c,x,y,rx,ry,rot=0){ c.beginPath(); c.ellipse(x,y,rx,ry,rot,0,7); c.fill(); }
function blob(c,r,pts,seed){ // «незрозуміла» плямка з плавними краями
  const n = pts.length, P = pts.map((k,i)=>{const a=i*2*Math.PI/n; return [Math.cos(a)*r*k, Math.sin(a)*r*k];});
  c.beginPath();
  for (let i=0;i<n;i++){
    const p0=P[i], p1=P[(i+1)%n], mx=(p0[0]+p1[0])/2, my=(p0[1]+p1[1])/2;
    if(i===0) c.moveTo(mx,my); else c.quadraticCurveTo(p0[0],p0[1],mx,my);
  }
  c.quadraticCurveTo(P[0][0],P[0][1],(P[0][0]+P[1][0])/2,(P[0][1]+P[1][1])/2);
  c.closePath(); c.fill();
}
function wavyRect(c,r){ // прямокутник з хвилястими верхом і низом
  const w=r*1.0, h=r*.62, amp=r*.16, waves=2, steps=40;
  c.beginPath();
  for(let i=0;i<=steps;i++){ const t=i/steps, x=-w+2*w*t, y=-h+Math.sin(t*waves*2*Math.PI)*amp; i?c.lineTo(x,y):c.moveTo(x,y); }
  for(let i=steps;i>=0;i--){ const t=i/steps, x=-w+2*w*t, y=h+Math.sin(t*waves*2*Math.PI)*amp; c.lineTo(x,y); }
  c.closePath(); c.fill();
}
const SHAPES = [
  // 0 — подарункова коробка з бантом
  (c,r,bg)=>{ c.fillRect(-r*.85,-r*.3,r*1.7,r*1.2); c.fillRect(-r,-r*.65,r*2,r*.4);
    c.fillStyle=bg; c.fillRect(-r*.12,-r*.65,r*.24,r*1.55); c.fillStyle="#000";
    ell(c,-r*.32,-r*.85,r*.3,r*.18,-.5); ell(c,r*.32,-r*.85,r*.3,r*.18,.5); },
  // 1 — м'яка іграшка (ведмедик)
  (c,r,bg)=>{ circ(c,-r*.55,-r*.8,r*.25); circ(c,r*.55,-r*.8,r*.25); circ(c,0,-r*.45,r*.55);
    ell(c,0,r*.45,r*.65,r*.6); circ(c,-r*.7,r*.15,r*.2); circ(c,r*.7,r*.15,r*.2);
    c.fillStyle=bg; circ(c,-r*.2,-r*.5,r*.07); circ(c,r*.2,-r*.5,r*.07); c.fillStyle="#000"; },
  // 2 — хмаринка-подушка
  (c,r)=>{ circ(c,-r*.5,r*.1,r*.45); circ(c,0,-r*.3,r*.6); circ(c,r*.5,r*.1,r*.45); c.fillRect(-r*.5,r*.1,r,r*.45); },
  // 3 — щось незрозуміле №1
  (c,r,bg)=>{ blob(c,r,[1,.6,1.1,.7,1,.55,1.15,.65],1); c.fillStyle=bg; circ(c,-r*.15,-r*.1,r*.14); circ(c,r*.25,r*.15,r*.1); c.fillStyle="#000"; },
  // 4 — чашка
  (c,r,bg)=>{ c.fillRect(-r*.7,-r*.5,r*1.2,r*1.2); ell(c,r*.65,r*.1,r*.35,r*.3);
    c.fillStyle=bg; ell(c,r*.65,r*.1,r*.16,r*.14); c.fillRect(-r*.5,-r*.35,r*.8,r*.15); c.fillStyle="#000"; c.fillRect(-r,r*.7,r*1.7,r*.15); },
  // 5 — книга
  (c,r,bg)=>{ c.fillRect(-r*.7,-r,r*1.4,r*2); c.fillStyle=bg; c.fillRect(-r*.5,-r,r*.1,r*2); c.fillRect(-r*.2,-r*.5,r*.6,r*.12); c.fillRect(-r*.2,-r*.2,r*.6,r*.12); c.fillStyle="#000"; },
  // 6 — ПЕРЕМОЖЕЦЬ: прямокутник з кривими краями
  (c,r)=>wavyRect(c,r),
  // 7 — м'яке серце-подушка
  (c,r)=>{ c.beginPath(); c.moveTo(0,r*.9); c.bezierCurveTo(-r*1.6,-r*.1,-r*.7,-r*1.3,0,-r*.4);
    c.bezierCurveTo(r*.7,-r*1.3,r*1.6,-r*.1,0,r*.9); c.fill(); },
  // 8 — щось незрозуміле №2 (закарлючка з діркою)
  (c,r,bg)=>{ blob(c,r,[1,.5,.95,.6,1.1,.5,.9,.7,1.05,.55],2); c.fillStyle=bg; ell(c,0,0,r*.22,r*.3,.6); c.fillStyle="#000"; },
  // 9 — окуляри
  (c,r,bg)=>{ c.lineWidth=r*.2; c.strokeStyle="#000"; c.beginPath(); c.arc(-r*.55,0,r*.42,0,7); c.stroke();
    c.beginPath(); c.arc(r*.55,0,r*.42,0,7); c.stroke(); c.beginPath(); c.moveTo(-r*.13,-r*.05); c.lineTo(r*.13,-r*.05); c.stroke();
    c.beginPath(); c.moveTo(-r*.97,-r*.1); c.lineTo(-r*1.2,-r*.3); c.moveTo(r*.97,-r*.1); c.lineTo(r*1.2,-r*.3); c.stroke(); }
];

