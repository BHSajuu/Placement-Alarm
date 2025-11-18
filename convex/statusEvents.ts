import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// This list includes statuses that imply a scheduled event
const FOLLOW_UP_STATUSES = [
  "PPT",
  "OA",
  "GD",
  "Communication",
  "Technical round",
  "Interview",
];

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

export const getEventsForFollowUp = query({
  handler: async (ctx) => {
    const now = new Date();
    // 48 hours from now
    const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000); 

    // Fetch status events that are happening within the next 48 hours,
    // belong to a follow-up-worthy status,
    // and haven't had all 6 reminders sent.
    const upcomingEvents = await ctx.db
      .query("statusEvents")
      // We'll filter in-query since we don't have an index for this.
      // For a larger app, you'd add a `by_eventDate` index.
      .filter(q =>
        q.and(
          // Event date is in the future
          q.gt(q.field("eventDate"), now.toISOString()),
          // And within the next 48 hours
          q.lt(q.field("eventDate"), twoDaysFromNow.toISOString()),
          // Reminder count is less than 6
          q.lt(q.field("followUpRemindersSent"), 6)
        )
      )
      .collect();

    // Filter to only the statuses we care about
    const filteredEvents = upcomingEvents.filter((event) =>
      FOLLOW_UP_STATUSES.includes(event.status)
    );

    // We also need the company name and role for the notification
    const eventsWithCompanyData = await Promise.all(
      filteredEvents.map(async (event) => {
        const company = await ctx.db.get(event.companyId);
        return {
          ...event,
          companyName: company?.name || "a company",
          companyRole: company?.role || "a role",
        };
      })
    );
      
    return eventsWithCompanyData;
  },
});

export const incrementFollowUpReminderCount = mutation({
  args: { 
      statusEventId: v.id("statusEvents")
 },
  handler: async ( ctx, args ) => {
    const event = await ctx.db.get(args.statusEventId);
    if (!event) {
      throw new Error("StatusEvent not found");
    }
    
    await ctx.db.patch(args.statusEventId, {
      followUpRemindersSent: (event.followUpRemindersSent || 0) + 1,
    });
  },
});