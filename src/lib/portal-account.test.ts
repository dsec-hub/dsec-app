/**
 * Pure-logic test for the profile refresh merge. Run:
 *
 *   npx tsx src/lib/portal-account.test.ts
 */
import { profileRefreshPatch } from "./portal-account-merge";

const failures: string[] = [];
const check = (name: string, ok: boolean) => {
  if (!ok) {
    failures.push(name);
  }
};

check(
  "empty name is not written",
  !("name" in profileRefreshPatch({ name: null, avatarUrl: null, provider: "email", providerAccountId: null })),
);
check(
  "real name is written",
  profileRefreshPatch({ name: "Ada", avatarUrl: null, provider: "email", providerAccountId: null }).name === "Ada",
);
check(
  "empty avatar is not written",
  !("avatarUrl" in profileRefreshPatch({ name: null, avatarUrl: null, provider: "email", providerAccountId: null })),
);

if (failures.length) {
  console.error("FAILED: " + failures.join(", "));
  process.exit(1);
}
console.log("portal-account: all assertions passed");
