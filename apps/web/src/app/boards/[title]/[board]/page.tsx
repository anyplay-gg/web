// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { BoardScreen } from "@/components/boards/board-screen";

type Props = { params: Promise<{ title: string; board: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params;
  return { title: `Board ${decodeURIComponent(board)}`, robots: { index: false } };
}

export default async function Page({ params }: Props) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  const { title, board } = await params;
  return <BoardScreen titleId={decodeURIComponent(title)} board={decodeURIComponent(board)} />;
}
