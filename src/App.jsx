import { useState, useEffect, useRef, useMemo } from "react";

// ── RESPONSIVE: mobile vs iPad/desktop (one breakpoint) ────────────────────────
function useViewport() {
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return { isMobile: vw < 768, isLarge: vw >= 768, width: vw };
}

// ── CONSTANTS (light & lively) ────────────────────────────────────────────────
const C = {
  bg:"#F0F4FF", card:"#FFFFFF", card2:"#F1F5F9", border:"#E2E8F0",
  green:"#059669", green2:"#047857", blue:"#1A56DB", purple:"#7C3AED",
  red:"#DC2626", yellow:"#D97706", orange:"#EA580C",
  text:"#0D1B4B", muted:"#64748B",
  greenSoft:"#ECFDF5", blueSoft:"#EEF2FF", purpleSoft:"#F5F3FF", yellowSoft:"#FFFBEB", redSoft:"#FEF2F2",
  shadow:"0 2px 12px rgba(26,86,219,.08)", shadowMd:"0 4px 24px rgba(26,86,219,.12)",
};
// NOTE: Changing this will start a fresh localStorage namespace.
const NS = "KinsenasApp_";
const save = (k,v) => { try{localStorage.setItem(NS+k,JSON.stringify(v))}catch{} };
const load = (k,d) => { try{const r=localStorage.getItem(NS+k);return r?JSON.parse(r):d}catch{return d} };
const uid  = () => Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const fmt  = n => Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:2});
const fmtK = n => n>=1000?`₱${(n/1000).toFixed(1)}K`:`₱${fmt(n)}`;
const catIco = c => ({loan:"🏦",bill:"📄",expense:"💳",savings:"💚",investment:"📈"}[c]||"📋");

// ── LOCAL AUTH (offline app lock) ────────────────────────────────────────────
const AUTH_HASH_KEY = `${NS}auth_hash_v1`;
const ONBOARD_KEY = `${NS}onboarded_v1`;

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function LocalAuthScreen({ onUnlocked }) {
  const hasAccount = !!localStorage.getItem(AUTH_HASH_KEY);
  const [mode, setMode] = useState(() => (hasAccount ? "login" : "register")); // login | register
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "register") {
        if (pass.length < 6) throw new Error("Use at least 6 characters.");
        if (pass !== pass2) throw new Error("Passwords do not match.");
        const h = await sha256Hex(pass);
        localStorage.setItem(AUTH_HASH_KEY, h);
        onUnlocked?.();
      } else {
        const existing = localStorage.getItem(AUTH_HASH_KEY);
        if (!existing) { setMode("register"); setMsg("No password set yet. Set a password first."); return; }
        const h = await sha256Hex(pass);
        if (h !== existing) throw new Error("Incorrect password.");
        onUnlocked?.();
      }
    } catch (e) {
      setMsg(e?.message || "Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,padding:18}}>
      <div style={{width:"100%",maxWidth:420,background:C.card,border:`1px solid ${C.border}`,borderRadius:18,boxShadow:C.shadow,padding:18}}>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>
          <span style={{filter:"sepia(1) saturate(4) hue-rotate(15deg)"}}>⚡</span> KinsenasApp
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.6}}>
          {mode === "register" ? (
            <>
              Set a password for this device. <strong style={{color:C.text}}>No email / username</strong> is needed because this app stores
              everything locally (offline). This password is just to lock your data on this device.
            </>
          ) : (
            <>
              Unlock this app on this device. (Local-only — nothing is sent to a server.)
            </>
          )}
        </div>

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <button onClick={()=>{setMode("login");setMsg(null)}} style={{
            flex:1,border:"none",borderRadius:999,padding:"8px 12px",fontSize:12,fontWeight:700,
            background:mode==="login"?C.blue:C.card2,color:mode==="login"?"#fff":C.muted
          }}>Unlock</button>
          <button onClick={()=>{setMode("register");setMsg(null)}} style={{
            flex:1,border:"none",borderRadius:999,padding:"8px 12px",fontSize:12,fontWeight:700,
            background:mode==="register"?C.blue:C.card2,color:mode==="register"?"#fff":C.muted
          }}>Set password</button>
        </div>

        {msg && (
          <div style={{background:C.redSoft,border:`1px solid ${C.red}22`,borderRadius:12,padding:"10px 12px",marginBottom:12,color:C.text,fontSize:12,lineHeight:1.4}}>
            {msg}
          </div>
        )}

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:6}}>Password</div>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••"
            style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,outline:"none"}} />
        </div>
        {mode === "register" && (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:6}}>Confirm password</div>
            <input value={pass2} onChange={e=>setPass2(e.target.value)} type="password" placeholder="••••••••"
              style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",fontSize:14,outline:"none"}} />
          </div>
        )}

        <button disabled={loading || !pass || (mode==="register" && !pass2)} onClick={submit} style={{
          width:"100%",border:"none",borderRadius:14,padding:14,fontSize:14,fontWeight:800,
          background:loading?C.card2:C.blue,color:loading?C.muted:"#fff",opacity:(!pass||(mode==="register"&&!pass2))?0.6:1
        }}>
          {loading ? "Please wait..." : (mode==="register" ? "Save password" : "Unlock")}
        </button>

        <div style={{marginTop:12,fontSize:11,color:C.muted,lineHeight:1.5}}>
          Everything is local. Your login is stored only on this device. If you forget your password, you’ll need to clear the site’s data to reset it.
        </div>
      </div>
    </div>
  );
}

// ── FINANCIAL TIPS ENGINE ─────────────────────────────────────────────────────
function generateTips(co, pay, loans, goals, invest, savHist) {
  const totalIncome   = Object.values(co).reduce((s,c)=>s+c.income,0);
  const totalExpenses = Object.values(co).reduce((s,c)=>s+c.items.reduce((ss,i)=>ss+i.budget,0),0);
  const netSavings    = totalIncome - totalExpenses;
  const savingsRate   = netSavings / totalIncome;
  const totalDebt     = loans.reduce((s,l)=>s+Math.max(l.total-l.paid,0),0);
  const monthlyDebt   = loans.reduce((s,l)=>s+l.monthly,0);
  const debtRatio     = monthlyDebt / totalIncome;
  const totalSaved    = goals.reduce((s,g)=>s+g.current,0);
  const totalGoalTarget = goals.reduce((s,g)=>s+g.target,0);
  const investTotal   = invest.reduce((s,i)=>s+i.currentValue,0);
  const emergencyFund = goals.find(g=>g.name.toLowerCase().includes("emergency"));
  const efMonths      = emergencyFund ? emergencyFund.current/(totalExpenses/12||1) : 0;

  const tips = [];

  // Emergency fund check
  if (!emergencyFund) {
    tips.push({type:"critical",icon:"🛡️",title:"No Emergency Fund Detected",
      body:"Every financial plan starts here. Before investing or paying extra on loans, you need 3–6 months of expenses saved. That's ₱"+(fmt(totalExpenses*3))+" to ₱"+(fmt(totalExpenses*6))+" for you.",
      action:"Add an Emergency Fund goal in the Savings tab."});
  } else if (efMonths < 3) {
    tips.push({type:"urgent",icon:"⚠️",title:`Emergency Fund: Only ${efMonths.toFixed(1)} Months`,
      body:`You have ${efMonths.toFixed(1)} months of coverage. Target is 6 months (₱${fmt(totalExpenses*6)}). This is your financial floor — everything else is built on top of it.`,
      action:"Increase your monthly savings allocation until this hits 6 months."});
  } else if (efMonths >= 6) {
    tips.push({type:"good",icon:"✅",title:`Emergency Fund: Solid (${efMonths.toFixed(1)} months)`,
      body:"You've cleared the first level. Your emergency fund is funded. Now extra cash should go toward high-interest debt or investments.",
      action:"Redirect excess savings to debt payoff or UITF/stocks."});
  }

  // Savings rate check
  if (savingsRate < 0.1) {
    tips.push({type:"critical",icon:"💸",title:`Savings Rate: Only ${(savingsRate*100).toFixed(0)}%`,
      body:"Top financial minds say: save at least 20% of income. The 50/30/20 rule — 50% needs, 30% wants, 20% savings. Right now you're saving ₱"+fmt(netSavings)+" monthly.",
      action:"Find one expense to cut or one income stream to add."});
  } else if (savingsRate >= 0.2) {
    tips.push({type:"good",icon:"🏆",title:`Savings Rate: ${(savingsRate*100).toFixed(0)}% — Above Average`,
      body:"You're saving more than most Filipinos. The average household saves less than 10%. Keep this up and compound interest becomes your best employee.",
      action:"Channel savings into index funds or UITFs for growth."});
  } else {
    tips.push({type:"neutral",icon:"📊",title:`Savings Rate: ${(savingsRate*100).toFixed(0)}%`,
      body:"You're saving something — that's more than most. But the goal is 20%+. Even small increases compound dramatically over time.",
      action:"Target increasing your savings rate by 2% each cutoff."});
  }

  // Debt-to-income ratio
  if (debtRatio > 0.43) {
    tips.push({type:"critical",icon:"🔴",title:`Debt Load: ${(debtRatio*100).toFixed(0)}% of Income`,
      body:"Lenders consider above 43% a danger zone. High debt load limits your options — you can't invest aggressively when interest is eating your income. Total remaining debt: ₱"+fmt(totalDebt)+".",
      action:"Focus all extra income on the smallest loan first (debt snowball) or highest interest first (debt avalanche)."});
  } else if (debtRatio < 0.2) {
    tips.push({type:"good",icon:"✅",title:`Debt Load: Healthy at ${(debtRatio*100).toFixed(0)}%`,
      body:"Your debt payments are under control. This gives you room to invest. The wealthy minimize bad debt (consumer loans) and leverage good debt (assets that appreciate).",
      action:"Since debt is manageable, prioritize building your investment portfolio."});
  }

  // Snowball vs Avalanche
  if (loans.length >= 2) {
    const byBalance = [...loans].sort((a,b)=>(a.total-a.paid)-(b.total-b.paid));
    const byInterest = "Highest interest first (avalanche) saves more money. Smallest balance first (snowball) gives faster psychological wins.";
    tips.push({type:"info",icon:"⛄",title:"Debt Strategy: Snowball vs Avalanche",
      body:`You have ${loans.length} active loans. ${byInterest} Your smallest remaining balance is ${byBalance[0]?.name} (₱${fmt(byBalance[0]?.total-byBalance[0]?.paid)}). Pay minimums on all others and attack this one first.`,
      action:"Add ₱1,000–2,000 extra monthly to your target loan."});
  }

  // Investment check
  if (investTotal === 0) {
    tips.push({type:"info",icon:"📈",title:"No Investments Yet",
      body:"Here's the secret the wealthy know: your money should work harder than you do. In the Philippines, you can start with: UITF (₱1,000 min), MP2 (Pag-IBIG, 7% avg), FMETF (PSE index fund). Time in market beats timing the market.",
      action:"Open a UITF or MP2 account this month. Start with ₱500."});
  } else {
    const ratio = investTotal/totalIncome;
    tips.push({type:"good",icon:"📊",title:`Portfolio: ₱${fmt(investTotal)} — Keep Growing`,
      body:"You're investing — this is where wealth is built. Diversify: local equities (PSE), UITF bond funds for stability, MP2 for guaranteed returns, and US ETFs if available to you.",
      action:"Review asset allocation. Aim for a mix of growth (stocks) and stability (bonds)."});
  }

  // The 1% rule
  tips.push({type:"insight",icon:"💡",title:"The 1% Improvement Rule",
    body:"Improving your financial life by 1% each month — saving ₱500 more, spending ₱500 less — compounds to 12.7% better over a year. Wealth is built in unglamorous, consistent steps.",
    action:"What is one ₱500 expense you can eliminate this cutoff?"});

  // Lifestyle inflation warning
  tips.push({type:"insight",icon:"🎯",title:"Lifestyle Inflation Is Silent",
    body:"As income grows, expenses tend to grow with it. The wealthiest people keep their lifestyle constant while income rises, directing increases straight to investments. Every salary increase: 50% to savings/investment, 50% to lifestyle.",
    action:"Next time you get a raise, set up an auto-transfer for half of it before you get used to spending it."});

  // Net worth framing
  tips.push({type:"insight",icon:"🧠",title:"Think in Net Worth, Not Salary",
    body:"Your financial health isn't your income — it's Net Worth = Assets - Liabilities. Your assets: savings (₱"+fmt(totalSaved)+"), investments (₱"+fmt(investTotal)+"). Your liabilities: remaining debt (₱"+fmt(totalDebt)+"). Net worth today: ₱"+fmt(totalSaved+investTotal-totalDebt)+".",
    action:"Track this number monthly. Growing net worth = winning."});

  return tips;
}

// ── INVESTMENT OPTIONS GUIDE ──────────────────────────────────────────────────
const INVEST_GUIDE = [
  {id:"mp2",name:"Pag-IBIG MP2",risk:"Low",return:"6–7%",min:"₱500",liquidity:"5 years",
    desc:"Government-backed. Dividends are tax-free. Better than a time deposit. Perfect for Filipinos with Pag-IBIG membership.",
    pros:["Tax-free dividends","Government guaranteed","7%+ average returns"],
    cons:["5-year lock-in","Must be Pag-IBIG member","Not liquid"],
    tag:"🏛️ Gov't"},
  {id:"uitf",name:"UITF — Bond Fund",risk:"Low–Med",return:"4–7%",min:"₱1,000",liquidity:"T+3 days",
    desc:"Unit Investment Trust Fund. Managed by banks (BDO, BPI, Metrobank). Bond funds are conservative — good for 1–3 year goals.",
    pros:["Liquid","Professional management","Low minimum"],
    cons:["Not guaranteed","Fund management fee","Lower upside than equities"],
    tag:"🏦 Bank"},
  {id:"fmetf",name:"FMETF (PSE Index)",risk:"Medium",return:"8–12% avg",min:"~₱1,000",liquidity:"Market hours",
    desc:"First Metro Philippine Equity Exchange Traded Fund. Tracks the PSEi — you own a slice of the top 30 Philippine companies. Warren Buffett's favorite strategy: index funds.",
    pros:["Diversified instantly","Low cost","Long-term outperforms most funds"],
    cons:["Short-term volatile","Need a broker account","Market risk"],
    tag:"📊 Stocks"},
  {id:"stocks",name:"PSE Stocks",risk:"High",return:"Variable",min:"~₱5,000",liquidity:"Market hours",
    desc:"Direct stock ownership in Philippine companies. Higher risk, higher reward. Requires research. Start with blue chips: SM, Ayala, BDO, Globe.",
    pros:["Dividends + capital gains","Ownership stake","Unlimited upside"],
    cons:["High risk","Requires knowledge","Emotionally challenging"],
    tag:"📉 Direct"},
  {id:"crypto",name:"Crypto (BTC/ETH)",risk:"Very High",return:"Extreme variance",min:"₱500",liquidity:"24/7",
    desc:"Bitcoin and Ethereum. Highly volatile — can double or halve in weeks. Only allocate what you can afford to lose entirely. Never more than 5–10% of portfolio.",
    pros:["Potential high returns","24/7 liquid","Global currency"],
    cons:["Extreme volatility","No fundamental backing","Regulation risk"],
    tag:"⚡ High Risk"},
  {id:"realestate",name:"Real Estate",risk:"Low–Med",return:"6–12%",min:"₱100K+",liquidity:"Months",
    desc:"Philippine real estate has been one of the best long-term assets. REITs are a way to invest in real estate with just ₱1,000. AREIT, MREIT, DDMP listed on PSE.",
    pros:["Tangible asset","Rental income","Inflation hedge"],
    cons:["Illiquid","Large capital needed","Maintenance costs"],
    tag:"🏠 Property"},
];

// ── DEFAULTS ──────────────────────────────────────────────────────────────────
// Defaults start at 0 / blank
const DEF_CUTOFFS = {
  "15th":{ label:"15th Cutoff", income:0, items:[] },
  "30th":{ label:"30th Cutoff", income:0, items:[] },
};
const DEF_PAY = {"15th":{},"30th":{}};

// ── MONTH (bills per calendar month) ─────────────────────────────────────────
const getMonthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const monthLabel = (key) => {
  if(!key||!key.match(/^\d{4}-\d{2}$/)) return key||"";
  const [y,m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-PH",{month:"long",year:"numeric"});
};
const prevMonthKey = (key) => {
  const [y,m] = key.split("-").map(Number);
  if(m===1) return `${y-1}-12`;
  return `${y}-${String(m-1).padStart(2,"0")}`;
};
const nextMonthKey = (key) => {
  const [y,m] = key.split("-").map(Number);
  if(m===12) return `${y+1}-01`;
  return `${y}-${String(m+1).padStart(2,"0")}`;
};
function getPayForMonth(pay, monthKey) {
  if(!monthKey) return DEF_PAY;
  const m = pay[monthKey];
  if(m&&typeof m==="object"&&("15th" in m || "30th" in m)) return m;
  return DEF_PAY;
}
function migratePayToMonthKeyed(loaded) {
  if(!loaded||typeof loaded!=="object") return { [getMonthKey()]: DEF_PAY };
  const hasOld = "15th" in loaded && "30th" in loaded;
  const hasMonthKey = Object.keys(loaded).some(k=>/^\d{4}-\d{2}$/.test(k));
  if(hasOld&&!hasMonthKey) return { [getMonthKey()]: loaded };
  return loaded;
}

const DEF_LOANS = [];
const DEF_GOALS = [];
const DEF_INVEST = [];
// savings history: [{month:"Mar 2025", income, expenses, saved}]
const DEF_SAV_HIST = [];

// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div style={{background:C.card,borderRadius:18,padding:16,boxShadow:C.shadow,border:`1px solid ${C.border}`,...style}}>{children}</div>
);
const Row = ({label,children,mb=14}) => (
  <div style={{marginBottom:mb}}>
    <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
    {children}
  </div>
);
const Inp = ({label,...p}) => (
  <Row label={label} mb={p.mb||14}>
    <input {...p} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,
      padding:"12px 14px",color:C.text,fontSize:14,outline:"none",...p.style}}
      onFocus={e=>e.target.style.borderColor=C.blue}
      onBlur={e=>e.target.style.borderColor=C.border}/>
  </Row>
);
const ProgressBar = ({pct,color=C.green,h=8}) => (
  <div style={{background:C.border,borderRadius:99,height:h,overflow:"hidden"}}>
    <div style={{background:color,height:"100%",width:`${Math.min(pct*100,100)}%`,borderRadius:99,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
);
const Badge = ({label,color,bg}) => (
  <span style={{fontSize:10,background:bg||color+"22",color,padding:"3px 10px",borderRadius:20,fontWeight:700,textTransform:"uppercase",letterSpacing:.3,flexShrink:0,border:`1px solid ${color}44`}}>{label}</span>
);

const Modal = ({onClose,title,children}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()}
    style={{position:"fixed",inset:0,background:"rgba(13,27,75,.25)",display:"flex",
      alignItems:"flex-end",justifyContent:"center",zIndex:300,backdropFilter:"blur(8px)"}}>
    <div className="modal-enter" style={{width:"100%",maxWidth:430,background:C.card,
      borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",maxHeight:"90vh",overflowY:"auto",
      boxShadow:C.shadowMd,border:`1px solid ${C.border}`}}>
      <div style={{width:36,height:4,background:C.border,borderRadius:99,margin:"0 auto 20px"}}/>
      <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:18}}>{title}</div>
      {children}
    </div>
  </div>
);
const BtnPrimary = ({onClick,children,color=C.blue,style={}}) => (
  <button onClick={onClick} style={{width:"100%",padding:14,borderRadius:14,border:"none",
    background:color,color:"#fff",fontSize:14,fontWeight:700,...style}}>{children}</button>
);
const BtnSecondary = ({onClick,children}) => (
  <button onClick={onClick} style={{width:"100%",padding:13,borderRadius:14,border:`1.5px solid ${C.border}`,
    background:"transparent",color:C.muted,fontSize:14,fontWeight:600,marginBottom:10}}>{children}</button>
);
const ColorPicker = ({value,onChange}) => (
  <Row label="Color">
    <div style={{display:"flex",gap:10}}>
      {[C.green,C.blue,C.purple,C.red,C.yellow,C.orange].map(c=>(
        <button key={c} onClick={()=>onChange(c)} style={{width:32,height:32,borderRadius:"50%",background:c,
          border:`3px solid ${value===c?C.text:"transparent"}`}}/>
      ))}
    </div>
  </Row>
);

// ── MINI SPARKLINE ────────────────────────────────────────────────────────────
const Sparkline = ({data,color=C.green,width=80,height=30}) => {
  if(!data||data.length<2) return null;
  const max=Math.max(...data), min=Math.min(...data);
  const range=max-min||1;
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*width;
    const y=height-((v-min)/range)*(height-4)-2;
    return `${x},${y}`;
  }).join(" ");
  return(
    <svg width={width} height={height} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]}
        r={3} fill={color}/>
    </svg>
  );
};

// ── BAR CHART ────────────────────────────────────────────────────────────────
const BarChart = ({history}) => {
  if(!history||history.length===0) return <div style={{color:C.muted,textAlign:"center",padding:24,fontSize:13}}>Add monthly records to see your chart.</div>;
  const maxVal = Math.max(...history.flatMap(h=>[h.income,h.expenses]));
  const barW = Math.min(40, (320/(history.length*3+1)));
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={Math.max(320,history.length*90)} height={160} style={{display:"block"}}>
        {[0,.25,.5,.75,1].map(p=>(
          <g key={p}>
            <line x1={0} y1={130-p*110} x2={Math.max(320,history.length*90)} y2={130-p*110}
              stroke={C.border} strokeWidth={1} strokeDasharray="4,4"/>
            <text x={4} y={130-p*110-3} fill={C.muted} fontSize={9}>{fmtK(maxVal*p)}</text>
          </g>
        ))}
        {history.map((h,i)=>{
          const x=50+i*90;
          const iH=(h.income/maxVal)*110;
          const eH=(h.expenses/maxVal)*110;
          const sH=(Math.max(h.saved,0)/maxVal)*110;
          return(
            <g key={h.id}>
              <rect x={x} y={130-iH} width={barW} height={iH} rx={4} fill={C.blue}/>
              <rect x={x+barW+3} y={130-eH} width={barW} height={eH} rx={4} fill={C.red}/>
              <rect x={x+barW*2+6} y={130-sH} width={barW} height={sH} rx={4} fill={C.green}/>
              <text x={x+barW} y={148} textAnchor="middle" fill={C.muted} fontSize={9}>{h.month.replace(" 20","'")}</text>
            </g>
          );
        })}
        <rect x={50} y={155} width={8} height={8} rx={2} fill={C.blue}/>
        <text x={62} y={163} fill={C.muted} fontSize={9}>Income</text>
        <rect x={110} y={155} width={8} height={8} rx={2} fill={C.red}/>
        <text x={122} y={163} fill={C.muted} fontSize={9}>Expenses</text>
        <rect x={175} y={155} width={8} height={8} rx={2} fill={C.green}/>
        <text x={187} y={163} fill={C.muted} fontSize={9}>Saved</text>
      </svg>
    </div>
  );
};

// ── BRIEFING PROMPT ───────────────────────────────────────────────────────────
function buildPrompt(co,pay,loans,goals,invest,savHist) {
  const today=new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  const totalIncome=Object.values(co).reduce((s,c)=>s+c.income,0);
  const totalExp=Object.values(co).reduce((s,c)=>s+c.items.reduce((ss,i)=>ss+i.budget,0),0);
  const totalDebt=loans.reduce((s,l)=>s+Math.max(l.total-l.paid,0),0);
  const totalSaved=goals.reduce((s,g)=>s+g.current,0);
  const totalInvest=invest.reduce((s,i)=>s+i.currentValue,0);
  const lines=[`📋 CHIEF FINANCIAL BRIEFING — ${today}`,""];
  lines.push("━━ MONTHLY OVERVIEW ━━");
  lines.push(`  Gross Income:  ₱${fmt(totalIncome)}`);
  lines.push(`  Total Budgeted:₱${fmt(totalExp)}`);
  lines.push(`  Net Savings:   ₱${fmt(totalIncome-totalExp)} (${((totalIncome-totalExp)/totalIncome*100).toFixed(1)}% savings rate)`,"");
  lines.push("━━ CUTOFFS ━━");
  Object.entries(co).forEach(([key,c])=>{
    const p=pay[key]||{};
    const budget=c.items.reduce((s,i)=>s+i.budget,0);
    const paidI=c.items.filter(i=>p[i.id]?.done);
    lines.push(`  ${c.label}: Income ₱${fmt(c.income)} | Budget ₱${fmt(budget)} | ${paidI.length}/${c.items.length} paid`);
    const unpaid=c.items.filter(i=>!p[i.id]?.done);
    if(unpaid.length) lines.push(`    Unpaid: ${unpaid.map(i=>i.name+" ₱"+fmt(i.budget)).join(", ")}`);
  });
  lines.push("");
  lines.push("━━ LOANS ━━");
  loans.forEach(l=>{
    const rem=l.total-l.paid;
    const mLeft=Math.ceil(rem/l.monthly);
    const fd=new Date(); fd.setMonth(fd.getMonth()+mLeft);
    lines.push(`  ${l.name}: ${(l.paid/l.total*100).toFixed(0)}% paid | ₱${fmt(rem)} left | Freedom: ${fd.toLocaleDateString("en-PH",{month:"short",year:"numeric"})}`);
  });
  lines.push(`  Total Debt Remaining: ₱${fmt(totalDebt)}`,"");
  lines.push("━━ SAVINGS GOALS ━━");
  goals.forEach(g=>lines.push(`  ${g.icon} ${g.name}: ₱${fmt(g.current)} / ₱${fmt(g.target)} (${(g.current/g.target*100).toFixed(0)}%)`));
  lines.push(`  Total Saved: ₱${fmt(totalSaved)}`,"");
  lines.push("━━ INVESTMENTS ━━");
  if(invest.length) invest.forEach(i=>lines.push(`  ${i.name}: Invested ₱${fmt(i.invested)} | Now ₱${fmt(i.currentValue)} (${i.invested>0?((i.currentValue-i.invested)/i.invested*100).toFixed(1):0}%)`));
  else lines.push("  No investments tracked yet.");
  lines.push(`  Total Portfolio: ₱${fmt(totalInvest)}`,"");
  if(savHist.length) {
    lines.push("━━ RECENT MONTHS ━━");
    savHist.slice(-3).forEach(h=>lines.push(`  ${h.month}: Income ₱${fmt(h.income)} | Spent ₱${fmt(h.expenses)} | Saved ₱${fmt(h.saved)}`));
    lines.push("");
  }
  lines.push("━━ NET WORTH SNAPSHOT ━━");
  lines.push(`  Assets: ₱${fmt(totalSaved+totalInvest)}`);
  lines.push(`  Liabilities: ₱${fmt(totalDebt)}`);
  lines.push(`  Net Worth: ₱${fmt(totalSaved+totalInvest-totalDebt)}`,"");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("Based on this data, please:");
  lines.push("1. Give me a complete financial health assessment");
  lines.push("2. What should I prioritize in the next 30 days?");
  lines.push("3. Is my savings rate healthy for my situation?");
  lines.push("4. What debt should I attack first and how?");
  lines.push("5. Am I ready to invest more aggressively?");
  lines.push("6. What's one thing I'm likely missing that could improve my finances?");
  return lines.join("\n");
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const viewport = useViewport();
  const [unlocked, setUnlocked] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [tab,setTab]     = useState("home");
  const [co,setCo]       = useState(()=>load("cutoffs",DEF_CUTOFFS));
  const [pay,setPay]     = useState(()=>migratePayToMonthKeyed(load("payments",null))||{[getMonthKey()]:DEF_PAY});
  const [loans,setLoans] = useState(()=>load("loans",DEF_LOANS));
  const [goals,setGoals] = useState(()=>load("goals",DEF_GOALS));
  const [invest,setInvest]= useState(()=>load("invest",DEF_INVEST));
  const [savHist,setSavHist]=useState(()=>load("savhist",DEF_SAV_HIST));
  const [coTab,setCoTab] = useState("15th");
  const [billMonth,setBillMonth] = useState(()=>getMonthKey());
  const [confirmNextMonth,setConfirmNextMonth] = useState(null); // { fromMonthKey } when asking "done with this month?"
  const [tipsOpen,setTipsOpen]=useState(false);
  const [activeTip,setActiveTip]=useState(null);
  const [copied,setCopied]=useState(false);
  const [briefing,setBriefing]=useState(false);

  // Modals
  const [paidModal,setPaidModal]=useState(null);
  const [paidAmt,setPaidAmt]=useState("");
  const [paidDate,setPaidDate]=useState(new Date().toISOString().split("T")[0]);
  const [editIncome,setEditIncome]=useState(null);
  const [incomeVal,setIncomeVal]=useState("");
  const [billModal,setBillModal]=useState(null);
  const [billForm,setBillForm]=useState({});
  const [loanModal,setLoanModal]=useState(null);
  const [loanForm,setLoanForm]=useState({});
  const [goalModal,setGoalModal]=useState(null);
  const [goalForm,setGoalForm]=useState({});
  const [investModal,setInvestModal]=useState(null);
  const [investForm,setInvestForm]=useState({});
  const [histModal,setHistModal]=useState(false);
  const [histForm,setHistForm]=useState({month:"",income:"",expenses:"",saved:""});
  const [monthlyReportOpen,setMonthlyReportOpen]=useState(false);
  const [monthlyReportCopied,setMonthlyReportCopied]=useState(false);
  const [importConfirm,setImportConfirm]=useState(null); // { data } when file loaded, confirm before apply
  const [tutorialOpen,setTutorialOpen]=useState(false);
  const [tutorialStep,setTutorialStep]=useState(0);
  const [guideItem,setGuideItem]=useState(null);
  const [updateLoan,setUpdateLoan]=useState(null);
  const importInputRef = useRef(null);

  // Local auth readiness (no network)
  useEffect(() => {
    setAuthReady(true);
  }, []);

  // First-time tutorial (local)
  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARD_KEY) === "1";
      if (!seen) setTutorialOpen(true);
    } catch {}
  }, []);

  useEffect(()=>save("cutoffs",co),[co]);
  useEffect(()=>save("payments",pay),[pay]);
  useEffect(()=>save("loans",loans),[loans]);
  useEffect(()=>save("goals",goals),[goals]);
  useEffect(()=>save("invest",invest),[invest]);
  useEffect(()=>save("savhist",savHist),[savHist]);

  const currentMonthPay = getPayForMonth(pay, getMonthKey());
  const tips = useMemo(()=>generateTips(co,currentMonthPay,loans,goals,invest,savHist),[co,pay,loans,goals,invest,savHist]);

  const stats = (key, monthKey) => {
    const monthPay = getPayForMonth(pay, monthKey ?? getMonthKey());
    const c=co[key]; const p=monthPay[key]||{};
    const budget=c.items.reduce((s,i)=>s+i.budget,0);
    const paidI=c.items.filter(i=>p[i.id]?.done);
    const paidTot=paidI.reduce((s,i)=>s+(p[i.id]?.amount||i.budget),0);
    return {budget,paidTot,done:paidI.length,total:c.items.length,balance:c.income-budget};
  };
  const s15=stats("15th"), s30=stats("30th");
  const totalIncome=co["15th"].income+co["30th"].income;
  const totalExpenses=s15.budget+s30.budget;
  const totalDebt=loans.reduce((s,l)=>s+Math.max(l.total-l.paid,0),0);
  const totalSaved=goals.reduce((s,g)=>s+g.current,0);
  const totalInvest=invest.reduce((s,i)=>s+i.currentValue,0);
  const netWorth=totalSaved+totalInvest-totalDebt;
  const promptText=buildPrompt(co,currentMonthPay,loans,goals,invest,savHist);
  const savRate=((totalIncome-totalExpenses)/totalIncome*100).toFixed(1);

  // ── MARK PAID — with auto-sync (uses billMonth) ─────────────────────────────
  const markPaid = () => {
    if(!paidModal) return;
    const {key,item} = paidModal;
    const amount = parseFloat(paidAmt)||item.budget;
    const monthKey = billMonth;
    const monthPay = getPayForMonth(pay, monthKey);
    setPay(prev=>({...prev,[monthKey]:{...monthPay,[key]:{...monthPay[key],[item.id]:{done:true,amount,date:paidDate}}}}));
    if(item.cat==="loan" && item.loanLink) {
      setLoans(p=>p.map(l=>l.id===item.loanLink?{...l,paid:Math.min(l.paid+amount,l.total)}:l));
    }
    if(item.cat==="savings" && item.goalLink) {
      setGoals(p=>p.map(g=>g.id===item.goalLink?{...g,current:g.current+amount}:g));
    }
    setPaidModal(null);
  };

  const unmark = (key,id) => {
    const monthPay = getPayForMonth(pay, billMonth);
    const paidRecord = monthPay[key]?.[id];
    const item = co[key].items.find(i=>i.id===id);
    if(item&&paidRecord) {
      if(item.cat==="loan"&&item.loanLink) {
        setLoans(p=>p.map(l=>l.id===item.loanLink?{...l,paid:Math.max(l.paid-(paidRecord.amount||item.budget),0)}:l));
      }
      if(item.cat==="savings"&&item.goalLink) {
        setGoals(p=>p.map(g=>g.id===item.goalLink?{...g,current:Math.max(g.current-(paidRecord.amount||item.budget),0)}:g));
      }
    }
    const nextMonthPay = {...monthPay,[key]:{...monthPay[key],[id]:{done:false}}};
    setPay(prev=>({...prev,[billMonth]:nextMonthPay}));
  };

  const saveBill = () => {
    if(!billForm.name||!billForm.budget) return;
    const {mode,key}=billModal;
    const item={...billForm,budget:parseFloat(billForm.budget)};
    if(mode==="edit") setCo(p=>({...p,[key]:{...p[key],items:p[key].items.map(i=>i.id===item.id?item:i)}}));
    else setCo(p=>({...p,[key]:{...p[key],items:[...p[key].items,{...item,id:uid()}]}}));
    setBillModal(null);
  };
  const deleteBill=(key,id)=>{
    setCo(p=>({...p,[key]:{...p[key],items:p[key].items.filter(i=>i.id!==id)}}));
    const monthPay = getPayForMonth(pay, billMonth);
    const nextCutoff = {...monthPay[key]}; delete nextCutoff[id];
    setPay(prev=>({...prev,[billMonth]:{...monthPay,[key]:nextCutoff}}));
  };
  const saveLoan=()=>{
    if(!loanForm.name||!loanForm.total)return;
    const l={...loanForm,total:parseFloat(loanForm.total),monthly:parseFloat(loanForm.monthly),paid:parseFloat(loanForm.paid)||0};
    if(l.id)setLoans(p=>p.map(x=>x.id===l.id?l:x));
    else setLoans(p=>[...p,{...l,id:uid()}]);
    setLoanModal(null);
  };
  const saveGoal=()=>{
    if(!goalForm.name||!goalForm.target)return;
    const g={...goalForm,target:parseFloat(goalForm.target),current:parseFloat(goalForm.current)||0};
    if(g.id)setGoals(p=>p.map(x=>x.id===g.id?g:x));
    else setGoals(p=>[...p,{...g,id:uid()}]);
    setGoalModal(null);
  };
  const saveInvest=()=>{
    if(!investForm.name||!investForm.invested)return;
    const i={...investForm,invested:parseFloat(investForm.invested),currentValue:parseFloat(investForm.currentValue)||parseFloat(investForm.invested)};
    if(i.id)setInvest(p=>p.map(x=>x.id===i.id?i:x));
    else setInvest(p=>[...p,{...i,id:uid()}]);
    setInvestModal(null);
  };
  const saveHist=()=>{
    if(!histForm.month||!histForm.income)return;
    const inc=parseFloat(histForm.income);
    const exp=parseFloat(histForm.expenses)||0;
    const sav=parseFloat(histForm.saved)||(inc-exp);
    setSavHist(p=>[...p,{id:uid(),month:histForm.month,income:inc,expenses:exp,saved:sav}].sort((a,b)=>a.month.localeCompare(b.month)));
    setHistModal(false);setHistForm({month:"",income:"",expenses:"",saved:""});
  };

  // ── MONTHLY REPORT (generate after financial responsibilities) ─────────────
  const buildMonthlyReport = () => {
    const monthKey = getMonthKey();
    const s15cur = stats("15th", monthKey), s30cur = stats("30th", monthKey);
    const income = totalIncome;
    const expensesPaid = s15cur.paidTot + s30cur.paidTot;
    const saved = income - expensesPaid;
    const monthName = new Date().toLocaleDateString("en-PH", { month: "long", year: "numeric" });
    const billsDone = s15cur.done + s30cur.done;
    const billsTotal = s15cur.total + s30cur.total;
    const lines = [
      `📋 MONTHLY REPORT — ${monthName}`,
      `Generated ${new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
      "",
      "━━ INCOME & SPENDING ━━",
      `  Income (15th + 30th):     ₱${fmt(income)}`,
      `  Actually paid (bills):   ₱${fmt(expensesPaid)}`,
      `  Saved this month:        ₱${fmt(saved)} (${income ? (saved/income*100).toFixed(1) : 0}% of income)`,
      "",
      "━━ BILLS STATUS ━━",
      `  ${billsDone} of ${billsTotal} items marked paid`,
      billsDone >= billsTotal ? "  ✅ All responsibilities recorded." : "  ⏳ Some items not yet marked paid.",
      "",
      "━━ SNAPSHOT ━━",
      `  Total in savings goals:  ₱${fmt(totalSaved)}`,
      `  Total invested:           ₱${fmt(totalInvest)}`,
      `  Debt remaining:           ₱${fmt(totalDebt)}`,
      `  Net worth:                ₱${fmt(totalSaved + totalInvest - totalDebt)}`,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ];
    return {
      monthName,
      income,
      expenses: expensesPaid,
      saved,
      reportText: lines.join("\n"),
      billsDone,
      billsTotal,
    };
  };
  const addCurrentMonthToHistory = () => {
    const r = buildMonthlyReport();
    const existing = savHist.find(h => h.month === r.monthName);
    if (existing) {
      setSavHist(prev => prev.map(h => h.month === r.monthName ? { ...h, income: r.income, expenses: r.expenses, saved: r.saved } : h));
    } else {
      setSavHist(prev => [...prev, { id: uid(), month: r.monthName, income: r.income, expenses: r.expenses, saved: r.saved }].sort((a, b) => a.month.localeCompare(b.month)));
    }
    setMonthlyReportOpen(false);
  };

  // ── EXPORT / IMPORT (backup & restore across devices) ────────────────────────
  const EXPORT_VERSION = 1;
  const exportData = () => {
    const blob = {
      version: EXPORT_VERSION,
      app: "KinsenasApp",
      exportedAt: new Date().toISOString(),
      cutoffs: co,
      payments: pay,
      loans: loans,
      goals: goals,
      invest: invest,
      savhist: savHist,
    };
    const str = JSON.stringify(blob, null, 2);
    const blobObj = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blobObj);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kinsenasapp-backup-${getMonthKey()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const isValidImport = (d) => d && typeof d === "object" && (d.cutoffs != null || d.payments != null);
  const handleImportFile = (e) => {
    const file = e.target?.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!isValidImport(data)) {
          alert("Invalid backup file. Need at least cutoffs or payments.");
          return;
        }
        setImportConfirm({ data });
      } catch (err) {
        alert("Could not read file. Use a KinsenasApp backup .json file.");
      }
    };
    reader.readAsText(file);
  };
  const applyImport = () => {
    if (!importConfirm?.data) return;
    const d = importConfirm.data;
    if (d.cutoffs != null) setCo(d.cutoffs);
    if (d.payments != null) setPay(migratePayToMonthKeyed(d.payments) || { [getMonthKey()]: DEF_PAY });
    if (d.loans != null) setLoans(d.loans);
    if (d.goals != null) setGoals(d.goals);
    if (d.invest != null) setInvest(d.invest);
    if (d.savhist != null) setSavHist(d.savhist);
    setImportConfirm(null);
  };

  const resetToDefaults = () => {
    // Clear finance-related local storage + reset state
    try {
      localStorage.removeItem(NS+"cutoffs");
      localStorage.removeItem(NS+"payments");
      localStorage.removeItem(NS+"loans");
      localStorage.removeItem(NS+"goals");
      localStorage.removeItem(NS+"invest");
      localStorage.removeItem(NS+"savhist");
    } catch {}

    setCo(DEF_CUTOFFS);
    setPay({ [getMonthKey()]: DEF_PAY });
    setLoans(DEF_LOANS);
    setGoals(DEF_GOALS);
    setInvest(DEF_INVEST);
    setSavHist(DEF_SAV_HIST);
    setBillMonth(getMonthKey());
    setCoTab("15th");
    setTab("home");
  };

  const copyPrompt=()=>{
    navigator.clipboard?.writeText(promptText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500)});
  };

  const tipColor = t => ({critical:C.red,urgent:C.orange,good:C.green,info:C.blue,insight:C.purple,neutral:C.muted}[t]||C.muted);

  const criticalTips = tips.filter(t=>t.type==="critical"||t.type==="urgent").length;

  // ── RENDER (responsive: mobile full width; iPad/desktop same centered card) ──
  const appMaxWidth = viewport.isMobile ? "100%" : 460;

  if (!authReady) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
        Loading…
      </div>
    );
  }
  if (!unlocked) {
    return <LocalAuthScreen onUnlocked={()=>setUnlocked(true)} />;
  }

  return (
    <div className="app-root" style={{
      width:"100%",maxWidth:appMaxWidth,margin:"0 auto",minHeight:"100vh",height:"100vh",display:"flex",flexDirection:"column",
      background:C.bg,overflow:"hidden",position:"relative",
      ...(viewport.isLarge && {boxShadow:"0 0 0 1px rgba(0,0,0,.06), 0 24px 48px rgba(0,0,0,.08)",borderRadius:12}),
    }}>

      {/* Header — time | KinsenasApp | date */}
      <div style={{background:C.card,padding:"14px 20px 12px",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderBottom:`1px solid ${C.border}`,flexShrink:0,position:"sticky",top:0,zIndex:10,boxShadow:C.shadow}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text}}>
          {new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}
        </div>
        <div style={{fontSize:16,fontWeight:700,color:C.text,letterSpacing:1,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:20,display:"inline-block",filter:"sepia(1) saturate(4) hue-rotate(15deg)"}}>⚡</span> KinsenasApp
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted}}>
            {new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric"})}
          </div>
          {!!localStorage.getItem(AUTH_HASH_KEY) && (
            <button onClick={()=>setUnlocked(false)} style={{background:C.card2,border:`1.5px solid ${C.border}`,
              borderRadius:20,padding:"6px 10px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12}}>🔒</span>
              <span style={{fontSize:11,fontWeight:700,color:C.muted}}>Lock</span>
            </button>
          )}
          <button onClick={()=>setTipsOpen(true)} style={{background:criticalTips>0?C.redSoft:C.bg,border:`1.5px solid ${criticalTips>0?C.red:C.border}`,
            borderRadius:20,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12}}>💡</span>
            <span style={{fontSize:11,fontWeight:700,color:criticalTips>0?C.red:C.muted}}>Tips</span>
            {criticalTips>0&&<span style={{background:C.red,color:"#fff",borderRadius:"50%",width:16,height:16,
              fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{criticalTips}</span>}
          </button>
        </div>
      </div>

      {/* Scroll */}
      <div style={{flex:1,overflowY:"auto",background:C.bg}}>
        <div style={{padding:"0 16px 100px"}}>

          {/* ═══════ HOME ═══════ */}
          {tab==="home"&&(
            <div className="anim">
              <div style={{padding:"20px 0 16px"}}>
                <div style={{fontSize:12,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
                  {new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
                </div>
                <div style={{fontSize:26,fontWeight:800,color:C.text,marginTop:6,lineHeight:1.2}}>
                  {(()=>{const h=new Date().getHours(); const msg=h<12?"Good morning!":h<17?"Good afternoon!":"Good evening!"; const emoji=h<12?"☀️":h<17?"🌤":"🌙"; return <>{msg} <span style={{fontSize:22}}>{emoji}</span></>;})()}
                </div>
              </div>

              {/* Ask Chief — vibrant blue card */}
              <button onClick={()=>setBriefing(true)} style={{width:"100%",background:C.blue,border:"none",
                borderRadius:18,padding:20,marginBottom:16,textAlign:"left",display:"flex",flexDirection:"column",gap:10,boxShadow:C.shadowMd}}>
                <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.9)",letterSpacing:1}}>⚡ ASK CHIEF</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.95)",lineHeight:1.4}}>Tap to generate your full briefing prompt — copy it and paste into Claude for a complete analysis.</div>
                <div style={{background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 16px",alignSelf:"flex-start",fontSize:14,fontWeight:700,color:"#fff"}}>Generate Briefing →</div>
              </button>

              {/* 4-grid — light pastel cards like reference */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[
                  {l:"Monthly Income", v:`₱${fmt(totalIncome)}`,  icon:"💰", bg:C.greenSoft,  c:C.green},
                  {l:"Monthly Bills",  v:`₱${fmt(totalExpenses)}`, icon:"📋", bg:C.card,       c:C.text, border:true},
                  {l:"Net Savings",    v:`₱${fmt(totalIncome-totalExpenses)}`, icon:"🏦", bg:C.purpleSoft, c:C.purple},
                  {l:"Tasks Open",     v:`${(s15.total-s15.done)+(s30.total-s30.done)} items`, icon:"✅", bg:C.yellowSoft, c:C.yellow},
                ].map((s,i)=>(
                  <div key={i} style={{background:s.bg,borderRadius:18,padding:16,boxShadow:s.border?C.shadow:"none",border:`1px solid ${s.border?C.border:"transparent"}`}}>
                    <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
                    <div style={{fontSize:20,fontWeight:800,color:s.c,fontFamily:"'DM Sans',sans-serif"}}>{s.v}</div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:600,marginTop:4}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Cutoff progress */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:18}}>📅</span>
                <span style={{fontSize:13,fontWeight:700,color:C.muted,letterSpacing:.5}}>Cutoff Progress</span>
              </div>
              {[{key:"15th",s:s15},{key:"30th",s:s30}].map(({key,s})=>(
                <Card key={key} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontWeight:700,color:C.text,fontSize:14}}>{co[key].label}</span>
                    <span style={{fontSize:12,color:C.green,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{s.done}/{s.total} paid</span>
                  </div>
                  <ProgressBar pct={s.done/s.total}/>
                  <div style={{fontSize:12,color:C.muted,marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>
                    Budget ₱{fmt(s.budget)} · Balance <span style={{color:C.green}}>₱{fmt(s.balance)}</span>
                  </div>
                </Card>
              ))}

              {/* Loans quick */}
              <div style={{fontSize:13,fontWeight:700,color:C.muted,margin:"16px 0 10px",letterSpacing:.5}}>📊 Loans Snapshot</div>
              {loans.map(l=>{
                const pct=l.paid/l.total;
                const mLeft=Math.max(0,Math.ceil((l.total-l.paid)/l.monthly));
                const fd=new Date(); fd.setMonth(fd.getMonth()+mLeft);
                return(
                  <Card key={l.id} style={{marginBottom:10,borderLeft:`4px solid ${l.color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:C.text}}>{l.name}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
                          {mLeft} months left · Freedom: {fd.toLocaleDateString("en-PH",{month:"long",year:"numeric"})}
                        </div>
                      </div>
                      <div style={{background:l.color+"22",borderRadius:12,padding:"6px 12px",textAlign:"center"}}>
                        <div style={{fontSize:16,fontWeight:800,color:l.color,fontFamily:"'DM Sans',sans-serif"}}>{Math.round(pct*100)}%</div>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={l.color} h={6}/>
                  </Card>
                );
              })}

              {/* Goals quick */}
              <div style={{fontSize:13,fontWeight:700,color:C.muted,margin:"16px 0 10px",letterSpacing:.5}}>💰 Savings Goals</div>
              {goals.map(g=>(
                <Card key={g.id} style={{marginBottom:10,borderLeft:`4px solid ${g.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:20}}>{g.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:C.text}}>{g.name}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>₱{fmt(g.current)} / ₱{fmt(g.target)}</div>
                      </div>
                    </div>
                    <div style={{color:g.color,fontWeight:800,fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>{Math.round(g.current/g.target*100)}%</div>
                  </div>
                  <ProgressBar pct={g.current/g.target} color={g.color} h={5}/>
                </Card>
              ))}

              {/* Backup & restore — export / import for Mac, phone, etc. */}
              <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                <div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:10,letterSpacing:.5}}>📦 Backup & restore</div>
                <p style={{fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.4}}>Export or import your data to use Chief on another device (e.g. MacBook ↔ phone).</p>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={exportData} style={{flex:1,padding:12,borderRadius:14,border:`1.5px solid ${C.blue}`,background:C.blueSoft,color:C.blue,fontSize:13,fontWeight:700}}>Export data</button>
                  <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} style={{display:"none"}} />
                  <button onClick={()=>importInputRef.current?.click()} style={{flex:1,padding:12,borderRadius:14,border:`1.5px solid ${C.green}`,background:C.greenSoft,color:C.green,fontSize:13,fontWeight:700}}>Import data</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ BILLS & PAYMENTS (screenshot style) ═══════ */}
          {tab==="bills"&&(
            <div className="anim" style={{paddingTop:20}}>
              <div style={{fontSize:24,fontWeight:800,color:C.text,marginBottom:4}}>Bills & Payments</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Tap ✓ to mark paid · ✏️ to edit · × to delete</div>

              {/* Month selector */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <button onClick={()=>setBillMonth(prevMonthKey(billMonth))} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:600,color:C.text,boxShadow:C.shadow}}>← Prev</button>
                <div style={{fontSize:14,fontWeight:700,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>{monthLabel(billMonth)}</div>
                <button onClick={()=>setConfirmNextMonth({fromMonthKey:billMonth})} style={{background:C.blue,border:"none",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:600,color:"#fff",boxShadow:C.shadow}}>Next →</button>
              </div>

              {/* Cutoff selector — pill buttons */}
              <div style={{display:"flex",background:C.card,borderRadius:14,padding:4,marginBottom:16,border:`1px solid ${C.border}`,boxShadow:C.shadow}}>
                {["15th","30th"].map(k=>(
                  <button key={k} onClick={()=>setCoTab(k)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",
                    background:coTab===k?C.blue:"transparent",color:coTab===k?"#fff":C.muted,
                    fontSize:14,fontWeight:700,transition:"all .2s"}}>{k} Cutoff</button>
                ))}
              </div>

              {(()=>{
                const monthPay = getPayForMonth(pay, billMonth);
                const c=co[coTab]; const p=monthPay[coTab]||{}; const s=stats(coTab, billMonth);
                return(<>
                  {/* Salary card — solid blue, white text (screenshot) */}
                  <div style={{background:C.blue,borderRadius:18,padding:20,marginBottom:16,boxShadow:C.shadowMd}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.9)",letterSpacing:1,fontFamily:"'DM Sans',sans-serif"}}>SALARY IN</div>
                        <div style={{fontSize:28,fontWeight:800,color:"#fff",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>₱{fmt(c.income)}</div>
                      </div>
                      <button onClick={()=>{setEditIncome(coTab);setIncomeVal(c.income.toString())}}
                        style={{background:"rgba(255,255,255,.25)",border:"none",borderRadius:20,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:600}}>✏️ Edit</button>
                    </div>
                    <div style={{display:"flex",gap:20,marginTop:18}}>
                      {[{l:"BUDGET",v:`₱${fmt(s.budget)}`},{l:"PAID",v:`₱${fmt(s.paidTot)}`},{l:"BALANCE",v:`₱${fmt(s.balance)}`}].map((x,i)=>(
                        <div key={i}>
                          <div style={{fontSize:9,color:"rgba(255,255,255,.85)",fontFamily:"'DM Sans',sans-serif"}}>{x.l}</div>
                          <div style={{fontSize:14,fontWeight:700,color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>{x.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"rgba(255,255,255,.25)",borderRadius:99,height:6,marginTop:14,overflow:"hidden"}}>
                      <div style={{background:"#fff",height:"100%",width:`${(s.done/s.total)*100}%`,borderRadius:99,transition:"width .5s"}}/>
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,.9)",marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>{s.done} of {s.total} items paid</div>
                  </div>

                  {/* Bill items — white cards, hollow circle, yellow pencil, red × */}
                  {c.items.map(item=>{
                    const pd=p[item.id];
                    const linkedLoan  = item.loanLink?loans.find(l=>l.id===item.loanLink):null;
                    const linkedGoal  = item.goalLink?goals.find(g=>g.id===item.goalLink):null;
                    return(
                      <div key={item.id} style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:10,
                        border:`1px solid ${C.border}`,boxShadow:C.shadow}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div onClick={()=>{
                            if(pd?.done)unmark(coTab,item.id);
                            else{setPaidModal({key:coTab,item});setPaidAmt(item.budget.toString());setPaidDate(new Date().toISOString().split("T")[0])}
                          }} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${pd?.done?C.green:C.border}`,
                            background:pd?.done?C.green:"transparent",display:"flex",alignItems:"center",
                            justifyContent:"center",flexShrink:0,cursor:"pointer"}}>
                            {pd?.done&&<span style={{fontSize:14,color:"#fff",fontWeight:800}}>✓</span>}
                          </div>
                          <span style={{fontSize:18}}>{catIco(item.cat)}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                            {pd?.done&&<div style={{fontSize:10,color:C.green,fontFamily:"'DM Sans',sans-serif"}}>✓ ₱{fmt(pd.amount)} · {pd.date}</div>}
                            {(linkedLoan||linkedGoal)&&!pd?.done&&<div style={{fontSize:10,color:C.blue}}>🔗 → {linkedLoan?linkedLoan.name:linkedGoal?.name}</div>}
                            {(linkedLoan||linkedGoal)&&pd?.done&&<div style={{fontSize:10,color:C.green}}>✅ synced</div>}
                          </div>
                          <div style={{fontWeight:700,fontSize:14,color:C.text,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>₱{fmt(item.budget)}</div>
                          <button onClick={()=>{setBillModal({mode:"edit",key:coTab});setBillForm({...item,budget:item.budget.toString()})}}
                            style={{background:"transparent",border:"none",borderRadius:8,width:32,height:32,fontSize:16,flexShrink:0,padding:0}} title="Edit">✏️</button>
                          <button onClick={()=>deleteBill(coTab,item.id)}
                            style={{background:"transparent",border:"none",borderRadius:8,width:32,height:32,fontSize:16,color:C.red,flexShrink:0,padding:0,fontWeight:700}} title="Delete">×</button>
                        </div>
                      </div>
                    );
                  })}

                  <button onClick={()=>{setBillModal({mode:"add",key:coTab});setBillForm({name:"",budget:"",cat:"expense"})}}
                    style={{width:"100%",padding:14,borderRadius:16,border:`2px dashed ${C.border}`,
                      background:"transparent",color:C.blue,fontSize:14,fontWeight:700,marginBottom:16}}>+ Add Bill / Item</button>

                  {/* Total row */}
                  <div style={{background:C.card2,borderRadius:16,padding:"14px 20px",display:"flex",justifyContent:"space-between",
                    border:`1px solid ${C.border}`,marginBottom:14}}>
                    <span style={{color:C.text,fontWeight:800,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>TOTAL</span>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:C.text,fontWeight:800,fontSize:18,fontFamily:"'DM Sans',sans-serif"}}>₱{fmt(s.budget)}</div>
                      <div style={{color:C.muted,fontSize:10}}>{s.done}/{s.total} done</div>
                    </div>
                  </div>

                  {/* Savings summary — light (for this month) */}
                  {(()=>{
                    const s15m=stats("15th",billMonth), s30m=stats("30th",billMonth);
                    return (
                    <div style={{background:C.greenSoft,borderRadius:18,padding:18,border:`1px solid ${C.green}33`,boxShadow:C.shadow}}>
                    <div style={{fontSize:12,fontWeight:800,color:C.green,marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>CUTOFF SUMMARY — {monthLabel(billMonth)}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[
                        {l:"15th Net",  v:fmtK(co["15th"].income-s15m.budget)},
                        {l:"30th Net",  v:fmtK(co["30th"].income-s30m.budget)},
                        {l:"Monthly Net",v:fmtK(totalIncome-totalExpenses)},
                      ].map((r,i)=>(
                        <div key={i} style={{background:C.card,borderRadius:12,padding:"10px 12px",textAlign:"center",border:`1px solid ${C.border}`,boxShadow:C.shadow}}>
                          <div style={{fontSize:9,color:C.muted}}>{r.l}</div>
                          <div style={{fontSize:14,fontWeight:700,color:C.green,fontFamily:"'DM Sans',sans-serif"}}>{r.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                    );
                  })()}
                </>);
              })()}
            </div>
          )}

          {/* ═══════ SAVINGS ═══════ */}
          {tab==="savings"&&(
            <div className="anim" style={{paddingTop:20}}>
              <div style={{fontSize:24,fontWeight:800,color:C.text,marginBottom:4}}>Savings</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Track goals and see how your finances grow over time</div>

              {/* Generate monthly report — tap after financial responsibilities */}
              <button onClick={()=>setMonthlyReportOpen(true)} style={{width:"100%",background:C.blue,border:"none",borderRadius:18,padding:18,marginBottom:16,textAlign:"left",boxShadow:C.shadowMd}}>
                <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.9)",letterSpacing:.5,marginBottom:4}}>📋 MONTHLY REPORT</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.95)",lineHeight:1.4}}>Generate your monthly summary. Best used after you’ve done all bills and financial responsibilities for the month.</div>
                <div style={{marginTop:10,fontSize:13,fontWeight:600,color:"rgba(255,255,255,.85)"}}>Generate report →</div>
              </button>

              {/* Savings goals */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:C.muted,letterSpacing:.5}}>GOALS</div>
                <button onClick={()=>{setGoalModal("new");setGoalForm({name:"",target:"",current:"0",icon:"🎯",color:C.green})}}
                  style={{background:C.blue,border:"none",borderRadius:20,padding:"7px 16px",color:"#fff",fontSize:12,fontWeight:700}}>+ Add Goal</button>
              </div>

              {/* Total saved */}
              <Card style={{marginBottom:14,border:`1px solid ${C.green}33`,background:C.greenSoft}}>
                <div style={{fontSize:11,color:C.green,letterSpacing:1,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>TOTAL SAVED</div>
                <div style={{fontSize:32,fontWeight:800,color:C.green,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>₱{fmt(totalSaved)}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>across {goals.length} goals</div>
              </Card>

              {goals.map(g=>{
                const pct=Math.min(g.current/g.target,1);
                const left=g.target-g.current;
                const monthlySav=totalIncome-totalExpenses;
                const mToGoal=left>0&&monthlySav>0?Math.ceil(left/monthlySav):0;
                return(
                  <Card key={g.id} style={{marginBottom:12,border:`1px solid ${g.color}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:26}}>{g.icon}</span>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'DM Sans',sans-serif"}}>{g.name}</div>
                          <div style={{fontSize:12,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>₱{fmt(g.current)} / ₱{fmt(g.target)}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <div style={{background:g.color+"22",borderRadius:10,padding:"5px 10px",
                          fontSize:13,fontWeight:800,color:g.color,fontFamily:"'DM Sans',sans-serif"}}>{Math.round(pct*100)}%</div>
                        <button onClick={()=>{setGoalModal(g.id);setGoalForm({...g,target:g.target.toString(),current:g.current.toString()})}}
                          style={{background:C.card2,border:"none",borderRadius:10,width:30,height:30,fontSize:13}}>✏️</button>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={g.color} h={10}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
                      <div style={{fontSize:11,color:C.muted}}>₱{fmt(left)} to go</div>
                      {mToGoal>0&&<div style={{fontSize:11,color:g.color,fontWeight:700}}>~{mToGoal} months</div>}
                      {pct>=1&&<div style={{fontSize:11,color:C.green,fontWeight:700}}>🎉 Reached!</div>}
                    </div>
                  </Card>
                );
              })}

              {/* Historical chart */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 12px"}}>
                <div style={{fontSize:13,fontWeight:700,color:C.muted,letterSpacing:.5}}>MONTHLY HISTORY</div>
                <button onClick={()=>setHistModal(true)}
                  style={{background:C.blue+"22",border:"none",borderRadius:20,padding:"7px 14px",color:C.blue,fontSize:12,fontWeight:700}}>+ Add Month</button>
              </div>

              <Card style={{marginBottom:14,overflowX:"hidden"}}>
                <BarChart history={savHist}/>
              </Card>

              {/* Stats row */}
              {savHist.length>0&&(()=>{
                const avgSaved=savHist.reduce((s,h)=>s+h.saved,0)/savHist.length;
                const totalEver=savHist.reduce((s,h)=>s+h.saved,0);
                const best=savHist.reduce((a,b)=>b.saved>a.saved?b:a);
                return(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                    {[
                      {l:"Avg/Month",v:fmtK(avgSaved),c:C.green},
                      {l:"Total Ever",v:fmtK(totalEver),c:C.blue},
                      {l:"Best Month",v:best.month.split(" ")[0],c:C.purple},
                    ].map((s,i)=>(
                      <div key={i} style={{background:s.c+"11",borderRadius:14,padding:"12px 14px",border:`1px solid ${s.c}22`}}>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{s.l}</div>
                        <div style={{fontSize:16,fontWeight:700,color:s.c,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* History list */}
              {[...savHist].reverse().map(h=>(
                <div key={h.id} style={{background:C.card,borderRadius:14,padding:"12px 16px",marginBottom:8,
                  display:"flex",alignItems:"center",gap:10,border:`1px solid ${C.border}`}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{h.month}</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
                      In ₱{fmt(h.income)} · Out ₱{fmt(h.expenses)}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:h.saved>=0?C.green:C.red,fontFamily:"'DM Sans',sans-serif"}}>
                      {h.saved>=0?"+":""}{fmtK(h.saved)}
                    </div>
                    <div style={{fontSize:10,color:C.muted}}>{h.income>0?(h.saved/h.income*100).toFixed(0):0}% rate</div>
                  </div>
                  <button onClick={()=>setSavHist(p=>p.filter(x=>x.id!==h.id))}
                    style={{background:C.red+"22",border:"none",borderRadius:8,width:26,height:26,fontSize:11,color:C.red,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* ═══════ LOANS ═══════ */}
          {tab==="loans"&&(
            <div className="anim" style={{paddingTop:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:24,fontWeight:800,color:C.text}}>Loans</div>
                <button onClick={()=>{setLoanModal("new");setLoanForm({name:"",total:"",monthly:"",paid:"0",notes:"",color:C.blue})}}
                  style={{background:C.blue,border:"none",borderRadius:20,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700}}>+ Add</button>
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Payments via Bills auto-update here 🔗</div>

              {/* Total debt */}
              <Card style={{marginBottom:16,border:`1px solid ${C.red}33`,background:C.redSoft}}>
                <div style={{fontSize:10,color:C.red,letterSpacing:2,fontFamily:"'DM Sans',sans-serif"}}>TOTAL DEBT REMAINING</div>
                <div style={{fontSize:30,fontWeight:800,color:C.red,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>₱{fmt(totalDebt)}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>
                  {loans.reduce((s,l)=>s+l.monthly,0).toLocaleString()} / month in payments
                </div>
              </Card>

              {loans.map(l=>{
                const pct=l.paid/l.total;
                const rem=l.total-l.paid;
                const mLeft=Math.max(0,Math.ceil(rem/l.monthly));
                const mTotal=Math.round(l.total/l.monthly);
                const mDone=mTotal-mLeft;
                const fd=new Date(); fd.setMonth(fd.getMonth()+mLeft);
                return(
                  <Card key={l.id} style={{marginBottom:16,border:`1px solid ${l.color}33`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div>
                        <div style={{fontSize:16,fontWeight:800,color:C.text}}>{l.name}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>₱{fmt(l.monthly)}/month</div>
                        {l.notes&&<div style={{fontSize:11,color:C.muted}}>{l.notes}</div>}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <div style={{background:l.color+"22",borderRadius:12,padding:"6px 12px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:l.color,fontFamily:"'DM Sans',sans-serif"}}>{Math.round(pct*100)}%</div>
                          <div style={{fontSize:9,color:l.color}}>PAID</div>
                        </div>
                        <button onClick={()=>{setLoanModal(l.id);setLoanForm({...l,total:l.total.toString(),monthly:l.monthly.toString(),paid:l.paid.toString()})}}
                          style={{background:C.card2,border:"none",borderRadius:10,width:32,height:32,fontSize:14}}>✏️</button>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={l.color} h={12}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"12px 0"}}>
                      {[
                        {l:"Total",v:fmtK(l.total)},
                        {l:"Paid",v:fmtK(l.paid),c:C.green},
                        {l:"Left",v:fmtK(rem),c:C.red},
                      ].map((s,i)=>(
                        <div key={i} style={{background:C.card2,borderRadius:12,padding:"10px 12px",textAlign:"center",border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:14,fontWeight:800,color:s.c||C.text,fontFamily:"'DM Sans',sans-serif"}}>{s.v}</div>
                          <div style={{fontSize:10,color:C.muted}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:l.color+"11",borderRadius:14,padding:"12px 16px",border:`1px solid ${l.color}22`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:10,color:C.muted}}>Months paid</div>
                          <div style={{fontSize:22,fontWeight:800,color:l.color,fontFamily:"'DM Sans',sans-serif"}}>{mDone}<span style={{fontSize:13,color:C.muted}}> / {mTotal}</span></div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:10,color:C.muted}}>🎉 Freedom Date</div>
                          <div style={{fontSize:15,fontWeight:800,color:C.text}}>{fd.toLocaleDateString("en-PH",{month:"long",year:"numeric"})}</div>
                          <div style={{fontSize:11,color:l.color,fontFamily:"'DM Sans',sans-serif"}}>{mLeft} months left</div>
                        </div>
                      </div>
                    </div>
                    {/* Month dots */}
                    <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:5}}>
                      {Array.from({length:Math.min(mTotal,48)}).map((_,i)=>(
                        <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<mDone?l.color:C.border,transition:"background .3s"}}/>
                      ))}
                      {mTotal>48&&<span style={{fontSize:9,color:C.muted,alignSelf:"center"}}>+{mTotal-48}</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ═══════ INVEST ═══════ */}
          {tab==="invest"&&(
            <div className="anim" style={{paddingTop:20}}>
              <div style={{fontSize:24,fontWeight:800,color:C.text,marginBottom:4}}>Invest</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Track your portfolio · Learn where to put your money</div>

              {/* Portfolio total */}
              <div style={{background:C.blueSoft,borderRadius:24,padding:22,border:`1px solid ${C.blue}33`,marginBottom:16,boxShadow:C.shadow}}>
                <div style={{fontSize:10,color:C.blue,letterSpacing:2,fontFamily:"'DM Sans',sans-serif"}}>TOTAL PORTFOLIO</div>
                <div style={{fontSize:34,fontWeight:800,color:C.text,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>₱{fmt(totalInvest)}</div>
                {(()=>{
                  const totalIn=invest.reduce((s,i)=>s+i.invested,0);
                  const gain=totalInvest-totalIn;
                  const gainPct=totalIn>0?(gain/totalIn*100):0;
                  return(
                    <div style={{marginTop:10}}>
                      <span style={{fontSize:12,color:gainPct>=0?C.green:C.red,fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>
                        {gainPct>=0?"+":""}{gainPct.toFixed(1)}% ({gainPct>=0?"+":""}₱{fmt(Math.abs(gain))})
                      </span>
                      <span style={{fontSize:11,color:C.muted,marginLeft:8}}>total return</span>
                    </div>
                  );
                })()}
              </div>

              {/* Holdings */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:C.muted,letterSpacing:.5}}>MY HOLDINGS</div>
                <button onClick={()=>{setInvestModal("new");setInvestForm({name:"",type:"uitf",invested:"",currentValue:"",notes:""})}}
                  style={{background:C.blue,border:"none",borderRadius:20,padding:"7px 16px",color:"#fff",fontSize:12,fontWeight:800}}>+ Add</button>
              </div>

              {invest.length===0&&(
                <Card style={{textAlign:"center",padding:32,border:`1px dashed ${C.border}`}}>
                  <div style={{fontSize:32,marginBottom:8}}>📊</div>
                  <div style={{color:C.muted,fontSize:13}}>No investments yet.<br/>Check the guide below to get started.</div>
                </Card>
              )}

              {invest.map(i=>{
                const gain=i.currentValue-i.invested;
                const gainPct=i.invested>0?(gain/i.invested*100):0;
                const sparkData=[i.invested, i.invested*(1+gainPct*0.01*0.33), i.invested*(1+gainPct*0.01*0.67), i.currentValue];
                return(
                  <Card key={i.id} style={{marginBottom:12,border:`1px solid ${C.blue}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:C.text}}>{i.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>{i.type?.toUpperCase()||"—"}{i.notes&&" · "+i.notes}</div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <Sparkline data={sparkData} color={gainPct>=0?C.green:C.red}/>
                        <button onClick={()=>{setInvestModal(i.id);setInvestForm({...i,invested:i.invested.toString(),currentValue:i.currentValue.toString()})}}
                          style={{background:C.card2,border:"none",borderRadius:10,width:30,height:30,fontSize:13}}>✏️</button>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[
                        {l:"Invested",v:`₱${fmt(i.invested)}`},
                        {l:"Current",v:`₱${fmt(i.currentValue)}`,c:C.blue},
                        {l:"Return",v:`${gainPct>=0?"+":""}${gainPct.toFixed(1)}%`,c:gainPct>=0?C.green:C.red},
                      ].map((s,j)=>(
                        <div key={j} style={{background:C.card2,borderRadius:12,padding:"10px 12px",textAlign:"center",border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:12,fontWeight:700,color:s.c||C.text,fontFamily:"'DM Sans',sans-serif"}}>{s.v}</div>
                          <div style={{fontSize:9,color:C.muted}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}

              {/* Investment Guide */}
              <div style={{fontSize:13,fontWeight:700,color:C.muted,margin:"20px 0 12px",letterSpacing:.5}}>📚 INVESTMENT GUIDE — PH</div>
              {INVEST_GUIDE.map(g=>(
                <div key={g.id} onClick={()=>setGuideItem(guideItem?.id===g.id?null:g)}
                  style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:10,
                    border:`1px solid ${C.border}`,cursor:"pointer",transition:"border .2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontSize:11,background:C.blue+"22",color:C.blue,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{g.tag}</span>
                        <span style={{fontSize:10,background:
                          g.risk.startsWith("Low")?C.green+"22":g.risk==="Medium"?C.yellow+"22":C.red+"22",
                          color:g.risk.startsWith("Low")?C.green:g.risk==="Medium"?C.yellow:C.red,
                          padding:"2px 8px",borderRadius:20,fontWeight:700}}>{g.risk} Risk</span>
                      </div>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{g.name}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                        Min: {g.min} · Return: {g.return} · {g.liquidity}
                      </div>
                    </div>
                    <div style={{color:C.muted,fontSize:16,marginLeft:10}}>{guideItem?.id===g.id?"▲":"▼"}</div>
                  </div>
                  {guideItem?.id===g.id&&(
                    <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                      <div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:12}}>{g.desc}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div>
                          <div style={{fontSize:10,color:C.green,fontWeight:700,marginBottom:6}}>✅ PROS</div>
                          {g.pros.map((p,i)=><div key={i} style={{fontSize:11,color:C.muted,marginBottom:4}}>· {p}</div>)}
                        </div>
                        <div>
                          <div style={{fontSize:10,color:C.red,fontWeight:700,marginBottom:6}}>⚠️ CONS</div>
                          {g.cons.map((c,i)=><div key={i} style={{fontSize:11,color:C.muted,marginBottom:4}}>· {c}</div>)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ═══════ SETTINGS ═══════ */}
          {tab==="settings"&&(
            <div className="anim" style={{paddingTop:20}}>
              <div style={{fontSize:24,fontWeight:800,color:C.text,marginBottom:4}}>Settings</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Privacy, tutorial, and app controls</div>

              <Card style={{marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:6}}>🔒 100% Local</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
                  All data (including your login/app lock) stays on <strong style={{color:C.text}}>this device only</strong>.
                  There is <strong style={{color:C.text}}>no database</strong> and no server storing your records.
                </div>
              </Card>

              <Card style={{marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>🎓 Tutorial</div>
                <button onClick={()=>{setTutorialStep(0);setTutorialOpen(true)}} style={{width:"100%",padding:12,borderRadius:14,border:"none",background:C.blue,color:"#fff",fontSize:13,fontWeight:800}}>
                  View tutorial again
                </button>
                <button onClick={()=>{try{localStorage.removeItem(ONBOARD_KEY)}catch{};}} style={{width:"100%",marginTop:10,padding:12,borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:13,fontWeight:700}}>
                  Show tutorial on next launch
                </button>
              </Card>

              <Card style={{marginBottom:12,border:`1px solid ${C.red}22`}}>
                <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:6}}>🧹 Reset data</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:12}}>
                  Reset all finance data back to <strong style={{color:C.text}}>0 / blank defaults</strong> on this device.
                  (This does not remove your app lock password.)
                </div>
                <button
                  onClick={()=>{
                    const ok = confirm("Reset all finance data to 0/blank defaults? This cannot be undone.");
                    if(ok) resetToDefaults();
                  }}
                  style={{width:"100%",padding:12,borderRadius:14,border:"none",background:C.red,color:"#fff",fontSize:13,fontWeight:800}}
                >
                  Reset finance data to default
                </button>
              </Card>

              <Card style={{marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:6}}>📩 Contact / Demo</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
                  This product is for <strong style={{color:C.text}}>demo</strong>. You can use it personally as you please.
                  For investment opportunities (or donations), contact{" "}
                  <a href="mailto:christianjoshuacasin@gmail.com" style={{color:C.blue,fontWeight:800,textDecoration:"none"}}>christianjoshuacasin@gmail.com</a>.
                </div>
              </Card>

              <Card>
                <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:6}}>📦 Backup & restore</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.4}}>
                  Move your data between devices using Export/Import (offline file).
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={exportData} style={{flex:1,padding:12,borderRadius:14,border:`1.5px solid ${C.blue}`,background:C.blueSoft,color:C.blue,fontSize:13,fontWeight:800}}>Export</button>
                  <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} style={{display:"none"}} />
                  <button onClick={()=>importInputRef.current?.click()} style={{flex:1,padding:12,borderRadius:14,border:`1.5px solid ${C.green}`,background:C.greenSoft,color:C.green,fontSize:13,fontWeight:800}}>Import</button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* ── TAB BAR (light, blue active) ── */}
      <div style={{background:C.card,borderTop:`1px solid ${C.border}`,padding:"10px 0 24px",
        display:"flex",justifyContent:"space-around",flexShrink:0,boxShadow:"0 -2px 12px rgba(0,0,0,.04)"}}>
        {[
          {id:"home",   emoji:"🏠",label:"Home"},
          {id:"bills",  emoji:"📅",label:"Bills"},
          {id:"savings",emoji:"💚",label:"Savings"},
          {id:"loans",  emoji:"📊",label:"Loans"},
          {id:"invest", emoji:"📈",label:"Invest"},
          {id:"settings", emoji:"⚙️",label:"Settings"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",
            display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"6px 0",position:"relative"}}>
            {tab===t.id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:3,background:C.blue,borderRadius:3}}/>}
            <div style={{fontSize:22,opacity:tab===t.id?1:.5}}>{t.emoji}</div>
            <div style={{fontSize:10,color:tab===t.id?C.blue:C.muted,fontWeight:tab===t.id?700:500,textDecoration:tab===t.id?"underline":undefined,textUnderlineOffset:2}}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          TIPS PANEL
      ══════════════════════════════════ */}
      {tipsOpen&&(
        <Modal onClose={()=>setTipsOpen(false)} title="💡 Financial Tips">
          <div style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>
            Based on your actual numbers. Updated every time your data changes.
          </div>
          {tips.map((tip,i)=>(
            <div key={i} style={{background:C.card2,borderRadius:16,padding:"14px 16px",marginBottom:10,
              border:`1px solid ${tipColor(tip.type)}33`,cursor:"pointer"}}
              onClick={()=>setActiveTip(activeTip===i?null:i)}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:20}}>{tip.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{tip.title}</div>
                    <Badge label={tip.type} color={tipColor(tip.type)}/>
                  </div>
                  {activeTip===i&&(
                    <div style={{marginTop:10}}>
                      <div style={{fontSize:12,color:C.muted,lineHeight:1.8,marginBottom:10}}>{tip.body}</div>
                      <div style={{background:tipColor(tip.type)+"15",borderRadius:12,padding:"10px 14px",
                        border:`1px solid ${tipColor(tip.type)}33`}}>
                        <div style={{fontSize:10,color:tipColor(tip.type),fontWeight:700,marginBottom:4}}>ACTION</div>
                        <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{tip.action}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Modal>
      )}

      {/* ══ BRIEFING ══ */}
      {briefing&&(
        <Modal onClose={()=>setBriefing(false)} title="⚡ Chief Briefing">
          <div style={{fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.6}}>Copy → Paste into <strong style={{color:C.text}}>Claude.ai</strong></div>
          <div style={{background:C.bg,borderRadius:14,padding:14,marginBottom:14,maxHeight:300,overflowY:"auto",border:`1px solid ${C.border}`}}>
            <pre style={{fontSize:11,color:C.muted,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{promptText}</pre>
          </div>
          <button onClick={copyPrompt} style={{width:"100%",padding:16,borderRadius:14,border:"none",
            background:copied?C.green2:C.green,color:"#fff",fontSize:14,fontWeight:700,marginBottom:10,transition:"background .3s"}}>
            {copied?"✅ Copied!":"📋 Copy Full Briefing"}
          </button>
        </Modal>
      )}

      {/* ══ MARK PAID ══ */}
      {/* ── Monthly report modal ── */}
      {monthlyReportOpen&&((
        ()=>{
          const r = buildMonthlyReport();
          return (
            <Modal onClose={()=>{setMonthlyReportOpen(false);setMonthlyReportCopied(false)}} title="📋 Monthly Report">
              <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Copy or add to history. Use after you’ve completed your financial responsibilities for the month.</div>
              <div style={{background:C.bg,borderRadius:14,padding:14,marginBottom:14,maxHeight:320,overflowY:"auto",border:`1px solid ${C.border}`,whiteSpace:"pre-wrap",fontSize:12,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{r.reportText}</div>
              <button onClick={()=>{navigator.clipboard?.writeText(r.reportText);setMonthlyReportCopied(true);setTimeout(()=>setMonthlyReportCopied(false),2000)}}
                style={{width:"100%",padding:14,borderRadius:14,border:"none",background:monthlyReportCopied?C.green:C.blue,color:"#fff",fontSize:14,fontWeight:700,marginBottom:10}}>
                {monthlyReportCopied?"✅ Copied!":"📋 Copy report"}
              </button>
              <button onClick={addCurrentMonthToHistory}
                style={{width:"100%",padding:14,borderRadius:14,border:`1.5px solid ${C.green}`,background:C.greenSoft,color:C.green,fontSize:14,fontWeight:700}}>
                ✅ Add this month to history
              </button>
            </Modal>
          );
        }
      )())}

      {/* ── Import confirm (replace data?) ── */}
      {importConfirm&&(
        <Modal onClose={()=>setImportConfirm(null)} title="📥 Import backup">
          <div style={{fontSize:14,color:C.text,marginBottom:16,lineHeight:1.5}}>
            This will replace all your current data with the imported backup.
            {importConfirm.data?.exportedAt && (
              <div style={{marginTop:10,fontSize:12,color:C.muted}}>Backup from: {new Date(importConfirm.data.exportedAt).toLocaleString("en-PH")}</div>
            )}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setImportConfirm(null)} style={{flex:1,padding:14,borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:14,fontWeight:700}}>Cancel</button>
            <button onClick={applyImport} style={{flex:1,padding:14,borderRadius:14,border:"none",background:C.green,color:"#fff",fontSize:14,fontWeight:700}}>Import & replace</button>
          </div>
        </Modal>
      )}

      {/* ── Tutorial (first timer) ─────────────────────────────────────────── */}
      {tutorialOpen && (() => {
        const steps = [
          {
            title: "Welcome to KinsenasApp",
            icon: "⚡",
            body: (
              <>
                <div style={{fontSize:14,color:C.text,fontWeight:800,marginBottom:8}}>Everything is local.</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                  All data — including your login/app lock — is kept only on <strong style={{color:C.text}}>your device</strong>.
                  There is <strong style={{color:C.text}}>NO database</strong> and no server storing your records.
                </div>
                <div style={{marginTop:12,fontSize:12,color:C.muted,lineHeight:1.7}}>
                  This product is for <strong style={{color:C.text}}>demo</strong>. You can use it personally as you please.
                  For investment opportunities (or donations), contact{" "}
                  <a href="mailto:christianjoshuacasin@gmail.com" style={{color:C.blue,fontWeight:800,textDecoration:"none"}}>christianjoshuacasin@gmail.com</a>.
                </div>
              </>
            )
          },
          {
            title: "Navigation",
            icon: "🧭",
            body: (
              <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                Use the bottom tabs to move between features:
                <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    ["🏠 Home","Overview + backup"],
                    ["📅 Bills","Cutoffs + paid tracking"],
                    ["💚 Savings","Goals + history + report"],
                    ["📊 Loans","Debt tracking"],
                    ["📈 Invest","Portfolio + guide"],
                    ["⚙️ Settings","Tutorial + privacy"],
                  ].map(([a,b])=>(
                    <div key={a} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 12px"}}>
                      <div style={{fontSize:12,fontWeight:800,color:C.text}}>{a}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{b}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          },
          {
            title: "Bills & Payments",
            icon: "📅",
            body: (
              <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                - Track your 15th & 30th cutoff items.<br/>
                - Tap ✓ to mark paid (with amount + date).<br/>
                - Loan or Savings items can auto-sync to Loans/Goals.<br/>
                - When moving to next month, you’ll be asked if you’re done.
              </div>
            )
          },
          {
            title: "Savings",
            icon: "💚",
            body: (
              <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                - Create Savings Goals (e.g. Emergency Fund).<br/>
                - Add monthly history (Income / Expenses / Saved).<br/>
                - Use “Monthly Report” after you’ve finished your responsibilities to generate a summary and add it to history.
              </div>
            )
          },
          {
            title: "Loans, Invest, Tips",
            icon: "📊",
            body: (
              <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                - Loans: track paid %, months left, and freedom date.<br/>
                - Invest: track holdings + learn options in the guide.<br/>
                - Tips: rule-based advice using your numbers (savings rate, emergency fund months, debt ratio, etc.).
              </div>
            )
          },
          {
            title: "Backup & restore",
            icon: "📦",
            body: (
              <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                Want the same data on another device? Use Export/Import to move a backup file (offline).
                <div style={{marginTop:10,background:C.blueSoft,border:`1px solid ${C.blue}22`,borderRadius:12,padding:"10px 12px",color:C.text}}>
                  Tip: Export on your Mac → AirDrop to iPhone → Import on iPhone.
                </div>
              </div>
            )
          },
          {
            title: "Mobile-first + responsive",
            icon: "📱",
            body: (
              <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                This app is designed primarily for <strong style={{color:C.text}}>mobile</strong>, but it automatically adapts
                for iPad and desktop with a responsive layout.
                <div style={{marginTop:10}}>
                  You can revisit this tutorial anytime in <strong style={{color:C.text}}>Settings</strong>.
                </div>
              </div>
            )
          },
        ];

        const s = steps[Math.min(tutorialStep, steps.length - 1)];
        const last = tutorialStep >= steps.length - 1;

        return (
          <Modal onClose={() => { setTutorialOpen(false); try { localStorage.setItem(ONBOARD_KEY, "1"); } catch {} }} title={`${s.icon} ${s.title}`}>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {steps.map((_,i)=>(
                <div key={i} style={{height:6,width: i===tutorialStep ? 34 : 18, borderRadius:99, background:i<=tutorialStep?C.blue:C.border, transition:"width .2s"}}/>
              ))}
            </div>

            <div>{s.body}</div>

            <div style={{position:"sticky",bottom:0,marginTop:18,paddingTop:12,background:C.card}}>
              <div style={{display:"flex",gap:10}}>
                <button
                  onClick={()=>setTutorialStep(p=>Math.max(0,p-1))}
                  disabled={tutorialStep===0}
                  style={{flex:1,padding:14,borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:tutorialStep===0?C.border:C.muted,fontSize:14,fontWeight:800}}
                >
                  ← Previous
                </button>
                <button
                  onClick={()=>{
                    if(last){
                      setTutorialOpen(false);
                      try{localStorage.setItem(ONBOARD_KEY,"1")}catch{}
                    } else {
                      setTutorialStep(p=>p+1);
                    }
                  }}
                  style={{flex:1,padding:14,borderRadius:14,border:"none",background:C.blue,color:"#fff",fontSize:14,fontWeight:800}}
                >
                  {last ? "Finish" : "Next →"}
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── Done with bills this month? (before next month) ── */}
      {confirmNextMonth&&(
        <Modal onClose={()=>setConfirmNextMonth(null)} title="📅 Move to next month?">
          <div style={{fontSize:14,color:C.text,marginBottom:16,lineHeight:1.5}}>
            Are you done with your bills for <strong>{monthLabel(confirmNextMonth.fromMonthKey)}</strong>?
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{setConfirmNextMonth(null)}} style={{flex:1,padding:14,borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:14,fontWeight:700}}>No, go back</button>
            <button onClick={()=>{setBillMonth(nextMonthKey(confirmNextMonth.fromMonthKey));setConfirmNextMonth(null)}} style={{flex:1,padding:14,borderRadius:14,border:"none",background:C.blue,color:"#fff",fontSize:14,fontWeight:700}}>Yes, move on</button>
          </div>
        </Modal>
      )}

      {paidModal&&(
        <Modal onClose={()=>setPaidModal(null)} title={`💳 Mark Paid — ${paidModal.item.name}`}>
          {(paidModal.item.cat==="loan"&&paidModal.item.loanLink||paidModal.item.cat==="savings"&&paidModal.item.goalLink)&&(
            <div style={{background:C.green+"11",borderRadius:12,padding:"10px 14px",marginBottom:14,border:`1px solid ${C.green}33`}}>
              <div style={{fontSize:12,color:C.green,fontWeight:700}}>
                🔗 Auto-sync enabled
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                {paidModal.item.cat==="loan"?"Loan balance will be updated automatically.":"Savings goal will receive this amount automatically."}
              </div>
            </div>
          )}
          <Inp label="Actual Amount Paid (₱)" type="number" value={paidAmt} onChange={e=>setPaidAmt(e.target.value)} style={{fontSize:20,fontWeight:700}}/>
          <Inp label="Date Paid" type="date" value={paidDate} onChange={e=>setPaidDate(e.target.value)}/>
          <BtnPrimary onClick={markPaid} color={C.green}>✓ Confirm Payment</BtnPrimary>
          <div style={{marginTop:10}}/>
          <BtnSecondary onClick={()=>setPaidModal(null)}>Cancel</BtnSecondary>
        </Modal>
      )}

      {/* ══ EDIT INCOME ══ */}
      {editIncome&&(
        <Modal onClose={()=>setEditIncome(null)} title="✏️ Edit Income">
          <Inp label={`${co[editIncome].label} Income (₱)`} type="number" value={incomeVal} onChange={e=>setIncomeVal(e.target.value)} style={{fontSize:20,fontWeight:700}}/>
          <BtnPrimary onClick={()=>{setCo(p=>({...p,[editIncome]:{...p[editIncome],income:parseFloat(incomeVal)||p[editIncome].income}}));setEditIncome(null)}}>Save</BtnPrimary>
          <div style={{marginTop:10}}/><BtnSecondary onClick={()=>setEditIncome(null)}>Cancel</BtnSecondary>
        </Modal>
      )}

      {/* ══ BILL MODAL ══ */}
      {billModal&&(
        <Modal onClose={()=>setBillModal(null)} title={billModal.mode==="edit"?"✏️ Edit Item":"➕ Add Item"}>
          <Inp label="Name" value={billForm.name||""} onChange={e=>setBillForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Electricity"/>
          <Inp label="Budget Amount (₱)" type="number" value={billForm.budget||""} onChange={e=>setBillForm(p=>({...p,budget:e.target.value}))}/>
          <Row label="Category">
            <div style={{display:"flex",gap:8}}>
              {["expense","bill","loan","savings","investment"].map(cat=>(
                <button key={cat} onClick={()=>setBillForm(p=>({...p,cat}))} style={{flex:1,padding:"8px 2px",
                  borderRadius:12,border:`1.5px solid ${billForm.cat===cat?C.green:C.border}`,
                  background:billForm.cat===cat?C.green+"22":"transparent",
                  color:billForm.cat===cat?C.green:C.muted,fontSize:10,fontWeight:700}}>
                  {catIco(cat)}<br/>{cat}
                </button>
              ))}
            </div>
          </Row>
          {billForm.cat==="loan"&&(
            <Row label="Link to Loan (auto-sync)">
              <select value={billForm.loanLink||""} onChange={e=>setBillForm(p=>({...p,loanLink:e.target.value}))}
                style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,
                  padding:"12px 14px",color:C.text,fontSize:13,outline:"none"}}>
                <option value="">— No link —</option>
                {loans.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Row>
          )}
          {billForm.cat==="savings"&&(
            <Row label="Link to Savings Goal (auto-sync)">
              <select value={billForm.goalLink||""} onChange={e=>setBillForm(p=>({...p,goalLink:e.target.value}))}
                style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,
                  padding:"12px 14px",color:C.text,fontSize:13,outline:"none"}}>
                <option value="">— No link —</option>
                {goals.map(g=><option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
              </select>
            </Row>
          )}
          <BtnPrimary onClick={saveBill}>Save</BtnPrimary>
          <div style={{marginTop:10}}/><BtnSecondary onClick={()=>setBillModal(null)}>Cancel</BtnSecondary>
        </Modal>
      )}

      {/* ══ LOAN MODAL ══ */}
      {loanModal&&(
        <Modal onClose={()=>setLoanModal(null)} title={loanModal==="new"?"➕ Add Loan":"✏️ Edit Loan"}>
          <Inp label="Loan Name" value={loanForm.name||""} onChange={e=>setLoanForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Car Loan"/>
          <Inp label="Total Loan Amount (₱)" type="number" value={loanForm.total||""} onChange={e=>setLoanForm(p=>({...p,total:e.target.value}))}/>
          <Inp label="Monthly Payment (₱)" type="number" value={loanForm.monthly||""} onChange={e=>setLoanForm(p=>({...p,monthly:e.target.value}))}/>
          <Inp label="Amount Already Paid (₱)" type="number" value={loanForm.paid||""} onChange={e=>setLoanForm(p=>({...p,paid:e.target.value}))}/>
          <Inp label="Notes (optional)" value={loanForm.notes||""} onChange={e=>setLoanForm(p=>({...p,notes:e.target.value}))} placeholder="Bank, purpose…"/>
          <ColorPicker value={loanForm.color||C.blue} onChange={v=>setLoanForm(p=>({...p,color:v}))}/>
          <BtnPrimary onClick={saveLoan}>Save Loan</BtnPrimary>
          {loanModal!=="new"&&<><div style={{marginTop:10}}/><BtnPrimary onClick={()=>{setLoans(p=>p.filter(l=>l.id!==loanModal));setLoanModal(null)}} color={C.red}>🗑 Delete Loan</BtnPrimary></>}
          <div style={{marginTop:10}}/><BtnSecondary onClick={()=>setLoanModal(null)}>Cancel</BtnSecondary>
        </Modal>
      )}

      {/* ══ GOAL MODAL ══ */}
      {goalModal&&(
        <Modal onClose={()=>setGoalModal(null)} title={goalModal==="new"?"➕ Add Goal":"✏️ Edit Goal"}>
          <Inp label="Goal Name" value={goalForm.name||""} onChange={e=>setGoalForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Emergency Fund"/>
          <Inp label="Target Amount (₱)" type="number" value={goalForm.target||""} onChange={e=>setGoalForm(p=>({...p,target:e.target.value}))}/>
          <Inp label="Current Savings (₱)" type="number" value={goalForm.current||""} onChange={e=>setGoalForm(p=>({...p,current:e.target.value}))}/>
          <Row label="Icon">
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["🎯","🛡️","✈️","💻","🏠","🚗","💍","🎓","🏖️","💊","📱","🎸","💼","🌏","🍀"].map(ico=>(
                <button key={ico} onClick={()=>setGoalForm(p=>({...p,icon:ico}))} style={{width:38,height:38,
                  borderRadius:10,border:`2px solid ${goalForm.icon===ico?C.green:C.border}`,
                  background:goalForm.icon===ico?C.green+"22":C.card2,fontSize:18}}>{ico}</button>
              ))}
            </div>
          </Row>
          <ColorPicker value={goalForm.color||C.green} onChange={v=>setGoalForm(p=>({...p,color:v}))}/>
          <BtnPrimary onClick={saveGoal} color={C.green}>Save Goal</BtnPrimary>
          {goalModal!=="new"&&<><div style={{marginTop:10}}/><BtnPrimary onClick={()=>{setGoals(p=>p.filter(g=>g.id!==goalModal));setGoalModal(null)}} color={C.red}>🗑 Delete Goal</BtnPrimary></>}
          <div style={{marginTop:10}}/><BtnSecondary onClick={()=>setGoalModal(null)}>Cancel</BtnSecondary>
        </Modal>
      )}

      {/* ══ INVEST MODAL ══ */}
      {investModal&&(
        <Modal onClose={()=>setInvestModal(null)} title={investModal==="new"?"➕ Add Investment":"✏️ Edit Investment"}>
          <Inp label="Investment Name" value={investForm.name||""} onChange={e=>setInvestForm(p=>({...p,name:e.target.value}))} placeholder="e.g. BDO UITF Equity Fund"/>
          <Row label="Type">
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["mp2","uitf","stocks","fmetf","crypto","realestate","other"].map(t=>(
                <button key={t} onClick={()=>setInvestForm(p=>({...p,type:t}))} style={{padding:"8px 12px",
                  borderRadius:12,border:`1.5px solid ${investForm.type===t?C.blue:C.border}`,
                  background:investForm.type===t?C.blue+"22":"transparent",
                  color:investForm.type===t?C.blue:C.muted,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{t}</button>
              ))}
            </div>
          </Row>
          <Inp label="Amount Invested (₱)" type="number" value={investForm.invested||""} onChange={e=>setInvestForm(p=>({...p,invested:e.target.value}))}/>
          <Inp label="Current Value (₱)" type="number" value={investForm.currentValue||""} onChange={e=>setInvestForm(p=>({...p,currentValue:e.target.value}))} placeholder="Leave blank = same as invested"/>
          <Inp label="Notes" value={investForm.notes||""} onChange={e=>setInvestForm(p=>({...p,notes:e.target.value}))} placeholder="e.g. BDO branch, maturity date…"/>
          <BtnPrimary onClick={saveInvest} color={C.blue}>Save Investment</BtnPrimary>
          {investModal!=="new"&&<><div style={{marginTop:10}}/><BtnPrimary onClick={()=>{setInvest(p=>p.filter(i=>i.id!==investModal));setInvestModal(null)}} color={C.red}>🗑 Delete</BtnPrimary></>}
          <div style={{marginTop:10}}/><BtnSecondary onClick={()=>setInvestModal(null)}>Cancel</BtnSecondary>
        </Modal>
      )}

      {/* ══ HISTORY MODAL ══ */}
      {histModal&&(
        <Modal onClose={()=>setHistModal(false)} title="➕ Add Monthly Record">
          <Inp label='Month (e.g. "Mar 2026")' value={histForm.month} onChange={e=>setHistForm(p=>({...p,month:e.target.value}))} placeholder="Mar 2026"/>
          <Inp label="Total Income (₱)" type="number" value={histForm.income} onChange={e=>setHistForm(p=>({...p,income:e.target.value}))}/>
          <Inp label="Total Expenses (₱)" type="number" value={histForm.expenses} onChange={e=>setHistForm(p=>({...p,expenses:e.target.value}))}/>
          <Inp label="Amount Saved (₱) — leave blank to auto-calculate" type="number" value={histForm.saved} onChange={e=>setHistForm(p=>({...p,saved:e.target.value}))} placeholder="Auto: income − expenses"/>
          <BtnPrimary onClick={saveHist} color={C.green}>Save Record</BtnPrimary>
          <div style={{marginTop:10}}/><BtnSecondary onClick={()=>setHistModal(false)}>Cancel</BtnSecondary>
        </Modal>
      )}

    </div>
  );
}
