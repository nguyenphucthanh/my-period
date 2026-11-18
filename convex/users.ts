import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_MIN_PASSWORD_LENGTH } from "@convex-dev/auth/methods/username-password";
import { components } from "./_generated/api";

// Creates a `users` row for a new account and returns its id. Convex Auth
// calls this when someone signs up. To store profile fields, add them to the
// `users` table in `schema.ts` and set them here.
export const createUser = internalMutation({
  args: {
    method: v.object({
      name: v.literal("usernamePassword"),
      profile: v.object({}),
    }),
  },
  returns: v.id("users"),
  handler: async (ctx) => {
    return await ctx.db.insert("users", {});
  },
});

// Admin-only account creation (sign-up is not exposed publicly). Internal
// functions can't be called by clients; run from the CLI:
//   npx convex run users:createAccount '{"username":"…","password":"…"}'
export const createAccount = internalMutation({
  args: { username: v.string(), password: v.string() },
  returns: v.id("users"),
  handler: async (ctx, { username, password }) => {
    const userId = await ctx.db.insert("users", {});
    const usernameResult = await ctx.runMutation(
      components.authUsername.public.setUsername,
      { userId, username },
    );
    if (!usernameResult.success) {
      throw new Error(`Invalid username: ${usernameResult.userError.error}`);
    }
    const passwordResult = await ctx.runMutation(
      components.authPassword.public._internal_dangerous_setPassword,
      { userId, password, minimumLength: DEFAULT_MIN_PASSWORD_LENGTH },
    );
    if (!passwordResult.success) {
      // Throwing rolls back the user + username writes.
      throw new Error(`Invalid password: ${passwordResult.userError.error}`);
    }
    return userId;
  },
});
