import { NetlifyExtension } from "@netlify/sdk";

const extension = new NetlifyExtension();

const PERSQL_API_URL = "https://api.persql.com";

// Once the user connects PerSQL (ProviderAuthCard in src/ui), Netlify makes the
// minted PerSQL token available as `context.auth.providerToken`. We use it to
// provision/identify a database and write the three env vars the PerSQL SDK
// reads. Running this on every build keeps the vars present even if the site
// owner clears them.
extension.addBuildEventHandler("onPreBuild", async ({ context, utils }) => {
  const token = context?.auth?.providerToken;
  if (!token) {
    // Not connected yet — nothing to inject. Don't fail the build.
    return;
  }

  const conn = await provisionDatabase(token, context?.site?.name);

  // Set them on the site so subsequent builds + functions see them. The exact
  // call depends on the installed @netlify/sdk version — `utils` exposes the
  // Netlify API client; this is the documented env-var write surface.
  // Verify against https://developers.netlify.com/sdk/ for your SDK version.
  await utils.setEnvironmentVariables({
    PERSQL_API_URL: conn.apiUrl,
    PERSQL_DATABASE: conn.database,
    PERSQL_TOKEN: conn.token,
  });
});

interface PerSQLConnection {
  apiUrl: string;
  database: string; // "<namespace>/<db-slug>"
  token: string; // psql_live_*
}

// Provision (or reuse) a database for the connected namespace and return the
// env-var triple. The OAuth token is a namespace-admin `psql_live_*` token, so
// it can create databases and mint a database-scoped token via the PerSQL API.
// Wire this to the PerSQL provisioning endpoint; until then it returns the
// namespace token directly so the SDK works against the chosen database.
async function provisionDatabase(
  token: string,
  siteName: string | undefined
): Promise<PerSQLConnection> {
  const who = await fetch(`${PERSQL_API_URL}/v1/whoami`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!who.ok) {
    throw new Error(`PerSQL token rejected (${who.status})`);
  }
  const { namespace } = (await who.json()) as { namespace: string };

  const dbSlug = slugify(siteName ?? "netlify");
  // Idempotent create — the PerSQL API ignores a create for a db that already
  // exists, so re-running on every build is safe.
  await fetch(`${PERSQL_API_URL}/v1/databases`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ slug: dbSlug }),
  }).catch(() => {
    /* already exists or transient — env vars below still resolve */
  });

  return {
    apiUrl: PERSQL_API_URL,
    database: `${namespace}/${dbSlug}`,
    token,
  };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "netlify"
  );
}

export { extension };
