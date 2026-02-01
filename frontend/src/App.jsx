import { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * Buyer UI (single page)
 * - Ready to run in Vite + React
 * - Includes Lofty CRM integration stubs
 *
 * TODO: When you upload your mockup image, I’ll match sections 1:1 (layout, labels, spacing).
 */

const MOCK = {
  buyer: {
    firstName: "Hank",
    lastName: "Mac Michaels",
    email: "Hank@example.com",
    phone: "(555) 555-1234",
  },
  agent: {
    name: "Sarah Maslowski",
    brokerage: "Key Point Homes",
    phone: "(555) 555-9876",
    email: "taylor@northstarrealty.com",
  },
  property: {
    addressLine1: "123 Betty Ln",
    city: "Gainesville",
    state: "GA",
    zip: "30501",
    listPrice: 385000,
    photoUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80",
    beds: 3,
    baths: 2,
    sqft: 1850,
  },
  transaction: {
    status: "Under Contract",
    progressPct: 62,
    purchasePrice: 392500,
    escrowDeposit: 5000,
    closingDate: "2026-03-12",
    offerAccepted: "2026-01-18",
    inspectionDeadline: "2026-02-12",
    appraisalDeadline: "2026-02-20",
    financeDeadline: "2026-02-28",
  },
  timeline: [
    { key: "offer", label: "Offer Accepted", date: "2026-01-18", done: true },
    { key: "earnest", label: "Earnest Money Due", date: "2026-01-21", done: true },
    { key: "inspection", label: "Inspection Deadline", date: "2026-02-12", done: false },
    { key: "appraisal", label: "Appraisal Deadline", date: "2026-02-20", done: false },
    { key: "finance", label: "Financing Deadline", date: "2026-02-28", done: false },
    { key: "closing", label: "Closing Day", date: "2026-03-12", done: false },
  ],
  tasks: [
    { id: "t1", title: "Schedule home inspection", due: "2026-02-06", completed: false, category: "Inspection" },
    { id: "t2", title: "Upload lender pre-approval letter", due: "2026-02-03", completed: true, category: "Financing" },
    { id: "t3", title: "Confirm homeowners insurance quote", due: "2026-02-18", completed: false, category: "Insurance" },
    { id: "t4", title: "Review seller disclosures", due: "2026-02-05", completed: false, category: "Docs" },
  ],
  documents: [
    { id: "d1", name: "Purchase Agreement.pdf", tag: "Contract", updated: "2026-01-19" },
    { id: "d2", name: "Seller Disclosure.pdf", tag: "Disclosure", updated: "2026-01-22" },
    { id: "d3", name: "Inspection Report.pdf", tag: "Inspection", updated: "—" },
    { id: "d4", name: "Appraisal.pdf", tag: "Lender", updated: "—" },
  ],
  contacts: {
    lender: { name: "Jordan Lender", phone: "(555) 555-2222", email: "jordan@lenderco.com" },
    title: { name: "Sam Title", phone: "(555) 555-3333", email: "sam@titleco.com" },
  },
  messages: [
    { id: "m1", from: "agent", body: "Congrats again — I’ll send the disclosure packet today. Next step is getting inspection scheduled.", ts: "2026-02-01 9:12 AM" },
    { id: "m2", from: "buyer", body: "Thanks! I can do Thursday morning for the inspection. Does that work for access?", ts: "2026-02-01 9:16 AM" },
    { id: "m3", from: "agent", body: "Thursday AM works. I’ll confirm with the listing agent and send the appointment details.", ts: "2026-02-01 9:19 AM" },
  ],
};

// ---------- Lofty integration stubs ----------
// In production, you’d pull transaction + buyer + property from Lofty.
// You can wire this to your backend to avoid exposing tokens in the browser.
async function fetchFromLofty({ endpoint, accessToken }) {
  // Example (pseudo):
  // const res = await fetch(`https://api.lofty.com/${endpoint}`, { headers: { Authorization: `Bearer ${accessToken}` }});
  // return res.json();

  // Stub:
  await new Promise((r) => setTimeout(r, 250));
  return null;
}

function formatMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function badgeClass(tag) {
  const t = (tag || "").toLowerCase();
  if (t.includes("contract")) return "badge badge-blue";
  if (t.includes("disclosure")) return "badge badge-purple";
  if (t.includes("inspection")) return "badge badge-amber";
  if (t.includes("lender")) return "badge badge-green";
  return "badge";
}

function daysUntil(dateStr) {
  if (!dateStr || dateStr === "—") return null;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function App() {
  const [data, setData] = useState(MOCK);
  const [active, setActive] = useState("Overview");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState("All");
  const [compose, setCompose] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    // TODO: Replace with real loader:
    // - call your backend: /api/buyer-portal?transactionId=...
    // - backend calls Lofty + merges any local app-specific fields
    (async () => {
      // Example call (stub):
      await fetchFromLofty({ endpoint: "transactions/...", accessToken: "SERVER_SIDE_ONLY" });
      setData(MOCK);
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const buyerName = `${data.buyer.firstName} ${data.buyer.lastName}`;
  const propertyAddress = `${data.property.addressLine1}, ${data.property.city}, ${data.property.state} ${data.property.zip}`;

  const filteredTasks = useMemo(() => {
    let items = [...data.tasks];
    if (taskFilter === "Open") items = items.filter((t) => !t.completed);
    if (taskFilter === "Done") items = items.filter((t) => t.completed);
    if (taskQuery.trim()) {
      const q = taskQuery.toLowerCase();
      items = items.filter((t) => (t.title + " " + t.category).toLowerCase().includes(q));
    }
    items.sort((a, b) => (a.due || "").localeCompare(b.due || ""));
    return items;
  }, [data.tasks, taskFilter, taskQuery]);

  const keyDates = useMemo(() => {
    const t = data.transaction;
    return [
      { label: "Offer Accepted", date: t.offerAccepted },
      { label: "Inspection Deadline", date: t.inspectionDeadline },
      { label: "Appraisal Deadline", date: t.appraisalDeadline },
      { label: "Financing Deadline", date: t.financeDeadline },
      { label: "Closing Date", date: t.closingDate },
    ];
  }, [data.transaction]);

  function toggleTask(id) {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  }

  function sendMessage() {
    const body = compose.trim();
    if (!body) return;

    setData((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: `m${prev.messages.length + 1}`, from: "buyer", body, ts: new Date().toLocaleString() },
      ],
    }));
    setCompose("");
    setToast("Message sent");
  }

  function uploadDocStub() {
    setToast("Upload placeholder (wire to your storage/back-end)");
  }

  const navItems = ["Overview", "Tasks", "Documents", "Messages", "Contacts"];

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">🏡</div>
          <div className="brandText">
            <div className="brandName">Buyer Portal</div>
            <div className="brandSub">Transaction hub</div>
          </div>
        </div>

        <div className="nav">
          {navItems.map((item) => (
            <button
              key={item}
              className={`navItem ${active === item ? "active" : ""}`}
              onClick={() => setActive(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="sidebarFooter">
          <div className="miniCard">
            <div className="miniCardTitle">Your agent</div>
            <div className="miniCardMain">{data.agent.name}</div>
            <div className="miniCardSub">{data.agent.brokerage}</div>
            <div className="miniCardRow">
              <a href={`tel:${data.agent.phone}`} className="linkPill">Call</a>
              <a href={`mailto:${data.agent.email}`} className="linkPill">Email</a>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbarLeft">
            <div className="h1">{propertyAddress}</div>
            <div className="subline">
              Buyer: <span className="em">{buyerName}</span> · Status:{" "}
              <span className="pill">{data.transaction.status}</span>
            </div>
          </div>

          <div className="topbarRight">
            <div className="kpi">
              <div className="kpiLabel">Purchase Price</div>
              <div className="kpiValue">{formatMoney(data.transaction.purchasePrice)}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Closing</div>
              <div className="kpiValue">{data.transaction.closingDate}</div>
            </div>
          </div>
        </header>

        {toast ? <div className="toast">{toast}</div> : null}

        {active === "Overview" && (
          <div className="grid">
            <section className="card hero">
              <div className="heroMedia">
                <img src={data.property.photoUrl} alt="Property" />
              </div>
              <div className="heroInfo">
                <div className="heroTitle">Your Home Purchase</div>
                <div className="heroMeta">
                  <div className="metaItem">
                    <div className="metaLabel">Beds</div>
                    <div className="metaValue">{data.property.beds}</div>
                  </div>
                  <div className="metaItem">
                    <div className="metaLabel">Baths</div>
                    <div className="metaValue">{data.property.baths}</div>
                  </div>
                  <div className="metaItem">
                    <div className="metaLabel">Sq Ft</div>
                    <div className="metaValue">{data.property.sqft?.toLocaleString() ?? "—"}</div>
                  </div>
                  <div className="metaItem">
                    <div className="metaLabel">List Price</div>
                    <div className="metaValue">{formatMoney(data.property.listPrice)}</div>
                  </div>
                </div>

                <div className="progressWrap">
                  <div className="progressTop">
                    <div className="progressLabel">Progress</div>
                    <div className="progressPct">{data.transaction.progressPct}%</div>
                  </div>
                  <div className="progressBar" role="progressbar" aria-valuenow={data.transaction.progressPct} aria-valuemin="0" aria-valuemax="100">
                    <div className="progressFill" style={{ width: `${data.transaction.progressPct}%` }} />
                  </div>
                  <div className="progressHint">We’ll keep this updated as milestones complete.</div>
                </div>

                <div className="heroActions">
                  <button className="btn" onClick={() => setActive("Messages")}>Message Agent</button>
                  <button className="btn secondary" onClick={() => setActive("Tasks")}>View Tasks</button>
                  <button className="btn ghost" onClick={() => setActive("Documents")}>Documents</button>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">Milestone Timeline</div>
                <div className="cardSub">Key steps from offer to closing</div>
              </div>

              <div className="timeline">
                {data.timeline.map((m) => (
                  <div key={m.key} className="timelineRow">
                    <div className={`dot ${m.done ? "done" : ""}`} />
                    <div className="timelineMain">
                      <div className="timelineLabel">
                        {m.label} {m.done ? <span className="smallPill done">Done</span> : <span className="smallPill">Pending</span>}
                      </div>
                      <div className="timelineDate">{m.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">Next Up</div>
                <div className="cardSub">Your most important next actions</div>
              </div>

              <div className="list">
                {filteredTasks.filter((t) => !t.completed).slice(0, 3).map((t) => (
                  <div key={t.id} className="listRow">
                    <button className={`checkbox ${t.completed ? "checked" : ""}`} onClick={() => toggleTask(t.id)} aria-label="toggle task" />
                    <div className="listMain">
                      <div className="listTitle">{t.title}</div>
                      <div className="listSub">
                        {t.category} · Due {t.due}
                        {daysUntil(t.due) != null ? (
                          <span className={`urgency ${daysUntil(t.due) <= 3 ? "hot" : ""}`}>
                            {daysUntil(t.due) >= 0 ? `${daysUntil(t.due)}d left` : "Overdue"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button className="btn small ghost" onClick={() => setActive("Tasks")}>Open</button>
                  </div>
                ))}
                {filteredTasks.filter((t) => !t.completed).length === 0 ? (
                  <div className="empty">No open tasks — you’re in great shape.</div>
                ) : null}
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">Key Dates</div>
                <div className="cardSub">Deadlines and closing</div>
              </div>

              <div className="datesGrid">
                {keyDates.map((k) => (
                  <div key={k.label} className="dateTile">
                    <div className="dateLabel">{k.label}</div>
                    <div className="dateValue">{k.date || "—"}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {active === "Tasks" && (
          <div className="grid single">
            <section className="card">
              <div className="cardHeader row">
                <div>
                  <div className="cardTitle">Tasks</div>
                  <div className="cardSub">Track what’s needed to close on time</div>
                </div>
                <div className="controls">
                  <input
                    className="input"
                    placeholder="Search tasks…"
                    value={taskQuery}
                    onChange={(e) => setTaskQuery(e.target.value)}
                  />
                  <select className="select" value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)}>
                    <option>All</option>
                    <option>Open</option>
                    <option>Done</option>
                  </select>
                </div>
              </div>

              <div className="list">
                {filteredTasks.map((t) => (
                  <div key={t.id} className="listRow">
                    <button
                      className={`checkbox ${t.completed ? "checked" : ""}`}
                      onClick={() => toggleTask(t.id)}
                      aria-label="toggle task"
                    />
                    <div className="listMain">
                      <div className="listTitle">{t.title}</div>
                      <div className="listSub">
                        {t.category} · Due {t.due || "—"}
                      </div>
                    </div>
                    <div className="rightMeta">
                      {t.completed ? <span className="smallPill done">Complete</span> : <span className="smallPill">Open</span>}
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 ? <div className="empty">No tasks match your filters.</div> : null}
              </div>
            </section>
          </div>
        )}

        {active === "Documents" && (
          <div className="grid single">
            <section className="card">
              <div className="cardHeader row">
                <div>
                  <div className="cardTitle">Documents</div>
                  <div className="cardSub">Contracts, disclosures, reports, and lender docs</div>
                </div>
                <button className="btn" onClick={uploadDocStub}>Upload</button>
              </div>

              <div className="table">
                <div className="tableHead">
                  <div>Name</div>
                  <div>Category</div>
                  <div>Last Updated</div>
                  <div />
                </div>
                {data.documents.map((d) => (
                  <div className="tableRow" key={d.id}>
                    <div className="docName">{d.name}</div>
                    <div><span className={badgeClass(d.tag)}>{d.tag}</span></div>
                    <div className="muted">{d.updated}</div>
                    <div className="tableActions">
                      <button className="btn small ghost" onClick={() => setToast("Preview placeholder")}>Preview</button>
                      <button className="btn small" onClick={() => setToast("Download placeholder")}>Download</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hint">
                Lofty note: often you’ll map docs from a transaction record or custom objects. If Lofty doesn’t store binary files,
                store them in your own system (S3, etc.) and keep links/metadata in Lofty + your DB.
              </div>
            </section>
          </div>
        )}

        {active === "Messages" && (
          <div className="grid single">
            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">Messages</div>
                <div className="cardSub">Chat with your agent — everything in one place</div>
              </div>

              <div className="chat">
                <div className="chatThread">
                  {data.messages.map((m) => (
                    <div key={m.id} className={`bubbleRow ${m.from === "buyer" ? "me" : "them"}`}>
                      <div className="bubble">
                        <div className="bubbleBody">{m.body}</div>
                        <div className="bubbleMeta">{m.ts}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="chatComposer">
                  <textarea
                    className="textarea"
                    placeholder="Write a message…"
                    value={compose}
                    onChange={(e) => setCompose(e.target.value)}
                    rows={3}
                  />
                  <div className="composerActions">
                    <button className="btn secondary" onClick={() => setToast("Attach placeholder")}>Attach</button>
                    <button className="btn" onClick={sendMessage}>Send</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {active === "Contacts" && (
          <div className="grid two">
            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">People & Contacts</div>
                <div className="cardSub">Who’s involved in your closing</div>
              </div>

              <div className="contactCard">
                <div className="contactTitle">Agent</div>
                <div className="contactName">{data.agent.name}</div>
                <div className="muted">{data.agent.brokerage}</div>
                <div className="contactActions">
                  <a className="btn small" href={`tel:${data.agent.phone}`}>Call</a>
                  <a className="btn small secondary" href={`mailto:${data.agent.email}`}>Email</a>
                </div>
              </div>

              <div className="contactCard">
                <div className="contactTitle">Lender</div>
                <div className="contactName">{data.contacts.lender.name}</div>
                <div className="muted">{data.contacts.lender.email}</div>
                <div className="contactActions">
                  <a className="btn small" href={`tel:${data.contacts.lender.phone}`}>Call</a>
                  <a className="btn small secondary" href={`mailto:${data.contacts.lender.email}`}>Email</a>
                </div>
              </div>

              <div className="contactCard">
                <div className="contactTitle">Title / Closing</div>
                <div className="contactName">{data.contacts.title.name}</div>
                <div className="muted">{data.contacts.title.email}</div>
                <div className="contactActions">
                  <a className="btn small" href={`tel:${data.contacts.title.phone}`}>Call</a>
                  <a className="btn small secondary" href={`mailto:${data.contacts.title.email}`}>Email</a>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">Transaction Summary</div>
                <div className="cardSub">Useful numbers at a glance</div>
              </div>

              <div className="summaryGrid">
                <div className="summaryTile">
                  <div className="muted">Purchase Price</div>
                  <div className="big">{formatMoney(data.transaction.purchasePrice)}</div>
                </div>
                <div className="summaryTile">
                  <div className="muted">Earnest Money</div>
                  <div className="big">{formatMoney(data.transaction.escrowDeposit)}</div>
                </div>
                <div className="summaryTile">
                  <div className="muted">Closing Date</div>
                  <div className="big">{data.transaction.closingDate}</div>
                </div>
                <div className="summaryTile">
                  <div className="muted">Progress</div>
                  <div className="big">{data.transaction.progressPct}%</div>
                </div>
              </div>

              <div className="hint">
                Lofty mapping idea: transactionId → fetch buyer/contact, listing/property, milestone dates, agent assignment,
                plus any custom fields (loan type, contingencies, etc.).
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
