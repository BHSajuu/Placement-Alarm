import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { sendEmail } from "../../../../../../lib/notifications";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Fetch user's preferred contact methods from profile
async function fetchUserContact(userId: string) {
  try {
    const profile = await convex.query(api.profiles.getProfileForReminder, { userId });
    return {
      email: profile?.email || null,
    };
  } catch (error) {
    console.error(`Error fetching user contact for ${userId}:`, error);
    return { email: null, whatsapp: null };
  }
}

// Disable caching for this route
export const revalidate = 0;

export async function GET(_request: Request) {
  try {
    const now = new Date();
    // Fetch all applications that are due within the next 4 hours
    const upcomingApps = await convex.query(api.companies.getApplicationsForReminder);

    if (!upcomingApps || upcomingApps.length === 0) {
      return NextResponse.json({ message: "No applications due for reminders." });
    }

    let remindersSentCount = 0;

    for (const app of upcomingApps) {
      const { _id, name, role, deadline, remindersSent, userId } = app;

      if (!deadline) continue;

      const deadlineDate = new Date(deadline);
      const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Define the reminder thresholds in hours
      const reminderThresholds = [4, 3, 2, 1];
      const reminderIndex = (remindersSent || 0);

      // Check if the current time has passed the next reminder threshold
      if (reminderIndex < reminderThresholds.length && hoursUntilDeadline <= reminderThresholds[reminderIndex]) {

        const when = deadlineDate.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const subject = `Reminder #${reminderIndex + 1}: ${role} at ${name}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Application Deadline Reminder</h2>
              <p>Hi there!</p>
              <p>This is a friendly reminder that your application for <strong>${role}</strong> at <strong>${name}</strong> is due on:</p>
              <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1F2937;">${when}</p>
              </div>
              <p>Don't forget to submit your application before the deadline!</p>
              <p>Best of luck with your application!</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #6B7280;">This is an automated reminder from Placement Alarm.</p>
            </div>
        `;

        const user = await fetchUserContact(userId);

        if (user.email) {
          await sendEmail(user.email, subject, html).catch(err => console.error(`Failed to send email to ${user.email}:`, err));
        }

        // IMPORTANT: Increment reminder count after sending
        await convex.mutation(api.companies.incrementReminderCount, { id: _id });
        remindersSentCount++;
      }
    }

    return NextResponse.json({ sent: remindersSentCount, checked: upcomingApps.length });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
