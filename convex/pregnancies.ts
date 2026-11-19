import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { isValidIsoDate, latestAllowedDate } from "./lib/dates";
import { requireUserId } from "./lib/requireUser";

/** The user's latest pregnancy (open or ended), or null. */
async function latest(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("pregnancies")
    .withIndex("by_user_and_start", (q) => q.eq("userId", userId))
    .order("desc")
    .first();
}

/** The user's open pregnancy, or null. Only the latest one can be open. */
export async function findOpenPregnancy(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
) {
  const p = await latest(ctx, userId);
  return p !== null && p.endDate === undefined ? p : null;
}

function validateDate(date: string) {
  if (!isValidIsoDate(date)) throw new Error("Invalid date");
  if (date > latestAllowedDate()) throw new Error("Date is in the future");
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await latest(ctx, userId);
  },
});

export const start = mutation({
  args: { startDate: v.string() },
  handler: async (ctx, { startDate }) => {
    const userId = await requireUserId(ctx);
    validateDate(startDate);
    const previous = await latest(ctx, userId);
    if (previous !== null) {
      if (previous.endDate === undefined) {
        throw new Error("Pregnancy already in progress");
      }
      if (startDate <= previous.endDate) {
        throw new Error("Pregnancy overlaps an existing one");
      }
    }
    return await ctx.db.insert("pregnancies", { userId, startDate });
  },
});

export const end = mutation({
  args: { endDate: v.string() },
  handler: async (ctx, { endDate }) => {
    const userId = await requireUserId(ctx);
    const open = await findOpenPregnancy(ctx, userId);
    if (open === null) throw new Error("No pregnancy in progress");
    validateDate(endDate);
    if (endDate < open.startDate) throw new Error("End date is before start date");
    await ctx.db.patch("pregnancies", open._id, { endDate });
    return null;
  },
});

/** Deletes the open pregnancy, e.g. when it was entered by mistake. */
export const remove = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const open = await findOpenPregnancy(ctx, userId);
    if (open === null) throw new Error("No pregnancy in progress");
    await ctx.db.delete("pregnancies", open._id);
    return null;
  },
});
