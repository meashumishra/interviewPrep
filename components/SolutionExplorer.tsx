import { useState, useRef, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────
type Difficulty = "E" | "M" | "H";
type Tier = "best" | "ok" | "bad" | "good";

interface CodeMap { python?: string; javascript?: string; }

interface Approach {
  id: string; label: string; tier: Tier; title: string; tagline: string;
  time: string; space: string; timeReason: string; spaceReason: string;
  whyBad?: string; whyGood?: string; whyConsider?: string;
  intuition: string[]; code: CodeMap;
}

interface Solution {
  category: string; difficulty: Difficulty; patterns: string[];
  description: string; example: string; approaches: Approach[];
  patternInsight: string; whenToUse: string[]; whenAvoid: string[];
  relatedProblems: string[];
}

interface StubProblem { name: string; cat: string; diff: Difficulty; patterns: string[]; }
interface AllProblem extends StubProblem { hasFullSolution: boolean; }

interface CodeBlockProps { code: string; lang: string; onCopy?: () => void; }
interface ApproachCardProps { approach: Approach; defaultOpen?: boolean; }
interface FullSolutionPageProps {
  prob: AllProblem; onRelatedClick: (prob: AllProblem) => void;
  provider?: string; model?: string; apiKey?: string;
}
interface StubPageProps { prob: AllProblem; onRelatedClick: (prob: AllProblem) => void; }

// ── CSS ───────────────────────────────────────────────────────
const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0A0C11;--sur:#10131A;--card:#161922;--bdr:#1E2330;--fa:#181C28;
  --g:#4EFFA0;--b:#5B8CFF;--y:#FFCC44;--r:#FF6B6B;--p:#C084FC;--o:#FF9F5B;
  --tx:#E4E8F0;--mu:#556070;
  --fd:'Space Grotesk',sans-serif;--fb:'Inter',sans-serif;--fc:'JetBrains Mono',monospace;
}
body{background:var(--bg);color:var(--tx);font-family:var(--fb);overflow-x:hidden}
button{font-family:var(--fb);cursor:pointer}
input,select,textarea{font-family:var(--fb);outline:none}

/* Layout */
.app{display:flex;height:100vh;overflow:hidden}

/* Sidebar */
.sb{width:260px;min-width:260px;background:var(--sur);border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden}
.sb-top{padding:16px 14px 12px;border-bottom:1px solid var(--bdr);flex-shrink:0}
.sb-logo{font-family:var(--fd);font-size:17px;font-weight:800;color:var(--g);display:flex;align-items:center;gap:8px;margin-bottom:12px}
.sb-search{width:100%;padding:7px 11px;border-radius:8px;background:var(--card);border:1px solid var(--bdr);color:var(--tx);font-size:12.5px;transition:border-color .15s}
.sb-search:focus{border-color:var(--g)}
.sb-list{flex:1;overflow-y:auto;padding:8px 8px}
.sb-cat{font-size:9px;font-weight:700;color:var(--mu);letter-spacing:2px;text-transform:uppercase;padding:10px 8px 4px}
.pb{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:7px;cursor:pointer;transition:all .15s;margin-bottom:1px}
.pb:hover{background:var(--card)}
.pb.active{background:#172a1f}
.pb-name{font-size:12px;color:var(--mu);flex:1;line-height:1.3}
.pb.active .pb-name{color:var(--g);font-weight:500}
.pb:hover .pb-name{color:var(--tx)}
.diff-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.dE{background:#4EFFA0}.dM{background:#FFCC44}.dH{background:#FF6B6B}

/* Main */
.main{flex:1;overflow-y:auto;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}

/* Topbar */
.topbar-m{display:none;padding:11px 16px;background:var(--sur);border-bottom:1px solid var(--bdr);align-items:center;justify-content:space-between;flex-shrink:0}
.menu-btn{background:none;border:1px solid var(--bdr);border-radius:6px;padding:5px 9px;color:var(--tx);font-size:14px}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:98}
.overlay.show{display:block}

/* Empty state */
.empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px;text-align:center}
.empty-icon{font-size:48px;opacity:.4}
.empty h2{font-family:var(--fd);font-size:20px;font-weight:700;color:var(--mu)}
.empty p{font-size:13px;color:var(--mu);max-width:340px;line-height:1.65}

/* Solution Page */
.sol-page{padding:28px 36px;max-width:900px;width:100%}

/* Problem header */
.prob-header{margin-bottom:24px}
.prob-breadcrumb{font-size:11px;color:var(--mu);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.prob-title{font-family:var(--fd);font-size:26px;font-weight:800;letter-spacing:-.6px;margin-bottom:8px}
.prob-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.tag{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px}
.tag-E{background:#172a1f;color:var(--g)}.tag-M{background:#2a2610;color:var(--y)}.tag-H{background:#2a1616;color:var(--r)}
.tag-pat{background:var(--card);color:var(--mu);border:1px solid var(--bdr)}
.prob-desc{background:var(--card);border:1px solid var(--bdr);border-radius:11px;padding:16px 18px;margin-bottom:6px}
.prob-desc p{font-size:13px;color:#b0bcc8;line-height:1.7}
.prob-example{background:var(--fa);border-radius:8px;padding:12px 14px;margin-top:10px;font-family:var(--fc);font-size:12px;color:#8090a8}

/* Approaches */
.approaches{display:grid;gap:14px;margin-bottom:24px}
.approach-card{background:var(--card);border:1px solid var(--bdr);border-radius:13px;overflow:hidden;transition:border-color .2s}
.approach-card.best{border-color:var(--g)}
.approach-card.ok{border-color:var(--y)}
.approach-card.bad{border-color:var(--r)}
.ac-header{padding:14px 18px;display:flex;align-items:flex-start;gap:12px;cursor:pointer}
.ac-badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.5px;white-space:nowrap;flex-shrink:0;margin-top:2px}
.badge-best{background:#172a1f;color:var(--g)}.badge-ok{background:#2a2610;color:var(--y)}.badge-bad{background:#2a1616;color:var(--r)}.badge-good{background:#161e2e;color:var(--b)}
.ac-meta{flex:1;min-width:0}
.ac-title{font-family:var(--fd);font-size:14px;font-weight:700;margin-bottom:4px}
.ac-tagline{font-size:12px;color:var(--mu);line-height:1.5}
.ac-complexities{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap}
.cx-pill{display:flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:600}
.cx-time{background:#172a1f;color:var(--g)}.cx-space{background:#161e2e;color:var(--b)}
.ac-arrow{color:var(--mu);font-size:14px;transition:transform .2s;flex-shrink:0;margin-top:2px}
.ac-body{border-top:1px solid var(--bdr);padding:16px 18px}

/* Why boxes */
.why-box{border-radius:9px;padding:13px 15px;margin-bottom:12px}
.why-good{background:#131e17;border:1px solid #1e3020}
.why-bad{background:#1c1416;border:1px solid #2e1a1a}
.why-neutral{background:#161822;border:1px solid #222a3a}
.why-lbl{font-size:9.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
.why-text{font-size:12.5px;line-height:1.65;color:#b0bcc8}

/* Code block */
.code-wrap{background:#07090E;border:1px solid var(--bdr);border-radius:10px;overflow:hidden;margin-bottom:12px}
.code-header{background:#0D1018;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bdr)}
.code-lang{font-size:10px;font-weight:700;color:var(--mu);letter-spacing:1px}
.copy-btn{font-size:10px;color:var(--mu);background:none;border:1px solid var(--bdr);padding:3px 9px;border-radius:5px;transition:all .15s}
.copy-btn:hover{border-color:var(--g);color:var(--g)}
.code-content{padding:14px 16px;overflow-x:auto}
.code-content pre{font-size:12px;line-height:1.75;margin:0;color:#C8D4E8;font-family:var(--fc)}
.kw{color:#C084FC}.fn{color:#5B8CFF}.cm{color:#3E4F62;font-style:italic}.st{color:#4EFFA0}.nm{color:#FFCC44}.op{color:#FF9F5B}.cls{color:#FF6B6B}

/* Complexity comparison table */
.cx-table{width:100%;border-collapse:collapse;margin-bottom:16px}
.cx-table th{padding:8px 12px;text-align:left;font-size:9.5px;font-weight:700;color:var(--mu);letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid var(--bdr);background:var(--fa)}
.cx-table td{padding:9px 12px;font-size:12px;border-bottom:1px solid var(--bdr)}
.cx-table tr:last-child td{border-bottom:none}
.cx-table tr:hover td{background:var(--fa)}
.best-row td{background:#0e1a12!important}
.og{color:var(--g);font-family:var(--fc);font-weight:700}.oy{color:var(--y);font-family:var(--fc);font-weight:700}.or{color:var(--r);font-family:var(--fc);font-weight:700}.ob{color:var(--b);font-family:var(--fc);font-weight:700}

/* Intuition steps */
.intuition-steps{display:grid;gap:8px;margin-bottom:14px}
.int-step{display:flex;gap:10px;padding:10px 13px;background:var(--fa);border-radius:8px;border-left:3px solid var(--g)}
.int-num{font-family:var(--fd);font-size:11px;font-weight:800;color:var(--g);min-width:20px;margin-top:1px}
.int-text{font-size:12.5px;color:#b0bcc8;line-height:1.55}

/* Pattern insight */
.pattern-insight{background:linear-gradient(135deg,#1c1a0d,#181510);border:1px solid #36300e;border-radius:11px;padding:16px 18px;margin-bottom:16px}
.pi-lbl{font-size:9.5px;font-weight:700;color:var(--y);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:7px}
.pi-text{font-size:13px;color:#d4c48a;line-height:1.7}

/* When to use */
.when-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-bottom:16px}
.when-card{padding:11px 13px;border-radius:9px}
.when-use{background:#131e17;border:1px solid #1e3020}.when-avoid{background:#1c1416;border:1px solid #2e1a1a}
.when-lbl{font-size:9px;font-weight:700;color:var(--mu);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
.when-item{font-size:11.5px;color:#b0bcc8;padding:"3px 0";display:flex;gap:6px;line-height:1.5;margin-bottom:4px}

/* AI section */
.ai-section{background:var(--card);border:1px solid var(--bdr);border-radius:13px;padding:20px;margin-bottom:24px}
.ai-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.ai-icon{width:36px;height:36px;border-radius:8px;background:#172a1f;display:flex;align-items:center;justify-content:center;font-size:16px}
.ai-title{font-family:var(--fd);font-size:14px;font-weight:700}
.ai-sub{font-size:11.5px;color:var(--mu)}
.ai-input{display:flex;gap:8px;margin-bottom:12px}
.ai-textarea{flex:1;padding:10px 13px;border-radius:8px;background:var(--sur);border:1px solid var(--bdr);color:var(--tx);font-size:12.5px;resize:none;min-height:60px;transition:border-color .15s;font-family:var(--fb)}
.ai-textarea:focus{border-color:var(--g)}
.ai-btn{padding:0 18px;border-radius:8px;background:#172a1f;color:var(--g);border:1px solid #253d2a;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;align-self:flex-end;min-height:40px}
.ai-btn:hover{background:#1e3828}.ai-btn:disabled{opacity:.5;cursor:default}
.ai-response{background:var(--sur);border:1px solid var(--bdr);border-radius:9px;padding:14px 16px;font-size:13px;line-height:1.75;color:#b0bcc8;min-height:60px}
.ai-thinking{display:flex;align-items:center;gap:8px;color:var(--mu);font-size:12px}
.thinking-dot{width:6px;height:6px;border-radius:50%;background:var(--g);animation:blink 1.2s ease infinite}
.thinking-dot:nth-child(2){animation-delay:.2s}.thinking-dot:nth-child(3){animation-delay:.4s}

/* Related problems */
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:24px}
.related-card{background:var(--card);border:1px solid var(--bdr);border-radius:9px;padding:11px 13px;cursor:pointer;transition:all .15s}
.related-card:hover{border-color:#2e3650;transform:translateY(-1px)}

/* Section title */
.sec-title{font-family:var(--fd);font-size:14px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.fadeUp{animation:fadeUp .3s ease both}

/* Scrollbar */
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}

/* Responsive */
@media(max-width:768px){
  /* Sidebar slides off-screen */
  .sb{transform:translateX(-100%);position:fixed;top:0;left:0;height:100vh;z-index:99;transition:transform .25s ease;overflow-y:auto;-webkit-overflow-scrolling:touch}
  .sb.open{transform:translateX(0)}
  /* Show mobile topbar */
  .topbar-m{display:flex}
  /* Main: full width, no margin */
  .main{margin-left:0!important;padding-top:50px;height:calc(100vh - 50px);overflow-y:auto}
  /* Sidebar full width on small screens */
  .sb{width:280px;min-width:280px}
  /* Content */
  .sol-page{padding:16px 14px}
  .prob-title{font-size:20px}
  .prob-breadcrumb{font-size:10.5px}
  /* Approach cards */
  .ac-header{flex-wrap:wrap;gap:8px}
  .ac-complexities{flex-wrap:wrap}
  /* Complexity table scroll */
  .cx-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .cx-table{min-width:460px}
  /* When grid */
  .when-grid{grid-template-columns:1fr}
  /* Related grid */
  .related-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
  /* Code blocks */
  .code-content{padding:10px 12px}
  .code-content pre{font-size:11px}
  /* AI section */
  .ai-section{padding:14px}
  /* Why boxes grid */
  .why-two-col{grid-template-columns:1fr!important}
  /* Empty state */
  .empty{padding:24px 16px}
  .empty h2{font-size:18px}
}
@media(max-width:480px){
  .sol-page{padding:12px 10px}
  .prob-title{font-size:18px}
  .prob-tags{gap:5px}
  .tag{font-size:9.5px;padding:2px 7px}
  .ac-badge{font-size:9px;padding:2px 8px}
  .ac-title{font-size:13px}
  .ac-tagline{font-size:11px}
  .cx-pill{font-size:10px;padding:2px 7px}
  .int-text{font-size:11.5px}
  .pi-text{font-size:12px}
  .why-text{font-size:11.5px}
  .ai-btn{padding:0 12px;font-size:11.5px}
  .ai-textarea{font-size:12px;min-height:50px}
  .ai-response{font-size:12px}
  .sec-title{font-size:13px}
}
`;
if (typeof document !== 'undefined') {
  const existing = document.getElementById('algopath-solution-styles');
  if (!existing) {
    const sEl = document.createElement("style");
    sEl.id = 'algopath-solution-styles';
    sEl.textContent = css;
    document.head.appendChild(sEl);
  }
}

// ═══════════════════════════════════════════════════
// SOLUTION DATABASE
// ═══════════════════════════════════════════════════
interface ProviderModel { id: string; label: string; badge: string; }
interface ProviderCfg {
  label: string; icon: string; color: string; endpoint: string;
  keyPlaceholder: string; keyLink: string; keyLinkLabel: string;
  format: string; models: ProviderModel[];
}
interface ProviderPanelProps {
  provider: string; setProvider: (p: string) => void;
  model: string; setModel: (m: string) => void;
  apiKey: string; setApiKey: (k: string) => void;
}
interface AIHelperProps { problem: string; provider: string; model: string; apiKey: string; }
interface StubSolutionPageProps { prob: AllProblem; provider: string; model: string; apiKey: string; }
interface CallAIParams {
  provider: string; model: string; apiKey: string;
  systemPrompt: string; userMessage: string; maxTokens?: number;
}

const SOLUTIONS: Record<string, Solution> = {
  "Contains Duplicate": {
    category: "Arrays & Hashing", difficulty: "E",
    patterns: ["Hashing","Sorting"],
    description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    example: `Input: nums = [1,2,3,1]\nOutput: true\n\nInput: nums = [1,2,3,4]\nOutput: false`,
    approaches: [
      {
        id: "brute",
        label: "Brute Force",
        tier: "bad",
        title: "Nested Loop Comparison",
        tagline: "Compare every pair of elements. Simple but slow.",
        time: "O(n²)", space: "O(1)",
        timeReason: "For each element, scan every other element — n×n comparisons.",
        spaceReason: "No extra memory used — just two loop indices.",
        whyBad: "With n=100,000 elements, this runs 10 billion operations. Will time out on any real input.",
        whyConsider: "Useful to understand the problem before optimizing. Always start here mentally.",
        intuition: [
          "Loop i from 0 to n-1",
          "For each i, loop j from i+1 to n-1",
          "If nums[i] === nums[j], return true",
          "If no pair found after all loops, return false"
        ],
        code: {
          python: `<kw>def</kw> <fn>containsDuplicate</fn>(nums):
    <cm># Compare every pair — O(n²)</cm>
    <kw>for</kw> i <kw>in</kw> <fn>range</fn>(<fn>len</fn>(nums)):
        <kw>for</kw> j <kw>in</kw> <fn>range</fn>(i + <nm>1</nm>, <fn>len</fn>(nums)):
            <kw>if</kw> nums[i] == nums[j]:
                <kw>return</kw> <kw>True</kw>
    <kw>return</kw> <kw>False</kw>`,
          javascript: `<kw>function</kw> <fn>containsDuplicate</fn>(nums) {
    <cm>// Compare every pair — O(n²)</cm>
    <kw>for</kw> (<kw>let</kw> i = <nm>0</nm>; i < nums.length; i++) {
        <kw>for</kw> (<kw>let</kw> j = i + <nm>1</nm>; j < nums.length; j++) {
            <kw>if</kw> (nums[i] === nums[j]) <kw>return</kw> <kw>true</kw>;
        }
    }
    <kw>return</kw> <kw>false</kw>;
}`
        }
      },
      {
        id: "sort",
        label: "Better",
        tier: "ok",
        title: "Sort Then Compare Adjacent",
        tagline: "Sort array so duplicates become neighbors. Check adjacent pairs.",
        time: "O(n log n)", space: "O(1)",
        timeReason: "Sorting takes O(n log n). Single scan afterward is O(n). Total = O(n log n).",
        spaceReason: "Sorting in-place uses O(1) extra space (or O(log n) for recursion stack).",
        whyBad: "Modifies the input array (destructive). Still slower than the optimal O(n) solution.",
        whyConsider: "If you can't use extra memory (e.g. embedded systems), this is a good trade-off.",
        intuition: [
          "Sort the array — duplicates will be adjacent",
          "Walk through once, compare nums[i] with nums[i+1]",
          "If any adjacent pair is equal, return true",
          "Return false if no adjacent duplicates found"
        ],
        code: {
          python: `<kw>def</kw> <fn>containsDuplicate</fn>(nums):
    nums.<fn>sort</fn>()  <cm># O(n log n)</cm>
    <kw>for</kw> i <kw>in</kw> <fn>range</fn>(<nm>1</nm>, <fn>len</fn>(nums)):
        <kw>if</kw> nums[i] == nums[i - <nm>1</nm>]:  <cm># Adjacent duplicate</cm>
            <kw>return</kw> <kw>True</kw>
    <kw>return</kw> <kw>False</kw>`,
          javascript: `<kw>function</kw> <fn>containsDuplicate</fn>(nums) {
    nums.<fn>sort</fn>((a, b) => a - b);  <cm>// O(n log n)</cm>
    <kw>for</kw> (<kw>let</kw> i = <nm>1</nm>; i < nums.length; i++) {
        <kw>if</kw> (nums[i] === nums[i - <nm>1</nm>]) <kw>return</kw> <kw>true</kw>;
    }
    <kw>return</kw> <kw>false</kw>;
}`
        }
      },
      {
        id: "hash",
        label: "Optimal",
        tier: "best",
        title: "Hash Set — Single Pass",
        tagline: "Trade O(n) memory for O(n) speed. Best possible time complexity.",
        time: "O(n)", space: "O(n)",
        timeReason: "One pass through array. HashSet lookup and insert are O(1) average. Total = O(n).",
        spaceReason: "In the worst case (no duplicates), we store every element in the set — O(n).",
        whyGood: "Optimal time complexity. Simple to understand. This is the expected interview answer.",
        whyConsider: "The classic memory-for-speed trade-off. Every duplicate problem uses this pattern.",
        intuition: [
          "Create an empty HashSet",
          "For each number in the array:",
          "→ If it's already in the set, return true (duplicate found!)",
          "→ Otherwise, add it to the set",
          "If we finish the loop without finding a duplicate, return false"
        ],
        code: {
          python: `<kw>def</kw> <fn>containsDuplicate</fn>(nums):
    seen = <fn>set</fn>()  <cm># HashSet for O(1) lookup</cm>
    <kw>for</kw> num <kw>in</kw> nums:
        <kw>if</kw> num <kw>in</kw> seen:
            <kw>return</kw> <kw>True</kw>  <cm># Found duplicate!</cm>
        seen.<fn>add</fn>(num)
    <kw>return</kw> <kw>False</kw>

<cm># One-liner (Pythonic):</cm>
<kw>def</kw> <fn>containsDuplicate</fn>(nums):
    <kw>return</kw> <fn>len</fn>(nums) != <fn>len</fn>(<fn>set</fn>(nums))`,
          javascript: `<kw>function</kw> <fn>containsDuplicate</fn>(nums) {
    <kw>const</kw> seen = <kw>new</kw> <cls>Set</cls>();  <cm>// HashSet</cm>
    <kw>for</kw> (<kw>const</kw> num <kw>of</kw> nums) {
        <kw>if</kw> (seen.<fn>has</fn>(num)) <kw>return</kw> <kw>true</kw>;
        seen.<fn>add</fn>(num);
    }
    <kw>return</kw> <kw>false</kw>;
}`
        }
      }
    ],
    patternInsight: "This is the foundational 'frequency tracking' pattern. Any problem asking about duplicates, anagrams, or element counts uses the same idea: HashMap/Set for O(1) lookup. Once you see this pattern, problems like Valid Anagram, Two Sum, and Group Anagrams all feel the same.",
    whenToUse: ["You need to track if something has been seen before","Counting element frequencies","Finding duplicates or unique elements"],
    whenAvoid: ["Memory is extremely limited (use sorting instead)","Input is already sorted (just check adjacent elements)"],
    relatedProblems: ["Valid Anagram","Two Sum","Group Anagrams","Longest Consecutive Sequence"]
  },

  "Two Sum": {
    category: "Arrays & Hashing", difficulty: "E",
    patterns: ["Hashing","Two Pointers"],
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.",
    example: `Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] = 2 + 7 = 9`,
    approaches: [
      {
        id: "brute",
        label: "Brute Force",
        tier: "bad",
        title: "Nested Loop — Try Every Pair",
        tagline: "Check every possible pair of indices. Always finds the answer, never efficiently.",
        time: "O(n²)", space: "O(1)",
        timeReason: "For each element, check all elements after it: n + (n-1) + ... + 1 = n(n-1)/2 = O(n²).",
        spaceReason: "Only two index variables used. No extra data structures.",
        whyBad: "n=10,000 → 50 million operations. n=100,000 → 5 billion. Will TLE.",
        whyConsider: "Absolute baseline. Mentally always verify your brute force before optimizing.",
        intuition: ["For each i from 0 to n-1","  For each j from i+1 to n-1","    If nums[i] + nums[j] == target: return [i, j]"],
        code: {
          python: `<kw>def</kw> <fn>twoSum</fn>(nums, target):
    <kw>for</kw> i <kw>in</kw> <fn>range</fn>(<fn>len</fn>(nums)):
        <kw>for</kw> j <kw>in</kw> <fn>range</fn>(i + <nm>1</nm>, <fn>len</fn>(nums)):
            <kw>if</kw> nums[i] + nums[j] == target:
                <kw>return</kw> [i, j]`,
          javascript: `<kw>function</kw> <fn>twoSum</fn>(nums, target) {
    <kw>for</kw> (<kw>let</kw> i = <nm>0</nm>; i < nums.length; i++)
        <kw>for</kw> (<kw>let</kw> j = i+<nm>1</nm>; j < nums.length; j++)
            <kw>if</kw> (nums[i] + nums[j] === target)
                <kw>return</kw> [i, j];
}`
        }
      },
      {
        id: "sort-two-ptr",
        label: "Good (if indices not needed)",
        tier: "ok",
        title: "Sort + Two Pointers",
        tagline: "Sort and use opposite-direction pointers. Loses original indices.",
        time: "O(n log n)", space: "O(n)",
        timeReason: "Sort is O(n log n). Two pointer scan is O(n). Total O(n log n).",
        spaceReason: "Need to store (value, original_index) pairs to recover indices after sorting.",
        whyBad: "More complex than HashMap solution. Sorting loses original indices requiring extra bookkeeping.",
        whyConsider: "When asked for values (not indices), or when the array is already sorted (Two Sum II).",
        intuition: [
          "Store (value, original_index) pairs and sort by value",
          "Use L=0, R=n-1 pointers",
          "sum = arr[L].val + arr[R].val",
          "If sum==target: return [arr[L].idx, arr[R].idx]",
          "If sum<target: L++  |  If sum>target: R--"
        ],
        code: {
          python: `<kw>def</kw> <fn>twoSum</fn>(nums, target):
    <cm># Store (value, original_index) to recover indices</cm>
    indexed = <fn>sorted</fn>(<fn>enumerate</fn>(nums), <fn>key</fn>=<kw>lambda</kw> x: x[<nm>1</nm>])
    L, R = <nm>0</nm>, <fn>len</fn>(nums) - <nm>1</nm>
    <kw>while</kw> L < R:
        s = indexed[L][<nm>1</nm>] + indexed[R][<nm>1</nm>]
        <kw>if</kw> s == target:
            <kw>return</kw> [indexed[L][<nm>0</nm>], indexed[R][<nm>0</nm>]]
        <kw>elif</kw> s < target: L += <nm>1</nm>
        <kw>else</kw>: R -= <nm>1</nm>`,
          javascript: `<kw>function</kw> <fn>twoSum</fn>(nums, target) {
    <kw>const</kw> indexed = nums.<fn>map</fn>((v,i) => [v,i]).<fn>sort</fn>((a,b) => a[<nm>0</nm>]-b[<nm>0</nm>]);
    <kw>let</kw> L = <nm>0</nm>, R = nums.length - <nm>1</nm>;
    <kw>while</kw> (L < R) {
        <kw>const</kw> s = indexed[L][<nm>0</nm>] + indexed[R][<nm>0</nm>];
        <kw>if</kw> (s === target) <kw>return</kw> [indexed[L][<nm>1</nm>], indexed[R][<nm>1</nm>]];
        s < target ? L++ : R--;
    }
}`
        }
      },
      {
        id: "hashmap",
        label: "Optimal",
        tier: "best",
        title: "HashMap — One Pass",
        tagline: "For each element, check if its complement (target - num) was already seen.",
        time: "O(n)", space: "O(n)",
        timeReason: "Single pass through array. HashMap lookup/insert = O(1) average. Total = O(n).",
        spaceReason: "HashMap stores at most n entries (one per element). O(n) space.",
        whyGood: "Optimal time and the cleanest solution. This is the textbook answer and the expected response in any interview.",
        intuition: [
          "Key insight: if a + b = target, then b = target - a (the 'complement')",
          "As we scan each element a, check if its complement already exists in our map",
          "If yes → we found our pair! Return both indices",
          "If no → store a's index in the map for future lookups"
        ],
        code: {
          python: `<kw>def</kw> <fn>twoSum</fn>(nums, target):
    seen = {}  <cm># value → index</cm>
    <kw>for</kw> i, num <kw>in</kw> <fn>enumerate</fn>(nums):
        complement = target - num
        <kw>if</kw> complement <kw>in</kw> seen:
            <kw>return</kw> [seen[complement], i]
        seen[num] = i  <cm># Store for future lookups</cm>`,
          javascript: `<kw>function</kw> <fn>twoSum</fn>(nums, target) {
    <kw>const</kw> seen = <kw>new</kw> <cls>Map</cls>();  <cm>// value → index</cm>
    <kw>for</kw> (<kw>let</kw> i = <nm>0</nm>; i < nums.length; i++) {
        <kw>const</kw> complement = target - nums[i];
        <kw>if</kw> (seen.<fn>has</fn>(complement))
            <kw>return</kw> [seen.<fn>get</fn>(complement), i];
        seen.<fn>set</fn>(nums[i], i);
    }
}`
        }
      }
    ],
    patternInsight: "The complement trick (target - current = what_we_need) is used in hundreds of problems. Any time you're 'looking for something based on what you've already seen', think HashMap. This exact pattern appears in 3Sum, 4Sum, Two Sum II, and countless variations.",
    whenToUse: ["Find pair summing to target","Check if complement exists","Track what you've seen"],
    whenAvoid: ["Array is sorted — use Two Pointers instead (Two Sum II)","Need all pairs — nested loop unavoidable"],
    relatedProblems: ["Two Sum II","3Sum","4Sum","Subarray Sum Equals K"]
  },

  "Valid Palindrome": {
    category: "Two Pointers", difficulty: "E",
    patterns: ["Two Pointers"],
    description: "A phrase is a palindrome if it reads the same forward and backward, ignoring cases and non-alphanumeric characters. Given a string s, return true if it is a palindrome, false otherwise.",
    example: `Input: s = "A man, a plan, a canal: Panama"\nOutput: true\nExplanation: "amanaplanacanalpanama" is a palindrome`,
    approaches: [
      {
        id: "reverse",
        label: "Simple",
        tier: "ok",
        title: "Clean + Reverse String",
        tagline: "Remove non-alphanumeric, lowercase, then compare with its reverse.",
        time: "O(n)", space: "O(n)",
        timeReason: "One pass to clean O(n), reverse is O(n). Total O(n).",
        spaceReason: "New string stores cleaned version — O(n) extra space.",
        whyBad: "Allocates extra string. Works fine for interviews but not space-optimal.",
        whyConsider: "Most readable solution. Good first answer before optimizing.",
        intuition: ["Filter: keep only letters and digits, lowercase everything","Compare cleaned string with its reverse"],
        code: {
          python: `<kw>def</kw> <fn>isPalindrome</fn>(s):
    cleaned = [c.<fn>lower</fn>() <kw>for</kw> c <kw>in</kw> s <kw>if</kw> c.<fn>isalnum</fn>()]
    <kw>return</kw> cleaned == cleaned[::<nm>-1</nm>]`,
          javascript: `<kw>function</kw> <fn>isPalindrome</fn>(s) {
    <kw>const</kw> clean = s.<fn>toLowerCase</fn>().<fn>replace</fn>(<st>/[^a-z0-9]/g</st>, <st>''</st>);
    <kw>return</kw> clean === clean.<fn>split</fn>(<st>''</st>).<fn>reverse</fn>().<fn>join</fn>(<st>''</st>);
}`
        }
      },
      {
        id: "twoptr",
        label: "Optimal",
        tier: "best",
        title: "Two Pointers — In-Place",
        tagline: "L and R converge from both ends, skipping non-alphanumeric characters.",
        time: "O(n)", space: "O(1)",
        timeReason: "Each character visited at most once — L and R together traverse the string once.",
        spaceReason: "No new string created. Only two integer pointers. O(1) space.",
        whyGood: "Optimal on both dimensions. O(n) time, O(1) space. No string allocation.",
        intuition: [
          "L=0 (left end), R=len-1 (right end)",
          "Skip non-alphanumeric from left: while L<R and s[L] not alnum → L++",
          "Skip non-alphanumeric from right: while L<R and s[R] not alnum → R--",
          "Compare s[L].lower() with s[R].lower() — if different → not palindrome",
          "Both valid and matching: L++, R--. Repeat until L≥R"
        ],
        code: {
          python: `<kw>def</kw> <fn>isPalindrome</fn>(s):
    L, R = <nm>0</nm>, <fn>len</fn>(s) - <nm>1</nm>
    <kw>while</kw> L < R:
        <cm># Skip non-alphanumeric from both ends</cm>
        <kw>while</kw> L < R <kw>and not</kw> s[L].<fn>isalnum</fn>(): L += <nm>1</nm>
        <kw>while</kw> L < R <kw>and not</kw> s[R].<fn>isalnum</fn>(): R -= <nm>1</nm>
        <kw>if</kw> s[L].<fn>lower</fn>() != s[R].<fn>lower</fn>():
            <kw>return</kw> <kw>False</kw>  <cm># Mismatch!</cm>
        L += <nm>1</nm>; R -= <nm>1</nm>
    <kw>return</kw> <kw>True</kw>`,
          javascript: `<kw>function</kw> <fn>isPalindrome</fn>(s) {
    <kw>const</kw> alnum = c => /[a-zA-Z0-9]/.test(c);
    <kw>let</kw> L = <nm>0</nm>, R = s.length - <nm>1</nm>;
    <kw>while</kw> (L < R) {
        <kw>while</kw> (L < R && !<fn>alnum</fn>(s[L])) L++;
        <kw>while</kw> (L < R && !<fn>alnum</fn>(s[R])) R--;
        <kw>if</kw> (s[L].<fn>toLowerCase</fn>() !== s[R].<fn>toLowerCase</fn>())
            <kw>return</kw> <kw>false</kw>;
        L++; R--;
    }
    <kw>return</kw> <kw>true</kw>;
}`
        }
      }
    ],
    patternInsight: "This is the canonical 'opposite-direction two pointer' problem. L and R converge; if they ever mismatch the answer is false. The same pattern (skip invalid chars, compare from both ends) applies to Valid Palindrome II and Longest Palindromic Substring.",
    whenToUse: ["Checking string symmetry","Comparing elements from both ends","Any 'is it the same forwards and backwards' question"],
    whenAvoid: ["You need all palindromic substrings — use expand-from-center or DP"],
    relatedProblems: ["Valid Palindrome II","Longest Palindromic Substring","Palindromic Substrings"]
  },

  "Best Time to Buy/Sell Stock": {
    category: "Sliding Window", difficulty: "E",
    patterns: ["Sliding Window","Dynamic Programming","Greedy"],
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve from this transaction. You may only buy on one day and sell on a later day.",
    example: `Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price=1), sell on day 5 (price=6). Profit = 6-1 = 5`,
    approaches: [
      {
        id: "brute",
        label: "Brute Force",
        tier: "bad",
        title: "Try Every Buy-Sell Pair",
        tagline: "For every possible buy day, try every possible sell day after it.",
        time: "O(n²)", space: "O(1)",
        timeReason: "Nested loops: for each buy day (n options), try all sell days after it (n options).",
        spaceReason: "Only tracking max profit — constant space.",
        whyBad: "n=100,000 days → 5 billion operations. Always TLEs.",
        whyConsider: "Brute force clarifies: profit = sell_price - buy_price, buy must come before sell.",
        intuition: ["For each day i as potential buy day","  For each day j > i as potential sell day","    profit = prices[j] - prices[i]","    Update maxProfit if profit is larger"],
        code: {
          python: `<kw>def</kw> <fn>maxProfit</fn>(prices):
    maxP = <nm>0</nm>
    <kw>for</kw> i <kw>in</kw> <fn>range</fn>(<fn>len</fn>(prices)):
        <kw>for</kw> j <kw>in</kw> <fn>range</fn>(i + <nm>1</nm>, <fn>len</fn>(prices)):
            maxP = <fn>max</fn>(maxP, prices[j] - prices[i])
    <kw>return</kw> maxP`,
          javascript: `<kw>function</kw> <fn>maxProfit</fn>(prices) {
    <kw>let</kw> maxP = <nm>0</nm>;
    <kw>for</kw> (<kw>let</kw> i = <nm>0</nm>; i < prices.length; i++)
        <kw>for</kw> (<kw>let</kw> j = i+<nm>1</nm>; j < prices.length; j++)
            maxP = <cls>Math</cls>.<fn>max</fn>(maxP, prices[j] - prices[i]);
    <kw>return</kw> maxP;
}`
        }
      },
      {
        id: "onepass",
        label: "Optimal",
        tier: "best",
        title: "Track Min Price — Single Pass",
        tagline: "Keep a running minimum buy price. At each day, check if selling gives max profit.",
        time: "O(n)", space: "O(1)",
        timeReason: "One pass through the array. Two variable updates per element. O(n).",
        spaceReason: "Only two variables: minPrice and maxProfit. O(1).",
        whyGood: "Can't do better than O(n) — must read all prices. O(1) space. Clean and intuitive.",
        intuition: [
          "Track minPrice = minimum price seen so far (best buy day)",
          "For each price: update minPrice if current is lower",
          "Check profit = current_price - minPrice",
          "Update maxProfit if this profit is better",
          "Key: minPrice always represents the best buy day for any future sell day"
        ],
        code: {
          python: `<kw>def</kw> <fn>maxProfit</fn>(prices):
    minPrice = <fn>float</fn>(<st>'inf'</st>)
    maxProfit = <nm>0</nm>
    <kw>for</kw> price <kw>in</kw> prices:
        minPrice = <fn>min</fn>(minPrice, price)   <cm># Best buy day so far</cm>
        profit = price - minPrice            <cm># Profit if sell today</cm>
        maxProfit = <fn>max</fn>(maxProfit, profit)  <cm># Best profit so far</cm>
    <kw>return</kw> maxProfit`,
          javascript: `<kw>function</kw> <fn>maxProfit</fn>(prices) {
    <kw>let</kw> minPrice = <cls>Infinity</cls>, maxProfit = <nm>0</nm>;
    <kw>for</kw> (<kw>const</kw> price <kw>of</kw> prices) {
        minPrice = <cls>Math</cls>.<fn>min</fn>(minPrice, price);
        maxProfit = <cls>Math</cls>.<fn>max</fn>(maxProfit, price - minPrice);
    }
    <kw>return</kw> maxProfit;
}`
        }
      }
    ],
    patternInsight: "This is the simplest sliding window problem. The 'window' here is from minPriceDay to currentDay. Expanding right (checking new sell days) while keeping the left pointer at the best buy day. This greedy minimum-tracking pattern also appears in Maximum Subarray (Kadane's algorithm).",
    whenToUse: ["Maximize profit between two points in time","Find max difference where smaller comes first"],
    whenAvoid: ["Multiple transactions allowed → use DP (Stock II, III, IV)"],
    relatedProblems: ["Best Time to Buy/Sell Stock II","Kadane's Algorithm","Maximum Subarray"]
  },

  "Binary Search": {
    category: "Binary Search", difficulty: "E",
    patterns: ["Binary Search"],
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.",
    example: `Input: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1`,
    approaches: [
      {
        id: "linear",
        label: "Brute Force",
        tier: "bad",
        title: "Linear Scan",
        tagline: "Check every element. Doesn't use the sorted property at all.",
        time: "O(n)", space: "O(1)",
        timeReason: "In the worst case (target not found), we scan all n elements.",
        spaceReason: "Single loop variable — O(1).",
        whyBad: "Ignores the fact that the array is sorted. That information is worth O(log n).",
        whyConsider: "Works on any array (sorted or not). Always correct.",
        intuition: ["Check every element until found or exhausted"],
        code: {
          python: `<kw>def</kw> <fn>search</fn>(nums, target):
    <kw>for</kw> i, n <kw>in</kw> <fn>enumerate</fn>(nums):
        <kw>if</kw> n == target: <kw>return</kw> i
    <kw>return</kw> -<nm>1</nm>`,
          javascript: `<kw>function</kw> <fn>search</fn>(nums, target) {
    <kw>for</kw> (<kw>let</kw> i = <nm>0</nm>; i < nums.length; i++)
        <kw>if</kw> (nums[i] === target) <kw>return</kw> i;
    <kw>return</kw> -<nm>1</nm>;
}`
        }
      },
      {
        id: "binary",
        label: "Optimal",
        tier: "best",
        title: "Binary Search — Eliminate Half Each Step",
        tagline: "Use the sorted property: mid too small → left half impossible; mid too big → right half impossible.",
        time: "O(log n)", space: "O(1)",
        timeReason: "Each step eliminates half the search space. After k steps, n/2^k elements remain. Stops when n/2^k = 1 → k = log₂(n) steps.",
        spaceReason: "Only lo, hi, mid variables. O(1) space. (Recursive version uses O(log n) call stack.)",
        whyGood: "Optimal for sorted arrays. 30 steps covers 1 billion elements. Foundation for 50+ harder problems.",
        intuition: [
          "Set lo=0, hi=n-1 (the entire array is our search space)",
          "Compute mid = (lo+hi)//2 (middle of current space)",
          "If nums[mid]==target → found! Return mid",
          "If nums[mid] < target → target must be in RIGHT half → lo = mid+1",
          "If nums[mid] > target → target must be in LEFT half → hi = mid-1",
          "If lo > hi: target doesn't exist → return -1"
        ],
        code: {
          python: `<kw>def</kw> <fn>search</fn>(nums, target):
    lo, hi = <nm>0</nm>, <fn>len</fn>(nums) - <nm>1</nm>
    <kw>while</kw> lo <= hi:
        mid = (lo + hi) // <nm>2</nm>  <cm># Avoids overflow</cm>
        <kw>if</kw> nums[mid] == target:
            <kw>return</kw> mid
        <kw>elif</kw> nums[mid] < target:
            lo = mid + <nm>1</nm>  <cm># Search right half</cm>
        <kw>else</kw>:
            hi = mid - <nm>1</nm>  <cm># Search left half</cm>
    <kw>return</kw> -<nm>1</nm>  <cm># Not found</cm>`,
          javascript: `<kw>function</kw> <fn>search</fn>(nums, target) {
    <kw>let</kw> lo = <nm>0</nm>, hi = nums.length - <nm>1</nm>;
    <kw>while</kw> (lo <= hi) {
        <kw>const</kw> mid = (lo + hi) >> <nm>1</nm>;  <cm>// Bit shift = floor divide</cm>
        <kw>if</kw> (nums[mid] === target) <kw>return</kw> mid;
        nums[mid] < target ? lo = mid+<nm>1</nm> : hi = mid-<nm>1</nm>;
    }
    <kw>return</kw> -<nm>1</nm>;
}`
        }
      }
    ],
    patternInsight: "Binary search is one of the most powerful ideas in CS. The template lo<=hi, mid=(lo+hi)//2, lo=mid+1 / hi=mid-1 applies to 50+ problems. Once you internalize it, problems like Koko Eating Bananas, Search in Rotated Sorted Array, and Find Minimum are just 'binary search with a different condition'.",
    whenToUse: ["Array is sorted","Find minimum value satisfying a condition","Search in log n time"],
    whenAvoid: ["Array is unsorted and can't be sorted","Need all occurrences (use linear scan)"],
    relatedProblems: ["Search a 2D Matrix","Koko Eating Bananas","Find Min in Rotated Array","Search in Rotated Array"]
  },

  "Climbing Stairs": {
    category: "1-D Dynamic Programming", difficulty: "E",
    patterns: ["Dynamic Programming","Recursion","Math"],
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    example: `Input: n = 3\nOutput: 3\nExplanation: 1+1+1, 1+2, 2+1 — three distinct ways`,
    approaches: [
      {
        id: "recur",
        label: "Brute Force",
        tier: "bad",
        title: "Naive Recursion",
        tagline: "Recurse from the top. Each call branches into two. Exponential.",
        time: "O(2ⁿ)", space: "O(n)",
        timeReason: "Each step branches into two sub-calls. Binary tree with n levels = 2ⁿ nodes.",
        spaceReason: "Recursion stack depth = n.",
        whyBad: "n=50 → 2^50 ≈ 1 quadrillion operations. Completely impractical.",
        whyConsider: "The recursion directly encodes the recurrence: f(n) = f(n-1) + f(n-2). Excellent starting point.",
        intuition: ["f(n) = ways to reach step n","f(n) = f(n-1) [came from 1 step below] + f(n-2) [came from 2 steps below]","Base: f(1)=1, f(2)=2"],
        code: {
          python: `<kw>def</kw> <fn>climbStairs</fn>(n):
    <kw>if</kw> n <= <nm>2</nm>: <kw>return</kw> n  <cm># Base cases</cm>
    <kw>return</kw> <fn>climbStairs</fn>(n-<nm>1</nm>) + <fn>climbStairs</fn>(n-<nm>2</nm>)  <cm># O(2ⁿ)!</cm>`,
          javascript: `<kw>function</kw> <fn>climbStairs</fn>(n) {
    <kw>if</kw> (n <= <nm>2</nm>) <kw>return</kw> n;
    <kw>return</kw> <fn>climbStairs</fn>(n-<nm>1</nm>) + <fn>climbStairs</fn>(n-<nm>2</nm>);
}`
        }
      },
      {
        id: "memo",
        label: "Better",
        tier: "ok",
        title: "Memoization (Top-Down DP)",
        tagline: "Cache recursion results. Each subproblem computed once.",
        time: "O(n)", space: "O(n)",
        timeReason: "Each unique n is computed once and cached. n unique values → O(n) total work.",
        spaceReason: "Cache stores n values + recursion stack depth n → O(n).",
        whyBad: "Recursion stack overhead. Space is same as tabulation but with function call cost.",
        whyConsider: "Natural step from brute force recursion. Easier to derive than tabulation.",
        intuition: ["Same recursion as brute force","Add: memo = {} to cache results","Before computing: check if n already in memo","After computing: store result in memo"],
        code: {
          python: `<kw>def</kw> <fn>climbStairs</fn>(n, memo={}):
    <kw>if</kw> n <= <nm>2</nm>: <kw>return</kw> n
    <kw>if</kw> n <kw>not in</kw> memo:
        memo[n] = <fn>climbStairs</fn>(n-<nm>1</nm>) + <fn>climbStairs</fn>(n-<nm>2</nm>)
    <kw>return</kw> memo[n]`,
          javascript: `<kw>function</kw> <fn>climbStairs</fn>(n, memo = {}) {
    <kw>if</kw> (n <= <nm>2</nm>) <kw>return</kw> n;
    <kw>if</kw> (memo[n]) <kw>return</kw> memo[n];
    memo[n] = <fn>climbStairs</fn>(n-<nm>1</nm>, memo) + <fn>climbStairs</fn>(n-<nm>2</nm>, memo);
    <kw>return</kw> memo[n];
}`
        }
      },
      {
        id: "dp",
        label: "Optimal",
        tier: "best",
        title: "Tabulation (Bottom-Up DP)",
        tagline: "Fill dp table from small to large. Each cell uses two previously computed cells.",
        time: "O(n)", space: "O(n) → O(1) with optimization",
        timeReason: "Single loop from 2 to n. Each cell takes O(1) to compute. Total O(n).",
        spaceReason: "dp array stores n values. Can optimize to O(1) by keeping only last two values.",
        whyGood: "No recursion overhead. Iterative. And notice: this is just Fibonacci! dp[i] = dp[i-1] + dp[i-2].",
        intuition: [
          "dp[i] = number of ways to reach step i",
          "dp[1] = 1 (only 1 way), dp[2] = 2 (two ways)",
          "dp[i] = dp[i-1] + dp[i-2] for i ≥ 3",
          "Space optimization: only need dp[i-1] and dp[i-2] → use two variables"
        ],
        code: {
          python: `<kw>def</kw> <fn>climbStairs</fn>(n):
    <kw>if</kw> n <= <nm>2</nm>: <kw>return</kw> n

    <cm># O(n) space version</cm>
    dp = [<nm>0</nm>] * (n + <nm>1</nm>)
    dp[<nm>1</nm>], dp[<nm>2</nm>] = <nm>1</nm>, <nm>2</nm>
    <kw>for</kw> i <kw>in</kw> <fn>range</fn>(<nm>3</nm>, n + <nm>1</nm>):
        dp[i] = dp[i-<nm>1</nm>] + dp[i-<nm>2</nm>]
    <kw>return</kw> dp[n]

<kw>def</kw> <fn>climbStairsOptimal</fn>(n):
    <cm># O(1) space — only need last two values</cm>
    a, b = <nm>1</nm>, <nm>2</nm>
    <kw>for</kw> _ <kw>in</kw> <fn>range</fn>(<nm>3</nm>, n + <nm>1</nm>):
        a, b = b, a + b
    <kw>return</kw> b <kw>if</kw> n >= <nm>2</nm> <kw>else</kw> n`,
          javascript: `<kw>function</kw> <fn>climbStairs</fn>(n) {
    <kw>if</kw> (n <= <nm>2</nm>) <kw>return</kw> n;
    <cm>// O(1) space optimization</cm>
    <kw>let</kw> a = <nm>1</nm>, b = <nm>2</nm>;
    <kw>for</kw> (<kw>let</kw> i = <nm>3</nm>; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    <kw>return</kw> b;
}`
        }
      }
    ],
    patternInsight: "Climbing Stairs is Fibonacci in disguise. It demonstrates the DP recipe perfectly: (1) identify the recurrence, (2) add memoization, (3) convert to tabulation, (4) optimize space. This exact progression applies to House Robber, Coin Change, and Longest Increasing Subsequence.",
    whenToUse: ["Count ways to reach a goal","Problem has overlapping subproblems","Current state depends only on previous few states"],
    whenAvoid: ["No overlapping subproblems — greedy or direct math is simpler"],
    relatedProblems: ["House Robber","Min Cost Climbing Stairs","Fibonacci Number","Coin Change"]
  },

  "Number of Islands": {
    category: "Graphs", difficulty: "M",
    patterns: ["BFS","DFS","Union Find"],
    description: "Given an m×n 2D binary grid where '1' is land and '0' is water, return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    example: `Input:\n11110\n11010\n11000\n00000\nOutput: 1 island`,
    approaches: [
      {
        id: "dfs",
        label: "Classic",
        tier: "best",
        title: "DFS — Flood Fill",
        tagline: "For each unvisited '1', start a DFS to mark the entire island as visited.",
        time: "O(m×n)", space: "O(m×n)",
        timeReason: "Every cell is visited at most once across all DFS calls. Total work = m×n.",
        spaceReason: "Recursion stack in worst case (all land, snake shape) = m×n depth.",
        whyGood: "Clean, intuitive, and optimal. This is the expected interview answer.",
        intuition: [
          "Scan every cell in the grid",
          "When you find a '1' (land not yet visited):",
          "  → Increment island count",
          "  → DFS from this cell, marking all connected '1's as visited ('0' or '#')",
          "DFS explores 4 directions: up, down, left, right",
          "After DFS, the entire island is marked. Continue scanning."
        ],
        code: {
          python: `<kw>def</kw> <fn>numIslands</fn>(grid):
    <kw>if not</kw> grid: <kw>return</kw> <nm>0</nm>
    rows, cols = <fn>len</fn>(grid), <fn>len</fn>(grid[<nm>0</nm>])
    count = <nm>0</nm>

    <kw>def</kw> <fn>dfs</fn>(r, c):
        <kw>if</kw> r < <nm>0</nm> <kw>or</kw> r >= rows <kw>or</kw> c < <nm>0</nm> <kw>or</kw> c >= cols:
            <kw>return</kw>  <cm># Out of bounds</cm>
        <kw>if</kw> grid[r][c] != <st>'1'</st>: <kw>return</kw>  <cm># Water or visited</cm>
        grid[r][c] = <st>'#'</st>  <cm># Mark visited</cm>
        <fn>dfs</fn>(r+<nm>1</nm>, c); <fn>dfs</fn>(r-<nm>1</nm>, c)
        <fn>dfs</fn>(r, c+<nm>1</nm>); <fn>dfs</fn>(r, c-<nm>1</nm>)

    <kw>for</kw> r <kw>in</kw> <fn>range</fn>(rows):
        <kw>for</kw> c <kw>in</kw> <fn>range</fn>(cols):
            <kw>if</kw> grid[r][c] == <st>'1'</st>:
                count += <nm>1</nm>
                <fn>dfs</fn>(r, c)  <cm># Flood fill island</cm>
    <kw>return</kw> count`,
          javascript: `<kw>function</kw> <fn>numIslands</fn>(grid) {
    <kw>const</kw> rows = grid.length, cols = grid[<nm>0</nm>].length;
    <kw>let</kw> count = <nm>0</nm>;
    <kw>const</kw> <fn>dfs</fn> = (r, c) => {
        <kw>if</kw> (r < <nm>0</nm> || r >= rows || c < <nm>0</nm> || c >= cols) <kw>return</kw>;
        <kw>if</kw> (grid[r][c] !== <st>'1'</st>) <kw>return</kw>;
        grid[r][c] = <st>'#'</st>;  <cm>// Mark visited</cm>
        <fn>dfs</fn>(r+<nm>1</nm>,c); <fn>dfs</fn>(r-<nm>1</nm>,c); <fn>dfs</fn>(r,c+<nm>1</nm>); <fn>dfs</fn>(r,c-<nm>1</nm>);
    };
    <kw>for</kw> (<kw>let</kw> r = <nm>0</nm>; r < rows; r++)
        <kw>for</kw> (<kw>let</kw> c = <nm>0</nm>; c < cols; c++)
            <kw>if</kw> (grid[r][c] === <st>'1'</st>) { count++; <fn>dfs</fn>(r,c); }
    <kw>return</kw> count;
}`
        }
      },
      {
        id: "bfs",
        label: "Alternative",
        tier: "ok",
        title: "BFS — Iterative Flood Fill",
        tagline: "Same idea as DFS but uses a queue. Avoids recursion stack overflow.",
        time: "O(m×n)", space: "O(min(m,n))",
        timeReason: "Each cell visited once. Same as DFS.",
        spaceReason: "BFS queue at most holds the boundary of the current island, proportional to min(m,n).",
        whyBad: "Slightly more code. Space is actually better than DFS in worst case.",
        whyConsider: "Prefer BFS when grid is large and DFS might stack overflow. Python has recursion limit.",
        intuition: ["Same scan as DFS","When '1' found: enqueue it, mark visited","Process queue: pop cell, enqueue its 4 unvisited '1' neighbors"],
        code: {
          python: `<kw>from</kw> collections <kw>import</kw> deque
<kw>def</kw> <fn>numIslands</fn>(grid):
    rows, cols = <fn>len</fn>(grid), <fn>len</fn>(grid[<nm>0</nm>])
    count = <nm>0</nm>
    <kw>for</kw> r <kw>in</kw> <fn>range</fn>(rows):
        <kw>for</kw> c <kw>in</kw> <fn>range</fn>(cols):
            <kw>if</kw> grid[r][c] == <st>'1'</st>:
                count += <nm>1</nm>
                q = <fn>deque</fn>([(r, c)])
                grid[r][c] = <st>'#'</st>
                <kw>while</kw> q:
                    row, col = q.<fn>popleft</fn>()
                    <kw>for</kw> dr, dc <kw>in</kw> [(<nm>1</nm>,<nm>0</nm>),(-<nm>1</nm>,<nm>0</nm>),(<nm>0</nm>,<nm>1</nm>),(<nm>0</nm>,-<nm>1</nm>)]:
                        nr, nc = row+dr, col+dc
                        <kw>if</kw> <nm>0</nm><=nr<rows <kw>and</kw> <nm>0</nm><=nc<cols <kw>and</kw> grid[nr][nc]==<st>'1'</st>:
                            grid[nr][nc] = <st>'#'</st>
                            q.<fn>append</fn>((nr, nc))
    <kw>return</kw> count`,
          javascript: `<kw>function</kw> <fn>numIslands</fn>(grid) {
    <kw>const</kw> rows=grid.length, cols=grid[<nm>0</nm>].length; <kw>let</kw> count=<nm>0</nm>;
    <kw>const</kw> dirs=[[-<nm>1</nm>,<nm>0</nm>],[<nm>1</nm>,<nm>0</nm>],[<nm>0</nm>,-<nm>1</nm>],[<nm>0</nm>,<nm>1</nm>]];
    <kw>for</kw> (<kw>let</kw> r=<nm>0</nm>; r<rows; r++) <kw>for</kw> (<kw>let</kw> c=<nm>0</nm>; c<cols; c++) {
        <kw>if</kw> (grid[r][c]!==<st>'1'</st>) <kw>continue</kw>;
        count++; <kw>const</kw> q=[[r,c]]; grid[r][c]=<st>'#'</st>;
        <kw>while</kw> (q.length) {
            <kw>const</kw> [row,col]=q.<fn>shift</fn>();
            <kw>for</kw> (<kw>const</kw> [dr,dc] <kw>of</kw> dirs) {
                <kw>const</kw> [nr,nc]=[row+dr,col+dc];
                <kw>if</kw>(nr>=<nm>0</nm>&&nr<rows&&nc>=<nm>0</nm>&&nc<cols&&grid[nr][nc]===<st>'1'</st>){grid[nr][nc]=<st>'#'</st>;q.<fn>push</fn>([nr,nc]);}
            }
        }
    }
    <kw>return</kw> count;
}`
        }
      }
    ],
    patternInsight: "Number of Islands is the entry point to all grid BFS/DFS problems. The pattern: scan grid, find unvisited source, flood-fill to mark its component, count components. This exact structure solves Max Area of Island, Pacific Atlantic Water Flow, Surrounded Regions, and Rotten Oranges.",
    whenToUse: ["Count connected components","Flood fill problems","Reachability in a grid"],
    whenAvoid: ["Weighted graph — use Dijkstra","DAG dependencies — use topological sort"],
    relatedProblems: ["Max Area of Island","Surrounded Regions","Pacific Atlantic Water Flow","Rotten Oranges"]
  },
};

// ── Add more problems with minimal data ──────────────────────
const STUB_PROBLEMS: StubProblem[] = [
  {name:"Valid Anagram",cat:"Arrays & Hashing",diff:"E",patterns:["Hashing","Sorting"]},
  {name:"Group Anagrams",cat:"Arrays & Hashing",diff:"M",patterns:["Hashing"]},
  {name:"Top K Frequent Elements",cat:"Arrays & Hashing",diff:"M",patterns:["Heap","Bucket Sort","Hashing"]},
  {name:"Product of Array Except Self",cat:"Arrays & Hashing",diff:"M",patterns:["Prefix Sum"]},
  {name:"Longest Consecutive Sequence",cat:"Arrays & Hashing",diff:"M",patterns:["Hashing"]},
  {name:"Two Sum II",cat:"Two Pointers",diff:"M",patterns:["Two Pointers"]},
  {name:"3Sum",cat:"Two Pointers",diff:"M",patterns:["Two Pointers","Sorting"]},
  {name:"Container With Most Water",cat:"Two Pointers",diff:"M",patterns:["Two Pointers","Greedy"]},
  {name:"Trapping Rain Water",cat:"Two Pointers",diff:"H",patterns:["Two Pointers","DP","Monotonic Stack"]},
  {name:"Longest Substring Without Repeating Chars",cat:"Sliding Window",diff:"M",patterns:["Sliding Window","Hashing"]},
  {name:"Minimum Window Substring",cat:"Sliding Window",diff:"H",patterns:["Sliding Window","Hashing"]},
  {name:"Sliding Window Maximum",cat:"Sliding Window",diff:"H",patterns:["Sliding Window","Monotonic Deque"]},
  {name:"Valid Parentheses",cat:"Stack",diff:"E",patterns:["Stack"]},
  {name:"Min Stack",cat:"Stack",diff:"M",patterns:["Stack"]},
  {name:"Daily Temperatures",cat:"Stack",diff:"M",patterns:["Monotonic Stack"]},
  {name:"Largest Rectangle in Histogram",cat:"Stack",diff:"H",patterns:["Monotonic Stack"]},
  {name:"Search a 2D Matrix",cat:"Binary Search",diff:"M",patterns:["Binary Search"]},
  {name:"Koko Eating Bananas",cat:"Binary Search",diff:"M",patterns:["Binary Search"]},
  {name:"Find Min in Rotated Sorted Array",cat:"Binary Search",diff:"M",patterns:["Binary Search"]},
  {name:"Median of Two Sorted Arrays",cat:"Binary Search",diff:"H",patterns:["Binary Search","Divide & Conquer"]},
  {name:"Reverse Linked List",cat:"Linked List",diff:"E",patterns:["Two Pointers","Recursion"]},
  {name:"Merge Two Sorted Lists",cat:"Linked List",diff:"E",patterns:["Two Pointers"]},
  {name:"LRU Cache",cat:"Linked List",diff:"M",patterns:["Hashing","Doubly Linked List"]},
  {name:"Merge k Sorted Lists",cat:"Linked List",diff:"H",patterns:["Heap","Divide & Conquer"]},
  {name:"Invert Binary Tree",cat:"Trees",diff:"E",patterns:["DFS","BFS","Recursion"]},
  {name:"Lowest Common Ancestor BST",cat:"Trees",diff:"M",patterns:["DFS","BST"]},
  {name:"Binary Tree Level Order Traversal",cat:"Trees",diff:"M",patterns:["BFS"]},
  {name:"Validate Binary Search Tree",cat:"Trees",diff:"M",patterns:["DFS","Recursion"]},
  {name:"Binary Tree Max Path Sum",cat:"Trees",diff:"H",patterns:["DFS","DP on Tree"]},
  {name:"Kth Largest in Stream",cat:"Heap",diff:"E",patterns:["Heap","Min-Heap"]},
  {name:"Task Scheduler",cat:"Heap",diff:"M",patterns:["Heap","Greedy"]},
  {name:"Find Median from Data Stream",cat:"Heap",diff:"H",patterns:["Two Heaps"]},
  {name:"Implement Trie",cat:"Tries",diff:"M",patterns:["Trie"]},
  {name:"Word Search II",cat:"Tries",diff:"H",patterns:["Trie","Backtracking","DFS"]},
  {name:"Course Schedule",cat:"Graphs",diff:"M",patterns:["Topological Sort","DFS","BFS"]},
  {name:"Pacific Atlantic Water Flow",cat:"Graphs",diff:"M",patterns:["BFS","DFS"]},
  {name:"Word Ladder",cat:"Graphs",diff:"H",patterns:["BFS"]},
  {name:"Cheapest Flights Within K Stops",cat:"Advanced Graphs",diff:"M",patterns:["Bellman-Ford","Dijkstra","DP"]},
  {name:"Alien Dictionary",cat:"Advanced Graphs",diff:"H",patterns:["Topological Sort","BFS"]},
  {name:"House Robber",cat:"1-D Dynamic Programming",diff:"M",patterns:["DP"]},
  {name:"Coin Change",cat:"1-D Dynamic Programming",diff:"M",patterns:["DP","BFS"]},
  {name:"Longest Increasing Subsequence",cat:"1-D Dynamic Programming",diff:"M",patterns:["DP","Binary Search"]},
  {name:"Unique Paths",cat:"2-D Dynamic Programming",diff:"M",patterns:["DP","Math"]},
  {name:"Edit Distance",cat:"2-D Dynamic Programming",diff:"M",patterns:["DP"]},
  {name:"Jump Game",cat:"Greedy",diff:"M",patterns:["Greedy","DP"]},
  {name:"Merge Intervals",cat:"Intervals",diff:"M",patterns:["Sorting","Greedy"]},
  {name:"Meeting Rooms II",cat:"Intervals",diff:"M",patterns:["Heap","Sorting","Two Pointers"]},
  {name:"Subsets",cat:"Backtracking",diff:"M",patterns:["Backtracking","Bit Manipulation"]},
  {name:"N-Queens",cat:"Backtracking",diff:"H",patterns:["Backtracking"]},
  {name:"Single Number",cat:"Bit Manipulation",diff:"E",patterns:["Bit Manipulation","XOR"]},
  {name:"Missing Number",cat:"Bit Manipulation",diff:"E",patterns:["Bit Manipulation","Math"]},
  {name:"Rotate Image",cat:"Math & Geometry",diff:"M",patterns:["Math","Matrix"]},
  {name:"Spiral Matrix",cat:"Math & Geometry",diff:"M",patterns:["Simulation"]},
];

// All problems combined
const ALL_PROBLEMS: AllProblem[] = [
  ...Object.keys(SOLUTIONS).map(name => ({
    name,
    cat: SOLUTIONS[name].category,
    diff: SOLUTIONS[name].difficulty,
    patterns: SOLUTIONS[name].patterns,
    hasFullSolution: true,
  })),
  ...STUB_PROBLEMS.map(p => ({...p, hasFullSolution: false})),
];

const CATEGORIES = [...new Set(ALL_PROBLEMS.map(p => p.cat))];

// ═══════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════

function CodeBlock({ code, lang, onCopy }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // Safe syntax highlighter — no dangerouslySetInnerHTML
  // Converts our tag format to colored spans
  const renderCode = (raw) => {
    const TAG_MAP = {
      kw: "#C084FC", fn: "#5B8CFF", cm: "#3E4F62",
      st: "#4EFFA0", nm: "#FFCC44", op: "#FF9F5B",
      cls: "#FF6B6B",
    };
    const parts = [];
    let remaining = raw, key = 0;
    while (remaining.length > 0) {
      const tagMatch = remaining.match(/^<([a-z]+)>([\s\S]*?)<\/>/);
      if (tagMatch) {
        const [full, tag, inner] = tagMatch;
        const color = TAG_MAP[tag];
        if (color) {
          parts.push(<span key={key++} style={{color}}>{inner}</span>);
        } else {
          parts.push(<span key={key++}>{inner}</span>);
        }
        remaining = remaining.slice(full.length);
      } else {
        // Find next tag start or consume till end
        const nextTag = remaining.search(/<[a-z]+>/);
        const chunk = nextTag > 0 ? remaining.slice(0, nextTag) : remaining;
        if (chunk) parts.push(<span key={key++}>{chunk}</span>);
        remaining = nextTag > 0 ? remaining.slice(nextTag) : "";
      }
    }
    return parts;
  };

  const copy = () => {
    const plain = code.replace(/<[^>]+>/g, "");
    navigator.clipboard?.writeText(plain).catch(() => {});
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-wrap">
      <div className="code-header">
        <span className="code-lang">{lang.toUpperCase()}</span>
        <button className="copy-btn" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
      </div>
      <div className="code-content">
        <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{renderCode(code)}</pre>
      </div>
    </div>
  );
}

function ApproachCard({ approach, defaultOpen = false }: ApproachCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [lang, setLang] = useState("python");
  const tierClass = { best: "best", ok: "ok", bad: "bad", good: "good" }[approach.tier] || "ok";
  const badgeClass = { best: "badge-best", ok: "badge-ok", bad: "badge-bad", good: "badge-good" }[approach.tier] || "badge-ok";
  const badgeLabel = { best: "✦ OPTIMAL", ok: "◆ GOOD", bad: "▲ BRUTE FORCE", good: "◇ ALTERNATIVE" }[approach.tier] || "APPROACH";

  return (
    <div className={`approach-card ${tierClass}`}>
      <div className="ac-header" onClick={() => setOpen(o => !o)}>
        <span className={`ac-badge ${badgeClass}`}>{badgeLabel}</span>
        <div className="ac-meta">
          <div className="ac-title">{approach.title}</div>
          <div className="ac-tagline">{approach.tagline}</div>
          <div className="ac-complexities">
            <span className="cx-pill cx-time">⏱ Time: {approach.time}</span>
            <span className="cx-pill cx-space">💾 Space: {approach.space}</span>
          </div>
        </div>
        <div className="ac-arrow" style={{transform: open ? "rotate(180deg)" : "none"}}>▾</div>
      </div>

      {open && (
        <div className="ac-body fadeUp">
          {/* Why this approach */}
          <div className="why-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div className="why-box why-neutral">
              <div className="why-lbl" style={{color:"var(--g)"}}>⏱ Why {approach.time} time?</div>
              <div className="why-text">{approach.timeReason}</div>
            </div>
            <div className="why-box why-neutral">
              <div className="why-lbl" style={{color:"var(--b)"}}>💾 Why {approach.space} space?</div>
              <div className="why-text">{approach.spaceReason}</div>
            </div>
          </div>

          {approach.whyBad && (
            <div className="why-box why-bad" style={{marginBottom:12}}>
              <div className="why-lbl" style={{color:"var(--r)"}}>❌ Why NOT to use this in production</div>
              <div className="why-text">{approach.whyBad}</div>
            </div>
          )}
          {approach.whyGood && (
            <div className="why-box why-good" style={{marginBottom:12}}>
              <div className="why-lbl" style={{color:"var(--g)"}}>✅ Why this is the best approach</div>
              <div className="why-text">{approach.whyGood}</div>
            </div>
          )}
          {approach.whyConsider && (
            <div className="why-box why-neutral" style={{marginBottom:12}}>
              <div className="why-lbl" style={{color:"var(--b)"}}>💡 When to still consider this</div>
              <div className="why-text">{approach.whyConsider}</div>
            </div>
          )}

          {/* Intuition steps */}
          <div className="sec-title" style={{fontSize:12.5,marginBottom:10}}>🧠 Intuition — Step by Step</div>
          <div className="intuition-steps">
            {approach.intuition.map((step, i) => (
              <div key={i} className="int-step">
                <div className="int-num">{String(i+1).padStart(2,"0")}</div>
                <div className="int-text">{step}</div>
              </div>
            ))}
          </div>

          {/* Language tabs + code */}
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {Object.keys(approach.code).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${lang===l?"var(--g)":"var(--bdr)"}`,background:lang===l?"#172a1f":"var(--sur)",color:lang===l?"var(--g)":"var(--mu)",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {l === "python" ? "🐍 Python" : "🟡 JavaScript"}
              </button>
            ))}
          </div>
          {approach.code[lang] && <CodeBlock code={approach.code[lang]} lang={lang} />}
        </div>
      )}
    </div>
  );
}


function FullSolutionPage({ prob, onRelatedClick, provider, model, apiKey }: FullSolutionPageProps) {
  const sol = SOLUTIONS[prob.name];
  const diffLabel = {E:"Easy",M:"Medium",H:"Hard"}[prob.diff];
  const diffColor = {E:"var(--g)",M:"var(--y)",H:"var(--r)"}[prob.diff];
  const approaches = sol.approaches;

  return (
    <div className="sol-page fadeUp">
      <div className="prob-header">
        <div className="prob-breadcrumb">
          <span>{sol.category}</span><span>›</span><span style={{color:"var(--tx)"}}>{prob.name}</span>
        </div>
        <div className="prob-title">{prob.name}</div>
        <div className="prob-tags">
          <span className="tag" style={{background:`${diffColor}18`,color:diffColor}}>{diffLabel}</span>
          {prob.patterns.map(p => <span key={p} className="tag tag-pat">{p}</span>)}
        </div>
        <div className="prob-desc">
          <p>{sol.description}</p>
          <div className="prob-example"><pre style={{margin:0,fontSize:11.5}}>{sol.example}</pre></div>
        </div>
      </div>

      <div className="sec-title">📊 All Approaches at a Glance</div>
      <div style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:12,overflow:"hidden",marginBottom:22}}>
        <div className="cx-table-wrap">
          <table className="cx-table">
            <thead><tr><th>Approach</th><th>Time</th><th>Space</th><th>Trade-off</th></tr></thead>
            <tbody>
              {approaches.map((a,i) => {
                const tc = v => v==="O(1)"?"og":v.includes("log")?"oy":v.includes("n²")||v.includes("2ⁿ")?"or":"og";
                return (
                  <tr key={i} className={a.tier==="best"?"best-row":""}>
                    <td style={{fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
                      {a.tier==="best"&&<span style={{fontSize:10,color:"var(--g)"}}>★</span>}
                      {a.title.split(" —")[0]}
                    </td>
                    <td><span className={tc(a.time)}>{a.time}</span></td>
                    <td><span className={tc(a.space)}>{a.space}</span></td>
                    <td style={{color:"var(--mu)",fontSize:11}}>{a.whyBad||a.whyGood||a.whyConsider||""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sec-title">🚀 Solutions — Brute Force to Optimal</div>
      <div className="approaches">
        {approaches.map((a, i) => <ApproachCard key={a.id} approach={a} defaultOpen={a.tier==="best"} />)}
      </div>

      <div className="pattern-insight">
        <div className="pi-lbl">⚡ Pattern Insight</div>
        <div className="pi-text">{sol.patternInsight}</div>
      </div>

      <div className="sec-title">🎯 When to Use This Pattern</div>
      <div className="when-grid">
        <div className="when-card when-use">
          <div className="when-lbl" style={{color:"var(--g)"}}>✅ Use when</div>
          {sol.whenToUse.map(w => <div key={w} className="when-item"><span style={{color:"var(--g)"}}>→</span><span>{w}</span></div>)}
        </div>
        <div className="when-card when-avoid">
          <div className="when-lbl" style={{color:"var(--r)"}}>❌ Avoid when</div>
          {sol.whenAvoid.map(w => <div key={w} className="when-item"><span style={{color:"var(--r)"}}>→</span><span>{w}</span></div>)}
        </div>
      </div>

      <AIHelper problem={prob.name} provider={provider} model={model} apiKey={apiKey}/>

      <div className="sec-title">🔗 Solve These Next</div>
      <div className="related-grid">
        {sol.relatedProblems.map(name => {
          const rp = ALL_PROBLEMS.find(p => p.name === name);
          const dc = {E:"var(--g)",M:"var(--y)",H:"var(--r)"}[rp?.diff] || "var(--mu)";
          return (
            <div key={name} className="related-card" onClick={() => rp && onRelatedClick(rp)}>
              <div style={{fontSize:12.5,fontWeight:600,marginBottom:4}}>{name}</div>
              {rp && <div style={{fontSize:10.5,color:dc,fontWeight:700}}>{rp.diff==="E"?"Easy":rp.diff==="M"?"Medium":"Hard"}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════
// PROVIDER CONFIG
// ═══════════════════════════════════════════════════
const PROVIDERS: Record<string, ProviderCfg> = {
  nvidia: {
    label: "NVIDIA NIM", icon: "🟢", color: "#76B900",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    keyPlaceholder: "nvapi-xxxxxxxxxxxx",
    keyLink: "https://build.nvidia.com",
    keyLinkLabel: "build.nvidia.com (Free)",
    format: "openai",
    models: [
      { id: "meta/llama-3.3-70b-instruct",              label: "Llama 3.3 70B",    badge: "FREE ★" },
      { id: "meta/llama-3.1-8b-instruct",               label: "Llama 3.1 8B",     badge: "FREE · Fast" },
      { id: "mistralai/mistral-7b-instruct",             label: "Mistral 7B",       badge: "FREE" },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct",   label: "Nemotron 70B",     badge: "FREE" },
      { id: "microsoft/phi-3-mini-128k-instruct",        label: "Phi-3 Mini",       badge: "FREE · Tiny" },
    ],
  },
  openai: {
    label: "OpenAI", icon: "⚫", color: "#10A37F",
    endpoint: "https://api.openai.com/v1/chat/completions",
    keyPlaceholder: "sk-xxxxxxxxxxxx",
    keyLink: "https://platform.openai.com/api-keys",
    keyLinkLabel: "platform.openai.com",
    format: "openai",
    models: [
      { id: "gpt-4o",        label: "GPT-4o",        badge: "Best" },
      { id: "gpt-4o-mini",   label: "GPT-4o Mini",   badge: "Fast · Cheap" },
      { id: "gpt-4-turbo",   label: "GPT-4 Turbo",   badge: "Powerful" },
      { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", badge: "Cheapest" },
    ],
  },
  anthropic: {
    label: "Anthropic", icon: "🔶", color: "#D4622A",
    endpoint: "https://api.anthropic.com/v1/messages",
    keyPlaceholder: "sk-ant-xxxxxxxxxxxx",
    keyLink: "https://console.anthropic.com/settings/keys",
    keyLinkLabel: "console.anthropic.com",
    format: "anthropic",
    models: [
      { id: "claude-opus-4-5",   label: "Claude Opus 4.5",   badge: "Most Powerful" },
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", badge: "Balanced ★" },
      { id: "claude-haiku-4-5",  label: "Claude Haiku 4.5",  badge: "Fast · Cheap" },
    ],
  },
  gemini: {
    label: "Google Gemini", icon: "🔵", color: "#4285F4",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyPlaceholder: "AIzaSyxxxxxxxxxxxx",
    keyLink: "https://aistudio.google.com/apikey",
    keyLinkLabel: "aistudio.google.com (Free)",
    format: "openai",
    models: [
      { id: "gemini-2.0-flash",      label: "Gemini 2.0 Flash",      badge: "Fast ★" },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", badge: "Cheapest" },
      { id: "gemini-1.5-pro",        label: "Gemini 1.5 Pro",        badge: "Powerful" },
      { id: "gemini-1.5-flash",      label: "Gemini 1.5 Flash",      badge: "Balanced" },
    ],
  },
};

// Unified caller — works for all 4 providers
async function callAI({ provider, model, apiKey, systemPrompt, userMessage, maxTokens = 1024 }: CallAIParams): Promise<string> {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error("Unknown provider");
  const headers = { "Content-Type": "application/json" };

  if (provider === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    const res = await fetch(cfg.endpoint, {
      method: "POST", headers,
      body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt,
        messages: [{ role: "user", content: userMessage }] }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.content?.find(b => b.type === "text")?.text || "No response.";
  } else {
    // OpenAI-compatible (NVIDIA, OpenAI, Gemini)
    headers["Authorization"] = `Bearer ${apiKey}`;
    const url = provider === "gemini" ? `${cfg.endpoint}?key=${apiKey}` : cfg.endpoint;
    const res = await fetch(url, {
      method: "POST", headers,
      body: JSON.stringify({
        model, max_tokens: maxTokens, temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userMessage  },
        ],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(
      typeof data.error === "string" ? data.error :
      data.error?.message || JSON.stringify(data.error)
    );
    return data.choices?.[0]?.message?.content || "No response.";
  }
}

// ═══════════════════════════════════════════════════
// PROVIDER PANEL — collapsible sidebar widget
// ═══════════════════════════════════════════════════
function ProviderPanel({ provider, setProvider, model, setModel, apiKey, setApiKey }: ProviderPanelProps) {
  const [open, setOpen] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const cfg = PROVIDERS[provider];
  const hasKey = apiKey.trim().length > 0;
  const currentModel = cfg.models.find(m => m.id === model);

  const switchProvider = p => {
    setProvider(p);
    setModel(PROVIDERS[p].models[0].id);
    setApiKey("");
  };

  return (
    <div style={{marginBottom:10,background:"var(--fa)",border:`1px solid ${hasKey?"#253d2a":"var(--bdr)"}`,borderRadius:9,overflow:"hidden",transition:"border-color .2s"}}>
      {/* Collapsed header */}
      <div style={{padding:"9px 10px",display:"flex",alignItems:"center",gap:7,cursor:"pointer",background:"var(--card)"}}
        onClick={() => setOpen(o => !o)}>
        <span style={{fontSize:15}}>{cfg.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:700,color:hasKey ? cfg.color : "var(--tx)",lineHeight:1.2}}>{cfg.label}</div>
          <div style={{fontSize:9.5,color:"var(--mu)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>
            {currentModel?.label || model}
          </div>
        </div>
        <span style={{width:7,height:7,borderRadius:"50%",background:hasKey?"var(--g)":"#3a3030",flexShrink:0}}/>
        <span style={{fontSize:11,color:"var(--mu)",transition:"transform .2s",transform:open?"rotate(180deg)":"none",flexShrink:0}}>▾</span>
      </div>

      {open && (
        <div style={{padding:"12px 10px 14px"}}>
          {/* Provider grid */}
          <div style={{fontSize:8.5,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:7}}>Provider</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:12}}>
            {Object.entries(PROVIDERS).map(([key, p]) => (
              <button key={key} onClick={() => switchProvider(key)}
                style={{padding:"6px 8px",borderRadius:7,border:`1.5px solid ${provider===key ? p.color : "var(--bdr)"}`,
                  background:provider===key ? `${p.color}18` : "var(--sur)",
                  color:provider===key ? p.color : "var(--mu)",
                  fontSize:10.5,fontWeight:600,cursor:"pointer",
                  display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}>
                <span style={{fontSize:12}}>{p.icon}</span>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Model list */}
          <div style={{fontSize:8.5,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:7}}>Model</div>
          <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:12}}>
            {cfg.models.map(m => (
              <button key={m.id} onClick={() => setModel(m.id)}
                style={{padding:"6px 10px",borderRadius:7,
                  border:`1.5px solid ${model===m.id ? "var(--g)" : "var(--bdr)"}`,
                  background:model===m.id ? "#172a1f" : "var(--sur)",
                  color:model===m.id ? "var(--g)" : "var(--mu)",
                  fontSize:11,fontWeight:model===m.id ? 600 : 400,
                  cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",
                  transition:"all .15s",textAlign:"left"}}>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{m.label}</span>
                <span style={{fontSize:8.5,padding:"1px 6px",borderRadius:10,flexShrink:0,marginLeft:5,
                  background:model===m.id ? "#253d2a" : "var(--card)",
                  color:model===m.id ? "var(--g)" : "var(--mu)"}}>{m.badge}</span>
              </button>
            ))}
          </div>

          {/* API Key */}
          <div style={{fontSize:8.5,fontWeight:700,color:"var(--mu)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:7}}>API Key</div>
          <div style={{display:"flex",gap:4,marginBottom:6}}>
            <input type={keyVisible ? "text" : "password"} value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={cfg.keyPlaceholder}
              style={{flex:1,padding:"6px 8px",borderRadius:6,background:"var(--sur)",
                border:`1px solid ${hasKey ? "var(--g)" : "var(--bdr)"}`,
                color:"var(--tx)",fontSize:11,minWidth:0,transition:"border-color .15s"}}/>
            <button onClick={() => setKeyVisible(v => !v)}
              style={{padding:"4px 8px",borderRadius:6,border:"1px solid var(--bdr)",
                background:"var(--sur)",color:"var(--mu)",fontSize:12,flexShrink:0}}>
              {keyVisible ? "🙈" : "👁"}
            </button>
          </div>
          <a href={cfg.keyLink} target="_blank" rel="noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9.5,
              color:cfg.color,textDecoration:"none",fontWeight:600}}>
            🔑 Get free key → {cfg.keyLinkLabel}
          </a>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AI HELPER — ask tutor
// ═══════════════════════════════════════════════════
function AIHelper({ problem, provider, model, apiKey }: AIHelperProps) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const cfg = PROVIDERS[provider];

  const ask = async () => {
    if (!question.trim() || loading) return;
    if (!apiKey.trim()) {
      setResponse("⚠️ Please enter your API key in the provider panel (sidebar) to use the AI Tutor.");
      return;
    }
    setLoading(true); setResponse("");
    const mounted = { current: true };
    try {
      const text = await callAI({
        provider, model, apiKey,
        systemPrompt: `You are a DSA tutor. Answer questions about the LeetCode problem: "${problem}". Be concise, focus on intuition. Format code with triple backticks. Max 250 words unless more is truly needed.`,
        userMessage: question,
        maxTokens: 800,
      });
      if (mounted.current) setResponse(text);
    } catch (e) {
      if (mounted.current) setResponse(`❌ ${e.message}\n\nDouble-check your API key and try again.`);
    }
    if (mounted.current) setLoading(false);
  };

  const suggestions = [
    "Why can't we use greedy here?",
    "Explain the time complexity intuitively",
    "What pattern does this follow?",
    "How do I spot this in an interview?",
    "What edge cases should I test?",
  ];

  return (
    <div className="ai-section">
      <div className="ai-header">
        <div className="ai-icon" style={{background:`${cfg.color}18`,border:`1px solid ${cfg.color}30`}}>
          <span style={{fontSize:16}}>{cfg.icon}</span>
        </div>
        <div>
          <div className="ai-title">Ask AI Tutor</div>
          <div className="ai-sub">{cfg.label} · {cfg.models.find(m => m.id === model)?.label || model}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {suggestions.map(s => (
          <button key={s} onClick={() => setQuestion(s)}
            style={{padding:"3px 9px",border:"1px solid var(--bdr)",borderRadius:20,
              background:"var(--sur)",color:"var(--mu)",fontSize:10.5,cursor:"pointer",transition:"all .15s"}}
            onMouseOver={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.color = "var(--mu)"; }}>
            {s}
          </button>
        ))}
      </div>

      <div className="ai-input">
        <textarea className="ai-textarea" value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), ask())}
          placeholder="Ask anything... (Enter to send, Shift+Enter for new line)" rows={2}/>
        <button className="ai-btn" onClick={ask} disabled={loading || !question.trim()}
          style={{background:`${cfg.color}18`,color:cfg.color,borderColor:`${cfg.color}40`}}>
          {loading ? "Thinking..." : "Ask →"}
        </button>
      </div>

      {(loading || response) && (
        <div className="ai-response">
          {loading ? (
            <div className="ai-thinking">
              <div className="thinking-dot" style={{background:cfg.color}}/>
              <div className="thinking-dot" style={{background:cfg.color}}/>
              <div className="thinking-dot" style={{background:cfg.color}}/>
              <span style={{color:cfg.color}}>{cfg.label} is thinking...</span>
            </div>
          ) : <div style={{whiteSpace:"pre-wrap"}}>{response}</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STUB SOLUTION PAGE — AI generated
// ═══════════════════════════════════════════════════
function StubSolutionPage({ prob, provider, model, apiKey }: StubSolutionPageProps) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const cfg = PROVIDERS[provider];

  const generate = async () => {
    if (!apiKey.trim()) {
      setResponse("⚠️ Please enter your API key in the provider panel (sidebar) to generate solutions.");
      setGenerated(true); return;
    }
    setLoading(true); setResponse(""); setGenerated(false);
    try {
      const text = await callAI({
        provider, model, apiKey,
        systemPrompt: `You are a DSA expert. Generate structured solution breakdowns for LeetCode problems. Always include:
1. Pattern Recognition — which pattern applies and WHY
2. Brute Force — approach, time/space complexity, WHY it is slow (give concrete numbers)
3. Optimal Approach — approach, time/space complexity, WHY it works
4. Key Intuition — 2-3 sentences on the core insight
5. Python code for the optimal solution (clean, with inline comments)
6. Edge cases to test

Use markdown. Be concise. Focus on the WHY, not just the what.`,
        userMessage: `Problem: ${prob.name}
Category: ${prob.cat}
Difficulty: ${prob.diff === "E" ? "Easy" : prob.diff === "M" ? "Medium" : "Hard"}
Key Patterns: ${prob.patterns.join(", ")}

Generate a complete solution breakdown: brute force → optimal, with complexity reasoning for every choice.`,
        maxTokens: 1200,
      });
      setResponse(text); setGenerated(true);
    } catch (e) {
      setResponse(`❌ ${e.message}\n\nCheck your API key and try again.`);
      setGenerated(true);
    }
    setLoading(false);
  };

  const diffLabel = { E:"Easy", M:"Medium", H:"Hard" }[prob.diff];
  const diffColor = { E:"var(--g)", M:"var(--y)", H:"var(--r)" }[prob.diff];

  return (
    <div className="sol-page fadeUp">
      <div className="prob-header">
        <div className="prob-breadcrumb">
          <span>{prob.cat}</span><span>›</span>
          <span style={{color:"var(--tx)"}}>{prob.name}</span>
        </div>
        <div className="prob-title">{prob.name}</div>
        <div className="prob-tags">
          <span className="tag" style={{background:`${diffColor}18`,color:diffColor}}>{diffLabel}</span>
          {prob.patterns.map(p => <span key={p} className="tag tag-pat">{p}</span>)}
        </div>
      </div>

      {!generated && (
        <div style={{background:"var(--card)",border:"1px solid var(--bdr)",borderRadius:13,
          padding:"28px 24px",textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:10}}>{cfg.icon}</div>
          <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:700,marginBottom:6}}>
            AI-Generated Solution
          </div>
          <p style={{fontSize:12.5,color:"var(--mu)",lineHeight:1.65,marginBottom:4,maxWidth:380,margin:"0 auto 6px"}}>
            Via <strong style={{color:cfg.color}}>{cfg.label}</strong> · <span>{cfg.models.find(m=>m.id===model)?.label}</span>
          </p>
          <p style={{fontSize:11.5,color:"var(--mu)",lineHeight:1.6,maxWidth:380,margin:"0 auto 20px"}}>
            Pattern recognition · Brute force → Optimal · Complexity reasoning · Python code · Edge cases
          </p>
          <button onClick={generate} disabled={loading}
            style={{padding:"10px 26px",borderRadius:9,background:`${cfg.color}18`,
              color:cfg.color,border:`1px solid ${cfg.color}40`,
              fontSize:13.5,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
            {loading ? "Generating..." : `Generate with ${cfg.label} →`}
          </button>
        </div>
      )}

      {loading && (
        <div className="ai-section">
          <div className="ai-thinking" style={{justifyContent:"center",padding:"20px 0"}}>
            <div className="thinking-dot" style={{background:cfg.color}}/>
            <div className="thinking-dot" style={{background:cfg.color}}/>
            <div className="thinking-dot" style={{background:cfg.color}}/>
            <span style={{fontSize:13,color:cfg.color}}>
              {cfg.label} is generating solution...
            </span>
          </div>
        </div>
      )}

      {generated && response && (
        <div>
          <div style={{background:"var(--card)",border:`1px solid ${cfg.color}40`,
            borderRadius:12,padding:"16px 18px",marginBottom:16}}>
            <div style={{fontFamily:"var(--fd)",fontSize:12,fontWeight:700,
              color:cfg.color,marginBottom:10,display:"flex",alignItems:"center",gap:7}}>
              <span>{cfg.icon}</span>
              {cfg.label} · {cfg.models.find(m=>m.id===model)?.label}
            </div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#b0bcc8",whiteSpace:"pre-wrap"}}>{response}</div>
          </div>
          <button onClick={generate} disabled={loading}
            style={{padding:"7px 16px",borderRadius:7,background:"var(--sur)",
              border:"1px solid var(--bdr)",color:"var(--mu)",fontSize:12,
              cursor:"pointer",marginBottom:20}}>
            ↺ Regenerate
          </button>
        </div>
      )}

      <AIHelper problem={prob.name} provider={provider} model={model} apiKey={apiKey}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [provider, setProvider] = useState(() => {
    try { return localStorage.getItem("sol-provider") || "nvidia"; } catch { return "nvidia"; }
  });
  const [model, setModel] = useState(() => {
    try {
      const p = localStorage.getItem("sol-provider") || "nvidia";
      return localStorage.getItem("sol-model") || PROVIDERS[p]?.models[0]?.id || PROVIDERS.nvidia.models[0].id;
    } catch { return PROVIDERS.nvidia.models[0].id; }
  });
  const [apiKey, setApiKey] = useState(""); // Never persist API keys

  // Persist provider & model (not API key — security)
  useEffect(() => { try { localStorage.setItem("sol-provider", provider); } catch {} }, [provider]);
  useEffect(() => { try { localStorage.setItem("sol-model", model); } catch {} }, [model]);
  const mainRef = useRef(null);

  const filtered = ALL_PROBLEMS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cat.toLowerCase().includes(search.toLowerCase()) ||
    p.patterns.some(pt => pt.toLowerCase().includes(search.toLowerCase()))
  );

  const selectProblem = p => {
    setSelected(p);
    setSidebarOpen(false);
    mainRef.current?.scrollTo(0, 0);
  };

  const groupedFiltered = CATEGORIES.map(cat => ({
    cat, problems: filtered.filter(p => p.cat === cat)
  })).filter(g => g.problems.length > 0);

  const cfg = PROVIDERS[provider];
  const hasKey = apiKey.trim().length > 0;

  return (
    <div className="app">
      {/* Mobile topbar */}
      <div className="topbar-m">
        <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:800,color:"var(--g)"}}>⚡ Solution Explorer</div>
        <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>
      </div>
      <div className={`overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)}/>

      {/* Sidebar */}
      <nav className={`sb ${sidebarOpen ? "open" : ""}`}>
        <div className="sb-top">
          <div className="sb-logo">⚡ Solution Explorer</div>

          {/* Provider / Model / Key Panel */}
          <ProviderPanel
            provider={provider} setProvider={setProvider}
            model={model} setModel={setModel}
            apiKey={apiKey} setApiKey={setApiKey}
          />

          <input className="sb-search" placeholder="🔍 Search problems or patterns..."
            value={search} onChange={e => setSearch(e.target.value)}/>

          <div style={{display:"flex",gap:8,marginTop:8,fontSize:10.5,color:"var(--mu)",flexWrap:"wrap"}}>
            <span>🟢 {ALL_PROBLEMS.filter(p=>p.diff==="E").length} Easy</span>
            <span>🟡 {ALL_PROBLEMS.filter(p=>p.diff==="M").length} Med</span>
            <span>🔴 {ALL_PROBLEMS.filter(p=>p.diff==="H").length} Hard</span>
            <span style={{marginLeft:"auto",color:"var(--g)",fontWeight:600}}>
              {ALL_PROBLEMS.filter(p=>p.hasFullSolution).length} ★ full
            </span>
          </div>
        </div>

        <div className="sb-list">
          {groupedFiltered.map(({ cat, problems }) => (
            <div key={cat}>
              <div className="sb-cat">{cat}</div>
              {problems.map(p => (
                <div key={p.name} className={`pb ${selected?.name === p.name ? "active" : ""}`}
                  onClick={() => selectProblem(p)}>
                  <div className={`diff-dot d${p.diff}`}/>
                  <div className="pb-name">{p.name}</div>
                  {p.hasFullSolution && <span style={{fontSize:9,color:"var(--g)",fontWeight:700,flexShrink:0}}>★</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="main" ref={mainRef}>
        {selected ? (
          selected.hasFullSolution
            ? <FullSolutionPage prob={selected} onRelatedClick={selectProblem}
                provider={provider} model={model} apiKey={apiKey}/>
            : <StubSolutionPage prob={selected}
                provider={provider} model={model} apiKey={apiKey}/>
        ) : (
          <div className="empty">
            <div className="empty-icon">⚡</div>
            <h2>Pick a Problem</h2>
            <p>Select any problem to see every approach — brute force to optimal — with complexity reasoning, code, and AI-powered explanations.</p>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,maxWidth:400,marginTop:12}}>
              {[
                { icon:"★",    label:"7 Full Solutions",  sub:"Hand-crafted, all approaches", color:"var(--g)" },
                { icon:cfg.icon, label:"50+ AI Solutions", sub:`via ${cfg.label}`,           color:cfg.color  },
                { icon:"🧠",   label:"Pattern Insights",  sub:"What each problem teaches",   color:"var(--y)" },
                { icon:"💬",   label:"AI Tutor",          sub:"Ask anything, get help now",   color:"var(--p)" },
              ].map(f => (
                <div key={f.label} style={{background:"var(--card)",border:"1px solid var(--bdr)",
                  borderRadius:10,padding:"11px 13px",textAlign:"left"}}>
                  <div style={{fontSize:18,marginBottom:5}}>{f.icon}</div>
                  <div style={{fontFamily:"var(--fd)",fontSize:12,fontWeight:700,
                    color:f.color,marginBottom:2}}>{f.label}</div>
                  <div style={{fontSize:10.5,color:"var(--mu)"}}>{f.sub}</div>
                </div>
              ))}
            </div>

            {/* Live provider status */}
            <div style={{marginTop:16,padding:"12px 16px",background:"var(--card)",
              border:`1px solid ${hasKey ? "#253d2a" : "var(--bdr)"}`,
              borderRadius:10,maxWidth:380,width:"100%",transition:"border-color .2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{fontSize:16}}>{cfg.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12.5,fontWeight:600,color:hasKey ? cfg.color : "var(--mu)"}}>{cfg.label}</div>
                  <div style={{fontSize:10.5,color:"var(--mu)"}}>{cfg.models.find(m=>m.id===model)?.label}</div>
                </div>
                <span style={{width:8,height:8,borderRadius:"50%",
                  background:hasKey ? "var(--g)" : "#3a3030",flexShrink:0}}/>
              </div>
              <div style={{fontSize:11,color:"var(--mu)"}}>
                {hasKey
                  ? "✅ API key set — ready to generate solutions!"
                  : "⚠️ Click the provider panel in the sidebar to add your API key"}
              </div>
            </div>

            <div style={{marginTop:10,fontSize:11,color:"var(--mu)"}}>
              ★ = hand-crafted · others generated by AI on demand
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
