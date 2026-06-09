# PerSQL for Netlify — extension

The managed way to connect a Netlify site to PerSQL. Install it, click
**Connect PerSQL**, sign in, pick a namespace — the extension writes
`PERSQL_API_URL`, `PERSQL_DATABASE`, and `PERSQL_TOKEN` to the site over OAuth,
so there's no token to copy-paste.

Built on PerSQL's OAuth server (`api.persql.com/oauth/{authorize,token}`) — the
same surface behind **OAuth apps** in the PerSQL console. A non-`openid` scope
(`database`) routes to the "connect data" flow, which mints a `psql_live_*`
namespace token (not a sign-in id_token).

## Status

The **build/plugin wiring is verified** against `@netlify/create-sdk@3.0.4` /
`@netlify/sdk@5.0.4` (see `netlify.toml`, `package.json`). The **extension code
is a skeleton, not yet buildable** — a real v5 extension is a multi-file
Vite + React + tRPC project, so the reliable path is:

```
npm create @netlify/sdk@latest      # generates src/ui (surfaces), src/server,
                                    # src/endpoints, src/schema, vite/tsconfig
```

then implement the two PerSQL pieces below into the generated tree.

Two v5 facts that older docs get wrong — both already reflected in the skeleton:

- **`auth.providerToken` lives in the server/surface context, not the build
  hook.** `onPreBuild` receives `{ netlifyConfig, client, ... }` — no `auth`.
  So the surface reads the token and persists the connection; `onPreBuild`
  reads it back via `client` and sets env via `netlifyConfig.build.environment`.
- **`ProviderAuthCard` is not exported by `@netlify/sdk@5`.** Use the current
  connect/OAuth components from <https://developers.netlify.com/sdk/>.

## Layout

- `src/index.ts` — extension entry: `onPreBuild` reads the persisted connection
  via `client` and writes the three env vars via `netlifyConfig`.
- `src/ui/team-configuration.tsx` — placeholder for the connect surface (the
  real one is generated; see above).
- `extension.yaml` — manifest (`name` + `slug`). The slug must match the one
  Netlify auto-generates at create time (see Publish).
- `details.md` — directory listing copy (optional `/assets/` for images).
- `netlify.toml` — build/dev + the `@netlify/netlify-plugin-netlify-extension`
  plugin. The OAuth provider connection is configured in the extension's
  settings UI, not here.

## OAuth provider config (extension settings UI)

| Field | Value |
|---|---|
| Short description | PerSQL |
| Authorization URL | `https://api.persql.com/oauth/authorize` |
| Token URL | `https://api.persql.com/oauth/token` |
| Client ID | `psqlrp_…` from PerSQL console -> OAuth apps |
| Client Secret | `psqlrs_…` (shown once at creation) |
| Scopes | `database` |

Register Netlify's fixed callback `https://api.netlify.com/auth/done/identeer`
as a redirect URI on the PerSQL OAuth app. For staging, use
`api-staging.persql.com` and a separate staging OAuth app.

## Publish

Prereqs: a **Team Owner** role on the Netlify team, and this repo on Git.
Visibility is one-way (Private -> Public/Unlisted -> Public/Listed), so test
thoroughly while Private. Full reference:
<https://developers.netlify.com/sdk/publish/publish-extensions/>.

1. **Register the PerSQL OAuth app.** Console -> **OAuth apps -> New app**
   (in a stable namespace you won't delete): name `Netlify`, redirect URI
   `https://api.netlify.com/auth/done/identeer`, type **Confidential**. Capture
   `client_id` + `client_secret`.
2. **Deploy the extension project.** Import this repo as a **new Netlify
   project** (one extension per project; Netlify hosts it from there). Deploy.
3. **Create the extension (Private).** Netlify -> **Extensions -> Created by
   your team -> Create an extension**. Enter display name `PerSQL`, a slug, and
   a summary; select the project from step 2; choose the **least-privilege**
   scope (site env-var write). Create.
4. **Sync the slug.** Copy the auto-generated slug from **Manage** into
   `extension.yaml`, then commit + push + redeploy.
5. **Configure OAuth.** In the extension settings, enter the OAuth config from
   the table above (scope `database`). Install on your own team and verify the
   connect -> env-var-injection flow end to end.
6. **Go public.** Manage -> Visibility -> **Change visibility** (Public,
   Unlisted) to share by link, then **Submit for listing** for directory review.

## Still to build (after `npm create @netlify/sdk@latest`)

1. **Connect surface** (`src/ui/surfaces/TeamConfiguration.tsx`) — render the
   OAuth connect control; on success read `auth.providerToken`, call PerSQL to
   provision/identify a database, and persist the connection via the surface's
   tRPC mutation (`src/server` + `src/schema`).
2. **PerSQL provisioning** — from the surface (where `providerToken` lives),
   resolve the namespace and ensure a database. If no bearer-authenticated
   provisioning endpoint exists, fall back to persisting `apiUrl` + `token` and
   letting the user pick the database slug in the surface.
3. **`onPreBuild`** (`src/index.ts`) — read the persisted connection via
   `client` and set `netlifyConfig.build.environment.{PERSQL_API_URL,
   PERSQL_DATABASE,PERSQL_TOKEN}` (already stubbed).

Confirm exact component/client APIs against
<https://developers.netlify.com/sdk/> for the installed SDK version.
