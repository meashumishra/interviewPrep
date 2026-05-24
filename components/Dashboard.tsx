import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────
type Difficulty = "E" | "M" | "H";
type PageId = "dashboard" | "problems" | "search" | "bookmarks" | "notes" | "settings";
type Theme = "dark" | "light";

interface NCProblem { n: string; d: Difficulty; }
interface NCCategory { cat: string; probs: NCProblem[]; }
interface ProblemWithCat extends NCProblem { cat: string; }

interface BadgeDef {
  id: string; icon: string; name: string; desc: string;
  check: (done: Record<string, boolean>, streak: number, allProbs: ProblemWithCat[], notes: Record<string, string>, bookmarks: string[]) => boolean;
}

interface PBarProps { pct: number; color?: string; height?: number; }
interface DPillProps { d: Difficulty; }

interface DashboardPageProps {
  done: Record<string, boolean>; streak: number;
  notes: Record<string, string>; bookmarks: string[];
}
interface ProblemsPageProps {
  done: Record<string, boolean>;
  setDone: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  bookmarks: string[]; setBookmarks: React.Dispatch<React.SetStateAction<string[]>>;
  notes: Record<string, string>; setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  logActivity: () => void;
}
interface SearchPageProps { done: Record<string, boolean>; setPage: (page: PageId) => void; }
interface NotesPageProps { notes: Record<string, string>; setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>; }
interface BookmarksPageProps {
  bookmarks: string[]; setBookmarks: React.Dispatch<React.SetStateAction<string[]>>;
  done: Record<string, boolean>; setDone: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  logActivity: () => void;
}
interface SettingsPageProps {
  done: Record<string, boolean>; setDone: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setBookmarks: React.Dispatch<React.SetStateAction<string[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  theme: Theme; setTheme: (t: Theme) => void;
}
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

// ── CSS ───────────────────────────────────────────────────────────
const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0A0C11;--sur:#10131A;--card:#161922;--bdr:#1E2330;--fa:#181C28;
  --g:#4EFFA0;--b:#5B8CFF;--y:#FFCC44;--r:#FF6B6B;--p:#C084FC;--o:#FF9F5B;
  --tx:#E4E8F0;--mu:#556070;--fd:'Space Grotesk',sans-serif;--fb:'Inter',sans-serif;--fc:'JetBrains Mono',monospace;
}
[data-theme="light"]{
  --bg:#F4F6FB;--sur:#FFFFFF;--card:#F0F2F8;--bdr:#DDE1EE;--fa:#E8EBF5;
  --tx:#1A1E2E;--mu:#6B7490;
}
body{background:var(--bg);color:var(--tx);font-family:var(--fb);overflow-x:hidden;transition:background .3s,color .3s}
button,input,textarea,select{font-family:var(--fb);outline:none}
button{cursor:pointer}
input:focus,textarea:focus,select:focus{border-color:var(--g)!important}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}

/* ── Layout ── */
.app{display:flex;min-height:100vh}
.sb{width:240px;min-width:240px;background:var(--sur);border-right:1px solid var(--bdr);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:100;overflow-y:auto;transition:transform .25s ease}
.main{margin-left:240px;flex:1;min-height:100vh;overflow-x:hidden}

/* ── Topbar mobile ── */
.topbar{display:none;position:fixed;top:0;left:0;right:0;z-index:99;background:var(--sur);border-bottom:1px solid var(--bdr);padding:10px 16px;align-items:center;justify-content:space-between;gap:8px}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:98}
.overlay.show{display:block}
.menu-btn{background:none;border:1px solid var(--bdr);border-radius:7px;padding:5px 10px;color:var(--tx);font-size:15px}

/* ── Sidebar internals ── */
.sb-logo{font-family:var(--fd);font-size:16px;font-weight:800;color:var(--g);padding:16px 14px 10px;display:flex;align-items:center;justify-content:space-between}
.sb-search{margin:0 10px 10px;padding:7px 11px;border-radius:8px;background:var(--card);border:1px solid var(--bdr);color:var(--tx);font-size:12.5px;width:calc(100% - 20px);transition:border-color .15s}
.sb-sec{font-size:9px;font-weight:700;color:var(--mu);letter-spacing:2px;text-transform:uppercase;padding:10px 14px 4px}
.ni{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:7px;cursor:pointer;font-size:12.5px;font-weight:500;color:var(--mu);transition:all .15s;margin:0 4px 1px}
.ni:hover,.ni:focus-visible{background:var(--card);color:var(--tx);outline:none}
.ni.active{background:#172a1f;color:var(--g)}
.ni-badge{margin-left:auto;font-size:9px;padding:2px 7px;border-radius:20px;font-weight:700;flex-shrink:0}
.nb-g{background:#172a1f;color:var(--g)}.nb-y{background:#2a2610;color:var(--y)}.nb-r{background:#2a1616;color:var(--r)}.nb-b{background:#161e2e;color:var(--b)}

/* ── Page header ── */
.page-hero{padding:32px 40px 24px;border-bottom:1px solid var(--bdr);background:linear-gradient(140deg,var(--sur),var(--bg))}
.page-hero h1{font-family:var(--fd);font-size:24px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px}
.page-hero p{color:var(--mu);font-size:13.5px;line-height:1.6;max-width:500px}

/* ── Cards / Grid ── */
.cx{padding:28px 40px}
.grid-2{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:28px}
.grid-3{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:24px}
.grid-4{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:24px}
.card{background:var(--card);border:1px solid var(--bdr);border-radius:12px;padding:18px;transition:all .2s}
.card:hover{border-color:#2e3650;transform:translateY(-1px)}
.card-sm{padding:14px}
.sec-title{font-family:var(--fd);font-size:15px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px}

/* ── Stat cards ── */
.stat-card{background:var(--card);border:1px solid var(--bdr);border-radius:12px;padding:16px 18px}
.stat-num{font-family:var(--fd);font-size:28px;font-weight:800;margin-bottom:3px}
.stat-label{font-size:11px;color:var(--mu)}
.stat-sub{font-size:11px;color:var(--mu);margin-top:4px}

/* ── Progress bar ── */
.prog-wrap{height:6px;background:var(--fa);border-radius:3px;overflow:hidden}
.prog-fill{height:100%;border-radius:3px;transition:width .5s ease}

/* ── Streak calendar ── */
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:8px}
.cal-day{height:14px;border-radius:2px;transition:all .2s}
.cal-day:hover{transform:scale(1.3)}

/* ── Badges ── */
.badges-grid{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
.badge-card{display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 16px;background:var(--card);border:1px solid var(--bdr);border-radius:12px;text-align:center;min-width:90px;transition:all .2s}
.badge-card.earned{border-color:var(--g);background:linear-gradient(135deg,#172a1f,#131a16)}
.badge-card.locked{opacity:.4;filter:grayscale(1)}
.badge-icon{font-size:28px}
.badge-name{font-size:10.5px;font-weight:700;color:var(--mu)}
.badge-card.earned .badge-name{color:var(--g)}
.badge-desc{font-size:9.5px;color:var(--mu);line-height:1.4}

/* ── Search results ── */
.search-result{display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--sur);border:1px solid var(--bdr);border-radius:8px;cursor:pointer;transition:all .15s;margin-bottom:5px}
.search-result:hover{background:var(--card);border-color:#2e3650}
.search-result:focus-visible{outline:2px solid var(--g);outline-offset:1px}
.sr-cat{font-size:9.5px;color:var(--mu);background:var(--card);padding:2px 7px;border-radius:20px;flex-shrink:0}

/* ── Problem checklist ── */
.prob-item{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--sur);border:1px solid var(--bdr);border-radius:8px;margin-bottom:4px;transition:all .15s}
.prob-item:hover{background:var(--card)}
.chk{width:18px;height:18px;border-radius:4px;border:1.5px solid var(--bdr);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.chk.on{background:var(--g);border-color:var(--g)}
.diff-pill{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:20px;flex-shrink:0}
.dE{background:#172a1f;color:var(--g)}.dM{background:#2a2610;color:var(--y)}.dH{background:#2a1616;color:var(--r)}

/* ── Notes ── */
.note-card{background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:8px}
.note-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.note-prob{font-size:12.5px;font-weight:600;flex:1}
.note-date{font-size:10px;color:var(--mu)}
.note-text{font-size:12.5px;color:var(--mu);line-height:1.6;white-space:pre-wrap}
.note-input{width:100%;padding:8px 11px;border-radius:7px;background:var(--sur);border:1px solid var(--bdr);color:var(--tx);font-size:12.5px;resize:vertical;min-height:70px;line-height:1.6;transition:border-color .15s}

/* ── Bookmarks ── */
.bm-chip{display:flex;align-items:center;gap:7px;padding:7px 12px;background:var(--sur);border:1px solid var(--bdr);border-radius:8px;font-size:12.5px;cursor:pointer;transition:all .15s;margin-bottom:4px}
.bm-chip:hover{background:var(--card);border-color:#2e3650}
.bm-remove{margin-left:auto;color:var(--mu);font-size:14px;background:none;border:none;cursor:pointer;padding:2px 4px;border-radius:4px;line-height:1}
.bm-remove:hover{color:var(--r)}

/* ── Filter chips ── */
.filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.filter-chip{padding:4px 12px;border-radius:20px;font-size:11.5px;font-weight:600;border:1px solid var(--bdr);color:var(--mu);cursor:pointer;background:none;transition:all .15s}
.filter-chip.active{background:#172a1f;color:var(--g);border-color:#253d2a}
.filter-chip:hover:not(.active){background:var(--card);color:var(--tx)}

/* ── Theme toggle ── */
.theme-btn{background:none;border:1px solid var(--bdr);border-radius:7px;padding:4px 8px;color:var(--mu);font-size:13px;transition:all .15s}
.theme-btn:hover{border-color:var(--g);color:var(--g)}

/* ── Animations ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.fadeUp{animation:fadeUp .3s ease both}

/* ── Responsive ── */
@media(max-width:768px){
  .sb{transform:translateX(-100%)}.sb.open{transform:translateX(0)}
  .topbar{display:flex}.main{margin-left:0;padding-top:50px}
  .page-hero{padding:20px 16px 16px}.page-hero h1{font-size:20px}
  .cx{padding:16px 14px}
  .grid-2,.grid-3,.grid-4{grid-template-columns:1fr 1fr}
}
@media(max-width:480px){
  .grid-2,.grid-3,.grid-4{grid-template-columns:1fr}
  .cx{padding:12px 10px}
}

/* ── Focus styles (a11y) ── */
:focus-visible{outline:2px solid var(--g);outline-offset:2px;border-radius:4px}
button:focus-visible,a:focus-visible{outline:2px solid var(--g);outline-offset:2px}

/* ── Skip to content ── */
.skip-link{position:absolute;top:-40px;left:8px;background:var(--g);color:#000;padding:6px 12px;border-radius:6px;font-weight:700;font-size:13px;z-index:999;transition:top .2s}
.skip-link:focus{top:8px}
`;
if (typeof document !== 'undefined') {
  const existing = document.getElementById('algopath-dashboard-styles');
  if (!existing) {
    const sEl = document.createElement("style");
    sEl.id = 'algopath-dashboard-styles';
    sEl.textContent = css;
    document.head.appendChild(sEl);
  }
}

// ═══════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════
const NC150: NCCategory[] = [
  {cat:"Arrays & Hashing",probs:[
    {n:"Contains Duplicate",d:"E"},{n:"Valid Anagram",d:"E"},{n:"Two Sum",d:"E"},
    {n:"Group Anagrams",d:"M"},{n:"Top K Frequent Elements",d:"M"},{n:"Product of Array Except Self",d:"M"},
    {n:"Valid Sudoku",d:"M"},{n:"Encode and Decode Strings",d:"M"},{n:"Longest Consecutive Sequence",d:"M"},
  ]},
  {cat:"Two Pointers",probs:[
    {n:"Valid Palindrome",d:"E"},{n:"Two Sum II",d:"M"},{n:"3Sum",d:"M"},
    {n:"Container With Most Water",d:"M"},{n:"Trapping Rain Water",d:"H"},
  ]},
  {cat:"Sliding Window",probs:[
    {n:"Best Time to Buy/Sell Stock",d:"E"},{n:"Longest Substring Without Repeating Chars",d:"M"},
    {n:"Longest Repeating Char Replacement",d:"M"},{n:"Permutation in String",d:"M"},
    {n:"Minimum Window Substring",d:"H"},{n:"Sliding Window Maximum",d:"H"},
  ]},
  {cat:"Stack",probs:[
    {n:"Valid Parentheses",d:"E"},{n:"Min Stack",d:"M"},{n:"Evaluate Reverse Polish Notation",d:"M"},
    {n:"Daily Temperatures",d:"M"},{n:"Car Fleet",d:"M"},{n:"Largest Rectangle in Histogram",d:"H"},
  ]},
  {cat:"Binary Search",probs:[
    {n:"Binary Search",d:"E"},{n:"Search a 2D Matrix",d:"M"},{n:"Koko Eating Bananas",d:"M"},
    {n:"Find Min in Rotated Sorted Array",d:"M"},{n:"Search in Rotated Sorted Array",d:"M"},
    {n:"Time Based Key-Value Store",d:"M"},{n:"Median of Two Sorted Arrays",d:"H"},
  ]},
  {cat:"Linked List",probs:[
    {n:"Reverse Linked List",d:"E"},{n:"Merge Two Sorted Lists",d:"E"},{n:"Linked List Cycle",d:"E"},
    {n:"Reorder List",d:"M"},{n:"Remove Nth Node From End",d:"M"},{n:"Copy List with Random Pointer",d:"M"},
    {n:"Add Two Numbers",d:"M"},{n:"Find the Duplicate Number",d:"M"},{n:"LRU Cache",d:"M"},
    {n:"Merge k Sorted Lists",d:"H"},{n:"Reverse Nodes in k-Group",d:"H"},
  ]},
  {cat:"Trees",probs:[
    {n:"Invert Binary Tree",d:"E"},{n:"Maximum Depth of Binary Tree",d:"E"},{n:"Diameter of Binary Tree",d:"E"},
    {n:"Balanced Binary Tree",d:"E"},{n:"Same Tree",d:"E"},{n:"Subtree of Another Tree",d:"E"},
    {n:"Lowest Common Ancestor BST",d:"M"},{n:"Binary Tree Level Order Traversal",d:"M"},
    {n:"Binary Tree Right Side View",d:"M"},{n:"Count Good Nodes",d:"M"},
    {n:"Validate BST",d:"M"},{n:"Kth Smallest in BST",d:"M"},
    {n:"Construct Tree from Pre/Inorder",d:"M"},{n:"Binary Tree Max Path Sum",d:"H"},
    {n:"Serialize and Deserialize Tree",d:"H"},
  ]},
  {cat:"Heap / Priority Queue",probs:[
    {n:"Kth Largest in Stream",d:"E"},{n:"Last Stone Weight",d:"E"},
    {n:"K Closest Points to Origin",d:"M"},{n:"Kth Largest in Array",d:"M"},
    {n:"Task Scheduler",d:"M"},{n:"Design Twitter",d:"M"},{n:"Find Median from Data Stream",d:"H"},
  ]},
  {cat:"Backtracking",probs:[
    {n:"Subsets",d:"M"},{n:"Combination Sum",d:"M"},{n:"Combination Sum II",d:"M"},
    {n:"Permutations",d:"M"},{n:"Subsets II",d:"M"},{n:"Word Search",d:"M"},
    {n:"Palindrome Partitioning",d:"M"},{n:"Letter Combinations of Phone Number",d:"M"},
    {n:"Generate Parentheses",d:"M"},{n:"N-Queens",d:"H"},
  ]},
  {cat:"Tries",probs:[
    {n:"Implement Trie",d:"M"},{n:"Design Add and Search Words",d:"M"},{n:"Word Search II",d:"H"},
  ]},
  {cat:"Graphs",probs:[
    {n:"Number of Islands",d:"M"},{n:"Max Area of Island",d:"M"},{n:"Clone Graph",d:"M"},
    {n:"Walls and Gates",d:"M"},{n:"Rotting Oranges",d:"M"},{n:"Pacific Atlantic Water Flow",d:"M"},
    {n:"Surrounded Regions",d:"M"},{n:"Course Schedule",d:"M"},{n:"Course Schedule II",d:"M"},
    {n:"Graph Valid Tree",d:"M"},{n:"Number of Connected Components",d:"M"},
    {n:"Redundant Connection",d:"M"},{n:"Word Ladder",d:"H"},
  ]},
  {cat:"Advanced Graphs",probs:[
    {n:"Reconstruct Itinerary",d:"H"},{n:"Min Cost to Connect All Points",d:"M"},
    {n:"Network Delay Time",d:"M"},{n:"Swim in Rising Water",d:"H"},
    {n:"Alien Dictionary",d:"H"},{n:"Cheapest Flights Within K Stops",d:"M"},
  ]},
  {cat:"1-D Dynamic Programming",probs:[
    {n:"Climbing Stairs",d:"E"},{n:"Min Cost Climbing Stairs",d:"E"},
    {n:"House Robber",d:"M"},{n:"House Robber II",d:"M"},
    {n:"Longest Palindromic Substring",d:"M"},{n:"Palindromic Substrings",d:"M"},
    {n:"Decode Ways",d:"M"},{n:"Coin Change",d:"M"},{n:"Maximum Product Subarray",d:"M"},
    {n:"Word Break",d:"M"},{n:"Longest Increasing Subsequence",d:"M"},
    {n:"Partition Equal Subset Sum",d:"M"},
  ]},
  {cat:"2-D Dynamic Programming",probs:[
    {n:"Unique Paths",d:"M"},{n:"Longest Common Subsequence",d:"M"},
    {n:"Best Time to Buy/Sell with Cooldown",d:"M"},{n:"Coin Change II",d:"M"},
    {n:"Target Sum",d:"M"},{n:"Interleaving String",d:"M"},
    {n:"Longest Increasing Path in Matrix",d:"H"},{n:"Distinct Subsequences",d:"H"},
    {n:"Edit Distance",d:"M"},{n:"Burst Balloons",d:"H"},{n:"Regular Expression Matching",d:"H"},
  ]},
  {cat:"Greedy",probs:[
    {n:"Maximum Subarray",d:"M"},{n:"Jump Game",d:"M"},{n:"Jump Game II",d:"M"},
    {n:"Gas Station",d:"M"},{n:"Hand of Straights",d:"M"},{n:"Merge Triplets",d:"M"},
    {n:"Partition Labels",d:"M"},{n:"Valid Parenthesis String",d:"M"},
  ]},
  {cat:"Intervals",probs:[
    {n:"Insert Interval",d:"M"},{n:"Merge Intervals",d:"M"},{n:"Non-overlapping Intervals",d:"M"},
    {n:"Meeting Rooms",d:"E"},{n:"Meeting Rooms II",d:"M"},{n:"Minimum Interval to Include Each Query",d:"H"},
  ]},
  {cat:"Math & Geometry",probs:[
    {n:"Rotate Image",d:"M"},{n:"Spiral Matrix",d:"M"},{n:"Set Matrix Zeroes",d:"M"},
    {n:"Happy Number",d:"E"},{n:"Plus One",d:"E"},{n:"Pow(x,n)",d:"M"},
    {n:"Multiply Strings",d:"M"},{n:"Detect Squares",d:"M"},
  ]},
  {cat:"Bit Manipulation",probs:[
    {n:"Single Number",d:"E"},{n:"Number of 1 Bits",d:"E"},{n:"Counting Bits",d:"E"},
    {n:"Reverse Bits",d:"E"},{n:"Missing Number",d:"E"},{n:"Sum of Two Integers",d:"M"},
    {n:"Reverse Integer",d:"M"},
  ]},
];

const ALL_PROBS: ProblemWithCat[] = NC150.flatMap(c => c.probs.map(p => ({...p, cat:c.cat})));
const TOTAL = ALL_PROBS.length; // 150

const DS_TOPICS: string[] = ["Arrays","Linked List","Stack","Queue","Hash Map","Binary Tree","Heap","Trie","Graph"];
const PATTERNS: string[] = ["Two Pointers","Sliding Window","Binary Search","Prefix Sum","Monotonic Stack","BFS & DFS","Union Find","Topological Sort","Dynamic Programming","Backtracking","Greedy","Sorting","Intervals","Bit Manipulation","Dijkstra","Fast & Slow Pointers"];

const BADGES: BadgeDef[] = [
  {id:"first_blood",  icon:"🩸", name:"First Blood",   desc:"Solve your first problem",       check:(d)=>Object.values(d).filter(Boolean).length>=1},
  {id:"hat_trick",   icon:"🎩", name:"Hat Trick",     desc:"Solve 3 problems",               check:(d)=>Object.values(d).filter(Boolean).length>=3},
  {id:"ten_club",    icon:"🔟", name:"Ten Club",      desc:"Solve 10 problems",              check:(d)=>Object.values(d).filter(Boolean).length>=10},
  {id:"quarter",     icon:"💎", name:"Quarter Way",   desc:"Solve 37+ problems (25%)",       check:(d)=>Object.values(d).filter(Boolean).length>=37},
  {id:"halfway",     icon:"⚡", name:"Halfway Hero",  desc:"Solve 75+ problems",             check:(d)=>Object.values(d).filter(Boolean).length>=75},
  {id:"century",     icon:"💯", name:"Century",       desc:"Solve 100 problems",             check:(d)=>Object.values(d).filter(Boolean).length>=100},
  {id:"legend",      icon:"🏆", name:"Legend",        desc:"Solve all 150 problems",         check:(d)=>Object.values(d).filter(Boolean).length>=150},
  {id:"hard_mode",   icon:"🔥", name:"Hard Mode",     desc:"Solve 5 Hard problems",          check:(d,_,allProbs)=>allProbs.filter(p=>p.d==="H"&&d[p.n]).length>=5},
  {id:"streak3",     icon:"📅", name:"3-Day Streak",  desc:"Study 3 days in a row",          check:(_,streak)=>streak>=3},
  {id:"streak7",     icon:"🗓️", name:"Week Warrior",  desc:"7-day study streak",             check:(_,streak)=>streak>=7},
  {id:"note_taker",  icon:"📝", name:"Note Taker",    desc:"Write notes on 5 problems",      check:(_,__,___,notes)=>Object.keys(notes).length>=5},
  {id:"bookmarker",  icon:"🔖", name:"Bookmarker",    desc:"Bookmark 10 problems",           check:(_,__,___,____,bms)=>bms.length>=10},
];

// ═══════════════════════════════════════════════════
// LOCAL STORAGE HELPERS
// ═══════════════════════════════════════════════════
function lsGet<T>(k: string, def: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : def; } catch { return def; }
}
function lsSet(k: string, v: unknown): void {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
const LS = { get: lsGet, set: lsSet };

// ═══════════════════════════════════════════════════
// STREAK CALCULATOR
// ═══════════════════════════════════════════════════
function calcStreak(activityLog: string[]): { streak: number; longest: number } {
  if(!activityLog||activityLog.length===0)return{streak:0,longest:0};
  const days=[...new Set(activityLog.map(d=>d.slice(0,10)))].sort();
  let streak=1,longest=1,cur=1;
  for(let i=1;i<days.length;i++){
    const diff=(new Date(days[i]).getTime()-new Date(days[i-1]).getTime())/(1000*60*60*24);
    if(diff===1){cur++;longest=Math.max(longest,cur);}else{cur=1;}
  }
  // Check if streak is current (last activity was today or yesterday)
  const lastDay=new Date(days[days.length-1]);
  const today=new Date();today.setHours(0,0,0,0);
  const diffToday=(today.getTime()-lastDay.getTime())/(1000*60*60*24);
  streak=diffToday<=1?cur:0;
  return{streak,longest:Math.max(longest,cur)};
}

// ═══════════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════════
class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(e){return{hasError:true,error:e};}
  componentDidCatch(e,info){console.error("DSA Dashboard error:",e,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{padding:40,textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:16}}>⚠️</div>
          <div style={{fontFamily:"Space Grotesk,sans-serif",fontSize:18,fontWeight:700,marginBottom:8}}>Something went wrong</div>
          <div style={{fontSize:13,color:"var(--mu)",marginBottom:20}}>{this.state.error?.message}</div>
          <button onClick={()=>this.setState({hasError:false,error:null})}
            style={{padding:"9px 20px",borderRadius:8,background:"#172a1f",color:"var(--g)",border:"1px solid #253d2a",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Need React for error boundary
if(typeof React==="undefined"){console.error("React not found");}

// ═══════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════

// Progress bar
const PBar = ({pct,color="var(--g)",height=6}: PBarProps) => (
  <div className="prog-wrap" style={{height}}>
    <div className="prog-fill" style={{width:`${pct}%`,background:color,height}}/>
  </div>
);

// Difficulty pill
const DPill = ({d}: DPillProps) => {
  const map={E:["Easy","dE"],M:["Medium","dM"],H:["Hard","dH"]};
  const [label,cls]=map[d]||["?",""];
  return <span className={`diff-pill ${cls}`}>{label}</span>;
};

// ─── DASHBOARD PAGE ──────────────────────────────
function DashboardPage({done,streak,notes,bookmarks}: DashboardPageProps) {
  const solved = useMemo(()=>Object.values(done).filter(Boolean).length,[done]);
  const pct = Math.round((solved/TOTAL)*100);
  const earnedBadges = useMemo(()=>BADGES.filter(b=>b.check(done,streak,ALL_PROBS,notes,bookmarks)),[done,streak,notes,bookmarks]);

  // Category progress
  const catProgress = useMemo(()=>NC150.map(c=>{
    const catSolved=c.probs.filter(p=>done[p.n]).length;
    return{...c,solved:catSolved,pct:Math.round((catSolved/c.probs.length)*100)};
  }),[done]);

  // Activity last 12 weeks
  const actLog = LS.get("dsa-activity",[]);
  const weekData = useMemo(()=>{
    const days=[];const now=new Date();
    for(let i=83;i>=0;i--){
      const d=new Date(now);d.setDate(d.getDate()-i);
      const key=d.toISOString().slice(0,10);
      days.push({key,count:actLog.filter(a=>a.slice(0,10)===key).length});
    }
    return days;
  },[actLog]);

  const heatColor=(count)=>{
    if(count===0)return"var(--fa)";
    if(count<=2)return"#172a1f";
    if(count<=5)return"#1e3828";
    return"var(--g)";
  };

  return(
    <div className="fadeUp">
      <div className="page-hero">
        <div className="hero-tag" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#172a1f",color:"var(--g)",fontSize:10,fontWeight:700,padding:"3px 11px",borderRadius:20,letterSpacing:.5,marginBottom:12}}>
          📊 Progress Dashboard
        </div>
        <h1>Your DSA Journey</h1>
        <p>Track your NeetCode 150 progress, study streak, badges, and notes — all in one place.</p>
      </div>

      <div className="cx">
        {/* Top stats */}
        <div className="grid-4" style={{marginBottom:24}}>
          {[
            {label:"Solved",val:solved,sub:`/ ${TOTAL} problems`,color:"var(--g)"},
            {label:"Progress",val:`${pct}%`,sub:"of NeetCode 150",color:"var(--b)"},
            {label:"Current Streak",val:`${streak}🔥`,sub:"days in a row",color:"var(--y)"},
            {label:"Badges Earned",val:earnedBadges.length,sub:`/ ${BADGES.length} total`,color:"var(--p)"},
          ].map(s=>(
            <div key={s.label} className="stat-card">
              <div className="stat-num" style={{color:s.color}}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="card" style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700}}>Overall Progress</div>
            <span style={{fontFamily:"var(--fc)",fontSize:13,color:"var(--g)",fontWeight:700}}>{solved}/{TOTAL}</span>
          </div>
          <PBar pct={pct}/>
          <div style={{display:"flex",gap:16,marginTop:10,fontSize:11,color:"var(--mu)"}}>
            {["E","M","H"].map(d=>{
              const tot=ALL_PROBS.filter(p=>p.d===d).length;
              const sv=ALL_PROBS.filter(p=>p.d===d&&done[p.n]).length;
              const col={E:"var(--g)",M:"var(--y)",H:"var(--r)"}[d];
              const label={E:"Easy",M:"Medium",H:"Hard"}[d];
              return <span key={d} style={{color:col}}>{label}: {sv}/{tot}</span>;
            })}
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="sec-title">📅 Study Activity (Last 12 Weeks)</div>
        <div className="card" style={{marginBottom:24}}>
          <div className="cal-grid" style={{gridTemplateColumns:`repeat(84,1fr)`}}>
            {weekData.map((d,i)=>(
              <div key={i} className="cal-day"
                style={{background:heatColor(d.count)}}
                title={`${d.key}: ${d.count} solve${d.count!==1?"s":""}`}
                role="img" aria-label={`${d.key}: ${d.count} solves`}/>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,fontSize:10.5,color:"var(--mu)"}}>
            <span>Less</span>
            {[0,2,4,6,8].map(c=><div key={c} style={{width:10,height:10,borderRadius:2,background:heatColor(c)}}/>)}
            <span>More</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="sec-title">📂 Category Breakdown</div>
        <div style={{display:"grid",gap:8,marginBottom:24}}>
          {catProgress.map(c=>(
            <div key={c.cat} className="card card-sm" style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:12.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cat}</span>
                  <span style={{fontSize:11,color:"var(--mu)",flexShrink:0,marginLeft:8}}>{c.solved}/{c.probs.length}</span>
                </div>
                <PBar pct={c.pct} color={c.pct===100?"var(--g)":c.pct>50?"var(--b)":"var(--y)"} height={4}/>
              </div>
              {c.pct===100&&<span style={{fontSize:16}} role="img" aria-label="Complete">✅</span>}
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="sec-title">🏆 Badges</div>
        <div className="badges-grid">
          {BADGES.map(b=>{
            const earned=b.check(done,streak,ALL_PROBS,notes,bookmarks);
            return(
              <div key={b.id} className={`badge-card ${earned?"earned":"locked"}`}
                role="img" aria-label={`${b.name}: ${earned?"Earned":"Locked"}`}>
                <div className="badge-icon">{b.icon}</div>
                <div className="badge-name">{b.name}</div>
                <div className="badge-desc">{b.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PROBLEMS PAGE ────────────────────────────────
function ProblemsPage({done,setDone,bookmarks,setBookmarks,notes,setNotes,logActivity}: ProblemsPageProps) {
  const [search,setSearch]=useState("");
  const [diffFilter,setDiffFilter]=useState("All");
  const [catFilter,setCatFilter]=useState("All");
  const [statusFilter,setStatusFilter]=useState("All");
  const [activeNote,setActiveNote]=useState(null);
  const [noteText,setNoteText]=useState("");
  const [openCats,setOpenCats]=useState({});

  const filtered=useMemo(()=>{
    return NC150.map(c=>({
      ...c,
      probs:c.probs.filter(p=>{
        const matchSearch=!search||p.n.toLowerCase().includes(search.toLowerCase());
        const matchDiff=diffFilter==="All"||p.d===diffFilter;
        const matchStatus=statusFilter==="All"||(statusFilter==="Done"&&done[p.n])||(statusFilter==="Todo"&&!done[p.n]);
        return matchSearch&&matchDiff&&matchStatus;
      })
    })).filter(c=>(catFilter==="All"||c.cat===catFilter)&&c.probs.length>0);
  },[search,diffFilter,catFilter,statusFilter,done]);

  const totalFiltered=filtered.reduce((s,c)=>s+c.probs.length,0);
  const doneFiltered=filtered.reduce((s,c)=>s+c.probs.filter(p=>done[p.n]).length,0);

  const toggle=(prob)=>{
    const wasOff=!done[prob.n];
    setDone(d=>{const nd={...d,[prob.n]:!d[prob.n]};LS.set("nc150-progress",nd);return nd;});
    if(wasOff)logActivity();
  };

  const toggleBM=(prob)=>{
    setBookmarks(bm=>{
      const exists=bm.includes(prob.n);
      const next=exists?bm.filter(b=>b!==prob.n):[...bm,prob.n];
      LS.set("dsa-bookmarks",next);return next;
    });
  };

  const openNoteFor=(prob)=>{
    setActiveNote(prob.n);
    setNoteText(notes[prob.n]||"");
  };

  const saveNote=()=>{
    if(!activeNote)return;
    setNotes(n=>{
      const updated=noteText.trim()?{...n,[activeNote]:noteText.trim()}:{...n};
      if(!noteText.trim())delete updated[activeNote];
      LS.set("dsa-notes",updated);return updated;
    });
    setActiveNote(null);
  };

  return(
    <div className="fadeUp">
      <div className="page-hero">
        <h1>NeetCode 150 Problems</h1>
        <p>Check off problems as you solve them. Filter by difficulty, status, or category. Add notes and bookmarks.</p>
      </div>

      <div className="cx">
        {/* Search + filters */}
        <input aria-label="Search problems" placeholder="🔍 Search problems..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"9px 14px",borderRadius:9,background:"var(--card)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:13,marginBottom:12}}/>

        <div className="filter-row" role="group" aria-label="Difficulty filter">
          {["All","E","M","H"].map(d=>(
            <button key={d} className={`filter-chip ${diffFilter===d?"active":""}`}
              aria-pressed={diffFilter===d}
              onClick={()=>setDiffFilter(d)}>
              {d==="All"?"All Diff":d==="E"?"Easy":d==="M"?"Medium":"Hard"}
            </button>
          ))}
        </div>
        <div className="filter-row" role="group" aria-label="Status filter">
          {["All","Todo","Done"].map(s=>(
            <button key={s} className={`filter-chip ${statusFilter===s?"active":""}`}
              aria-pressed={statusFilter===s}
              onClick={()=>setStatusFilter(s)}>{s}</button>
          ))}
        </div>

        <div style={{fontSize:12,color:"var(--mu)",marginBottom:16}}>
          Showing {doneFiltered}/{totalFiltered} solved across {filtered.length} categories
        </div>

        {/* Problem lists */}
        {filtered.map(c=>{
          const catSolved=c.probs.filter(p=>done[p.n]).length;
          const isOpen=openCats[c.cat]!==false;
          return(
            <div key={c.cat} style={{marginBottom:12}}>
              <button onClick={()=>setOpenCats(o=>({...o,[c.cat]:!isOpen}))}
                aria-expanded={isOpen}
                style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--card)",border:`1px solid ${catSolved===c.probs.length&&c.probs.length>0?"#253d2a":"var(--bdr)"}`,borderRadius:10,cursor:"pointer",color:"var(--tx)",marginBottom:isOpen?6:0,transition:"all .15s"}}>
                <span style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,flex:1,textAlign:"left"}}>{c.cat}</span>
                <div style={{width:80}}>
                  <PBar pct={c.probs.length?Math.round((catSolved/c.probs.length)*100):0} height={4}/>
                </div>
                <span style={{fontSize:11,color:"var(--mu)",flexShrink:0}}>{catSolved}/{c.probs.length}</span>
                <span style={{fontSize:12,color:"var(--mu)",transition:"transform .2s",transform:isOpen?"rotate(180deg)":"none"}}>▾</span>
              </button>

              {isOpen&&c.probs.map(prob=>(
                <div key={prob.n} className="prob-item">
                  <div className={`chk ${done[prob.n]?"on":""}`}
                    onClick={()=>toggle(prob)}
                    role="checkbox" aria-checked={!!done[prob.n]}
                    aria-label={`Mark ${prob.n} as ${done[prob.n]?"unsolved":"solved"}`}
                    tabIndex={0}
                    onKeyDown={e=>e.key===" "&&toggle(prob)}>
                    {done[prob.n]&&<span style={{fontSize:9.5,color:"#0C0E14",fontWeight:800}}>✓</span>}
                  </div>
                  <span style={{fontSize:12.5,flex:1,textDecoration:done[prob.n]?"line-through":"none",color:done[prob.n]?"var(--mu)":"var(--tx)"}}>{prob.n}</span>
                  <DPill d={prob.d}/>
                  {/* Notes button */}
                  <button onClick={()=>openNoteFor(prob)}
                    aria-label={`${notes[prob.n]?"Edit":"Add"} note for ${prob.n}`}
                    style={{background:notes[prob.n]?"#172a1f":"none",border:"1px solid var(--bdr)",borderRadius:6,padding:"3px 7px",color:notes[prob.n]?"var(--g)":"var(--mu)",fontSize:12,cursor:"pointer",flexShrink:0}}>
                    {notes[prob.n]?"📝":"✏️"}
                  </button>
                  {/* Bookmark button */}
                  <button onClick={()=>toggleBM(prob)}
                    aria-label={`${bookmarks.includes(prob.n)?"Remove":"Add"} bookmark for ${prob.n}`}
                    style={{background:bookmarks.includes(prob.n)?"#161e2e":"none",border:"1px solid var(--bdr)",borderRadius:6,padding:"3px 7px",color:bookmarks.includes(prob.n)?"var(--b)":"var(--mu)",fontSize:12,cursor:"pointer",flexShrink:0}}>
                    {bookmarks.includes(prob.n)?"🔖":"⬜"}
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {/* Note modal */}
        {activeNote&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
            onClick={e=>e.target===e.currentTarget&&saveNote()}>
            <div style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:14,padding:22,width:"100%",maxWidth:480}} role="dialog" aria-label={`Note for ${activeNote}`}>
              <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:700,marginBottom:12}}>{activeNote}</div>
              <textarea className="note-input" value={noteText} onChange={e=>setNoteText(e.target.value)}
                placeholder="Write your notes, approach, key insight..." autoFocus aria-label="Problem notes"/>
              <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
                <button onClick={()=>setActiveNote(null)}
                  style={{padding:"7px 16px",borderRadius:7,border:"1px solid var(--bdr)",background:"var(--sur)",color:"var(--mu)",fontSize:12.5,cursor:"pointer"}}>
                  Cancel
                </button>
                <button onClick={saveNote}
                  style={{padding:"7px 16px",borderRadius:7,border:"1px solid #253d2a",background:"#172a1f",color:"var(--g)",fontSize:12.5,fontWeight:600,cursor:"pointer"}}>
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SEARCH PAGE ─────────────────────────────────
function SearchPage({done,setPage}: SearchPageProps) {
  const [query,setQuery]=useState("");
  const inputRef=useRef(null);
  useEffect(()=>inputRef.current?.focus(),[]);

  const results=useMemo(()=>{
    if(!query.trim())return[];
    const q=query.toLowerCase();
    return ALL_PROBS.filter(p=>
      p.n.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q)||p.d.toLowerCase()===q
    ).slice(0,20);
  },[query]);

  // Also search patterns and DS topics
  const patternResults=useMemo(()=>{
    if(!query.trim())return[];
    const q=query.toLowerCase();
    return[...PATTERNS,...DS_TOPICS].filter(t=>t.toLowerCase().includes(q));
  },[query]);

  return(
    <div className="fadeUp">
      <div className="page-hero">
        <h1>Search Everything</h1>
        <p>Search problems, patterns, and data structures instantly.</p>
      </div>
      <div className="cx">
        <input ref={inputRef} aria-label="Search all content" placeholder="Search problems, patterns, algorithms..."
          value={query} onChange={e=>setQuery(e.target.value)}
          style={{width:"100%",padding:"11px 16px",borderRadius:10,background:"var(--card)",border:"1px solid var(--bdr)",color:"var(--tx)",fontSize:14,marginBottom:16}}/>

        {query&&(
          <>
            {patternResults.length>0&&(
              <>
                <div className="sec-title" style={{marginBottom:8}}>Patterns & Topics ({patternResults.length})</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
                  {patternResults.map(t=>(
                    <span key={t} style={{padding:"5px 13px",background:"#172a1f",color:"var(--g)",border:"1px solid #253d2a",borderRadius:20,fontSize:12,fontWeight:600}}>{t}</span>
                  ))}
                </div>
              </>
            )}

            <div className="sec-title" style={{marginBottom:8}}>Problems ({results.length}{results.length===20?" — showing first 20":""})</div>
            {results.length===0&&patternResults.length===0&&<div style={{color:"var(--mu)",fontSize:13}}>No results for "{query}"</div>}
            {results.map(p=>(
              <div key={p.n} className="search-result" tabIndex={0}
                onKeyDown={e=>e.key==="Enter"&&setPage("problems")}
                role="option" aria-selected={false}>
                <div className={`chk ${done[p.n]?"on":""}`} style={{flexShrink:0,cursor:"default"}}>
                  {done[p.n]&&<span style={{fontSize:9.5,color:"#0C0E14",fontWeight:800}}>✓</span>}
                </div>
                <span style={{fontSize:12.5,flex:1}}>{p.n}</span>
                <span className="sr-cat">{p.cat}</span>
                <DPill d={p.d}/>
              </div>
            ))}
          </>
        )}
        {!query&&(
          <div style={{color:"var(--mu)",fontSize:13,textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:36,marginBottom:12}}>🔍</div>
            <div>Start typing to search across all 150 problems, 16 patterns, and 9 data structures</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NOTES PAGE ──────────────────────────────────
function NotesPage({notes,setNotes}: NotesPageProps) {
  const [editing,setEditing]=useState(null);
  const [editText,setEditText]=useState("");

  const startEdit=(prob)=>{setEditing(prob);setEditText(notes[prob]||"");};
  const saveEdit=()=>{
    if(!editing)return;
    setNotes(n=>{
      const updated=editText.trim()?{...n,[editing]:editText.trim()}:{...n};
      if(!editText.trim())delete updated[editing];
      LS.set("dsa-notes",updated);return updated;
    });
    setEditing(null);
  };
  const deleteNote=(prob)=>{
    setNotes(n=>{const u={...n};delete u[prob];LS.set("dsa-notes",u);return u;});
  };

  const noteList=Object.entries(notes);

  return(
    <div className="fadeUp">
      <div className="page-hero">
        <h1>My Notes 📝</h1>
        <p>{noteList.length} note{noteList.length!==1?"s":""} saved across your problem-solving journey.</p>
      </div>
      <div className="cx">
        {noteList.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"var(--mu)"}}>
            <div style={{fontSize:36,marginBottom:12}}>📝</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No notes yet</div>
            <div style={{fontSize:13}}>Add notes to any problem from the Problems page</div>
          </div>
        )}
        {noteList.map(([prob,text])=>(
          <div key={prob} className="note-card">
            <div className="note-header">
              <span className="note-prob">{prob}</span>
              <button onClick={()=>startEdit(prob)} aria-label={`Edit note for ${prob}`}
                style={{background:"none",border:"1px solid var(--bdr)",borderRadius:6,padding:"3px 9px",color:"var(--mu)",fontSize:12,cursor:"pointer"}}>Edit</button>
              <button onClick={()=>deleteNote(prob)} aria-label={`Delete note for ${prob}`}
                style={{background:"none",border:"1px solid #3d2222",borderRadius:6,padding:"3px 9px",color:"var(--r)",fontSize:12,cursor:"pointer"}}>✕</button>
            </div>
            {editing===prob?(
              <>
                <textarea className="note-input" value={editText} onChange={e=>setEditText(e.target.value)} autoFocus aria-label={`Editing note for ${prob}`}/>
                <div style={{display:"flex",gap:7,marginTop:8}}>
                  <button onClick={saveEdit}
                    style={{padding:"6px 14px",borderRadius:7,background:"#172a1f",color:"var(--g)",border:"1px solid #253d2a",fontSize:12,fontWeight:600,cursor:"pointer"}}>Save</button>
                  <button onClick={()=>setEditing(null)}
                    style={{padding:"6px 14px",borderRadius:7,background:"var(--sur)",color:"var(--mu)",border:"1px solid var(--bdr)",fontSize:12,cursor:"pointer"}}>Cancel</button>
                </div>
              </>
            ):<div className="note-text">{text}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BOOKMARKS PAGE ───────────────────────────────
function BookmarksPage({bookmarks,setBookmarks,done,setDone,logActivity}: BookmarksPageProps) {
  const toggle=(name)=>{
    const prob=ALL_PROBS.find(p=>p.n===name);
    if(!prob)return;
    const wasOff=!done[name];
    setDone(d=>{const nd={...d,[name]:!d[name]};LS.set("nc150-progress",nd);return nd;});
    if(wasOff)logActivity();
  };
  const removeBM=(name)=>{
    setBookmarks(bm=>{const next=bm.filter(b=>b!==name);LS.set("dsa-bookmarks",next);return next;});
  };

  return(
    <div className="fadeUp">
      <div className="page-hero">
        <h1>Bookmarks 🔖</h1>
        <p>{bookmarks.length} problem{bookmarks.length!==1?"s":""} saved for focused review.</p>
      </div>
      <div className="cx">
        {bookmarks.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"var(--mu)"}}>
            <div style={{fontSize:36,marginBottom:12}}>🔖</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No bookmarks yet</div>
            <div style={{fontSize:13}}>Bookmark problems from the Problems page for quick review</div>
          </div>
        )}
        {bookmarks.map(name=>{
          const prob=ALL_PROBS.find(p=>p.n===name);
          if(!prob)return null;
          return(
            <div key={name} className="bm-chip">
              <div className={`chk ${done[name]?"on":""}`} onClick={()=>toggle(name)}
                role="checkbox" aria-checked={!!done[name]} aria-label={`Mark ${name} complete`} tabIndex={0}
                onKeyDown={e=>e.key===" "&&toggle(name)}>
                {done[name]&&<span style={{fontSize:9.5,color:"#0C0E14",fontWeight:800}}>✓</span>}
              </div>
              <span style={{flex:1,fontSize:12.5,textDecoration:done[name]?"line-through":"none",color:done[name]?"var(--mu)":"var(--tx)"}}>{name}</span>
              <DPill d={prob.d}/>
              <span style={{fontSize:10.5,color:"var(--mu)",background:"var(--card)",padding:"2px 7px",borderRadius:20}}>{prob.cat}</span>
              <button className="bm-remove" onClick={()=>removeBM(name)} aria-label={`Remove ${name} from bookmarks`}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────
function SettingsPage({done,setDone,setBookmarks,setNotes,theme,setTheme}: SettingsPageProps) {
  const [confirming,setConfirming]=useState(false);
  const solved=Object.values(done).filter(Boolean).length;

  const resetAll=()=>{
    LS.set("nc150-progress",{});LS.set("dsa-bookmarks",[]);LS.set("dsa-notes",{});LS.set("dsa-activity",[]);
    setDone({});setBookmarks([]);setNotes({});setConfirming(false);
  };

  return(
    <div className="fadeUp">
      <div className="page-hero"><h1>Settings ⚙️</h1><p>Manage your data, theme, and preferences.</p></div>
      <div className="cx">
        {/* Theme */}
        <div className="sec-title">🎨 Appearance</div>
        <div className="card" style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontSize:13.5,fontWeight:600,marginBottom:3}}>Color Theme</div>
              <div style={{fontSize:12,color:"var(--mu)"}}>Currently: {theme==="dark"?"Dark Mode":"Light Mode"}</div></div>
            <button onClick={()=>{const t=theme==="dark"?"light":"dark";setTheme(t);LS.set("dsa-theme",t);document.documentElement.setAttribute("data-theme",t);}}
              style={{padding:"8px 16px",borderRadius:8,border:"1px solid var(--bdr)",background:"var(--sur)",color:"var(--tx)",fontSize:13,cursor:"pointer"}}>
              {theme==="dark"?"☀️ Light Mode":"🌙 Dark Mode"}
            </button>
          </div>
        </div>

        {/* Data stats */}
        <div className="sec-title">💾 Your Data</div>
        <div className="card" style={{marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            {[["Problems solved",`${solved}/150`],["Data stored","localStorage"],["Sync","Local only"],["Export","Coming soon"]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:11,color:"var(--mu)",marginBottom:2}}>{k}</div><div style={{fontSize:13,fontWeight:600}}>{v}</div></div>
            ))}
          </div>
          <div style={{borderTop:"1px solid var(--bdr)",paddingTop:14}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--r)",marginBottom:6}}>⚠️ Danger Zone</div>
            <div style={{fontSize:12,color:"var(--mu)",marginBottom:10}}>This will permanently delete all your progress, notes, bookmarks, and activity data.</div>
            {!confirming?(
              <button onClick={()=>setConfirming(true)}
                style={{padding:"7px 16px",borderRadius:7,background:"#2a1616",color:"var(--r)",border:"1px solid #3d2222",fontSize:12.5,fontWeight:600,cursor:"pointer"}}>
                Reset All Data
              </button>
            ):(
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:12.5,color:"var(--r)"}}>Are you sure? This cannot be undone.</span>
                <button onClick={resetAll}
                  style={{padding:"6px 14px",borderRadius:7,background:"var(--r)",color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer"}}>Yes, Reset</button>
                <button onClick={()=>setConfirming(false)}
                  style={{padding:"6px 14px",borderRadius:7,background:"var(--sur)",color:"var(--mu)",border:"1px solid var(--bdr)",fontSize:12,cursor:"pointer"}}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* About */}
        <div className="sec-title">ℹ️ About</div>
        <div className="card">
          <div style={{fontSize:13,lineHeight:1.7,color:"var(--mu)"}}>
            <p><strong style={{color:"var(--tx)"}}>AlgoPath DSA Dashboard</strong> — companion to the AlgoPath learning platform.</p>
            <p style={{marginTop:8}}>All data is stored locally in your browser (localStorage). Nothing is sent to any server. Progress is tied to this browser/device.</p>
            <p style={{marginTop:8}}>Built with React · No backend · No tracking · Open for learning</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// NAV CONFIG
// ═══════════════════════════════════════════════════
const PAGES: Array<{id: PageId; label: string; icon: string}> = [
  {id:"dashboard", label:"Dashboard",  icon:"📊"},
  {id:"problems",  label:"Problems",   icon:"📋"},
  {id:"search",    label:"Search",     icon:"🔍"},
  {id:"bookmarks", label:"Bookmarks",  icon:"🔖"},
  {id:"notes",     label:"My Notes",   icon:"📝"},
  {id:"settings",  label:"Settings",   icon:"⚙️"},
];

// ═══════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════
export default function App() {
  // ── State ──────────────────────────────────────
  const [page,setPage] = useState<PageId>("dashboard");
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [theme,setTheme] = useState<Theme>(()=>LS.get<Theme>("dsa-theme","dark"));
  const [done,setDone] = useState<Record<string,boolean>>(()=>LS.get<Record<string,boolean>>("nc150-progress",{}));
  const [bookmarks,setBookmarks] = useState<string[]>(()=>LS.get<string[]>("dsa-bookmarks",[]));
  const [notes,setNotes] = useState<Record<string,string>>(()=>LS.get<Record<string,string>>("dsa-notes",{}));
  const [activityLog,setActivityLog] = useState<string[]>(()=>LS.get<string[]>("dsa-activity",[]));
  const mainRef = useRef(null);

  // Apply theme on mount and change
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme",theme);
  },[theme]);

  // Streak
  const {streak,longest} = useMemo(()=>calcStreak(activityLog),[activityLog]);

  // Log activity (called when solving a problem)
  const logActivity = useCallback(()=>{
    const now = new Date().toISOString();
    setActivityLog(log=>{
      const updated=[...log,now];
      LS.set("dsa-activity",updated);
      return updated;
    });
  },[]);

  // Nav
  const navigate = (pageId: PageId) => {
    setPage(pageId);
    setSidebarOpen(false);
    mainRef.current?.scrollTo(0,0);
  };

  const solved = useMemo(()=>Object.values(done).filter(Boolean).length,[done]);

  return(
    <div className="app">
      {/* Skip to main content (accessibility) */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Mobile topbar */}
      <div className="topbar" role="banner">
        <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:800,color:"var(--g)"}}>⚡ AlgoPath</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button className="theme-btn" onClick={()=>{const t=theme==="dark"?"light":"dark";setTheme(t);LS.set("dsa-theme",t);document.documentElement.setAttribute("data-theme",t);}}
            aria-label="Toggle theme">{theme==="dark"?"☀️":"🌙"}</button>
          <button className="menu-btn" onClick={()=>setSidebarOpen(o=>!o)} aria-label="Open navigation menu" aria-expanded={sidebarOpen}>☰</button>
        </div>
      </div>
      <div className={`overlay ${sidebarOpen?"show":""}`} onClick={()=>setSidebarOpen(false)} aria-hidden="true"/>

      {/* Sidebar */}
      <nav className={`sb ${sidebarOpen?"open":""}`} aria-label="Main navigation">
        <div className="sb-logo">
          <span>⚡ AlgoPath</span>
          <button className="theme-btn" onClick={()=>{const t=theme==="dark"?"light":"dark";setTheme(t);LS.set("dsa-theme",t);document.documentElement.setAttribute("data-theme",t);}}
            aria-label="Toggle color theme">{theme==="dark"?"☀️":"🌙"}</button>
        </div>

        {/* Progress mini */}
        <div style={{margin:"0 10px 12px",padding:"10px 12px",background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:9}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--mu)",marginBottom:5}}>
            <span>Progress</span>
            <span style={{color:"var(--g)",fontWeight:700}}>{solved}/150</span>
          </div>
          <PBar pct={Math.round((solved/TOTAL)*100)}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:"var(--mu)",marginTop:5}}>
            <span>🔥 {streak} day streak</span>
            <span>🏆 Longest: {longest}</span>
          </div>
        </div>

        <div className="sb-sec">Menu</div>
        {PAGES.map(p=>(
          <div key={p.id} className={`ni ${page===p.id?"active":""}`}
            onClick={()=>navigate(p.id)}
            role="button" tabIndex={0}
            aria-label={p.label} aria-current={page===p.id?"page":undefined}
            onKeyDown={e=>e.key==="Enter"&&navigate(p.id)}>
            <span aria-hidden="true">{p.icon}</span>
            <span>{p.label}</span>
            {p.id==="bookmarks"&&bookmarks.length>0&&<span className="ni-badge nb-b" aria-label={`${bookmarks.length} bookmarks`}>{bookmarks.length}</span>}
            {p.id==="notes"&&Object.keys(notes).length>0&&<span className="ni-badge nb-y" aria-label={`${Object.keys(notes).length} notes`}>{Object.keys(notes).length}</span>}
          </div>
        ))}

        <div className="sb-sec" style={{marginTop:8}}>Quick Stats</div>
        {[
          {label:"Easy done",val:`${done&&Object.keys(done).filter(k=>done[k]&&ALL_PROBS.find(p=>p.n===k)?.d==="E").length}/28`,color:"var(--g)"},
          {label:"Medium done",val:`${done&&Object.keys(done).filter(k=>done[k]&&ALL_PROBS.find(p=>p.n===k)?.d==="M").length}/101`,color:"var(--y)"},
          {label:"Hard done",val:`${done&&Object.keys(done).filter(k=>done[k]&&ALL_PROBS.find(p=>p.n===k)?.d==="H").length}/21`,color:"var(--r)"},
        ].map(s=>(
          <div key={s.label} style={{display:"flex",justifyContent:"space-between",padding:"4px 14px",fontSize:11.5}}>
            <span style={{color:"var(--mu)"}}>{s.label}</span>
            <span style={{color:s.color,fontWeight:700,fontFamily:"var(--fc)"}}>{s.val}</span>
          </div>
        ))}
      </nav>

      {/* Main content */}
      <main id="main-content" className="main" ref={mainRef} role="main">
        <ErrorBoundary>
          {page==="dashboard" && <DashboardPage done={done} streak={streak} notes={notes} bookmarks={bookmarks}/>}
          {page==="problems" && <ProblemsPage done={done} setDone={setDone} bookmarks={bookmarks} setBookmarks={setBookmarks} notes={notes} setNotes={setNotes} logActivity={logActivity}/>}
          {page==="search" && <SearchPage done={done} setPage={setPage}/>}
          {page==="bookmarks" && <BookmarksPage bookmarks={bookmarks} setBookmarks={setBookmarks} done={done} setDone={setDone} logActivity={logActivity}/>}
          {page==="notes" && <NotesPage notes={notes} setNotes={setNotes}/>}
          {page==="settings" && <SettingsPage done={done} setDone={setDone} setBookmarks={setBookmarks} setNotes={setNotes} theme={theme} setTheme={setTheme}/>}
        </ErrorBoundary>
      </main>
    </div>
  );
}
