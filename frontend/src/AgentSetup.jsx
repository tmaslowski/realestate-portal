import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api/portal";

export default function AgentSetup() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("t") || "";
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [agent, setAgent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [favorites, setFavorites] = useState([]); // from /agent/session (may or may not include vendors)

  const [selectedId, setSelectedId] = useState("");
  const [txnData, setTxnData] = useState(null);

  // editable basics
  const [address, setAddress] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [homesteadUrl, setHomesteadUrl] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // ===== Vendors state =====
  const [vendorFavorites, setVendorFavorites] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState("");

  const [closingAttorneyId, setClosingAttorneyId] = useState("");
  const [preferredVendorIds, setPreferredVendorIds] = useState(new Set()); // strings

  const [vendorsSaving, setVendorsSaving] = useState(false);
  const [vendorsMsg, setVendorsMsg] = useState("");

  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "closing_attorney",
    phone: "",
    email: "",
    website: "",
    notes: "",
    is_favorite: true,
  });

  // 1) Load agent session
  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(
          `${API_BASE}/agent/session/?t=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load agent session");

        setAgent(data.agent || null);
        setTransactions(data.transactions || []);
        setFavorites(data.favorites || []);

        if ((data.transactions || []).length) {
          setSelectedId(String(data.transactions[0].id));
        }
      } catch (e) {
        setErr(e.message || "Error loading session");
      } finally {
        setLoading(false);
      }
    }

    if (!token) {
      setErr("Missing agent token. Use the invite link that includes ?t=...");
      setLoading(false);
      return;
    }

    loadSession();
  }, [token]);

  // 2) Load favorite vendors
  useEffect(() => {
    async function loadVendors() {
      setVendorsLoading(true);
      setVendorsError("");
      try {
        const r = await fetch(
          `${API_BASE}/agent/vendors/?t=${encodeURIComponent(token)}`
        );
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load vendors");
        setVendorFavorites(j.favorites || []);
      } catch (e) {
        setVendorsError(e.message || "Failed to load vendors");
      } finally {
        setVendorsLoading(false);
      }
    }
    if (!token) return;
    loadVendors();
  }, [token]);

  // 3) Load selected transaction details
  useEffect(() => {
    async function loadTxn(id) {
      setTxnData(null);
      setSaveMsg("");
      setErr("");

      try {
        const res = await fetch(
          `${API_BASE}/agent/transaction/${id}/?t=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load transaction");

        setTxnData(data);

        // Basics
        setAddress(data.transaction?.address || "");
        setClosingDate(data.transaction?.closing_date || "");
        setHeroImageUrl(data.property?.hero_image_url || "");
        setHomesteadUrl(data.homestead_exemption_url || "");
        setReviewUrl(data.review_url || "");

        // Vendors: prefill from payload
        setClosingAttorneyId(
          data?.closing_attorney?.id ? String(data.closing_attorney.id) : ""
        );
        setPreferredVendorIds(
          new Set((data?.preferred_vendors || []).map((v) => String(v.id)))
        );
      } catch (e) {
        setErr(e.message || "Error loading transaction");
      }
    }

    if (!selectedId) return;
    loadTxn(selectedId);
  }, [selectedId, token]);

  // 4) Save basics (PATCH)
  async function saveBasics() {
    if (!selectedId) return;

    setSaving(true);
    setSaveMsg("");
    setErr("");

    try {
      const res = await fetch(
        `${API_BASE}/agent/transaction/${selectedId}/?t=${encodeURIComponent(
          token
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            closing_date: closingDate || null,
            hero_image_url: heroImageUrl,
            homestead_exemption_url: homesteadUrl,
            review_url: reviewUrl,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      setTxnData(data);
      setSaveMsg("Saved ✓");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (e) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // 5) Save vendors (POST)
  async function saveVendors() {
    if (!selectedId) return;

    setVendorsSaving(true);
    setVendorsMsg("");
    setVendorsError("");

    try {
      const r = await fetch(
        `${API_BASE}/agent/transaction/${selectedId}/vendors/?t=${encodeURIComponent(
          token
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            closing_attorney_vendor_id: closingAttorneyId
              ? Number(closingAttorneyId)
              : null,
            preferred_vendor_ids: Array.from(preferredVendorIds).map(Number),
          }),
        }
      );

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to save vendors");

      setVendorsMsg("Saved ✓");
      setTimeout(() => setVendorsMsg(""), 2000);

      // refresh txn payload (so the UI stays consistent)
      const r2 = await fetch(
        `${API_BASE}/agent/transaction/${selectedId}/?t=${encodeURIComponent(
          token
        )}`
      );
      const j2 = await r2.json();
      setTxnData(j2);

      // Also re-prefill (covers edge cases)
      setClosingAttorneyId(
        j2?.closing_attorney?.id ? String(j2.closing_attorney.id) : ""
      );
      setPreferredVendorIds(
        new Set((j2?.preferred_vendors || []).map((v) => String(v.id)))
      );
    } catch (e) {
      setVendorsError(e.message || "Failed to save vendors");
    } finally {
      setVendorsSaving(false);
    }
  }

  // 6) Create new vendor (POST)
  async function createVendor() {
    setVendorsError("");
    setVendorsMsg("");

    if (!newVendor.name.trim()) {
      setVendorsError("Vendor name is required.");
      return;
    }

    try {
      const r = await fetch(
        `${API_BASE}/agent/vendor/create/?t=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newVendor),
        }
      );

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to create vendor");

      // reload favorites
      const r2 = await fetch(
        `${API_BASE}/agent/vendors/?t=${encodeURIComponent(token)}`
      );
      const j2 = await r2.json();
      setVendorFavorites(j2.favorites || []);

      setVendorsMsg("Vendor created ✓");
      setTimeout(() => setVendorsMsg(""), 2000);

      setShowCreateVendor(false);
      setNewVendor({
        name: "",
        category: "closing_attorney",
        phone: "",
        email: "",
        website: "",
        notes: "",
        is_favorite: true,
      });
    } catch (e) {
      setVendorsError(e.message || "Failed to create vendor");
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Agent Setup</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            Edit a transaction without Django admin
          </div>
        </div>

        {agent ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {agent.brokerage_logo_url ? (
              <img
                src={agent.brokerage_logo_url}
                alt="Brokerage"
                style={{ height: 28, objectFit: "contain" }}
              />
            ) : null}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 650 }}>{agent.name}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{agent.email}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 16,
        }}
      >
        {/* Left: picker */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ fontWeight: 750, marginBottom: 8 }}>Transactions</div>

          {loading ? (
            <div style={{ opacity: 0.75 }}>Loading…</div>
          ) : transactions.length ? (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(0,0,0,0.25)",
                color: "inherit",
              }}
            >
              {transactions.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} — {t.address}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ opacity: 0.75 }}>No transactions yet.</div>
          )}

          {err ? (
            <div style={{ marginTop: 10, color: "#ffb4b4", fontSize: 13 }}>
              {err}
            </div>
          ) : null}

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Next: we’ll add “Create transaction” for agents. For the demo, you
            can pre-create 1–3 transactions.
          </div>
        </div>

        {/* Right: Basics + Vendors */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {/* Basics */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16 }}>Basics</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{saveMsg}</div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="Property address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Closing date">
              <input
                type="date"
                value={closingDate || ""}
                onChange={(e) => setClosingDate(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Hero image URL">
              <input
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Homestead exemption link">
              <input
                value={homesteadUrl}
                onChange={(e) => setHomesteadUrl(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Review link">
              <input
                value={reviewUrl}
                onChange={(e) => setReviewUrl(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <div
            style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}
          >
            <button
              onClick={saveBasics}
              disabled={!selectedId || saving}
              style={btnPrimaryStyle(!selectedId || saving)}
            >
              {saving ? "Saving…" : "Save Basics"}
            </button>

            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {txnData ? "Loaded transaction details." : "Loading…"}
            </div>
          </div>

          {/* Vendors */}
          <div
            style={{
              marginTop: 18,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              paddingTop: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16 }}>Vendors</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>{vendorsMsg}</div>
            </div>

            {vendorsError ? (
              <div style={{ marginTop: 10, color: "#ffb4b4", fontSize: 13 }}>
                {vendorsError}
              </div>
            ) : null}

            {vendorsLoading ? (
              <div style={{ marginTop: 10, opacity: 0.75 }}>
                Loading vendor favorites…
              </div>
            ) : (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                    Closing Attorney (favorite)
                  </div>
                  <select
                    value={closingAttorneyId}
                    onChange={(e) => setClosingAttorneyId(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">— Select —</option>
                    {vendorFavorites
                      .filter((v) => v.category === "closing_attorney")
                      .map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                    Preferred Vendors (favorites)
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.16)",
                      borderRadius: 10,
                      padding: 10,
                      background: "rgba(0,0,0,0.25)",
                      maxHeight: 220,
                      overflow: "auto",
                    }}
                  >
                    {vendorFavorites
                      .filter((v) => v.category !== "closing_attorney")
                      .map((v) => {
                        const sid = String(v.id);
                        const checked = preferredVendorIds.has(sid);
                        return (
                          <label
                            key={v.id}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              padding: "6px 0",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setPreferredVendorIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(sid)) next.delete(sid);
                                  else next.add(sid);
                                  return next;
                                });
                              }}
                            />
                            <span style={{ fontWeight: 650 }}>{v.name}</span>
                            <span style={{ fontSize: 12, opacity: 0.7 }}>
                              ({v.category_label})
                            </span>
                          </label>
                        );
                      })}

                    {!vendorFavorites.length ? (
                      <div style={{ opacity: 0.75 }}>No favorites yet.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={saveVendors}
                disabled={!selectedId || vendorsSaving}
                style={btnPrimaryStyle(!selectedId || vendorsSaving)}
              >
                {vendorsSaving ? "Saving…" : "Save Vendors"}
              </button>

              <button
                onClick={() => setShowCreateVendor((v) => !v)}
                style={btnSecondaryStyle}
              >
                {showCreateVendor ? "Close" : "Add New Vendor"}
              </button>
            </div>

            {showCreateVendor ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 10 }}>
                  Create Vendor
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <Field label="Name">
                    <input
                      value={newVendor.name}
                      onChange={(e) =>
                        setNewVendor((p) => ({ ...p, name: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Category">
                    <select
                      value={newVendor.category}
                      onChange={(e) =>
                        setNewVendor((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    >
                      <option value="closing_attorney">Closing Attorney</option>
                      <option value="lender">Lender</option>
                      <option value="inspector">Inspector</option>
                      <option value="appraiser">Appraiser</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>

                  <Field label="Phone">
                    <input
                      value={newVendor.phone}
                      onChange={(e) =>
                        setNewVendor((p) => ({ ...p, phone: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      value={newVendor.email}
                      onChange={(e) =>
                        setNewVendor((p) => ({ ...p, email: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Website">
                    <input
                      value={newVendor.website}
                      onChange={(e) =>
                        setNewVendor((p) => ({ ...p, website: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Notes">
                    <input
                      value={newVendor.notes}
                      onChange={(e) =>
                        setNewVendor((p) => ({ ...p, notes: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>

                  <label
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!newVendor.is_favorite}
                      onChange={(e) =>
                        setNewVendor((p) => ({
                          ...p,
                          is_favorite: e.target.checked,
                        }))
                      }
                    />
                    <span style={{ fontSize: 13, opacity: 0.85 }}>
                      Save as favorite
                    </span>
                  </label>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button onClick={createVendor} style={btnSecondaryStyle}>
                    Create Vendor
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.25)",
  color: "inherit",
};

function btnPrimaryStyle(disabled) {
  return {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.10)",
    color: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
  };
}

const btnSecondaryStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};