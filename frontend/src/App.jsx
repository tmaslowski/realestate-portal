import { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * This is your *safe fallback* when no token is present.
 * It also prevents your UI from crashing while session is loading.
 */
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
  documents: [],
  messages: [],
};

function fmtDate(isoOrNull) {
  if (!isoOrNull) return "—";
  // Django DateField returns "YYYY-MM-DD" (no time)
  // This makes it readable.
  try {
    const d = new Date(isoOrNull);
    if (Number.isNaN(d.getTime())) return isoOrNull;
    return d.toLocaleDateString();
  } catch {
    return isoOrNull;
  }
}

export default function App() {
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

  // ✅ This is the key line: your UI should render from `d`, not hardcoded strings.
  const d = session ?? FALLBACK_DEMO_DATA;

  // Simple states for token-based access
  if (token && error) {
    return <div style={{ padding: 20 }}>Error loading portal: {error}</div>;
  }
  if (token && !session) {
    return <div style={{ padding: 20 }}>Loading your purchase details…</div>;
  }

  /**
   * ✅ BELOW THIS POINT:
   * Paste your existing UI markup and replace hardcoded strings with d.* fields.
   */
  return (
    <div className="appShell">
      {/* Debug strip — keep for now, remove later */}
      <div style={{ padding: 10, background: "#111", color: "#eee" }}>
        Token: {token ? "YES" : "NO"} | API session: {session ? "YES" : "NO"}{" "}
        {session?.property?.address ? `| Address: ${session.property.address}` : ""}
      </div>

      {/* ===== Example header bound to data ===== */}
      <header className="topHeader">
        <div className="propertyTitle">{d.property.address}</div>
        <div className="subLine">
          <span className="pill">{d.transaction.status}</span>
          <span className="muted">Closing: {fmtDate(d.transaction.closing_date)}</span>
        </div>
      </header>

      {/* ===== Example sections bound to data ===== */}
      <section className="grid">
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

        <div className="card">
          <div className="cardTitle">Agent</div>
          <div className="cardRow">
            <span className="label">Name</span>
            <span className="value">{d.agent.name}</span>
          </div>
          <div className="cardRow">
            <span className="label">Email</span>
            <span className="value">{d.agent.email}</span>
          </div>
        </div>

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

        <div className="card">
  <div className="cardTitle">Utilities</div>

  {d.utilities?.length ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {d.utilities.map((u) => (
        <div key={u.id} style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div style={{ fontWeight: 650 }}>
              {u.category_label}: {u.provider_name}
            </div>
            <div style={{ opacity: 0.75, fontSize: 12 }}>
              {u.due_date ? `Set up by: ${u.due_date}` : ""}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, fontSize: 13, opacity: 0.92 }}>
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
      </section>

      {/* Paste the rest of your UI below and bind it to `d` */}
    </div>
  );
}