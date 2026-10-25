// SPDX-License-Identifier: AGPL-3.0-only
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

/**
 * Crashes in a Server Component until the e2e-heal cookie is set, the case reset() cannot recover
 * from: only a refetch (retry) asks the server again. Like its sibling it exists only when the
 * test server sets NEXT_PUBLIC_E2E=1.
 */
export default async function Page() {
  if (process.env.NEXT_PUBLIC_E2E !== "1") notFound();
  if ((await cookies()).get("e2e-heal")?.value !== "1") throw new Error("e2e: forced server render error");
  return (
    <main id="main">
      <h1>Recovered on the server</h1>
    </main>
  );
}
