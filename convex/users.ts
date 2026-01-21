import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query} from "./_generated/server";


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


export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    // 1. Check if authenticated
    if (!identity) {
      return null;
    }

    // 2. Security: Ensure user is only fetching their own data
    if (identity.subject !== args.userId) {
      throw new Error("Unauthorized request");
    }

    // 3. Fetch user data (includes parsingConfig)
    return await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// 1. Internal Mutation to Save/Update Credentials (called by googleAuth action)
export const saveParsingCredentials = internalMutation({
  args: { 
    userId: v.string(), 
    email: v.string(), 
    refreshToken: v.string() 
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      parsingConfig: {
        email: args.email,
        refreshToken: args.refreshToken,
        isActive: true,
        lastSyncedAt: new Date().toISOString(),
      },
    });
  },
});

// 2. Public Mutation to disconnect (called by Frontend)
export const disconnectParsing = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
      
    if (user) {
      await ctx.db.patch(user._id, { parsingConfig: undefined });
    }
  }
});