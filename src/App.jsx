import { useEffect, useRef, useState } from "react";
import AIChatAssistant from "./AIChatAssistant";

// ─── Access Codes → Credit Amounts ────────────────────────────
// Add a new line here each time a customer pays.
// NEVER ask for Facebook password, OTP, cookie, or token.
const CODE_CREDITS = {
  "CLIENT-001": 1,   // Basic   — $9
  "CLIENT-002": 2,   // Standard — $15
  "CLIENT-003": 3,   // Pro      — $21
  "CLIENT-004": 5,   // VIP      — $29
  "CLIENT-005": 8,   // Business — $39
  "CLIENT-006": 15,  // Agency   — $59
};
const VALID_CODES = Object.keys(CODE_CREDITS);

// ─── Pricing packages ─────────────────────────────────────────
const PACKAGES = [
  {
    id: "basic",    name: "Basic",    price: "$9",  credits: 1,
    color: "#3b82f6", best: false,
    features: ["1 AI Diagnosis", "1 Appeal Letter", "Step-by-step Fix", "Meta Support Links"],
  },
  {
    id: "standard", name: "Standard", price: "$15", credits: 2,
    color: "#8b5cf6", best: false,
    features: ["2 AI Diagnoses", "2 Pages / Profiles", "2 Appeal Letters", "Step-by-step Fix"],
  },
  {
    id: "pro",      name: "Pro",      price: "$21", credits: 3,
    color: "#f59e0b", best: true,
    features: ["3 AI Diagnoses", "Detailed advice", "Multiple appeal versions", "Priority guidance"],
  },
  {
    id: "vip",      name: "VIP",      price: "$29", credits: 5,
    color: "#10b981", best: false,
    features: ["5 AI Diagnoses", "Multiple pages", "Ads + creator issues", "Max coverage"],
  },
  {
    id: "business", name: "Business", price: "$39", credits: 8,
    color: "#ef4444", best: false,
    features: ["8 AI Diagnoses", "Full business suite", "All problem types", "Team / agency use"],
  },
  {
    id: "agency",   name: "Agency",   price: "$59", credits: 15,
    color: "#a855f7", best: false,
    features: ["15 AI Diagnoses", "Unlimited pages / profiles", "Bulk case handling", "Best value per credit"],
  },
];

// ─── Payment / contact info ────────────────────────────────────
const PAYMENT = {
  methods:    "ABA / ACLEDA / Bank Transfer / QR Code",
  name:       "PHALY PHOLLET",
  phone:      "0975874565",
  facebook:   "Khmer AI",
  facebookUrl:"https://www.facebook.com/profile.php?id=61567580101437",
};

// ─── Constants ────────────────────────────────────────────────
const HISTORY_KEY = "fbfix:hist4";
const API_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:3000";

const META_LINKS = {
  appeal:        "https://www.facebook.com/help/contact/260749603972907",
  support_inbox: "https://www.facebook.com/support",
  page_quality:  "https://www.facebook.com/business/help/page-quality",
  monetization:  "https://www.facebook.com/creators/tools/monetization",
  copyright:     "https://www.facebook.com/support/intellectual-property",
  ads:           "https://www.facebook.com/business/help/2032702440326605",
  creator_studio:"https://business.facebook.com/creatorstudio",
  business_help: "https://www.facebook.com/business/help",
  verification:  "https://www.facebook.com/id",
};

const PROBLEMS = [
  { id: "monetization_off",     icon: "💰", label: "Monetization បិទ",          en: "Monetization Disabled" },
  { id: "monetization_limited", icon: "⚠️", label: "Monetization កំណត់",        en: "Monetization Limited" },
  { id: "copyright",            icon: "©️", label: "រំលោភលិខសិទ្ធិ",            en: "Copyright Strike" },
  { id: "page_restricted",      icon: "🔒", label: "Page ដាក់កំហិត",            en: "Page Restricted" },
  { id: "ad_rejected",          icon: "🚫", label: "Ad បដិសេធ",                en: "Ad Rejected" },
  { id: "ad_account",           icon: "📛", label: "Ad Account រឹតបន្តឹង",     en: "Ad Account Restricted" },
  { id: "community",            icon: "📋", label: "បំពានគោលការណ៍",            en: "Community Guidelines" },
  { id: "identity",             icon: "🪪", label: "ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ",    en: "Identity Verification" },
  { id: "reach_down",           icon: "📉", label: "Reach ធ្លាក់",              en: "Reach / Engagement Drop" },
  { id: "payment",              icon: "💳", label: "Payment មានបញ្ហា",          en: "Payment Issue" },
  { id: "other",                icon: "❓", label: "បញ្ហាផ្សេងៗ",              en: "Other" },
];

const PAGE_CATEGORIES = [
  "Entertainment","News","Education","Gaming","Comedy",
  "Music","Food & Drink","Travel","Fashion","Tech",
  "Health","Sports","Business","Personal Blog","Other",
];

// ─── LocalStorage wrapper ─────────────────────────────────────
const store = {
  get(k)    { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  creditKey: code => `fbfix:credits:${code}`,
};

// ─── Credit helpers ───────────────────────────────────────────
function loadCredits(code) {
  const key = store.creditKey(code);
  const saved = store.get(key);
  if (saved !== null) return saved;
  const initial = CODE_CREDITS[code] ?? 0;
  store.set(key, initial);
  return initial;
}
function saveCredits(code, n) {
  store.set(store.creditKey(code), n);
}

// ─── Appeal letter builder ────────────────────────────────────
function buildAppealLetter(pageName, pageCat, followers, probId, probDesc) {
  const problem = PROBLEMS.find(p => p.id === probId) || PROBLEMS[PROBLEMS.length - 1];
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `Dear Meta Support Team,

I am writing to formally appeal the "${problem.en}" issue affecting my Facebook Page/Profile "${pageName}" (Category: ${pageCat || "General"}, Followers: ${followers || "N/A"}).

Issue Description:
${probDesc || `I have been experiencing "${problem.en}" and would like to request a review.`}

About My Page/Profile:
My page "${pageName}" creates original, authentic content for our community of followers. We are fully committed to following all of Facebook's Community Standards and Partner Monetization Policies.

I believe this situation warrants a careful manual review. We have worked hard to build a legitimate, policy-compliant presence on the platform and take all guidelines seriously.

Steps I Have Already Taken:
- Reviewed all content against Facebook's Community Standards
- Removed any borderline content proactively
- Implemented stricter internal content review processes going forward

I respectfully request that your team review this decision and restore full functionality to my page/account. I welcome any guidance on specific steps I should take to resolve this matter.

Thank you sincerely for your time and consideration.

Best regards,
${pageName} Admin
Date: ${date}`;
}

// ─── Local AI diagnosis templates ─────────────────────────────
function generateLocalAnalysis(pageName, pageCat, followers, probId, probDesc) {
  const templates = {
    monetization_off: {
      severity: "high",
      diagnosis: `Your Facebook Page "${pageName}" has had monetization disabled. This commonly occurs due to content policy violations, inauthentic engagement, or failing Meta's Partner Monetization Policies. Pages in the ${pageCat || "General"} category are frequently reviewed for content authenticity.`,
      root_cause: "Monetization disabled due to a content policy violation or inauthentic engagement pattern detected by Meta's automated review system.",
      steps: [
        { title: "Check Page Quality Tab", description: "Go to your Page → More → Page Quality to see specific violations flagged by Meta.", meta_link: META_LINKS.page_quality },
        { title: "Review Monetization Eligibility", description: "Visit Creator Studio → Monetization to check your current eligibility status.", meta_link: META_LINKS.creator_studio },
        { title: "Submit Official Appeal", description: "Use Meta's official appeal form to request a human review of the decision.", meta_link: META_LINKS.appeal },
        { title: "Clean Your Content", description: "Remove or unpublish any content that might violate Meta's Partner Monetization Policies.", meta_link: null },
        { title: "Wait for Review", description: "After submitting, allow 3–7 business days for Meta's team to process your appeal.", meta_link: null },
      ],
      do_list: ["Post original, authentic content", "Engage genuinely with your audience", "Keep contact information updated", "Review all content against Meta policies"],
      dont_list: ["Buy fake followers or engagement", "Post misleading or clickbait content", "Share copyrighted material without license", "Use automation tools that violate ToS"],
      tips: ["Document your original content creation process as evidence", "Build a consistent posting schedule with high-quality content", "Engage authentically — reply to real comments"],
      estimated_resolution: "3–7 business days", success_rate: "60–75%",
    },
    monetization_limited: {
      severity: "medium",
      diagnosis: `Monetization on "${pageName}" has been partially limited — some content may not show ads or may earn reduced revenue. This usually means specific videos or posts were flagged as not meeting advertiser-friendly guidelines.`,
      root_cause: "Some content flagged as non-advertiser-friendly, reducing monetization eligibility for those posts.",
      steps: [
        { title: "Check Affected Content", description: "Review which specific videos are limited in Creator Studio → Monetization.", meta_link: META_LINKS.creator_studio },
        { title: "Review Advertiser Guidelines", description: "Ensure all content meets Meta's Advertiser-Friendly Content Guidelines.", meta_link: META_LINKS.monetization },
        { title: "Appeal Limited Posts", description: "Request individual video reviews for posts you believe were incorrectly limited.", meta_link: META_LINKS.appeal },
        { title: "Adjust Content Strategy", description: "Create more brand-safe, advertiser-friendly content going forward.", meta_link: null },
      ],
      do_list: ["Create family-friendly content", "Add proper content warnings where needed", "Maintain consistent upload schedule", "Avoid controversial topics"],
      dont_list: ["Use strong language or graphic content", "Post politically divisive content", "Include unlicensed third-party material", "Ignore Meta's content warnings"],
      tips: ["Review Meta's Advertiser-Friendly Content Guidelines thoroughly", "Diversify revenue beyond in-stream ads", "Short-form Reels often have fewer restrictions"],
      estimated_resolution: "3–7 business days", success_rate: "65–80%",
    },
    copyright: {
      severity: "high",
      diagnosis: `Your page "${pageName}" has received a copyright strike. Meta's Content ID system or a rights holder has flagged content for intellectual property violations. This can affect both monetization and overall page reach.`,
      root_cause: "Copyright content detected — video, music, or images owned by third parties were shared without proper licensing.",
      steps: [
        { title: "Identify Flagged Content", description: "Check Page Quality and notifications to find which specific content was flagged.", meta_link: META_LINKS.page_quality },
        { title: "Remove or Replace Content", description: "Delete the infringing post or replace copyrighted music/video with royalty-free alternatives.", meta_link: null },
        { title: "File Counter-Notification", description: "If you believe the claim is incorrect, submit a counter-notification through Meta's IP portal.", meta_link: META_LINKS.copyright },
        { title: "Appeal the Strike", description: "Use the official appeal form to dispute the copyright claim with evidence.", meta_link: META_LINKS.appeal },
      ],
      do_list: ["Use royalty-free music and images", "Create fully original video content", "Get proper licenses for third-party material", "Document your content creation process"],
      dont_list: ["Re-upload removed content", "Dispute valid copyright claims falsely", "Use popular commercial songs without license", "Download and re-upload others' videos"],
      tips: ["Use Facebook's free Sound Collection for licensed music", "Creative Commons content is safe — check the license type", "When in doubt, create original content"],
      estimated_resolution: "5–14 business days", success_rate: "45–65%",
    },
    page_restricted: {
      severity: "critical",
      diagnosis: `Page "${pageName}" has been restricted by Meta. Restricted pages may lose the ability to post, advertise, or reach their audience. This typically results from repeated Community Standards violations or suspicious activity.`,
      root_cause: "Page restrictions applied due to repeated Community Standards violations or suspicious activity patterns detected by Meta.",
      steps: [
        { title: "Review Restriction Details", description: "Check Support Inbox and Page Quality for the specific reason for restriction.", meta_link: META_LINKS.support_inbox },
        { title: "Remove Violating Content", description: "Identify and remove any content that violates Meta's Community Standards.", meta_link: null },
        { title: "Submit Appeal", description: "Request a review of the restriction through the official appeal form.", meta_link: META_LINKS.appeal },
        { title: "Secure Your Account", description: "Enable two-factor authentication and audit all admin accounts for unauthorized access.", meta_link: null },
      ],
      do_list: ["Appeal professionally and politely", "Provide clear explanation of your page purpose", "Show proof of legitimate business activity", "Improve content quality going forward"],
      dont_list: ["Create a duplicate page to bypass restrictions", "Continue posting during active restriction", "Use prohibited automation tools", "Ignore Meta's official communications"],
      tips: ["Be patient and professional in all Meta communications", "Keep detailed records of your content and business activities", "Consider help from an official Meta Business Partner"],
      estimated_resolution: "7–21 business days", success_rate: "40–60%",
    },
    ad_rejected: {
      severity: "medium",
      diagnosis: `Your advertisement was rejected by Meta's ad review system. Ads are reviewed automatically and manually against Meta's Advertising Policies. The ${pageCat || "General"} category often faces stricter scrutiny.`,
      root_cause: "Ad content triggered Meta's policy filters — possibly prohibited content, misleading claims, or targeting restrictions.",
      steps: [
        { title: "Review Rejection Reason", description: "Check Ads Manager for the specific policy that was violated in your ad.", meta_link: META_LINKS.ads },
        { title: "Edit Your Ad", description: "Modify the ad content, imagery, or targeting to comply with Meta's Advertising Policies.", meta_link: null },
        { title: "Resubmit for Review", description: "After editing, submit the ad for another automated and manual review.", meta_link: META_LINKS.ads },
        { title: "Appeal If Needed", description: "If you believe the rejection was in error, use the appeal option in Ads Manager.", meta_link: META_LINKS.appeal },
      ],
      do_list: ["Use clear, accurate ad copy", "Follow image text overlay guidelines", "Target appropriate audiences", "Review all claims for accuracy"],
      dont_list: ["Make before/after health claims without proof", "Use shocking or sensational images", "Target restricted demographics inappropriately", "Include prohibited product categories"],
      tips: ["Preview your ad against Meta's Ad Policy checklist before submitting", "Start with a small test campaign first", "Use Meta Creative Hub to test creatives"],
      estimated_resolution: "1–3 business days", success_rate: "70–85%",
    },
    ad_account: {
      severity: "critical",
      diagnosis: `Your ad account associated with "${pageName}" has been restricted. This prevents running any advertisements and may be due to policy violations, suspicious payment activity, or security flags.`,
      root_cause: "Ad account restriction triggered by policy violations, unusual payment patterns, or security flags in Meta's systems.",
      steps: [
        { title: "Review Account Status", description: "Check Business Manager or Ads Manager for the specific restriction reason.", meta_link: META_LINKS.ads },
        { title: "Verify Payment Method", description: "Ensure your payment information is current, valid, and matches your account identity.", meta_link: null },
        { title: "Submit Account Review", description: "Use the official appeal to request restoration of your ad account.", meta_link: META_LINKS.appeal },
        { title: "Complete Business Verification", description: "If prompted, complete Facebook Business Verification to increase account trust.", meta_link: META_LINKS.business_help },
      ],
      do_list: ["Provide accurate business information", "Use a valid, verified payment method", "Complete Business Verification if prompted", "Comply with all advertising policies"],
      dont_list: ["Create multiple ad accounts to bypass restriction", "Use someone else's payment information", "Try to run ads from a different account", "Ignore policy violation notifications"],
      tips: ["Facebook Business Verification significantly builds trust with Meta", "Start with small budgets when account is restored", "Consider a certified Meta Business Partner for complex cases"],
      estimated_resolution: "7–14 business days", success_rate: "35–55%",
    },
    community: {
      severity: "high",
      diagnosis: `Content from "${pageName}" has been flagged for violating Meta's Community Standards. This can result in content removal, reduced distribution, or account-level restrictions.`,
      root_cause: "Content violated Community Standards — possibly around hate speech, misinformation, violence, or other prohibited categories.",
      steps: [
        { title: "Review Flagged Content", description: "Check Support Inbox to identify which posts were removed or flagged by Meta.", meta_link: META_LINKS.support_inbox },
        { title: "Remove Violating Posts", description: "Proactively remove any other content that may violate Community Standards.", meta_link: null },
        { title: "Appeal Content Removal", description: "If you believe content was incorrectly removed, submit a formal appeal.", meta_link: META_LINKS.appeal },
        { title: "Study Community Standards", description: "Review Meta's Community Standards in full to prevent future violations.", meta_link: META_LINKS.business_help },
      ],
      do_list: ["Post balanced, factual information", "Avoid inflammatory or divisive language", "Label satire and opinion content clearly", "Review content carefully before posting"],
      dont_list: ["Post misleading health information", "Share conspiracy theories", "Use hate speech or discriminatory content", "Post graphic violence or disturbing content"],
      tips: ["When in doubt about a post, don't publish it", "Build an internal content review process", "Engage with your community constructively"],
      estimated_resolution: "3–10 business days", success_rate: "50–70%",
    },
    identity: {
      severity: "high",
      diagnosis: `Facebook requires identity verification for "${pageName}". This is triggered when Meta needs to confirm that the page is managed by real people representing a legitimate entity — especially for pages running news or political content, or those with large followings.`,
      root_cause: "Identity verification required due to page activity patterns, content type, or routine security checks by Meta.",
      steps: [
        { title: "Prepare Identity Documents", description: "Have a government-issued ID ready — passport, national ID card, or driver's license.", meta_link: null },
        { title: "Submit Verification", description: "Follow the verification link provided by Meta and upload the required documents clearly.", meta_link: META_LINKS.verification },
        { title: "Wait for Review", description: "Meta typically reviews identity documents within 1–7 business days.", meta_link: null },
        { title: "Appeal if Rejected", description: "If verification is rejected, appeal with additional supporting documentation.", meta_link: META_LINKS.appeal },
      ],
      do_list: ["Submit clear, legible document scans or photos", "Use documents that match your account name exactly", "Complete verification promptly", "Keep your verification documents updated"],
      dont_list: ["Submit fake, altered, or expired documents", "Try to bypass the verification process", "Use someone else's identity documents", "Ignore Meta's verification requests"],
      tips: ["Ensure your Facebook profile name matches your ID exactly", "Use a high-quality photo or scan — blurry submissions get rejected", "Only complete verification through official Facebook channels"],
      estimated_resolution: "1–7 business days", success_rate: "85–95%",
    },
    reach_down: {
      severity: "medium",
      diagnosis: `The reach and engagement for "${pageName}" have declined significantly. This is often caused by algorithm changes, reduced content frequency, low engagement rates, or content that no longer resonates with the algorithm's ranking signals.`,
      root_cause: "Algorithm deprioritizing page content due to low engagement signals, content policy flags, or reduced posting frequency.",
      steps: [
        { title: "Analyze Page Insights", description: "Review Facebook Insights to identify when the drop started and which content performs best.", meta_link: null },
        { title: "Improve Content Quality", description: "Focus on creating engaging, original content that encourages genuine interactions.", meta_link: null },
        { title: "Post Consistently", description: "Maintain a regular schedule — 3–5 times per week is recommended for most pages.", meta_link: null },
        { title: "Engage With Your Audience", description: "Reply to all comments and messages within 24 hours to send positive engagement signals.", meta_link: null },
      ],
      do_list: ["Post native video and Reels content", "Engage with comments within the first hour", "Share content that sparks genuine discussion", "Go Live regularly to boost visibility"],
      dont_list: ["Post link-only updates without context", "Ask for likes or shares (engagement bait)", "Post too infrequently or inconsistently", "Ignore audience comments and messages"],
      tips: ["Facebook Reels get 3–5x more organic reach than regular posts", "Going Live once a week can significantly boost page visibility", "Collaborate with other pages for cross-promotion"],
      estimated_resolution: "2–4 weeks", success_rate: "N/A — algorithm-based",
    },
    payment: {
      severity: "high",
      diagnosis: `There is a payment issue affecting "${pageName}". This could relate to ad billing, monetization payouts, Stars, or fan subscriptions. Payment issues can pause advertising and monetization features until resolved.`,
      root_cause: "Payment failure or verification required — typically a declined payment method, expired card, or unmet billing threshold.",
      steps: [
        { title: "Check Payment Settings", description: "Go to Ads Manager → Billing or Creator Studio → Payout Settings to see your payment status.", meta_link: META_LINKS.monetization },
        { title: "Update Payment Method", description: "Add or update a valid credit/debit card or PayPal account.", meta_link: null },
        { title: "Clear Outstanding Balance", description: "If there's an outstanding balance, pay it to immediately restore account access.", meta_link: null },
        { title: "Contact Billing Support", description: "If the issue persists, contact Meta's billing support team directly.", meta_link: META_LINKS.support_inbox },
      ],
      do_list: ["Keep all payment methods current and valid", "Set up a backup payment method", "Monitor billing notifications and emails", "Maintain sufficient balance in payment accounts"],
      dont_list: ["Ignore payment failure emails", "Use a payment method that doesn't match your identity", "Try to bypass payment verification", "Use multiple accounts to avoid billing"],
      tips: ["Add a backup payment method to prevent service interruptions", "Set up automatic payments for ad accounts", "Ensure billing address matches your card details exactly"],
      estimated_resolution: "1–3 business days", success_rate: "80–90%",
    },
    other: {
      severity: "medium",
      diagnosis: `Your Facebook Page "${pageName}" is experiencing an issue that requires investigation. Based on your description, this may be related to account restrictions, content policies, or platform-specific limitations.`,
      root_cause: "Issue requires further investigation through Meta's support channels.",
      steps: [
        { title: "Check Support Inbox", description: "Review all notifications and messages from Meta in your Support Inbox first.", meta_link: META_LINKS.support_inbox },
        { title: "Review Page Quality", description: "Check your Page Quality tab for any active restrictions or content warnings.", meta_link: META_LINKS.page_quality },
        { title: "Contact Meta Support", description: "Reach out to Meta's support team with a detailed, specific description of your issue.", meta_link: META_LINKS.business_help },
        { title: "Submit General Appeal", description: "Use the general appeal form to request a formal review of your situation.", meta_link: META_LINKS.appeal },
      ],
      do_list: ["Document the issue with screenshots", "Be specific when describing the problem to support", "Try different devices/browsers to rule out technical issues", "Keep records of all communications"],
      dont_list: ["Give up after a single attempt", "Use unofficial third-party 'fix' services", "Share account access with strangers claiming to help", "Post about the issue in ways that could further violate policies"],
      tips: ["Include specific error messages or codes when contacting Meta support", "Try accessing Facebook through both the mobile app and desktop browser", "Check the Facebook Help Community for similar issues"],
      estimated_resolution: "3–10 business days", success_rate: "50–70%",
    },
  };

  const tmpl = templates[probId] || templates.other;
  return { ...tmpl, appeal_text: buildAppealLetter(pageName, pageCat, followers, probId, probDesc) };
}

// ─── AI call: try backend → fall back to local ───────────────
async function callAI(pageName, pageCat, followers, probId, probDesc) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(`${API_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageName, category: pageCat, followers,
        selectedProblem: PROBLEMS.find(p => p.id === probId)?.en || probId,
        description: probDesc,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.success) throw new Error(data.error || `API ${r.status}`);
    const res = data.result;
    return {
      ...(typeof res === "string"
        ? { diagnosis: res, severity: "medium", root_cause: "", steps: [], tips: [], do_list: [], dont_list: [] }
        : res),
      appeal_text: res?.appeal_text || res?.appeal_letter || buildAppealLetter(pageName, pageCat, followers, probId, probDesc),
    };
  } catch {
    return generateLocalAnalysis(pageName, pageCat, followers, probId, probDesc);
  }
}

// ═══════════════════════════════════════════════════════════════
export default function App() {
  // ── Auth / credits ──────────────────────────────────────────
  const [scr,         setScr]         = useState("access");
  const [accessCode,  setAccessCode]  = useState("");
  const [accessErr,   setAccessErr]   = useState("");
  const [activeCode,  setActiveCode]  = useState("");   // code that's logged in
  const [credits,     setCredits]     = useState(0);    // remaining credits
  // ── Pricing ─────────────────────────────────────────────────
  const [selectedPkg, setSelectedPkg] = useState(null);
  // ── Page info ───────────────────────────────────────────────
  const [pageName,    setPageName]    = useState("");
  const [pageCat,     setPageCat]     = useState("");
  const [pageFollowers,setPageFollowers]=useState("");
  const [screenshotPreview,setScreenshotPreview]=useState("");
  const [screenshotName,   setScreenshotName]   =useState("");
  // ── Problem ─────────────────────────────────────────────────
  const [cat,  setCat]  = useState("");
  const [desc, setDesc] = useState("");
  // ── Results ─────────────────────────────────────────────────
  const [result,     setResult]     = useState(null);
  const [appealText, setAppealText] = useState("");
  const [editAppeal, setEditAppeal] = useState(false);
  // ── History ─────────────────────────────────────────────────
  const [hist,     setHist]     = useState([]);
  const [histItem, setHistItem] = useState(null);
  // ── UI ──────────────────────────────────────────────────────
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { const h = store.get(HISTORY_KEY); if (h) setHist(h); }, []);

  const go = s => { setErr(""); setScr(s); window.scrollTo(0, 0); };

  const copy = text => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Validate access code ────────────────────────────────────
  const checkCode = () => {
    const code = accessCode.trim().toUpperCase();
    if (VALID_CODES.includes(code)) {
      const remaining = loadCredits(code);
      setActiveCode(code);
      setCredits(remaining);
      setAccessErr("");
      go("home");
    } else {
      setAccessErr("❌ Access Code មិនត្រូវ — Invalid code. Please check and try again.");
    }
  };

  // ── Use 1 credit (called after successful analyze) ──────────
  const useCredit = () => {
    const next = Math.max(0, credits - 1);
    setCredits(next);
    saveCredits(activeCode, next);
    return next;
  };

  const handleScreenshot = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Screenshot must be under 5MB"); return; }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Run AI analyze ──────────────────────────────────────────
  const analyze = async () => {
    if (credits <= 0) { go("pricing"); return; }
    if (!pageName.trim()) { setErr("សូមបញ្ចូលឈ្មោះ Page — Please enter page name"); return; }
    if (!cat)             { setErr("សូមជ្រើសរើសប្រភេទបញ្ហា — Please select problem type"); return; }
    const finalDesc = desc.trim() || "Please analyze this Facebook issue based on the selected problem type.";
    setBusy(true); setErr(""); go("analyzing");
    try {
      const r = await callAI(pageName, pageCat || "Page", pageFollowers, cat, finalDesc);
      setResult(r);
      setAppealText(r.appeal_text || "");
      setEditAppeal(false);
      const remaining = useCredit();
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        pageName, pageCat: pageCat || "Page", pageFollowers, cat,
        desc: finalDesc, result: r, creditsLeft: remaining,
      };
      const updated = [entry, ...hist].slice(0, 50);
      setHist(updated);
      store.set(HISTORY_KEY, updated);
      go("results");
    } catch (e) {
      setErr("Error: " + e.message);
      go("describe");
    }
    setBusy(false);
  };

  const resetForm = () => {
    setPageName(""); setPageCat(""); setPageFollowers("");
    setCat(""); setDesc(""); setResult(null);
    setScreenshotPreview(""); setScreenshotName("");
    go("pageinfo");
  };

  const probLabel = id => PROBLEMS.find(c => c.id === id)?.en || id;

  // ── Credit badge helper ─────────────────────────────────────
  const CreditBadge = () => {
    if (!activeCode) return null;
    const cls = credits === 0 ? "cred-zero" : credits <= 2 ? "cred-low" : "cred-ok";
    return (
      <div className={`credit-bar ${cls}`}>
        {credits === 0
          ? "⛔ Credits: 0 — Buy more to continue"
          : `🎫 Credits left: ${credits}`}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  return (
    <div style={R.root}>
      <style>{CSS}</style>

      {/* ─── ACCESS CODE ─── */}
      {scr === "access" && (
        <div style={R.center}>
          <div style={R.box}>
            <div className="logo-bounce">🛠️</div>
            <h1 style={R.brand}>Khmer AI</h1>
            <p style={R.brandSub}>Facebook Fixer</p>
            <p className="tagline mt10">
              AI ជួយវិភាគបញ្ហា Facebook Page/Profile<br />
              + បង្កើត Appeal Letter ដោយស្វ័យប្រវត្តិ
            </p>

            <div className="access-card mt20">
              <p className="lbl tc mb8">🔐 Access Code — លេខកូដចូលប្រើ</p>
              <input
                className="field code-input"
                placeholder="CLIENT-XXX"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && checkCode()}
                maxLength={12}
              />
              {accessErr && <div className="err mt8">{accessErr}</div>}
              <button className="btn-primary full mt12" onClick={checkCode}>
                🔓 ចូលប្រើ — Unlock Tool
              </button>
              <div className="divider-row mt14 mb12"><span className="divider-text">មិនទាន់មានកូដ?</span></div>
              <button className="btn-outline full" onClick={() => go("pricing")}>
                💰 មើលតម្លៃ &amp; Package — View Pricing
              </button>
            </div>

            <div className="safe-badge mt14">
              🔒 Tool នេះ <strong>មិន</strong>ស្នើ Password, OTP, Cookie ឬ Token<br />
              <span className="dim">We never ask for your Facebook login credentials.</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRICING ─── */}
      {scr === "pricing" && (
        <div style={R.page}>
          <button className="back-btn" onClick={() => go("access")}>← ត្រលប់</button>

          <div className="tc mt10 mb16">
            <h2 className="page-title">💰 តម្លៃ &amp; Package</h2>
            <p className="muted sm mt4">ជ្រើស Package → បង់ប្រាក់ → ទទួល Access Code</p>
          </div>

          {/* Package grid */}
          <div className="pkg-grid">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className={`pkg-card${selectedPkg?.id === pkg.id ? " pkg-on" : ""}${pkg.best ? " pkg-best" : ""}`}
                style={{ "--pkg-color": pkg.color }}
                onClick={() => setSelectedPkg(pkg)}
              >
                {pkg.best && <div className="pkg-badge">⭐ Best Value</div>}
                <div className="pkg-name" style={{ color: pkg.color }}>{pkg.name}</div>
                <div className="pkg-price">{pkg.price}</div>
                <div className="pkg-tag">{pkg.credits} credit{pkg.credits > 1 ? "s" : ""}</div>
                <ul className="pkg-features">
                  {pkg.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                </ul>
                <div className={`pkg-select-btn${selectedPkg?.id === pkg.id ? " selected" : ""}`}>
                  {selectedPkg?.id === pkg.id ? "✅ Selected" : "Select"}
                </div>
              </div>
            ))}
          </div>

          {/* How to pay */}
          <div className="pay-box mt16">
            <h3 className="h-amber mb10">📋 របៀបបង់ប្រាក់ — How to Pay</h3>
            <div className="pay-steps">
              {[
                "ជ្រើស Package ខាងលើ — Select a package above",
                "បង់ប្រាក់តាម ABA / ACLEDA / QR — Pay via your bank or QR",
                "Screenshot វិក័យប័ត្រ ហើយផ្ញើមក — Send payment screenshot to us",
                "យើងផ្ញើ Access Code (CLIENT-XXX) ត្រឡប់ — We send your code back",
                "ប្រើ Code ចូល Tool — Enter the code here to start",
              ].map((s, i) => (
                <div key={i} className="pay-step">
                  <span className="pay-n">{i + 1}.</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment details */}
          <div className="pay-detail-box mt10">
            <h3 className="h-white mb10">💳 ព័ត៌មានការទូទាត់ — Payment Details</h3>
            {[
              { label: "Payment Method", val: PAYMENT.methods,  em: false },
              { label: "Account Name",   val: PAYMENT.name,     em: true  },
              { label: "Phone/Telegram", val: PAYMENT.phone,    em: true  },
            ].map(row => (
              <div key={row.label} className="pay-row">
                <span className="pay-lbl">{row.label}</span>
                <span className={`pay-val${row.em ? " pay-em" : ""}`}>{row.val}</span>
              </div>
            ))}
            <div className="pay-row">
              <span className="pay-lbl">Facebook Page</span>
              <a href={PAYMENT.facebookUrl} target="_blank" rel="noreferrer" className="pay-val pay-link">
                {PAYMENT.facebook} →
              </a>
            </div>
            {selectedPkg && (
              <div className="pay-total mt12">
                <span>{selectedPkg.name} — {selectedPkg.credits} credit{selectedPkg.credits > 1 ? "s" : ""}</span>
                <span className="pay-price-big">{selectedPkg.price}</span>
              </div>
            )}
          </div>

          {/* Security notice */}
          <div className="warn-box mt10">
            <p className="warn-title">🔒 សុវត្ថិភាព — Security Notice</p>
            <p className="warn-text">• យើង <strong>មិន</strong>ស្នើ Password, OTP, Cookie ឬ Token Facebook ឡើយ</p>
            <p className="warn-text">• We <strong>never</strong> ask for your Facebook password, OTP, cookie, or token.</p>
            <p className="warn-text">• Customer must submit the Meta appeal by themselves using their own Facebook account.</p>
            <p className="warn-text">• អតិថិជនត្រូវ Submit appeal ដោយខ្លួនឯង — ប្រើ Facebook Account ផ្ទាល់ខ្លួន។</p>
          </div>

          <div className="col8 mt14">
            <a href={PAYMENT.facebookUrl} target="_blank" rel="noreferrer" className="btn-primary full" style={{ textDecoration: "none" }}>
              💬 ទំនាក់ទំនង — Contact Us on Facebook
            </a>
            <button className="btn-ghost full" onClick={() => go("access")}>
              🔐 ខ្ញុំមាន Access Code — I already have a code
            </button>
          </div>
        </div>
      )}

      {/* ─── HOME ─── */}
      {scr === "home" && (
        <div style={R.center}>
          <div style={R.box}>
            <div className="logo-bounce">🛠️</div>
            <h1 style={R.brand}>Khmer AI</h1>
            <p style={R.brandSub}>Facebook Fixer</p>

            <CreditBadge />

            <p className="tagline mt10">
              AI ជួយពិនិត្យបញ្ហា Page / Monetization<br />
              + បង្កើតសំណើអុទ្ធរណ៍ ដោយស្វ័យប្រវត្តិ
            </p>
            <p className="tagline-en">Diagnose Facebook issues &amp; generate your appeal letter</p>

            <div className="safe-badge mt12">
              🔒 Tool នេះ <strong>មិន</strong>ស្នើ Password, OTP, Cookie ឬ Token ឡើយ
            </div>

            {credits > 0 ? (
              <button className="btn-primary full mt16" onClick={() => go("pageinfo")}>
                🔍 ចាប់ផ្តើមវិភាគ — Start Diagnosis
              </button>
            ) : (
              <button className="btn-warn-solid full mt16" onClick={() => go("pricing")}>
                ⛔ Credits អស់ — Buy More Credits
              </button>
            )}

            {hist.length > 0 && (
              <button className="btn-ghost full mt10" onClick={() => { setHistItem(null); go("history"); }}>
                📋 ប្រវត្តិ — History ({hist.length})
              </button>
            )}

            <div className="feature-grid mt16">
              {[
                { icon: "🤖", label: "AI វិភាគបញ្ហា" },
                { icon: "✍️", label: "Appeal Letter" },
                { icon: "📋", label: "Step-by-Step Fix" },
                { icon: "🔗", label: "Meta Support Links" },
              ].map((f, i) => (
                <div key={i} className="feature-chip">
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <span className="chip-text">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PAGE INFO ─── */}
      {scr === "pageinfo" && (
        <div style={R.page}>
          <button className="back-btn" onClick={() => go("home")}>← ត្រលប់</button>
          <CreditBadge />
          <h2 className="sec-title mt10">📄 ព័ត៌មាន Page / Profile</h2>
          <p className="muted sm mb14">Enter your Facebook Page or Profile information below</p>

          <label className="lbl">ឈ្មោះ Page / Profile Name <span className="req">*</span></label>
          <input className="field" placeholder="e.g. Khmer Comedy TV" value={pageName}
            onChange={e => setPageName(e.target.value)} />

          <label className="lbl mt14">ប្រភេទ Page — Category</label>
          <div className="sel-wrap">
            <select className="field sel" value={pageCat} onChange={e => setPageCat(e.target.value)}>
              <option value="">ជ្រើសរើស Category...</option>
              {PAGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <label className="lbl mt14">ចំនួន Followers / Page Likes</label>
          <input className="field" type="text" placeholder="e.g. 245000" value={pageFollowers}
            onChange={e => setPageFollowers(e.target.value)} />

          <label className="lbl mt14">Screenshot of Error (optional)</label>
          <div className="upload-zone" onClick={() => fileRef.current?.click()}>
            {screenshotPreview ? (
              <div className="tc">
                <img src={screenshotPreview} alt="preview" className="img-preview" />
                <p className="muted sm mt6">📎 {screenshotName}</p>
              </div>
            ) : (
              <div className="tc">
                <p style={{ fontSize: 26, marginBottom: 4 }}>📸</p>
                <p className="muted sm">Click to upload screenshot of the error / notification</p>
                <p className="dim" style={{ fontSize: 10, marginTop: 3 }}>PNG, JPG, WEBP · Max 5MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleScreenshot} />
          </div>
          {screenshotPreview && (
            <button className="remove-btn" onClick={() => { setScreenshotPreview(""); setScreenshotName(""); }}>
              ✕ Remove screenshot
            </button>
          )}

          {err && <div className="err mt10">{err}</div>}

          <button className="btn-primary full mt18"
            onClick={() => { if (!pageName.trim()) { setErr("សូមបញ្ចូលឈ្មោះ Page"); return; } go("describe"); }}
            disabled={!pageName.trim()}>
            បន្ត → ពិពណ៌នាបញ្ហា
          </button>
        </div>
      )}

      {/* ─── DESCRIBE ─── */}
      {scr === "describe" && (
        <div style={R.page}>
          <button className="back-btn" onClick={() => go("pageinfo")}>← ត្រលប់</button>
          <CreditBadge />

          <div className="info-card mt10 mb14">
            <div className="row-c">
              <div className="page-avatar">📄</div>
              <div>
                <p className="name-text">{pageName}</p>
                <p className="muted sm">{pageCat || "Page"}{pageFollowers ? ` · ${Number(pageFollowers).toLocaleString()} followers` : ""}</p>
              </div>
            </div>
          </div>

          {credits <= 0 ? (
            <div className="no-credits-box">
              <p style={{ fontSize: 32 }}>⛔</p>
              <p className="name-text mt8">Credits អស់ហើយ — No Credits Left</p>
              <p className="muted sm mt6">សូមទិញ Package ថ្មី ដើម្បីបន្តប្រើ Tool</p>
              <button className="btn-primary full mt14" onClick={() => go("pricing")}>
                💰 Buy More Credits
              </button>
            </div>
          ) : (
            <>
              <h2 className="sec-title">🔍 ពិពណ៌នាបញ្ហា — Problem Type</h2>

              <label className="lbl">ជ្រើសប្រភេទបញ្ហា <span className="req">*</span></label>
              <div className="prob-grid">
                {PROBLEMS.map(c => (
                  <button key={c.id} className={`prob-chip${cat === c.id ? " prob-on" : ""}`} onClick={() => setCat(c.id)}>
                    <span className="prob-icon">{c.icon}</span>
                    <span className="prob-text">{c.label}</span>
                  </button>
                ))}
              </div>

              <label className="lbl mt16">ពិពណ៌នាលម្អិត — Describe the problem (optional)</label>
              <textarea
                className="ta"
                placeholder="Write details here... e.g. Monetization disabled 3 days ago without warning. My page posts 100% original content daily."
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={5}
              />

              {err && <div className="err mt8">{err}</div>}

              <button className="btn-primary full mt18" onClick={analyze} disabled={!cat || busy}>
                {busy ? "🤖 AI កំពុងវិភាគ..." : `🤖 AI Analyze — ប្រើ 1 Credit (${credits} remaining)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── ANALYZING ─── */}
      {scr === "analyzing" && (
        <div style={R.center}>
          <div className="tc">
            <div className="spin" />
            <p className="white mt18" style={{ fontSize: 16, fontWeight: 600 }}>🤖 AI កំពុងវិភាគ...</p>
            <p className="muted mt6">{pageName}</p>
            <p className="dim mt4 sm">{probLabel(cat)}</p>
            <p className="dim mt10 sm">កំពុងបង្កើត diagnosis + appeal letter...</p>
          </div>
        </div>
      )}

      {/* ─── RESULTS ─── */}
      {scr === "results" && result && (
        <div style={R.page}>
          <button className="back-btn" onClick={() => go("describe")}>← វិភាគម្តងទៀត</button>
          <CreditBadge />

          <div className="row-b mt10 mb12">
            <div>
              <h1 className="page-title">📊 លទ្ធផលវិភាគ</h1>
              <p className="muted sm">{pageName} — {probLabel(cat)}</p>
            </div>
            <span className={`badge sev-${result.severity || "medium"}`}>
              {(result.severity || "medium").toUpperCase()}
            </span>
          </div>

          {/* Security warning */}
          <div className="warn-box mb14">
            <p className="warn-title">🚨 សុវត្ថិភាព — Security Notice</p>
            <p className="warn-text">• <strong>ហាមប្រើ</strong> Password, OTP, Cookie ឬ Token ផ្ញើទៅអ្នកណាម្នាក់</p>
            <p className="warn-text">• Open all Meta links on <strong>YOUR OWN DEVICE</strong> where your Facebook is logged in</p>
            <p className="warn-text">• Submit the appeal yourself — <strong>do not let anyone else log in for you</strong></p>
          </div>

          {/* Diagnosis */}
          <div className="card glow mb12">
            <h3 className="h-blue">🧠 AI Diagnosis</h3>
            <p className="body-text">{result.diagnosis}</p>
            {result.root_cause && (
              <div className="root-box mt10">
                <span className="rc-lbl">Root Cause: </span>{result.root_cause}
              </div>
            )}
            <div className="meta-row mt10">
              {result.estimated_resolution && <span className="meta-pill">⏱ {result.estimated_resolution}</span>}
              {result.success_rate && <span className="meta-pill green">📊 {result.success_rate}</span>}
            </div>
          </div>

          {/* Fix steps */}
          {result.steps?.length > 0 && (
            <div className="card mb12">
              <h3 className="h-white">📋 ជំហានដោះស្រាយ — Fix Steps</h3>
              {result.steps.map((s, i) => (
                <div key={i} className="step-row">
                  <div className="step-num">{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <p className="step-title">{s.title}</p>
                    <p className="step-desc">{s.description}</p>
                    {s.meta_link && s.meta_link !== "null" && (
                      <a href={s.meta_link} target="_blank" rel="noreferrer" className="step-link">🔗 Open in Meta →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Do / Don't */}
          {(result.do_list?.length > 0 || result.dont_list?.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {result.do_list?.length > 0 && (
                <div className="card" style={{ padding: 12 }}>
                  <h4 className="h-green sm">✅ គួរធ្វើ</h4>
                  {result.do_list.map((d, i) => <p key={i} className="li green">• {d}</p>)}
                </div>
              )}
              {result.dont_list?.length > 0 && (
                <div className="card" style={{ padding: 12 }}>
                  <h4 className="h-red sm">❌ កុំធ្វើ</h4>
                  {result.dont_list.map((d, i) => <p key={i} className="li red">• {d}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {result.tips?.length > 0 && (
            <div className="card mb12">
              <h3 className="h-amber sm">💡 Tips</h3>
              {result.tips.map((t, i) => <p key={i} className="tip-item">• {t}</p>)}
            </div>
          )}

          {/* Action buttons */}
          <div className="col8 mb12">
            <button className="btn-primary full" onClick={() => go("appeal")}>
              ✍️ View &amp; Copy Appeal Letter
            </button>
            <a href={META_LINKS.support_inbox} target="_blank" rel="noreferrer" className="btn-outline full">
              📬 Open Support Inbox
            </a>
            <a href={META_LINKS.appeal} target="_blank" rel="noreferrer" className="btn-outline full">
              📝 Open Meta Appeal Form
            </a>
            {credits > 0 ? (
              <button className="btn-ghost full" onClick={resetForm}>
                🔄 Diagnose Another Case ({credits} credit{credits !== 1 ? "s" : ""} left)
              </button>
            ) : (
              <button className="btn-warn-solid full" onClick={() => go("pricing")}>
                ⛔ Credits អស់ — Buy More
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="card mb12">
            <h3 className="h-white sm">🔗 Meta Support Links</h3>
            <div className="link-grid">
              {[
                { url: META_LINKS.appeal,        label: "📝 Appeal Form" },
                { url: META_LINKS.page_quality,  label: "📊 Page Quality" },
                { url: META_LINKS.monetization,  label: "💰 Monetization" },
                { url: META_LINKS.copyright,     label: "©️ IP Center" },
                { url: META_LINKS.ads,           label: "📢 Ads Help" },
                { url: META_LINKS.support_inbox, label: "📬 Support Inbox" },
              ].map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" className="q-link">{l.label}</a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── APPEAL ─── */}
      {scr === "appeal" && result && (
        <div style={R.page}>
          <button className="back-btn" onClick={() => go("results")}>← ត្រឡប់ Results</button>
          <h2 className="page-title mt10">✍️ Appeal Letter</h2>
          <p className="muted sm mb12">Ready-to-copy appeal for: <strong>{pageName}</strong></p>

          <div className="warn-box mb12">
            <p className="warn-title">📌 របៀបប្រើ — How to Submit</p>
            <div className="how-list">
              {[
                'Copy the appeal text using the "📋 Copy" button below',
                'Click "📝 Open Meta Appeal Form" — it opens on your own device',
                "Paste the text and submit it yourself on your own Facebook account",
                "Wait 1–7 business days for Meta's response",
              ].map((s, i) => (
                <div key={i} className="how-row"><span className="how-n">{i + 1}.</span><span>{s}</span></div>
              ))}
            </div>
            <p className="warn-text mt8">🚨 <strong>ហាម</strong>ផ្ញើ Password, OTP ឬ Cookie ទៅអ្នកណាម្នាក់ — <strong>Never share your Facebook login with anyone.</strong></p>
          </div>

          {editAppeal ? (
            <textarea className="ta" rows={16} value={appealText}
              onChange={e => setAppealText(e.target.value)} style={{ minHeight: 280 }} />
          ) : (
            <div className="appeal-box">
              <p className="appeal-text">{appealText}</p>
            </div>
          )}

          <div className="row-3 mt12">
            <button className={`${copied ? "btn-green" : "btn-primary"} full`} onClick={() => copy(appealText)}>
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
            <button className="btn-ghost full" onClick={() => setEditAppeal(!editAppeal)}>
              {editAppeal ? "👁 Preview" : "✏️ Edit"}
            </button>
            <button className="btn-amber full" onClick={() => { setCat(""); setDesc(""); go("describe"); }}>
              🔄 Redo
            </button>
          </div>

          <div className="col8 mt14">
            <a href={META_LINKS.appeal} target="_blank" rel="noreferrer"
              className="btn-primary full" style={{ textDecoration: "none" }}>
              📝 Open Meta Appeal Form
            </a>
            <a href={META_LINKS.support_inbox} target="_blank" rel="noreferrer" className="btn-outline full">
              📬 Open Support Inbox
            </a>
            <a href={META_LINKS.monetization} target="_blank" rel="noreferrer" className="btn-outline full">
              💰 Monetization Settings
            </a>
            <a href={META_LINKS.copyright} target="_blank" rel="noreferrer" className="btn-outline full">
              ©️ Intellectual Property Center
            </a>
            {credits > 0 ? (
              <button className="btn-ghost full mt4" onClick={resetForm}>
                🔄 Diagnose Another Case ({credits} credit{credits !== 1 ? "s" : ""} left)
              </button>
            ) : (
              <button className="btn-warn-solid full mt4" onClick={() => go("pricing")}>
                ⛔ Credits អស់ — Buy More Credits
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── HISTORY ─── */}
      {scr === "history" && !histItem && (
        <div style={R.page}>
          <button className="back-btn" onClick={() => go("home")}>← ត្រឡប់</button>
          <h2 className="page-title mt10 mb14">📋 ប្រវត្តិ — History ({hist.length})</h2>
          {hist.length === 0 ? (
            <div className="card tc" style={{ padding: 36 }}><p className="muted">មិនទាន់មានប្រវត្តិ</p></div>
          ) : (
            <div className="col10">
              {hist.map(h => (
                <div key={h.id} className="card card-click" onClick={() => {
                  setHistItem(h); setResult(h.result);
                  setAppealText(h.result?.appeal_text || "");
                  setPageName(h.pageName); setCat(h.cat);
                  go("hist-detail");
                }}>
                  <div className="row-b">
                    <div>
                      <p className="name-text">{h.pageName}</p>
                      <p className="muted sm">{probLabel(h.cat)}</p>
                      <p className="dim sm mt2">
                        {new Date(h.date).toLocaleDateString()}{" "}
                        {new Date(h.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {h.creditsLeft !== undefined && ` · ${h.creditsLeft} credits left after`}
                      </p>
                    </div>
                    <span className={`badge sev-${h.result?.severity || "medium"}`}>
                      {(h.result?.severity || "?").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hist.length > 0 && (
            <button className="btn-ghost full mt18" style={{ color: "#ef4444" }}
              onClick={() => { if (confirm("Clear all history?")) { setHist([]); store.set(HISTORY_KEY, []); } }}>
              🗑️ Clear History
            </button>
          )}
        </div>
      )}

      {/* ─── HISTORY DETAIL ─── */}
      {scr === "hist-detail" && histItem && (
        <div style={R.page}>
          <button className="back-btn" onClick={() => { setHistItem(null); go("history"); }}>← ត្រឡប់ History</button>
          <div className="row-b mt10 mb14">
            <div>
              <h2 className="page-title">{histItem.pageName}</h2>
              <p className="muted sm">{probLabel(histItem.cat)} — {new Date(histItem.date).toLocaleDateString()}</p>
            </div>
            <span className={`badge sev-${histItem.result?.severity || "medium"}`}>
              {(histItem.result?.severity || "?").toUpperCase()}
            </span>
          </div>

          {histItem.desc && (
            <div className="card mb12">
              <h3 className="h-white sm">Problem Description</h3>
              <p className="body-text">{histItem.desc}</p>
            </div>
          )}

          {histItem.result && (
            <>
              <div className="card glow mb12">
                <h3 className="h-blue">🧠 Diagnosis</h3>
                <p className="body-text">{histItem.result.diagnosis}</p>
                {histItem.result.root_cause && (
                  <div className="root-box mt10">
                    <span className="rc-lbl">Root Cause: </span>{histItem.result.root_cause}
                  </div>
                )}
              </div>
              {histItem.result.appeal_text && (
                <button className={`${copied ? "btn-green" : "btn-primary"} full mb10`}
                  onClick={() => copy(histItem.result.appeal_text)}>
                  {copied ? "✅ Copied!" : "📋 Copy Appeal Letter"}
                </button>
              )}
              <div className="col8">
                <a href={META_LINKS.appeal} target="_blank" rel="noreferrer" className="btn-outline full">
                  📝 Open Meta Appeal Form
                </a>
                <a href={META_LINKS.support_inbox} target="_blank" rel="noreferrer" className="btn-outline full">
                  📬 Open Support Inbox
                </a>
              </div>
            </>
          )}
        </div>
      )}

      <AIChatAssistant />
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes spin-k{to{transform:rotate(360deg)}}
@keyframes pulse-red{0%,100%{opacity:1}50%{opacity:.7}}

.logo-bounce{font-size:46px;animation:bob 2.4s ease-in-out infinite;margin-bottom:2px}
.spin{width:42px;height:42px;margin:0 auto;border:3px solid #1e293b;border-top-color:#1877F2;border-radius:50%;animation:spin-k .7s linear infinite}

/* ── Utility ── */
.full{width:100%}.tc{text-align:center}
.mt4{margin-top:4px}.mt6{margin-top:6px}.mt8{margin-top:8px}.mt10{margin-top:10px}.mt12{margin-top:12px}.mt14{margin-top:14px}.mt16{margin-top:16px}.mt18{margin-top:18px}.mt20{margin-top:20px}.mt22{margin-top:22px}
.mb8{margin-bottom:8px}.mb10{margin-bottom:10px}.mb12{margin-bottom:12px}.mb14{margin-bottom:14px}.mb16{margin-bottom:16px}
.sm{font-size:11.5px!important}.req{color:#f87171}

/* ── Credit badge ── */
.credit-bar{width:100%;text-align:center;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;margin-top:10px}
.cred-ok  {background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:#34d399}
.cred-low {background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:#fbbf24;animation:pulse-red 2s ease-in-out infinite}
.cred-zero{background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); color:#f87171;animation:pulse-red 1.5s ease-in-out infinite}

/* ── No credits block ── */
.no-credits-box{background:#1e293b;border:2px solid rgba(239,68,68,.3);border-radius:14px;padding:28px 20px;text-align:center;margin-top:10px}

/* ── Typography ── */
.tagline{text-align:center;color:#94a3b8;font-size:13.5px;line-height:1.75}
.tagline-en{text-align:center;color:#475569;font-size:12px;margin-top:3px}
.muted{color:#94a3b8;font-size:13px}
.dim{color:#475569;font-size:11.5px}
.white{color:#f1f5f9}
.name-text{color:#f1f5f9;font-size:15px;font-weight:600}
.body-text{color:#e2e8f0;font-size:13.5px;line-height:1.72}
.h-blue {color:#60a5fa;font-size:13px;font-weight:600;margin-bottom:8px}
.h-white{color:#e2e8f0;font-size:13px;font-weight:600;margin-bottom:9px}
.h-green{color:#34d399;font-size:12px;font-weight:600;margin-bottom:6px}
.h-red  {color:#f87171;font-size:12px;font-weight:600;margin-bottom:6px}
.h-amber{color:#fbbf24;font-size:12px;font-weight:600;margin-bottom:6px}
.sec-title{color:#e2e8f0;font-size:15px;font-weight:600;margin-bottom:10px}
.page-title{color:#f1f5f9;font-size:17px;font-weight:700}
.lbl{display:block;color:#94a3b8;font-size:11px;font-weight:600;margin-bottom:6px;letter-spacing:.2px;text-transform:uppercase}
.tip-item{color:#cbd5e1;font-size:12.5px;line-height:1.6;margin-bottom:5px}
.li{font-size:11.5px;line-height:1.55;margin-bottom:4px}
.li.green{color:#6ee7b7}.li.red{color:#fca5a5}

/* ── Buttons ── */
.btn-primary{background:linear-gradient(135deg,#1877F2,#0d5bbd);color:#fff;border:none;padding:13px 22px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .2s;display:flex;align-items:center;gap:7px;justify-content:center}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(24,119,242,.35)}
.btn-primary:disabled{opacity:.45;cursor:not-allowed}
.btn-ghost{background:transparent;color:#94a3b8;border:1px solid #2d3a4f;padding:11px 18px;border-radius:10px;font-size:13px;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s;display:flex;align-items:center;gap:6px;justify-content:center}
.btn-ghost:hover{border-color:#60a5fa;color:#60a5fa}
.btn-outline{display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;color:#94a3b8;border:1px solid #2d3a4f;padding:11px 18px;border-radius:10px;font-size:13px;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s;text-decoration:none}
.btn-outline:hover{border-color:#1877F2;color:#60a5fa;background:rgba(24,119,242,.05)}
.btn-green{background:#10b981;color:#fff;border:none;padding:13px 22px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;display:flex;align-items:center;justify-content:center;gap:7px}
.btn-amber{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;padding:11px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif}
.btn-warn-solid{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;border:none;padding:13px 22px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;display:flex;align-items:center;gap:7px;justify-content:center;width:100%;transition:all .2s}
.btn-warn-solid:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(239,68,68,.3)}
.remove-btn{background:transparent;color:#94a3b8;border:none;font-size:12px;cursor:pointer;padding:4px 0;font-family:'Kantumruy Pro',sans-serif;margin-top:4px}
.remove-btn:hover{color:#f87171}
.back-btn{display:inline-flex;align-items:center;gap:4px;color:#94a3b8;font-size:13px;cursor:pointer;border:none;background:none;font-family:'Kantumruy Pro',sans-serif;padding:5px 0;transition:color .15s}
.back-btn:hover{color:#60a5fa}

/* ── Cards ── */
.card{background:#1e293b;border:1px solid #2d3a4f;border-radius:14px;padding:16px;animation:fadeUp .3s ease both}
.card.glow{border-color:rgba(24,119,242,.3);box-shadow:0 0 16px rgba(24,119,242,.06)}
.card-click{cursor:pointer;transition:all .2s}.card-click:hover{border-color:#1877F2;transform:translateY(-2px);box-shadow:0 4px 18px rgba(0,0,0,.2)}
.info-card{background:#1e293b;border:1px solid #2d3a4f;border-radius:12px;padding:14px}
.access-card{background:#1e293b;border:1px solid #2d3a4f;border-radius:14px;padding:20px;width:100%}

/* ── Severity badges ── */
.badge{display:inline-flex;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.4px;flex-shrink:0}
.sev-critical{background:rgba(239,68,68,.14);color:#ef4444}
.sev-high    {background:rgba(245,158,11,.14);color:#f59e0b}
.sev-medium  {background:rgba(59,130,246,.14); color:#3b82f6}
.sev-low     {background:rgba(107,114,128,.14);color:#9ca3af}

/* ── Warning boxes ── */
.warn-box{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.22);border-radius:12px;padding:14px 16px}
.warn-title{color:#fca5a5;font-size:12.5px;font-weight:700;margin-bottom:7px}
.warn-text{color:#fca5a5;font-size:12px;line-height:1.55;margin-bottom:3px}
.safe-badge{background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:10px 14px;color:#6ee7b7;font-size:12.5px;line-height:1.6;text-align:center;width:100%}

/* ── Forms ── */
.field{width:100%;background:#0f172a;border:1px solid #2d3a4f;border-radius:10px;color:#e2e8f0;padding:12px 14px;font-size:13.5px;outline:none;font-family:'Kantumruy Pro',sans-serif;transition:border-color .18s}
.field:focus{border-color:#1877F2}.field::placeholder{color:#3b4a63}
.code-input{text-align:center;letter-spacing:4px;font-size:18px;font-weight:700}
.sel{appearance:none;cursor:pointer;padding-right:34px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center}
.sel option{background:#0f172a;color:#e2e8f0}
.sel-wrap{position:relative}
.ta{width:100%;background:#0f172a;border:1px solid #2d3a4f;border-radius:11px;color:#e2e8f0;padding:13px 14px;font-size:13px;font-family:'Kantumruy Pro',sans-serif;line-height:1.7;resize:vertical;outline:none;transition:border-color .18s}
.ta:focus{border-color:#1877F2}.ta::placeholder{color:#3b4a63}
.err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.22);border-radius:9px;padding:10px 12px;color:#fca5a5;font-size:12px;line-height:1.5;width:100%}

/* ── Upload zone ── */
.upload-zone{width:100%;background:#0f172a;border:2px dashed #2d3a4f;border-radius:11px;padding:20px 16px;cursor:pointer;transition:border-color .18s;margin-top:2px}
.upload-zone:hover{border-color:#1877F2}
.img-preview{max-width:100%;max-height:120px;border-radius:8px;object-fit:contain}

/* ── Problem chips ── */
.prob-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:4px}
.prob-chip{background:#0f172a;border:1px solid #2d3a4f;border-radius:10px;color:#94a3b8;padding:10px 11px;font-size:12px;text-align:left;cursor:pointer;font-family:'Kantumruy Pro',sans-serif;transition:all .18s;display:flex;align-items:center;gap:7px}
.prob-chip:hover{border-color:#475569;color:#e2e8f0}
.prob-on{border-color:#1877F2!important;color:#60a5fa!important;background:rgba(24,119,242,.08)!important}
.prob-icon{font-size:15px;flex-shrink:0}.prob-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ── Feature chips ── */
.feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
.feature-chip{background:#1e293b;border:1px solid #2d3a4f;border-radius:10px;padding:11px 12px;display:flex;align-items:center;gap:8px}
.chip-text{color:#94a3b8;font-size:12px}

/* ── Divider ── */
.divider-row{display:flex;align-items:center;gap:10px}
.divider-row::before,.divider-row::after{content:'';flex:1;border-top:1px solid #2d3a4f}
.divider-text{color:#475569;font-size:11.5px;white-space:nowrap}

/* ── Layout ── */
.row-c{display:flex;align-items:center;gap:11px}
.row-b{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.row-3{display:flex;gap:8px}
.col8{display:flex;flex-direction:column;gap:8px}
.col10{display:flex;flex-direction:column;gap:10px}
.page-avatar{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#1e3a5f,#1e293b);display:flex;align-items:center;justify-content:center;font-size:20px;border:1px solid #2d3a4f;flex-shrink:0}

/* ── Steps ── */
.step-row{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid #162032}
.step-row:last-child{border-bottom:none}
.step-num{width:27px;height:27px;border-radius:50%;background:linear-gradient(135deg,#1877F2,#0d5bbd);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11.5px;flex-shrink:0;margin-top:1px}
.step-title{color:#f1f5f9;font-size:13px;font-weight:600}
.step-desc{color:#94a3b8;font-size:12px;margin-top:3px;line-height:1.6}
.step-link{display:inline-block;margin-top:5px;color:#60a5fa;font-size:11px;text-decoration:none}
.step-link:hover{text-decoration:underline}

/* ── Root cause / meta ── */
.root-box{background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:8px;padding:8px 12px;font-size:12px;color:#fbbf24;line-height:1.5}
.rc-lbl{font-weight:700;color:#f59e0b}
.meta-row{display:flex;gap:7px;flex-wrap:wrap}
.meta-pill{font-size:11px;color:#f59e0b;background:rgba(245,158,11,.08);padding:3px 9px;border-radius:14px}
.meta-pill.green{color:#34d399;background:rgba(52,211,153,.08)}

/* ── Link grid ── */
.link-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
.q-link{display:block;background:#0f172a;border:1px solid #2d3a4f;border-radius:8px;padding:8px 10px;color:#94a3b8;font-size:11.5px;text-decoration:none;transition:all .15s;text-align:center}
.q-link:hover{border-color:#1877F2;color:#60a5fa}

/* ── Appeal ── */
.appeal-box{background:#0f172a;border:1px solid #2d3a4f;border-radius:12px;padding:16px;max-height:380px;overflow-y:auto}
.appeal-text{color:#e2e8f0;font-size:13px;line-height:1.8;white-space:pre-wrap}

/* ── How-to list ── */
.how-list{display:flex;flex-direction:column;gap:5px;margin-bottom:2px}
.how-row{display:flex;gap:7px;color:#e2e8f0;font-size:12px;line-height:1.5}
.how-n{color:#60a5fa;font-weight:700;min-width:18px;flex-shrink:0}

/* ── Pricing grid ── */
.pkg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pkg-card{background:#1e293b;border:2px solid #2d3a4f;border-radius:14px;padding:16px 14px;cursor:pointer;transition:all .22s;position:relative;display:flex;flex-direction:column;gap:5px}
.pkg-card:hover{border-color:var(--pkg-color,#1877F2);transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,.25)}
.pkg-on{border-color:var(--pkg-color,#1877F2)!important;background:rgba(24,119,242,.06)!important;box-shadow:0 0 0 1px var(--pkg-color,#1877F2)}
.pkg-best{border-color:#f59e0b!important}
.pkg-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#f59e0b;color:#000;font-size:10px;font-weight:700;padding:2px 10px;border-radius:20px;white-space:nowrap}
.pkg-name{font-size:15px;font-weight:700}
.pkg-price{font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.1}
.pkg-tag{font-size:11px;color:#94a3b8;margin-bottom:3px}
.pkg-features{list-style:none;padding:0;display:flex;flex-direction:column;gap:4px;flex:1}
.pkg-features li{font-size:11px;color:#cbd5e1;line-height:1.4}
.pkg-select-btn{margin-top:8px;background:#0f172a;border:1px solid #2d3a4f;border-radius:8px;padding:6px;font-size:12px;font-weight:600;color:#94a3b8;text-align:center;transition:all .18s}
.pkg-card:hover .pkg-select-btn,.pkg-on .pkg-select-btn{border-color:var(--pkg-color,#1877F2);color:var(--pkg-color,#1877F2)}
.pkg-select-btn.selected{background:rgba(16,185,129,.12);border-color:#10b981;color:#34d399}

/* ── Payment boxes ── */
.pay-box{background:#1e293b;border:1px solid #2d3a4f;border-radius:14px;padding:16px}
.pay-steps{display:flex;flex-direction:column;gap:7px}
.pay-step{display:flex;gap:8px;font-size:12.5px;color:#e2e8f0;line-height:1.5}
.pay-n{color:#f59e0b;font-weight:700;min-width:18px;flex-shrink:0}
.pay-detail-box{background:#1e293b;border:1px solid #2d3a4f;border-radius:14px;padding:16px}
.pay-row{display:flex;justify-content:space-between;align-items:flex-start;padding:7px 0;border-bottom:1px solid #162032;gap:10px}
.pay-row:last-of-type{border-bottom:none}
.pay-lbl{font-size:11.5px;color:#64748b;flex-shrink:0}
.pay-val{font-size:13px;color:#e2e8f0;text-align:right}
.pay-em{color:#f1f5f9;font-weight:600}
.pay-link{color:#60a5fa;text-decoration:none;font-weight:600}
.pay-link:hover{text-decoration:underline}
.pay-total{display:flex;justify-content:space-between;align-items:center;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.2);border-radius:9px;padding:10px 14px;font-size:13px;color:#e2e8f0}
.pay-price-big{font-size:22px;font-weight:800;color:#fbbf24}

/* ── Responsive ── */
@media(max-width:520px){
  .pkg-grid{grid-template-columns:1fr 1fr}
  .prob-grid{grid-template-columns:1fr 1fr}
  .row-3{flex-wrap:wrap}
  .row-3>*{flex:1 1 calc(50% - 4px)}
}
@media(max-width:360px){
  .pkg-grid{grid-template-columns:1fr}
}
`;

const R = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(170deg,#060b18 0%,#0f172a 55%,#0d1525 100%)",
    fontFamily: "'Kantumruy Pro', system-ui, sans-serif",
    color: "#e2e8f0",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px",
    flexDirection: "column",
  },
  box: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  brand: {
    fontSize: 30,
    fontWeight: 700,
    background: "linear-gradient(135deg,#60a5fa,#1877F2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginTop: 2,
  },
  brandSub: { fontSize: 15, color: "#94a3b8", marginTop: 1 },
  page: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "14px 16px 60px",
    animation: "fadeUp .28s ease",
  },
};
