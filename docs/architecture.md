# Architecture

The Nexus uses Next.js App Router with a client dashboard. Canonical movements and domain metadata live in shared catalogs. The network renderer has two independent layers. A Canvas 2D renderer draws procedural paths, point fields and mathematical ribbons. A native button centered in the network opens the Core by keyboard or pointer. Canvas 2D provides a small Phase 01 footprint. A later GPU implementation can replace the decorative renderer without replacing the controls or the event model.

Display preferences and prior workflow drafts remain in browser storage. The visual network shows decorative motion. Live provider features validate account access before using a configured service.

Future server boundaries are repositories scoped to the authenticated owner, Core orchestration, authorized retrieval, and provider adapters for reasoning, imagery and audio. Supabase Auth and PostgreSQL own identities and persistence. Next.js route handlers validate session, input and budgets on the server. The server should read only the minimum records needed for a task. Use filtered pgvector and full-text retrieval with authorized passage IDs and source provenance. Relationship and journal context require specific consent before any provider call.

Store workflows as durable runs with append-only events, ordered steps, budgets, idempotency keys and an immutable output revision for approvals. Use leases and finite retries. Publishing uses a separate execution capability and server-verified approval for the exact revision and destination. Until those conditions exist, support draft planning only. Keep providers swappable and include a capability check for actual audio generation.

Production target is a private GitHub repository, Vercel and Supabase with separate development, preview and production environments. Phase 01 is a local implementation milestone.

- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## The Codex and its three workspaces

The Core is the VISIONS Reality Codex. It shows seven movements in order, each with one writing prompt for Theosis, Creativity, and Psychology. The catalog uses the titles and text from the supplied Codex. A movement saves its three edited answers together through the existing owner-scoped, revisioned framework store. Prompt slots keep their domain and movement IDs for compatibility with earlier answers and links.

Lifestyle, Business, and Relationships build documents from the relevant answers and surface the corresponding Master Creator materials, bonuses, and personal tools. Course copies keep their original material and prompt identifiers. The dashboard's 3D view remains the door to the Core.

Optional VISIONS AI uses a single bounded Responses API call. The server adds the Codex movement names, the user's submitted intention, and any selected licensed passages. It does not query private framework or personal workspace records.

The Eden integration accepts a user-reviewed business draft and a one-request personal API key from an enrolled learner. It sends the draft to the default Eden Library. [Eden setup](eden.md)
