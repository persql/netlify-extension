// The "Connect PerSQL" surface lives here.
//
// Generate the canonical UI scaffold with `npm create @netlify/sdk@latest` — it
// produces src/ui/surfaces/TeamConfiguration.tsx wired to the SDK's current
// component set (Card / Form / FormField / ...) + tRPC. Then implement Connect
// PerSQL: render the OAuth connect control, and on success read
// `auth.providerToken` (NetlifySDKContext) to provision a PerSQL database and
// persist the connection for the onPreBuild handler in src/index.ts.
//
// NOTE: @netlify/sdk@5.0.4 does NOT export `ProviderAuthCard` (it appears only
// in older docs). Use the components the generated boilerplate imports and the
// current connect/OAuth pattern from https://developers.netlify.com/sdk/. This
// placeholder intentionally imports nothing so it can't drift from the SDK.
export {};
