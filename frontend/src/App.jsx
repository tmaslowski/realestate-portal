import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import AgentSetup from "./AgentSetup.jsx";

const FALLBACK_DEMO_DATA = {
  buyer: { name: "Buyer Name", email: "buyer@email.com" },
  agent: { name: "Agent Name", email: "agent@brokerage.com" },
  property: { address: "123 Main St, Gainesville, GA" },
  transaction: {
    id: 0,
    address: "123 Main St, Gainesville, GA",
    status: "Active",
    closing_date: null,
    lofty_transaction_id: "",
  },
  tasks: [],
  utilities: [],
  documents: [],
  closing_attorney: null,
  preferred_vendors: [],
  homestead_exemption_url: "",
  review_url: "",
  faqs: [],
};

function fmtDate(isoOrNull) {
  if (!isoOrNull) return "—";
  try {
    const d = new Date(isoOrNull);
    if (Number.isNaN(d.getTime())) return isoOrNull;
    return d.toLocaleDateString();
  } catch {
    return isoOrNull;
  }
}

function BuyerPortal() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("t");
  }, []);

  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`http://127.0.0.1:8000/api/portal/session/?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load session");
        return j;
      })
      .then(setSession)
      .catch((e) => setError(e.message));
  }, [token]);

  const d = session ?? FALLBACK_DEMO_DATA;

  if (token && error) {
    return <div style={{ padding: 20 }}>Error loading portal: {error}</div>;
  }
  if (token && !session) {
    return <div style={{ padding: 20 }}>Loading your purchase details…</div>;
  }

  return (
    <div className="appShell">
      {/* Debug strip — keep for now, remove later */}
      <div style={{ padding: 10, background: "#111", color: "#eee" }}>
        Token: {token ? "YES" : "NO"} | API session: {session ? "YES" : "NO"}{" "}
        {session?.property?.address ? `| Address: ${session.property.address}` : ""}
      </div>

      {/* Hero Image */}
      {d.property?.hero_image_url ? (
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto 16px",
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            position: "relative",
            height: 240,
            backgroundImage: `url(${d.property.hero_image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(5,7,19,0.85) 0%, rgba(5,7,19,0.35) 55%, rgba(5,7,19,0.10) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 90,
              background:
                "linear-gradient(180deg, rgba(5,7,19,0.0), rgba(5,7,19,0.75))",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 14,
              bottom: 12,
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.35)",
              color: "#e9eefc",
              backdropFilter: "blur(8px)",
            }}
          >
            Property Photo
          </div>
        </div>
      ) : null}

      <header className="topHeader">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 260, flex: "1 1 520px" }}>
            {/* Brokerage Logo */}
            {d.agent?.brokerage_logo_url ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <img
                  src={d.agent.brokerage_logo_url}
                  alt="Brokerage logo"
                  style={{
                    height: 36,
                    maxWidth: 220,
                    objectFit: "contain",
                    display: "block",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "6px 10px",
                  }}
                />
                <div style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap" }}>
                  Brokerage
                </div>
              </div>
            ) : null}

            <div className="propertyTitle">{d.property.address}</div>
            <div className="subLine">
              <span className="pill">{d.transaction.status}</span>
              <span className="muted">Closing: {d.transaction.closing_date || "—"}</span>
            </div>
          </div>

          {/* Countdown */}
          <div
            style={{
              flex: "0 0 auto",
              minWidth: 220,
              padding: "14px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
              backdropFilter: "blur(10px)",
            }}
          >
            {d.transaction?.closing_date ? (
              (() => {
                const now = new Date();
                const closing = new Date(`${d.transaction.closing_date}T23:59:59`);
                const msPerDay = 1000 * 60 * 60 * 24;
                const diffMs = closing.getTime() - now.getTime();
                const days = Math.ceil(diffMs / msPerDay);

                const headline = days > 0 ? `${days}` : "0";
                const sub =
                  days > 1
                    ? "days until closing"
                    : days === 1
                    ? "day until closing"
                    : "closing today";

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      Days Until Closing
                    </div>

                    <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: "-1px" }}>
                      {headline}
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.85 }}>{sub}</div>

                    {days < 0 && (
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        ⚠️ Closing date is in the past
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.8,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Days Until Closing
                </div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 8 }}>
                  No closing date set yet.
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="grid">
        {/* Buyer */}
        <div className="card">
          <div className="cardTitle">Buyer</div>
          <div className="cardRow">
            <span className="label">Name</span>
            <span className="value">{d.buyer.name}</span>
          </div>
          <div className="cardRow">
            <span className="label">Email</span>
            <span className="value">{d.buyer.email}</span>
          </div>
        </div>

        {/* Agent */}
        <div className="card">
          <div className="cardTitle">Your Agent</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {d.agent?.photo_url ? (
              <img
                src={d.agent.photo_url}
                alt="Agent"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "#0b1226",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  opacity: 0.75,
                }}
              >
                No Photo
              </div>
            )}

            <div>
              <div style={{ fontWeight: 650, fontSize: 16 }}>{d.agent.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{d.agent.email}</div>
            </div>
          </div>
        </div>

        {/* Transaction */}
        <div className="card">
          <div className="cardTitle">Transaction</div>
          <div className="cardRow">
            <span className="label">ID</span>
            <span className="value">{d.transaction.id}</span>
          </div>
          <div className="cardRow">
            <span className="label">Status</span>
            <span className="value">{d.transaction.status}</span>
          </div>
          <div className="cardRow">
            <span className="label">Closing Date</span>
            <span className="value">{fmtDate(d.transaction.closing_date)}</span>
          </div>
        </div>

        {/* Documents */}
        <div className="card">
          <div className="cardTitle">Documents</div>
          {d.documents?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{doc.title}</div>
                    {doc.doc_type && (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{doc.doc_type}</div>
                    )}
                  </div>

                  <a
                    href={`http://127.0.0.1:8000${doc.url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 13,
                      textDecoration: "none",
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.08)",
                      color: "#e9eefc",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No documents uploaded yet.</div>
          )}
        </div>

        {/* Closing Attorney */}
        <div className="card">
          <div className="cardTitle">Closing Attorney</div>
          {d.closing_attorney ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontWeight: 650 }}>{d.closing_attorney.name}</div>
              {d.closing_attorney.phone && <div className="muted">{d.closing_attorney.phone}</div>}
              {d.closing_attorney.email && <div className="muted">{d.closing_attorney.email}</div>}
              {d.closing_attorney.website && (
                <a href={d.closing_attorney.website} target="_blank" rel="noreferrer" className="link">
                  Website
                </a>
              )}
              {d.closing_attorney.notes && (
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
                  {d.closing_attorney.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="muted">Not set yet.</div>
          )}
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="cardTitle">Your To-Do List</div>
          {d.tasks?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.tasks.map((task) => (
                <label
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!task.completed}
                    onChange={async () => {
                      if (!token) return;

                      await fetch(`http://127.0.0.1:8000/api/portal/tasks/${task.id}/toggle/`, {
                        method: "POST",
                      });

                      const r = await fetch(
                        `http://127.0.0.1:8000/api/portal/session/?t=${encodeURIComponent(token)}`
                      );
                      setSession(await r.json());
                    }}
                    style={{ marginTop: 4 }}
                  />

                  <div>
                    <div style={{ fontWeight: 650, opacity: task.completed ? 0.65 : 1 }}>
                      {task.title}
                    </div>

                    {task.description && (
                      <div style={{ fontSize: 13, opacity: 0.78, marginTop: 2 }}>
                        {task.description}
                      </div>
                    )}

                    {task.due_date && (
                      <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                        Due by {task.due_date}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="muted">No tasks yet.</div>
          )}
        </div>

        {/* Utilities */}
        <div className="card">
          <div className="cardTitle">Utilities</div>
          {d.utilities?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {d.utilities.map((u) => (
                <div
                  key={u.id}
                  style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 650 }}>
                      {u.category_label}: {u.provider_name}
                    </div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>
                      {u.due_date ? `Set up by: ${u.due_date}` : ""}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 6,
                      fontSize: 13,
                      opacity: 0.92,
                    }}
                  >
                    {u.phone && <span>📞 {u.phone}</span>}
                    {u.website && (
                      <a href={u.website} target="_blank" rel="noreferrer" style={{ color: "#cfe2ff" }}>
                        🔗 Website
                      </a>
                    )}
                    {u.account_number_hint && <span>🧾 Acct: {u.account_number_hint}</span>}
                  </div>

                  {u.notes && (
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85, lineHeight: 1.35 }}>
                      {u.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No utility setup info yet.</div>
          )}
        </div>

        {/* Helpful Links */}
        <div className="card">
          <div className="cardTitle">Helpful Links</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 650 }}>Homestead Exemption</div>
                <div className="muted">File after closing (varies by county/state)</div>
              </div>

              {d.homestead_exemption_url ? (
                <a href={d.homestead_exemption_url} target="_blank" rel="noreferrer" className="btn">
                  Open
                </a>
              ) : (
                <div className="muted">Not set</div>
              )}
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 650 }}>Leave a Review</div>
                <div className="muted">If you enjoyed working with your agent</div>
              </div>

              {d.review_url ? (
                <a href={d.review_url} target="_blank" rel="noreferrer" className="btn">
                  Review
                </a>
              ) : (
                <div className="muted">Not set</div>
              )}
            </div>
          </div>
        </div>

        {/* Preferred Vendors */}
        <div className="card">
          <div className="cardTitle">Preferred Vendors</div>
          {d.preferred_vendors?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {d.preferred_vendors.map((v) => (
                <div
                  key={v.id}
                  style={{
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 650 }}>{v.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{v.category_label}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                    {v.phone && <div className="muted">{v.phone}</div>}
                    {v.email && <div className="muted">{v.email}</div>}
                    {v.website && (
                      <a href={v.website} target="_blank" rel="noreferrer" className="link">
                        Website
                      </a>
                    )}
                    {v.notes && (
                      <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
                        {v.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No preferred vendors added yet.</div>
          )}
        </div>

        {/* FAQs */}
        <div className="card">
          <div className="cardTitle">FAQs</div>
          {d.faqs?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.faqs.map((f) => (
                <details
                  key={f.id}
                  style={{
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <summary style={{ cursor: "pointer", fontWeight: 650 }}>{f.q}</summary>
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.82, lineHeight: 1.4 }}>
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="muted">No FAQs added yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BuyerPortal />} />
        <Route path="/agent" element={<AgentSetup />} />
      </Routes>
    </BrowserRouter>
  );
}