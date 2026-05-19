# `docs/` — Project Knowledge Base

This folder contains all the synthesis, spec, and grant materials that informed this codebase. Reference these when making product or architecture decisions.

## Layout

Files are numbered by topic group:
- **10s** — Master synthesis + technical specs (the "how we build")
- **20s** — Product & business context (the "why we build")
- **30s** — EV grant materials (the "external commitment")

## File index

### 10s · Master synthesis + technical specs

| File | What's in it | When to read |
|---|---|---|
| `10-synthesis-master.md` | Master analytical doc with verdicts on every divergence between two independent expert spec packages. **The source of truth for design decisions.** | Before any major architectural change |
| `11-technical-context.md` | Final technical context: tech stack, integrations, sprint plan, state machines, WhatsApp template texts | Sprint planning |
| `12-ai-discoverability-kit.md` | Ready-to-deploy `/llms.txt` content, `/robots.txt` AI bot rules, JSON-LD templates | When adjusting AI/SEO surfaces |
| `13-substitution-ux-spec.md` | Detailed spec for substitution flow (Gap #3 from synthesis, the most critical UX gap neither pack covered) | Implementing Sprint 3 substitution work |

### 20s · Product & business context

| File | What's in it | When to read |
|---|---|---|
| `20-product-readme.md` | Founder's notes about the context pack structure | First time orienting |
| `21-company-story.md` | What Horecom is, segments (S1/S2/S3), problem definition, current MVP gaps, why-now thesis | Onboarding any new contributor; writing copy |
| `22-product-vision.md` | Three value-modes architecture, V1/V1.5/V2 roadmap, differentiators | Sprint planning; "what does this product actually do?" |
| `23-traction-metrics.md` | Current real metrics: $620k GMV, 50+ accounts, 76k IG followers, conversion rates, top SKUs | Anytime you need real numbers (don't make them up) |
| `24-founders-story.md` | the team + co-founder bios, (redacted) lesson and what it teaches Horecom | Writing about the team; making architectural choices that touch operational risk |
| `25-links-index.md` | External URLs (LinkedIn, IG, Threads, etc.) | For references/citations |
| `26-references.md` | EV grant reference contacts (3 people) | Grant follow-up; reference verification |

### 30s · EV grant materials

| File | What's in it | When to read |
|---|---|---|
| `30-ev-grant-angle.md` | Strategic angle for the grant in Russian: one-liner, mainstream view, why-now, why-EV, use-of-funds, hard Q&A | When discussing grant strategy |
| `31-ev-application-proposal.md` | Final 1,145-word English proposal text, ready to paste into mercatus.tfaforms.net form. Word-count verified under 1,500 limit | Submitting the application |
| `32-ev-tech-exhibit.md` | 1-page technical roadmap exhibit (English) — supplementary attachment for grant submission. Uses real metrics. | Submitting; tech follow-up questions |

## How to use this folder

**When a product question arises:**
1. Start with `21-company-story.md` for segment definitions
2. Then `22-product-vision.md` for roadmap context
3. Then `23-traction-metrics.md` for the numbers

**When a technical question arises:**
1. Start with `10-synthesis-master.md` to check if there's already a verdict
2. Then `11-technical-context.md` for the chosen approach
3. Then specific spec docs (`13-substitution-ux-spec.md`) for detail

**When external communication is needed:**
1. `31-ev-application-proposal.md` is the public commitment
2. `24-founders-story.md` for personal anecdotes
3. `26-references.md` for who can vouch for what

## Status of each doc

All docs reflect the state of Horecom as of **May 19, 2026**.

- Metrics in `23-traction-metrics.md` are from real 1C/Tilda exports
- Founder bios in `24-founders-story.md` are confirmed by the team
- Synthesis verdicts in `10-synthesis-master.md` are final unless explicit the team decision overrides
- Grant materials in 30s are the actual draft for submission (not historical)
