import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { paginationOptsValidator } from "convex/server"
import { api } from "./_generated/api";
import { FOLLOW_UP_STATUSES } from "./statusEvents";


// Internal mutation to save the Google Event ID for deadlines
export const setDeadlineGoogleEventId = internalMutation({
  args:{
      companyId: v.id("companies"),
      googleEventId: v.string(),
  },
  handler: async (ctx , args)=>{
     await ctx.db.patch(args.companyId, {
      googleEventId: args.googleEventId,
    });
  }
})
 
export const addCompany = mutation({
      args: {
            name: v.string(),
            role: v.string(),
            package: v.string(),
            driveType: v.string(),
            deadline: v.optional(v.string()),
            type: v.string(),
            link: v.optional(v.string()),
            status: v.optional(v.string()),
      },
     handler: async (ctx, args) => {
            const Identify = await ctx.auth.getUserIdentity();
            if (!Identify) {
                  throw new Error("Unauthorized");
            }
            
            const userId = Identify.subject;
            
            // Insert the company
            const companyId = await ctx.db.insert("companies", {
                  ...args,
                  driveType: args.driveType,
                  userId: userId,
                  remindersSent: 0,
                  lastReminderAt: "",
            });

            // TRIGGER CALENDAR SYNC
            // If a deadline exists, schedule the action to create a Google Calendar event
            if (args.deadline) {
              await ctx.scheduler.runAfter(0, api.calendar.createDeadlineEvent, {
                companyId,
                companyName: args.name,
                role: args.role,
                deadline: args.deadline,
                userId: userId,
              });
            }
            
            return companyId;
      }
})

export const deleteCompany = mutation({
      args: {
            companyId: v.id("companies"),
      },
      handler: async (ctx, args) => {
            const Identify = await ctx.auth.getUserIdentity();
            if (!Identify) {
                  throw new Error("Unauthorized");
            }
            const user = ctx.db
                  .query("users")
                  .withIndex("by_user_id")
                  .filter(q => q.eq(q.field("userId"), Identify.subject))
                  .first();
            if (!user) {
                  throw new Error("User not found");
            }
            
            // Get company first to access googleEventId
            const company = await ctx.db.get(args.companyId);
            if (!company) {
                  return;
            }

            // 1. Delete all Status Events associated with this company
            const statusEvents = await ctx.db
              .query("statusEvents")
              .withIndex("by_companyId_userId", (q) => 
                q.eq("companyId", args.companyId).eq("userId", Identify.subject)
              )
              .collect();

            for (const event of statusEvents) {
              // Delete status event from Google Calendar if it exists
              if (event.googleEventId) {
                  await ctx.scheduler.runAfter(0, api.calendar.deleteEvent, {
                        googleEventId: event.googleEventId,
                        userId: Identify.subject,
                  });
              }
              await ctx.db.delete(event._id);
            }

            // 2. Delete all Documents associated with this company
          const documents = await ctx.db
            .query("documents")
            .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
            .collect();

          for (const doc of documents) {
            // Delete the file from storage
            await ctx.storage.delete(doc.storageId);
            // Delete the document record
            await ctx.db.delete(doc._id);
          }
          
          // 3. Delete Company Deadline from Google Calendar
          if (company.googleEventId) {
              await ctx.scheduler.runAfter(0, api.calendar.deleteEvent, {
                  googleEventId: company.googleEventId,
                  userId: Identify.subject,
              });
          }

          // 4. Finally, delete the Company
          return await ctx.db.delete(args.companyId);
        }
});

export const getAllCompanies = query({
      args: {
            userId: v.string(),
      },
      handler: async (ctx, args) => {
            const Identify = await ctx.auth.getUserIdentity();
            if (!Identify) {
                  throw new Error("Unauthorized");
            }
            const user = ctx.db
                  .query("users")
                  .withIndex("by_user_id")
                  .filter(q => q.eq(q.field("userId"), Identify.subject))
                  .first();
            if (!user) {
                  throw new Error("User not found");
            }
            return await ctx.db
                  .query("companies")
                  .withIndex("by_user_id")
                  .filter(q => q.eq(q.field("userId"), args.userId))
                  .order("desc")
                  .collect();
      },
}) 

export const updateCompanyDetails = mutation({
      args:{
            companyId: v.id("companies"),
            status: v.optional(v.string()),
            statusDateTime: v.optional(v.string()),
            notes: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
            const Identify = await ctx.auth.getUserIdentity();
            if (!Identify) {
                  throw new Error("Unauthorized");
            }
            
            const userId = Identify.subject;

            const user = ctx.db
                  .query("users")
                  .withIndex("by_user_id")
                  .filter(q => q.eq(q.field("userId"), Identify.subject))
                  .first();
            if (!user) {
                  throw new Error("User not found");
            }
            // Get company name for the calendar event
            const company = await ctx.db.get(args.companyId);
            if (!company) throw new Error("Company not found");
            
            // 1. CLEANUP: Delete Calendar Events for the OLD Status
            // A. Check for Deadline Event 
              if (args.status && args.status !== "Not Applied" && company.googleEventId) {
                await ctx.scheduler.runAfter(0, api.calendar.deleteEvent, {
                  googleEventId: company.googleEventId,
                  userId: userId,
                });
                await ctx.db.patch(args.companyId, { googleEventId: undefined });
              }

            // B. Check for Previous Status Event 
            // Find the most recent status event that has a Google Calendar ID
            const previousStatusEvent = await ctx.db
              .query("statusEvents")
              .withIndex("by_companyId_userId", (q) => 
                q.eq("companyId", args.companyId).eq("userId", userId)
              )
              // Filter manually for ones that have a googleEventId
              .filter(q => q.neq(q.field("googleEventId"), undefined))
              .order("desc") // Get the latest one
              .first();

            if (previousStatusEvent && previousStatusEvent.googleEventId) {
              await ctx.scheduler.runAfter(0, api.calendar.deleteEvent, {
                googleEventId: previousStatusEvent.googleEventId,
                userId: userId,
              });
              // Clear the ID so we don't try to delete it again later
              await ctx.db.patch(previousStatusEvent._id, { googleEventId: undefined });
            }


           // 2. UPDATE: Save the new status to the database
            await ctx.db.patch(args.companyId, {
              status: args.status,
            });
                    

            if (args.status) {
              
              const eventDate = args.statusDateTime || new Date().toISOString();

             const statusEventId = await ctx.db.insert("statusEvents", {
                companyId: args.companyId,
                userId: userId,
                status: args.status,
                eventDate: eventDate,       
                notes: args.notes,         
              });

              // 3. CREATE: Add new Calendar Event
              // Only create a calendar event if:
              // 1. A specific date/time was provided
              // 2. The status is "Meaningful" (in our FOLLOW_UP_STATUSES list)
              if (args.statusDateTime && FOLLOW_UP_STATUSES.includes(args.status)) {
                await ctx.scheduler.runAfter(0, api.calendar.createStatusEvent, {
                  statusEventId,
                  companyName: company.name,
                  title: args.status,
                  date: args.statusDateTime,
                  userId: userId,
                });
              }
            }
            return { success: true };
          },
});


export const getApplicationsForReminder = query({
  handler: async (ctx) => {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    // Fetch applications with status "Not Applied" and a deadline within the next 4 hours.
    // We also ensure we don't try to remind for jobs where we've sent all reminders (e.g., 4 reminders).
    const upcomingApps = await ctx.db
      .query("companies")
      .withIndex("by_deadline")
      .filter(q =>
        q.and(
          q.eq(q.field("status"), "Not Applied"),
          q.lt(q.field("remindersSent"), 4), // Stop if 4 reminders are sent
          q.neq(q.field("deadline"), undefined),
          q.gt(q.field("deadline"), now.toISOString()), // Deadline must be in the future
          q.lt(q.field("deadline"), fourHoursFromNow.toISOString()) // And within the next 4 hours
        )
      )
      .collect();
      
    return upcomingApps;
  },
});


export const incrementReminderCount = mutation({
  args: { 
      id: v.id("companies")
 },
  handler: async ( ctx, args ) => {
    // First get the current company data
    const company = await ctx.db.get(args.id);
    if (!company) {
      throw new Error("Company not found");
    }
    
    // Then patch with the incremented value
    await ctx.db.patch(args.id, {
      remindersSent: (company.remindersSent || 0) + 1,
      lastReminderAt: new Date().toISOString(),
    });
  },
});


export const getPaginatedCompanies = query({
  args: {
    userId: v.string(),
    filters: v.object({
      search: v.string(),
      status: v.string(),
      driveType: v.string(),
    }),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const Identify = await ctx.auth.getUserIdentity();
    if (!Identify || Identify.subject !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Use search index if search is provided, otherwise use regular index
    if (args.filters.search) {
      // Search by name and role separately, then combine results
      const nameResults = await ctx.db
        .query("companies")
        .withSearchIndex("by_name", (q) => q.search("name", args.filters.search))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();
      

      const roleResults = await ctx.db
        .query("companies")
        .withSearchIndex("by_role", (q) => q.search("role", args.filters.search))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();
      
      // Combine and deduplicate by _id
      const combined = [...nameResults, ...roleResults];
      const uniqueResults = Array.from(
        new Map(combined.map((item) => [item._id, item])).values()
      );
      
      // Apply additional filters in memory
      let filtered = uniqueResults;
      
      if (args.filters.status !== "all") {
        filtered = filtered.filter((company) => company.status === args.filters.status);
      }
      
      if (args.filters.driveType !== "all") {
        const driveType = args.filters.driveType.toLowerCase().replace(/-/g, "");
        filtered = filtered.filter(
          (company) => company.driveType.toLowerCase().replace(/-/g, "") === driveType
        );
      }
      
      // Sort by creation time (desc) and paginate manually
      filtered.sort((a, b) => b._creationTime - a._creationTime);
      const { numItems, cursor } = args.paginationOpts;
      const start = cursor ? parseInt(cursor, 10) : 0;
      const end = start + numItems;
      const paginatedResults = filtered.slice(start, end);
      const isDone = end >= filtered.length;
      
      return {
        page: paginatedResults,
        continueCursor: isDone ? "" : String(end),
        isDone,
      };
    }
    
    // Regular query with index when no search
    let query = ctx.db
      .query("companies")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    // Apply status filter
    if (args.filters.status !== "all") {
      query = query.filter((q) => q.eq(q.field("status"), args.filters.status));
    }

    // Apply driveType filter
    if (args.filters.driveType !== "all") {
      const driveType = args.filters.driveType; 
      query = query.filter((q) => q.eq(q.field("driveType"), driveType));
    }
    
    return await query.order("desc").paginate(args.paginationOpts);
  },
});

export const addCompanyFromProposal = mutation({
  args: {
    notificationId: v.id("notifications"),
    companyData: v.any(), 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if(!args.companyData || !args.companyData.name || !args.companyData.role ){
      throw new Error("Invalid company data");
    }

    await ctx.db.insert("companies", {
      userId: identity.subject,
      name: args.companyData.name || "Unknown",
      role: args.companyData.role || "Unknown",
      package: args.companyData.package || "TBD",
      driveType: args.companyData.driveType || "On-Campus",
      deadline: args.companyData.deadline || undefined,
      type: args.companyData.type || "FTE",
      link: args.companyData.link || "",
      status: "Not Applied",
      remindersSent: 0,
    });

    // Mark notification as read (or delete it)
    await ctx.db.patch(args.notificationId, { read: true });
  },
});