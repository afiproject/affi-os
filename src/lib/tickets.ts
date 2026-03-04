import { prisma } from "./db";
import { TicketReason, TicketRefType } from "@prisma/client";
import { randomUUID } from "crypto";

// チケット消費コスト定義
export const TICKET_COSTS = {
  SQUARE_POST: 2,
  SQUARE_REQUEST: 5,
  SLOT_LISTING: 0,
  BOOST_1H: 3,
  BOOST_6H: 10,
} as const;

// チケット返金額
export const TICKET_REFUNDS = {
  REQUEST_REJECTED: 2, // 拒否時: 半額返金
  REQUEST_TIMEOUT: 5, // タイムアウト時: 全額返金
} as const;

// 日次上限
export const DAILY_LIMITS = {
  POSTS: 10,
  REQUESTS: 20,
  INVITES: 10,
} as const;

// 初回ボーナス
export const SIGNUP_BONUS = 20;

/**
 * チケットを消費する（トランザクション内で残高チェック + 消費を原子的に実行）
 */
export async function consumeTickets(params: {
  userId: string;
  amount: number;
  reason: TicketReason;
  refType?: TicketRefType;
  refId?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const key = params.idempotencyKey ?? `${params.reason}_${params.refId ?? randomUUID()}_${Date.now()}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 冪等性チェック
      const existing = await tx.ticketLedger.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: params.userId },
        });
        return { success: true, newBalance: user.ticketBalance };
      }

      // 残高チェック
      const user = await tx.user.findUniqueOrThrow({
        where: { id: params.userId },
      });

      if (user.ticketBalance < params.amount) {
        return {
          success: false,
          newBalance: user.ticketBalance,
          error: "チケットが不足しています",
        };
      }

      // 台帳記録
      await tx.ticketLedger.create({
        data: {
          userId: params.userId,
          delta: -params.amount,
          reason: params.reason,
          refType: params.refType,
          refId: params.refId,
          idempotencyKey: key,
        },
      });

      // キャッシュ残高更新
      const updated = await tx.user.update({
        where: { id: params.userId },
        data: { ticketBalance: { decrement: params.amount } },
      });

      return { success: true, newBalance: updated.ticketBalance };
    });

    return result;
  } catch (error) {
    console.error("Ticket consumption error:", error);
    return { success: false, newBalance: 0, error: "チケット処理に失敗しました" };
  }
}

/**
 * チケットを付与する
 */
export async function grantTickets(params: {
  userId: string;
  amount: number;
  reason: TicketReason;
  refType?: TicketRefType;
  refId?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; newBalance: number }> {
  const key = params.idempotencyKey ?? `${params.reason}_${params.refId ?? randomUUID()}_${Date.now()}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 冪等性チェック
      const existing = await tx.ticketLedger.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: params.userId },
        });
        return { success: true, newBalance: user.ticketBalance };
      }

      // 台帳記録
      await tx.ticketLedger.create({
        data: {
          userId: params.userId,
          delta: params.amount,
          reason: params.reason,
          refType: params.refType,
          refId: params.refId,
          idempotencyKey: key,
        },
      });

      // キャッシュ残高更新
      const updated = await tx.user.update({
        where: { id: params.userId },
        data: { ticketBalance: { increment: params.amount } },
      });

      return { success: true, newBalance: updated.ticketBalance };
    });

    return result;
  } catch (error) {
    console.error("Ticket grant error:", error);
    return { success: false, newBalance: 0 };
  }
}
