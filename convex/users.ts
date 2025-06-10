import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getUserFromCtx } from "./utils/getUserFromCtx";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const store = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      if (identity?.name && user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      name: identity?.name ?? "Anonymous",
      tokenIdentifier: identity?.tokenIdentifier,
      email: identity?.email ?? "",
      imageUrl: identity?.pictureUrl,
    });
  },
});

export const getCurrentUserInternal = internalQuery({
  handler: getUserFromCtx,
});  

export const getCurrentUser = query({ 
  handler: getUserFromCtx,
});

export const searchUsers = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {

    const currentUser: Doc<"users"> = await ctx.runQuery(
      internal.users.getCurrentUserInternal
    );

    //Dont search if the query is too short
    if(args.query.length < 2){
      return [];
    }

    const searchedByUsername = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .collect();
    
      
      const searchByEmail = await ctx.db
      .query("users")
      .withSearchIndex("search_email", (q) => q.search("email", args.query))
      .collect();
      

    //Combining results and returning Users
    const users = [
      ...searchedByUsername,
      ...searchByEmail.filter((u) =>
        !searchedByUsername.some((user) => user._id === u._id)
      ),
    ];


    return users
      .filter((u) => u._id !== currentUser._id)
      .map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        imageUrl: u.imageUrl,
      }));
  },
});
