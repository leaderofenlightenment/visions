# Deployment and verification

Run `npm ci` and `npm run verify` for the exact Git revision intended for preview.
Vercel can import the repository using the Next.js preset and a Node runtime
supported by the project's package manifest. Use a test Supabase project and
preview access controls for the first hosted deployment.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the
preview environment to exercise authenticated storage. Apply the four
migrations in order and create two test accounts. Add `OPENAI_API_KEY` and
`OPENAI_MODEL` as server-side settings only when testing Core reflection.

## Hosted smoke test

1. Open the Nexus using a clean browser profile. Verify the Core, command
   palette, and graph can be reached by keyboard. Check a narrow mobile width
   and reduced motion.
2. Sign in with the first test account. Save a cross-domain idea and connect it
   to an idea under a second lens. Reload. Open the resulting branch and
   follow the link inside the lens workspace.
3. Open the app in a second browser profile and sign in with the second test
   account. Verify that the first user's framework, personal records, and
   saved passages remain inaccessible.
4. If OpenAI is configured, submit a non-sensitive Core reflection with one
   permitted source. Check that the source reference appears in the results
   and the rate limit is enforced on a second immediate submission.
5. Verify error handling after sign-out and under an unavailable provider. Use
   preview data to exercise recovery before enabling personal records.

Production deployment requires a production project, access and backup
settings, a restore drill, error monitoring that excludes personal payloads,
and a retention job for the rate-limit table. Keep live integration credentials
in the deployment environment. Framework storage uses revision checks to reject
concurrent saves based on an older snapshot.
