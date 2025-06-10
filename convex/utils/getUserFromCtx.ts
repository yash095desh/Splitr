import { MutationCtx, QueryCtx } from "../_generated/server";

export async function getUserFromCtx(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not Authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!user) throw new Error("User not found");

  return user;
}
