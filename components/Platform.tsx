import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";

// ── Types ─────────────────────────────────────────────────────────────────
interface ComplexityRow { op: string; b: string; a: string; w: string; n: string; }
interface StepDef { num?: string; c: string; title: string; desc: string; }

interface Topic {
  id: string; icon: string; title: string; color: string; tag: string;
  desc: string; analogy: string; aha: string;
  intro?: string[];
  keyPoints?: string[];
  steps: StepDef[];
  complexity: ComplexityRow[];
  Viz: (() => React.ReactElement) | null;
  tagline?: string; problems?: string[];
  FastSlowViz?: (() => React.ReactElement) | null;
}

interface TrieNode { children: Record<string, TrieNode>; isEnd: boolean; word?: string; }

interface NavItem {
  id?: string; label?: string; icon?: string;
  section?: string; tag?: string; sub?: boolean; locked?: boolean;
}

interface LessonPageProps { topic: Topic; onBack: () => void; }
interface DashboardProps { onSelect: (topic: Topic) => void; onPrep: () => void; }

// ── CSS ───────────────────────────────────────────────────────────────────
const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0C0E14;--sur:#11141C;--card:#181C27;--bdr:#222736;--fa:#1A1E2B;
  --g:#4EFFA0;--b:#5B8CFF;--y:#FFCC44;--r:#FF6B6B;--p:#C084FC;--o:#FF9F5B;
  --tx:#E8EAF0;--mu:#5A6278;--fd:'Space Grotesk',sans-serif;--fb:'Inter',sans-serif;--fc:'JetBrains Mono',monospace;
}
body{background:var(--bg);color:var(--tx);font-family:var(--fb);overflow-x:hidden}
button,input{font-family:var(--fb);outline:none}
button{cursor:pointer}
input:focus{border-color:var(--g)!important}
pre,code{font-family:var(--fc)}

/* Layout */
.app{min-height:100vh;position:relative}
.sb{width:232px;min-width:232px;background:var(--sur);border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;padding:12px 8px;position:fixed;top:0;left:0;height:100vh;z-index:100;transition:transform .25s ease;-webkit-overflow-scrolling:touch}
.main{margin-left:232px;min-height:100vh;overflow-y:auto;overflow-x:hidden}
.sb-logo{font-family:var(--fd);font-size:17px;font-weight:800;color:var(--g);padding:6px 10px 14px;letter-spacing:-.5px;display:flex;align-items:center;gap:8px}
.sb-sec{font-size:9px;font-weight:700;color:var(--mu);letter-spacing:2px;text-transform:uppercase;padding:10px 10px 4px}
.ni{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;color:var(--mu);transition:all .15s;margin-bottom:1px;white-space:nowrap;overflow:hidden}
.ni:hover{background:var(--card);color:var(--tx)}
.ni.active{background:#172a1f;color:var(--g)}
.ni.locked{opacity:.3;cursor:default}
.badge{margin-left:auto;font-size:9px;padding:2px 6px;border-radius:20px;font-weight:700;flex-shrink:0}
.be{background:#172a1f;color:var(--g)}.bm{background:#2a2610;color:var(--y)}.bh{background:#2a1616;color:var(--r)}

/* Topbar mobile */
.topbar{display:none;position:fixed;top:0;left:0;right:0;z-index:99;background:var(--sur);border-bottom:1px solid var(--bdr);padding:11px 16px;align-items:center;justify-content:space-between}
.topbar-logo{font-family:var(--fd);font-size:16px;font-weight:800;color:var(--g)}
.menu-btn{background:none;border:1px solid var(--bdr);border-radius:7px;padding:5px 10px;color:var(--tx);font-size:15px}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:98}
.overlay.show{display:block}

/* Hero */
.hero{padding:36px 44px 26px;background:linear-gradient(140deg,#11141C,#0C1018);border-bottom:1px solid var(--bdr);position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;top:-60px;right:-60px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(78,255,160,.05),transparent 70%);pointer-events:none}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:#172a1f;color:var(--g);font-size:10px;font-weight:700;padding:3px 11px;border-radius:20px;letter-spacing:.5px;margin-bottom:12px}
.hero h1{font-family:var(--fd);font-size:28px;font-weight:800;line-height:1.18;letter-spacing:-.8px;margin-bottom:8px}
.hero h1 span{color:var(--g)}
.hero p{color:var(--mu);font-size:13.5px;line-height:1.65;max-width:460px}
.hero-stats{display:flex;gap:22px;margin-top:18px;flex-wrap:wrap}
.stat-n{font-family:var(--fd);font-size:20px;font-weight:800}
.stat-l{font-size:11px;color:var(--mu);margin-top:1px}

/* Content */
.cx{padding:26px 44px}
.sh{display:flex;align-items:flex-start;gap:12px;margin-bottom:20px}
.sh-em{font-size:24px;margin-top:2px}
.sh h2{font-family:var(--fd);font-size:19px;font-weight:800;letter-spacing:-.3px}
.sh p{color:var(--mu);font-size:12px;margin-top:2px}

/* Cards */
.cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:28px}
.tc{background:var(--card);border:1px solid var(--bdr);border-radius:12px;padding:15px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
.tc:hover{transform:translateY(-2px);border-color:#2e3650;box-shadow:0 6px 24px rgba(0,0,0,.3)}
.tc-bar{position:absolute;left:0;top:0;bottom:0;width:3px}
.tc-icon{font-size:22px;margin-bottom:8px}
.tc-title{font-family:var(--fd);font-size:13.5px;font-weight:700;margin-bottom:4px}
.tc-desc{font-size:11.5px;color:var(--mu);line-height:1.5}
.tc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:10px}

/* Lesson */
.lc{max-width:760px}
.lb{display:inline-flex;align-items:center;gap:5px;color:var(--mu);font-size:12px;cursor:pointer;margin-bottom:18px;transition:color .15s}
.lb:hover{color:var(--tx)}
.lt{font-family:var(--fd);font-size:24px;font-weight:800;letter-spacing:-.6px;margin-bottom:6px}
.ls{color:var(--mu);font-size:13.5px;margin-bottom:22px;line-height:1.65}

/* Analogy */
.an-box{background:linear-gradient(135deg,#141f16,#111822);border:1px solid #243028;border-radius:12px;padding:18px;margin-bottom:20px}
.an-lbl{font-size:9.5px;font-weight:700;color:var(--g);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:7px}
.an-box p{font-size:13.5px;line-height:1.75;color:#b8d4bc;font-style:italic}

/* Viz */
.vz{background:var(--card);border:1px solid var(--bdr);border-radius:12px;padding:20px;margin-bottom:20px}
.vz-title{font-size:10px;font-weight:700;color:var(--mu);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px}
.vz-log{margin-top:10px;padding:8px 12px;background:var(--sur);border-radius:7px;font-size:11.5px;color:var(--g);font-family:var(--fc);min-height:30px;border:1px solid var(--bdr)}
.vz-ctrl{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.btn{padding:6px 13px;border-radius:7px;border:1px solid var(--bdr);background:var(--sur);color:var(--tx);font-size:12px;font-weight:500;transition:all .15s}
.btn:hover{background:var(--card);border-color:#2e3650}
.btn:disabled{opacity:.4;cursor:default}
.btn-g{background:#172a1f;color:var(--g);border-color:#253d2a}.btn-g:hover{background:#1e3828}
.btn-r{background:#2a1616;color:var(--r);border-color:#3d2222}.btn-r:hover{background:#341e1e}
.btn-b{background:#161e2e;color:var(--b);border-color:#222e4a}.btn-b:hover{background:#1a2438}
.btn-y{background:#221e0a;color:var(--y);border-color:#3d3410}.btn-y:hover{background:#2a2610}
.btn-p{background:#1e1428;color:var(--p);border-color:#2e1e40}.btn-p:hover{background:#261a34}

/* Steps */
.steps{display:grid;gap:9px;margin-bottom:20px}
.sc{background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:14px;display:flex;gap:12px;align-items:flex-start}
.sn{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:800;font-size:11px;flex-shrink:0}
.sb2 h4{font-weight:600;font-size:12.5px;margin-bottom:3px}
.sb2 p{font-size:11.5px;color:var(--mu);line-height:1.6}

/* Aha */
.aha{background:linear-gradient(135deg,#1c1a0d,#181510);border:1px solid #36300e;border-radius:12px;padding:16px;margin-bottom:20px}
.aha-lbl{font-size:9.5px;font-weight:700;color:var(--y);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
.aha p{font-size:13px;line-height:1.75;color:#d4c48a}

/* Table */
.ct-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:20px}
.ct{width:100%;border-collapse:collapse;min-width:420px}
.ct th{padding:8px 11px;text-align:left;font-size:9.5px;font-weight:700;color:var(--mu);letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid var(--bdr)}
.ct td{padding:8px 11px;font-size:11.5px;border-bottom:1px solid var(--fa)}
.ct tr:last-child td{border-bottom:none}
.og{color:var(--g);font-family:var(--fc);font-weight:700}
.oy{color:var(--y);font-family:var(--fc);font-weight:700}
.or{color:var(--r);font-family:var(--fc);font-weight:700}

/* SVG & viz overflow */
svg{max-width:100%;display:block}
.vz svg{overflow:visible}
/* Prevent any element from causing horizontal scroll */
.main *{max-width:100%}
.main img,svg{max-width:100%;height:auto}
/* Heap/tree SVG scroll wrapper */
.svg-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}

/* Code blocks */
.code-block{background:#080a10;border:1px solid var(--bdr);border-radius:10px;padding:14px 16px;margin-bottom:18px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.code-block pre{font-size:11.5px;line-height:1.7;color:#C8D0E0;margin:0;white-space:pre;tab-size:2}
.kw{color:#C084FC}.fn{color:#5B8CFF}.cm{color:#4A5568}.st{color:#4EFFA0}.nm{color:#FFCC44}

/* Prep */
.prep-hero{padding:26px 44px 18px;border-bottom:1px solid var(--bdr);background:linear-gradient(135deg,#0e1420,#0C0E14)}
.prep-hero h1{font-family:var(--fd);font-size:24px;font-weight:800;letter-spacing:-.6px;margin-bottom:6px}
.prep-hero p{color:var(--mu);font-size:13px;line-height:1.65;max-width:520px}
.prep-cats{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
.prep-cat{padding:5px 13px;border-radius:20px;font-size:11.5px;font-weight:600;border:1px solid var(--bdr);color:var(--mu);cursor:pointer;transition:all .15s;background:none}
.prep-cat.active,.prep-cat:hover{background:#172a1f;color:var(--g);border-color:#253d2a}

/* Concept cards */
.concept-card{background:var(--card);border:1px solid var(--bdr);border-radius:12px;padding:18px;margin-bottom:12px;cursor:pointer;transition:all .2s}
.concept-card:hover{border-color:#2e3650}
.concept-card.open{border-color:var(--g)}
.cc-head{display:flex;align-items:center;gap:12px}
.cc-icon{width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.cc-meta h3{font-family:var(--fd);font-size:14px;font-weight:700;margin-bottom:2px}
.cc-meta p{font-size:11.5px;color:var(--mu)}
.cc-arrow{margin-left:auto;color:var(--mu);font-size:16px;transition:transform .2s;flex-shrink:0}
.cc-body{margin-top:16px;border-top:1px solid var(--bdr);padding-top:16px}
.cc-analogy{background:linear-gradient(135deg,#141f16,#111822);border:1px solid #243028;border-radius:9px;padding:14px;margin-bottom:12px}
.cc-analogy p{font-size:13px;color:#b8d4bc;font-style:italic;line-height:1.7}
.cc-viz{background:var(--sur);border:1px solid var(--bdr);border-radius:9px;padding:16px;margin-bottom:12px}
.cc-steps{display:grid;gap:7px;margin-bottom:12px}
.cc-step{display:flex;gap:9px;align-items:flex-start;background:var(--sur);border:1px solid var(--bdr);border-radius:8px;padding:10px}
.cc-step-num{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;font-family:var(--fd);flex-shrink:0}
.cc-step h5{font-size:12px;font-weight:600;margin-bottom:2px}
.cc-step p{font-size:11px;color:var(--mu);line-height:1.55}
.cc-aha{background:linear-gradient(135deg,#1c1a0d,#181510);border:1px solid #36300e;border-radius:9px;padding:13px;margin-bottom:12px}
.cc-aha p{font-size:12px;color:#d4c48a;line-height:1.7}

/* Problems */
.prob-row{display:flex;align-items:center;gap:10px;padding:9px 13px;background:var(--sur);border:1px solid var(--bdr);border-radius:7px;transition:all .15s;cursor:pointer;margin-bottom:5px}
.prob-row:hover{background:var(--card);border-color:#2e3650}
.prob-check{width:17px;height:17px;border-radius:4px;border:1.5px solid var(--bdr);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
.prob-check.checked{background:var(--g);border-color:var(--g)}
.prob-title{font-size:12.5px;flex:1}
.prob-diff{font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px}
.diff-E{background:#172a1f;color:var(--g)}.diff-M{background:#2a2610;color:var(--y)}.diff-H{background:#2a1616;color:var(--r)}

/* Progress */
.prog-bar{height:3px;background:var(--fa);border-radius:2px;overflow:hidden}
.prog-fill{height:100%;background:var(--g);border-radius:2px;transition:width .4s ease}

/* Roadmap */
.rm{background:var(--card);border:1px solid var(--bdr);border-radius:12px;padding:18px;margin-bottom:24px}
.rm h3{font-family:var(--fd);font-size:13.5px;font-weight:700;margin-bottom:10px}
.rm-row{display:flex;align-items:center;overflow-x:auto;padding-bottom:4px}
.rm-step{padding:5px 11px;border-radius:6px;font-size:10.5px;font-weight:600;white-space:nowrap;flex-shrink:0}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
@keyframes glowG{0%,100%{box-shadow:0 0 5px rgba(78,255,160,.3)}50%{box-shadow:0 0 14px rgba(78,255,160,.6)}}
@keyframes glowB{0%,100%{box-shadow:0 0 5px rgba(91,140,255,.3)}50%{box-shadow:0 0 14px rgba(91,140,255,.6)}}
@keyframes shiftR{0%,100%{transform:translateX(0)}33%{transform:translateX(4px)}66%{transform:translateX(-3px)}}
.fadeUp{animation:fadeUp .3s ease both}

/* Scrollbar */
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}

/* Responsive */
@media(max-width:900px){
  .cx{padding:22px 28px}
  .hero{padding:28px 28px 22px}
  .prep-hero{padding:22px 28px 16px}
}
@media(max-width:768px){
  .sb{transform:translateX(-100%);position:fixed;height:100vh;z-index:100}
  .sb.open{transform:translateX(0)}
  .topbar{display:flex}
  .main{margin-left:0;padding-top:50px;min-height:calc(100vh - 50px)}
  .hero{padding:20px 16px 18px}
  .hero h1{font-size:21px;letter-spacing:-.4px}
  .hero p{font-size:13px}
  .hero-stats{gap:16px}
  .cx{padding:16px 14px}
  .prep-hero{padding:18px 14px 14px}
  .prep-hero h1{font-size:20px}
  .prep-hero p{font-size:12.5px}
  .cg{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:9px}
  .tc{padding:13px}
  .lc{max-width:100%}
  .lt{font-size:22px}
  .vz{padding:14px}
  .an-box{padding:14px}
  .aha{padding:14px}
  .sc{padding:12px}
  .concept-card{padding:14px}
  .cc-head{gap:9px}
  .rm-row{padding-bottom:8px}
}
@media(max-width:480px){
  .hero h1{font-size:18px}
  .hero-stats{gap:12px}
  .stat-n{font-size:17px}
  .stat-l{font-size:10px}
  .cg{grid-template-columns:1fr 1fr}
  .tc-title{font-size:12.5px}
  .tc{padding:12px}
  .cx{padding:12px 10px}
  .hero{padding:16px 12px 14px}
  .prep-hero{padding:14px 12px 12px}
  .vz{padding:12px}
  .vz-ctrl{gap:5px}
  .btn{padding:5px 10px;font-size:11px}
  .an-box p{font-size:12.5px}
  .sb2 p{font-size:11px}
  .lt{font-size:20px}
  .sh h2{font-size:17px}
  .feat-grid{grid-template-columns:1fr 1fr}
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existing = document.getElementById('algopath-platform-styles');
  if (!existing) {
    const sEl = document.createElement("style");
    sEl.id = 'algopath-platform-styles';
    sEl.textContent = css;
    document.head.appendChild(sEl);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Safe setState wrapper - prevents update on unmounted component
function useSafeState<T>(initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const safeSet: Dispatch<SetStateAction<T>> = v => { if (mounted.current) setState(v); };
  return [state, safeSet];
}
const oC = v => v === "O(1)" ? "og" : v.includes("log") ? "oy" : "or";

// ═══════════════════════════════════════════════════════════════
// ██  VISUALIZERS — DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════

function ArrayViz() {
  const [arr, setArr] = useState([12,45,7,23,56,34,89,11]);
  const [hi, setHi] = useState(null);
  const [shifting, setShifting] = useState([]);
  const [log, setLog] = useState("👆 Click any box to access it — O(1) instant.");
  const [busy, setBusy] = useState(false);
  const accessTimer=useRef(null);
  useEffect(()=>()=>clearTimeout(accessTimer.current),[]);
  const access = i => { if(busy)return; setHi(i); setLog(`⚡ arr[${i}]=${arr[i]} → O(1). base_addr + ${i}×4 bytes`); clearTimeout(accessTimer.current);accessTimer.current=setTimeout(()=>setHi(null),1400); };
  const insertMid = async () => {
    if(busy)return; setBusy(true); const mid=Math.floor(arr.length/2);
    setLog(`🔄 Inserting at [${mid}]... shifting ${arr.length-mid} elements`);
    for(let i=arr.length-1;i>=mid;i--){setShifting([i]);await sleep(90);} setShifting([]);
    setArr([...arr.slice(0,mid),99,...arr.slice(mid)]); setHi(mid);
    setLog(`✅ Inserted 99 at [${mid}]. O(n) — shifted ${arr.length-mid} elements!`);
    accessTimer.current=setTimeout(()=>{setHi(null);setBusy(false);},1200);
  };
  const delEnd = () => { if(busy||!arr.length)return; const v=arr[arr.length-1]; setArr(arr.slice(0,-1)); setLog(`🗑 Deleted ${v} from end → O(1)`); };
  const reset = () => { setArr([12,45,7,23,56,34,89,11]);setLog("Reset.");setHi(null);setShifting([]);setBusy(false); };
  return (
    <div className="vz"><div className="vz-title">📊 Array — Interactive Memory Diagram</div>
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
        {arr.map((v,i)=>{ const isH=hi===i,isS=shifting.includes(i); return (
          <div key={i} onClick={()=>access(i)} style={{minWidth:50,height:50,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,background:isH?"#172a1f":isS?"#221c0a":"var(--sur)",border:`2px solid ${isH?"var(--g)":isS?"var(--y)":"var(--bdr)"}`,transition:"all .15s",animation:isH?"glowG 1s ease infinite":isS?"shiftR .2s ease":"none"}}>
            <span style={{fontSize:14,fontFamily:"var(--fd)",fontWeight:800,color:isH?"var(--g)":isS?"var(--y)":"var(--tx)"}}>{isS?"→":v}</span>
            <span style={{fontSize:9,color:isH?"var(--g)":"var(--mu)"}}>[{i}]</span>
          </div>
        );})}
      </div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={insertMid} disabled={busy}>Insert Middle</button>
        <button className="btn btn-r" onClick={delEnd} disabled={busy}>Delete End</button>
        <button className="btn" onClick={reset}>↺ Reset</button>
      </div>
    </div>
  );
}

function LinkedListViz() {
  const [nodes,setNodes]=useState([{id:1,val:"A"},{id:2,val:"B"},{id:3,val:"C"},{id:4,val:"D"},{id:5,val:"E"}]);
  const [active,setActive]=useState(null);
  const [log,setLog]=useState("▶ Traverse to follow pointers one hop at a time.");
  const [busy,setBusy]=useState(false);
  const traverse=async()=>{ if(busy)return; setBusy(true);
    for(let i=0;i<nodes.length;i++){setActive(nodes[i].id);setLog(`📍 At "${nodes[i].val}" → hop ${i+1}/${nodes.length}`);await sleep(700);}
    setActive(null);setLog(`✅ Reached NULL. ${nodes.length} hops → O(n)`);setBusy(false);
  };
  const timerRef=useRef(null);
  const prepend=()=>{ const l=String.fromCharCode(65+(nodes.length%26)); const n={id:Date.now(),val:l}; setNodes([n,...nodes]);setActive(n.id);setLog(`⚡ Prepended "${l}" → O(1). 2 pointer ops.`);clearTimeout(timerRef.current);timerRef.current=setTimeout(()=>setActive(null),1100); };
  useEffect(()=>()=>clearTimeout(timerRef.current),[]);
  const removeHead=()=>{ if(!nodes.length)return; const r=nodes[0].val; setNodes(nodes.slice(1));setLog(`🗑 Removed HEAD "${r}" → O(1). HEAD=HEAD.next`); };
  const NW=50,PTR=20,STEP=NW+PTR+14;
  return (
    <div className="vz"><div className="vz-title">🔗 Linked List — Pointer Chain</div>
      <div style={{overflowX:"auto"}}><svg width={Math.max(nodes.length*STEP+60,300)} height={84} style={{display:"block"}}>
        <defs>
          <marker id="aG" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0L6 3L0 6z" fill="var(--g)"/></marker>
          <marker id="aD" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0L6 3L0 6z" fill="#2e3a4e"/></marker>
        </defs>
        <text x="8" y="18" fill="var(--g)" fontSize="9" fontWeight="700" fontFamily="Syne,sans-serif">HEAD</text>
        <line x1="18" y1="21" x2="18" y2="34" stroke="var(--g)" strokeWidth="1.5" markerEnd="url(#aG)"/>
        {nodes.map((node,i)=>{ const x=i*STEP+4,isA=active===node.id,hasNext=i<nodes.length-1; return (<g key={node.id}>
          <rect x={x} y={38} width={NW} height={34} rx="7" fill={isA?"#172a1f":"#181C27"} stroke={isA?"var(--g)":"var(--bdr)"} strokeWidth={isA?2:1} style={{filter:isA?"drop-shadow(0 0 8px rgba(78,255,160,.4))":"none",transition:"all .3s"}}/>
          <text x={x+NW/2} y={60} textAnchor="middle" fill={isA?"var(--g)":"var(--tx)"} fontSize="15" fontWeight="800" fontFamily="Syne,sans-serif" style={{transition:"fill .3s"}}>{node.val}</text>
          <rect x={x+NW} y={38} width={PTR} height={34} rx="4" fill="#111418" stroke="var(--bdr)" strokeWidth="1"/>
          <text x={x+NW+PTR/2} y={58} textAnchor="middle" fill={hasNext?"#2e3a4e":"var(--r)"} fontSize={hasNext?10:7} fontWeight="600" fontFamily="monospace">{hasNext?"→":"∅"}</text>
          {hasNext&&<line x1={x+NW+PTR} y1={55} x2={x+STEP+2} y2={55} stroke={isA?"var(--g)":"#2e3a4e"} strokeWidth={isA?2:1.5} strokeDasharray={isA?"none":"4,3"} markerEnd={isA?"url(#aG)":"url(#aD)"} style={{transition:"all .3s"}}/>}
          <text x={x+(NW+PTR)/2} y={80} textAnchor="middle" fill="var(--mu)" fontSize="8.5">node[{i}]</text>
        </g>);})}
      </svg></div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={traverse} disabled={busy}>{busy?"Traversing...":"▶ Traverse"}</button>
        <button className="btn btn-b" onClick={prepend}>Prepend</button>
        <button className="btn btn-r" onClick={removeHead}>Remove HEAD</button>
      </div>
    </div>
  );
}

function StackViz() {
  const [stack,setStack]=useState(["main()","renderApp()","fetchData()"]);
  const [newVal,setNewVal]=useState("");
  const [log,setLog]=useState("Call stack: every function call pushes, every return pops.");
  const [pushIdx,setPushIdx]=useState(null);
  const pushTimer=useRef(null);
  const push=()=>{ const v=newVal.trim()||`fn${stack.length+1}()`; const nx=[...stack,v]; setStack(nx);setPushIdx(nx.length-1);setLog(`📥 PUSH "${v}" → TOP. O(1).`);setNewVal("");clearTimeout(pushTimer.current);pushTimer.current=setTimeout(()=>setPushIdx(null),500); };
  useEffect(()=>()=>clearTimeout(pushTimer.current),[]);
  const pop=()=>{ if(!stack.length){setLog("❌ Stack underflow!");return;} const top=stack[stack.length-1]; setStack(s=>s.slice(0,-1));setLog(`📤 POP "${top}" → O(1). Returned!`); };
  const peek=()=>{ if(!stack.length){setLog("Empty.");return;} setLog(`👁 PEEK → "${stack[stack.length-1]}". O(1). Not removed.`); };
  return (
    <div className="vz"><div className="vz-title">🥞 Stack — LIFO Visualizer</div>
      <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start"}}>
        <div style={{flex:"0 0 180px"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><div style={{flex:1,height:1,background:"var(--bdr)"}}/>
            <span style={{fontSize:8.5,color:"var(--g)",fontWeight:700,letterSpacing:1,whiteSpace:"nowrap"}}>↑ TOP</span>
            <div style={{flex:1,height:1,background:"var(--bdr)"}}/></div>
          <div style={{display:"flex",flexDirection:"column-reverse",gap:4,minHeight:110}}>
            {stack.map((item,i)=>{ const isTop=i===stack.length-1; return (
              <div key={`${item}${i}`} style={{padding:"7px 12px",borderRadius:7,background:isTop?"#172a1f":"var(--sur)",border:`1.5px solid ${isTop?"var(--g)":"var(--bdr)"}`,fontSize:11.5,fontWeight:isTop?600:400,color:isTop?"var(--g)":"var(--tx)",display:"flex",justifyContent:"space-between",alignItems:"center",animation:i===pushIdx?"popIn .4s ease":"none",transition:"all .2s"}}>
                <span style={{fontFamily:"var(--fc)"}}>{item}</span>
                {isTop&&<span style={{fontSize:8.5,opacity:.7}}>← TOP</span>}
              </div>
            );})}
            {!stack.length&&<div style={{padding:12,textAlign:"center",color:"var(--mu)",border:"1px dashed var(--bdr)",borderRadius:7,fontSize:11}}>Empty</div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6}}><div style={{flex:1,height:1,background:"var(--bdr)"}}/>
            <span style={{fontSize:8.5,color:"var(--mu)",fontWeight:700,letterSpacing:1}}>BOTTOM</span>
            <div style={{flex:1,height:1,background:"var(--bdr)"}}/></div>
        </div>
        <div style={{flex:1,minWidth:160}}>
          <div style={{background:"var(--sur)",borderRadius:9,padding:12,marginBottom:9,border:"1px solid var(--bdr)"}}>
            <div style={{fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Real-world uses</div>
            {["🌐 Browser back button","↩️ Ctrl+Z Undo","📞 Call stack","🧮 Bracket matching"].map(u=><div key={u} style={{fontSize:11.5,color:"#b0b8c8",padding:"3px 0",borderBottom:"1px solid var(--fa)"}}>{u}</div>)}
          </div>
          <div style={{display:"flex",gap:5,marginBottom:7}}>
            <input value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&push()} placeholder="Function name..." style={{flex:1,padding:"6px 10px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:11.5}}/>
          </div>
          <div className="vz-ctrl" style={{marginTop:0}}>
            <button className="btn btn-g" onClick={push}>Push</button>
            <button className="btn btn-r" onClick={pop}>Pop</button>
            <button className="btn" onClick={peek}>Peek</button>
          </div>
        </div>
      </div>
      <div className="vz-log">{log}</div>
    </div>
  );
}

function QueueViz() {
  const [queue,setQueue]=useState(["Task A","Task B","Task C"]);
  const [newVal,setNewVal]=useState(""); const [hiHead,setHiHead]=useState(false); const [hiTail,setHiTail]=useState(false);
  const [log,setLog]=useState("Queue: FIFO — First In, First Out.");
  const qTimers=useRef([]);
  const clearQTimers=()=>{ qTimers.current.forEach(clearTimeout); qTimers.current=[]; };
  useEffect(()=>()=>clearQTimers(),[]);
  const enqueue=()=>{ const v=newVal.trim()||`Task ${String.fromCharCode(65+queue.length)}`; setQueue([...queue,v]);setHiTail(true);setLog(`📥 ENQUEUE "${v}" at REAR → O(1).`);setNewVal("");qTimers.current.push(setTimeout(()=>setHiTail(false),900)); };
  const dequeue=()=>{ if(!queue.length){setLog("❌ Empty!");return;} const v=queue[0];setHiHead(true);qTimers.current.push(setTimeout(()=>{setQueue(q=>q.slice(1));setHiHead(false);setLog(`📤 DEQUEUE "${v}" from FRONT → O(1).`);},380)); };
  const peek=()=>{ if(!queue.length){setLog("Empty.");return;} setHiHead(true);setLog(`👁 PEEK → "${queue[0]}". Next to serve. O(1).`);qTimers.current.push(setTimeout(()=>setHiHead(false),1100)); };
  return (
    <div className="vz"><div className="vz-title">🎫 Queue — FIFO Visualizer</div>
      <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:8}}>
        <div style={{textAlign:"center",marginRight:8}}><div style={{fontSize:9,color:"var(--r)",fontWeight:700,marginBottom:4}}>FRONT</div><div style={{fontSize:18,color:"var(--r)"}}>↙</div></div>
        {queue.map((item,i)=>{ const isF=i===0,isR=i===queue.length-1,hi=(isF&&hiHead)||(isR&&hiTail); return (
          <div key={`${item}${i}`} style={{minWidth:72,height:44,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,margin:"0 3px",background:hi?"#172a1f":"var(--sur)",border:`1.5px solid ${isF?"var(--r)":isR&&hiTail?"var(--g)":"var(--bdr)"}`,fontSize:11.5,fontWeight:600,color:hi?"var(--g)":"var(--tx)",transition:"all .3s"}}>{item}</div>
        );})}
        {!queue.length&&<div style={{padding:"8px 18px",border:"1px dashed var(--bdr)",borderRadius:7,color:"var(--mu)",fontSize:11.5}}>Empty</div>}
        <div style={{textAlign:"center",marginLeft:8}}><div style={{fontSize:9,color:"var(--g)",fontWeight:700,marginBottom:4}}>REAR</div><div style={{fontSize:18,color:"var(--g)"}}>↙</div></div>
      </div>
      <div style={{display:"flex",gap:5,margin:"9px 0 0"}}><input value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enqueue()} placeholder="Task name..." style={{flex:1,padding:"6px 10px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:11.5}}/></div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={enqueue}>Enqueue</button>
        <button className="btn btn-r" onClick={dequeue}>Dequeue</button>
        <button className="btn" onClick={peek}>Peek Front</button>
      </div>
    </div>
  );
}

function HashMapViz() {
  const hash=key=>{let h=0;for(let c of key)h=(h*31+c.charCodeAt(0))%8;return h;};
  const [buckets,setBuckets]=useState(()=>{const b=Array(8).fill(null).map(()=>[]);[["name","Alice"],["age","25"],["city","Delhi"],["lang","Python"]].forEach(([k,v])=>{const h=(31*k.charCodeAt(0)+(k.length>1?k.charCodeAt(1):0))%8;b[h]=[...b[h],{k,v}];});return b;});
  const [key,setKey]=useState("");const [val,setVal]=useState("");const [hiIdx,setHiIdx]=useState(null);
  const [log,setLog]=useState("📖 HashMap: O(1) avg get/set. Hash fn maps key → bucket index.");
  const hmTimer=useRef(null);
  const put=()=>{ if(!key.trim())return; const h=hash(key); const nb=buckets.map((b,i)=>{if(i!==h)return b;const ex=b.findIndex(e=>e.k===key);if(ex>=0){const nb2=[...b];nb2[ex]={k:key,v:val||"null"};return nb2;}return [...b,{k:key,v:val||"null"}];}); setBuckets(nb);setHiIdx(h);setLog(`✅ PUT "${key}"="${val}" → hash=${h} → bucket[${h}]. O(1) avg.`);setKey("");setVal("");clearTimeout(hmTimer.current);hmTimer.current=setTimeout(()=>setHiIdx(null),1400); };
  const get=()=>{ if(!key.trim())return; const h=hash(key);const entry=buckets[h].find(e=>e.k===key);setHiIdx(h);setLog(entry?`🔍 GET "${key}" → hash=${h} → found "${entry.v}". O(1) avg.`:`❌ "${key}" → hash=${h} → not found.`);clearTimeout(hmTimer.current);hmTimer.current=setTimeout(()=>setHiIdx(null),1400); };
  useEffect(()=>()=>clearTimeout(hmTimer.current),[]);
  return (
    <div className="vz"><div className="vz-title">🗺️ HashMap — Bucket Array</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
        {buckets.map((bucket,i)=>(
          <div key={i} style={{borderRadius:7,overflow:"hidden",border:`1.5px solid ${hiIdx===i?"var(--b)":"var(--bdr)"}`,transition:"all .3s",filter:hiIdx===i?"drop-shadow(0 0 8px rgba(91,140,255,.4))":"none"}}>
            <div style={{background:hiIdx===i?"#161e2e":"var(--fa)",padding:"3px 7px",fontSize:9.5,color:hiIdx===i?"var(--b)":"var(--mu)",fontWeight:700,borderBottom:"1px solid var(--bdr)"}}>[{i}]</div>
            <div style={{background:"var(--sur)",minHeight:28,padding:3}}>
              {bucket.map((e,j)=><div key={j} style={{fontSize:10,padding:"2px 4px",background:"var(--card)",borderRadius:3,marginBottom:2,display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--b)",fontFamily:"var(--fc)"}}>{e.k}</span><span style={{color:"var(--g)",fontFamily:"var(--fc)"}}>{e.v}</span></div>)}
              {!bucket.length&&<div style={{fontSize:9.5,color:"var(--mu)",padding:"2px 4px"}}>empty</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}><input value={key} onChange={e=>setKey(e.target.value)} placeholder="key" style={{flex:"1 1 70px",padding:"5px 9px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:11.5,minWidth:50}}/><input value={val} onChange={e=>setVal(e.target.value)} placeholder="value" style={{flex:"1 1 70px",padding:"5px 9px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:11.5,minWidth:50}}/></div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl"><button className="btn btn-g" onClick={put}>PUT</button><button className="btn btn-b" onClick={get}>GET</button></div>
    </div>
  );
}

function BinaryTreeViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  const [visited,setVisited]=useState([]);const [log,setLog]=useState("Click a traversal to watch nodes light up.");const [busy,setBusy]=useState(false);
  const getOrder=(node,type)=>{const r=[];const io=n=>{if(!n)return;io(n.left);r.push(n.val);io(n.right);};const pre=n=>{if(!n)return;r.push(n.val);pre(n.left);pre(n.right);};const post=n=>{if(!n)return;post(n.left);post(n.right);r.push(n.val);};const tree={val:50,left:{val:30,left:{val:20,left:null,right:null},right:{val:40,left:null,right:null}},right:{val:70,left:{val:60,left:null,right:null},right:{val:80,left:null,right:null}}};if(type==="in")io(tree);else if(type==="pre")pre(tree);else post(tree);return r;};
  const animate=async type=>{if(busy)return;setBusy(true);setVisited([]);const order=getOrder(null,type);const lbl={in:"In-order→sorted BST output",pre:"Pre-order→copy/serialize tree",post:"Post-order→deletion/cleanup"};setLog(`🔄 ${lbl[type]}`);for(const v of order){setVisited(p=>[...p,v]);await sleep(480);}setLog(`✅ [${order.join("→")}]`);setBusy(false);};
  const nodes=[{val:50,x:200,y:12},{val:30,x:112,y:72},{val:70,x:288,y:72},{val:20,x:60,y:142},{val:40,x:160,y:142},{val:60,x:238,y:142},{val:80,x:338,y:142}];
  const edges=[[200,28,112,72],[200,28,288,72],[112,88,60,142],[112,88,160,142],[288,88,238,142],[288,88,338,142]];
  return (
    <div className="vz"><div className="vz-title">🌲 Binary Tree — Traversal Visualizer</div>
      <div style={{overflowX:"auto"}}><svg width={400} height={188} viewBox="0 0 400 188" style={{display:"block",maxWidth:"100%"}}>
        {edges.map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--bdr)" strokeWidth="1.5"/>)}
        {nodes.map(n=>{const isV=visited.includes(n.val);return(<g key={n.val}><circle cx={n.x} cy={n.y+10} r={18} fill={isV?"#172a1f":"var(--sur)"} stroke={isV?"var(--g)":"var(--bdr)"} strokeWidth={isV?2:1} style={{transition:"all .3s",filter:isV?"drop-shadow(0 0 8px rgba(78,255,160,.4))":"none"}}/><text x={n.x} y={n.y+15} textAnchor="middle" fill={isV?"var(--g)":"var(--tx)"} fontSize="13" fontWeight="700" fontFamily="Syne,sans-serif" style={{transition:"fill .3s"}}>{n.val}</text></g>);})}
      </svg></div>
      <div style={{fontSize:10.5,color:"var(--mu)",marginBottom:4}}>BST: left &lt; root &lt; right at every node</div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={()=>animate("in")} disabled={busy}>In-order</button>
        <button className="btn btn-b" onClick={()=>animate("pre")} disabled={busy}>Pre-order</button>
        <button className="btn" onClick={()=>animate("post")} disabled={busy}>Post-order</button>
        <button className="btn btn-r" onClick={()=>{setVisited([]);setBusy(false);setLog("Reset.");}} disabled={busy}>↺</button>
      </div>
    </div>
  );
}

function HeapViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  const [heap,setHeap]=useState([null,3,8,5,12,10,7,15]); // 1-indexed
  const [hi,setHi]=useState(null);
  const [log,setLog]=useState("Min-Heap: parent is always ≤ both children. Root = minimum element.");
  const [busy,setBusy]=useState(false);
  const [newVal,setNewVal]=useState("");

  const insert=async()=>{
    if(busy||!newVal.trim())return; setBusy(true);
    const v=parseInt(newVal)||Math.floor(Math.random()*20+1);
    const h=[...heap,v]; let i=h.length-1; setHeap([...h]); setHi(i);
    setLog(`📥 Inserted ${v} at position ${i}. Bubbling UP...`);
    await sleep(600);
    while(i>1){
      const parent=Math.floor(i/2);
      if(h[parent]>h[i]){[h[parent],h[i]]=[h[i],h[parent]];setHi(parent);setHeap([...h]);setLog(`⬆️ ${h[parent]} < parent ${h[parent]} — swapped. Now at [${parent}]`);await sleep(600);i=parent;}
      else{setLog(`✅ Heap property satisfied! ${v} is in the right place.`);break;}
    }
    if(i===1)setLog(`✅ ${v} bubbled to ROOT — it's the new minimum!`);
    setHi(null);setBusy(false);setNewVal("");
  };

  const extractMin=async()=>{
    if(busy||heap.length<=1)return; setBusy(true);
    const min=heap[1]; setHi(1);
    setLog(`📤 Extracting MIN = ${min} from root...`);
    await sleep(600);
    const h=[...heap]; h[1]=h[h.length-1]; h.pop(); setHeap([...h]);
    let i=1;
    while(true){
      const l=2*i,r=2*i+1; let smallest=i;
      if(l<h.length&&h[l]<h[smallest])smallest=l;
      if(r<h.length&&h[r]<h[smallest])smallest=r;
      if(smallest===i)break;
      [h[i],h[smallest]]=[h[smallest],h[i]]; setHi(smallest);setHeap([...h]);
      setLog(`⬇️ Bubble DOWN: swapped with child ${h[i]} at [${smallest}]`);
      await sleep(600); i=smallest;
    }
    setHi(null);setLog(`✅ Extracted ${min}. New root = ${h[1]||"none"}.`);setBusy(false);
  };

  // Build tree positions for up to 15 elements (3 levels)
  const getPos=(idx,size)=>{
    const level=Math.floor(Math.log2(idx));
    const posInLevel=idx-Math.pow(2,level);
    const totalInLevel=Math.pow(2,level);
    const w=320,xStart=20;
    const x=xStart+(w/(totalInLevel+1))*(posInLevel+1);
    const y=20+level*56;
    return{x,y};
  };
  const validNodes=heap.slice(1).map((_,i)=>i+1).filter(i=>i<heap.length);

  return (
    <div className="vz"><div className="vz-title">🏔️ Min-Heap — Insert & Extract Visualizer</div>
      <div style={{overflowX:"auto"}}>
        <svg width={360} height={200} style={{display:"block",maxWidth:"100%"}}>
          {validNodes.map(i=>{
            const l=2*i,r=2*i+1;
            const{x,y}=getPos(i,heap.length);
            return(<g key={`e${i}`}>
              {l<heap.length&&(()=>{const{x:lx,y:ly}=getPos(l,heap.length);return<line x1={x} y1={y+10} x2={lx} y2={ly-10} stroke="var(--bdr)" strokeWidth="1.5"/>})()}
              {r<heap.length&&(()=>{const{x:rx,y:ry}=getPos(r,heap.length);return<line x1={x} y1={y+10} x2={rx} y2={ry-10} stroke="var(--bdr)" strokeWidth="1.5"/>})()}
            </g>);
          })}
          {validNodes.map(i=>{
            const{x,y}=getPos(i,heap.length);const isH=hi===i,isRoot=i===1;
            return(<g key={i}><circle cx={x} cy={y} r={17} fill={isRoot?"#1e1a0a":isH?"#172a1f":"var(--sur)"} stroke={isRoot?"var(--y)":isH?"var(--g)":"var(--bdr)"} strokeWidth={isH||isRoot?2:1} style={{transition:"all .3s",filter:isH?"drop-shadow(0 0 8px rgba(78,255,160,.4))":isRoot?"drop-shadow(0 0 6px rgba(255,204,68,.3))":"none"}}/><text x={x} y={y+5} textAnchor="middle" fill={isRoot?"var(--y)":isH?"var(--g)":"var(--tx)"} fontSize="13" fontWeight="800" fontFamily="Syne,sans-serif" style={{transition:"fill .3s"}}>{heap[i]}</text></g>);
          })}
        </svg>
      </div>
      <div style={{fontSize:10.5,color:"var(--mu)",marginBottom:8}}>🟡 Root = minimum  |  Green = currently moving</div>
      <div style={{display:"flex",gap:5,marginBottom:8}}>
        <input value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insert()} placeholder="Value to insert..." style={{flex:1,padding:"5px 9px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:11.5}}/>
      </div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={insert} disabled={busy}>Insert</button>
        <button className="btn btn-r" onClick={extractMin} disabled={busy}>Extract Min</button>
      </div>
    </div>
  );
}

function TrieViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  const initTrie = (): TrieNode => {
    const t: TrieNode = { children: {}, isEnd: false };
    const addWord = (root: TrieNode, word: string) => {
      let n = root;
      for (const ch of word) {
        if (!n.children[ch]) n.children[ch] = { children: {}, isEnd: false };
        n = n.children[ch];
      }
      n.isEnd = true; n.word = word;
    };
    addWord(t, "apple"); addWord(t, "cat"); addWord(t, "car");
    return t;
  };
  const [trie,setTrie]=useState(initTrie);
  const [searchWord,setSearchWord]=useState("");
  const [searchPath,setSearchPath]=useState([]);
  const [log,setLog]=useState("Type a word and click Search or Insert.");
  const [insertWord,setInsertWord]=useState("");

  const search=async()=>{
    const w=searchWord.toLowerCase().replace(new RegExp("[^a-z]", "g"),"");
    if(!w)return;
    let node=trie,path=[];
    setSearchPath([]);setLog(`🔍 Searching for "${w}"...`);
    for(let i=0;i<w.length;i++){
      path.push(w[i]);setSearchPath([...path]);
      await sleep(500);
      if(!node.children[w[i]]){setLog(`❌ "${w}" not found. Prefix "${w.slice(0,i)}" exists but "${w[i]}" is missing.`);return;}
      node=node.children[w[i]];
    }
    if(node.isEnd)setLog(`✅ "${w}" FOUND in trie! Word exists.`);
    else setLog(`⚠️ "${w}" is a prefix but not a complete word.`);
    await sleep(1000);setSearchPath([]);
  };

  const insert=()=>{
    const w=insertWord.toLowerCase().replace(new RegExp("[^a-z]", "g"),"");
    if(!w)return;
    const newTrie=JSON.parse(JSON.stringify(trie));
    let node=newTrie;
    for(const ch of w){if(!node.children[ch])node.children[ch]={children:{},isEnd:false};node=node.children[ch];}
    node.isEnd=true;node.word=w;
    setTrie(newTrie);setLog(`✅ Inserted "${w}" into trie.`);setInsertWord("");
  };

  const renderNode=(node: TrieNode, prefix="", depth=0): React.ReactNode =>{
    const entries=Object.entries(node.children);
    if(entries.length===0)return null;
    return entries.map(([ch,child])=>{
      const fullPrefix=prefix+ch;
      const inPath=searchPath.length>depth&&searchPath[depth]===ch;
      return(
        <div key={fullPrefix} style={{marginLeft:depth===0?0:14}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
            {depth>0&&<div style={{width:12,height:1,background:inPath?"var(--g)":"var(--bdr)",marginRight:2}}/>}
            <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:inPath?"#172a1f":child.isEnd?"#1e1a0a":"var(--card)",border:`1.5px solid ${inPath?"var(--g)":child.isEnd?"var(--y)":"var(--bdr)"}`,fontSize:13,fontWeight:800,fontFamily:"var(--fd)",color:inPath?"var(--g)":child.isEnd?"var(--y)":"var(--tx)",transition:"all .3s",flexShrink:0}}>{ch}</div>
            {child.isEnd&&<span style={{fontSize:9,color:"var(--y)",background:"#2a2610",padding:"1px 6px",borderRadius:10,fontWeight:700}}>"{child.word}"</span>}
          </div>
          {renderNode(child,fullPrefix,depth+1)}
        </div>
      );
    });
  };

  return (
    <div className="vz"><div className="vz-title">🌳 Trie — Prefix Tree Visualizer</div>
      <div style={{background:"var(--sur)",borderRadius:9,padding:14,marginBottom:10,overflowX:"auto",maxHeight:220,overflowY:"auto"}}>
        <div style={{fontSize:9.5,color:"var(--mu)",marginBottom:8,fontWeight:700}}>ROOT → prefix tree</div>
        <div style={{display:"flex",gap:16}}>{renderNode(trie)}</div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap"}}>
        <input value={searchWord} onChange={e=>setSearchWord(e.target.value)} placeholder="Search word..." style={{flex:"1 1 100px",padding:"5px 9px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:11.5}}/>
        <button className="btn btn-b" onClick={search}>Search</button>
        <input value={insertWord} onChange={e=>setInsertWord(e.target.value)} placeholder="Insert word..." style={{flex:"1 1 100px",padding:"5px 9px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:11.5}}/>
        <button className="btn btn-g" onClick={insert}>Insert</button>
      </div>
      <div className="vz-log">{log}</div>
    </div>
  );
}

function GraphViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  const nodes=[{id:0,x:160,y:40},{id:1,x:60,y:120},{id:2,x:260,y:120},{id:3,x:30,y:210},{id:4,x:140,y:210},{id:5,x:290,y:210}];
  const edges=[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5]];
  const adj={0:[1,2],1:[0,3,4],2:[0,4,5],3:[1],4:[1,2],5:[2]};
  const [visited,setVisited]=useState([]);const [queue,setQueue]=useState([]);const [log,setLog]=useState("BFS visits level by level. DFS goes deep first.");const [busy,setBusy]=useState(false);
  const bfs=async()=>{if(busy)return;setBusy(true);setVisited([]);setQueue([]);const vis=new Set();const q=[0];vis.add(0);setQueue([0]);setLog("🟢 BFS Start from node 0. Enqueue neighbors level by level.");
    while(q.length){const node=q.shift();setVisited([...vis]);setQueue([...q]);setLog(`📍 Visit node ${node}. Neighbors: [${adj[node].join(",")}]`);await sleep(700);
      for(const n of adj[node])if(!vis.has(n)){vis.add(n);q.push(n);setQueue([...q]);}
    }setLog("✅ BFS complete! All reachable nodes visited level by level.");setBusy(false);
  };
  const dfs=async()=>{if(busy)return;setBusy(true);setVisited([]);setQueue([]);const vis=new Set();
    const go=async node=>{vis.add(node);setVisited([...vis]);setLog(`📍 DFS visit ${node}. Stack depth: ${vis.size}`);await sleep(600);for(const n of adj[node])if(!vis.has(n))await go(n);};
    await go(0);setLog("✅ DFS complete! Explored each path to its depth first.");setBusy(false);
  };
  return(
    <div className="vz"><div className="vz-title">🕸️ Graph — BFS vs DFS Visualizer</div>
      <div style={{overflowX:"auto"}}><svg width={330} height={250} style={{display:"block",maxWidth:"100%"}}>
        {edges.map(([a,b],i)=><line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="var(--bdr)" strokeWidth="1.5"/>)}
        {nodes.map(n=>{const isV=visited.includes(n.id),isQ=queue.includes(n.id);return(<g key={n.id}><circle cx={n.x} cy={n.y} r={19} fill={isV?"#172a1f":isQ?"#161e2e":"var(--sur)"} stroke={isV?"var(--g)":isQ?"var(--b)":"var(--bdr)"} strokeWidth={isV||isQ?2:1} style={{transition:"all .3s",filter:isV?"drop-shadow(0 0 8px rgba(78,255,160,.4))":"none"}}/><text x={n.x} y={n.y+5} textAnchor="middle" fill={isV?"var(--g)":isQ?"var(--b)":"var(--tx)"} fontSize="13" fontWeight="800" fontFamily="Syne,sans-serif" style={{transition:"fill .3s"}}>{n.id}</text></g>);})}
      </svg></div>
      <div style={{display:"flex",gap:10,fontSize:10.5,color:"var(--mu)",marginBottom:6}}>
        <span>🟢 Visited</span><span style={{color:"var(--b)"}}>🔵 In queue (BFS)</span>
      </div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={bfs} disabled={busy}>▶ BFS</button>
        <button className="btn btn-b" onClick={dfs} disabled={busy}>▶ DFS</button>
        <button className="btn btn-r" onClick={()=>{setVisited([]);setQueue([]);setBusy(false);setLog("Reset.");}} disabled={busy}>↺</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ██  ALGORITHM VISUALIZERS
// ═══════════════════════════════════════════════════════════════

function PrefixSumViz() {
  const [arr]=useState([3,1,4,1,5,9,2,6]);
  const [prefix,setPrefix]=useState(null);
  const [qL,setQL]=useState(2);const [qR,setQR]=useState(5);
  const [result,setResult]=useState(null);const [log,setLog]=useState("Build prefix array once, then answer range-sum queries in O(1).");
  const build=()=>{const p=[0];for(const v of arr)p.push(p[p.length-1]+v);setPrefix(p);setLog(`✅ Prefix array built: [${p.join(",")}]. Now any range sum is O(1)!`);};
  const query=()=>{if(!prefix){setLog("⚠️ Build prefix array first!");return;}const r=prefix[qR+1]-prefix[qL];setResult(r);setLog(`🎯 Sum([${qL}..${qR}]) = prefix[${qR+1}] - prefix[${qL}] = ${prefix[qR+1]} - ${prefix[qL]} = ${r}. O(1)!`);};
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>📊 Prefix Sum — O(1) Range Queries</div>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,color:"var(--mu)",marginBottom:5}}>Original Array:</div>
        <div style={{display:"flex",gap:5}}>
          {arr.map((v,i)=><div key={i} style={{width:36,height:36,borderRadius:7,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:(i>=qL&&i<=qR)?"#172a1f":"var(--card)",border:`1.5px solid ${(i>=qL&&i<=qR)?"var(--g)":"var(--bdr)"}`,fontSize:13,fontWeight:700,color:(i>=qL&&i<=qR)?"var(--g)":"var(--tx)"}}>{v}<span style={{fontSize:8,color:"var(--mu)"}}>[{i}]</span></div>)}
        </div>
      </div>
      {prefix&&<div style={{marginBottom:8}}>
        <div style={{fontSize:10,color:"var(--mu)",marginBottom:5}}>Prefix Array (cumulative sum):</div>
        <div style={{display:"flex",gap:5}}>
          {prefix.map((v,i)=><div key={i} style={{width:36,height:32,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--sur)",border:"1px solid var(--bdr)",fontSize:12,fontWeight:700,color:"var(--b)"}}>{v}</div>)}
        </div>
      </div>}
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
        <span style={{fontSize:11.5,color:"var(--mu)"}}>Query L:</span>
        <input type="number" min={0} max={arr.length-1} value={qL} onChange={e=>setQL(+e.target.value)} style={{width:50,padding:"4px 7px",borderRadius:5,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:12}}/>
        <span style={{fontSize:11.5,color:"var(--mu)"}}>R:</span>
        <input type="number" min={0} max={arr.length-1} value={qR} onChange={e=>setQR(+e.target.value)} style={{width:50,padding:"4px 7px",borderRadius:5,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:12}}/>
        {result!==null&&<span style={{fontSize:13,fontWeight:700,color:"var(--g)"}}>= {result}</span>}
      </div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={build}>Build Prefix Array</button>
        <button className="btn btn-b" onClick={query}>Query Range Sum</button>
      </div>
    </div>
  );
}

function MonotonicStackViz() {
  const [arr]=useState([73,74,75,71,69,72,76,73]);
  const [stack,setStack]=useState([]);const [result,setResult]=useState(null);const [cur,setCur]=useState(-1);const [log,setLog]=useState("Daily Temperatures: find days until a warmer temperature.");const [busy,setBusy]=useState(false);
  const animate=async()=>{
    if(busy)return;setBusy(true);setStack([]);setCur(-1);
    const ans=new Array(arr.length).fill(0);const st=[];
    for(let i=0;i<arr.length;i++){
      setCur(i);setLog(`Day ${i}: temp=${arr[i]}°. Stack top: ${st.length?arr[st[st.length-1]]+"°":"empty"}`);await sleep(600);
      while(st.length&&arr[st[st.length-1]]<arr[i]){
        const j=st.pop();ans[j]=i-j;setStack([...st]);
        setLog(`🌡 Found warmer! Day ${j}→Day ${i} (+${i-j} days). Popped ${arr[j]}° from stack.`);await sleep(500);
      }
      st.push(i);setStack([...st]);setLog(`📥 Push day ${i} (${arr[i]}°) onto stack.`);await sleep(400);
    }
    setResult(ans);setCur(-1);setLog(`✅ Answer: [${ans.join(",")}]. O(n) — each element pushed/popped once!`);setBusy(false);
  };
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>🌡 Monotonic Stack — Daily Temperatures</div>
      <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
        {arr.map((v,i)=><div key={i} style={{width:38,height:44,borderRadius:7,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:cur===i?"#172a1f":stack.includes(i)?"#161e2e":"var(--card)",border:`1.5px solid ${cur===i?"var(--g)":stack.includes(i)?"var(--b)":"var(--bdr)"}`,fontSize:12,fontWeight:700,transition:"all .3s"}}>
          <span style={{color:cur===i?"var(--g)":stack.includes(i)?"var(--b)":"var(--tx)"}}>{v}°</span>
          {result&&<span style={{fontSize:9,color:"var(--y)",marginTop:1}}>{result[i]}d</span>}
        </div>)}
      </div>
      <div style={{fontSize:10,color:"var(--mu)",marginBottom:6}}>Stack (indices): [{stack.map(i=>`${i}(${arr[i]}°)`).join(",")}]</div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={animate} disabled={busy}>▶ Animate</button>
        <button className="btn btn-r" onClick={()=>{setStack([]);setResult(null);setCur(-1);setBusy(false);setLog("Reset.");}} disabled={busy}>↺</button>
      </div>
    </div>
  );
}

function BinarySearchAlgoViz() {
  const [arr]=useState([2,5,8,12,16,23,38,45,56,72,91]);
  const [target,setTarget]=useState(23);const [lo,setLo]=useState(null);const [hi,setHi]=useState(null);const [mid,setMid]=useState(null);const [found,setFound]=useState(null);const [log,setLog]=useState("Set a target and animate binary search eliminating half the space each step.");const [busy,setBusy]=useState(false);
  const search=async()=>{
    if(busy)return;setBusy(true);setFound(null);let l=0,r=arr.length-1;
    setLo(l);setHi(r);setLog(`🔍 Searching for ${target} in [${arr.join(",")}]`);await sleep(600);
    while(l<=r){
      const m=Math.floor((l+r)/2);setMid(m);setLo(l);setHi(r);
      setLog(`lo=${l}, hi=${r}, mid=${m} → arr[${m}]=${arr[m]}`);await sleep(800);
      if(arr[m]===target){setFound(m);setLog(`✅ Found ${target} at index ${m}! ${Math.ceil(Math.log2(arr.length))} steps max for ${arr.length} elements.`);setBusy(false);return;}
      else if(arr[m]<target){l=m+1;setLog(`${arr[m]} < ${target} → eliminate LEFT half. lo=${l}`);}
      else{r=m-1;setLog(`${arr[m]} > ${target} → eliminate RIGHT half. hi=${r}`);}
      await sleep(600);
    }
    setLo(null);setHi(null);setMid(null);setLog(`❌ ${target} not found. Eliminated all possibilities.`);setBusy(false);
  };
  const reset=()=>{setLo(null);setHi(null);setMid(null);setFound(null);setBusy(false);setLog("Reset.");};
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>🔍 Binary Search — Elimination Animation</div>
      <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4,marginBottom:8}}>
        {arr.map((v,i)=>{
          const inRange=lo!==null&&hi!==null&&i>=lo&&i<=hi;
          const isMid=mid===i;const isFound=found===i;
          return(<div key={i} style={{minWidth:36,height:40,borderRadius:7,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,background:isFound?"#172a1f":isMid?"#1e1a0a":inRange?"var(--card)":"rgba(0,0,0,.3)",border:`1.5px solid ${isFound?"var(--g)":isMid?"var(--y)":inRange?"var(--bdr)":"transparent"}`,fontSize:12,fontWeight:700,transition:"all .3s",opacity:inRange||isFound?1:.35}}>
            <span style={{color:isFound?"var(--g)":isMid?"var(--y)":"var(--tx)"}}>{v}</span>
            {isMid&&<span style={{fontSize:8,color:"var(--y)"}}>mid</span>}
          </div>);
        })}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:12,color:"var(--mu)"}}>Target:</span>
        <input type="number" value={target} onChange={e=>{setTarget(+e.target.value);reset();}} style={{width:70,padding:"5px 9px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:12}}/>
      </div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={search} disabled={busy}>▶ Search</button>
        <button className="btn" onClick={reset}>↺ Reset</button>
      </div>
    </div>
  );
}

function SortingViz() {
  const init=[64,34,25,12,22,11,90,45];
  const [arr,setArr]=useState([...init]);const [hi1,setHi1]=useState(-1);const [hi2,setHi2]=useState(-1);const [sorted,setSorted]=useState([]);const [log,setLog]=useState("Choose a sorting algorithm to visualize.");const [busy,setBusy]=useState(false);
  const reset=()=>{setArr([...init]);setHi1(-1);setHi2(-1);setSorted([]);setBusy(false);setLog("Reset.");};
  const bubbleSort=async()=>{if(busy)return;setBusy(true);const a=[...arr];const s=[];
    for(let i=0;i<a.length-1;i++){for(let j=0;j<a.length-i-1;j++){setHi1(j);setHi2(j+1);setLog(`Comparing ${a[j]} and ${a[j+1]}`);await sleep(300);if(a[j]>a[j+1]){[a[j],a[j+1]]=[a[j+1],a[j]];setArr([...a]);setLog(`Swapped ${a[j]} ↔ ${a[j+1]}`);await sleep(200);}}}
    setHi1(-1);setHi2(-1);setSorted([...Array(a.length).keys()]);setLog(`✅ Bubble Sort done! O(n²) — ${a.join(",")} `);setBusy(false);
  };
  const selectionSort=async()=>{if(busy)return;setBusy(true);const a=[...arr];const s=[];
    for(let i=0;i<a.length;i++){let mi=i;for(let j=i+1;j<a.length;j++){setHi1(j);setHi2(mi);await sleep(250);if(a[j]<a[mi])mi=j;}[a[i],a[mi]]=[a[mi],a[i]];setArr([...a]);s.push(i);setSorted([...s]);setLog(`Placed ${a[i]} at position ${i}.`);await sleep(300);}
    setHi1(-1);setHi2(-1);setSorted([...Array(a.length).keys()]);setLog(`✅ Selection Sort done! O(n²)`);setBusy(false);
  };
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>🔀 Sorting — Visual Comparison</div>
      <div style={{display:"flex",gap:5,alignItems:"flex-end",justifyContent:"center",height:80,marginBottom:8}}>
        {arr.map((v,i)=>{const isS=sorted.includes(i),is1=hi1===i,is2=hi2===i;return(
          <div key={i} style={{flex:1,maxWidth:44,borderRadius:"4px 4px 0 0",background:isS?"#172a1f":is1?"#2a1616":is2?"#221c0a":"var(--card)",border:`1.5px solid ${isS?"var(--g)":is1?"var(--r)":is2?"var(--y)":"var(--bdr)"}`,height:`${(v/90)*72}px`,display:"flex",alignItems:"flex-start",justifyContent:"center",transition:"all .2s",position:"relative"}}>
            <span style={{position:"absolute",top:-17,fontSize:11,fontWeight:700,color:isS?"var(--g)":is1?"var(--r)":"var(--tx)"}}>{v}</span>
          </div>);
        })}
      </div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button className="btn btn-g" onClick={bubbleSort} disabled={busy}>Bubble Sort O(n²)</button>
        <button className="btn btn-b" onClick={selectionSort} disabled={busy}>Selection Sort O(n²)</button>
        <button className="btn btn-r" onClick={reset} disabled={busy}>↺ Reset</button>
      </div>
    </div>
  );
}

function UnionFindViz() {
  const [parent,setParent]=useState([0,1,2,3,4,5,6]);
  const [rank,setRank]=useState([0,0,0,0,0,0,0]);
  const [a,setA]=useState(0);const [b,setB]=useState(1);const [log,setLog]=useState("Union-Find: track connected components. Union merges groups. Find checks membership.");
  const find=(p,x)=>{if(p[x]===x)return x;return find(p,p[x]);};
  const union=()=>{
    const p=[...parent],r=[...rank];const ra=find(p,a),rb=find(p,b);
    if(ra===rb){setLog(`⚠️ ${a} and ${b} are already in the same group (root=${ra}).`);return;}
    if(r[ra]<r[rb])p[ra]=rb;else if(r[ra]>r[rb])p[rb]=ra;else{p[rb]=ra;r[ra]++;}
    setParent(p);setRank(r);setLog(`✅ Union(${a},${b}): Merged groups. Root of ${a}=${find(p,a)}, Root of ${b}=${find(p,b)}.`);
  };
  const findOp=()=>{const root=find(parent,a);setLog(`🔍 Find(${a}) = root ${root}. All nodes with root ${root} are connected.`);};
  const getRoot=i=>find(parent,i);
  const colors=["#4EFFA0","#5B8CFF","#FFCC44","#FF6B6B","#C084FC","#FF9F5B","#4EFFA0"];
  const roots=[...new Set(parent.map((_,i)=>getRoot(i)))];
  const colorMap={};roots.forEach((r,i)=>colorMap[r]=colors[i%colors.length]);
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>🔗 Union-Find — Connected Components</div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:10}}>
        {parent.map((_,i)=>{const root=getRoot(i);return(
          <div key={i} style={{width:44,height:44,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`${colorMap[root]}18`,border:`2px solid ${colorMap[root]}`,fontSize:13,fontWeight:800,fontFamily:"var(--fd)",color:colorMap[root]}}>
            {i}<span style={{fontSize:8,opacity:.7}}>→{parent[i]}</span>
          </div>);
        })}
      </div>
      <div style={{fontSize:10.5,color:"var(--mu)",marginBottom:10,textAlign:"center"}}>Same color = same connected component</div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
        <span style={{fontSize:12,color:"var(--mu)"}}>Node A:</span>
        <input type="number" min={0} max={6} value={a} onChange={e=>setA(+e.target.value)} style={{width:50,padding:"4px 7px",borderRadius:5,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:12}}/>
        <span style={{fontSize:12,color:"var(--mu)"}}>Node B:</span>
        <input type="number" min={0} max={6} value={b} onChange={e=>setB(+e.target.value)} style={{width:50,padding:"4px 7px",borderRadius:5,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:12}}/>
      </div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={union}>Union(A,B)</button>
        <button className="btn btn-b" onClick={findOp}>Find(A)</button>
        <button className="btn btn-r" onClick={()=>{setParent([0,1,2,3,4,5,6]);setRank([0,0,0,0,0,0,0]);setLog("Reset.");}}>↺ Reset</button>
      </div>
    </div>
  );
}

function DPViz() {
  const [steps,setSteps]=useState(new Array(10).fill(null));const [log,setLog]=useState("Climbing Stairs: ways to reach each step. dp[i] = dp[i-1] + dp[i-2].");const [busy,setBusy]=useState(false);
  const animate=async()=>{if(busy)return;setBusy(true);const dp=new Array(11).fill(0);dp[0]=1;dp[1]=1;const s=[...new Array(10).fill(null)];s[0]=1;s[1]=1;setSteps([...s]);setLog("Base: dp[0]=1 (stand still), dp[1]=1 (one step).");await sleep(700);
    for(let i=2;i<=9;i++){dp[i]=dp[i-1]+dp[i-2];s[i]=dp[i];setSteps([...s]);setLog(`dp[${i}] = dp[${i-1}](${dp[i-1]}) + dp[${i-2}](${dp[i-2]}) = ${dp[i]} ways`);await sleep(600);}
    setLog(`✅ dp[9]=${dp[9]} ways to climb 9 steps. Recurrence: dp[i]=dp[i-1]+dp[i-2]`);setBusy(false);
  };
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>🧩 Dynamic Programming — Climbing Stairs</div>
      <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4,marginBottom:8}}>
        {steps.map((v,i)=><div key={i} style={{minWidth:44,height:52,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,background:v!==null?"#172a1f":"var(--card)",border:`1.5px solid ${v!==null?"var(--g)":"var(--bdr)"}`,transition:"all .4s",animation:v!==null?"popIn .4s ease":"none"}}>
          <span style={{fontSize:14,fontWeight:800,fontFamily:"var(--fd)",color:"var(--g)"}}>{v!==null?v:"?"}</span>
          <span style={{fontSize:9,color:"var(--mu)"}}>step {i}</span>
        </div>)}
      </div>
      <div style={{background:"var(--card)",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:12,fontFamily:"var(--fc)",color:"var(--b)"}}>dp[i] = dp[i-1] + dp[i-2]</div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={animate} disabled={busy}>▶ Animate DP</button>
        <button className="btn btn-r" onClick={()=>{setSteps(new Array(10).fill(null));setBusy(false);setLog("Reset.");}} disabled={busy}>↺</button>
      </div>
    </div>
  );
}

function GreedyViz() {
  const [arr]=useState([false,false,true,true,false,true]);
  const [pos,setPos]=useState(0);const [maxR,setMaxR]=useState(0);const [log,setLog]=useState("Jump Game: can you reach the last index? Greedily track max reachable index.");const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);
  const jumps=[2,3,1,1,4,0];
  const animate=async()=>{if(busy||done)return;setBusy(true);let mr=0;
    for(let i=0;i<jumps.length;i++){setPos(i);if(i>mr){setLog(`❌ Can't reach index ${i}! Max reachable was ${mr}.`);setDone(true);setBusy(false);return;}mr=Math.max(mr,i+jumps[i]);setMaxR(mr);setLog(`At [${i}], jump=${jumps[i]}. Max reachable: ${mr}`);await sleep(700);}
    setLog(`✅ Can reach the end! Greedy: just track max reachable at every step. O(n).`);setDone(true);setBusy(false);
  };
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>🏃 Greedy — Jump Game</div>
      <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:8}}>
        {jumps.map((v,i)=><div key={i} style={{width:42,height:48,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:i===pos?"#172a1f":i<=maxR&&maxR>0?"#161e2e":"var(--card)",border:`1.5px solid ${i===pos?"var(--g)":i<=maxR&&maxR>0?"var(--b)":"var(--bdr)"}`,transition:"all .4s"}}>
          <span style={{fontSize:14,fontWeight:800,fontFamily:"var(--fd)",color:i===pos?"var(--g)":i<=maxR&&maxR>0?"var(--b)":"var(--tx)"}}>{v}</span>
          <span style={{fontSize:8,color:"var(--mu)"}}>[{i}]</span>
        </div>)}
      </div>
      <div style={{fontSize:11,color:"var(--b)",marginBottom:6,textAlign:"center"}}>Max reachable index: {maxR}</div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={animate} disabled={busy||done}>▶ Animate</button>
        <button className="btn btn-r" onClick={()=>{setPos(0);setMaxR(0);setDone(false);setBusy(false);setLog("Reset.");}} >↺</button>
      </div>
    </div>
  );
}

function BitViz() {
  const [num,setNum]=useState(42);const [op,setOp]=useState(null);const [log,setLog]=useState("Pick an operation to see bit manipulation in action.");
  const toBin=n=>((n>>>0).toString(2)).padStart(8,"0");
  const ops={
    "Count 1s":{fn:n=>{let c=0,x=n;while(x){c+=x&1;x>>=1;}return{result:c,explain:`Count set bits: ${toBin(n)} → ${c} ones`};},},
    "Is Even":{fn:n=>({result:(n&1)===0?"EVEN":"ODD",explain:`n & 1 = ${n&1}. Last bit ${(n&1)===0?"is 0 → EVEN":"is 1 → ODD"}`}),},
    "Power of 2":{fn:n=>({result:(n>0&&(n&(n-1))===0)?"YES":"NO",explain:`n & (n-1) = ${n} & ${n-1} = ${n&(n-1)}. ${(n&(n-1))===0?"= 0 → Power of 2!":"≠ 0 → Not power of 2"}`}),},
    "Flip Bits":{fn:n=>({result:~n>>>0,explain:`~${n} = ${~n>>>0} (flip all 32 bits)`}),},
    "XOR Self":{fn:n=>({result:n^n,explain:`${n} XOR ${n} = 0. XOR with itself always cancels out!`}),},
  };
  const run=key=>{setOp(key);const{result,explain}=ops[key].fn(num);setLog(`${explain} → Result: ${result}`);};
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>⚡ Bit Manipulation — Interactive</div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
        <input type="number" value={num} onChange={e=>setNum(+e.target.value)} style={{width:80,padding:"5px 9px",borderRadius:6,background:"var(--sur)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:13}}/>
        <div style={{display:"flex",gap:4,flex:1,justifyContent:"flex-end"}}>
          {toBin(num).split("").map((b,i)=><div key={i} style={{width:28,height:28,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:b==="1"?"#172a1f":"var(--card)",border:`1px solid ${b==="1"?"var(--g)":"var(--bdr)"}`,fontSize:13,fontWeight:700,color:b==="1"?"var(--g)":"var(--mu)"}}>{b}</div>)}
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {Object.keys(ops).map(k=><button key={k} onClick={()=>run(k)} className={`btn ${op===k?"btn-g":""}`} style={{fontSize:11}}>{k}</button>)}
      </div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,color:"var(--g)",minHeight:30}}>{log}</div>
    </div>
  );
}

function IntervalsViz() {
  const [intervals,setIntervals]=useState([[1,3],[2,6],[8,10],[15,18]]);
  const [merged,setMerged]=useState(null);const [log,setLog]=useState("Merge Intervals: combine all overlapping intervals.");
  const merge=()=>{
    const sorted=[...intervals].sort((a,b)=>a[0]-b[0]);const res=[sorted[0]];
    for(let i=1;i<sorted.length;i++){const last=res[res.length-1];if(sorted[i][0]<=last[1]){last[1]=Math.max(last[1],sorted[i][1]);setLog(`Merged [${sorted[i]}] into [${last}]`);}else{res.push([...sorted[i]]);}}
    setMerged(res);setLog(`✅ Merged: ${res.map(i=>`[${i}]`).join(",")}. Greedy: sort + scan once = O(n log n).`);
  };
  const scale=v=>v*18;
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>📅 Intervals — Merge Visualizer</div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"var(--mu)",marginBottom:6}}>Input intervals:</div>
        {intervals.map((iv,i)=><div key={i} style={{position:"relative",height:24,marginBottom:4}}>
          <div style={{position:"absolute",left:scale(iv[0]),width:scale(iv[1]-iv[0]),height:18,borderRadius:4,background:"#161e2e",border:"1.5px solid var(--b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"var(--b)",fontFamily:"var(--fc)"}}>[{iv[0]},{iv[1]}]</div>
        </div>)}
      </div>
      {merged&&<div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"var(--mu)",marginBottom:6}}>Merged result:</div>
        {merged.map((iv,i)=><div key={i} style={{position:"relative",height:24,marginBottom:4}}>
          <div style={{position:"absolute",left:scale(iv[0]),width:scale(iv[1]-iv[0]),height:18,borderRadius:4,background:"#172a1f",border:"1.5px solid var(--g)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"var(--g)",fontFamily:"var(--fc)"}}>[{iv[0]},{iv[1]}]</div>
        </div>)}
      </div>}
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={merge}>Merge Intervals</button>
        <button className="btn btn-r" onClick={()=>{setMerged(null);setLog("Reset.");}}>↺ Reset</button>
      </div>
    </div>
  );
}

function BacktrackingViz() {
  const [result,setResult]=useState([]);const [cur,setCur]=useState([]);const [log,setLog]=useState("Subsets: generate all 2^n subsets via backtracking.");const [busy,setBusy]=useState(false);
  const arr=[1,2,3];
  const solve=async()=>{if(busy)return;setBusy(true);setResult([]);setCur([]);const res=[];
    const bt=async(start,path)=>{res.push([...path]);setResult([...res]);setCur([...path]);setLog(`Adding subset: [${path.join(",")||"∅"}]`);await sleep(400);
      for(let i=start;i<arr.length;i++){path.push(arr[i]);await bt(i+1,path);path.pop();}};
    await bt(0,[]);setCur([]);setLog(`✅ All ${res.length} subsets of [${arr}] found. 2^${arr.length}=${Math.pow(2,arr.length)} subsets total.`);setBusy(false);
  };
  return(
    <div className="cc-viz">
      <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>🌿 Backtracking — Subsets of [1,2,3]</div>
      <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap",minHeight:36}}>
        {result.map((s,i)=><span key={i} style={{padding:"3px 10px",borderRadius:20,background:JSON.stringify(s)===JSON.stringify(cur)?"#172a1f":"var(--sur)",border:`1px solid ${JSON.stringify(s)===JSON.stringify(cur)?"var(--g)":"var(--bdr)"}`,fontSize:11.5,fontFamily:"var(--fc)",color:JSON.stringify(s)===JSON.stringify(cur)?"var(--g)":"var(--tx)",transition:"all .2s"}}>[{s.join(",")||"∅"}]</span>)}
      </div>
      <div style={{fontSize:12,fontFamily:"var(--fc)",padding:"8px 12px",background:"var(--card)",borderRadius:7,marginBottom:10,color:"var(--g)",minHeight:30}}>{log}</div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn btn-g" onClick={solve} disabled={busy}>▶ Generate Subsets</button>
        <button className="btn btn-r" onClick={()=>{setResult([]);setCur([]);setBusy(false);setLog("Reset.");}}>↺</button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// ██  MISSING VISUALIZERS — Topological Sort, Dijkstra, Fast/Slow, 2D DP
// ═══════════════════════════════════════════════════════════════

function TopologicalSortViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  // Graph: 0→1, 0→2, 1→3, 2→3, 3→4  (course schedule style)
  const graph={0:[1,2],1:[3],2:[3],3:[4],4:[]};
  const labels=["Math","Algo","DS","Advanced","Interview"];
  const inDegrees={0:0,1:1,2:1,3:2,4:1};
  const [visited,setVisited]=useState([]);
  const [queue,setQueue]=useState([]);
  const [order,setOrder]=useState([]);
  const [log,setLog]=useState("Kahn's Algorithm: start with all nodes that have 0 in-degree (no prerequisites).");
  const [busy,setBusy]=useState(false);

  const animate=async()=>{
    if(busy)return; setBusy(true);
    setVisited([]); setQueue([]); setOrder([]);
    const indeg={...inDegrees};
    const q=Object.keys(indeg).filter(n=>indeg[n]===0).map(Number);
    const result=[];
    setQueue([...q]);
    setLog(`🚀 Nodes with 0 in-degree (no prerequisites): [${q.map(n=>labels[n]).join(", ")}] → Enqueue them`);
    await sleep(900);
    while(q.length){
      if(!mountedRef.current)return;
      const node=q.shift();
      result.push(node);
      setVisited([...result]);
      setQueue([...q]);
      setOrder([...result]);
      setLog(`✅ Process "${labels[node]}" → Decrement neighbors' in-degree`);
      await sleep(700);
      for(const neighbor of graph[node]){
        if(!mountedRef.current)return;
        indeg[neighbor]--;
        if(indeg[neighbor]===0){
          q.push(neighbor);
          setQueue([...q]);
          setLog(`➕ "${labels[neighbor]}" now has 0 prerequisites → Enqueue it`);
          await sleep(500);
        }
      }
    }
    if(!mountedRef.current)return;
    setLog(`✅ Topological order: ${result.map(n=>labels[n]).join(" → ")}. O(V+E) time.`);
    setBusy(false);
  };

  const reset=()=>{setVisited([]);setQueue([]);setOrder([]);setBusy(false);setLog("Kahn's Algorithm: start with all nodes that have 0 in-degree.");};

  // Node positions
  const pos=[{x:60,y:80},{x:160,y:30},{x:160,y:130},{x:260,y:80},{x:360,y:80}];
  const edges=[[0,1],[0,2],[1,3],[2,3],[3,4]];

  return(
    <div className="vz"><div className="vz-title">📋 Topological Sort — Kahn's BFS Algorithm</div>
      <div style={{overflowX:"auto"}}>
        <svg width={420} height={180} style={{display:"block",maxWidth:"100%"}}>
          <defs>
            <marker id="tarr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0 0 L8 3 L0 6z" fill="#2e3a4e"/>
            </marker>
            <marker id="tarrG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0 0 L8 3 L0 6z" fill="var(--g)"/>
            </marker>
          </defs>
          {edges.map(([a,b],i)=>{
            const isV=visited.includes(a)&&visited.includes(b);
            return <line key={i}
              x1={pos[a].x+22} y1={pos[a].y} x2={pos[b].x-22} y2={pos[b].y}
              stroke={isV?"var(--g)":"#2e3a4e"} strokeWidth={isV?2:1.5}
              markerEnd={isV?"url(#tarrG)":"url(#tarr)"}
              style={{transition:"all .4s"}}/>;
          })}
          {pos.map((p,i)=>{
            const isV=visited.includes(i), isQ=queue.includes(i);
            return(<g key={i}>
              <circle cx={p.x} cy={p.y} r={22}
                fill={isV?"#172a1f":isQ?"#161e2e":"var(--sur)"}
                stroke={isV?"var(--g)":isQ?"var(--b)":"var(--bdr)"}
                strokeWidth={isV||isQ?2:1}
                style={{transition:"all .4s",filter:isV?"drop-shadow(0 0 8px rgba(78,255,160,.4))":"none"}}/>
              <text x={p.x} y={p.y-6} textAnchor="middle"
                fill={isV?"var(--g)":isQ?"var(--b)":"var(--tx)"}
                fontSize="9" fontWeight="700" style={{transition:"fill .3s"}}>{i}</text>
              <text x={p.x} y={p.y+6} textAnchor="middle"
                fill={isV?"var(--g)":isQ?"var(--b)":"var(--mu)"}
                fontSize="8" style={{transition:"fill .3s"}}>{labels[i].substring(0,5)}</text>
            </g>);
          })}
        </svg>
      </div>
      {order.length>0&&(
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
          <span style={{fontSize:10,color:"var(--mu)"}}>Order:</span>
          {order.map((n,i)=>(
            <span key={i} style={{padding:"2px 8px",background:"#172a1f",color:"var(--g)",borderRadius:20,fontSize:10.5,fontFamily:"var(--fc)"}}>
              {labels[n]}
            </span>
          ))}
        </div>
      )}
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={animate} disabled={busy}>▶ Run Kahn's</button>
        <button className="btn btn-r" onClick={reset} disabled={busy}>↺ Reset</button>
      </div>
    </div>
  );
}

function DijkstraViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  // Weighted graph
  const nodes=[{id:0,x:60,y:90,label:"A"},{id:1,x:160,y:30,label:"B"},{id:2,x:160,y:150,label:"C"},{id:3,x:260,y:90,label:"D"},{id:4,x:340,y:90,label:"E"}];
  const edges=[{a:0,b:1,w:4},{a:0,b:2,w:2},{a:1,b:3,w:5},{a:2,b:3,w:8},{a:2,b:1,w:1},{a:3,b:4,w:3}];
  const adj={0:[{n:1,w:4},{n:2,w:2}],1:[{n:3,w:5}],2:[{n:3,w:8},{n:1,w:1}],3:[{n:4,w:3}],4:[]};
  const [dist,setDist]=useState({});
  const [visited,setVisited]=useState([]);
  const [current,setCurrent]=useState(null);
  const [log,setLog]=useState("Dijkstra: always process the unvisited node with smallest distance.");
  const [busy,setBusy]=useState(false);

  const animate=async()=>{
    if(busy)return; setBusy(true);
    const INF=Infinity, d={0:0,1:INF,2:INF,3:INF,4:INF};
    const vis=new Set();
    setDist({...d}); setVisited([]); setCurrent(null);
    setLog("🚀 Start: dist[A]=0, all others = ∞");
    await sleep(800);
    for(let iter=0;iter<5;iter++){
      if(!mountedRef.current)return;
      // Pick unvisited node with min dist
      let u=-1,minD=INF;
      for(let i=0;i<5;i++){if(!vis.has(i)&&d[i]<minD){minD=d[i];u=i;}}
      if(u===-1||d[u]===INF)break;
      vis.add(u); setCurrent(u); setVisited([...vis]);
      setLog(`🎯 Process node ${nodes[u].label} (dist=${d[u]}). Relax its neighbors.`);
      await sleep(700);
      for(const {n,w} of adj[u]){
        if(!mountedRef.current)return;
        if(!vis.has(n)&&d[u]+w<d[n]){
          d[n]=d[u]+w;
          setDist({...d});
          setLog(`⚡ Relax ${nodes[u].label}→${nodes[n].label}: ${d[u]}+${w}=${d[u]+w} < ${d[n]===d[u]+w?'∞':d[n]} ✅ Update!`);
          await sleep(600);
        }
      }
    }
    if(!mountedRef.current)return;
    setCurrent(null);
    setLog(`✅ Shortest paths from A: ${Object.entries(d).map(([k,v])=>`→${nodes[k].label}:${v}`).join(", ")}`);
    setBusy(false);
  };

  const reset=()=>{setDist({});setVisited([]);setCurrent(null);setBusy(false);setLog("Dijkstra: always process the unvisited node with smallest distance.");};

  return(
    <div className="vz"><div className="vz-title">🗺️ Dijkstra — Shortest Path Visualizer</div>
      <div style={{overflowX:"auto"}}>
        <svg width={400} height={200} style={{display:"block",maxWidth:"100%"}}>
          {edges.map((e,i)=>{
            const a=nodes[e.a],b=nodes[e.b];
            const isActive=(visited as number[]).includes(e.a)&&(visited as number[]).includes(e.b);
            const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
            return(<g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={isActive?"var(--g)":"#2e3a4e"} strokeWidth={isActive?2:1.5}
                style={{transition:"stroke .4s"}}/>
              <rect x={mx-9} y={my-8} width={18} height={14} rx="3" fill="var(--bg)"/>
              <text x={mx} y={my+2} textAnchor="middle" fill="var(--y)" fontSize="10" fontWeight="700">{e.w}</text>
            </g>);
          })}
          {nodes.map(n=>{
            const isV=visited.includes(n.id), isCur=current===n.id;
            const d=dist[n.id];
            return(<g key={n.id}>
              <circle cx={n.x} cy={n.y} r={22}
                fill={isCur?"#1e1a0a":isV?"#172a1f":"var(--sur)"}
                stroke={isCur?"var(--y)":isV?"var(--g)":"var(--bdr)"}
                strokeWidth={isCur||isV?2:1}
                style={{transition:"all .4s",filter:isCur?"drop-shadow(0 0 8px rgba(255,204,68,.5))":isV?"drop-shadow(0 0 6px rgba(78,255,160,.3))":"none"}}/>
              <text x={n.x} y={n.y-4} textAnchor="middle"
                fill={isCur?"var(--y)":isV?"var(--g)":"var(--tx)"} fontSize="13" fontWeight="800">{n.label}</text>
              <text x={n.x} y={n.y+10} textAnchor="middle"
                fill={d!==undefined&&d!==Infinity?"var(--g)":"var(--mu)"} fontSize="9" fontWeight="600">
                {d===undefined?"∞":d===Infinity?"∞":d}
              </text>
            </g>);
          })}
        </svg>
      </div>
      <div style={{fontSize:10.5,color:"var(--mu)",marginBottom:6}}>🟡 Current node · 🟢 Processed · Numbers = current best distance from A</div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={animate} disabled={busy}>▶ Run Dijkstra</button>
        <button className="btn btn-r" onClick={reset} disabled={busy}>↺ Reset</button>
      </div>
    </div>
  );
}

function FastSlowViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  // Linked list with cycle: 0→1→2→3→4→5→3 (cycle at 3)
  const nodes=[{id:0,label:"0"},{id:1,label:"1"},{id:2,label:"2"},{id:3,label:"3"},{id:4,label:"4"},{id:5,label:"5"}];
  const nextArr=[1,2,3,4,5,3]; // node 5 points back to 3 — cycle!
  const [slow,setSlow]=useState(null);
  const [fast,setFast]=useState(null);
  const [met,setMet]=useState(null);
  const [log,setLog]=useState("Cycle detection: slow moves 1 step, fast moves 2 steps. If they meet → cycle!");
  const [busy,setBusy]=useState(false);

  const animate=async()=>{
    if(busy)return; setBusy(true);
    let s=0,f=0; setMet(null);
    setSlow(s); setFast(f);
    setLog("🐢 Slow starts at 0. 🐇 Fast starts at 0.");
    await sleep(800);
    for(let i=0;i<10;i++){
      if(!mountedRef.current)return;
      s=nextArr[s];
      f=nextArr[nextArr[f]];
      setSlow(s); setFast(f);
      setLog(`Step ${i+1}: 🐢 Slow→${s}, 🐇 Fast→${f}`);
      await sleep(700);
      if(s===f){
        if(!mountedRef.current)return;
        setMet(s);
        setLog(`🎉 Slow(${s}) === Fast(${f})! CYCLE DETECTED at node ${s}. O(n) time, O(1) space!`);
        setBusy(false); return;
      }
    }
    if(!mountedRef.current)return;
    setLog("No cycle found."); setBusy(false);
  };

  const reset=()=>{setSlow(null);setFast(null);setMet(null);setBusy(false);setLog("Cycle detection: slow moves 1 step, fast moves 2 steps.");};

  const pos=[{x:60,y:80},{x:130,y:30},{x:200,y:80},{x:270,y:80},{x:340,y:30},{x:340,y:130}];

  return(
    <div className="vz"><div className="vz-title">🐢🐇 Fast & Slow Pointers — Floyd's Cycle Detection</div>
      <div style={{overflowX:"auto"}}>
        <svg width={400} height={170} style={{display:"block",maxWidth:"100%"}}>
          <defs>
            <marker id="fsArr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0 0L7 3L0 6z" fill="#2e3a4e"/>
            </marker>
          </defs>
          {nodes.map((n,i)=>{
            const nx=nextArr[i];
            const p1=pos[i],p2=pos[nx];
            const isCycle=i===5&&nx===3;
            return <line key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isCycle?"var(--r)":"#2e3a4e"}
              strokeWidth={1.5}
              strokeDasharray={isCycle?"6,3":"none"}
              markerEnd="url(#fsArr)"/>;
          })}
          {nodes.map((n,i)=>{
            const isSlow=slow===i, isFast=fast===i, isMet=met===i;
            const both=isSlow&&isFast;
            return(<g key={i}>
              <circle cx={pos[i].x} cy={pos[i].y} r={20}
                fill={isMet?"#2a1616":both?"#1e2a1e":isSlow?"#172a1f":isFast?"#161e2e":"var(--sur)"}
                stroke={isMet?"var(--r)":both?"var(--y)":isSlow?"var(--g)":isFast?"var(--b)":"var(--bdr)"}
                strokeWidth={isSlow||isFast||isMet?2:1}
                style={{transition:"all .4s"}}/>
              <text x={pos[i].x} y={pos[i].y+5} textAnchor="middle"
                fill={isMet?"var(--r)":both?"var(--y)":isSlow?"var(--g)":isFast?"var(--b)":"var(--tx)"}
                fontSize="13" fontWeight="800">{n.label}</text>
              {isSlow&&!both&&<text x={pos[i].x} y={pos[i].y-26} textAnchor="middle" fill="var(--g)" fontSize="14">🐢</text>}
              {isFast&&!both&&<text x={pos[i].x} y={pos[i].y-26} textAnchor="middle" fill="var(--b)" fontSize="14">🐇</text>}
              {both&&<text x={pos[i].x} y={pos[i].y-26} textAnchor="middle" fill="var(--y)" fontSize="14">💥</text>}
            </g>);
          })}
          <text x={305} y={165} fill="var(--r)" fontSize="9" fontWeight="700">← cycle!</text>
        </svg>
      </div>
      <div style={{display:"flex",gap:14,fontSize:10.5,color:"var(--mu)",marginBottom:6}}>
        <span style={{color:"var(--g)"}}>🐢 Slow (+1)</span>
        <span style={{color:"var(--b)"}}>🐇 Fast (+2)</span>
        <span style={{color:"var(--y)"}}>💥 Meet point</span>
        <span style={{color:"var(--r)"}}>--- Cycle back edge</span>
      </div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={animate} disabled={busy}>▶ Detect Cycle</button>
        <button className="btn btn-r" onClick={reset} disabled={busy}>↺ Reset</button>
      </div>
    </div>
  );
}

function TwoDDPViz() {
  const mountedRef=useRef(true);
  useEffect(()=>()=>{mountedRef.current=false;},[]);
  // Unique Paths: m x n grid
  const M=4,N=5;
  const [dp,setDp]=useState(()=>Array(M).fill(null).map(()=>Array(N).fill(null)));
  const [cur,setCur]=useState(null);
  const [log,setLog]=useState("Unique Paths: dp[i][j] = ways to reach cell (i,j). Only move right or down.");
  const [busy,setBusy]=useState(false);

  const animate=async()=>{
    if(busy)return; setBusy(true);
    const grid=Array(M).fill(null).map(()=>Array(N).fill(0));
    const newDp=Array(M).fill(null).map(()=>Array(N).fill(null));
    setDp(Array(M).fill(null).map(()=>Array(N).fill(null)));
    // Fill first row and col
    for(let i=0;i<M;i++){
      if(!mountedRef.current)return;
      grid[i][0]=1; newDp[i][0]=1;
      setCur([i,0]); setDp(newDp.map(r=>[...r]));
      setLog(`dp[${i}][0]=1: only one way to reach any cell in column 0 — go straight down`);
      await sleep(300);
    }
    for(let j=1;j<N;j++){
      if(!mountedRef.current)return;
      grid[0][j]=1; newDp[0][j]=1;
      setCur([0,j]); setDp(newDp.map(r=>[...r]));
      setLog(`dp[0][${j}]=1: only one way to reach any cell in row 0 — go straight right`);
      await sleep(300);
    }
    // Fill rest
    for(let i=1;i<M;i++){
      for(let j=1;j<N;j++){
        if(!mountedRef.current)return;
        grid[i][j]=grid[i-1][j]+grid[i][j-1];
        newDp[i][j]=grid[i][j];
        setCur([i,j]); setDp(newDp.map(r=>[...r]));
        setLog(`dp[${i}][${j}] = dp[${i-1}][${j}](${grid[i-1][j]}) + dp[${i}][${j-1}](${grid[i][j-1]}) = ${grid[i][j]}`);
        await sleep(400);
      }
    }
    if(!mountedRef.current)return;
    setCur(null);
    setLog(`✅ dp[${M-1}][${N-1}] = ${grid[M-1][N-1]} unique paths. 2D DP: O(m×n) time & space.`);
    setBusy(false);
  };

  return(
    <div className="vz"><div className="vz-title">🗺️ 2D Dynamic Programming — Unique Paths</div>
      <div style={{overflowX:"auto",marginBottom:8}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${N},1fr)`,gap:3,maxWidth:300}}>
          {Array(M).fill(0).map((_,i)=>Array(N).fill(0).map((_,j)=>{
            const val=dp[i]?.[j];
            const isCur=cur&&cur[0]===i&&cur[1]===j;
            return(
              <div key={`${i}-${j}`} style={{
                height:40,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                background:isCur?"#1e1a0a":val!==null?"#172a1f":"var(--sur)",
                border:`1.5px solid ${isCur?"var(--y)":val!==null?"var(--g)":"var(--bdr)"}`,
                fontSize:12,fontWeight:700,color:isCur?"var(--y)":val!==null?"var(--g)":"var(--mu)",
                transition:"all .3s",animation:isCur?"popIn .3s ease":"none"
              }}>
                {val!==null?val:"·"}
              </div>
            );
          }))}
        </div>
      </div>
      <div style={{fontSize:10.5,color:"var(--mu)",marginBottom:6}}>
        Recurrence: <span style={{fontFamily:"var(--fc)",color:"var(--b)"}}>dp[i][j] = dp[i-1][j] + dp[i][j-1]</span>
      </div>
      <div className="vz-log">{log}</div>
      <div className="vz-ctrl">
        <button className="btn btn-g" onClick={animate} disabled={busy}>▶ Fill DP Table</button>
        <button className="btn btn-r" onClick={()=>{setDp(Array(M).fill(null).map(()=>Array(N).fill(null)));setCur(null);setBusy(false);setLog("Reset.");}} disabled={busy}>↺ Reset</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ██  TOPIC & CONCEPT DATA
// ═══════════════════════════════════════════════════════════════
const TOPICS = [
  {id:"arrays",icon:"📦",title:"Arrays",color:"#4EFFA0",tag:"easy",desc:"Continuous memory. Instant index access.",analogy:"A row of numbered parking spots. Spot 4? Walk directly there — O(1). No searching.",aha:"Arrays are O(1) at reading, O(n) at inserting in the middle. Every data structure you'll learn was invented to fix one of those two problems.",
  intro:[
    "An array is a contiguous block of memory where all elements are stored side by side. When you write arr[4], your CPU computes the memory address with a single arithmetic formula: base_address + (4 × element_size). This calculation takes the exact same amount of time regardless of whether you access index 0 or index 99,999 — that is what O(1) random access means in practice.",
    "This memory layout is arrays' biggest strength and its main constraint. Reading or writing any element is instant. But inserting an element in the middle forces every element to the right to shift over by one position. In the worst case (inserting at index 0), every element in the array must move — that is O(n). Similarly, deleting from the middle requires shifting elements left to close the gap.",
    "In coding interviews, arrays appear in roughly 60% of all problems. Nearly every major pattern — Two Pointers, Sliding Window, Binary Search, Prefix Sum, Monotonic Stack — operates directly on arrays. Mastering how arrays behave in memory, and internalizing why each operation costs what it does, is the prerequisite to understanding every other data structure."
  ],
  keyPoints:[
    "Dynamic arrays (Python list, Java ArrayList, C++ vector) resize by doubling capacity when full — this makes append amortized O(1) even though occasional resizes are O(n).",
    "Arrays are cache-friendly: accessing arr[i] then arr[i+1] is fast because they sit next to each other in memory. Linked lists break this property — each pointer-hop is a potential cache miss.",
    "2D arrays (matrices) are stored as 1D arrays in row-major order. Element [r][c] is at index r × numCols + c in the flat array.",
    "Strings are arrays of characters. Every array pattern (two pointers, sliding window) applies directly to string problems.",
    "Off-by-one errors are the #1 array bug. Always trace through a small example (3–4 elements) to verify your loop bounds before coding."
  ],
  steps:[{num:"01",c:"#4EFFA0",title:"Indexing O(1)",desc:"CPU computes base_address+(index×size). Direct jump — same time for index 0 and 9999."},{num:"02",c:"#4EFFA0",title:"Traversal O(n)",desc:"Visit every element once — linear in size."},{num:"03",c:"#FFCC44",title:"Insert Middle O(n)",desc:"Everyone to the right must shift over. Worst case: insert at index 0."},{num:"04",c:"#4EFFA0",title:"Delete End O(1)",desc:"Just shrink the size pointer. No shifting."}],complexity:[{op:"Access by index",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always instant"},{op:"Search",b:"O(1)",a:"O(n)",w:"O(n)",n:"Scan from start"},{op:"Insert at end",b:"O(1)",a:"O(1)",w:"O(n)",n:"O(n) on resize"},{op:"Insert in middle",b:"O(n)",a:"O(n)",w:"O(n)",n:"Shift elements"},{op:"Delete from end",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always instant"}],Viz:ArrayViz},
  {id:"linked-list",icon:"🔗",title:"Linked List",color:"#5B8CFF",tag:"easy",desc:"Chain of nodes connected by pointers.",analogy:"A treasure hunt: Clue 1 tells you where Clue 2 is. You cannot jump to Clue 5 — you must follow each step.",aha:"O(1) insert/delete with a reference, O(n) random access. The opposite of arrays — knowing when to use which is your first real trade-off.",
  intro:[
    "A linked list solves the array's main weakness: O(n) insertion in the middle. Instead of one big contiguous block, a linked list is a chain of individual nodes scattered throughout memory. Each node contains two things: the actual value, and a pointer to the next node. The pointer is what links them — without it, the chain breaks.",
    "Because nodes can live anywhere in memory, insertion is simple: allocate a new node, set its next pointer to the node after the insertion point, and update the previous node's pointer. This is exactly 2 pointer operations — O(1), regardless of list size. No shifting required. But the trade-off is immediate: to find the 5th element, you must start at the HEAD and follow pointers one by one. There is no formula. Random access is O(n).",
    "The Doubly Linked List adds a prev pointer, enabling backward traversal and O(1) deletion without knowing the previous node. The famous LRU Cache problem combines a doubly linked list with a HashMap — the list maintains usage order, the map enables O(1) lookup. Together they achieve O(1) get and O(1) put, something neither can do alone."
  ],
  keyPoints:[
    "Three variants: Singly linked (one direction), Doubly linked (forward and backward), Circular (tail points back to head). Doubly linked is most flexible.",
    "Use a dummy head node (sentinel) to eliminate edge cases when inserting at or deleting from the head. Your logic stays the same for all positions.",
    "Floyd's Cycle Detection (fast and slow pointers) finds cycles in O(n) time and O(1) space — no HashSet needed. Fast moves 2 steps, slow moves 1.",
    "Reversing a linked list in-place uses three pointers: prev, curr, next. Draw the state before and after each step on paper before coding.",
    "Most linked list interview problems reduce to one of: pointer manipulation (reverse), two-pointer technique (find middle, detect cycle), or merging/sorting."
  ],
  steps:[{num:"01",c:"#5B8CFF",title:"Node Structure",desc:"Data + pointer to next node. No pointer = broken chain."},{num:"02",c:"#FFCC44",title:"Traversal O(n)",desc:"Hop from HEAD. No skipping. Walk the whole chain."},{num:"03",c:"#5B8CFF",title:"Prepend O(1)",desc:"newNode.next=HEAD; HEAD=newNode. 2 ops always."},{num:"04",c:"#5B8CFF",title:"Insert After O(1)",desc:"Rewire two pointers. No shifting."}],complexity:[{op:"Access by index",b:"O(1)",a:"O(n)",w:"O(n)",n:"No random access"},{op:"Search",b:"O(1)",a:"O(n)",w:"O(n)",n:"Traverse from HEAD"},{op:"Insert at HEAD",b:"O(1)",a:"O(1)",w:"O(1)",n:"2 pointer ops"},{op:"Insert at TAIL",b:"O(1)",a:"O(1)",w:"O(n)",n:"O(1) with tail ptr"},{op:"Delete at HEAD",b:"O(1)",a:"O(1)",w:"O(1)",n:"HEAD=HEAD.next"}],Viz:LinkedListViz},
  {id:"stack",icon:"🥞",title:"Stack",color:"#FFCC44",tag:"easy",desc:"LIFO — Last In, First Out.",analogy:"Cafeteria plates: add on top, take from top. Cannot grab from the middle. Last plate placed = first taken.",aha:"Reversals, matching pairs, undo, DFS — the Stack is your tool. Its constraint IS the algorithm.",
  intro:[
    "A stack enforces a single rule: the last element added is the first to be removed (LIFO — Last In, First Out). This seems like a restriction, but it is precisely what makes the stack powerful for problems involving nested or recursive structure.",
    "Whenever you encounter matching pairs — parentheses, HTML tags, function calls — a stack naturally models the relationship. Push when you open, pop and verify when you close. Your CPU itself uses a call stack: every function call pushes a new frame onto the stack, every return pops it. 'Stack overflow' is the literal error when this stack runs out of space.",
    "The stack is also the iterative equivalent of recursion. Every recursive DFS algorithm can be converted to an iterative version using an explicit stack. The recursive call stack and the explicit stack store exactly the same information — just in different places. Understanding this duality makes you more comfortable with both styles of code."
  ],
  keyPoints:[
    "Implemented on top of arrays (most languages) or linked lists. The implementation detail is irrelevant — push, pop, and peek are always O(1).",
    "Monotonic Stack: a stack where you maintain monotonically increasing or decreasing order. Used for 'next greater element' class of problems in O(n) instead of O(n²).",
    "Converting recursive DFS to iterative: push the starting node, then in a loop pop a node, process it, and push its unvisited neighbors. The call stack becomes explicit.",
    "Problems that signal 'use a stack': balanced brackets/parentheses, evaluate arithmetic expressions, implement undo/redo, DFS traversal, finding the largest rectangle.",
    "Never pop just to peek at the top element — use peek() or [-1] indexing. Popping destroys the element."
  ],
  steps:[{num:"01",c:"#FFCC44",title:"Push O(1)",desc:"Add to top. Constant time always."},{num:"02",c:"#FFCC44",title:"Pop O(1)",desc:"Remove from top. LIFO."},{num:"03",c:"#FFCC44",title:"Peek O(1)",desc:"Read top without removing."},{num:"04",c:"#5B8CFF",title:"Balanced Brackets",desc:"Push '(', pop on ')' and verify match. Elegant O(n)."}],complexity:[{op:"Push",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always"},{op:"Pop",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always"},{op:"Peek",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always"},{op:"Search",b:"O(1)",a:"O(n)",w:"O(n)",n:"Pop to find"}],Viz:StackViz},
  {id:"queue",icon:"🎫",title:"Queue",color:"#C084FC",tag:"easy",desc:"FIFO — First In, First Out.",analogy:"Ticket counter queue. First in line served first. Join the back, leave from the front. No cutting.",aha:"Level-order traversal, BFS, task scheduling — Queue ensures fairness. What came first is handled first.",
  intro:[
    "A queue enforces FIFO (First In, First Out): the first element added is the first removed. New elements join the rear; elements are removed from the front. This fairness property is exactly what problems involving levels, layers, or ordered processing require.",
    "BFS (Breadth-First Search) is fundamentally a queue algorithm. You enqueue the source node and mark it visited. Then repeatedly: dequeue a node, process it, and enqueue all its unvisited neighbors. The queue guarantees you fully explore all distance-1 nodes before any distance-2 node — which is precisely why BFS gives the shortest path in an unweighted graph. Swap the queue for a stack and you get DFS.",
    "Specialized queue variants expand what is possible. A Deque (double-ended queue) supports O(1) insert and remove at both ends — it enables the Sliding Window Maximum problem in O(n). A Priority Queue (Min-Heap) always removes the minimum element first — replacing the regular queue in BFS gives Dijkstra's shortest path algorithm for weighted graphs."
  ],
  keyPoints:[
    "Use collections.deque in Python, ArrayDeque in Java — not a regular list, which has O(n) removal from the front.",
    "BFS level tracking: record the queue size at the start of each level. Process exactly that many nodes before moving to the next level.",
    "Monotonic Deque: for Sliding Window Maximum, maintain a deque in decreasing order. Remove from front when out of window, remove from back when smaller than new element. O(n) total.",
    "Two stacks simulate a queue: one for enqueue, one for dequeue. When the dequeue stack is empty, pour all elements from the enqueue stack. Amortized O(1) per operation.",
    "BFS on a grid: neighbors are up/down/left/right cells. Add all 4 neighbors with a bounds check and visited check before enqueuing."
  ],
  steps:[{num:"01",c:"#C084FC",title:"Enqueue O(1)",desc:"Add to REAR. Always instant."},{num:"02",c:"#C084FC",title:"Dequeue O(1)",desc:"Remove from FRONT. Always instant."},{num:"03",c:"#C084FC",title:"Peek O(1)",desc:"View next without removing."},{num:"04",c:"#4EFFA0",title:"BFS uses Queue",desc:"Enqueue neighbors level by level — distance 1 before distance 2."}],complexity:[{op:"Enqueue",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always"},{op:"Dequeue",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always"},{op:"Peek",b:"O(1)",a:"O(1)",w:"O(1)",n:"Reference only"},{op:"Search",b:"O(1)",a:"O(n)",w:"O(n)",n:"Scan from front"}],Viz:QueueViz},
  {id:"hash-map",icon:"🗺️",title:"Hash Map",color:"#FF6B6B",tag:"medium",desc:"Key-value store. O(1) average access.",analogy:"Library magical index: tell the librarian the title, they compute exactly which shelf. No searching every shelf.",aha:"Duplicates, frequency counts, two-sum, group-by — the answer is almost always a HashMap. Memory for speed.",
  intro:[
    "A hash map (also called hash table or dictionary) stores key-value pairs with O(1) average access. The mechanism is a hash function: given any key, it computes an integer index into an underlying array (the bucket array). To retrieve a value, the map hashes the key and jumps directly to that bucket — same time for any key.",
    "Collisions occur when two different keys hash to the same bucket. The most common resolution is chaining: each bucket holds a linked list of key-value pairs. With a good hash function and a load factor (ratio of entries to buckets) below 0.75, chains stay short and average lookup remains O(1). When load factor exceeds the threshold, the array doubles in size and all keys are rehashed — O(n) cost, but rare enough that amortized performance stays O(1).",
    "The hash map is the most-used data structure in coding interviews after arrays. The core trade-off is memory for speed: you use extra space to eliminate repeated searching. Whenever you find yourself scanning an array repeatedly looking for a value, ask yourself: 'What if I could look that up in O(1)?' The answer is almost always to build a hash map first."
  ],
  keyPoints:[
    "Language shortcuts: Python dict / set, Java HashMap / HashSet, JavaScript Map / Set. Always use built-in implementations — they handle collision resolution and resizing for you.",
    "HashSet = HashMap where you only care about existence, not the value. Use it for O(1) membership checks and duplicate detection.",
    "Two Sum in O(n): iterate through the array; for each number, check if (target − number) is already in the map. If not, add the current number. One pass, O(1) lookup each step.",
    "Group Anagrams: the sorted version of a string is the same for all anagrams. Use sorted(word) as the HashMap key to group them together.",
    "Worst-case O(n) only if all keys collide (rare with good hash functions). Java's HashMap switches to a balanced tree within a bucket when chains get long, keeping worst-case O(log n)."
  ],
  steps:[{num:"01",c:"#FF6B6B",title:"Hash Function",desc:"hash(key)→bucket index. Good hash = uniform spread."},{num:"02",c:"#FF6B6B",title:"PUT O(1) avg",desc:"Compute hash, go to bucket, store (k,v). Collision? Use chaining."},{num:"03",c:"#FF6B6B",title:"GET O(1) avg",desc:"Compute hash, jump to bucket, scan. Usually 1 comparison."},{num:"04",c:"#FFCC44",title:"Rehashing",desc:"Load factor > 0.75 → double array, recompute all hashes. O(n) but amortized O(1)."}],complexity:[{op:"PUT",b:"O(1)",a:"O(1)",w:"O(n)",n:"Worst: all collide"},{op:"GET",b:"O(1)",a:"O(1)",w:"O(n)",n:"Worst: all collide"},{op:"DELETE",b:"O(1)",a:"O(1)",w:"O(n)",n:"Same as GET"},{op:"Search by value",b:"O(n)",a:"O(n)",w:"O(n)",n:"Scan all"}],Viz:HashMapViz},
  {id:"binary-tree",icon:"🌲",title:"Binary Tree",color:"#4EFFA0",tag:"medium",desc:"Hierarchical. Each node ≤ 2 children.",analogy:"Company org chart. CEO at top. Each manager has at most 2 reports. Navigate top-down — left or right at each level.",aha:"BST makes search O(log n) by enforcing left<root<right. Unbalanced degrades to O(n). AVL/Red-Black guarantee O(log n).",
  intro:[
    "A binary tree is a hierarchical data structure where each node has at most two children: a left child and a right child. Unlike arrays and linked lists which are linear, trees represent relationships with depth — parent-child hierarchies, decision trees, and sorted data structures.",
    "The Binary Search Tree (BST) adds an ordering rule: every value in a node's left subtree is strictly less than the node's value, and every value in the right subtree is strictly greater. This rule enables binary search on the tree: at each node, you can eliminate half of the remaining candidates by going left or right. Search, insert, and delete all become O(log n) — but only if the tree stays balanced.",
    "Balance is the critical concept. An unbalanced BST can degrade into a linked list (insert values 1, 2, 3, 4, 5 in order — every node becomes a right child). Search on this tree is O(n). Self-balancing trees like AVL and Red-Black trees automatically rebalance after each insert/delete, guaranteeing O(log n) height. Python's sortedcontainers and Java's TreeMap use Red-Black trees internally."
  ],
  keyPoints:[
    "Three DFS traversals: In-order (Left→Root→Right) gives sorted output for a BST. Pre-order (Root→Left→Right) serializes the tree. Post-order (Left→Right→Root) is used for deletion and size calculation.",
    "Tree height vs depth: height is measured from a node to the deepest leaf below it (height of a leaf = 0). Depth is measured from the root down to the node.",
    "Most tree problems use DFS with recursion. The call stack implicitly handles backtracking — each function call represents visiting one node.",
    "Level-order traversal uses BFS with a queue. Record the queue size at the start of each iteration to track when one level ends and the next begins.",
    "Lowest Common Ancestor (LCA): if target values are on opposite sides of a node, that node is the LCA. If both are on the same side, recurse in that direction."
  ],
  steps:[{num:"01",c:"#4EFFA0",title:"BST Property",desc:"Left subtree < root < right subtree at every node. Enables binary search."},{num:"02",c:"#4EFFA0",title:"In-order",desc:"Left→Root→Right. Always gives sorted output for BST."},{num:"03",c:"#5B8CFF",title:"Pre-order",desc:"Root→Left→Right. Copy or serialize a tree."},{num:"04",c:"#FFCC44",title:"Balance",desc:"Height = longest path. Balanced=O(log n), unbalanced=O(n)."}],complexity:[{op:"Search",b:"O(log n)",a:"O(log n)",w:"O(n)",n:"Worst: unbalanced"},{op:"Insert",b:"O(log n)",a:"O(log n)",w:"O(n)",n:"Find + link"},{op:"Delete",b:"O(log n)",a:"O(log n)",w:"O(n)",n:"Find + restructure"},{op:"Traversal",b:"O(n)",a:"O(n)",w:"O(n)",n:"Visit all nodes"}],Viz:BinaryTreeViz},
  {id:"heap",icon:"🏔️",title:"Heap / Priority Queue",color:"#FF9F5B",tag:"medium",desc:"Complete binary tree. O(log n) insert/extract.",analogy:"Hospital triage: patients don't enter by arrival time — the most critical (lowest/highest priority) is always treated first. The heap maintains this order automatically.",aha:"Top-K problems, median streams, Dijkstra's shortest path — whenever you need 'give me the minimum/maximum efficiently and repeatedly,' reach for a Heap.",
  intro:[
    "A heap is a complete binary tree (all levels fully filled except possibly the last, filled left to right) that satisfies the heap property: in a min-heap, every parent is less than or equal to both of its children. This guarantees the minimum element is always at the root — readable in O(1). Extracting it takes O(log n) to restore the heap property.",
    "The implementation insight: a heap is stored as a flat array, not an actual tree with pointers. For a node at index i, its left child is at index 2i+1, right child at 2i+2, and its parent at (i−1)÷2. This array-based encoding requires no extra memory for pointers, makes heaps cache-friendly, and is the reason 'heapify' (building a heap from an unsorted array) can be done in O(n) — faster than inserting elements one by one.",
    "The Priority Queue is the abstract interface; the heap is the most common implementation. Whenever a problem asks for repeated minimum or maximum extraction — top-K elements, median of a stream, Dijkstra's algorithm — the heap is the right tool. Two heaps together (one max-heap for the lower half, one min-heap for the upper half) can maintain a running median in O(log n) per insertion."
  ],
  keyPoints:[
    "Python: heapq is a min-heap only. For a max-heap, insert negative values and negate when reading. Java: PriorityQueue is min-heap by default; pass Comparator.reverseOrder() for max-heap.",
    "Build heap in O(n) using heapify (start from last non-leaf, sift down). Much faster than inserting n elements one by one which is O(n log n).",
    "Top-K largest pattern: use a min-heap of size K. For each new element, if it is larger than the heap's minimum, pop the minimum and push the new element. After all elements, the heap contains the K largest.",
    "Top-K smallest pattern: same idea with a max-heap of size K.",
    "Heap sort uses a max-heap: build heap in O(n), then repeatedly extract the max to the end of the array. In-place O(n log n) sort — but not stable and has poor cache behavior compared to merge sort."
  ],
  steps:[{num:"01",c:"#FF9F5B",title:"Heap Property",desc:"Min-heap: parent ≤ both children. Max-heap: parent ≥ both children. Root is always the min/max."},{num:"02",c:"#FF9F5B",title:"Insert O(log n)",desc:"Add to end of array. Bubble UP: swap with parent while heap property violated. At most log n swaps."},{num:"03",c:"#FF9F5B",title:"Extract Min O(log n)",desc:"Remove root. Move last element to root. Bubble DOWN: swap with smaller child until heap property satisfied."},{num:"04",c:"#4EFFA0",title:"Heapify O(n)",desc:"Build heap from an unsorted array in O(n) — more efficient than inserting n elements one by one (O(n log n))."}],complexity:[{op:"Insert",b:"O(1)",a:"O(log n)",w:"O(log n)",n:"Bubble up"},{op:"Extract min/max",b:"O(log n)",a:"O(log n)",w:"O(log n)",n:"Bubble down"},{op:"Peek min/max",b:"O(1)",a:"O(1)",w:"O(1)",n:"Always root"},{op:"Build heap",b:"O(n)",a:"O(n)",w:"O(n)",n:"Heapify"}],Viz:HeapViz},
  {id:"trie",icon:"🌳",title:"Trie (Prefix Tree)",color:"#C084FC",tag:"medium",desc:"Tree for strings. O(L) search by prefix.",analogy:"Autocomplete on your phone. Type 'ca' and it suggests 'cat', 'car', 'cake'. The trie stores all words as paths — each character is one step down the tree.",aha:"When you need prefix search, autocomplete, or spell-checking — Trie beats HashMap. O(L) search where L is word length, independent of how many words are stored.",
  intro:[
    "A Trie (pronounced 'try,' from re-trie-val) is a tree where each path from the root to a marked end-node spells out a stored word. Unlike a HashMap keyed on whole strings, a Trie shares common prefixes. The words 'cat' and 'car' both follow the path c→a before diverging into t and r. This sharing is the core property that makes Tries useful.",
    "Each node in a Trie typically holds two things: an array (or map) of up to 26 child pointers — one per letter — and a boolean flag isEnd marking whether the path to this node forms a complete word. Inserting a word walks down the tree character by character, creating nodes as needed, and sets isEnd on the last node. Searching works the same way, except you return false as soon as a needed child is missing.",
    "The critical difference from a HashMap: a Trie can answer prefix queries natively. 'Does any stored word start with the prefix ca?' means: traverse c→a and return true if that node exists at all — regardless of isEnd. A HashMap cannot answer this without scanning all keys. This makes Tries indispensable for autocomplete, spell-checking, IP routing tables, and the Word Search II problem where you prune the DFS early using trie branches."
  ],
  keyPoints:[
    "Standard node structure: children = array of 26 TrieNodes (or a dictionary for space efficiency), isEnd = boolean marking complete words.",
    "Search vs. startsWith: both traverse the same path. Search additionally checks isEnd at the final node. startsWith returns true as soon as all prefix characters are found.",
    "Word Search II (hard): add all words to a Trie, then run DFS on the grid. At each cell, check if the current path prefix exists in the Trie — prune immediately if it does not. This avoids O(W × 4^L) brute force.",
    "Space trade-off: worst case O(N × L × 26) nodes for N words of average length L. Compressed Tries (Patricia Tries, Radix Trees) merge chains of single-child nodes to save space.",
    "Trie vs. sorted array with binary search: Trie gives O(L) prefix lookup and O(L) insert. Sorted array gives O(log N + K) prefix lookup (find start, then scan K results) but O(N) insert. Choose based on read vs. write ratio."
  ],
  steps:[{num:"01",c:"#C084FC",title:"Node Structure",desc:"Each node has up to 26 children (one per letter) and an isEnd flag marking complete words."},{num:"02",c:"#C084FC",title:"Insert O(L)",desc:"Walk the trie character by character, creating nodes as needed. Mark the last node as a word end."},{num:"03",c:"#C084FC",title:"Search O(L)",desc:"Walk character by character. If any node is missing, the word/prefix doesn't exist."},{num:"04",c:"#4EFFA0",title:"Prefix Search",desc:"Search returns true even if you're in the middle of a word. Perfect for autocomplete — find all words sharing a prefix."}],complexity:[{op:"Insert",b:"O(L)",a:"O(L)",w:"O(L)",n:"L = word length"},{op:"Search",b:"O(L)",a:"O(L)",w:"O(L)",n:"L = word length"},{op:"Prefix search",b:"O(L)",a:"O(L)",w:"O(L)",n:"Faster than HashMap"},{op:"Space",b:"O(N×L)",a:"O(N×L)",w:"O(N×L)",n:"N words, length L"}],Viz:TrieViz},
  {id:"graph",icon:"🕸️",title:"Graphs",color:"#FF9F5B",tag:"hard",desc:"Nodes + edges. Model relationships.",analogy:"A city road map. Nodes = intersections. Edges = roads. BFS finds shortest route; DFS explores every possible path. Directed edges = one-way streets.",aha:"When a problem involves 'connected components', 'reachability', 'shortest path', or 'dependencies' — it's a graph problem. Recognize the structure first; the algorithm follows naturally.",
  intro:[
    "A graph is the most general data structure — it models arbitrary relationships between entities. Nodes (also called vertices) are the entities; edges are the connections between them. Unlike trees, which have a strict parent-child hierarchy with no cycles, graphs can have cycles, multiple paths between the same two nodes, and nodes with no connections at all.",
    "Graphs come in important variants. Directed graphs have one-way edges (Twitter follow: A follows B does not mean B follows A). Undirected graphs have two-way connections (Facebook friendship). Weighted graphs assign costs to edges (road distances, flight prices). Unweighted graphs treat all edges as equal. Directed Acyclic Graphs (DAGs) have directed edges and no cycles — they model dependencies and task scheduling.",
    "The two fundamental traversals are BFS (uses a queue, explores by distance) and DFS (uses a stack or recursion, goes deep before wide). BFS guarantees the shortest path in unweighted graphs — the first time you reach a node is via the shortest route. DFS is natural for detecting cycles, finding all paths, and topological sorting. The key discipline: always mark nodes as visited when first discovered to avoid infinite loops on cycles."
  ],
  keyPoints:[
    "Two representations: Adjacency List (array of neighbor lists, O(V+E) space — use for sparse graphs) and Adjacency Matrix (V×V grid of booleans/weights, O(V²) space — use for dense graphs or when you need O(1) edge existence checks).",
    "Mark nodes visited when they are first enqueued (BFS) or pushed (DFS), not when they are processed. Waiting until processing allows the same node to be added to the queue multiple times.",
    "Connected components: count how many times you start a fresh BFS/DFS from an unvisited node. Each fresh start = one new component.",
    "Bipartite check: try to 2-color the graph with BFS. Assign alternating colors to neighbors. If any neighbor already has the same color as the current node, the graph is not bipartite.",
    "In-degree is the number of edges pointing into a node. Topological sort (Kahn's algorithm) starts from all nodes with in-degree 0 — they have no prerequisites and can be processed first."
  ],
  steps:[{num:"01",c:"#FF9F5B",title:"BFS — Level by Level",desc:"Queue-based. Explores all nodes at distance 1, then 2, etc. Guarantees shortest path in unweighted graphs."},{num:"02",c:"#FF9F5B",title:"DFS — Depth First",desc:"Stack/recursion. Follows one path to its end before backtracking. Natural for cycle detection and topological sort."},{num:"03",c:"#FFCC44",title:"Adjacency List",desc:"Store graph as array of neighbor lists. Space-efficient for sparse graphs (most real-world graphs)."},{num:"04",c:"#4EFFA0",title:"Always Track Visited",desc:"Without a visited set, BFS/DFS loops forever on cycles. Mark visited when first discovered, not processed."}],complexity:[{op:"BFS/DFS",b:"O(V+E)",a:"O(V+E)",w:"O(V+E)",n:"V=vertices, E=edges"},{op:"Space (adj list)",b:"O(V+E)",a:"O(V+E)",w:"O(V+E)",n:"Efficient"},{op:"Space (matrix)",b:"O(V²)",a:"O(V²)",w:"O(V²)",n:"Dense graphs only"}],Viz:GraphViz},
];

const CONCEPTS = [
  {id:"two-pointer",icon:"👆",title:"Two Pointers",color:"#4EFFA0",tag:"Arrays",difficulty:"Easy–Medium",tagline:"Two indices moving toward each other (or same direction) to avoid nested loops.",FastSlowViz:FastSlowViz,
    intro:[
      "The brute-force solution to 'find a pair with target sum' is two nested loops — O(n²). Two Pointers eliminates the inner loop entirely. Instead of checking every possible pair, you use the sorted order of the array to make a smart decision at each step: if the current pair sum is too small, the only way to increase it is to move the left pointer right. If too large, move the right pointer left. Each step eliminates a whole chunk of possibilities.",
      "There are two variants. Opposite-direction: start L=0 and R=n-1, converge toward the middle. Used for pair/triplet sum problems and palindrome checks. Same-direction (slow/fast): both start at 0 but move at different rates. Used for removing duplicates or partitioning. Both variants guarantee O(n) time and O(1) extra space — a huge upgrade from O(n²) brute force."
    ],
    whenToUse:[
      "The problem involves finding a pair or triplet in a sorted array that meets a condition (sum equals target, difference equals k, etc.)",
      "You need to check if a string is a palindrome or compare characters from both ends",
      "The problem asks to 'remove duplicates' or 'partition' an array in-place",
      "You are about to write two nested for-loops on a sorted structure — stop and think Two Pointers"
    ],
    analogy:"Squeezing a toothpaste tube from both ends toward the middle. One hand pushes from left, the other from right. Stop when they meet.",
    aha:"Converts O(n²) nested loops into O(n) single pass on sorted arrays. The key: sorted order lets you make directional decisions without re-scanning.",
    steps:[
      {c:"#4EFFA0",title:"Sort first (if needed)",desc:"Two Pointers requires sorted order to make directional decisions. If unsorted, sort it first — that's O(n log n), still better than O(n²)."},
      {c:"#4EFFA0",title:"Place pointers",desc:"Opposite-direction: L=0, R=len-1. Same-direction: slow=0, fast=0 (or fast=1)."},
      {c:"#FFCC44",title:"Evaluate and decide",desc:"Compute the value (sum, difference, comparison). Too small → move L right (increases value). Too large → move R left (decreases value). Equal → record answer."},
      {c:"#4EFFA0",title:"Loop until pointers meet",desc:"Continue while L < R (opposite) or fast < len (same-direction). Each iteration does O(1) work, so total is O(n)."}
    ],
    keyPoints:[
      "Always ask: is the array sorted? If not, can I sort it? Two Pointers without sorted order usually does not work.",
      "For 3Sum: fix the first number with a for loop, then run Two Pointers on the remaining subarray. Reduces O(n³) → O(n²).",
      "For palindrome check: L=0, R=len-1. Compare arr[L] and arr[R]. If equal, L++ R--. If not equal, not a palindrome. Stop when L >= R.",
      "Skip duplicates explicitly in 3Sum/4Sum to avoid duplicate triplets in the result: while L < R and arr[L] == arr[L-1]: L++.",
      "Time: O(n) after sorting. Space: O(1). Always explain this trade-off when presenting your solution."
    ],
    Viz:null,problems:["Two Sum II","3Sum","Container With Most Water","Trapping Rain Water","Valid Palindrome"]},
  {id:"sliding-window",icon:"🪟",title:"Sliding Window",color:"#5B8CFF",tag:"Arrays/Strings",difficulty:"Easy–Hard",tagline:"Maintain a window over subarrays, expanding right and shrinking left.",
    intro:[
      "The naive solution to 'longest substring without repeating characters' checks every possible substring — O(n²) or worse. Sliding Window avoids this by reusing work: instead of recomputing the whole window from scratch, you just add one element on the right and optionally remove one on the left. The window slides forward, never going backward.",
      "There are two types. Fixed-size window: the window size k is given — slide one step at a time, add the new right element and subtract the old left element. Variable-size window: the window grows by moving right, and shrinks by moving left only when a constraint is violated. The right pointer always moves forward, so the total number of pointer movements across the entire array is O(n). That is why it beats O(n²)."
    ],
    whenToUse:[
      "The problem asks for the longest or shortest subarray/substring that satisfies some condition",
      "The problem gives a fixed window size k and asks for max/min/average over all windows",
      "Keywords in the problem: 'contiguous subarray', 'substring', 'consecutive elements'",
      "You are about to write a nested loop to check every possible subarray — Sliding Window likely applies"
    ],
    analogy:"Looking through a train window of fixed width. New scenery enters from the right, old leaves from the left. You never go backward.",
    aha:"Reuse the previous window's computation — add one element, subtract one. Turns O(n²) subarray problems into O(n).",
    steps:[
      {c:"#5B8CFF",title:"Initialize window state",desc:"start=0. Prepare whatever state the window needs: a running sum, a HashMap counting characters, a set of seen values, etc."},
      {c:"#5B8CFF",title:"Expand: move end right",desc:"For end from 0 to n-1: add arr[end] to window state. This grows the window by one element."},
      {c:"#FFCC44",title:"Shrink: move start right (variable window)",desc:"While the window violates the constraint: remove arr[start] from window state, start++. Repeat until the window is valid again."},
      {c:"#5B8CFF",title:"Record the answer",desc:"After each shrink step, the window is valid. Update your answer: max(answer, end-start+1) or whatever metric you are tracking."}
    ],
    keyPoints:[
      "Fixed window (size k): initialize window on first k elements. Then for i from k to n-1: add arr[i], subtract arr[i-k], update answer.",
      "Variable window state: use a HashMap for character frequency counts (Minimum Window Substring), a Set for uniqueness (Longest Substring Without Repeating), or a plain integer for sums.",
      "The shrink loop is a while-loop, not an if-statement. You may need to shrink more than once before the window becomes valid.",
      "Right pointer always moves forward — it never goes back. This is what makes the total time O(n) despite the nested-looking code.",
      "Common mistake: forgetting to remove arr[start] from the window state when shrinking. Always update state BEFORE or AS you move start."
    ],
    Viz:null,problems:["Best Time to Buy/Sell Stock","Longest Substring Without Repeating Chars","Min Window Substring","Sliding Window Maximum","Permutation in String"]},
  {id:"binary-search-algo",icon:"🔍",title:"Binary Search",color:"#FFCC44",tag:"Arrays/Search",difficulty:"Easy–Hard",tagline:"Eliminate half the search space at every step.",
    intro:[
      "Most people learn binary search as 'search for a target in a sorted array.' That is too narrow. Binary search works on any monotonic search space — any space where there is a clear boundary between 'condition is false' and 'condition is true.' You do not need an actual sorted array. You need the ability to look at any midpoint and decide: is the answer to the left or to the right?",
      "The advanced form is 'binary search on the answer': instead of searching an array, you define a range of possible answers (lo=minimum possible, hi=maximum possible). Then for each midpoint, you ask 'is mid a valid answer?' and move accordingly. Koko Eating Bananas, Capacity to Ship Packages, and Find Minimum in Rotated Array are all this pattern in disguise."
    ],
    whenToUse:[
      "The array is sorted and you need to find a target value or its insertion position",
      "The problem asks for the minimum value that satisfies a condition, or maximum value that does not violate one",
      "The input space is large (up to 10^9) and brute force would be too slow — binary search on the answer",
      "Keywords: 'minimum time/speed/capacity such that...', 'find the first/last position of...'"
    ],
    analogy:"Guess a number 1-100. 'Higher/lower'? Always guess the middle (50). 7 guesses max for 100 numbers — that's O(log n).",
    aha:"Not just for finding a target. Any 'find minimum satisfying condition on monotonic space' problem can use binary search. Koko Eating Bananas is binary search in disguise.",
    steps:[
      {c:"#FFCC44",title:"Define the search space",desc:"For array search: lo=0, hi=n-1. For 'binary search on answer': lo=minimum possible answer, hi=maximum possible answer."},
      {c:"#FFCC44",title:"Compute mid safely",desc:"mid = lo + (hi-lo)//2. Avoid (lo+hi)//2 which can overflow in some languages when lo and hi are large."},
      {c:"#FFCC44",title:"Check mid and decide direction",desc:"If condition(mid) is satisfied: this might be the answer, but search left for something better — hi=mid. If not satisfied: must go right — lo=mid+1."},
      {c:"#4EFFA0",title:"Loop terminates at lo==hi",desc:"At this point lo is your answer. Each iteration halves the space — total O(log n) iterations regardless of input size."}
    ],
    keyPoints:[
      "The template that avoids off-by-one bugs: while lo < hi: mid=lo+(hi-lo)//2. If good(mid): hi=mid. Else: lo=mid+1. Return lo.",
      "Decide which direction is 'shrink toward answer.' For 'find minimum satisfying condition': hi=mid when satisfied, lo=mid+1 when not.",
      "For 'find exact target': if arr[mid]==target return mid. If arr[mid]<target: lo=mid+1. If arr[mid]>target: hi=mid-1.",
      "Rotated sorted array: identify which half is sorted by checking arr[lo] vs arr[mid]. The sorted half lets you decide which side the target is on.",
      "Binary search on answer example — Koko Eating Bananas: lo=1, hi=max(piles). For each speed mid: can Koko finish in h hours? If yes: hi=mid. If no: lo=mid+1."
    ],
    Viz:BinarySearchAlgoViz,problems:["Binary Search","Search 2D Matrix","Koko Eating Bananas","Find Min in Rotated Array","Median of Two Sorted Arrays"]},
  {id:"prefix-sum",icon:"➕",title:"Prefix Sum",color:"#4EFFA0",tag:"Arrays",difficulty:"Easy–Medium",tagline:"Precompute cumulative sums to answer range queries in O(1).",
    intro:[
      "Prefix Sum is a preprocessing technique: spend O(n) time once to build a cumulative sum array, then answer any 'sum of elements from index L to R' query in O(1) time. Without it, every range query requires scanning the subarray — O(n) per query, O(n²) total for n queries. With it, every query is one subtraction.",
      "The formula is: sum(L, R) = prefix[R+1] - prefix[L], where prefix[i] = sum of the first i elements (prefix[0]=0). The magic comes from the 'Subarray Sum Equals K' variant: if prefix[j] - prefix[i] = K, then the subarray from i to j-1 has sum K. By storing prefix sums in a HashMap as you go, you can count these pairs in a single O(n) pass."
    ],
    whenToUse:[
      "The problem asks for sum of elements in a range [L, R] — especially if there are many such queries",
      "The problem involves 'number of subarrays with sum equal to K' or 'find subarray with given sum'",
      "You are working with a 2D grid and need sums of rectangular sub-regions",
      "The word 'cumulative' appears, or you need running totals"
    ],
    analogy:"Bank statement running balance. Instead of adding up transactions for each query, your bank precomputes cumulative totals. Range sum for any period = one subtraction.",
    aha:"Build once O(n), query any range in O(1). prefix[R+1]-prefix[L] gives sum of arr[L..R]. Essential for subarray sum problems and 2D grid problems.",
    steps:[
      {c:"#4EFFA0",title:"Build prefix array",desc:"prefix = [0] * (n+1). For i from 1 to n: prefix[i] = prefix[i-1] + arr[i-1]. The extra 0 at the start simplifies edge cases."},
      {c:"#4EFFA0",title:"Range query in O(1)",desc:"sum(L, R) = prefix[R+1] - prefix[L]. Test with a small example: arr=[1,2,3,4], sum(1,2) = prefix[3]-prefix[1] = 6-1 = 5. Correct."},
      {c:"#FFCC44",title:"Subarray Sum = K (HashMap trick)",desc:"Use a HashMap: counts[prefix_sum] = how many times this prefix sum appeared. For each new prefix sum p: add counts[p-K] to answer. Then counts[p]++."},
      {c:"#4EFFA0",title:"2D prefix sum",desc:"prefix[r][c] = arr[r][c] + prefix[r-1][c] + prefix[r][c-1] - prefix[r-1][c-1]. Then any rectangle sum is 4 lookups."}
    ],
    keyPoints:[
      "Always make prefix array length n+1 with prefix[0]=0. This avoids special-casing the query when L=0.",
      "Subarray Sum Equals K — initialize counts={0:1} before the loop. The {0:1} handles subarrays starting from index 0 that already equal K.",
      "Product of Array Except Self uses the same idea but with products: build a left-product array and a right-product array, multiply them.",
      "For Maximum Subarray (Kadane's): the recurrence is dp[i] = max(arr[i], dp[i-1]+arr[i]). This is a DP, but conceptually you are tracking the best running sum.",
      "Prefix sum only works for range SUM queries (addition). For range MIN/MAX queries you need a Segment Tree or Sparse Table."
    ],
    Viz:PrefixSumViz,problems:["Range Sum Query","Subarray Sum Equals K","Product of Array Except Self","Maximum Subarray","2D Range Sum Query"]},
  {id:"monotonic-stack",icon:"📉",title:"Monotonic Stack",color:"#FF9F5B",tag:"Arrays",difficulty:"Medium",tagline:"Stack that maintains monotonic (always increasing or decreasing) order.",
    intro:[
      "A Monotonic Stack is a regular stack with one extra rule: you maintain its contents in monotonically increasing or decreasing order. When a new element arrives that would violate the order, you pop elements off the stack until the order is restored, then push the new element. The critical insight: each pop event is the answer to a question about the popped element.",
      "For 'Next Greater Element': maintain a decreasing stack (largest on bottom). When you encounter element X, pop all elements smaller than X — X is their 'next greater element.' This solves a problem that naively requires O(n²) in a single O(n) pass. Each element is pushed once and popped at most once — total O(n) operations."
    ],
    whenToUse:[
      "The problem asks for the 'next greater element', 'next smaller element', 'previous greater', or 'previous smaller' for each element",
      "Keywords: 'daily temperatures', 'how many days until', 'visible buildings', 'span of stock price'",
      "The problem involves histograms or height-based area calculations (Largest Rectangle, Trapping Rain Water)",
      "You need to find the nearest element to the left or right that is larger or smaller than the current one"
    ],
    analogy:"Imagine a line of people at a concert. Everyone can only see past people shorter than them. Whenever a taller person arrives, shorter people behind them give up — they pop off. The stack always holds people in height order.",
    aha:"Whenever a problem asks 'next greater/smaller element' or 'how many days until warmer temperature' — monotonic stack solves it in O(n) vs O(n²) brute force.",
    steps:[
      {c:"#FF9F5B",title:"Decide stack order",desc:"Next Greater Element → decreasing stack (pop when current > top). Next Smaller → increasing stack (pop when current < top). Push indices, not values."},
      {c:"#FF9F5B",title:"Pop = answer found",desc:"When you pop index i because of current index j: answer[i] = arr[j]. That popped element finally found its 'next greater/smaller' — it is arr[j]."},
      {c:"#FFCC44",title:"Push current index",desc:"After all invalid elements are popped, push the current index. Storing indices (not values) lets you compute distances for problems like Daily Temperatures."},
      {c:"#4EFFA0",title:"Handle remaining",desc:"After the loop, everything still in the stack found no next greater/smaller. Set answer[i] = -1 or 0 for those indices."}
    ],
    keyPoints:[
      "Always push INDICES onto the stack, not values. You need the index to compute distances (answer[i] = j - i for Daily Temperatures) and to access the value as arr[stack[-1]].",
      "Daily Temperatures recipe: decreasing stack. For each day j: while stack and temperatures[j] > temperatures[stack[-1]]: i=stack.pop(), result[i]=j-i. stack.append(j).",
      "Largest Rectangle in Histogram: increasing stack. For each bar, pop taller bars when a shorter one arrives. The width of the rectangle for the popped bar = current_index - stack[-1] - 1.",
      "Trapping Rain Water: for each position, water level = min(max_left, max_right) - height[i]. Use two-pass prefix max arrays, or monotonic stack.",
      "The total time is O(n) because each element is pushed exactly once and popped at most once — the while loop's total work across all iterations is bounded by n pops."
    ],
    Viz:MonotonicStackViz,problems:["Daily Temperatures","Next Greater Element","Largest Rectangle in Histogram","Trapping Rain Water","Car Fleet"]},
  {id:"bfs-dfs",icon:"🕸️",title:"BFS & DFS",color:"#C084FC",tag:"Graphs/Trees",difficulty:"Medium–Hard",tagline:"BFS explores level by level (Queue). DFS goes deep first (Stack/recursion).",
    intro:[
      "BFS and DFS are the two fundamental ways to traverse a graph or tree. They differ in one thing: the data structure. BFS uses a queue (FIFO) — it processes all nodes at distance 1 before distance 2, distance 2 before distance 3, and so on. DFS uses a stack or recursion (LIFO) — it follows one path as deep as it can go before backtracking and trying the next path.",
      "BFS is your go-to for shortest path in unweighted graphs. Because it explores by distance, the first time BFS reaches a node is guaranteed to be via the shortest route. DFS is natural for trees, connected component discovery, cycle detection, and backtracking. For grid problems (Number of Islands), both work — use BFS if you need shortest path, DFS if you just need to explore a region. Always track visited nodes to prevent infinite loops."
    ],
    whenToUse:[
      "BFS: shortest path or minimum steps in an unweighted graph or grid",
      "BFS: 'level by level' processing of a tree (level-order traversal, minimum depth)",
      "DFS: detect if a path exists between two nodes, count connected components, find all paths",
      "DFS: tree problems where you need to process children before the parent (post-order), or parent before children (pre-order)"
    ],
    analogy:"BFS: visiting a city all streets 1 block away before 2 blocks. DFS: following one street as far as possible before backtracking.",
    aha:"BFS guarantees shortest path in unweighted graphs. DFS is natural for trees, cycle detection, backtracking. The choice between them is the first graph algorithm decision.",
    steps:[
      {c:"#C084FC",title:"Build the graph",desc:"Convert the input to an adjacency list: graph = collections.defaultdict(list). For each edge [u,v]: graph[u].append(v); graph[v].append(u). For grids, neighbors are the 4 (or 8) adjacent cells."},
      {c:"#C084FC",title:"BFS template",desc:"queue=deque([start]); visited={start}. While queue: node=queue.popleft(). For each neighbor: if not visited: visited.add(neighbor); queue.append(neighbor)."},
      {c:"#FFCC44",title:"DFS template",desc:"def dfs(node): visited.add(node). For each neighbor: if not visited: dfs(neighbor). — Or iteratively: stack=[start]; while stack: node=stack.pop(); for each unvisited neighbor: push it."},
      {c:"#4EFFA0",title:"Mark visited WHEN DISCOVERED",desc:"Add to visited when you enqueue/push the node — NOT when you dequeue/pop it. Otherwise the same node gets added to the queue multiple times, causing O(n²) work."}
    ],
    keyPoints:[
      "Number of Islands: for each unvisited '1' cell, run DFS/BFS to mark the whole island as visited. Count how many times you start fresh.",
      "BFS level tracking: record queue size at start of each level. Process exactly that many nodes before incrementing the level counter.",
      "Grid DFS: check bounds BEFORE recursing — if r<0 or r>=rows or c<0 or c>=cols or grid[r][c]!='1': return.",
      "For cycle detection in undirected graphs with DFS: track the parent node. If you see a visited neighbor that is NOT the parent, you found a cycle.",
      "Word Ladder (BFS on implicit graph): each word is a node. Two words are neighbors if they differ by exactly one letter. BFS finds shortest transformation sequence."
    ],
    Viz:null,problems:["Number of Islands","Course Schedule","Pacific Atlantic Water Flow","Word Ladder","Clone Graph"]},
  {id:"union-find",icon:"🔗",title:"Union-Find",color:"#FF6B6B",tag:"Graphs",difficulty:"Medium",tagline:"Track connected components efficiently. Union merges groups; Find identifies them.",
    intro:[
      "Union-Find (also called Disjoint Set Union) is a data structure for grouping elements into non-overlapping sets. It supports two operations: find(x) which returns the representative ('root') of x's group, and union(x,y) which merges the groups of x and y. Both operations run in nearly O(1) amortized time with two optimizations: path compression and union by rank.",
      "The key technique — path compression — makes find() extremely fast. When you call find(x) and follow the chain of parents up to the root, you then flatten the chain: set every node's parent directly to the root. Future calls to find() on those same nodes skip the chain entirely. Combined with union by rank (always attaching the shorter tree under the taller), the tree stays almost completely flat."
    ],
    whenToUse:[
      "The problem asks to count connected components in a graph, or asks if two nodes are in the same component",
      "The problem involves merging groups dynamically as you process edges one by one",
      "Cycle detection in an undirected graph: before adding an edge, check if both endpoints are already connected",
      "Keywords: 'accounts merge', 'friend groups', 'redundant connection', 'number of provinces'"
    ],
    analogy:"Social network: if A knows B and B knows C, they're all in the same friend group. Union-Find tracks these groups — merge two groups (Union) or check if two people are connected (Find).",
    aha:"Number of connected components, detecting cycles in undirected graphs, Kruskal's MST — whenever the problem is about grouping or connectivity, Union-Find beats BFS/DFS in simplicity.",
    steps:[
      {c:"#FF6B6B",title:"Initialize",desc:"parent[i] = i (each node is its own parent/root). rank[i] = 0 (all trees start with height 0). components = n (n separate groups initially)."},
      {c:"#FF6B6B",title:"find(x) with path compression",desc:"If parent[x] != x: parent[x] = find(parent[x]). Return parent[x]. This recursively flattens the path to root — future calls are O(1)."},
      {c:"#FFCC44",title:"union(x, y) by rank",desc:"rootX=find(x), rootY=find(y). If rootX==rootY: already connected, return False. Attach shorter tree under taller (by rank). components--. Return True."},
      {c:"#4EFFA0",title:"Cycle detection",desc:"For each edge (u,v): if find(u)==find(v): adding this edge creates a cycle! This is how 'Redundant Connection' is solved — the first edge that connects two already-connected nodes."}
    ],
    keyPoints:[
      "Full Python template: parent=[i for i in range(n)]; rank=[0]*n. def find(x): if parent[x]!=x: parent[x]=find(parent[x]); return parent[x]. def union(x,y): rx,ry=find(x),find(y); if rx==ry: return; if rank[rx]<rank[ry]: rx,ry=ry,rx; parent[ry]=rx; if rank[rx]==rank[ry]: rank[rx]+=1.",
      "Count components: initialize components=n. Every successful union (where find(x)!=find(y)) decrements components by 1.",
      "Accounts Merge: for each account, union all emails to the first email. Group emails by their root. Rebuild accounts.",
      "Union-Find vs BFS/DFS for components: Union-Find is faster when you process edges one at a time and need dynamic connectivity. BFS/DFS is simpler when the full graph is known upfront.",
      "Path compression alone makes find() O(log n). Combined with union by rank it becomes O(α(n)) — effectively O(1) for all practical inputs."
    ],
    Viz:UnionFindViz,problems:["Number of Connected Components","Graph Valid Tree","Redundant Connection","Accounts Merge","Most Stones Removed"]},
  {id:"topological-sort",icon:"📋",title:"Topological Sort",color:"#FFCC44",tag:"Graphs/DAG",difficulty:"Medium",tagline:"Order nodes of a DAG so all edges point forward. Course prerequisites.",Viz:TopologicalSortViz,
    intro:[
      "Topological sort produces a linear ordering of nodes in a Directed Acyclic Graph (DAG) such that for every directed edge u→v, node u comes before v in the ordering. It answers the question: 'given a set of tasks with dependencies, in what order should I do them?' If any cycle exists in the graph, no valid ordering is possible — topological sort detects this automatically.",
      "The most common algorithm is Kahn's algorithm (BFS-based). Start by computing the in-degree (number of incoming edges) of every node. Nodes with in-degree 0 have no prerequisites and can be processed first. Each time you process a node, you decrement the in-degree of its neighbors. When a neighbor's in-degree reaches 0, it is now ready and gets added to the queue. If you process all n nodes, you have a valid ordering. If fewer than n nodes get processed, there is a cycle."
    ],
    whenToUse:[
      "The problem involves tasks with dependencies: 'finish A before B', 'take prerequisite X before course Y'",
      "The problem asks if a set of dependencies can be satisfied, or asks for a valid execution order",
      "Keywords: 'course schedule', 'prerequisites', 'build order', 'alien dictionary', 'task dependencies'",
      "You need to detect a cycle in a directed graph"
    ],
    analogy:"Building a house: foundation before walls, walls before roof. Each task depends on previous ones. Topological sort finds a valid build order — or tells you it's impossible (cycle = deadlock).",
    aha:"Course Schedule, build systems, package managers, task scheduling — any 'do X before Y' problem is topological sort. Cycle in the graph = impossible ordering.",
    steps:[
      {c:"#FFCC44",title:"Build adjacency list + in-degrees",desc:"graph = defaultdict(list). indegree = [0]*n. For each prerequisite [a,b] (b must come before a): graph[b].append(a); indegree[a]++."},
      {c:"#FFCC44",title:"Enqueue all zero-indegree nodes",desc:"queue = deque of all nodes where indegree[node]==0. These are the starting points — they have no prerequisites."},
      {c:"#FFCC44",title:"Process and decrement",desc:"While queue: node=queue.popleft(); result.append(node). For each neighbor of node: indegree[neighbor]--. If indegree[neighbor]==0: queue.append(neighbor)."},
      {c:"#FF6B6B",title:"Cycle check",desc:"After the loop: if len(result)==n: valid ordering found (return result or True). Else: a cycle exists — return [] or False."}
    ],
    keyPoints:[
      "Course Schedule I (can finish?): build graph, run Kahn's, return len(result)==numCourses.",
      "Course Schedule II (return order): same thing, but return the result array itself.",
      "Alien Dictionary: build the graph by comparing adjacent words character by character. The first differing character gives an edge. Then topological sort.",
      "DFS-based topological sort: run DFS, and append each node to the result AFTER all its descendants are processed. Reverse the result at the end.",
      "If the problem says 'detect cycle in directed graph' — topological sort is one clean solution. If processed < total nodes, there is a cycle."
    ],
    problems:["Course Schedule","Course Schedule II","Alien Dictionary","Find Order","Parallel Courses"]},
  {id:"dp",icon:"🧩",title:"Dynamic Programming",color:"#FF6B6B",tag:"Optimization",difficulty:"Medium–Hard",tagline:"Break into overlapping subproblems. Solve each once, cache the result.",Viz2D:TwoDDPViz,
    intro:[
      "Dynamic Programming (DP) solves problems by breaking them into smaller subproblems, solving each subproblem exactly once, and storing the result so it is not recomputed. It applies when two conditions hold: (1) Overlapping subproblems — the same smaller problem is needed multiple times. (2) Optimal substructure — the optimal solution to the whole problem can be built from optimal solutions to its parts.",
      "The learning path for DP has three stages. Stage 1: write a plain recursive brute-force solution. Stage 2: add memoization — a dictionary that caches results, so each subproblem is computed at most once (top-down DP). Stage 3: convert to a bottom-up table — compute subproblems in order from smallest to largest, eliminating recursion entirely (tabulation). The most important step is Stage 1: if you cannot write the recursion, you cannot write the DP."
    ],
    whenToUse:[
      "The problem asks for a count, maximum, minimum, or boolean (can it be done?) — not an enumeration of all possibilities",
      "You try brute-force recursion and notice the same subproblem being solved multiple times with the same arguments",
      "Keywords: 'number of ways to...', 'minimum cost to...', 'longest...', 'can you reach...', 'maximum profit...'",
      "The problem has a clear 'choice' at each step: include or exclude, buy or skip, take or leave"
    ],
    analogy:"Climbing stairs: ways to reach step 10 = ways(9) + ways(8). Notice ways(8) is needed twice — DP caches it. Memoization = top-down cache; Tabulation = bottom-up table.",
    aha:"Two conditions: overlapping subproblems + optimal substructure. If both → DP. Start with brute-force recursion, add memoization, then convert to tabulation.",
    steps:[
      {c:"#FF6B6B",title:"Step 1: write the recursion",desc:"Identify the choice at each step. Write solve(i) = f(solve(i-1), solve(i-2), ...). Do not worry about efficiency yet. Make it correct first."},
      {c:"#FF6B6B",title:"Step 2: add memoization",desc:"Add a cache dictionary. At the start of solve(i): if i in cache: return cache[i]. At the end: cache[i] = result; return result. This is top-down DP."},
      {c:"#FFCC44",title:"Step 3: define dp array and base cases",desc:"dp[i] = the answer for subproblem of size i. Fill in the base cases (smallest subproblems you know without computing): dp[0]=..., dp[1]=..."},
      {c:"#4EFFA0",title:"Step 4: fill bottom-up",desc:"For i from 2 to n: dp[i] = the recurrence from Step 1, using dp[i-1], dp[i-2], etc. Return dp[n]. This eliminates recursion and call-stack overhead."}
    ],
    keyPoints:[
      "Define dp[i] in plain English before writing a single line of code. 'dp[i] = minimum cost to reach step i.' Precision here determines everything that follows.",
      "House Robber recurrence: dp[i] = max(dp[i-1], dp[i-2] + nums[i]). In English: rob house i (add nums[i] to dp[i-2]) vs skip it (take dp[i-1]).",
      "Coin Change recurrence: dp[i] = min(dp[i - coin] + 1) for each coin. If dp[i-coin] is unreachable, skip that coin.",
      "2D DP (Longest Common Subsequence): dp[i][j] = length of LCS of first i chars of s and first j chars of t. If s[i-1]==t[j-1]: dp[i][j]=dp[i-1][j-1]+1. Else: dp[i][j]=max(dp[i-1][j], dp[i][j-1]).",
      "Space optimization: if dp[i] only depends on dp[i-1] and dp[i-2], you only need two variables — not the full array. Reduces O(n) space to O(1)."
    ],
    Viz:DPViz,problems:["Climbing Stairs","House Robber","Longest Palindromic Substring","Coin Change","Edit Distance"]},
  {id:"backtracking",icon:"🌿",title:"Backtracking",color:"#C084FC",tag:"Combinatorics",difficulty:"Medium–Hard",tagline:"Try all possibilities. Abandon a path as soon as it's invalid.",
    intro:[
      "Backtracking is a systematic way to try all possibilities and collect valid ones. At each step, you make a choice, recurse to explore all paths from that choice, and then undo the choice ('backtrack') so you can try the next option. It is essentially a depth-first search through a decision tree.",
      "What makes backtracking different from brute force is pruning: before recursing into a choice, you check whether this path can possibly lead to a valid solution. If not, you skip it entirely — pruning that entire branch of the decision tree. Good pruning is what separates a 1-second solution from a 10-minute time limit exceeded. The template is always: choose, explore, unchoose."
    ],
    whenToUse:[
      "The problem asks for ALL valid combinations, permutations, subsets, or paths — not just one",
      "The problem involves placing pieces on a board with constraints (N-Queens, Sudoku solver)",
      "Keywords: 'find all subsets/combinations/permutations', 'generate all valid...', 'count all ways to...'",
      "You need to try all possibilities but with constraints that let you discard invalid paths early"
    ],
    analogy:"Solving a maze: try every path. Hit a dead end? Backtrack to the last junction and try a different direction. Never revisit a dead end.",
    aha:"Subsets, permutations, combinations, N-Queens — whenever you need to explore all possibilities with constraints, backtracking is the structured way to do it. Pruning eliminates dead branches early.",
    steps:[
      {c:"#C084FC",title:"Base case: record solution",desc:"If the current path is a complete valid solution: result.append(path.copy()). The .copy() is critical — you are about to modify path, so save its current state."},
      {c:"#C084FC",title:"Choose: iterate options",desc:"For each candidate choice at the current step: make the choice (append to path, mark used, etc.)."},
      {c:"#FFCC44",title:"Explore: recurse",desc:"Call the same function recursively with the updated state. This explores all completions of the current partial solution."},
      {c:"#4EFFA0",title:"Unchoose: backtrack",desc:"After the recursive call returns, undo the choice (pop from path, unmark used). Now the loop continues to the next candidate."}
    ],
    keyPoints:[
      "Full template: def backtrack(start, path): if is_complete(path): result.append(path[:]); return. For i in range(start, n): if is_valid(i): path.append(nums[i]); backtrack(i+1, path); path.pop().",
      "Subsets: no pruning needed. At each level, every element is either included or not. backtrack(start): result.append(path[:]); for i in range(start,n): path.append(nums[i]); backtrack(i+1); path.pop().",
      "Combination Sum (reuse allowed): backtrack(start): if total==target: record. If total>target: return (prune!). For i in range(start,n): add nums[i]; backtrack(i, ...); remove nums[i]. Note i not i+1 allows reuse.",
      "Permutations: use a 'used' boolean array. For each position: try all unused elements. Mark used before recursing, unmark after.",
      "Avoid duplicates in Subsets II / Combination Sum II: sort the array first. In the for loop: if i>start and nums[i]==nums[i-1]: continue. This skips duplicate choices at the same level."
    ],
    Viz:BacktrackingViz,problems:["Subsets","Permutations","Combination Sum","N-Queens","Word Search"]},
  {id:"greedy",icon:"🏃",title:"Greedy",color:"#FF9F5B",tag:"Optimization",difficulty:"Medium",tagline:"Make the locally optimal choice at each step. Works when local = global optimum.",
    intro:[
      "A greedy algorithm makes the locally best choice at each step and never revisits past decisions. This sounds risky — how do you know the local best always leads to the global best? The answer is the 'greedy choice property': for some problems, a locally optimal choice never blocks the globally optimal solution. Proving this is the hard part; applying the algorithm once proven is usually straightforward.",
      "The difference between Greedy and DP: DP considers ALL choices at each step and picks the best overall. Greedy commits to ONE choice immediately without looking ahead. This makes greedy O(n) or O(n log n) — much faster than DP's O(n²) or O(n²). Use greedy when you can prove it safe; fall back to DP when you cannot."
    ],
    whenToUse:[
      "Interval scheduling: 'minimum number of meeting rooms', 'non-overlapping intervals', 'maximum number of events'",
      "Jump Game style problems where you track 'how far can I reach from here'",
      "The problem has a natural ordering (sort by end time, start time, value) and a scan that makes local decisions",
      "After trying DP and finding the recurrence is trivial ('always take the locally best option'), simplify to greedy"
    ],
    analogy:"Buying groceries on a budget. A greedy shopper always picks the cheapest item first. Sometimes this gives the best overall spend — and sometimes it doesn't (that's when greedy fails and DP is needed).",
    aha:"Greedy works when the problem has the 'greedy choice property': a locally optimal choice never disqualifies the global optimal. If not → DP. Activity selection, interval scheduling, Jump Game all have this property.",
    steps:[
      {c:"#FF9F5B",title:"Sort by the right criterion",desc:"Most greedy problems start with a sort. Intervals: sort by end time. Jump Game: process left to right by index. Gas Station: process circularly."},
      {c:"#FF9F5B",title:"Make the local best choice",desc:"At each step, pick the option that maximizes or minimizes your current objective without worrying about what comes later."},
      {c:"#FFCC44",title:"Track state, not history",desc:"You only need to track the current best value, not the full history. Jump Game: track max_reach. Gas Station: track current_tank and total_tank."},
      {c:"#4EFFA0",title:"Single pass to the answer",desc:"After sorting, a single O(n) scan produces the answer. No nested loops, no recursion. If you need nested loops, reconsider whether this is truly greedy."}
    ],
    keyPoints:[
      "Jump Game: track max_reach = max(max_reach, i + nums[i]). If i > max_reach at any point, return False. If max_reach >= n-1 at any point, return True.",
      "Jump Game II (min jumps): at each position update reach. When you exhaust the current jump range, increment jumps and set current range to reach.",
      "Gas Station: if total_gas >= total_cost, a solution always exists. Find the starting station: scan left to right, reset start=i+1 whenever running tank goes negative.",
      "Partition Labels: for each character, find its last occurrence. Scan left to right, extending the current partition end to max(end, last[char]). When i==end, cut here.",
      "Greedy fails when future choices depend on the current one in a non-obvious way. Classic example: coin change with arbitrary denominations — greedy gives wrong answer, DP is needed."
    ],
    Viz:GreedyViz,problems:["Jump Game","Jump Game II","Gas Station","Hand of Straights","Partition Labels"]},
  {id:"dijkstra",icon:"🗺️",title:"Dijkstra / Shortest Path",color:"#FF9F5B",tag:"Graphs",difficulty:"Medium–Hard",tagline:"Greedy: always expand the unvisited node with the smallest known distance.",
    intro:[
      "Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph with non-negative edge weights. It is BFS with one modification: instead of a regular queue (FIFO), it uses a min-heap (priority queue) ordered by current shortest known distance. This guarantees that the first time you pop a node from the heap, you have found its shortest distance — it is final.",
      "The algorithm is greedy: at each step, it commits to the unvisited node with the smallest known distance. This greedy choice is safe because all edge weights are non-negative — you cannot find a shorter path to an already-processed node by going through a later node. For negative weights, use Bellman-Ford instead."
    ],
    whenToUse:[
      "The problem involves a weighted graph and asks for minimum cost, minimum time, or minimum effort to reach a node",
      "Keywords: 'network delay time', 'cheapest flights', 'minimum path cost', 'shortest weighted path'",
      "The graph has non-negative edge weights (for negative weights, use Bellman-Ford)",
      "The problem is essentially 'weighted BFS' — same as BFS but edges cost different amounts"
    ],
    analogy:"GPS navigation. You're in city A, want shortest route to E. You always drive to the nearest city you haven't visited yet. Once you reach a city, that distance is final — you can never find a shorter path later.",
    aha:"Dijkstra is BFS with a priority queue instead of a regular queue. The priority queue ensures you always process the nearest unvisited node — making it greedy-optimal for non-negative weights.",
    steps:[
      {c:"#FF9F5B",title:"Initialize distances",desc:"dist = [infinity] * n; dist[source] = 0. Min-heap: heap = [(0, source)] — tuples of (distance, node). Python heapq orders by first element."},
      {c:"#FF9F5B",title:"Pop nearest node",desc:"(d, u) = heapq.heappop(heap). If d > dist[u]: this is a stale entry — skip it (we already found a shorter path to u). Continue to next."},
      {c:"#FFCC44",title:"Relax neighbors",desc:"For each neighbor v of u with edge weight w: new_dist = dist[u] + w. If new_dist < dist[v]: dist[v] = new_dist; heapq.heappush(heap, (new_dist, v))."},
      {c:"#4EFFA0",title:"Answer",desc:"After heap is empty: dist[target] = shortest distance to target, or infinity if unreachable. For 'Network Delay Time': return max(dist) if all reachable, else -1."}
    ],
    keyPoints:[
      "Full Python template: import heapq. dist=[float('inf')]*n; dist[src]=0; heap=[(0,src)]. While heap: d,u=heapq.heappop(heap); if d>dist[u]: continue; for v,w in graph[u]: if dist[u]+w<dist[v]: dist[v]=dist[u]+w; heapq.heappush(heap,(dist[v],v)).",
      "The 'if d > dist[u]: continue' check is essential. Without it you process stale heap entries and get wrong answers.",
      "Cheapest Flights Within K Stops: this is NOT standard Dijkstra because of the K-stop constraint. Use BFS with (cost, node, stops_remaining) state, or modified Bellman-Ford.",
      "Path With Minimum Effort: edge weight = absolute difference in height. Dijkstra finds the path where the maximum single step is minimized.",
      "Time complexity: O((V+E) log V) with a binary heap. For dense graphs, O(V²) with a simple array is sometimes faster."
    ],
    Viz:DijkstraViz,problems:["Network Delay Time","Cheapest Flights Within K Stops","Path With Minimum Effort","Swim in Rising Water"]},
  {id:"fast-slow",icon:"🐇",title:"Fast & Slow Pointers",color:"#C084FC",tag:"Linked Lists",difficulty:"Easy–Medium",tagline:"Two pointers at different speeds. Slow=1 step, Fast=2 steps. Cycle detection.",
    intro:[
      "Fast and Slow Pointers (Floyd's algorithm) uses two pointers that move through a sequence at different speeds. The slow pointer moves one step at a time; the fast pointer moves two. If a cycle exists, the fast pointer will eventually lap the slow pointer and they will meet inside the cycle — guaranteed. If no cycle exists, the fast pointer reaches the end (null) and you return false.",
      "Beyond cycle detection, the same technique finds the middle of a linked list in one pass: when fast reaches the last node, slow is exactly at the middle. This is used in Reorder List (find middle, reverse second half, merge) and in Sort List (merge sort, split at middle). It is a purely pointer-based technique — O(1) extra space regardless of list length."
    ],
    whenToUse:[
      "Cycle detection in a linked list or any sequence (Linked List Cycle, Happy Number, Find Duplicate Number)",
      "Finding the middle of a linked list in a single pass",
      "Any problem where the list needs to be split in half (merge sort, reorder list, palindrome linked list)",
      "Finding the start of a cycle after detecting one"
    ],
    analogy:"Two runners on a circular track. If there's a loop, the faster runner will eventually lap the slower one and they'll meet. If there's no loop, the fast runner just falls off the end.",
    aha:"Fast/slow pointers solve cycle detection in O(n) time and O(1) space — no HashSet needed. The same pattern finds the middle of a linked list (when fast reaches end, slow is at middle).",
    steps:[
      {c:"#C084FC",title:"Initialize both at head",desc:"slow = head; fast = head. Both start at the same place."},
      {c:"#C084FC",title:"Move at different speeds",desc:"While fast and fast.next: slow = slow.next; fast = fast.next.next. Check after moving. If fast reaches null: no cycle."},
      {c:"#FFCC44",title:"Cycle: slow == fast",desc:"If slow == fast inside the loop, a cycle is detected. For just detection, return True here."},
      {c:"#4EFFA0",title:"Find cycle start (if needed)",desc:"Reset one pointer to head. Move both at speed 1. They will meet exactly at the cycle's start. Mathematical proof: the distances work out because of how Floyd's algorithm is structured."}
    ],
    keyPoints:[
      "Cycle detection template: slow=fast=head. While fast and fast.next: slow=slow.next; fast=fast.next.next; if slow==fast: return True. Return False.",
      "Find middle: slow=fast=head. While fast and fast.next: slow=slow.next; fast=fast.next.next. After loop, slow is at the middle.",
      "For even-length lists, 'middle' by this technique is the second of the two middle nodes. Adjust if you need the first: while fast.next and fast.next.next.",
      "Find Duplicate Number: treat the array as a linked list where index i points to nums[i]. A duplicate creates a cycle. Apply Floyd's and find the cycle start.",
      "Happy Number: apply fast/slow to the 'sum of squares of digits' sequence. If the sequence reaches 1: happy. If slow==fast at a non-1 value: cycle, not happy."
    ],
    Viz:FastSlowViz,problems:["Linked List Cycle","Find Duplicate Number","Middle of Linked List","Reorder List","Happy Number"]},
  {id:"sorting-algos",icon:"🔀",title:"Sorting Algorithms",color:"#5B8CFF",tag:"Fundamentals",difficulty:"Easy–Medium",tagline:"Merge Sort is O(n log n) divide-and-conquer. Quick Sort is O(n log n) average.",
    intro:[
      "Merge Sort and Quick Sort are the two O(n log n) sorting algorithms every interviewer expects you to implement from scratch. Merge Sort divides the array in half, recursively sorts each half, then merges them in O(n) time. It is stable (equal elements keep their relative order) and always O(n log n) regardless of input. The cost is O(n) extra space for the merge step.",
      "Quick Sort picks a pivot, partitions the array so all smaller elements are left and all larger are right, then recursively sorts each side. The pivot ends up in its final sorted position after each partition. Average case is O(n log n) with O(log n) space (call stack). Worst case is O(n²) when the pivot is always the smallest or largest element — randomizing the pivot avoids this in practice."
    ],
    whenToUse:[
      "You are asked to implement a sorting algorithm from scratch (very common in interviews)",
      "The problem requires a stable sort (equal elements must preserve relative order) — use Merge Sort",
      "The problem is 'Kth Largest Element' — Quick Select (partition of Quick Sort) gives O(n) average",
      "The problem asks to sort a linked list — Merge Sort is the natural fit (no random access needed)"
    ],
    analogy:"Merge Sort: split a messy deck in half, sort each half, then merge by picking the smaller card each time. Quick Sort: pick a pivot card, put all smaller cards left, all bigger right — then sort each side.",
    aha:"Merge Sort is stable and always O(n log n). Quick Sort is O(n log n) average but O(n²) worst. Python's sort (Timsort) and Java's Arrays.sort both use hybrid approaches. Know both for interviews.",
    steps:[
      {c:"#5B8CFF",title:"Merge Sort: divide",desc:"If len(arr) <= 1: return arr (base case). mid = len(arr)//2. left = mergeSort(arr[:mid]). right = mergeSort(arr[mid:])."},
      {c:"#5B8CFF",title:"Merge Sort: merge",desc:"i=j=0; result=[]. While i<len(left) and j<len(right): append smaller of left[i] or right[j], advance that pointer. Append remaining elements. Return result."},
      {c:"#FFCC44",title:"Quick Sort: partition",desc:"Pick pivot (e.g., last element). Scan left to right with pointer p=lo. If arr[i]<=pivot: swap arr[i] and arr[p], p++. After scan, swap arr[p] and pivot. Pivot is now at index p."},
      {c:"#4EFFA0",title:"Quick Sort: recurse",desc:"quickSort(arr, lo, p-1); quickSort(arr, p+1, hi). Randomize pivot selection to avoid O(n²) worst case: swap a random element with arr[hi] before partitioning."}
    ],
    keyPoints:[
      "Merge Sort time: O(n log n) always. Space: O(n) for the temporary arrays during merge.",
      "Quick Sort time: O(n log n) average, O(n²) worst. Space: O(log n) average call stack. Random pivot makes worst case extremely unlikely.",
      "Quick Select for Kth Largest: partition once — if pivot lands at index k, that is the answer. If k < pivot index, recurse left. If k > pivot index, recurse right. O(n) average.",
      "Sort Colors (Dutch National Flag): three-pointer problem. Maintain lo, mid, hi. Elements 0 go to [0..lo), elements 2 go to (hi..n). Elements 1 stay in the middle.",
      "In real code: Python's sorted() uses Timsort (hybrid merge+insertion, O(n log n) stable). Java's Arrays.sort for primitives uses dual-pivot Quick Sort; for objects uses Timsort."
    ],
    Viz:SortingViz,problems:["Sort an Array","Merge Sort (implement)","Quick Sort (implement)","Sort Colors","Kth Largest Element"]},
  {id:"monotonic-stack2",icon:"📉",title:"Monotonic Stack (Deep)",color:"#FF9F5B",tag:"Advanced",difficulty:"Medium–Hard",tagline:"See Monotonic Stack above — covered in patterns.",analogy:"",aha:"",steps:[],Viz:null,problems:[],hidden:true},
  {id:"intervals",icon:"📅",title:"Intervals",color:"#4EFFA0",tag:"Arrays",difficulty:"Medium",tagline:"Sort by start time, then greedily merge or count overlaps.",
    intro:[
      "Interval problems involve ranges [start, end] and relationships between them: do they overlap? Can we merge them? How many rooms do we need? The universal first step is to sort intervals by start time. Once sorted, overlapping intervals are adjacent — you can detect and handle them with a simple linear scan.",
      "Two intervals [a,b] and [c,d] overlap if and only if a <= d AND c <= b (they share at least one point). After sorting by start time, interval i overlaps with interval i-1 if intervals[i].start <= intervals[i-1].end. This is the condition you check in the scan. If they overlap, merge by extending the end to max(both ends). If they do not, the current interval is separate — start a new one."
    ],
    whenToUse:[
      "The problem involves ranges/intervals: meetings, time slots, ranges on a number line",
      "Keywords: 'merge intervals', 'overlapping intervals', 'minimum meeting rooms', 'insert interval'",
      "The problem asks how many intervals overlap at a given point (count simultaneous events)",
      "You need to find gaps between intervals, or check if a person can attend all meetings"
    ],
    analogy:"Meeting room scheduling. You have a calendar of meetings. Which ones overlap? Can you attend all? Sort by start time, then scan — it becomes obvious.",
    aha:"Sort by start time first — every interval problem becomes a linear scan after that. The pattern: sort + scan + track the 'current end' pointer = O(n log n) total.",
    steps:[
      {c:"#4EFFA0",title:"Sort by start time",desc:"intervals.sort(key=lambda x: x[0]). This ensures overlapping intervals are adjacent and you never miss an overlap."},
      {c:"#4EFFA0",title:"Merge overlapping",desc:"merged=[intervals[0]]. For each interval: if interval[0] <= merged[-1][1]: merged[-1][1] = max(merged[-1][1], interval[1]). Else: merged.append(interval)."},
      {c:"#FFCC44",title:"Count rooms (min-heap)",desc:"Meeting Rooms II: heap tracks end times of ongoing meetings. For each interval: if heap and heap[0] <= start: heapq.heappop(heap). heapq.heappush(heap, end). Answer = len(heap)."},
      {c:"#4EFFA0",title:"Insert Interval",desc:"Add new interval to list, sort, then run merge. Or: scan once — skip intervals that end before new start, merge those that overlap with new interval, add remaining."}
    ],
    keyPoints:[
      "Two intervals overlap if: interval[i][0] <= interval[i-1][1] (after sorting by start). They do NOT overlap if interval[i][0] > interval[i-1][1].",
      "Merge Intervals: sort by start, scan and merge. If current start > last merged end: no overlap, append. Else: extend last merged end to max of both ends.",
      "Meeting Rooms I: sort by start, check if any consecutive pair overlaps (intervals[i][0] < intervals[i-1][1]). If yes, cannot attend all.",
      "Meeting Rooms II (min rooms): use a min-heap of end times. For each meeting: if earliest-ending meeting finishes before this one starts, reuse that room (pop). Always push current end time.",
      "Non-overlapping Intervals (minimum removals): sort by END time (not start). Greedily keep each interval that does not overlap with the last kept one. removals = n - kept."
    ],
    Viz:IntervalsViz,problems:["Merge Intervals","Insert Interval","Non-overlapping Intervals","Meeting Rooms","Meeting Rooms II"]},
  {id:"bit-manipulation",icon:"⚡",title:"Bit Manipulation",color:"#FFCC44",tag:"Math",difficulty:"Easy–Medium",tagline:"Operate directly on binary representation for ultra-fast O(1) tricks.",
    intro:[
      "Bit manipulation works directly on the binary representation of integers. Every integer is stored as a sequence of 0s and 1s (bits), and bitwise operators let you manipulate individual bits with a single CPU instruction. This gives O(1) operations for tasks that would otherwise require loops or extra memory.",
      "The four core operators are: AND (&) — both bits must be 1. OR (|) — at least one bit is 1. XOR (^) — exactly one bit is 1 (different). NOT (~) — flip all bits. XOR is the most powerful for interview problems because of its cancellation property: any number XORed with itself is 0, and any number XORed with 0 is itself unchanged. This lets you find the one non-duplicate in an array by XORing all elements together."
    ],
    whenToUse:[
      "The problem involves finding the single non-duplicate element, or elements appearing odd numbers of times",
      "The problem asks you to count, check, or manipulate individual bits of an integer",
      "You need O(1) space for a problem that would otherwise require extra data structures",
      "Keywords: 'power of two', 'number of 1 bits', 'single number', 'missing number', 'XOR'"
    ],
    analogy:"A light switch panel with 32 switches. Each switch is one bit. Flipping all switches = NOT. Checking if switch 3 is on = AND with 00100. Toggling switch 3 = XOR with 00100.",
    aha:"XOR is the magic operation: A^A=0, A^0=A. Find the single non-duplicate in O(n) time, O(1) space using XOR. Bit tricks replace complex logic with single instructions.",
    steps:[
      {c:"#FFCC44",title:"Check if bit k is set",desc:"n & (1 << k). If result is non-zero, bit k is 1. Example: 13 = 1101. 13 & (1<<2) = 1101 & 0100 = 0100 ≠ 0, so bit 2 is set."},
      {c:"#FFCC44",title:"Set / clear / toggle bit k",desc:"Set: n | (1<<k). Clear: n & ~(1<<k). Toggle: n ^ (1<<k). These are the building blocks of all bit manipulation."},
      {c:"#FFCC44",title:"n & (n-1) trick",desc:"Clears the lowest set bit of n. Use it to count set bits: while n: n &= (n-1); count++. Also: if n & (n-1) == 0 and n > 0, then n is a power of 2."},
      {c:"#4EFFA0",title:"XOR cancellation",desc:"Single Number: result = 0; for num in nums: result ^= num. All duplicates cancel out (x^x=0). The remaining value is the single non-duplicate. O(n) time, O(1) space."}
    ],
    keyPoints:[
      "Single Number: XOR all elements. Duplicates cancel, single element remains. result = 0; for x in nums: result ^= x.",
      "Missing Number (0 to n, one missing): XOR all indices (0..n) with all values. Everything cancels except the missing number.",
      "Number of 1 Bits: use n & (n-1) in a loop to count set bits. Or in Python: bin(n).count('1').",
      "Power of 2 check: n > 0 and (n & (n-1)) == 0. A power of 2 has exactly one set bit; subtracting 1 flips all lower bits and clears the set bit.",
      "Sum of Two Integers without + operator: carry = (a & b) << 1; a = a ^ b; b = carry. Repeat until no carry. In Python, handle 32-bit overflow manually with masks."
    ],
    Viz:BitViz,problems:["Single Number","Number of 1 Bits","Counting Bits","Reverse Bits","Sum of Two Integers"]},
  {id:"union-find2",icon:"🔗",title:"Union Find (Covered)",color:"#FF6B6B",tag:"Graphs",difficulty:"Medium",tagline:"",analogy:"",aha:"",steps:[],Viz:null,problems:[],hidden:true},
];

const NC150 = [
  {name:"Arrays & Hashing",count:9,problems:[{t:"Contains Duplicate",d:"E"},{t:"Valid Anagram",d:"E"},{t:"Two Sum",d:"E"},{t:"Group Anagrams",d:"M"},{t:"Top K Frequent Elements",d:"M"},{t:"Product of Array Except Self",d:"M"},{t:"Valid Sudoku",d:"M"},{t:"Encode and Decode Strings",d:"M"},{t:"Longest Consecutive Sequence",d:"M"}]},
  {name:"Two Pointers",count:5,problems:[{t:"Valid Palindrome",d:"E"},{t:"Two Sum II",d:"M"},{t:"3Sum",d:"M"},{t:"Container With Most Water",d:"M"},{t:"Trapping Rain Water",d:"H"}]},
  {name:"Sliding Window",count:6,problems:[{t:"Best Time to Buy/Sell Stock",d:"E"},{t:"Longest Substring Without Repeating Chars",d:"M"},{t:"Longest Repeating Char Replacement",d:"M"},{t:"Permutation in String",d:"M"},{t:"Minimum Window Substring",d:"H"},{t:"Sliding Window Maximum",d:"H"}]},
  {name:"Stack",count:6,problems:[{t:"Valid Parentheses",d:"E"},{t:"Min Stack",d:"M"},{t:"Evaluate Reverse Polish Notation",d:"M"},{t:"Daily Temperatures",d:"M"},{t:"Car Fleet",d:"M"},{t:"Largest Rectangle in Histogram",d:"H"}]},
  {name:"Binary Search",count:7,problems:[{t:"Binary Search",d:"E"},{t:"Search a 2D Matrix",d:"M"},{t:"Koko Eating Bananas",d:"M"},{t:"Find Min in Rotated Sorted Array",d:"M"},{t:"Search in Rotated Sorted Array",d:"M"},{t:"Time Based Key-Value Store",d:"M"},{t:"Median of Two Sorted Arrays",d:"H"}]},
  {name:"Linked List",count:11,problems:[{t:"Reverse Linked List",d:"E"},{t:"Merge Two Sorted Lists",d:"E"},{t:"Linked List Cycle",d:"E"},{t:"Reorder List",d:"M"},{t:"Remove Nth Node From End",d:"M"},{t:"Copy List with Random Pointer",d:"M"},{t:"Add Two Numbers",d:"M"},{t:"Find the Duplicate Number",d:"M"},{t:"LRU Cache",d:"M"},{t:"Merge k Sorted Lists",d:"H"},{t:"Reverse Nodes in k-Group",d:"H"}]},
  {name:"Trees",count:15,problems:[{t:"Invert Binary Tree",d:"E"},{t:"Maximum Depth of Binary Tree",d:"E"},{t:"Diameter of Binary Tree",d:"E"},{t:"Balanced Binary Tree",d:"E"},{t:"Same Tree",d:"E"},{t:"Subtree of Another Tree",d:"E"},{t:"Lowest Common Ancestor BST",d:"M"},{t:"Binary Tree Level Order Traversal",d:"M"},{t:"Binary Tree Right Side View",d:"M"},{t:"Count Good Nodes",d:"M"},{t:"Validate BST",d:"M"},{t:"Kth Smallest in BST",d:"M"},{t:"Construct Tree from Pre/Inorder",d:"M"},{t:"Binary Tree Max Path Sum",d:"H"},{t:"Serialize and Deserialize Tree",d:"H"}]},
  {name:"Heap / Priority Queue",count:7,problems:[{t:"Kth Largest in Stream",d:"E"},{t:"Last Stone Weight",d:"E"},{t:"K Closest Points to Origin",d:"M"},{t:"Kth Largest in Array",d:"M"},{t:"Task Scheduler",d:"M"},{t:"Design Twitter",d:"M"},{t:"Find Median from Data Stream",d:"H"}]},
  {name:"Backtracking",count:10,problems:[{t:"Subsets",d:"M"},{t:"Combination Sum",d:"M"},{t:"Combination Sum II",d:"M"},{t:"Permutations",d:"M"},{t:"Subsets II",d:"M"},{t:"Word Search",d:"M"},{t:"Palindrome Partitioning",d:"M"},{t:"Letter Combinations of Phone Number",d:"M"},{t:"Generate Parentheses",d:"M"},{t:"N-Queens",d:"H"}]},
  {name:"Tries",count:3,problems:[{t:"Implement Trie",d:"M"},{t:"Design Add and Search Words",d:"M"},{t:"Word Search II",d:"H"}]},
  {name:"Graphs",count:13,problems:[{t:"Number of Islands",d:"M"},{t:"Max Area of Island",d:"M"},{t:"Clone Graph",d:"M"},{t:"Walls and Gates",d:"M"},{t:"Rotting Oranges",d:"M"},{t:"Pacific Atlantic Water Flow",d:"M"},{t:"Surrounded Regions",d:"M"},{t:"Course Schedule",d:"M"},{t:"Course Schedule II",d:"M"},{t:"Graph Valid Tree",d:"M"},{t:"Number of Connected Components",d:"M"},{t:"Redundant Connection",d:"M"},{t:"Word Ladder",d:"H"}]},
  {name:"Advanced Graphs",count:6,problems:[{t:"Reconstruct Itinerary",d:"H"},{t:"Min Cost to Connect All Points",d:"M"},{t:"Network Delay Time",d:"M"},{t:"Swim in Rising Water",d:"H"},{t:"Alien Dictionary",d:"H"},{t:"Cheapest Flights Within K Stops",d:"M"}]},
  {name:"1-D Dynamic Programming",count:12,problems:[{t:"Climbing Stairs",d:"E"},{t:"Min Cost Climbing Stairs",d:"E"},{t:"House Robber",d:"M"},{t:"House Robber II",d:"M"},{t:"Longest Palindromic Substring",d:"M"},{t:"Palindromic Substrings",d:"M"},{t:"Decode Ways",d:"M"},{t:"Coin Change",d:"M"},{t:"Maximum Product Subarray",d:"M"},{t:"Word Break",d:"M"},{t:"Longest Increasing Subsequence",d:"M"},{t:"Partition Equal Subset Sum",d:"M"}]},
  {name:"2-D Dynamic Programming",count:11,problems:[{t:"Unique Paths",d:"M"},{t:"Longest Common Subsequence",d:"M"},{t:"Best Time to Buy/Sell with Cooldown",d:"M"},{t:"Coin Change II",d:"M"},{t:"Target Sum",d:"M"},{t:"Interleaving String",d:"M"},{t:"Longest Increasing Path in Matrix",d:"H"},{t:"Distinct Subsequences",d:"H"},{t:"Edit Distance",d:"M"},{t:"Burst Balloons",d:"H"},{t:"Regular Expression Matching",d:"H"}]},
  {name:"Greedy",count:8,problems:[{t:"Maximum Subarray",d:"M"},{t:"Jump Game",d:"M"},{t:"Jump Game II",d:"M"},{t:"Gas Station",d:"M"},{t:"Hand of Straights",d:"M"},{t:"Merge Triplets",d:"M"},{t:"Partition Labels",d:"M"},{t:"Valid Parenthesis String",d:"M"}]},
  {name:"Intervals",count:6,problems:[{t:"Insert Interval",d:"M"},{t:"Merge Intervals",d:"M"},{t:"Non-overlapping Intervals",d:"M"},{t:"Meeting Rooms",d:"E"},{t:"Meeting Rooms II",d:"M"},{t:"Minimum Interval to Include Each Query",d:"H"}]},
  {name:"Math & Geometry",count:8,problems:[{t:"Rotate Image",d:"M"},{t:"Spiral Matrix",d:"M"},{t:"Set Matrix Zeroes",d:"M"},{t:"Happy Number",d:"E"},{t:"Plus One",d:"E"},{t:"Pow(x,n)",d:"M"},{t:"Multiply Strings",d:"M"},{t:"Detect Squares",d:"M"}]},
  {name:"Bit Manipulation",count:7,problems:[{t:"Single Number",d:"E"},{t:"Number of 1 Bits",d:"E"},{t:"Counting Bits",d:"E"},{t:"Reverse Bits",d:"E"},{t:"Missing Number",d:"E"},{t:"Sum of Two Integers",d:"M"},{t:"Reverse Integer",d:"M"}]},
];

// ═══════════════════════════════════════════════════════════════
// ██  LESSON PAGE
// ═══════════════════════════════════════════════════════════════
function LessonPage({topic, onBack}: LessonPageProps) {
  const {icon,title,analogy,aha,steps,complexity,Viz,intro,keyPoints}=topic;
  return(
    <div className="cx fadeUp"><div className="lc">
      <div className="lb" onClick={onBack}>← Back</div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
        <span style={{fontSize:34}}>{icon}</span>
        <div><div className="lt">{title}</div>
          <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
            <span className="badge be">Foundation</span>
            <span style={{fontSize:9,background:"var(--card)",color:"var(--mu)",padding:"2px 7px",borderRadius:20,fontWeight:600}}>Interactive</span>
          </div>
        </div>
      </div>
      <div className="ls">{topic.desc} — Understood through analogies, not memorization.</div>
      {intro&&intro.length>0&&(
        <div style={{marginBottom:22}}>
          {intro.map((p,i)=><p key={i} style={{fontSize:14,lineHeight:1.8,color:"var(--tx)",marginBottom:i<intro.length-1?14:0,opacity:.92}}>{p}</p>)}
        </div>
      )}
      <div className="an-box"><div className="an-lbl">💡 Analogy</div><p>"{analogy}"</p></div>
      <Viz />
      <div style={{fontFamily:"var(--fd)",fontSize:13.5,fontWeight:800,marginBottom:12}}>🧩 How It Works</div>
      <div className="steps">{steps.map((s,i)=><div className="sc" key={i}><div className="sn" style={{background:`${s.c}18`,color:s.c}}>{s.num}</div><div className="sb2"><h4>{s.title}</h4><p>{s.desc}</p></div></div>)}</div>
      <div className="aha"><div className="aha-lbl">⚡ The Key Insight</div><p>{aha}</p></div>
      {keyPoints&&keyPoints.length>0&&(
        <div style={{marginBottom:22}}>
          <div style={{fontFamily:"var(--fd)",fontSize:13.5,fontWeight:800,marginBottom:12}}>📌 Key Points to Remember</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {keyPoints.map((kp,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:8,padding:"10px 14px"}}>
                <span style={{color:"var(--g)",fontWeight:700,fontSize:13,lineHeight:1.6,flexShrink:0}}>→</span>
                <span style={{fontSize:13,lineHeight:1.65,color:"var(--tx)",opacity:.9}}>{kp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{fontFamily:"var(--fd)",fontSize:13.5,fontWeight:800,marginBottom:12}}>📊 Complexity Reference</div>
      <div className="vz ct-scroll" style={{padding:0,overflow:"auto",marginBottom:22}}>
        <table className="ct"><thead><tr><th>Operation</th><th>Best</th><th>Avg</th><th>Worst</th><th>Note</th></tr></thead>
          <tbody>{complexity.map((r,i)=><tr key={i}><td style={{fontWeight:500}}>{r.op}</td><td><span className={oC(r.b)}>{r.b}</span></td><td><span className={oC(r.a)}>{r.a}</span></td><td><span className={oC(r.w)}>{r.w}</span></td><td style={{color:"var(--mu)",fontSize:11}}>{r.n}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
        <button className="btn btn-g" onClick={onBack} style={{padding:"9px 22px",fontSize:13}}>✅ Complete & Continue →</button>
        <button className="btn" onClick={onBack}>← Back</button>
      </div>
    </div></div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ██  PREP PAGE
// ═══════════════════════════════════════════════════════════════
function PrepPage() {
  const [openConcept,setOpenConcept]=useState(null);
  const [openCat,setOpenCat]=useState(null);
  const [tab,setTabState]=useState(()=>{try{return localStorage.getItem('prep-tab')||'concepts'}catch{return 'concepts'}});
  const setTab=v=>{setTabState(v);try{localStorage.setItem('prep-tab',v)}catch{}};
  const [done,setDone]=useState(()=>{
    try{const saved=localStorage.getItem('nc150-progress');return saved?JSON.parse(saved):{}}catch{return {}}
  });
  useEffect(()=>{try{localStorage.setItem('nc150-progress',JSON.stringify(done))}catch{}},[done]);
  const totalDone=Object.values(done).filter(Boolean).length;
  const totalProbs=NC150.reduce((s,c)=>s+c.count,0);
  const toggleDone=(ci,pi)=>{const k=`${ci}-${pi}`;setDone(d=>({...d,[k]:!d[k]}));};
  const visibleConcepts=CONCEPTS.filter(c=>!c.hidden);

  return(
    <div>
      <div className="prep-hero">
        <div className="hero-tag">🎯 Interview Prep</div>
        <h1>Patterns + NeetCode 150</h1>
        <p>Master the pattern first (analogy + animation), then crush the problems. This is the difference between memorizing and actually knowing DSA.</p>
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,color:"var(--mu)",marginBottom:4}}><span>Progress</span><span style={{color:"var(--g)",fontWeight:600}}>{totalDone}/{totalProbs}</span></div>
          <div className="prog-bar"><div className="prog-fill" style={{width:`${(totalDone/totalProbs)*100}%`}}/></div>
        </div>
        <div className="prep-cats">
          {["concepts","problems"].map(t=><button key={t} className={`prep-cat ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{t==="concepts"?"📚 Learn Patterns":"📋 NeetCode 150"}</button>)}
        </div>
      </div>

      <div className="cx fadeUp">
        {tab==="concepts"&&(<>
          <div className="sh"><span className="sh-em">📚</span><div><h2>All 14 Core Patterns</h2><p>Every interview problem is a variation of one of these. Master the pattern, not the problem.</p></div></div>
          {visibleConcepts.map(c=>{
            const isOpen=openConcept===c.id;
            return(<div key={c.id} className={`concept-card ${isOpen?"open":""}`} onClick={()=>setOpenConcept(isOpen?null:c.id)}>
              <div className="cc-head">
                <div className="cc-icon" style={{background:`${c.color}18`}}>{c.icon}</div>
                <div className="cc-meta" style={{flex:1,minWidth:0}}>
                  <h3>{c.title}</h3><p>{c.tagline}</p>
                  <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:9,background:"var(--card)",color:"var(--mu)",padding:"2px 7px",borderRadius:20,fontWeight:600}}>{c.tag}</span>
                    <span style={{fontSize:9,background:`${c.color}18`,color:c.color,padding:"2px 7px",borderRadius:20,fontWeight:600}}>{c.difficulty}</span>
                  </div>
                </div>
                <div className="cc-arrow" style={{transform:isOpen?"rotate(180deg)":"none"}}>▾</div>
              </div>
              {isOpen&&(<div className="cc-body" onClick={e=>e.stopPropagation()}>
                {c.intro&&c.intro.length>0&&(
                  <div style={{marginBottom:16}}>
                    {c.intro.map((p,i)=><p key={i} style={{fontSize:13.5,lineHeight:1.85,color:"var(--tx)",marginBottom:i<c.intro.length-1?13:0,opacity:.9}}>{p}</p>)}
                  </div>
                )}
                {c.whenToUse&&c.whenToUse.length>0&&(
                  <div style={{background:"#172a1f",border:"1px solid #253d2a",borderRadius:9,padding:"11px 14px",marginBottom:14}}>
                    <div style={{fontSize:9,fontWeight:700,color:"var(--g)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>🎯 Recognize This Pattern When…</div>
                    {c.whenToUse.map((s,i)=>(
                      <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:i<c.whenToUse.length-1?6:0}}>
                        <span style={{color:"var(--g)",fontWeight:700,fontSize:12,lineHeight:1.6,flexShrink:0}}>✓</span>
                        <span style={{fontSize:12.5,lineHeight:1.65,color:"var(--tx)",opacity:.88}}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {c.analogy&&<div className="cc-analogy"><div style={{fontSize:9,fontWeight:700,color:c.color,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>💡 Analogy</div><p>"{c.analogy}"</p></div>}
                {c.Viz&&<c.Viz/>}
                {c.Viz2D&&<><div style={{fontFamily:"var(--fd)",fontSize:12.5,fontWeight:700,margin:"12px 0 8px"}}>🗺️ 2D DP Visualizer</div><c.Viz2D/></>}
                {c.FastSlowViz&&<><div style={{fontFamily:"var(--fd)",fontSize:12.5,fontWeight:700,margin:"12px 0 8px"}}>🐇 Fast & Slow Pointer Visualizer</div><c.FastSlowViz/></>}
                {c.steps.length>0&&<><div style={{fontFamily:"var(--fd)",fontSize:12.5,fontWeight:700,marginBottom:9}}>🧩 How It Works — Step by Step</div>
                <div className="cc-steps">{c.steps.map((s,i)=><div className="cc-step" key={i}><div className="cc-step-num" style={{background:`${s.c}18`,color:s.c}}>{String(i+1).padStart(2,"0")}</div><div><h5>{s.title}</h5><p>{s.desc}</p></div></div>)}</div></>}
                {c.aha&&<div className="cc-aha"><div style={{fontSize:9,fontWeight:700,color:"var(--y)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:5}}>⚡ The Key Insight</div><p>{c.aha}</p></div>}
                {c.keyPoints&&c.keyPoints.length>0&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontFamily:"var(--fd)",fontSize:12.5,fontWeight:700,marginBottom:9}}>📋 Beginner Checklist — Before You Code</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {c.keyPoints.map((kp,i)=>(
                        <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",background:"var(--sur)",border:"1px solid var(--bdr)",borderRadius:7,padding:"9px 13px"}}>
                          <span style={{color:"var(--g)",fontWeight:700,fontSize:13,lineHeight:1.6,flexShrink:0}}>→</span>
                          <span style={{fontSize:12.5,lineHeight:1.65,color:"var(--tx)",opacity:.9}}>{kp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {c.problems.length>0&&<><div style={{fontFamily:"var(--fd)",fontSize:12.5,fontWeight:700,marginBottom:8}}>🎯 Practice These First</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{c.problems.map(p=><span key={p} style={{padding:"3px 10px",background:"var(--sur)",border:"1px solid var(--bdr)",borderRadius:20,fontSize:11.5,color:"var(--mu)"}}>{p}</span>)}</div></>}
              </div>)}
            </div>);
          })}
        </>)}

        {tab==="problems"&&(<>
          <div className="sh"><span className="sh-em">📋</span><div><h2>NeetCode 150 — All 18 Categories</h2><p>Check off problems as you solve them. Track your progress.</p></div></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:22}}>
            {[{l:"Easy",c:"var(--g)",n:28},{l:"Medium",c:"var(--y)",n:101},{l:"Hard",c:"var(--r)",n:21},{l:"Total",c:"var(--b)",n:150},{l:"Solved",c:"var(--g)",n:totalDone}].map(s=><div key={s.l} style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:10,color:"var(--mu)",marginBottom:3}}>{s.l}</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800,color:s.c}}>{s.n}</div></div>)}
          </div>
          {NC150.map((cat,ci)=>{
            const catDone=cat.problems.filter((_,pi)=>done[`${ci}-${pi}`]).length;
            const isOpen=openCat===ci;
            return(<div key={ci} style={{background:"var(--card)",border:`1px solid ${isOpen?"var(--g)":"var(--bdr)"}`,borderRadius:12,marginBottom:8,overflow:"hidden",transition:"border-color .2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer"}} onClick={()=>setOpenCat(isOpen?null:ci)}>
                <div style={{flex:1}}><div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,marginBottom:3}}>{cat.name}</div><div className="prog-bar" style={{width:100}}><div className="prog-fill" style={{width:`${(catDone/cat.count)*100}%`}}/></div></div>
                <span style={{fontSize:11.5,color:"var(--mu)",whiteSpace:"nowrap"}}>{catDone}/{cat.count}</span>
                <span style={{fontSize:14,color:"var(--mu)",transition:"transform .2s",transform:isOpen?"rotate(180deg)":"none"}}>▾</span>
              </div>
              {isOpen&&<div style={{borderTop:"1px solid var(--bdr)",padding:"10px 16px"}}>
                {cat.problems.map((p,pi)=>{ const k=`${ci}-${pi}`,isDone=done[k]; return(
                  <div key={pi} className="prob-row" onClick={()=>toggleDone(ci,pi)}>
                    <div className={`prob-check ${isDone?"checked":""}`}>{isDone&&<span style={{fontSize:9,color:"#0C0E14",fontWeight:800}}>✓</span>}</div>
                    <span className="prob-title" style={{textDecoration:isDone?"line-through":"none",color:isDone?"var(--mu)":"var(--tx)"}}>{p.t}</span>
                    <span className={`prob-diff diff-${p.d}`}>{p.d==="E"?"Easy":p.d==="M"?"Med":"Hard"}</span>
                  </div>);
                })}
              </div>}
            </div>);
          })}
        </>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ██  DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard({onSelect,onPrep}: DashboardProps) {
  const roadmap=["Arrays","Linked List","Stack","Queue","Hash Map","Tree","Heap","Trie","Graph"];
  return(<>
    <div className="hero">
      <div className="hero-tag">🎯 Complete DSA Platform</div>
      <h1>Learn DSA<br/><span>the Right Way</span></h1>
      <p>9 data structures · 14 algorithm patterns · NeetCode 150 — all with animated diagrams and real-world analogies.</p>
      <div className="hero-stats">
        <div><div className="stat-n">9</div><div className="stat-l">DS Topics</div></div>
        <div><div className="stat-n" style={{color:"var(--g)"}}>14</div><div className="stat-l">Patterns</div></div>
        <div><div className="stat-n" style={{color:"var(--b)"}}>150</div><div className="stat-l">Problems</div></div>
      </div>
    </div>
    <div className="cx fadeUp">
      <div className="sh"><span className="sh-em">🏗️</span><div><h2>Data Structures</h2><p>Every algorithm runs on a data structure. Master these first.</p></div></div>
      <div className="cg">
        {TOPICS.map(t=><div key={t.id} className="tc" onClick={()=>onSelect(t)}>
          <div className="tc-bar" style={{background:t.color}}/>
          <div className="tc-icon">{t.icon}</div>
          <div className="tc-title">{t.title}</div>
          <div className="tc-desc">{t.desc}</div>
          <div className="tc-foot">
            <span className={`badge ${t.tag==="easy"?"be":t.tag==="medium"?"bm":"bh"}`}>{t.tag}</span>
            <span style={{fontSize:12,color:t.color,fontWeight:600}}>Open →</span>
          </div>
        </div>)}
      </div>
      <div className="rm">
        <h3>📍 Learning Roadmap</h3>
        <div className="rm-row">{roadmap.map((step,i)=><div key={step} style={{display:"flex",alignItems:"center",flexShrink:0}}>
          <div className="rm-step" style={{background:i<6?"#172a1f":"var(--sur)",color:i<6?"var(--g)":"var(--mu)",border:`1px solid ${i<6?"#253d2a":"var(--bdr)"}`}}>{i<6?"✓ ":""}{step}</div>
          {i<roadmap.length-1&&<div style={{width:14,height:1,background:i<5?"var(--g)":"var(--bdr)",flexShrink:0}}/>}
        </div>)}</div>
      </div>
      <div className="sh"><span className="sh-em">🎯</span><div><h2>Interview Prep</h2><p>14 patterns + NeetCode 150 problems. Understand patterns, not solutions.</p></div></div>
      <div style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:12,padding:"18px 20px",marginBottom:24,cursor:"pointer",transition:"all .2s"}}
        onClick={onPrep} onMouseOver={e=>e.currentTarget.style.borderColor="#2e3650"} onMouseOut={e=>e.currentTarget.style.borderColor="var(--bdr)"}>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:800,marginBottom:5}}>All 14 Algorithm Patterns + NeetCode 150</div>
            <p style={{fontSize:12.5,color:"var(--mu)",lineHeight:1.6}}>Two Pointers · Sliding Window · Binary Search · Prefix Sum · Monotonic Stack · BFS/DFS · Union Find · Topological Sort · DP · Backtracking · Greedy · Sorting · Intervals · Bit Manipulation</p>
          </div>
          <span style={{fontSize:13,color:"var(--g)",fontWeight:600,whiteSpace:"nowrap"}}>Open Prep →</span>
        </div>
      </div>
    </div>
  </>);
}

// ═══════════════════════════════════════════════════════════════
// ██  NAV
// ═══════════════════════════════════════════════════════════════
const NAV: NavItem[]=[
  {id:"home",label:"Dashboard",icon:"⌂"},
  {section:"Data Structures"},
  {id:"arrays",label:"Arrays",icon:"📦",tag:"easy"},
  {id:"linked-list",label:"Linked List",icon:"🔗",tag:"easy"},
  {id:"stack",label:"Stack",icon:"🥞",tag:"easy"},
  {id:"queue",label:"Queue",icon:"🎫",tag:"easy"},
  {id:"hash-map",label:"Hash Map",icon:"🗺️",tag:"medium"},
  {id:"binary-tree",label:"Binary Tree",icon:"🌲",tag:"medium"},
  {id:"heap",label:"Heap / Priority Queue",icon:"🏔️",tag:"medium"},
  {id:"trie",label:"Trie",icon:"🌳",tag:"medium"},
  {id:"graph",label:"Graph",icon:"🕸️",tag:"hard"},
  {section:"Algorithm Patterns"},
  {id:"prep",label:"All 14 Patterns",icon:"🎯"},
  {id:"two-pointer",label:"Two Pointers",icon:"👆",tag:"easy",sub:true},
  {id:"sliding-window",label:"Sliding Window",icon:"🪟",tag:"easy",sub:true},
  {id:"binary-search-algo",label:"Binary Search",icon:"🔍",tag:"medium",sub:true},
  {id:"prefix-sum",label:"Prefix Sum",icon:"➕",tag:"easy",sub:true},
  {id:"monotonic-stack",label:"Monotonic Stack",icon:"📉",tag:"medium",sub:true},
  {id:"bfs-dfs",label:"BFS & DFS",icon:"🕸️",tag:"medium",sub:true},
  {id:"fast-slow",label:"Fast & Slow Ptrs",icon:"🐇",tag:"easy",sub:true},
  {id:"dijkstra",label:"Dijkstra",icon:"🗺️",tag:"hard",sub:true},
  {id:"union-find",label:"Union Find",icon:"🔗",tag:"medium",sub:true},
  {id:"topological-sort",label:"Topological Sort",icon:"📋",tag:"medium",sub:true},
  {id:"dp",label:"Dynamic Programming",icon:"🧩",tag:"hard",sub:true},
  {id:"backtracking",label:"Backtracking",icon:"🌿",tag:"hard",sub:true},
  {id:"greedy",label:"Greedy",icon:"🏃",tag:"medium",sub:true},
  {id:"sorting-algos",label:"Sorting Algorithms",icon:"🔀",tag:"medium",sub:true},
  {id:"intervals",label:"Intervals",icon:"📅",tag:"medium",sub:true},
  {id:"bit-manipulation",label:"Bit Manipulation",icon:"⚡",tag:"medium",sub:true},
  {section:"Practice"},
  {id:"neetcode150",label:"NeetCode 150",icon:"📋"},
];

// ═══════════════════════════════════════════════════════════════
// ██  APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [page,setPage]=useState("home");
  const [topic,setTopic]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const mainRef=useRef(null);

  const goHome=()=>{setPage("home");setTopic(null);setSidebarOpen(false);};
  const goPrep=()=>{setPage("prep");setTopic(null);setSidebarOpen(false);};
  const selectTopic=t=>{setTopic(t);setPage(t.id);setSidebarOpen(false);};

  const navTo=item=>{
    if(item.locked)return;
    if(item.id==="home"){goHome();return;}
    if(item.id==="prep"||item.id==="neetcode150"){goPrep();return;}
    // DS topic?
    const t=TOPICS.find(t=>t.id===item.id);
    if(t){selectTopic(t);return;}
    // Pattern? Open prep and scroll
    goPrep();
  };

  useEffect(()=>{mainRef.current?.scrollTo(0,0);},[page]);

  return(
    <div className="app">
      {/* Mobile topbar */}
      <div className="topbar">
        <div className="topbar-logo">⚡ AlgoPath</div>
        <button className="menu-btn" onClick={()=>setSidebarOpen(o=>!o)}>☰</button>
      </div>
      <div className={`overlay ${sidebarOpen?"show":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* Sidebar */}
      <nav className={`sb ${sidebarOpen?"open":""}`}>
        <div className="sb-logo">⚡ AlgoPath</div>
        {NAV.map((item,i)=>{
          if(item.section)return<div key={i} className="sb-sec">{item.section}</div>;
          return(<div key={item.id} className={`ni ${page===item.id?"active":""} ${item.locked?"locked":""}`}
            style={{paddingLeft:item.sub?"18px":undefined,fontSize:item.sub?"11.5px":undefined}}
            onClick={()=>navTo(item)}>
            <span style={{fontSize:item.sub?"12px":undefined}}>{item.icon}</span>
            <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>
            {item.tag&&<span className={`badge ${item.tag==="easy"?"be":item.tag==="medium"?"bm":"bh"}`}>{item.tag[0].toUpperCase()}</span>}
          </div>);
        })}
      </nav>

      {/* Main */}
      <main className="main" ref={mainRef}>
        {page==="prep"||page==="neetcode150" ? <PrepPage/> :
         topic ? <LessonPage topic={topic} onBack={goHome}/> :
         <Dashboard onSelect={selectTopic} onPrep={goPrep}/>}
      </main>
    </div>
  );
}
