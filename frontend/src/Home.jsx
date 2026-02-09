import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>Buyer Portal</div>
        <nav style={styles.nav}>
          <Link to="/agent/login" style={styles.navLink}>
            Agent Login
          </Link>
          <Link to="/agent/signup" style={styles.navCta}>
            Try it free
          </Link>
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <div style={styles.badge}>Pilot-ready • Mobile-first</div>
            <h1 style={styles.h1}>HomeApp. Agent Communication Tool.</h1>
            <p style={styles.sub}>
              Give buyers one link with tasks, utilities, key contacts, and helpful links — without the chaos of email threads.
            </p>

            <div style={styles.ctaRow}>
              <Link to="/agent/signup" style={styles.primaryBtn}>
                Create agent account
              </Link>
              <Link to="/agent/login" style={styles.secondaryBtn}>
                I already have a token
              </Link>
            </div>

            <div style={styles.trust}>
              <div style={styles.trustItem}>✓ Simple magic-link access</div>
              <div style={styles.trustItem}>✓ Agent-controlled checklist</div>
              <div style={styles.trustItem}>✓ Utilities + vendors in one place</div>
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.previewCard}>
              <div style={styles.previewTitle}>What buyers see</div>
              <div style={styles.previewRow}>
                <div style={styles.previewPill}>Tasks</div>
                <div style={styles.previewPill}>Utilities</div>
                <div style={styles.previewPill}>Closing Attorney</div>
              </div>
              <div style={styles.previewBody}>
                <div style={styles.previewLine} />
                <div style={styles.previewLine} />
                <div style={styles.previewLine} />
              </div>
              <div style={styles.previewFooter}>
                <div style={styles.previewChip}>Days until closing</div>
                <div style={styles.previewChip}>My Documents</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={{ opacity: 0.75 }}>
          Built for a small pilot (1–3 agents). Payments + usernames/passwords come later.
        </div>
      </footer>
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
  header: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 4px",
  },
  brand: { fontWeight: 900, letterSpacing: 0.2 },
  nav: { display: "flex", alignItems: "center", gap: 12 },
  navLink: { color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14 },
  navCta: {
    padding: "10px 12px",
    borderRadius: 12,
    textDecoration: "none",
    color: "white",
    fontWeight: 800,
    background: "rgba(0,122,255,0.95)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  main: { maxWidth: 1100, margin: "0 auto", paddingTop: 28, paddingBottom: 26 },
  hero: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 18,
    alignItems: "center",
  },
  heroLeft: {
    borderRadius: 22,
    padding: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  badge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 12,
    opacity: 0.9,
  },
  h1: { margin: "12px 0 0", fontSize: 32, lineHeight: 1.1, fontWeight: 950 },
  sub: { marginTop: 12, marginBottom: 0, fontSize: 15, lineHeight: 1.55, opacity: 0.8 },
  ctaRow: { marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" },
  primaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    textDecoration: "none",
    color: "white",
    fontWeight: 900,
    background: "rgba(0,122,255,0.95)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    textDecoration: "none",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 850,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  trust: { marginTop: 14, display: "grid", gap: 6, fontSize: 13, opacity: 0.8 },
  trustItem: { display: "flex", gap: 8, alignItems: "center" },

  heroRight: { display: "grid", placeItems: "center" },
  previewCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 22,
    padding: 18,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  previewTitle: { fontWeight: 900, marginBottom: 10 },
  previewRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  previewPill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
  },
  previewBody: { marginTop: 14, display: "grid", gap: 10 },
  previewLine: {
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  previewFooter: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  previewChip: {
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 800,
  },

  footer: { maxWidth: 1100, margin: "0 auto", paddingTop: 6, paddingBottom: 20, fontSize: 12, textAlign: "center" },
};

// NOTE: Mobile-first by default; on wider screens, show 2 columns.
if (typeof window !== "undefined") {
  // no-op; kept intentionally simple (no JS layout hacks)
}