/**
 * Which profile fields a repeat sign-in may refresh. A sign-in that carries no
 * name/avatar (our email-code provider carries neither) must NOT blank out a
 * value the member set themselves — see the onboarding display name.
 *
 * Kept in its own module (no `server-only` import) so it can be unit-tested with
 * `tsx` and imported from both auth's upsert path and the test.
 */
export function profileRefreshPatch(input: {
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
  providerAccountId: string | null;
}) {
  return {
    ...(input.name ? { name: input.name } : {}),
    ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
    provider: input.provider,
    providerAccountId: input.providerAccountId,
  };
}
