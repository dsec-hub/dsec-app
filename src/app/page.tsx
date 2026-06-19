import { redirect } from "next/navigation";

import { getPortalUser } from "@/lib/portal-dal";

// The portal has no public landing page — the root just routes you to the right
// place. (The proxy already guarantees a session here; if it somehow lapsed,
// fall back to /login.)
export default async function Root() {
  const user = await getPortalUser();
  if (!user) redirect("/login");
  redirect(user.access === "locked" ? "/locked" : "/dashboard");
}
