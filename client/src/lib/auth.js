import { createAuthClient } from '@neon/auth';
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
export const authClient = authUrl
  ? createAuthClient(authUrl, { adapter: BetterAuthReactAdapter() })
  : null;

export async function getNeonAccessToken() {
  if (!authClient) throw new Error('Neon Auth URL is missing. Run `neon env pull` from the project root.');
  const result = await authClient.token();
  if (result.error) throw new Error(result.error.message ?? 'Neon Auth could not refresh the session.');
  return result.data?.token ?? null;
}
