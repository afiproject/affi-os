import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, TICKET_PACKS } from "@/lib/stripe";
import { grantTickets } from "@/lib/tickets";
import {
  getAuthenticatedSession,
  success,
  badRequest,
  notFound,
} from "@/lib/api-utils";

// チケット残高
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await getAuthenticatedSession();
  if (errorResponse) return errorResponse;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { ticketBalance: true, updatedAt: true },
  });

  return success({ balance: user.ticketBalance, lastUpdated: user.updatedAt });
}
