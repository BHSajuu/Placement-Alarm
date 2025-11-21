"use node";

import { google } from "googleapis";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

async function getGoogleCalendarClient(userId: string) {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if(!clerkSecretKey){
            throw new Error("Clerk secret key is not defined in environment variables");
      }

      // 1. Fetch the Google OAuth Token from Clerk
      // Note: "oauth_google" is the standard provider ID in Clerk for Google
      const res = await fetch(
            `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_google`,
            {
                  headers: { Authorization: `Bearer ${clerkSecretKey}`},
            }
      );
      if(!res.ok){
          console.error("Failed to fetch Clerk token", await res.text());
          return null;
      }
      const data = await res.json();
      // Clerk returns an array of tokens. We take the first valid one.
      const tokenData = data[0];

      if (!tokenData || !tokenData.token) {
            console.log("No Google OAuth token found for user");
            return null;
      }

      // 2. Setup Google Client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: tokenData.token });

      return google.calendar({ version: "v3", auth: oauth2Client });
}

// ACTION: Sync the main Company Deadline
export const createDeadlineEvent = action({
      args:{
            companyId: v.id("companies"),
            companyName: v.string(),
            role: v.string(),
            deadline: v.string(), 
            userId: v.string(),
      },
      handler: async (ctx , args)=>{
         const  calendar = await getGoogleCalendarClient(args.userId);
         if(!calendar){
            console.log("Google Calendar client not available");
            return;
         }

         const event = {
            summary: `Deadline: ${args.role} @ ${args.companyName}`,
            description: `Application deadline for ${args.role} at ${args.companyName}. Managed by Placement Alarm.`,
            start: {
            dateTime: new Date(args.deadline).toISOString(),
            },
            end: {
            // Set event to last 1 hour by default
            dateTime: new Date(new Date(args.deadline).getTime() + 60 * 60 * 1000).toISOString(),
            },
         };

        try {
           const res = await calendar.events.insert({
                 calendarId: "primary",
                 requestBody: event,
           });
           // Save the Google Event ID back to Convex so we can update it later if needed
          if (res.data.id) {
                 await ctx.runMutation((internal as any).companies.setDeadlineGoogleEventId, {
                 companyId: args.companyId,
                 googleEventId: res.data.id,
                 });
             }
           } catch (error) {
                console.error("Error creating Google Calendar event:", error);
           }
      }
});

// ACTION: Sync Status Events (Interviews, OA, etc.)
export const createStatusEvent = action({
  args: {
    statusEventId: v.id("statusEvents"),
    companyName: v.string(),
    title: v.string(), // e.g. "Interview" or "OA"
    date: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const calendar = await getGoogleCalendarClient(args.userId);
    if (!calendar) return;

    const event = {
      summary: `${args.title}: ${args.companyName}`,
      description: `Scheduled ${args.title} for ${args.companyName}.`,
      start: {
        dateTime: new Date(args.date).toISOString(),
      },
      end: {
        dateTime: new Date(new Date(args.date).getTime() + 60 * 60 * 1000).toISOString(),
      },
    };

    try {
      const res = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      if (res.data.id) {
        await ctx.runMutation((internal as any).statusEvents.setEventGoogleId, {
          statusEventId: args.statusEventId,
          googleEventId: res.data.id,
        });
      }
    } catch (error) {
      console.error("Error creating status event:", error);
    }
  },
});

// ACTION: Delete an event from Google Calendar
export const deleteEvent = action({
  args: {
    googleEventId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const calendar = await getGoogleCalendarClient(args.userId);
    if (!calendar) return;

    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: args.googleEventId,
      });
      console.log(`Deleted Google Calendar event: ${args.googleEventId}`);
    } catch (error) {
      // It's possible the user already deleted it manually, so we just log it.
      console.error("Error deleting Google Calendar event:", error);
    }
  },
});