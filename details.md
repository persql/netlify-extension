# PerSQL

Give your Netlify site its own isolated SQLite database on the edge — and a
branch database per Deploy Preview. No connection strings to copy: connect once
over OAuth and PerSQL writes the env vars to your site for you.

## What it does

- **Connect over OAuth.** Click **Connect PerSQL**, sign in, and pick the
  namespace the site should use. No tokens to paste.
- **Auto-injects env vars.** The extension sets `PERSQL_API_URL`,
  `PERSQL_DATABASE`, and `PERSQL_TOKEN` on your site, so your functions can
  query immediately with `@persql/sdk`.
- **A database per Deploy Preview.** Each preview build can get its own
  isolated branch database, torn down when the PR closes.

## Setup

1. Install the extension on your team.
2. Open it and click **Connect PerSQL**. Approve the connection and choose a
   namespace.
3. Deploy. Query from a Netlify Function:

   ```js
   import { PerSQL } from "@persql/sdk";

   const db = new PerSQL({
     token: process.env.PERSQL_TOKEN,
     baseURL: process.env.PERSQL_API_URL,
   }).database(process.env.PERSQL_DATABASE);

   export default async () => {
     const { data } = await db.query("SELECT 1 AS ok");
     return Response.json(data);
   };
   ```

## Disconnecting

Disconnecting in the extension revokes the token it minted. You can also revoke
it any time from **API tokens** in the PerSQL console.

Docs: <https://docs.persql.com/integrations/netlify>
