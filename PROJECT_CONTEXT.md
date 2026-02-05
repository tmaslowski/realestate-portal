# Real Estate Buyer Portal – Project Context

## Purpose

A buyer-facing real estate portal used by agents to guide buyers through a home purchase.
This is a pilot project (1–3 agents) with potential to monetize.

Built as a favor project, but designed to be production-ready.

## Stack

- Backend: Django 5 + Django REST Framework
- Frontend: React (Vite)
- Auth: Magic link via PortalToken (no accounts)
- Admin: Django admin used by agents
- Hosting target: AWS
- Source control: GitHub

## Core Models

- Agent (name, email, photo_url, brokerage_logo_url)
- Buyer (name, email)
- Transaction (agent, buyer, address, status, closing_date, hero_image_url)
- Task (checklist items, buyer-completable)
- Utility (power, water, internet, etc.)
- Document (uploaded files, buyer-visible)

## Key Features Implemented

- Magic-link buyer access (?t=TOKEN)
- Admin-driven data entry
- Buyer task checklist (interactive)
- Utilities section
- Documents list
- Hero property image
- Hero countdown “Days until closing”
- Agent photo
- Brokerage logo in header

## Deliberate Omissions (for now)

- Messaging
- Buyer login/accounts
- Payments
- Push notifications

## Current Status

- Fully working demo
- Ready for agent pilot
- Next likely steps: uploads to S3, document upload UI, deployment

## Known Decisions

- URLs used for images for now; uploads later
- Focus on buyer clarity over agent tooling

## Status

This project is an active MVP. See PROJECT_CONTEXT.md for current scope and decisions.

## Next Steps / Pilot Plan

### Objective

Validate whether a buyer-facing portal improves communication, reduces agent friction, and feels valuable enough that agents would pay for it.

Pilot size: **1–3 agents**, real transactions only.

---

### Phase 1: Internal Polish (1–2 days)

Goal: remove demo rough edges without expanding scope.

- [ ] Final UI pass (spacing, typography, minor layout polish)
- [ ] Confirm mobile responsiveness (iPhone-sized viewport)
- [ ] Replace placeholder images/logos where needed
- [ ] Add basic empty-state copy (when no tasks, no documents, etc.)
- [ ] Add short welcome copy for buyers (“Here’s what to expect…”)

_No new features added in this phase._

---

### Phase 2: Agent Pilot Setup (1 day)

Goal: make it easy for an agent to use without hand-holding.

- [ ] Create 1–3 real agent records
- [ ] Create 1 real transaction per agent
- [ ] Populate:
  - Tasks (inspection, insurance, utilities, closing prep)
  - Utilities
  - At least one document
  - Hero property photo
  - Agent photo + brokerage logo
- [ ] Generate magic links for each transaction
- [ ] Confirm links work on desktop + mobile

---

### Phase 3: Live Pilot (1–2 weeks)

Goal: observe real usage and reactions.

- Agent sends buyer the magic link
- Buyer uses portal naturally (no training)
- Observe:
  - Do buyers check tasks?
  - Do buyers reference documents here instead of emailing?
  - Do agents update tasks/utilities during the transaction?
- Collect qualitative feedback:
  - “What did you like?”
  - “What was confusing?”
  - “What did you expect but didn’t see?”

No feature changes during this phase unless critical.

---

### Phase 4: Evaluation & Decision

Goal: decide whether to proceed to a paid MVP.

Key questions:

- Would agents pay for this?
- What would they pay _for_ specifically?
- Is this a standalone product or a value-add to existing tools?
- Does Lofty integration meaningfully increase value?

Possible outcomes:

- Proceed to production MVP
- Narrow scope to a single killer feature
- Keep as internal tool
- Pause or sunset

---

### Likely MVP Enhancements (Post-Pilot)

Only pursued if pilot feedback supports it.

- Image uploads (move from URL fields to S3)
- Document upload UI (drag & drop)
- Simple notifications (email nudges)
- Read-only Lofty sync
- Agent-branded onboarding email

---

### Explicit Non-Goals (for now)

- Buyer accounts / passwords
- Messaging/chat
- Payments
- Full CRM replacement
- MLS data ingestion

These are intentionally deferred to avoid overbuilding.
