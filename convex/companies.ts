import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { paginationOptsValidator } from "convex/server"


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
            const user = ctx.db
                  .query("users")
                  .withIndex("by_user_id")
                  .filter(q => q.eq(q.field("userId"), Identify.subject))
                  .first();
            if (!user) {
                  throw new Error("User not found");
            }
            return await ctx.db.insert("companies", {
                  ...args,
                  driveType: args.driveType.toLowerCase().replace(/-/g, ""),
                  userId: Identify.subject,
                  remindersSent: 0,
                  lastReminderAt: "",
            })
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
            const user = ctx.db
                  .query("users")
                  .withIndex("by_user_id")
                  .filter(q => q.eq(q.field("userId"), Identify.subject))
                  .first();
            if (!user) {
                  throw new Error("User not found");
            }
            return await ctx.db
                  .patch(args.companyId, {
                        status: args.status,
                        statusDateTime: args.statusDateTime,
                        notes: args.notes,
                  });
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
      const driveType = args.filters.driveType.toLowerCase().replace(/-/g, "");
      query = query.filter((q) => q.eq(q.field("driveType"), driveType));
    }
    
    return await query.order("desc").paginate(args.paginationOpts);
  },
});