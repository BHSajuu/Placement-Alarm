import { v } from "convex/values";
import {internalMutation, mutation, query } from "./_generated/server";


export const createNotification = mutation({
  args: {
    userId: v.string(),
    message: v.string(),
    link: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      message: args.message,
      link: args.link,
      read: false,
    });
  },
});



export const getUnreadNotifications = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; 
    }
    const userId = identity.subject;

    return await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .order("desc") 
      .collect();
  },
});


export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    // Check if the notification belongs to the user
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("You are not authorized to update this notification");
    }

    // Mark as read
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read for the current user
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    // Get all unread notifications
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    // Patch them all
    await Promise.all(
      unread.map((notification) => {
        return ctx.db.patch(notification._id, { read: true });
      })
    );
  },
});