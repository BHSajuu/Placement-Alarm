import { v } from "convex/values"
import { query } from "./_generated/server"

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
      .order("asc") // Order by date ascending
      .collect();
  },
});