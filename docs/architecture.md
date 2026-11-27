# Architecture

The Nexus uses Next.js App Router with a client dashboard. Canonical agents, destinations and domain metadata live in a shared catalog. The network renderer has two independent layers. A Canvas 2D renderer draws procedural paths, point fields and mathematical ribbons. Native buttons provide the selectable nodes so the network works with a keyboard and assistive technology. Canvas 2D provides a small Phase 01 footprint. A later GPU implementation can replace the decorative renderer without replacing the controls or the event model.

Phase 01 stores only display preferences, module visibility and draft task metadata in browser storage. Services have no credentials and all examples are identified in the UI. Local workflow planning validates an intention and uses deterministic routing to create a draft. An actual execution must have server authorization, an enabled provider and a persisted run. Future animation edges must be driven by validated workflow events, including from/to agent identifiers, rather than inferred from a loading timer.

Future server boundaries are repositories scoped to the authenticated owner, Core orchestration, authorized retrieval, and provider adapters for reasoning, imagery and audio. Supabase Auth and PostgreSQL own identities and persistence. Next.js route handlers validate session, input and budgets on the server. The server should read only the minimum records needed for a task. Use filtered pgvector and full-text retrieval with authorized passage IDs and source provenance. Relationship and journal context require specific consent before any provider call.

Store workflows as durable runs with append-only events, ordered steps, budgets, idempotency keys and an immutable output revision for approvals. Use leases and finite retries. Publishing uses a separate execution capability and server-verified approval for the exact revision and destination. Until those conditions exist, support draft planning only. Keep providers swappable and include a capability check for actual audio generation.

Production target is a private GitHub repository, Vercel and Supabase with separate development, preview and production environments. Phase 01 is a local implementation milestone.

- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Holistic framework

The Core owns a graph of reflections classified by one VISIONS lens and one
or more life domains. Supabase persists the graph as one owner-scoped,
revisioned aggregate. This makes adding an idea and its connections atomic.
The device mode uses a distinct browser store. The Core and individual lens workspaces show saved ideas and their connections.
The dashboard uses a separate decorative 3D projection around a centered Core
button. Its motion does not report model activity.

Optional Core reflection uses a single bounded Responses API call. The server
adds the seven lens prompts, the user's explicit intention and any selected
licensed passages. It does not query the framework or personal workspaces.
