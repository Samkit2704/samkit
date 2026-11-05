# Samkit — The Series

A responsive performance-marketing site built with vanilla HTML, CSS, and JavaScript.

## Run locally

Open `index.html` in a browser or serve the project root with any static file server.

## Supabase setup

1. Create a Supabase project.
2. Set the project URL and public anon key in `js/supabase-config.js`. These are browser-visible credentials; never use a service-role key or account password in this file.
3. Run `supabase/client_accounts.sql` in the Supabase SQL Editor.
4. Run `supabase/admin_setup.sql` in the SQL Editor.
5. Create an admin user in Supabase Authentication and promote its UUID using the bootstrap SQL comments at the bottom of `supabase/admin_setup.sql`.
6. Configure the production and local site URLs under Supabase Authentication URL settings so email confirmation and password reset links return to this site.

The admin panel edits JSON records and publishes them to Supabase. Client package requests remain pending until an administrator activates them.

## Deploy

### Vercel

1. Sign in to Vercel and import `Samkit2704/samkit` from GitHub.
2. Keep the framework preset as **Other**. This is a static site: use the repository root, leave the build command empty, and leave the output directory empty.
3. Use the project name `sseries` if the name is available. Vercel will provide a `sseries.vercel.app` URL if that subdomain is available; otherwise, use the generated deployment URL or add a custom domain you own in Project Settings → Domains.
4. Every push to `main` will trigger a production deployment after the Git integration is connected.
5. Add the final deployed domain to Supabase Authentication URL settings so email confirmation and password reset links work.

The public anon key may be used in frontend configuration; keep all service-role keys and passwords out of the repository.
