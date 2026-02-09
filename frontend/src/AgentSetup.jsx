import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api/portal";

// --- Agent token helpers (store token + remove from URL) ---
function readTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("t") || "";
}

function getAgentToken() {
  return sessionStorage.getItem("agent_token") || "";
}

function setAgentToken(token) {
  sessionStorage.setItem("agent_token", token);

  // Remove ?t=... from the URL so it doesn't get copied/shared
  const url = new URL(window.location.href);
  url.searchParams.delete("t");
  window.history.replaceState({}, "", url.toString());
}

// Wrapper to build auth headers for agent API calls
function agentHeaders(extra = {}) {
  const t = getAgentToken();
  return {
    ...extra,
    ...(t ? { "X-Agent-Token": t } : {}),
  };
}

export default function AgentSetup() {
  // Token can arrive via ?t=..., we store it in sessionStorage and strip it from URL
  const token = useMemo(() => {
    return getAgentToken();
  }, []);

  useEffect(() => {
    const t = readTokenFromUrl();
    if (t) {
      setAgentToken(t);
      // Optional: Refresh the page or trigger a re-render if needed, 
      // but here we'll rely on the existing effect triggers.
      window.location.reload(); 
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [agent, setAgent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const [txnData, setTxnData] = useState(null);

  // ---- Basics ----
  const [address, setAddress] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [homesteadUrl, setHomesteadUrl] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [myDocsUrl, setMyDocsUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // ---- Create Transaction ----
  const [showCreateTxn, setShowCreateTxn] = useState(false);
  const [creatingTxn, setCreatingTxn] = useState(false);
  const [newTxn, setNewTxn] = useState({
    buyer_name: "",
    buyer_email: "",
    address: "",
    closing_date: "",
  });

  // ---- Vendors ----
  const [vendorFavorites, setVendorFavorites] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState("");

  const [closingAttorneyId, setClosingAttorneyId] = useState("");
  const [preferredVendorIds, setPreferredVendorIds] = useState(new Set());
  const [utilityVendorIds, setUtilityVendorIds] = useState(new Set());

  const [vendorsSaving, setVendorsSaving] = useState(false);
  const [vendorsMsg, setVendorsMsg] = useState("");

  // =========================
  // Load agent session
  // =========================
  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/agent/session/`, {
          headers: agentHeaders(),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load agent session");

        setAgent(j.agent);
        setTransactions(j.transactions || []);

        if (j.transactions?.length) {
          setSelectedId(String(j.transactions[0].id));
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) loadSession();
  }, [token]);

  // =========================
  // Load vendor favorites
  // =========================
  useEffect(() => {
    async function loadVendors() {
      setVendorsLoading(true);
      try {
        const r = await fetch(`${API_BASE}/agent/vendors/`, {
          headers: agentHeaders(),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load vendors");
        setVendorFavorites(j.favorites || []);
      } catch (e) {
        setVendorsError(e.message);
      } finally {
        setVendorsLoading(false);
      }
    }

    if (token) loadVendors();
  }, [token]);

  // =========================
  // Load selected transaction
  // =========================
  useEffect(() => {
    async function loadTxn() {
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/agent/transaction/${selectedId}/`, {
          headers: agentHeaders(),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load transaction");

        setTxnData(j);
        setAddress(j.transaction?.address || "");
        setClosingDate(j.transaction?.closing_date || "");
        setHeroImageUrl(j.property?.hero_image_url || "");
        setHomesteadUrl(j.homestead_exemption_url || "");
        setReviewUrl(j.review_url || "");
        setMyDocsUrl(j.my_documents_url || "");

        setClosingAttorneyId(j.closing_attorney?.id ? String(j.closing_attorney.id) : "");
        setPreferredVendorIds(new Set((j.preferred_vendors || []).map(v => String(v.id))));
        setUtilityVendorIds(new Set((j.utility_providers || []).map(v => String(v.id))));
      } catch (e) {
        setErr(e.message);
      }
    }

    if (selectedId && token) loadTxn();
  }, [selectedId, token]);

  // =========================
  // Save basics
  // =========================
  async function saveBasics() {
    setSaving(true);
    setSaveMsg("");
    try {
      const r = await fetch(`${API_BASE}/agent/transaction/${selectedId}/`, {
        method: "PATCH",
        headers: agentHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          address,
          closing_date: closingDate || null,
          hero_image_url: heroImageUrl,
          homestead_exemption_url: homesteadUrl,
          review_url: reviewUrl,
          my_documents_url: myDocsUrl,
        }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Save failed");

      setSaveMsg("Saved ✓");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // Save vendors + utilities
  // =========================
  async function saveVendors() {
    setVendorsSaving(true);
    setVendorsMsg("");
    try {
      const vResp = await fetch(`${API_BASE}/agent/transaction/${selectedId}/vendors/`, {
        method: "POST",
        headers: agentHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          closing_attorney_vendor_id: closingAttorneyId ? Number(closingAttorneyId) : null,
          preferred_vendor_ids: Array.from(preferredVendorIds).map(Number),
        }),
      });
      if (!vResp.ok) throw new Error("Failed to save vendors");

      const uResp = await fetch(`${API_BASE}/agent/transaction/${selectedId}/utilities/set/`, {
        method: "POST",
        headers: agentHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          utility_vendor_ids: Array.from(utilityVendorIds).map(Number),
        }),
      });
      if (!uResp.ok) throw new Error("Failed to save utilities");

      setVendorsMsg("Saved ✓");
    } catch (e) {
      setVendorsError(e.message);
    } finally {
      setVendorsSaving(false);
    }
  }

  // =========================
  // Create transaction
  // =========================
  async function createTransaction() {
    setCreatingTxn(true);
    try {
      const r = await fetch(`${API_BASE}/agent/transaction/create/`, {
        method: "POST",
        headers: agentHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(newTxn),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Create failed");

      setShowCreateTxn(false);
      setNewTxn({ buyer_name: "", buyer_email: "", address: "", closing_date: "" });

      const rs = await fetch(`${API_BASE}/agent/session/`, {
        headers: agentHeaders(),
      });
      const js = await rs.json();
      setTransactions(js.transactions || []);
      setSelectedId(String(j.transaction.id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreatingTxn(false);
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
      <h2>Agent Setup</h2>

      {err && <div style={{ color: "#ffb4b4", marginBottom: 12 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        {/* Transactions Sidebar */}
        <div style={card}>
          <strong>Transactions</strong>
          {loading ? (
            <div style={{ marginTop: 8 }}>Loading…</div>
          ) : (
            <>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={input}>
                {transactions.map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.address}
                  </option>
                ))}
              </select>
              <button style={btnSecondary} onClick={() => setShowCreateTxn(v => !v)}>
                {showCreateTxn ? "Cancel" : "+ Create Transaction"}
              </button>

              {showCreateTxn && (
                <div style={{ marginTop: 12 }}>
                  {["buyer_name", "buyer_email", "address", "closing_date"].map(k => (
                    <input
                      key={k}
                      type={k === "closing_date" ? "date" : "text"}
                      placeholder={k.replace("_", " ")}
                      value={newTxn[k]}
                      onChange={e => setNewTxn(p => ({ ...p, [k]: e.target.value }))}
                      style={input}
                    />
                  ))}
                  <button style={btnPrimary} onClick={createTransaction}>
                    {creatingTxn ? "Creating…" : "Create"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Details Area */}
        <div style={card}>
          <h3>Basics</h3>
          <input style={input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
          <input style={input} type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} />
          <input style={input} value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} placeholder="Hero image URL" />
          <input style={input} value={homesteadUrl} onChange={e => setHomesteadUrl(e.target.value)} placeholder="Homestead link" />
          <input style={input} value={reviewUrl} onChange={e => setReviewUrl(e.target.value)} placeholder="Review link" />
          <input style={input} value={myDocsUrl} onChange={e => setMyDocsUrl(e.target.value)} placeholder="My Documents link" />

          <button style={btnPrimary} onClick={saveBasics} disabled={saving}>
            {saving ? "Saving…" : "Save Basics"}
          </button>
          {saveMsg && <span style={{ marginLeft: 10, color: "#4caf50" }}>{saveMsg}</span>}

          <hr style={{ margin: "24px 0", opacity: 0.1 }} />

          <h3>Vendors & Utilities</h3>

          <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Closing Attorney</label>
          <select style={input} value={closingAttorneyId} onChange={e => setClosingAttorneyId(e.target.value)}>
            <option value="">— Select —</option>
            {vendorFavorites
              .filter(v => v.category === "closing_attorney")
              .map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </select>

          <CheckboxList
            title="Preferred Vendors"
            items={vendorFavorites.filter(v => v.category !== "closing_attorney" && v.category !== "utility")}
            selected={preferredVendorIds}
            setSelected={setPreferredVendorIds}
          />

          <CheckboxList
            title="Utilities"
            items={vendorFavorites.filter(v => v.category === "utility")}
            selected={utilityVendorIds}
            setSelected={setUtilityVendorIds}
          />

          <div style={{ marginTop: 20 }}>
            <button style={btnPrimary} onClick={saveVendors} disabled={vendorsSaving}>
              {vendorsSaving ? "Saving…" : "Save Vendors / Utilities"}
            </button>
            {vendorsMsg && <span style={{ marginLeft: 10, color: "#4caf50" }}>{vendorsMsg}</span>}
            {vendorsError && <div style={{ color: "#ffb4b4", marginTop: 8 }}>{vendorsError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------
function CheckboxList({ title, items, selected, setSelected }) {
  return (
    <div style={{ marginTop: 16 }}>
      <strong style={{ display: "block", marginBottom: 8 }}>{title}</strong>
      {items.map(v => {
        const id = String(v.id);
        return (
          <label key={id} style={{ display: "block", marginBottom: 4, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={selected.has(id)}
              onChange={() => {
                setSelected(prev => {
                  const n = new Set(prev);
                  n.has(id) ? n.delete(id) : n.add(id);
                  return n;
                });
              }}
            />{" "}
            {v.name}
          </label>
        );
      })}
    </div>
  );
}

const card = {
  padding: 20,
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  marginTop: 8,
  marginBottom: 8,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
};

const btnPrimary = {
  marginTop: 12,
  padding: "10px 20px",
  borderRadius: 10,
  fontWeight: 700,
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  cursor: "pointer",
};

const btnSecondary = {
  marginTop: 10,
  padding: "8px 12px",
  borderRadius: 10,
  backgroundColor: "transparent",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "white",
  cursor: "pointer",
  width: "100%",
};