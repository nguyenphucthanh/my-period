import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({}),
  periods: defineTable({
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  }).index("by_user_and_start", ["userId", "startDate"]),
  pregnancies: defineTable({
    userId: v.id("users"),
    startDate: v.string(),
    // Missing while the pregnancy is in progress.
    endDate: v.optional(v.string()),
  }).index("by_user_and_start", ["userId", "startDate"]),
  numbers: defineTable({
    value: v.number(),
  }),
});
