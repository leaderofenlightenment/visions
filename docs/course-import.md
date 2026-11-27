# Course publishing and enrollment

Learners use VISIONS accounts. The course text and attachments live in a
private Supabase project. The public repository contains the reader, catalog
metadata, and import code.

## Configure Supabase once

Apply the checked-in Supabase migrations in filename order. Set the app's normal Supabase URL and publishable key. The migration
creates `course_documents`, `course_enrollments`, and the private
`course-materials` Storage bucket.

## Import the course privately

A reviewed private source snapshot can be used directly on the machine where
it was staged. From the project directory, run `npm run course:prepare` to check
catalog coverage and the checksums of referenced attachments.

To stage an independent copy, use a read-only Notion integration that can
access The Master Creator and the linked pages and databases, including
the Digital Marketing Toolkit. Store the credentials in a private
`.env.course-owner` file on the owner's machine:

```dotenv
NOTION_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_COURSE_ADMIN_KEY=
```

`SUPABASE_COURSE_ADMIN_KEY` is a Supabase secret or legacy service-role key used
only by the owner import command. Keep it out of app runtime variables,
browser code, chat, and Git. If staging already exists, leave the Notion key
unset and run the publish step only.

```sh
npm run course:stage
npm run course:prepare
npm run course:publish
```

Staging calls Notion's Markdown endpoint and saves content under
`.course-private/`. Preparation translates internal course links to VISIONS,
checks attachment checksums, and reports missing sources. Publishing uploads
attachments to the private bucket, then upserts the document snapshot.
Rerun staging and publishing when a course page changes. New catalog entries
need a corresponding lens and life-domain mapping.

The snapshot renders linked database resources as templates using their
field definitions. It does not import live rows, contacts, financial
records, or CRM data from the source workspace. Learners can create their
own applications in the framework. Modern Monastic is available as an attachment. The Vortex Funnel and Threefold Partner Identification open their original linked documents without affiliate tracking. Bring in their original files or text to host them natively. The reader omits outbound promotional links in the Digital Marketing Toolkit and its related materials.

## Enroll learners

Create a user account under **Authentication → Users** and copy its UUID.
Use the Supabase SQL Editor to grant that learner access:

```sql
insert into public.course_enrollments(user_id)
values ('REPLACE-WITH-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

Give learners the app URL and their VISIONS sign-in instructions. They can find their materials in Lifestyle, Business, and Relationships.
Test with two accounts. The enrolled account should open an imported lesson
and private attachment. The other should be blocked even when it knows the
lesson or attachment URL. To revoke enrollment, remove the corresponding
`course_enrollments` row. Issued asset links expire after 15 minutes.

[Notion Markdown API](https://developers.notion.com/reference/retrieve-page-markdown)

## Assign a paid tier

An enrollment defaults to `course` ($33). After arranging access with a learner,
update that learner's existing row to `ai` ($333) or `concierge` ($3,333).
The AI and concierge tiers both unlock the optional server-side Core AI
when the provider is configured. Personal coaching and production work
are arranged directly with Eric. VISIONS has no online payment collection.
