import { useState, useRef, useEffect } from "react";
import {
  Home, MessageCircle, CircleHelp, Settings, Globe, Send, ChevronRight,
  ChevronDown, BookOpen, FileText, Clock, GraduationCap, Wallet, Lightbulb,
  Trash2, Moon, Check, ArrowLeft,
} from "lucide-react";

const LANGS = [
  { code: "English", native: "English" },
  { code: "Hindi", native: "हिन्दी" },
  { code: "Bengali", native: "বাংলা" },
  { code: "Tamil", native: "தமிழ்" },
  { code: "Telugu", native: "తెలుగు" },
  { code: "Marathi", native: "मराठी" },
];

const TOPICS = [
  { icon: BookOpen, title: "Exam prep", q: "How should I plan my revision for exams in the next two weeks?" },
  { icon: FileText, title: "Assignments", q: "How do I structure a good 1500-word assignment?" },
  { icon: Clock, title: "Study plans", q: "Make me a simple weekly study timetable for 5 subjects." },
  { icon: Lightbulb, title: "Explain a concept", q: "Explain gradient descent in simple words." },
  { icon: GraduationCap, title: "Courses and careers", q: "What skills should I build in my third year to get an internship?" },
  { icon: Wallet, title: "Scholarships", q: "How do I find scholarships I can apply for as an undergraduate?" },
];

const FAQS = [
  { q: "What can I ask here?", a: "Anything about studying: exam prep, assignments, concepts you're stuck on, study plans, courses, careers and scholarships." },
  { q: "Will it do my homework for me?", a: "It will explain, guide and check your thinking. You'll learn more if you try first and ask for help with the parts that confuse you." },
  { q: "Are the answers always correct?", a: "No. It can make mistakes. For deadlines, fees, syllabus or rules, confirm with your teacher, your college website or your textbook." },
  { q: "Which languages can I use?", a: "English, Hindi, Bengali, Tamil, Telugu and Marathi. Change it from the globe button on Home or in Settings." },
  { q: "Are my chats saved?", a: "In this prototype, chats only last while the app is open." },
  { q: "How do I start a fresh chat?", a: "Go to Settings and tap Clear chat history." },
];

const buildSystem = (lang, length) =>
  `You are a friendly study helper inside a student app. Reply in ${lang}. ` +
  `Use plain, simple words and short sentences. ` +
  (length === "Short"
    ? "Keep answers under 80 words. "
    : "Give fuller answers, up to about 200 words, with steps or examples when useful. ") +
  `Use plain text only: no markdown symbols, no headings. Use simple lines like "1." for steps. ` +
  `If you are not sure about a fact, deadline or rule, say so and suggest the student check with their teacher or college. ` +
  `Help the student understand, rather than just handing over finished graded work.`;

export default function App() {
  const [screen, setScreen] = useState("home");
  const [from, setFrom] = useState("home");
  const [lang, setLang] = useState("English");
  const [length, setLength] = useState("Short");
  const [dark, setDark] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, screen]);

  const go = (s) => { setFrom(screen); setScreen(s); };

  const ask = async (text) => {
    const t = text.trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user", content: t }];
    setMessages(next);
    setDraft("");
    setScreen("chat");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: buildSystem(lang, length),
          messages: next.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("").trim();
      if (!reply) throw new Error("empty");
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", error: true, content: "Couldn't get an answer. Check your connection and send the question again." }]);
    }
    setLoading(false);
  };

  const recent = messages.filter((m) => m.role === "user").slice(-3).reverse();

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "faqs", label: "FAQs", icon: CircleHelp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={`stage ${dark ? "dark" : ""}`}>
      <style>{css}</style>
      <div className="phone">
        {/* ---------- HOME ---------- */}
        {screen === "home" && (
          <div className="scroll">
            <div className="topbar">
              <span className="brand">Study Buddy</span>
              <button className="chip" onClick={() => go("language")} aria-label="Change language">
                <Globe size={15} /> {LANGS.find((l) => l.code === lang).native}
              </button>
            </div>
            <h1 className="hero">What are you studying today?</h1>
            <div className="askbox">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask(draft)}
                placeholder="Type a question"
                aria-label="Ask a question"
              />
              <button className="send" onClick={() => ask(draft)} aria-label="Send"><Send size={18} /></button>
            </div>

            <h2 className="sub">Try asking about</h2>
            <div className="rows">
              {TOPICS.map((t) => (
                <button key={t.title} className="row" onClick={() => ask(t.q)}>
                  <span className="ico"><t.icon size={18} /></span>
                  <span className="rowtext">
                    <b>{t.title}</b>
                    <small>{t.q}</small>
                  </span>
                  <ChevronRight size={18} className="muted" />
                </button>
              ))}
            </div>

            {recent.length > 0 && (
              <>
                <h2 className="sub">Your recent questions</h2>
                <div className="rows">
                  {recent.map((m, i) => (
                    <button key={i} className="row" onClick={() => setScreen("chat")}>
                      <span className="rowtext"><b className="clip">{m.content}</b></span>
                      <ChevronRight size={18} className="muted" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ---------- CHAT ---------- */}
        {screen === "chat" && (
          <div className="chatwrap">
            <div className="topbar">
              <span className="brand">Chat</span>
              <button className="chip" onClick={() => go("language")}>
                <Globe size={15} /> {LANGS.find((l) => l.code === lang).native}
              </button>
            </div>
            <div className="msgs">
              {messages.length === 0 && (
                <div className="empty">
                  <p>Ask about classes, exams, concepts or deadlines. Pick one to start:</p>
                  {TOPICS.slice(0, 3).map((t) => (
                    <button key={t.title} className="suggest" onClick={() => ask(t.q)}>{t.q}</button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role} ${m.error ? "err" : ""}`}>{m.content}</div>
              ))}
              {loading && <div className="bubble assistant dots"><i /><i /><i /></div>}
              <div ref={endRef} />
            </div>
            <div className="composer">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask(draft)}
                placeholder="Type your question"
                aria-label="Type your question"
              />
              <button className="send" onClick={() => ask(draft)} disabled={loading || !draft.trim()} aria-label="Send">
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ---------- LANGUAGE ---------- */}
        {screen === "language" && (
          <div className="scroll">
            <div className="topbar">
              <button className="back" onClick={() => setScreen(from === "language" ? "home" : from)} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
              <span className="brand">Language</span>
              <span style={{ width: 28 }} />
            </div>
            <p className="lead">Replies will be written in the language you pick.</p>
            <div className="rows">
              {LANGS.map((l) => (
                <button key={l.code} className={`row lang ${lang === l.code ? "on" : ""}`} onClick={() => setLang(l.code)}>
                  <span className="rowtext">
                    <b>{l.native}</b>
                    {l.native !== l.code && <small>{l.code}</small>}
                  </span>
                  {lang === l.code && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------- FAQS ---------- */}
        {screen === "faqs" && (
          <div className="scroll">
            <div className="topbar"><span className="brand">FAQs</span></div>
            <div className="rows">
              {FAQS.map((f, i) => (
                <div key={f.q} className="faq">
                  <button className="faqq" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                    <b>{f.q}</b>
                    <ChevronDown size={18} className={`muted chev ${openFaq === i ? "open" : ""}`} />
                  </button>
                  {openFaq === i && <p className="faqa">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- SETTINGS ---------- */}
        {screen === "settings" && (
          <div className="scroll">
            <div className="topbar"><span className="brand">Settings</span></div>

            <div className="rows">
              <button className="row" onClick={() => go("language")}>
                <span className="ico"><Globe size={18} /></span>
                <span className="rowtext"><b>Language</b><small>{lang}</small></span>
                <ChevronRight size={18} className="muted" />
              </button>

              <div className="row static">
                <span className="rowtext">
                  <b>Answer length</b>
                  <small>Short is faster to read. Detailed adds steps and examples.</small>
                </span>
              </div>
              <div className="seg" role="group" aria-label="Answer length">
                {["Short", "Detailed"].map((o) => (
                  <button key={o} className={length === o ? "on" : ""} onClick={() => setLength(o)}>{o}</button>
                ))}
              </div>

              <div className="row static">
                <span className="ico"><Moon size={18} /></span>
                <span className="rowtext"><b>Dark mode</b></span>
                <button className={`toggle ${dark ? "on" : ""}`} onClick={() => setDark(!dark)} role="switch" aria-checked={dark} aria-label="Dark mode">
                  <i />
                </button>
              </div>

              <button className="row danger" onClick={() => { setMessages([]); setScreen("chat"); }}>
                <span className="ico"><Trash2 size={18} /></span>
                <span className="rowtext"><b>Clear chat history</b><small>Removes all questions and answers</small></span>
              </button>
            </div>
            <p className="foot">Study Buddy prototype v0.1</p>
          </div>
        )}

        {/* ---------- TAB BAR ---------- */}
        {screen !== "language" && (
          <nav className="tabs">
            {tabs.map((t) => (
              <button key={t.id} className={screen === t.id ? "on" : ""} onClick={() => go(t.id)} aria-label={t.label}>
                <t.icon size={20} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

const css = `
.stage{--ink:#1B2559;--paper:#F5F7FB;--surface:#FFFFFF;--line:#E1E6F2;--muted:#5B6486;--hi:#FFE066;--sky:#DCE6FF;--bad:#C93C3C;
  min-height:100vh;display:flex;align-items:center;justify-content:center;background:#E7EBF5;padding:12px;box-sizing:border-box;
  font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink)}
.stage.dark{--ink:#EEF1FF;--paper:#12162B;--surface:#1C2140;--line:#2D3459;--muted:#A3ABCF;--sky:#2A3365;--bad:#FF8A8A;background:#0A0D1C}
.phone{width:100%;max-width:390px;height:min(760px,calc(100vh - 24px));background:var(--paper);border-radius:32px;overflow:hidden;
  display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(20,30,80,.18);border:1px solid var(--line)}
.phone *{box-sizing:border-box}
.phone button{font:inherit;color:inherit;cursor:pointer;background:none;border:none;padding:0;text-align:left}
.phone button:focus-visible,.phone input:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
.scroll{flex:1;overflow-y:auto;padding:18px 18px 24px}
.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;min-height:34px}
.brand{font-family:Georgia,"Times New Roman",serif;font-weight:700;font-size:20px}
.chip{display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--line)!important;border-radius:999px;padding:6px 12px!important;font-size:14px;font-weight:600}
.back{width:28px;height:28px;display:flex;align-items:center;justify-content:center}
.hero{font-family:Georgia,"Times New Roman",serif;font-size:31px;line-height:1.15;margin:6px 0 18px;font-weight:700}
.sub{font-size:15px;font-weight:700;margin:24px 0 10px}
.lead{color:var(--muted);margin:0 0 14px;font-size:15px}
.askbox,.composer{display:flex;gap:8px;align-items:center;background:var(--surface);border:2px solid var(--ink);border-radius:16px;padding:6px 6px 6px 14px}
.askbox input,.composer input{flex:1;border:none;background:transparent;font:inherit;font-size:16px;color:var(--ink);min-width:0;padding:8px 0}
.askbox input::placeholder,.composer input::placeholder{color:var(--muted)}
.askbox input:focus-visible,.composer input:focus-visible{outline:none}
.send{width:40px;height:40px;border-radius:12px;background:var(--hi)!important;color:#1B2559!important;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.send:disabled{opacity:.45;cursor:default}
.rows{display:flex;flex-direction:column;gap:8px}
.row{display:flex;align-items:center;gap:12px;width:100%;background:var(--surface)!important;border:1px solid var(--line)!important;border-radius:14px;padding:12px 14px!important}
.row.static{cursor:default}
.ico{width:34px;height:34px;border-radius:10px;background:var(--sky);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rowtext{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.rowtext b{font-size:15px}
.rowtext small{font-size:13px;color:var(--muted);line-height:1.35}
.clip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.muted{color:var(--muted);flex-shrink:0}
.row.lang.on{border:2px solid var(--ink)!important;background:linear-gradient(transparent 62%,var(--hi) 62%)!important}
.stage.dark .row.lang.on{background:var(--surface)!important}
.row.danger b{color:var(--bad)}
.row.danger .ico{background:transparent;border:1px solid var(--line)}
.seg{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:var(--sky);padding:4px;border-radius:12px;margin:-2px 0 4px}
.seg button{text-align:center!important;padding:9px 0!important;border-radius:9px;font-weight:600;font-size:15px}
.seg button.on{background:var(--hi)!important;color:#1B2559!important}
.toggle{width:46px;height:28px;border-radius:999px;background:var(--line)!important;position:relative;flex-shrink:0}
.toggle i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}
.toggle.on{background:var(--ink)!important}
.toggle.on i{transform:translateX(18px)}
.foot{text-align:center;color:var(--muted);font-size:13px;margin-top:22px}
.faq{background:var(--surface);border:1px solid var(--line);border-radius:14px}
.faqq{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:14px!important}
.faqq b{font-size:15px}
.chev{transition:transform .15s}.chev.open{transform:rotate(180deg)}
.faqa{margin:0;padding:0 14px 14px;color:var(--muted);font-size:15px;line-height:1.5}
.chatwrap{flex:1;display:flex;flex-direction:column;min-height:0;padding:18px 14px 10px}
.chatwrap .topbar{padding:0 4px}
.msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px 12px}
.bubble{max-width:86%;padding:10px 14px;border-radius:18px;font-size:15.5px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}
.bubble.user{align-self:flex-end;background:var(--ink);color:var(--paper);border-bottom-right-radius:6px}
.bubble.assistant{align-self:flex-start;background:var(--surface);border:1px solid var(--line);border-bottom-left-radius:6px}
.bubble.err{border-color:var(--bad);color:var(--bad)}
.dots{display:flex;gap:5px;padding:14px 16px}
.dots i{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:b 1s infinite}
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes b{0%,60%,100%{opacity:.3}30%{opacity:1}}
.empty p{color:var(--muted);margin:8px 2px 12px;font-size:15px}
.suggest{display:block;width:100%;background:var(--surface)!important;border:1px solid var(--line)!important;border-radius:14px;padding:12px 14px!important;margin-bottom:8px;font-size:15px}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);background:var(--surface);border-top:1px solid var(--line);padding:6px 6px 10px}
.tabs button{display:flex!important;flex-direction:column;align-items:center;gap:3px;padding:6px 0!important;font-size:12px;color:var(--muted);text-align:center!important;border-radius:10px}
.tabs button.on{color:var(--ink);font-weight:700}
.tabs button.on span{background:linear-gradient(transparent 55%,var(--hi) 55%);padding:0 4px}
.stage.dark .tabs button.on span{background:none;color:var(--hi)}
@media (prefers-reduced-motion:reduce){.dots i,.toggle i,.chev{animation:none;transition:none}}
@media (max-width:420px){.stage{padding:0}.phone{border-radius:0;height:100vh;max-width:none;border:none}}
`;
