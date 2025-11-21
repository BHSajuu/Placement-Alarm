import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { paginationOptsValidator } from "convex/server"
import { api } from "./_generated/api";


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
            return await ctx.db.delete(args.companyId);
      }
})

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

            // Patch the main company record with the latest status
            await ctx.db
                  .patch(args.companyId, {
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
              // TRIGGER CALENDAR SYNC
              // Only sync if specific date provided and it's a significant status
              if(args.statusDateTime){
                await ctx.scheduler.runAfter(0, api.calendar.createStatusEvent,{
                  statusEventId,
                  companyName: company.name,
                  title: args.status,
                  date: args.statusDateTime,
                  userId: userId,
                });
              }
            }
            return {success: true};
      },
})


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