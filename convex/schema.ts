import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
      users: defineTable({
            userId: v.string(), 
            email: v.string(),
            name: v.string(),
      }).index("by_user_id", ["userId"]),

      companies: defineTable({
            name: v.string(),
            role: v.string(),
            package: v.string(),
            driveType: v.string(),
            deadline: v.optional(v.string()),
            type: v.string(),
            link: v.optional(v.string()),
            status: v.optional(v.string()),
            statusDateTime: v.optional(v.string()),
            notes: v.optional(v.string()), 
            userId: v.string(),
            remindersSent: v.optional(v.number()),
            lastReminderAt: v.optional(v.string()),
      }).index("by_user_id", ["userId"])
        .index("by_deadline", ["deadline"])
        .searchIndex("by_name", {
            searchField: "name"
        })
        .searchIndex("by_role", {
            searchField: "role"
        }),

      profiles: defineTable({
            userId: v.string(),
            name: v.string(),
            email: v.string(),
            clerkImageUrl: v.optional(v.string()), // For the original Clerk image
            profileImageStorageId: v.optional(v.id("_storage")),
      }).index("by_user_id", ["userId"]),

})