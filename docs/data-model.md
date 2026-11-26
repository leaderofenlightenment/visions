# Database and security design

Phase 01 has no database. This is the proposed relational model for later migrations. All user-owned tables have a UUID key, owner_id referencing auth.users, created_at and updated_at. Child tables use composite foreign keys on parent ID and owner ID. Apply RLS with owner-scoped select, insert, update and delete policies using auth.uid(), plus role restrictions on server-owned records.

| Area | Tables and relationships |
| --- | --- |
| Identity | profiles, preferences, agent_configurations, notifications |
| Agents | conversations → messages, workflows → agent_executions → workflow_events, api_usage_records by execution |
| Knowledge | knowledge_domains → documents → passages → passage_embeddings, graph_nodes → graph_edges, tag links, collection entries |
| Sources | source_editions with author, translator, usage rights and provenance, passage references, ethical policy versions |
| Personal | goals → projects, habits → habit_schedules and habit_completions, lifestyle_journals |
| Relationships | relationship_categories → relationships → assessments and interactions, optional reminders by person |
| Creation | content_projects → articles, audio_assets and visual_assets, asset_revisions, derivative links to parent project |
| Publication | publication_schedules, ethical_reviews and human_approvals referencing a content revision and destination |

Index owner plus date on activity tables, child foreign keys, owner plus normalized names for relationship search, GIN on authorized full-text documents and an embedding index appropriate to the selected vector size. Deduplicate habit completions by habit and local calendar date. Scope unique workflow idempotency keys by owner. Passages retain edition, translation, locator, license and provenance. Keep relationship records outside general retrieval.

Private storage uses owner-prefixed paths and short-lived authorized URLs. Only server code can access API secrets. Sensitive fields require a threat model and a key rotation plan before enabling persistence. Authenticated deletion cascades through owned records, revokes asset access and reports scheduled backup expiry. Verify isolation with at least two users and anonymous sessions against actual RLS policies, including attempts to create cross-owner links. Validate who can create workflow events and approvals separately from who can read them.
