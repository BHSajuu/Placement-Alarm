import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";


export const upsertProfile = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
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
      });
    } else {
      // Create new profile
      return await ctx.db.insert("profiles", {
        userId: args.userId,
        name: args.name,
        email: args.email,
      });
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

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (!profile) {
      return null;
    }


    let imageUrl: string | null = null; 

    if (profile.profileImageStorageId) {
      imageUrl = await ctx.storage.getUrl(profile.profileImageStorageId);
    } else if (profile.clerkImageUrl) {
      imageUrl = profile.clerkImageUrl;
    }
    
    return {
      ...profile,
      imageUrl: imageUrl, 
    };
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
    storageId: v.id("_storage"),
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
       profileImageStorageId: args.storageId, 
     });
   },
})

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
