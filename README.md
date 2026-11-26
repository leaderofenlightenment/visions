# VISIONS Reality Codex

The Nexus brings Lifestyle, Business, and Relationships into one framework.
Its seven VISIONS lenses help you reflect on purpose, connections, meaning,
patterns, next steps, limits, and sustainable rhythms.

## Run locally

Use Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 and select the **VISIONS Core**. Choose a lens and one
or more life domains, then save an idea. Link related ideas across lenses and
domains. The Nexus adds clickable branches as you fill in the framework, and
each lens has a smaller map of its ideas. Settings controls motion and network
detail. The Core can export the framework as JSON.

Without Supabase, the framework is stored in the current browser. Keep local
ideas non-sensitive. Supabase account data and the browser framework are
separate. Configuring Supabase does not upload browser ideas.

```sh
npm run verify
```

This runs lint, TypeScript checks, automated tests, and a production build.
See the [deployment guide](docs/deployment.md) for hosted verification.

## Supabase setup

Create a Supabase project. Apply the SQL files in
[`supabase/migrations`](supabase/migrations) in filename order, skipping any
migration already applied to that project. The fourth migration adds
owner-scoped framework storage. Create an email/password user under
**Authentication → Users**. Copy `.env.example` to `.env.local`, set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and sign in
from Lifestyle, Relationships, or Projects. Use the publishable key.

The personal workspaces include habits, calendars, journals, relationship
profiles and projects. The database applies row-level security to personal
records, the framework, and the source library.

## Source library and Core reflection

In **Knowledge**, save short passages with attribution, edition, locator,
provenance, and rights. Browse and search by title. To correct a passage,
create a replacement and remove the obsolete record.

For optional AI reflection, configure server-only `OPENAI_API_KEY` and a
Responses API-compatible `OPENAI_MODEL`. Sign in and open **Reflect with the
VISIONS Core**. The Core considers all seven lenses and prompts you to connect
the three life domains. Each run sends the submitted intention and up to
three explicitly selected passages after you grant consent. Framework ideas,
journals, and relationship records are outside the request. The database
allows one run per account per calendar minute, and provider calls have a
45-second deadline. The UI shows the selected passages for citation checking.

Story and Negation are lenses for meaning and discernment. Article production,
automated editorial review, media rendering, and external publishing are
deferred. See the [development roadmap](docs/roadmap.md) for remaining work.

- [Project requirements](AGENTS.md)
- [Architecture](docs/architecture.md)
- [Design system](docs/design.md)
- [Database and security model](docs/data-model.md)
