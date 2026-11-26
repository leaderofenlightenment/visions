# VISIONS Reality Codex

**The Nexus** is the Phase 01 workspace for the Digital Liturgy Masterplan. It includes the interactive eight-node neural scene, seven agent workspaces, the nine-domain catalog, content entry points, a keyboard command palette and the three Reality Module previews.

## Run locally

Use Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use Ctrl+K or Command+K to search. Use the orbs to inspect an agent, and use **Plan multi-agent workflow** to create a local draft. Projects lists drafts and their suggested roles. Settings provides reduced motion and lightweight rendering options.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

The automated suite covers agent identity and draft routing, catalog search, keyboard palette focus, draft persistence, module visibility, motion preferences, and zoom controls. The managed preview server could not bind its port in the development environment, so manual browser checks remain open.

## Configuration and deployment

Phase 01 requires no credentials. The environment template documents names reserved for future services. Filling them now does not enable integrations. This build can run on any Next.js-compatible Node host. For a Vercel preview, import the intended private repository, select Next.js, set the Root Directory to this project if needed, and use `npm ci` and `npm run build`. Restrict access using the deployment platform. Production deployment follows authentication, database isolation, and operational checks.

This preview saves display preferences and workflow drafts in browser storage without authentication or encryption. Use non-sensitive task descriptions. Draft planning uses local rules and performs no model calls, publishing, or media generation.

- [Project requirements](AGENTS.md)
- [Architecture](docs/architecture.md)
- [Design system](docs/design.md)
- [Database and security model](docs/data-model.md)
- [Development roadmap](docs/roadmap.md)

## Phase 02 personal workspace setup

For the authenticated workspaces, create a Supabase project, then apply
`supabase/migrations/202611260001_personal_os.sql` in its SQL Editor. Create an
email/password user in **Authentication → Users**. Copy `.env.example` to
`.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the project's connection details.
Use the publishable key, and keep the service-role key out of the app. Restart
the development server and sign in from Lifestyle, Relationships, or Projects.

The Phase 02 foundation includes private records, daily habit completions,
calendar windows, an editable journal, grouped relationship profiles, and
projects. Workflow drafts from Phase 01 stay in the browser. Use test records
until you verify sign-in and account isolation against your Supabase project.

## Phase 03 live agent setup

After setting up Supabase, apply
`supabase/migrations/202611260002_agent_limits.sql`. Add a server-side
`OPENAI_API_KEY` and a Responses API-compatible `OPENAI_MODEL` to
`.env.local`, then restart the server. Sign in from a personal workspace,
open an agent or the VISIONS Core, enter a non-sensitive intention, and
check the permission box before running.

Single-agent runs use the selected role. The Core may use up to three roles
in sequence, including a final discernment step when routed. The API permits
one run per user per calendar minute and imposes a 45-second provider
deadline. It sends the submitted intention and previous steps from that
run without querying personal workspaces. This foundation shows completed
outputs in the current dialog. Persistent run history, retrieval, approvals,
and live network event streaming are future work. The rate-limit table
should have a retention job before production.
