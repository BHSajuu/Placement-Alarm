import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const upsertProfile = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingProfile) {
      // Update existing profile
      return await ctx.db.patch(existingProfile._id, {
        name: args.name,
        email: args.email,
        profileImage: args.profileImage,
      });
    } else {
      // Create new profile
      return await ctx.db.insert("profiles", args);
    }
  },
});


export const getUserProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("profiles")
      .withIndex("by_user_id")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
  },
});



export const getProfileForReminder = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user_id")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
  },
});


export const updateProfileImage = mutation({
   args:{
    userId: v.string(),
    profileImage: v.string(),
   },
   handler: async (ctx, args) => {
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) {
       throw new Error("Unauthorized");
     }

     const profile = await ctx.db
       .query("profiles")
       .withIndex("by_user_id")
       .filter(q => q.eq(q.field("userId"), args.userId))
       .first();

     if (!profile) {
       throw new Error("Profile not found");
     }

     return await ctx.db.patch(profile._id, {
       profileImage: args.profileImage,
     });
   },
})
