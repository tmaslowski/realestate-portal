import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api/portal";

export default function AgentSignup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().includes("@") && !loading;
  }, [name, email, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setResult(null);

    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agent/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Signup failed");

      setResult(data);

      // If backend returns the agent invite link, send them straight in
      const link = data?.link || "";
      const token = data?.token || "";
      if (token) {
        // Leave them on the page so they can copy link; offer a button to continue.
      } else if (link.includes("/agent?t=")) {
        window.location.href = link;
      }
    } catch (e2) {
      setErr(e2?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function copy(text) {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <Link to="/" style={styles.backLink}>
          ← Home
        </Link>
      </div>

      <div style={styles.center}>
        <div style={styles.card}>
          <div style={styles.kicker}>Agent Portal</div>
          <h1 style={styles.h1}>Create your agent account</h1>
          <p style={styles.sub}>
            This creates your agent record and generates a secure link to your Agent Setup page.
          </p>

          <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Maslowski"
                autoComplete="name"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@brokerage.com"
                autoComplete="email"
                inputMode="email"
                style={styles.input}
              />
            </div>

            {err ? <div style={styles.error}>{err}</div> : null}

            <button type="submit" disabled={!canSubmit} style={styles.primaryBtn(!canSubmit)}>
              {loading ? "Creating…" : "Create account"}
            </button>

            <div style={styles.mutedRow}>
              Already have a link?{" "}
              <button
                type="button"
                onClick={() => navigate("/agent/login")}
                style={styles.inlineBtn}
              >
                Go to login
              </button>
            </div>
          </form>

          {result ? (
            <div style={styles.resultBox}>
              <div style={styles.resultTitle}>Success</div>

              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>Agent</div>
                  <div style={styles.resultValue}>
                    {result?.agent?.name} ({result?.agent?.email})
                  </div>
                </div>

                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>Invite link</div>
                  <div style={styles.resultValueWrap}>
                    <code style={styles.code}>{result.link}</code>
                    <div style={styles.resultActions}>
                      <button type="button" onClick={() => copy(result.link)} style={styles.smallBtn}>
                        Copy
                      </button>
                      <a href={result.link} style={styles.smallBtnLink}>
                        Open
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => {
                    // preferred: take them into setup via token
                    const token = result?.token;
                    if (token) window.location.href = `/agent?t=${encodeURIComponent(token)}`;
                    else if (result?.link) window.location.href = result.link;
                  }}
                >
                  Continue to Agent Setup →
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div style={styles.footer}>
          <div style={{ opacity: 0.75 }}>
            Tip: in production, this flow will become payment → account → login.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 30% 10%, rgba(0,122,255,0.14), transparent 60%), radial-gradient(900px 500px at 80% 20%, rgba(88,86,214,0.10), transparent 55%), linear-gradient(180deg, #0B1220 0%, #070A12 100%)",
    color: "rgba(255,255,255,0.92)",
    padding: 18,
  },
  topbar: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "8px 4px",
  },
  backLink: {
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 14,
  },
  center: {
    maxWidth: 980,
    margin: "0 auto",
    display: "grid",
    placeItems: "center",
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    padding: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.75,
    marginBottom: 6,
  },
  h1: {
    fontSize: 26,
    lineHeight: 1.15,
    margin: 0,
    fontWeight: 800,
  },
  sub: {
    marginTop: 10,
    marginBottom: 0,
    opacity: 0.78,
    fontSize: 14,
    lineHeight: 1.5,
  },
  field: { marginTop: 12, display: "grid", gap: 6 },
  label: { fontSize: 12, opacity: 0.8 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
  },
  error: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,59,48,0.12)",
    border: "1px solid rgba(255,59,48,0.25)",
    color: "rgba(255,220,220,0.95)",
    fontSize: 13,
  },
  primaryBtn: (disabled) => ({
    width: "100%",
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: disabled ? "rgba(255,255,255,0.08)" : "rgba(0,122,255,0.95)",
    color: disabled ? "rgba(255,255,255,0.65)" : "white",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  mutedRow: {
    marginTop: 12,
    fontSize: 13,
    opacity: 0.75,
    display: "flex",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.92)",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    fontSize: 13,
  },
  resultBox: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    background: "rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  resultTitle: { fontWeight: 850, marginBottom: 10 },
  resultGrid: { display: "grid", gap: 12 },
  resultItem: { display: "grid", gap: 6 },
  resultLabel: { fontSize: 12, opacity: 0.75 },
  resultValue: { fontSize: 14, fontWeight: 650 },
  resultValueWrap: { display: "grid", gap: 8 },
  code: {
    display: "block",
    padding: 10,
    borderRadius: 12,
    background: "rgba(0,0,0,0.30)",
    border: "1px solid rgba(255,255,255,0.12)",
    overflowX: "auto",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    whiteSpace: "nowrap",
  },
  resultActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  smallBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: 750,
    fontSize: 13,
  },
  smallBtnLink: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    textDecoration: "none",
    fontWeight: 750,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 850,
    cursor: "pointer",
  },
  footer: {
    width: "100%",
    maxWidth: 520,
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
};