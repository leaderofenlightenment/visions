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
