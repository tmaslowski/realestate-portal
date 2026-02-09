import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import AgentSetup from "./AgentSetup.jsx";

const API_BASE = "http://127.0.0.1:8000/api/portal";

// --- NEW: Glass-morphism Login Component ---
function Login({ type = "agent" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [debugLink, setDebugLink] = useState("");

  const handleRequest = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const r = await fetch(`${API_BASE}/request-link/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_type: type }),
      });
      const j = await r.json();
      setStatus("sent");
      if (j.debug_link) setDebugLink(j.debug_link);
    } catch (err) {
      setStatus("idle");
    }
  };

  return (
    <div className="loginPage">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="glassCard loginCard">
        <h2 className="loginTitle">{type === "agent" ? "Agent Access" : "Buyer Portal"}</h2>
        {status !== "sent" ? (
          <form onSubmit={handleRequest} className="loginForm">
            <p className="loginSub">Enter your email for a secure magic link.</p>
            <div className="inputGroup">
              <label>Email Address</label>
              <input 
                type="email" 
                className="glassInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="glassBtn" disabled={status === "loading"}>
              {status === "loading" ? "Sending..." : "Send Link"}
            </button>
          </form>
        ) : (
          <div className="successState">
            <div className="successIcon">📩</div>
            <h3>Check your inbox</h3>
            <p className="loginSub">A link is on its way to {email}.</p>
            {debugLink && (
               <div className="debugBox">
                 <p style={{fontSize: '11px', opacity: 0.6}}>DEBUG MODE:</p>
                 <a href={debugLink} style={{color: '#3b82f6'}}>Click to Login</a>
               </div>
            )}
            <button onClick={() => setStatus("idle")} className="textBtn">Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- NEW: Token Guard Helper ---
function TokenCheck({ wrapper: Component, login: LoginScreen }) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("t");
  return token ? <Component /> : LoginScreen;
}

const FALLBACK_DEMO_DATA = {
  buyer: { name: "Buyer Name", email: "buyer@email.com" },
  agent: { name: "Agent Name", email: "agent@brokerage.com" },
  property: { address: "123 Main St, Gainesville, GA" },
  transaction: { id: 0, address: "123 Main St, Gainesville, GA", status: "Active", closing_date: null },
  tasks: [], utilities: [], documents: [], preferred_vendors: [], faqs: []
};

function BuyerPortal() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("t");
  }, []);

  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/session/?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load session");
        return j;
      })
      .then(setSession)
      .catch((e) => setError(e.message));
  }, [token]);

  const d = session ?? FALLBACK_DEMO_DATA;

  if (token && error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  
  return (
    <div className="appShell">
      <div style={{ padding: 10, background: "#111", color: "#eee" }}>
        Token Active | {session?.property?.address || "Ready"}
      </div>

      {d.property?.hero_image_url && (
        <div style={{
            maxWidth: 1100, margin: "0 auto 16px", borderRadius: 18, overflow: "hidden",
            height: 240, backgroundImage: `url(${d.property.hero_image_url})`,
            backgroundSize: "cover", backgroundPosition: "center", position: "relative"
          }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(5,7,19,0.85) 0%, transparent 100%)" }} />
        </div>
      )}

      <header className="topHeader">
        <div className="propertyTitle">{d.property.address}</div>
        <div className="subLine">
          <span className="pill">{d.transaction.status}</span>
          <span className="muted">Closing: {d.transaction.closing_date || "TBD"}</span>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <div className="cardTitle">Your Agent</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontWeight: 650 }}>{d.agent.name}</div>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Tasks</div>
          {d.tasks.map(t => (
            <div key={t.id} style={{ fontSize: 13, padding: '4px 0' }}>
              {t.completed ? "✅" : "⭕"} {t.title}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="cardTitle">Helpful Links</div>
          <a href={d.my_documents_url} target="_blank" className="btn">Documents Folder</a>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <TokenCheck wrapper={BuyerPortal} login={<Login type="buyer" />} />
        } />
        <Route path="/agent" element={
          <TokenCheck wrapper={AgentSetup} login={<Login type="agent" />} />
        } />
      </Routes>
    </BrowserRouter>
  );
}