# VISIONS Reality Codex

Start in the **VISIONS Core** on the Nexus. The Codex walks through seven movements, with one prompt for Theosis, Creativity, and Psychology in each movement. Saving answers updates your Rule of Life, Business Plan, and Relationship Management document. Download the [user manual](public/visions-user-guide.pdf) from the Core.

## Run locally

Use Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Sign in under **Account and settings** to use your private workspace. When Supabase is unavailable, use this browser for non-sensitive entries. Browser and account storage are separate.

```sh
npm run verify
```

This runs lint, TypeScript checks, automated tests, and a production build. See the [deployment guide](docs/deployment.md) for hosted verification.

## Supabase setup

Create a Supabase project. Apply each SQL file in [supabase/migrations](supabase/migrations) in filename order. Create an email/password user under **Authentication → Users**. Copy `.env.example` to `.env.local`, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sign in under **Account and settings**.

Existing Core answers and course notes use the same database and browser storage keys. Learners who used the earlier workbook can review their answers against the revised prompts. The rebuilt dashboard needs no new migration.

## The Master Creator and the three workspaces

- **Lifestyle** contains your Rule of Life, Sacramental Lifestyle Worksheet, and Modern Monastic bonus. Habits and journals sit below the course materials.
- **Business** takes you from your Business Plan and Career Creation Clarity through The Vortex Funnel, then to content research, creation, and scheduling with the Digital Marketing Toolkit and Eden.
- **Relationships** contains your Relationship Management document, Interpersonal Dynamic Articulation and its worksheets, and Threefold Partner Identification. Your private relationship records sit in the same workspace.

Each workspace contains its related lessons. Enrolled learners can read hosted materials, save answers and apply selected responses in the Core. A copy keeps its source ID. Editing a lesson response leaves any previously applied copy unchanged until the learner applies it again. See the [course publishing and enrollment guide](docs/course-import.md).

## Walk through the Codex in ChatGPT

1. Create a private ChatGPT Project named **VISIONS Reality Codex**.
2. In Project settings, paste the [guide instructions](public/visions-chatgpt-instructions.txt). Add the [workbook PDF](public/visions-user-guide.pdf) as a project source.
3. Start a chat with **Open the Codex**. Choose guidance to move through one question at a time, then ask ChatGPT to export your map for VISIONS.
4. In the app, open **VISIONS Core → Use ChatGPT**. Paste the JSON, select **Review map**, and save the answers you reviewed. The three workspace documents update from those answers.

Answers you enter in ChatGPT follow your ChatGPT data settings. For answers you want stored only in VISIONS, use the free workbook directly. Existing entries stay in the Core unless you explicitly approve a replacement shown in the preview. [ChatGPT Projects](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)

## VISIONS AI

Under **Reflect with VISIONS AI**, one request uses the complete method. The user controls the submitted intention and up to three selected source passages. Configure server-only `OPENAI_API_KEY` and `OPENAI_MODEL` to enable it for AI or concierge enrollments. The account store enforces one run per calendar minute. Provider calls have a 45-second deadline. The source library is available in the same panel.

## Eden

Open **Business → Research, create, and publish**. The referral link opens Eden. An enrolled learner with their own Eden API key can preview an approved business draft and send it to their Eden Library. The key is used for that request. VISIONS only sends the draft title and text the learner approves.

The referral does not grant a paid Eden subscription. Bundling an Eden plan into a VISIONS purchase requires a partnership agreement and a fulfillment method from Eden. See [Eden integration and fulfillment](docs/eden.md).

- [Project requirements](AGENTS.md)
- [Architecture](docs/architecture.md)
- [Design system](docs/design.md)
- [Database and security model](docs/data-model.md)
- [Development roadmap](docs/roadmap.md)
