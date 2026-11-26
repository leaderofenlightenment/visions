# Implementation roadmap

- [x] Inspect workspace and design reference
- [x] Establish architecture, design system and data model
- [x] Phase 01 implementation · Nexus shell, procedural graph, seven agent workspaces, knowledge and outputs, command palette and responsive settings
- [ ] Phase 01 manual QA · inspect desktop and mobile rendering in a browser. The managed preview could not bind its local port in this run.
- [ ] Phase 02 · Auth, owner-scoped persistence, habits, calendar, journals, relationships and projects
- [ ] Phase 03 · Reasoning adapters, scoped retrieval, bounded workflows, runtime event visualization, usage and cost
- [ ] Phase 04 · Licensed source ingestion, versioned theological knowledge and reviewable provenance
- [ ] Phase 05 · Article, image and music workspaces, derivative assets, editorial review and approvals
- [ ] Phase 06 · Vercel deployment, security and accessibility validation, monitoring, backups and operational documentation

### Phase 02 status

- [x] Configurable Supabase email/password sign-in and server-side sessions
- [x] Owner-scoped records and habit completion migrations
- [x] Editable habits, journals, relationship profiles and projects
- [x] Week and 30-day habit completion windows
- [ ] Verify authentication and persistence end to end against a configured Supabase instance
- [x] Filterable relationship clusters with condition indicators and zoom
- [ ] Add flexible schedules, reminders, routine templates, richer relationship history, and graph navigation
- [ ] Complete data export, account deletion, and production-sensitive storage review

### Phase 03 status

- [x] Configurable server-side Responses API adapter and seven role instructions
- [x] Authenticated agent and Core execution with consent, request deadline, and a database-backed rate limit
- [ ] Verify sign-in and live provider calls against configured services
- [ ] Persist resumable workflows and conversations, source retrieval, usage, approvals, and event-driven network highlights

### Phase 04 status

- [x] Owner-scoped licensed passage library, title search, and provenance review
- [x] Consent-based retrieval by selected passage ID with visible citation references
- [ ] Curated verified corpus, editorial version history, document ingestion, semantic retrieval, and knowledge graph editing

### Phase 05 status

- [x] Text studios for articles, posts, threads, visual briefs, and soundtrack briefs
- [x] Story drafting, Negation review, and Markdown export with source references
- [ ] Durable content projects and derivative tracking, media generation, approval queues, and publication workflow
