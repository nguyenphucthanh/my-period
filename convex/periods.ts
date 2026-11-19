import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { daysBetween, isValidIsoDate, MAX_PERIOD_DAYS } from "./lib/dates";
import { requireUserId } from "./lib/requireUser";
import { findOpenPregnancy } from "./pregnancies";

// Matches MAX_RECENT_PERIODS in lib/cycle.ts: the prediction only uses the
// latest 6 periods, and the home page table shows the same ones.
const MAX_LISTED = 6;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("periods")
      .withIndex("by_user_and_start", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_LISTED);
  },
});

async function validate(
  ctx: MutationCtx,
  userId: Id<"users">,
  startDate: string,
  endDate: string,
  selfId?: Id<"periods">,
) {
  if ((await findOpenPregnancy(ctx, userId)) !== null) {
    throw new Error("Cannot log periods while pregnant");
  }
  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    throw new Error("Invalid date");
  }
  if (endDate < startDate) {
    throw new Error("End date is before start date");
  }
  if (daysBetween(startDate, endDate) + 1 > MAX_PERIOD_DAYS) {
    throw new Error("Period is too long");
  }
  // Stored periods never overlap, so only the latest one starting on or
  // before the new end can overlap the new range.
  const candidates = await ctx.db
    .query("periods")
    .withIndex("by_user_and_start", (q) =>
      q.eq("userId", userId).lte("startDate", endDate),
    )
    .order("desc")
    .take(2);
  const other = candidates.find((p) => p._id !== selfId);
  if (other && other.endDate >= startDate) {
    throw new Error("Period overlaps an existing one");
  }
}

export const log = mutation({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const userId = await requireUserId(ctx);
    await validate(ctx, userId, startDate, endDate);
    return await ctx.db.insert("periods", { userId, startDate, endDate });
  },
});

async function requireOwned(
  ctx: MutationCtx,
  userId: Id<"users">,
  id: Id<"periods">,
) {
  const period = await ctx.db.get("periods", id);
  if (period === null || period.userId !== userId) {
    throw new Error("Period not found");
  }
  return period;
}

export const update = mutation({
  args: { id: v.id("periods"), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { id, startDate, endDate }) => {
    const userId = await requireUserId(ctx);
    await requireOwned(ctx, userId, id);
    await validate(ctx, userId, startDate, endDate, id);
    await ctx.db.patch("periods", id, { startDate, endDate });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("periods") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    await requireOwned(ctx, userId, id);
    await ctx.db.delete("periods", id);
    return null;
  },
});
