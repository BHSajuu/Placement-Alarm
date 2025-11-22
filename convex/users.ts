import { v } from "convex/values";
import { internalQuery, mutation} from "./_generated/server";


export const syncUser = mutation({
      args: {
            userId: v.string(),
            email: v.string(),
            name: v.string(),
            profileImage: v.optional(v.string()),
      },
     handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!existingUser) {
      await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
      });
    }

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingProfile) {
      await ctx.db.insert("profiles", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        clerkImageUrl: args.profileImage, 
        profileImageStorageId: undefined, 
      });
    }
  },
});


export const getAllUsersInternal = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
