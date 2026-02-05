# Real Estate Buyer Portal – Project Context

## Purpose

A buyer-facing real estate transaction portal used by agents to guide buyers through a home purchase.

Originally conceived as a buyer-only experience managed via Django admin, the project has evolved into a **dual-surface system**:

- A **buyer portal** (magic-link, read-only with light interaction)
- An **agent setup interface** (custom UI replacing Django admin for daily use)

This is a **pilot project (1–3 agents)** with real transactions, designed to validate value before monetization.

Built as a favor project, but intentionally architected to be production-ready.

---

## Stack

- **Backend:** Django 5 + Django REST Framework
- **Frontend:** React (Vite)
- **Auth:** Magic links via tokenized URLs (no accounts/passwords)
  - Buyer tokens
  - Agent tokens
- **Storage (current):** Local media
- **Storage (planned):** AWS S3
- **Hosting target:** AWS
- **Source control:** GitHub

---

## Core Models

### People

- **Agent**

  - name
  - email
  - photo_url
  - brokerage_logo_url

- **Buyer**
  - name
  - email

### Transactional

- **Transaction**

  - agent
  - buyer
  - address
  - status
  - closing_date
  - hero_image_url
  - homestead_exemption_url
  - review_url
  - external IDs (e.g. Lofty)

- **Task**

  - title
  - description
  - due_date
  - completed (buyer-toggleable)

- **Utility**

  - category (power, water, internet, etc.)
  - provider info
  - notes
  - optional setup-by date

- **Document**
  - uploaded file
  - title
  - type
  - visibility flag (buyer-visible)

### Vendors

- **Vendor**

  - category (closing attorney, lender, inspector, utility, etc.)
  - contact info
  - notes
  - favorite flag (agent-level)

- **TransactionVendor**
  - links vendors to transactions
  - supports roles (closing attorney vs preferred vendor)
  - allows transaction-specific overrides

---

## Key Features Implemented

### Buyer Portal

- Magic-link access (`?t=TOKEN`)
- No accounts or passwords
- Buyer task checklist (interactive)
- Utilities section
- Documents list with download links
- Hero property image
- Prominent “Days until closing” countdown
- Agent photo
- Brokerage logo header
- Closing attorney display
- Preferred vendors list
- Helpful links:
  - Homestead exemption
  - Leave a review
- FAQ section (agent-managed)

### Agent Experience (Major Expansion)

- **Agent magic-link access** (separate from buyer)
- **Custom Agent Setup UI** (replaces Django admin for daily use)
- Agent session endpoint
- Agent transaction GET / PATCH endpoints
- Edit transaction basics:
  - Address
  - Closing date
  - Hero image URL
  - Homestead exemption link
  - Review link
- Vendor management:
  - Create vendors
  - Mark favorites
  - Assign closing attorney per transaction
  - Assign preferred vendors per transaction
- Shared favorites across an agent’s transactions
- Fully working end-to-end flow without Django admin access

---

## Deliberate Omissions (for now)

- Messaging/chat
- Buyer login/accounts
- Payments
- Push notifications
- MLS ingestion
- Full CRM replacement

These are intentionally deferred to prevent overbuilding.

---

## Current Status

- Fully working **buyer + agent demo**
- Agent no longer needs Django admin
- Real data flowing end-to-end
- Vendor and attorney workflows validated
- Ready for **live agent pilot**

This is no longer just a buyer UI — it is a **lightweight transaction management experience for agents** with a buyer-facing layer.

---

## Known Decisions

- Images stored as URLs for now (uploads later)
- Magic links over accounts to reduce friction
- Favor clarity and simplicity over feature breadth
- Agent tooling is “just enough,” not a CRM
- One transaction = one buyer experience

---

## Next Steps / Pilot Plan

### Objective

Validate whether a buyer-facing portal + simple agent setup:

- Improves buyer clarity
- Reduces agent friction
- Feels valuable enough that agents would pay for it

Pilot size: **1–3 agents**, real transactions only.

---

### Phase 1: Internal Polish (1–2 days)

Goal: remove demo rough edges without expanding scope.

- [ ] Final UI spacing & typography pass
- [ ] Confirm mobile responsiveness (iPhone viewport)
- [ ] Clean empty states (“No documents yet”, etc.)
- [ ] Light copy pass (buyer-friendly language)
- [ ] Remove debug-only UI elements

_No new features added._

---

### Phase 2: Agent Pilot Setup (1 day)

Goal: zero hand-holding for agents.

- [ ] Create 1–3 real agent records
- [ ] Create 1–2 real transactions per agent
- [ ] Populate:
  - Tasks
  - Utilities
  - Vendors
  - Closing attorney
  - Documents
  - Hero images
- [ ] Generate buyer magic links
- [ ] Generate agent magic links
- [ ] Test flows on desktop + mobile

---

### Phase 3: Live Pilot (1–2 weeks)

Goal: observe real behavior.

- Agent sends buyer the link
- Buyer uses portal naturally
- Observe:
  - Task completion
  - Document usage
  - Vendor reference
  - Agent update frequency
- Collect qualitative feedback:
  - “What was helpful?”
  - “What was confusing?”
  - “What did you expect but didn’t see?”

No feature changes unless critical.

---

### Phase 4: Evaluation & Decision

Key questions:

- Would agents pay for this?
- What specific part delivers the most value?
- Is this a standalone product or an add-on?
- Does deeper Lofty integration matter?

Possible outcomes:

- Proceed to paid MVP
- Narrow to a single killer feature
- Keep as internal tool
- Pause or sunset

---

## Likely MVP Enhancements (Post-Pilot)

Only pursued if feedback supports it.

- Image uploads → S3
- Document upload UI (drag & drop)
- Simple email nudges
- Read-only Lofty sync
- Agent-branded onboarding email
- Brokerage-level shared vendor libraries

---

## Explicit Non-Goals

- Buyer accounts/passwords
- Real-time chat
- Payments
- Full CRM
- MLS ingestion

These are intentionally out of scope.
