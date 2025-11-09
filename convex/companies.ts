import { v } from "convex/values"
import { mutation, query } from "./_generated/server"


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