# ELEVO — Your Skills. Real Opportunities.

Full-stack functioning prototype of the ELEVO learning-to-opportunity platform.
Black & white, raw, text-first design. **Zero npm dependencies** — runs on plain Node.js.

## The Journey
GOAL → LEARN → PRACTICE → BUILD → CONNECT → OPPORTUNITY

## Run it

```bash
# Requires Node.js 14+ (no npm install needed — zero dependencies)
node server.js
```

Then open **http://localhost:3000**

## What's inside

| Path | Purpose |
|---|---|
| `server.js` | Backend API + static file server (Node http, zero deps) |
| `public/index.html` | App shell |
| `public/css/style.css` | Black & white theme |
| `public/js/app.js` | SPA frontend (hash router, 10 screens) |
| `data/db.json` | Auto-created persistent data store |

## Features (all functional, no placeholders)

1. **Welcome** — brand + tagline + Get Started
2. **Choose Goal** — 4 careers (Wildlife Researcher, Graphic Designer, Developer, Entrepreneur) + live search ("Explore More") + reset-on-switch behavior
3. **Roadmap** — per-goal skills (5 each), progress bars, recommended next step, expandable rows
4. **Learn** — 3 topics per skill with real resource links, Start Learning + Mark Complete, progress updates live and persists
5. **Practice** — 4 real projects per career with step-by-step plans, Start Project / Mark Completed
6. **Portfolio** — auto-adds completed projects, manual Add Project form, delete, certificates section
7. **Connect** — Mentors / Creators / Learners / Organizations with filters, View Profile, Connect (persists)
8. **Opportunities** — Internships, Research, Projects, Competitions, Collaborations with filter chips + full detail pages + working email-apply button
9. **AI Mentor** — working demo mentor: knows your goal, progress, next step; answers "what should I learn next", "how can I improve X", "suggest a project", "show opportunities"; chat history persists
10. **Dashboard** — goal, skills completed, projects completed, portfolio, certificates, recommended next step

## API (all real, backed by `data/db.json`)

```
GET  /api/careers            GET  /api/careers/:id
POST /api/goal               GET  /api/goal
GET  /api/progress
POST /api/topic/:id/complete
POST /api/project/:id/start  POST /api/project/:id/complete
GET  /api/portfolio          POST /api/portfolio          DELETE /api/portfolio/:id
GET  /api/people?type=       POST /api/connect
GET  /api/opportunities      GET  /api/opportunities/:id
GET  /api/mentor             POST /api/mentor
GET  /api/dashboard          POST /api/reset
```

## Persistence
All state (goal, completed topics, projects, portfolio, certificates, connections, chat)
is stored in `data/db.json` and survives server restarts. Use the **Reset** button in the
top bar to wipe everything and start over.
