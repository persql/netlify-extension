import { NetlifyExtension } from "@netlify/sdk";

// Extension server entry. Verified against @netlify/sdk@5.0.4.
//
// IMPORTANT (v5 API): the OAuth token from "Connect PerSQL" is exposed as
// `auth.providerToken` in the SDK *server / surface* context
// (NetlifySDKContext) — NOT in the build hook. So the connect surface
// (src/ui/surfaces) reads `providerToken` after the OAuth exchange, provisions
// a PerSQL database, and persists the connection (team/site config). This
// onPreBuild handler then reads that stored connection back via `client` and
// writes the three env vars onto the build via `netlifyConfig`.
const extension = new NetlifyExtension();

extension.addBuildEventHandler(
  "onPreBuild",
  async ({ client, netlifyConfig }) => {
    const conn = await loadConnection(client);
    if (!conn) return; // not connected yet -> don't fail the build
    netlifyConfig.build.environment.PERSQL_API_URL = conn.apiUrl;
    netlifyConfig.build.environment.PERSQL_DATABASE = conn.database;
    netlifyConfig.build.environment.PERSQL_TOKEN = conn.token;
  }
);

interface PerSQLConnection {
  apiUrl: string;
  database: string; // "<namespace>/<db-slug>"
  token: string; // psql_live_*
}

// Read the connection the connect surface persisted after OAuth. Wire this to
// the SDK client's config read once the surface + schema are generated
// (npm create @netlify/sdk@latest -> src/server + src/schema).
async function loadConnection(
  client: unknown
): Promise<PerSQLConnection | null> {
  void client;
  return null;
}

export { extension };
