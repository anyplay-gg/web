// SPDX-License-Identifier: AGPL-3.0-only
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Bomb } from "./bomb";

/**
 * A page that crashes on purpose, for the browser test of the error screen. It exists only when the
 * test server sets NEXT_PUBLIC_E2E=1; in every other build it is a 404 and renders nothing.
 */
export default async function Page() {
  await connection();
  if (process.env.NEXT_PUBLIC_E2E !== "1") notFound();
  return <Bomb />;
}
