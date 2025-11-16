import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getStatusEventsForCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    // Find all status events for this company that belong to the user
    // Order by the eventDate ascending to show a proper timeline
    return await ctx.db
      .query("statusEvents")
      .withIndex("by_companyId_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .order("asc") 
      .collect();
  },
});


export const deleteStatusEvent = mutation({
  args: {
    statusEventId: v.id("statusEvents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    // 1. Get the status event document
    const statusEvent = await ctx.db.get(args.statusEventId);

    if (!statusEvent) {
      throw new Error("Status event not found");
    }

    // 2. Security Check: Make sure the user deleting it is the one who owns it
    if (statusEvent.userId !== userId) {
      throw new Error("You are not authorized to delete this event");
    }

    // 3. Delete the event
    await ctx.db.delete(args.statusEventId);

    return { success: true };
  },
});