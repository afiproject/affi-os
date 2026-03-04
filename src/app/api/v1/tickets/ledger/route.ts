import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthenticatedSession,
  success,
} from "@/lib/api-utils";

// チケット利用履歴
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const [entries, total, user] = await Promise.all([
    prisma.ticketLedger.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticketLedger.count({
      where: { userId: session!.user.id },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: session!.user.id },
      select: { ticketBalance: true },
    }),
  ]);

  return success({ entries, total, balance: user.ticketBalance, page });
}
