import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AgentLogin() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  const canGo = useMemo(() => token.trim().length > 10, [token]);

  const handleLogin = () => {
    const cleanToken = token.trim();
    if (!cleanToken) return;

    // Store the token in sessionStorage so the AgentSetup page can pick it up
    sessionStorage.setItem("agent_token", cleanToken);

    // Navigate to the dashboard without the ?t= parameter
    navigate("/agent");
  };

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
          <h1 style={styles.h1}>Open your Agent Setup</h1>
          <p style={styles.sub}>
            Paste your agent token (from the signup response / invite link) to access your dashboard.
          </p>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={styles.field}>
              <label style={styles.label}>Agent token</label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token here…"
                style={styles.input}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={!canGo}
              style={styles.primaryBtn(!canGo)}
            >
              Continue →
            </button>

            <div style={styles.mutedRow}>
              Don’t have an account?{" "}
              <button type="button" onClick={() => navigate("/agent/signup")} style={styles.inlineBtn}>
                Create one
              </button>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <div style={{ opacity: 0.75 }}>This is temporary. Later: email + password + billing.</div>
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
  topbar: { maxWidth: 980, margin: "0 auto", padding: "8px 4px" },
  backLink: { color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14 },
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
  kicker: { fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.75, marginBottom: 6 },
  h1: { fontSize: 26, lineHeight: 1.15, margin: 0, fontWeight: 800 },
  sub: { marginTop: 10, marginBottom: 0, opacity: 0.78, fontSize: 14, lineHeight: 1.5 },
  field: { display: "grid", gap: 6 },
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
  primaryBtn: (disabled) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: disabled ? "rgba(255,255,255,0.08)" : "rgba(0,122,255,0.95)",
    color: disabled ? "rgba(255,255,255,0.65)" : "white",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  mutedRow: {
    marginTop: 10,
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
  footer: {
    width: "100%",
    maxWidth: 520,
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
};