# Supabase integration — BizMate AI

## Target project
- Project ref: `vvfwjtviygmsjbjxtvny`
- Region: Mumbai (`ap-south-1`)
- API URL: `https://vvfwjtviygmsjbjxtvny.supabase.co`

## Status and important limitation
This branch adds a proposed database schema, RLS policies, environment-variable names, and a manually triggered GitHub Actions migration workflow. It does **not** yet replace the application's in-memory Maps with PostgreSQL. Do not describe the app as fully connected/persistent until the database adapter and authentication routes are migrated and tested.

## Local setup
1. Copy `.env.example` to `.env`.
2. In Supabase Dashboard → Project Settings → API, copy the publishable key into `SUPABASE_PUBLISHABLE_KEY`.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` only in trusted server environments. Never use it in browser code, `VITE_*` variables, Git commits, screenshots, or client responses.
4. Install the Supabase CLI using the official instructions: https://supabase.com/docs/guides/cli
5. Link the local repository to project ref `vvfwjtviygmsjbjxtvny` and review the migration before applying it.

## GitHub Actions migration workflow
In GitHub repository Settings → Secrets and variables → Actions, add:
- `SUPABASE_DB_URL`: the database connection string for this project. Treat it as a secret.

Then open Actions → Supabase Migrations → Run workflow and type the exact project ref. The workflow is manual and refuses to run if the typed target differs. Use a database connection string from Supabase Dashboard; never commit it. Protect the `supabase-migrations` GitHub environment with required reviewers before production use.

## Security and migration notes
- RLS is enabled on user-owned tables; sensitive writes are intentionally restricted.
- Credit changes, payment verification, subscription mutation, and audit writes belong in trusted server-side code or carefully reviewed database functions.
- Supabase Auth UUIDs replace the current in-memory demo IDs. A separate application migration is required to map routes/services to Supabase Auth and Postgres.
- Existing in-memory code seeds demo users and demo passwords. Do not use those credentials in a deployed environment.
- The migration has not been applied to Supabase. Review/test it against a disposable project first. The migration runner may require validation and fixes before first execution.
