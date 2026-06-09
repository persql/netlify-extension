import {
  ProviderAuthCard,
  TeamConfigurationSurface,
} from "@netlify/sdk/ui/react/components";

// The connect surface. ProviderAuthCard renders the "Connect PerSQL" button and
// drives the OAuth flow using the provider config set in the extension's
// settings (Authorization URL, Token URL, Client ID/Secret, Scopes). After the
// user approves, the minted PerSQL token is available to the build handler as
// context.auth.providerToken.
export const TeamConfiguration = () => (
  <TeamConfigurationSurface>
    <ProviderAuthCard />
  </TeamConfigurationSurface>
);
