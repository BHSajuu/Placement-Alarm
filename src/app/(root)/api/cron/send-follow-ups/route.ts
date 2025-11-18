import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { NextResponse } from "next/server";
import { sendEmail } from "../../../../../../lib/notifications";



const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Fetch user's preferred contact methods from profile
async function fetchUserContact(userId: string) {
  try {
    // Using the internal query since we don't need auth for a server-to-server call
    const profile = await convex.query(api.profiles.getProfileForReminder, { userId });
    return {
      email: profile?.email || null,
    };
  } catch (error) {
    console.error(`Error fetching user contact for ${userId}:`, error);
    return { email: null };
  }
}


export const revalidate = 0; // Disable caching

export async function GET(_request: Request) {
  try {
    const now = new Date();
    // 1. Fetch all events due within the next 48 hours
    const upcomingEvents = await convex.query(api.statusEvents.getEventsForFollowUp);

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return NextResponse.json({ message: "No events due for follow-up reminders." });
    }

    let remindersSentCount = 0;

    for (const event of upcomingEvents) {
      const { _id, userId, status, eventDate, companyName, companyRole, followUpRemindersSent } = event;

      const eventDateObj = new Date(eventDate);
      const hoursUntilEvent = (eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Define the reminder thresholds in hours (48h, 40h, 30h, 20h, 15h, 8h)
      const reminderThresholds = [48, 40, 30, 20, 15, 8];
      const reminderIndex = (followUpRemindersSent || 0);

      // Check if the current time has passed the next reminder threshold
      if (reminderIndex < reminderThresholds.length && hoursUntilEvent <= reminderThresholds[reminderIndex]) {
        
        const when = eventDateObj.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata", // Or user's timezone if you store it
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const subject = `Follow-up Reminder #${reminderIndex + 1}: ${status} for ${companyRole} at ${companyName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6D28D9;">Upcoming Event Reminder</h2>
              <p>Hi there!</p>
              <p>This is a follow-up reminder for your <strong>${status}</strong> for the <strong>${companyRole}</strong> role at <strong>${companyName}</strong>.</p>
              <p>Your event is scheduled for:</p>
              <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1F2937;">${when}</p>
              </div>
              <p>Good luck!</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #6B7280;">This is an automated reminder from Placement Alarm.</p>
            </div>
        `;

        // 2. Fetch user contact info
        const user = await fetchUserContact(userId);

        // 3. Send Email
        if (user.email) {
          await sendEmail(user.email, subject, html).catch(err => console.error(`Failed to send email to ${user.email}:`, err));
        }

        // 4. Send In-App Notification
        const message = `Reminder: Your ${status} for ${companyRole} at ${companyName} is at ${when}.`;
        // We use the internal action to bypass auth
        await convex.action(api.push.sendPush, {
            userId,
            message,
            link: "/",
       });

        // 5. Increment reminder count
        await convex.mutation(api.statusEvents.incrementFollowUpReminderCount, { statusEventId: _id });

        remindersSentCount++;
      }
    }

    return NextResponse.json({ sent: remindersSentCount, checked: upcomingEvents.length });
  } catch (error) {
    console.error("Error in follow-up cron job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}