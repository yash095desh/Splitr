import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

type UserGroup = {
     _id: Id<"groups">,
    name: string,
    description: string,
    memberCount: number,
    type: string,
}

export const getAllContacts = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUserInternal);

    const expensesYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    const expensesNotPaidByYou = (
      await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect()
    ).filter(
      (e) =>
        e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id)
    );

    const personalExpenses = [...expensesYouPaid, ...expensesNotPaidByYou];

    const contactIds = new Set();
    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== currentUser._id) {
        contactIds.add(exp.paidByUserId);
      }

      exp.splits.forEach((u) => {
        if (u.userId !== currentUser._id) contactIds.add(u.userId);
      });
    });

    const contactUsers = await Promise.all(
      ([...contactIds] as Id<"users">[]).map(async (id) => {
        const user = await ctx.db.get(id);
        return user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              imageUrl: user.imageUrl,
              type: "user", //Added Type Marker to distinguish from groups
            }
          : undefined;
      })
    );

    const userGroups : UserGroup[] = (await ctx.db.query("groups").collect())
      .filter((g) => g.members.some((s) => s.userId === currentUser._id))
      .map((g) => ({
        _id: g._id,
        name: g.name,
        description: g.description,
        memberCount: g.members.length,
        type: "group",
      }));

      contactUsers.sort((a,b)=> (a?.name || "").localeCompare(b?.name || ""))
      userGroups.sort((a,b)=> (a?.name || "").localeCompare(b?.name || ""))

      return {
        users : contactUsers.filter(Boolean),
        groups: userGroups
      }
  },
});

export const createGroup = mutation({
    args:{
        name: v.string(),
        description: v.string(),
        members: v.array(v.id("users"))
    },
    handler: async (ctx,{name, description, members}) =>{

         const currentUser:Doc<"users"> = await ctx.runQuery(internal.users.getCurrentUserInternal);

         if(!name.trim()) throw new Error("Group name cannot be empty");

         const uniqueMembers = new Set(members);

         uniqueMembers.add(currentUser._id);

         for(const id of uniqueMembers){
            if(!(await ctx.db.get(id))){
                throw new Error(`User with ID ${id} not found`)
            }
         }

         return await ctx.db.insert("groups",{
            name: name.trim(),
            description: description?.trim() ?? "",
            createdBy: currentUser._id,
            members: ([...uniqueMembers]as Id<"users">[]).map((id)=>({
                userId: id,
                role: id === currentUser._id ? "admin" : "member",
                joinedAt: Date.now()
            }))
         })
    }
});