import { useEffect, useState } from "react";

/*
 * ═══════════════════════════════════════════════════════════════
 *  Khmer AI Facebook Fixer — Merged Full Version
 *  Real Facebook Login → Graph API Pages → AI Analysis → History
 *  + Google quick sign-in (manual page entry) + Subscription plans
 * ═══════════════════════════════════════════════════════════════
 */

const FB_APP_ID_KEY = "fb-fixer:app-id";
const HISTORY_KEY = "fb-fixer:history";
const FB_PERMISSIONS = "pages_show_list,pages_read_engagement,read_insights";

const META_LINKS = {
  monetization: "https://www.facebook.com/creators/tools/monetization",
  copyright: "https://www.facebook.com/support/intellectual-property",
  policy: "https://transparency.fb.com/policies/community-standards/",
  quality: "https://www.facebook.com/business/help/page-quality",
  ads: "https://www.facebook.com/business/help/2032702440326605",
  verification: "https://www.facebook.com/id",
  appeal: "https://www.facebook.com/help/contact/260749603972907",
  business: "https://business.facebook.com/",
  page_quality: "https://www.facebook.com/business/help/page-quality",
};

const PROBLEM_CATEGORIES = [
  { id: "monetization_off", icon: "💰", label: "Monetization បិទ", en: "Monetization Disabled" },
  { id: "monetization_limited", icon: "⚠️", label: "Monetization កំណត់", en: "Monetization Limited" },
  { id: "copyright", icon: "©️", label: "រំលោភលិខសិទ្ធិ", en: "Copyright Strike" },
  { id: "page_restricted", icon: "🔒", label: "Page ដាក់កំហិត", en: "Page Restricted" },
  { id: "ad_rejected", icon: "🚫", label: "Ad បដិសេធ", en: "Ad Rejected" },
  { id: "ad_account", icon: "📛", label: "Ad Account រឹតបន្តឹង", en: "Ad Account Restricted" },
  { id: "community", icon: "📋", label: "បំពានគោលការណ៍", en: "Community Guidelines" },
  { id: "identity", icon: "🪪", label: "ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ", en: "Identity Verification" },
  { id: "reach_down", icon: "📉", label: "Reach/Engagement ធ្លាក់", en: "Reach Drop" },
  { id: "other", icon: "❓", label: "បញ្ហាផ្សេងៗ", en: "Other" },
];

// Subscription tiers (from the original mockup) — wire these to your own
// billing backend at /api/create-checkout-session.
const SUBSCRIPTION_PLANS = [
  { id: "basic", label: "Basic", price: "$6/ខែ", color: "#2563eb" },
  { id: "standard", label: "Standard", price: "$15/ខែ", color: "#059669" },
  { id: "pro", label: "Pro", price: "$25/ខែ", color: "#7c3aed" },
];

// ─── Facebook SDK ─────────────────────────────────────────────
// Loads the SDK script once, then (re)initializes FB with the given
// appId every time this is called — so switching App IDs actually
// takes effect instead of silently reusing the first one loaded.
function initFBSDK(appId) {
  return new Promise((resolve, reject) => {
    function doInit() {
      try {
        window.FB.init({ appId, cookie: true, xfbml: false, version: "v19.0" });
        resolve(window.FB);
      } catch (e) {
        reject(e);
      }
    }
    if (window.FB) {
      doInit();
      return;
    }
    window.fbAsyncInit = doInit;
    if (document.getElementById("fb-jssdk")) return; // script already loading
    const s = document.createElement("script");
    s.id = "fb-jssdk";
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Facebook SDK — check your network/App ID"));
    document.body.appendChild(s);
  });
}

function fbLogin(FB) {
  return new Promise((resolve, reject) => {
    FB.login(
      (r) => (r.authResponse ? resolve(r.authResponse) : reject(new Error("Login cancelled or permissions denied"))),
      { scope: FB_PERMISSIONS }
    );
  });
}

async function fbAPI(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`https://graph.facebook.com/v19.0/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || "Facebook API error");
  return d;
}

// ─── Mock Google sign-in ────────────────────────────────────────
// No real Google OAuth is wired up here — hook this to Firebase Auth
// or Google Identity Services if you want a real login. Google
// accounts don't have Facebook Pages attached, so users who sign in
// this way type their Page name manually on the next screen instead
// of picking from a Graph API list.
function mockGoogleLogin() {
  return Promise.resolve({
    id: "google-mock",
    name: "Google User",
    pic: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
    provider: "Google",
  });
}

// ─── AI via Claude API ────────────────────────────────────────
async function callAI(pageName, pageCat, followers, probId, probDesc) {
  const catEn = PROBLEM_CATEGORIES.find((c) => c.id === probId)?.en || probId;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `You are an expert Facebook/Meta support consultant for Cambodian content creators. Respond ONLY with valid JSON — no markdown fences, no preamble. JSON schema:
{"diagnosis":"string","severity":"critical|high|medium|low","steps":[{"title":"string","description":"string","meta_link":"url|null"}],"appeal_text":"string","tips":["string"],"estimated_resolution":"string"}`,
      messages: [
        {
          role: "user",
          content: `Page: ${pageName}\nCategory: ${pageCat}\nFollowers: ${followers}\nProblem: ${catEn}\nDetails: ${probDesc}\n\nAnalyze and provide solutions. The appeal_text must be a professional English letter to Meta Support mentioning the page name. Include specific Meta URLs in step meta_link where relevant. Mix Khmer+English in diagnosis and tips.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`AI request failed (${res.status})`);
  }

  const data = await res.json();
  const txt = (data.content || []).map((b) => b.text || "").join("");

  let parsed;
  try {
    parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("AI returned an unexpected format — please try again");
  }

  // Guard against a malformed/partial response so the UI never crashes
  return {
    diagnosis: parsed.diagnosis || "No diagnosis returned.",
    severity: ["critical", "high", "medium", "low"].includes(parsed.severity) ? parsed.severity : "medium",
    steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    appeal_text: parsed.appeal_text || "",
    tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    estimated_resolution: parsed.estimated_resolution || "",
  };
}

// ─── Subscription checkout ──────────────────────────────────────
// Posts to your own backend, which is expected to create a Stripe
// Checkout Session and return { url }.
async function createCheckoutSession(planId) {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const data = await res.json();
  if (!data.url) throw new Error(data.error || "Could not start checkout");
  return data.url;
}

// ─── Storage ──────────────────────────────────────────────────
async function load(k) {
  try {
    const r = await window.storage.get(k, false);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function save(k, v) {
  try {
    await window.storage.set(k, JSON.stringify(v), false);
  } catch {
    // best-effort; UI still works without persistence
  }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [scr, setScr] = useState("loading");
  const [appId, setAppId] = useState("");
  const [inp, setInp] = useState("");
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(null);
  const [manualName, setManualName] = useState("");
  const [manualCat, setManualCat] = useState("");
  const [cat, setCat] = useState("");
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState(null);
  const [hist, setHist] = useState([]);
  const [histItem, setHistItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [subBusy, setSubBusy] = useState(null);

  // Init
  useEffect(() => {
    (async () => {
      const [savedId, savedHist] = await Promise.all([load(FB_APP_ID_KEY), load(HISTORY_KEY)]);
      if (savedHist) setHist(savedHist);
      if (savedId) {
        setAppId(savedId);
        setInp(savedId);
        try {
          await initFBSDK(savedId);
          setScr("login");
        } catch {
          setScr("setup");
        }
      } else {
        setScr("setup");
      }
    })();
  }, []);

  // Helpers
  const go = (s) => { setErr(""); setScr(s); };
  const copy = (t) => { navigator.clipboard?.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // ── Actions ──
  const saveSetup = async () => {
    const id = inp.trim();
    if (!id) return;
    setBusy(true); setErr("");
    try {
      await initFBSDK(id);
      setAppId(id);
      await save(FB_APP_ID_KEY, id);
      go("login");
    } catch (e) {
      setErr("SDK load failed: " + e.message);
    }
    setBusy(false);
  };

  const login = async () => {
    if (!window.FB) { setErr("Facebook SDK not loaded — set your App ID first"); return; }
    setBusy(true); setErr("");
    try {
      const auth = await fbLogin(window.FB);
      const [u, p] = await Promise.all([
        fbAPI("me?fields=id,name,picture.width(80)", auth.accessToken),
        fbAPI("me/accounts?fields=id,name,category,fan_count,picture.width(100),access_token", auth.accessToken),
      ]);
      setUser({ id: u.id, name: u.name, pic: u.picture?.data?.url, provider: "Facebook" });
      setPages((p.data || []).map((x) => ({
        id: x.id, name: x.name, category: x.category || "Page",
        followers: x.fan_count || 0, pic: x.picture?.data?.url, token: x.access_token,
      })));
      go("pages");
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  // Google is a quick, lightweight sign-in only — it has no Graph API
  // access, so instead of a Pages list, the user types their Page
  // name/category manually on the next screen.
  const loginGoogle = async () => {
    setBusy(true); setErr("");
    try {
      const gUser = await mockGoogleLogin();
      setUser(gUser);
      setPages([]);
      setManualName(""); setManualCat("");
      go("manual");
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  const continueManual = () => {
    if (!manualName.trim()) { setErr("សូមបញ្ចូលឈ្មោះ Page"); return; }
    setPage({
      id: "manual-" + Date.now(),
      name: manualName.trim(),
      category: manualCat.trim() || "Facebook Page",
      followers: 0,
      pic: null,
      manual: true,
    });
    setCat(""); setDesc(""); setResult(null);
    go("describe");
  };

  const analyze = async () => {
    if (!cat) { setErr("សូមជ្រើសរើសប្រភេទបញ្ហា"); return; }
    if (!desc.trim()) { setErr("សូមពិពណ៌នាបញ្ហា"); return; }
    setBusy(true); setErr(""); go("analyzing");
    try {
      const r = await callAI(page.name, page.category, page.followers, cat, desc);
      setResult(r);
      const entry = { id: Date.now().toString(), date: new Date().toISOString(), pageName: page.name, pageId: page.id, cat, desc, result: r };
      const updated = [entry, ...hist].slice(0, 50);
      setHist(updated);
      await save(HISTORY_KEY, updated);
      go("results");
    } catch (e) {
      setErr("AI failed: " + e.message);
      go("describe");
    }
    setBusy(false);
  };

  const logout = () => {
    try { window.FB?.logout(); } catch {}
    setUser(null); setPages([]); setPage(null); setResult(null); go("login");
  };

  const changeAppId = async () => {
    setAppId("");
    setInp("");
    window.FB = undefined; // force a real re-init next time an App ID is saved
    await save(FB_APP_ID_KEY, "");
    go("setup");
  };

  const handleSubscribe = async (planId) => {
    setSubBusy(planId); setErr("");
    try {
      const url = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (e) {
      setErr("Subscription failed: " + e.message);
    }
    setSubBusy(null);
  };

  // ═══ RENDER ═══
  return (
    <div style={R.root}>
      <style>{CSS}</style>

      {/* ─── LOADING ─── */}
      {scr === "loading" && (
        <div style={R.center}><div className="spin" /><p style={{ color: "#64748b", marginTop: 16, fontSize: 13 }}>Loading...</p></div>
      )}

      {/* ─── SETUP ─── */}
      {scr === "setup" && (
        <div style={R.center}>
          <div style={R.box}>
            <div style={{ fontSize: 44, animation: "bob 2.5s ease-in-out infinite" }}>🛠️</div>
            <h1 style={R.brand}>Khmer AI</h1>
            <p style={R.brandSub}>Facebook Fixer</p>
            <div className="panel" style={{ marginTop: 24, width: "100%" }}>
              <label className="lbl">Facebook App ID</label>
              <input className="field mono" placeholder="e.g. 1234567890123456" value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveSetup()} />
              <p className="hint">
                បង្កើត App នៅ <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="lnk">developers.facebook.com</a>
              </p>
              <div className="steps-box">
                <p className="steps-title">📋 Setup:</p>
                {["Create FB App (Business type)", "Add Facebook Login product", "Set OAuth Redirect URI", "Request pages_show_list permission", "Paste App ID above"].map((s, i) => (
                  <div key={i} className="step-mini"><span className="dot">{i + 1}</span><span>{s}</span></div>
                ))}
              </div>
              <button className="btn-blue full" onClick={saveSetup} disabled={busy || !inp.trim()}>
                {busy ? "Loading..." : "✅ Save & Continue"}
              </button>
              <button className="btn-text" style={{ marginTop: 10 }} onClick={() => go("login")}>
                Skip for now — sign in with Google instead
              </button>
            </div>
            {err && <div className="err">{err}</div>}
          </div>
        </div>
      )}

      {/* ─── LOGIN ─── */}
      {scr === "login" && (
        <div style={R.center}>
          <div style={R.box}>
            <div style={{ fontSize: 44, animation: "bob 2.5s ease-in-out infinite" }}>🛠️</div>
            <h1 style={R.brand}>Khmer AI</h1>
            <p style={R.brandSub}>Facebook Fixer</p>
            <p className="tagline">AI ជួយពិនិត្យ Page / Monetization<br />និងប្រាប់វិធីកែបញ្ហា Facebook</p>

            <button className="btn-fb full" onClick={login} disabled={busy || !appId} style={{ marginTop: 24 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              {busy ? "Connecting..." : "Login with Facebook"}
            </button>
            {!appId && <p className="hint" style={{ marginTop: 6 }}>Set a Facebook App ID first for full Page access.</p>}

            <button className="btn-google full" onClick={loginGoogle} disabled={busy} style={{ marginTop: 10 }}>
              <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" width="16" alt="G" />
              {busy ? "Connecting..." : "Sign in with Google"}
            </button>
            <p className="hint" style={{ marginTop: 4 }}>Google sign-in: enter your Page name manually (no Graph API access).</p>

            {hist.length > 0 && <button className="btn-ghost full" style={{ marginTop: 10 }} onClick={() => go("history")}>📋 History ({hist.length})</button>}
            <button className="btn-text" style={{ marginTop: 16 }} onClick={changeAppId}>⚙️ Change App ID</button>
            {appId && <p style={{ color: "#3b4a63", fontSize: 10, marginTop: 10 }}>🔒 Private — {appId.slice(0, 6)}...</p>}
            {err && <div className="err">{err}</div>}
          </div>
        </div>
      )}

      {/* ─── MANUAL PAGE ENTRY (Google sign-in path) ─── */}
      {scr === "manual" && (
        <div style={R.center}>
          <div style={R.box}>
            <div className="panel" style={{ width: "100%" }}>
              <div className="row-center" style={{ marginBottom: 14 }}>
                {user?.pic && <img src={user.pic} className="avatar" alt="" />}
                <div>
                  <p className="name">{user?.name}</p>
                  <p className="muted sm">✓ ភ្ជាប់តាម {user?.provider}</p>
                </div>
              </div>
              <label className="lbl">ឈ្មោះ Page — Page Name</label>
              <input className="field" placeholder="e.g. My Business Page" value={manualName} onChange={(e) => setManualName(e.target.value)} />
              <label className="lbl" style={{ marginTop: 12 }}>ប្រភេទ — Category (optional)</label>
              <input className="field" placeholder="e.g. Media / Retail / Creator" value={manualCat} onChange={(e) => setManualCat(e.target.value)} />
              {err && <div className="err">{err}</div>}
              <button className="btn-blue full" style={{ marginTop: 16 }} onClick={continueManual}>Continue →</button>
              <button className="btn-text" style={{ marginTop: 10 }} onClick={logout}>← ត្រលប់ Login</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAGES ─── */}
      {scr === "pages" && (
        <div style={R.page}>
          <div className="top-bar">
            <div>
              <h1 className="top-title">📄 ជ្រើសរើស Page</h1>
              <p className="top-sub">សួស្តី {user?.name}</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="icon-btn" onClick={() => go("subscribe")} title="Subscription">💳</button>
              {hist.length > 0 && <button className="icon-btn" onClick={() => go("history")}>📋</button>}
              <button className="icon-btn" onClick={logout}>🚪</button>
            </div>
          </div>
          {pages.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ fontSize: 28 }}>🤷</p>
              <p className="muted" style={{ marginTop: 8 }}>No pages found — make sure you manage at least one Facebook Page</p>
              <button className="btn-blue" style={{ marginTop: 14 }} onClick={login}>🔄 Retry</button>
            </div>
          ) : (
            <div className="col-gap-10">
              {pages.map((p, i) => (
                <div key={p.id} className="panel panel-click" onClick={() => { setPage(p); setCat(""); setDesc(""); setResult(null); go("describe"); }} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="row-center">
                    {p.pic ? <img src={p.pic} className="avatar" alt="" /> : <div className="avatar-fb">📄</div>}
                    <div style={{ flex: 1 }}>
                      <h3 className="name">{p.name}</h3>
                      <p className="muted sm">{p.category} • {p.followers.toLocaleString()} followers</p>
                    </div>
                    <span className="chevron">›</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── SUBSCRIBE ─── */}
      {scr === "subscribe" && (
        <div style={R.page}>
          <button className="back" onClick={() => go(pages.length ? "pages" : "describe")}>← ត្រលប់</button>
          <h2 className="top-title" style={{ margin: "10px 0 14px" }}>💳 ជាវកញ្ចប់ប្រចាំខែ</h2>
          <p className="muted sm" style={{ marginBottom: 16 }}>Subscription — unlock more AI analyses per month</p>
          <div className="col-gap-10">
            {SUBSCRIPTION_PLANS.map((p) => (
              <div key={p.id} className="panel" style={{ borderColor: p.color + "55" }}>
                <div className="row-between">
                  <div>
                    <h3 className="name">{p.label}</h3>
                    <p className="muted sm">{p.price}</p>
                  </div>
                  <button
                    className="btn-blue"
                    style={{ background: p.color, backgroundImage: "none" }}
                    onClick={() => handleSubscribe(p.id)}
                    disabled={subBusy === p.id}
                  >
                    {subBusy === p.id ? "..." : "ជាវ Subscribe"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {err && <div className="err">{err}</div>}
        </div>
      )}

      {/* ─── DESCRIBE ─── */}
      {scr === "describe" && page && (
        <div style={R.page}>
          <button className="back" onClick={() => go(pages.length ? "pages" : "manual")}>← ត្រលប់</button>
          <div className="panel" style={{ marginTop: 10, marginBottom: 18 }}>
            <div className="row-center">
              {page.pic ? <img src={page.pic} className="avatar" alt="" /> : <div className="avatar-fb">📄</div>}
              <div>
                <h2 className="name">{page.name}</h2>
                <p className="muted sm">{page.category} • {page.followers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <h2 className="section-title">🔍 ពិពណ៌នាបញ្ហា</h2>
          <label className="lbl">ប្រភេទបញ្ហា — Problem Type</label>
          <div className="cat-grid">
            {PROBLEM_CATEGORIES.map((c) => (
              <button key={c.id} className={`cat-chip ${cat === c.id ? "cat-on" : ""}`} onClick={() => setCat(c.id)}>
                <span className="cat-icon">{c.icon}</span>
                <span className="cat-text">{c.label}</span>
              </button>
            ))}
          </div>

          <label className="lbl" style={{ marginTop: 18 }}>ពិពណ៌នាលម្អិត — Details</label>
          <textarea className="ta" rows={5} placeholder="ឧទាហរណ៍: Monetization បិទតាំងពីខែមុន ក្រោយវីដេអូមួយត្រូវរាយការណ៍..." value={desc} onChange={(e) => setDesc(e.target.value)} />
          <p className="hint" style={{ marginTop: 4 }}>ខ្មែរ ឬ English ក៏បាន</p>

          {err && <div className="err">{err}</div>}

          <button className="btn-blue full" style={{ marginTop: 18 }} onClick={analyze} disabled={!cat || !desc.trim()}>
            🤖 AI Analyze — វិភាគបញ្ហា
          </button>
        </div>
      )}

      {/* ─── ANALYZING ─── */}
      {scr === "analyzing" && (
        <div style={R.center}>
          <div style={{ textAlign: "center" }}>
            <div className="spin" />
            <h2 style={{ color: "#f1f5f9", fontSize: 17, marginTop: 20, fontWeight: 600 }}>🤖 AI កំពុងវិភាគ...</h2>
            <p className="muted" style={{ marginTop: 8 }}>{page?.name}</p>
            <p style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{PROBLEM_CATEGORIES.find((c) => c.id === cat)?.en}</p>
          </div>
        </div>
      )}

      {/* ─── RESULTS ─── */}
      {scr === "results" && result && (
        <div style={R.page}>
          <button className="back" onClick={() => go("describe")}>← វិភាគម្តងទៀត</button>
          <div className="row-between" style={{ margin: "10px 0 16px" }}>
            <div>
              <h1 className="top-title">📊 លទ្ធផលវិភាគ</h1>
              <p className="muted sm">{page?.name}</p>
            </div>
            <span className={`badge-${result.severity || "medium"}`}>{(result.severity || "MEDIUM").toUpperCase()}</span>
          </div>

          {/* Diagnosis */}
          <div className="panel glow" style={{ marginBottom: 12 }}>
            <h3 className="h-blue">🧠 AI Diagnosis</h3>
            <p className="body">{result.diagnosis}</p>
            {result.estimated_resolution && <p className="est">⏱ {result.estimated_resolution}</p>}
          </div>

          {/* Steps */}
          {result.steps?.length > 0 && (
            <div className="panel" style={{ marginBottom: 12 }}>
              <h3 className="h-white">📋 ជំហានដោះស្រាយ</h3>
              {result.steps.map((s, i) => (
                <div key={i} className="fix-step">
                  <div className="fix-num">{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <p className="fix-title">{s.title}</p>
                    <p className="fix-desc">{s.description}</p>
                    {s.meta_link && s.meta_link !== "null" && (
                      <a href={s.meta_link} target="_blank" rel="noreferrer" className="fix-link">🔗 Open in Meta →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {result.tips?.length > 0 && (
            <div className="panel" style={{ marginBottom: 12 }}>
              <h3 className="h-green">💡 Tips</h3>
              {result.tips.map((t, i) => <p key={i} className="tip-line">• {t}</p>)}
            </div>
          )}

          {/* Actions */}
          <div className="col-gap-8" style={{ marginBottom: 12 }}>
            <button className="btn-blue full" onClick={() => go("appeal")}>✍️ View & Copy Appeal Text</button>
            <a href={META_LINKS.appeal} target="_blank" rel="noreferrer" className="btn-outline full">🔗 Meta Support Center</a>
            <a href={META_LINKS.page_quality} target="_blank" rel="noreferrer" className="btn-outline full">📊 Page Quality Dashboard</a>
          </div>
          <button className="btn-ghost full" onClick={() => go(pages.length ? "pages" : "manual")}>← Check Another Page</button>
        </div>
      )}

      {/* ─── APPEAL ─── */}
      {scr === "appeal" && result && (
        <div style={R.page}>
          <button className="back" onClick={() => go("results")}>← ត្រលប់</button>
          <div style={{ margin: "10px 0 14px" }}>
            <h2 className="top-title">✍️ Appeal Text</h2>
            <p className="muted sm">សំណើអុទ្ធរណ៍ — {page?.name}</p>
          </div>

          <textarea className="ta" rows={14} value={result.appeal_text || ""} onChange={(e) => setResult({ ...result, appeal_text: e.target.value })} style={{ minHeight: 260 }} />

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className={copied ? "btn-green full" : "btn-blue full"} onClick={() => copy(result.appeal_text || "")}>
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
            <button className="btn-warn full" onClick={() => go("describe")}>🔄 Re-analyze</button>
          </div>

          <div className="panel" style={{ marginTop: 14 }}>
            <h4 className="h-amber sm">📌 របៀបប្រើ</h4>
            {["Copy appeal text", "Open Meta Support link below", "Find 'Request Review' or 'Appeal'", "Paste text & submit", "Wait 1–7 business days"].map((s, i) => (
              <div key={i} className="how-step"><span className="how-num">{i + 1}.</span>{s}</div>
            ))}
          </div>

          <div className="col-gap-8" style={{ marginTop: 12 }}>
            <a href={META_LINKS.appeal} target="_blank" rel="noreferrer" className="btn-outline full">🔗 Submit Appeal</a>
            <a href={META_LINKS.monetization} target="_blank" rel="noreferrer" className="btn-outline full">💰 Monetization Settings</a>
            <a href={META_LINKS.copyright} target="_blank" rel="noreferrer" className="btn-outline full">©️ IP Center</a>
          </div>
        </div>
      )}

      {/* ─── HISTORY ─── */}
      {scr === "history" && !histItem && (
        <div style={R.page}>
          <button className="back" onClick={() => go(user ? (pages.length ? "pages" : "manual") : "login")}>← ត្រលប់</button>
          <h2 className="top-title" style={{ margin: "10px 0 14px" }}>📋 ប្រវត្តិ — History ({hist.length})</h2>
          {hist.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: 36 }}><p className="muted">No history yet</p></div>
          ) : (
            <div className="col-gap-10">
              {hist.map((h, i) => (
                <div key={h.id} className="panel panel-click" onClick={() => setHistItem(h)} style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="row-between">
                    <div>
                      <h3 className="name">{h.pageName}</h3>
                      <p className="muted sm">{PROBLEM_CATEGORIES.find((c) => c.id === h.cat)?.en || h.cat}</p>
                      <p style={{ color: "#475569", fontSize: 10, marginTop: 3 }}>
                        {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`badge-${h.result?.severity || "medium"}`}>{(h.result?.severity || "?").toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hist.length > 0 && (
            <button className="btn-ghost full" style={{ marginTop: 18, color: "#ef4444" }} onClick={async () => { if (window.confirm("Clear all history?")) { setHist([]); await save(HISTORY_KEY, []); } }}>
              🗑️ Clear History
            </button>
          )}
        </div>
      )}

      {/* ─── HISTORY DETAIL ─── */}
      {scr === "history" && histItem && (
        <div style={R.page}>
          <button className="back" onClick={() => setHistItem(null)}>← ត្រលប់</button>
          <div style={{ margin: "10px 0 14px" }}>
            <h2 className="top-title">{histItem.pageName}</h2>
            <p className="muted sm">{PROBLEM_CATEGORIES.find((c) => c.id === histItem.cat)?.en} — {new Date(histItem.date).toLocaleDateString()}</p>
          </div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h3 className="lbl">Problem</h3>
            <p className="body">{histItem.desc}</p>
          </div>
          {histItem.result && (
            <>
              <div className="panel glow" style={{ marginBottom: 12 }}>
                <h3 className="h-blue">🧠 Diagnosis</h3>
                <p className="body">{histItem.result.diagnosis}</p>
              </div>
              {histItem.result.steps?.length > 0 && (
                <div className="panel" style={{ marginBottom: 12 }}>
                  <h3 className="h-white">📋 Steps</h3>
                  {histItem.result.steps.map((s, i) => (
                    <div key={i} className="fix-step">
                      <div className="fix-num">{i + 1}</div>
                      <div><p className="fix-title">{s.title}</p><p className="fix-desc">{s.description}</p></div>
                    </div>
                  ))}
                </div>
              )}
              {histItem.result.appeal_text && (
                <button className={copied ? "btn-green full" : "btn-blue full"} onClick={() => copy(histItem.result.appeal_text)}>
                  {copied ? "✅ Copied!" : "📋 Copy Appeal Text"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes spin-k{to{transform:rotate(360deg)}}
@keyframes pulse-k{0%,100%{opacity:1}50%{opacity:.35}}

.spin{width:44px;height:44px;margin:0 auto;border:3.5px solid #1e293b;border-top-color:#1877F2;border-radius:50%;animation:spin-k .7s linear infinite}

/* Buttons */
.btn-blue{background:linear-gradient(135deg,#1877F2,#0d5bbd);color:#fff;border:none;padding:13px 22px;border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .22s;display:flex;align-items:center;gap:8px;justify-content:center}
.btn-blue:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 22px rgba(24,119,242,.32)}
.btn-blue:disabled{opacity:.45;cursor:not-allowed}
.btn-fb{background:linear-gradient(135deg,#1877F2,#0d5bbd);color:#fff;border:none;padding:14px 26px;border-radius:12px;font-size:14.5px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .22s;display:flex;align-items:center;gap:10px;justify-content:center}
.btn-fb:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(24,119,242,.32)}
.btn-fb:disabled{opacity:.45;cursor:not-allowed}
.btn-google{background:#ffffff;color:#1f2937;border:1px solid #2d3a4f;padding:13px 22px;border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s;display:flex;align-items:center;gap:8px;justify-content:center}
.btn-google:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.18)}
.btn-google:disabled{opacity:.45;cursor:not-allowed}
.btn-ghost{background:transparent;color:#94a3b8;border:1px solid #2d3a4f;padding:10px 18px;border-radius:10px;font-size:12.5px;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s}
.btn-ghost:hover{border-color:#60a5fa;color:#60a5fa}
.btn-outline{display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;color:#94a3b8;border:1px solid #2d3a4f;padding:11px 18px;border-radius:10px;font-size:12.5px;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s;text-decoration:none;text-align:center}
.btn-outline:hover{border-color:#1877F2;color:#60a5fa;background:rgba(24,119,242,.04)}
.btn-green{background:#10b981!important;color:#fff;border:none;padding:13px 22px;border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif}
.btn-warn{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;padding:13px 22px;border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s}
.btn-text{background:none;border:none;color:#64748b;font-size:11px;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:color .15s}
.btn-text:hover{color:#94a3b8}
.icon-btn{background:transparent;color:#64748b;border:1px solid #1e293b;width:34px;height:34px;border-radius:9px;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.icon-btn:hover{border-color:#475569;color:#94a3b8}
.full{width:100%}

/* Panels */
.panel{background:#1e293b;border:1px solid #2d3a4f;border-radius:13px;padding:16px;transition:all .22s;animation:up .35s ease both}
.panel.glow{border-color:rgba(24,119,242,.28);box-shadow:0 0 18px rgba(24,119,242,.05)}
.panel-click{cursor:pointer}
.panel-click:hover{border-color:#1877F2;transform:translateY(-2px);box-shadow:0 5px 20px rgba(0,0,0,.22)}

/* Badges */
.badge-critical{display:inline-flex;padding:3px 9px;border-radius:18px;font-size:9.5px;font-weight:700;letter-spacing:.4px;background:rgba(239,68,68,.14);color:#ef4444}
.badge-high{display:inline-flex;padding:3px 9px;border-radius:18px;font-size:9.5px;font-weight:700;letter-spacing:.4px;background:rgba(245,158,11,.14);color:#f59e0b}
.badge-medium{display:inline-flex;padding:3px 9px;border-radius:18px;font-size:9.5px;font-weight:700;letter-spacing:.4px;background:rgba(59,130,246,.14);color:#3b82f6}
.badge-low{display:inline-flex;padding:3px 9px;border-radius:18px;font-size:9.5px;font-weight:700;letter-spacing:.4px;background:rgba(107,114,128,.14);color:#9ca3af}

/* Category chips */
.cat-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.cat-chip{background:#0f172a;border:1px solid #2d3a4f;border-radius:10px;color:#94a3b8;padding:10px 12px;font-size:12px;text-align:left;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s;display:flex;align-items:center;gap:7px;overflow:hidden}
.cat-chip:hover{border-color:#475569;color:#e2e8f0}
.cat-on{border-color:#1877F2!important;color:#60a5fa!important;background:rgba(24,119,242,.07)!important}
.cat-icon{font-size:15px;flex-shrink:0}
.cat-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Forms */
.ta{width:100%;background:#0f172a;border:1px solid #2d3a4f;border-radius:11px;color:#e2e8f0;padding:13px;font-size:12.5px;font-family:'Kantumruy Pro',sans-serif;line-height:1.7;resize:vertical;outline:none;transition:border-color .18s}
.ta:focus{border-color:#1877F2}
.ta::placeholder{color:#3b4a63}
.field{width:100%;background:#0f172a;border:1px solid #2d3a4f;border-radius:10px;color:#e2e8f0;padding:11px 13px;font-size:13px;outline:none;font-family:'Kantumruy Pro',sans-serif;transition:border-color .18s}
.field:focus{border-color:#1877F2}
.field.mono{font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:.5px}
.lbl{display:block;color:#94a3b8;font-size:11.5px;font-weight:600;margin-bottom:7px;letter-spacing:.2px}
.hint{color:#475569;font-size:10.5px;line-height:1.5}
.lnk{color:#60a5fa;text-decoration:none}
.err{margin-top:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:9px;padding:9px 12px;color:#fca5a5;font-size:11.5px;line-height:1.5;width:100%}

/* Typography helpers */
.name{color:#f1f5f9;font-size:14.5px;font-weight:600}
.body{color:#e2e8f0;font-size:13px;line-height:1.7}
.muted{color:#94a3b8;font-size:13px}
.sm{font-size:11.5px!important}
.tagline{text-align:center;color:#64748b;font-size:13px;line-height:1.8;margin-top:14px}
.h-blue{color:#60a5fa;font-size:12.5px;font-weight:600;margin-bottom:8px}
.h-white{color:#e2e8f0;font-size:12.5px;font-weight:600;margin-bottom:9px}
.h-green{color:#10b981;font-size:12.5px;font-weight:600;margin-bottom:8px}
.h-amber{color:#f59e0b;font-size:12px;font-weight:600;margin-bottom:7px}
.est{color:#f59e0b;font-size:11.5px;margin-top:9px}
.section-title{color:#e2e8f0;font-size:14.5px;font-weight:600;margin-bottom:12px}

/* Layout */
.row-center{display:flex;align-items:center;gap:12px}
.row-between{display:flex;justify-content:space-between;align-items:flex-start}
.col-gap-10{display:flex;flex-direction:column;gap:10px}
.col-gap-8{display:flex;flex-direction:column;gap:8px}
.top-bar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.top-title{color:#f1f5f9;font-size:16.5px;font-weight:700}
.top-sub{color:#94a3b8;font-size:11.5px;margin-top:2px}
.chevron{color:#3b4a63;font-size:20px}

/* Page avatar */
.avatar{width:44px;height:44px;border-radius:11px;object-fit:cover;background:#334155}
.avatar-fb{width:44px;height:44px;border-radius:11px;background:#334155;display:flex;align-items:center;justify-content:center;font-size:20px}

/* Navigation */
.back{display:inline-flex;align-items:center;gap:4px;color:#94a3b8;font-size:12.5px;cursor:pointer;border:none;background:none;font-family:'Kantumruy Pro',sans-serif;padding:5px 0;transition:color .15s}
.back:hover{color:#60a5fa}

/* Setup steps */
.steps-box{background:#0f172a;border-radius:9px;padding:12px;margin-bottom:14px}
.steps-title{color:#94a3b8;font-size:11px;font-weight:600;margin-bottom:7px}
.step-mini{display:flex;align-items:center;gap:8px;margin-bottom:5px;color:#cbd5e1;font-size:11px}
.dot{width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#1877F2,#0d5bbd);color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}

/* Fix steps */
.fix-step{display:flex;gap:11px;padding:10px 0;border-bottom:1px solid #162032}
.fix-step:last-child{border-bottom:none}
.fix-num{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#1877F2,#0d5bbd);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0;margin-top:1px}
.fix-title{color:#f1f5f9;font-size:12.5px;font-weight:600}
.fix-desc{color:#94a3b8;font-size:11.5px;margin-top:3px;line-height:1.55}
.fix-link{display:inline-block;margin-top:5px;color:#60a5fa;font-size:10.5px;text-decoration:none}
.fix-link:hover{text-decoration:underline}

/* Tips */
.tip-line{color:#cbd5e1;font-size:12px;line-height:1.55;margin-bottom:5px}

/* How-to */
.how-step{display:flex;gap:6px;margin-bottom:4px;color:#94a3b8;font-size:11.5px;line-height:1.5}
.how-num{color:#60a5fa;font-weight:700;min-width:16px}
`;

// ─── Layout Styles ────────────────────────────────────────────
const R = {
  root: { minHeight: "100vh", background: "linear-gradient(170deg,#080d1c 0%,#0f172a 50%,#111827 100%)", fontFamily: "'Kantumruy Pro',sans-serif", color: "#e2e8f0" },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, flexDirection: "column" },
  box: { display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 370, width: "100%" },
  brand: { fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#60a5fa,#1877F2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-.4px" },
  brandSub: { fontSize: 15, fontWeight: 400, color: "#94a3b8", marginTop: 1 },
  page: { maxWidth: 540, margin: "0 auto", padding: "14px 14px 44px", animation: "up .3s ease" },
};
