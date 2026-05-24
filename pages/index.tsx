import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0A0C11;--sur:#10131A;--card:#161922;--bdr:#1E2330;
  --g:#4EFFA0;--b:#5B8CFF;--y:#FFCC44;--r:#FF6B6B;--p:#C084FC;--o:#FF9F5B;
  --tx:#E4E8F0;--mu:#556070;
  --fd:'Space Grotesk',sans-serif;--fb:'Inter',sans-serif;--fc:'JetBrains Mono',monospace;
}
body{background:var(--bg);color:var(--tx);font-family:var(--fb);overflow-x:hidden}
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:800px;border-radius:50%;background:radial-gradient(circle,rgba(78,255,160,.04),transparent 70%);pointer-events:none}
.tag{display:inline-flex;align-items:center;gap:6px;background:#172a1f;color:var(--g);font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;letter-spacing:.5px;margin-bottom:20px}
h1{font-family:var(--fd);font-size:clamp(32px,7vw,72px);font-weight:800;line-height:1.08;letter-spacing:-2px;max-width:900px;margin-bottom:20px}
h1 span{color:var(--g)}
.sub{color:var(--mu);font-size:clamp(14px,2vw,18px);line-height:1.7;max-width:560px;margin-bottom:40px}
.cta-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:60px}
.btn-primary{padding:14px 32px;border-radius:10px;background:#172a1f;color:var(--g);border:1px solid #253d2a;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;transition:all .2s;font-family:var(--fb)}
.btn-primary:hover{background:#1e3828;transform:translateY(-1px)}
.btn-secondary{padding:14px 32px;border-radius:10px;background:var(--card);color:var(--tx);border:1px solid var(--bdr);font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:var(--fb)}
.btn-secondary:hover{border-color:#2e3650;transform:translateY(-1px)}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;max-width:960px;width:100%;margin-bottom:60px}
.feat{background:var(--card);border:1px solid var(--bdr);border-radius:14px;padding:22px;text-align:left;transition:all .2s}
.feat:hover{border-color:#2e3650;transform:translateY(-2px)}
.feat-icon{font-size:28px;margin-bottom:12px}
.feat-title{font-family:var(--fd);font-size:14px;font-weight:700;margin-bottom:6px}
.feat-desc{font-size:12.5px;color:var(--mu);line-height:1.6}
.stats-row{display:flex;gap:40px;justify-content:center;flex-wrap:wrap;margin-bottom:60px}
.stat{text-align:center}
.stat-n{font-family:var(--fd);font-size:32px;font-weight:800;color:var(--g)}
.stat-l{font-size:12px;color:var(--mu);margin-top:3px}
.nav{position:fixed;top:0;left:0;right:0;z-index:99;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;background:rgba(10,12,17,.8);backdrop-filter:blur(12px);border-bottom:1px solid rgba(30,35,48,.5)}
.nav-logo{font-family:var(--fd);font-size:18px;font-weight:800;color:var(--g);text-decoration:none}
.nav-links{display:flex;gap:8px}
.nav-link{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:all .15s}
.nl-ghost{color:var(--mu);border:1px solid transparent}.nl-ghost:hover{color:var(--tx);background:var(--card)}
.nl-solid{color:var(--g);background:#172a1f;border:1px solid #253d2a}.nl-solid:hover{background:#1e3828}
@media(max-width:600px){.nav-links .nav-link:first-child{display:none}.stats-row{gap:24px}.stat-n{font-size:24px}}
`;

export default function Home() {
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('home-styles')) {
      const s = document.createElement('style');
      s.id = 'home-styles';
      s.textContent = css;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <>
      <Head>
        <title>AlgoPath — Master DSA Interactively</title>
      </Head>

      <nav className="nav">
        <span className="nav-logo">⚡ AlgoPath</span>
        <div className="nav-links">
          <Link href="/learn" className="nav-link nl-ghost">Learn</Link>
          <Link href="/solutions" className="nav-link nl-ghost">Solutions</Link>
          <Link href="/dashboard" className="nav-link nl-solid">Dashboard →</Link>
        </div>
      </nav>

      <main className="hero">
        <div className="tag">⚡ Free · Open Source · No Login Required</div>
        <h1>Master DSA with<br /><span>Interactive Visualizers</span></h1>
        <p className="sub">
          9 animated data structures. 16 algorithm patterns. NeetCode 150 tracker.
          AI-powered solutions with 4 providers. All in your browser.
        </p>
        <div className="cta-row">
          <Link href="/learn" className="btn-primary">Start Learning →</Link>
          <Link href="/dashboard" className="btn-secondary">Track Progress</Link>
        </div>

        <div className="stats-row">
          {[["9","Data Structures"],["16","Algorithm Patterns"],["150","NeetCode Problems"],["4","AI Providers"]].map(([n,l])=>(
            <div key={l} className="stat">
              <div className="stat-n">{n}</div>
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>

        <div className="features">
          {[
            {icon:"🎯",title:"Interactive Visualizers",desc:"Watch arrays shift, trees traverse, heaps bubble — animations make O(n) intuitive."},
            {icon:"🤖",title:"AI-Powered Solutions",desc:"Every problem explained by NVIDIA, OpenAI, Anthropic, or Gemini. Switch providers at runtime."},
            {icon:"📊",title:"Progress Dashboard",desc:"Track your NeetCode 150 journey with streaks, heatmaps, badges, notes, and bookmarks."},
            {icon:"🔍",title:"Full Search",desc:"Search across all 150 problems, 16 patterns, and 9 data structures instantly."},
            {icon:"💾",title:"100% Local",desc:"All your data stays in your browser. No accounts, no servers, no tracking."},
            {icon:"📱",title:"Mobile Ready",desc:"Fully responsive. Study on your phone, tablet, or desktop — same experience everywhere."},
          ].map(f=>(
            <div key={f.title} className="feat">
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
