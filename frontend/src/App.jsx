import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import AgentSetup from "./AgentSetup";
import Home from "./Home";
import AgentSignup from "./AgentSignup";
import AgentLogin from "./AgentLogin";

const API_BASE = "http://127.0.0.1:8000/api/portal";

function BuyerPortal() {
  const token = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("t") || "";
  }, []);

  const [session, setSession] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // "Today" ticker so countdown updates even if page stays open
  const [todayKey, setTodayKey] = useState(() => new Date().toDateString());
  useEffect(() => {
    const id = setInterval(() => setTodayKey(new Date().toDateString()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setErr("");

    fetch(`${API_BASE}/session/?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || "Failed to load session");
        return j;
      })
      .then(setSession)
      .catch((e) => setErr(e.message || "Failed to load session"))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div style={shell}>
        <TopBar />
        <div style={page}>
          <Card>
            <h2 style={h2}>Buyer link needed</h2>
            <p style={pMuted}>
              This page requires a secure link from your agent.
            </p>
            <p style={pMuted}>
              If you expected to see your portal, open the exact link your agent texted or emailed you.
            </p>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={label}>Are you an agent?</div>
                <div style={pMuted}>Set up transactions without the admin panel.</div>
              </div>
              <Link to="/agent/signup" style={btnPrimary}>
                Agent Signup
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={shell}>
        <TopBar />
        <div style={page}>
          <Card>
            <div style={pMuted}>Loading your portal…</div>
          </Card>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={shell}>
        <TopBar />
        <div style={page}>
          <Card>
            <h2 style={h2}>Link error</h2>
            <p style={{ ...pMuted, color: "#ffb4b4" }}>{err}</p>
            <p style={pMuted}>Ask your agent to send a fresh link.</p>
          </Card>
        </div>
      </div>
    );
  }

  const d = session;
  const closingDate = d?.transaction?.closing_date || null;

  const daysUntilClosing = (() => {
    if (!closingDate) return null;

    // Calendar-day diff (stable across timezones)
    const [y, m, day] = closingDate.split("-").map((n) => parseInt(n, 10));
    if (!y || !m || !day) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const closing = new Date(y, m - 1, day);

    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.ceil((closing.getTime() - today.getTime()) / msPerDay);

    // tie to todayKey so it updates automatically
    void todayKey;

    return diff;
  })();

  return (
    <div style={shell}>
      <TopBar />
      <div style={page}>
        {/* Hero */}
        <div style={heroWrap}>
          {d?.property?.hero_image_url ? (
            <div
              style={{
                ...hero,
                backgroundImage: `url(${d.property.hero_image_url})`,
              }}
            />
          ) : (
            <div style={{ ...hero, background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))" }} />
          )}

          <div style={heroOverlay} />
          <div style={heroContent}>
            <div style={pillRow}>
              <span style={pill}>{d?.transaction?.status || "Active"}</span>
              {closingDate ? (
                <span style={pillGhost}>Closing {formatDate(closingDate)}</span>
              ) : (
                <span style={pillGhost}>Closing date not set</span>
              )}
            </div>

            <div style={heroTitle}>{d?.property?.address || d?.transaction?.address || "Your Home Purchase"}</div>

            {typeof daysUntilClosing === "number" ? (
              <div style={countdownRow}>
                <div style={countBig}>{Math.max(daysUntilClosing, 0)}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={countLabel}>days until closing</div>
                  <div style={pMutedSmall}>
                    {daysUntilClosing > 1
                      ? "You’re on track."
                      : daysUntilClosing === 1
                      ? "Closing is tomorrow."
                      : "Closing is today (or passed)."}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tasks */}
        <Card>
          <div style={cardHeader}>
            <div>
              <div style={h3}>To-Do</div>
              <div style={pMutedSmall}>Check items off as you go.</div>
            </div>
          </div>

          {d?.tasks?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.tasks.map((t) => (
                <label key={t.id} style={row}>
                  <input type="checkbox" checked={!!t.completed} readOnly />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontWeight: 650, opacity: t.completed ? 0.7 : 1 }}>{t.title}</div>
                    {t.description ? <div style={pMutedSmall}>{t.description}</div> : null}
                    {t.due_date ? <div style={tiny}>Due {formatDate(t.due_date)}</div> : null}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div style={pMuted}>No tasks yet.</div>
          )}
        </Card>

        {/* Utilities (ONLY utilities live here) */}
        <Card>
          <div style={cardHeader}>
            <div>
              <div style={h3}>Utilities</div>
              <div style={pMutedSmall}>Set up before move-in.</div>
            </div>
          </div>

          {d?.utilities?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {d.utilities.map((u) => (
                <div key={u.id} style={blockRow}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 650 }}>{u.category_label}: {u.provider_name}</div>
                    {u.due_date ? <div style={tiny}>Set up by {formatDate(u.due_date)}</div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                    {u.phone ? <span style={tiny}>📞 {u.phone}</span> : null}
                    {u.website ? (
                      <a style={link} href={u.website} target="_blank" rel="noreferrer">
                        🔗 Website
                      </a>
                    ) : null}
                    {u.account_number_hint ? <span style={tiny}>🧾 {u.account_number_hint}</span> : null}
                  </div>
                  {u.notes ? <div style={{ ...pMutedSmall, marginTop: 6 }}>{u.notes}</div> : null}
                </div>
              ))}
            </div>
          ) : (
            <div style={pMuted}>No utility info yet.</div>
          )}
        </Card>

        {/* Helpful Links (+ My Documents) */}
        <Card>
          <div style={cardHeader}>
            <div>
              <div style={h3}>Helpful Links</div>
              <div style={pMutedSmall}>Keep everything in one place.</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <LinkRow
              title="My Documents"
              subtitle="Your folder (Google Drive / Box / Dropbox)"
              href={d?.my_documents_url}
              empty="Not set yet"
            />
            <Divider />
            <LinkRow
              title="Homestead Exemption"
              subtitle="File after closing (varies by county)"
              href={d?.homestead_exemption_url}
              empty="Not set"
            />
            <Divider />
            <LinkRow
              title="Leave a Review"
              subtitle="If you enjoyed working with your agent"
              href={d?.review_url}
              empty="Not set"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Professional entry */}
        <Route path="/" element={<Home />} />

        {/* Buyer portal (magic link) */}
        <Route path="/buyer" element={<BuyerPortal />} />

        {/* Agent flows */}
        <Route path="/agent" element={<AgentSetup />} />
        <Route path="/agent/signup" element={<AgentSignup />} />
        <Route path="/agent/login" element={<AgentLogin />} />

        {/* Simple 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ---------- Small components + styling ---------- */

function TopBar() {
  return (
    <div style={topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={logoDot} />
        <div style={{ fontWeight: 800, letterSpacing: "-0.2px" }}>Home Purchase Portal</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link to="/" style={topLink}>Home</Link>
        <Link to="/agent/signup" style={topLink}>Agent</Link>
      </div>
    </div>
  );
}

function Card({ children }) {
  return <div style={card}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />;
}

function LinkRow({ title, subtitle, href, empty }) {
  const ok = !!(href && String(href).trim());
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <div>
        <div style={{ fontWeight: 750 }}>{title}</div>
        <div style={pMutedSmall}>{subtitle}</div>
      </div>
      {ok ? (
        <a href={href} target="_blank" rel="noreferrer" style={btnGhost}>Open</a>
      ) : (
        <div style={pMutedSmall}>{empty}</div>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div style={shell}>
      <TopBar />
      <div style={page}>
        <Card>
          <h2 style={h2}>Page not found</h2>
          <p style={pMuted}>Go back to the homepage.</p>
          <Link to="/" style={btnPrimary}>Home</Link>
        </Card>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    // ISO could be YYYY-MM-DD
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

const shell = {
  minHeight: "100vh",
  background: "radial-gradient(1200px 600px at 20% 0%, rgba(98,155,255,0.14), rgba(0,0,0,0))",
  color: "rgba(255,255,255,0.92)",
};

const topbar = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(8, 12, 20, 0.75)",
  backdropFilter: "blur(10px)",
};

const topLink = {
  textDecoration: "none",
  color: "rgba(255,255,255,0.82)",
  fontSize: 13,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
};

const logoDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 0 0 3px rgba(255,255,255,0.12)",
};

const page = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const heroWrap = {
  position: "relative",
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
};

const hero = {
  height: 230,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const heroOverlay = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(90deg, rgba(6,10,18,0.88) 0%, rgba(6,10,18,0.35) 65%, rgba(6,10,18,0.10) 100%)",
};

const heroContent = {
  position: "absolute",
  inset: 0,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: 10,
};

const pillRow = { display: "flex", gap: 8, flexWrap: "wrap" };
const pill = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.35)",
};
const pillGhost = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
};

const heroTitle = {
  fontSize: 20,
  fontWeight: 900,
  letterSpacing: "-0.4px",
  textShadow: "0 10px 24px rgba(0,0,0,0.45)",
};

const countdownRow = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.28)",
  width: "fit-content",
};

const countBig = {
  fontSize: 42,
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "-1px",
};

const countLabel = { fontSize: 12, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.7 };
const tiny = { fontSize: 12, opacity: 0.72 };

const card = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  padding: 14,
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  marginBottom: 10,
};

const row = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.18)",
};

const blockRow = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.16)",
};

const link = {
  color: "rgba(205,228,255,0.95)",
  textDecoration: "none",
  borderBottom: "1px solid rgba(205,228,255,0.25)",
};

const btnPrimary = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 800,
};

const btnGhost = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  textDecoration: "none",
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.16)",
  color: "rgba(255,255,255,0.9)",
  fontWeight: 750,
  fontSize: 13,
};

const h2 = { margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: "-0.3px" };
const h3 = { margin: 0, fontSize: 16, fontWeight: 900, letterSpacing: "-0.2px" };
const label = { fontSize: 12, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.7 };
const pMuted = { margin: "8px 0 0", opacity: 0.78, lineHeight: 1.4 };
const pMutedSmall = { fontSize: 13, opacity: 0.78, lineHeight: 1.35 };