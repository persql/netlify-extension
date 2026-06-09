# PerSQL for Netlify — extension

The managed way to connect a Netlify site to PerSQL. Install it, click
**Connect PerSQL**, sign in, pick a namespace — the extension writes
`PERSQL_API_URL`, `PERSQL_DATABASE`, and `PERSQL_TOKEN` to the site over OAuth,
so there's no token to copy-paste.

Built on PerSQL's OAuth server (`api.persql.com/oauth/{authorize,token}`) — the
same surface behind **OAuth apps** in the PerSQL console. A non-`openid` scope
(`database`) routes to the "connect data" flow, which mints a `psql_live_*`
namespace token (not a sign-in id_token).

## Layout

- `src/index.ts` — extension entry. `onPreBuild` reads
  `context.auth.providerToken`, provisions/identifies a database, and sets the
  three env vars on the site.
- `src/ui/team-configuration.tsx` — the `ProviderAuthCard` connect surface.
- `extension.yaml` — manifest (`name` + `slug`). The slug must match the one
  Netlify auto-generates at create time (see Publish).
- `details.md` — directory listing copy (optional `/assets/` for images).
- `netlify.toml` — build/dev + the `@netlify/sdk` build plugin. The OAuth
  provider connection is configured in the extension's settings UI, not here.

> The build/plugin wiring is SDK-version-specific. The reliable path is to
> generate the canonical scaffold with `npm create @netlify/sdk@latest`, then
> merge this repo's `src/`, `extension.yaml`, and `details.md` into it.

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

## To verify against the live Netlify SDK

The two integration points use `@netlify/sdk` surfaces that vary by SDK version
— confirm them against <https://developers.netlify.com/sdk/> before shipping:

- `utils.setEnvironmentVariables(...)` in `onPreBuild` (the env-var write API).
- The `/v1/whoami` and `/v1/databases` PerSQL calls in `provisionDatabase` — if
  a bearer-authenticated provisioning endpoint isn't available, the v1 fallback
  is to write `PERSQL_API_URL` + `PERSQL_TOKEN` and expose a database-slug field
  in the team config for the user to fill.
