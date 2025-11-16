# Placement Alarm

![Placement Alarm Logo](/public/placement.png)

A platform to help students track and manage their placement process effectively.

## ✨ Features

* **Dashboard:** Get a quick overview of your application stats, including total applications, active interviews, offers, and rejections.
* **Company Directory:** A centralized place to manage all your job applications.
* **Add and Track Applications:** Easily add new company applications with details like role, package, deadline, and application link.
* **Smart Deadline Reminders:** Receive automated reminders for upcoming application deadlines via Email.
* **User Authentication:** Secure user authentication powered by Clerk.
* **Profile Management:** Manage your profile information, including your name, and email for notifications.

## 🚀 Technologies Used

* **Framework:** Next.js
* **Database:** Convex
* **Authentication:** Clerk
* **Styling:** Tailwind CSS, shadcn/ui
* **Notifications:**  Nodemailer (for Email)
* **Deployment:** Vercel

## 📈 Future Improvements

## 1. Advanced Status Tracking & Timeline

**Core Idea:** Allow users to track the *history* of an application, not just its current status.

**How to Implement:**
* **New Database Table:** Create a new table named `statusEvents`.
* **Schema Fields:**
    * `companyId`: (links to the `companies` table)
    * `status`: (string, e.g., "Applied", "OA", "Interview Round 1", "Offer")
    * `eventDate`: (string, ISO timestamp)
    * `notes`: (optional string, for details like "Interview with John Doe. Topics: System Design, React Hooks.")
* **Frontend Changes:**
    * When a user updates a status in the `status-update-modal.tsx`, if the new status is "Interview", "Technical round", "Offer", etc., show the "Notes" and "Date" fields.
    * When the user saves, it triggers a new `addStatusEvent` mutation in addition to the `updateCompanyDetails` mutation.
    * Create a "View Timeline" button or tab in the `company-table.tsx` row (or in a company details page) that opens a modal showing a chronological list of all `statusEvents` for that company.

**Benefit:** The user gets a complete, detailed history of their application process for each company, which is invaluable for reviewing what happened.

---

## 2. Contact & Referral Management

**Core Idea:** Help users track the *people* involved in their job hunt (referrers, recruiters, contacts) and link them to applications.

**How to Implement:**
* **New Database Table:** Create a new table named `contacts`.
* **Schema Fields:**
    * `userId`: (links to the user)
    * `name`: (string)
    * `email`: (optional string)
    * `company`: (optional string)
    * `role`: (optional string, e.g., "Recruiter", "Friend", "Manager")
    * `notes`: (optional string, e.g., "Met at career fair")
* **Frontend Changes:**
    * Create a new page (e.g., `/contacts`) where users can add/edit/delete contacts.
    * In `add-company-modal.tsx`, add a new optional dropdown field: "Referred by" or "Contact".
    * This dropdown should be populated by the user's list of `contacts`.
    * Store the selected `contactId` on the `companies` table (requires a new optional `contactId` field in the `companies` schema).

**Benefit:** The user can track who referred them to which job, see which contacts are most helpful, and keep a centralized list of their professional network.

---

## 3. Personalized Analytics Dashboard

**Core Idea:** Use the user's existing application data to provide them with "smart" insights beyond the simple stats on the dashboard.

**How to Implement:**
* **No Schema Change Needed:** This feature uses existing data from the `companies` table.
* **Frontend Changes:**
    * Create a new page (e.g., `/analytics`).
    * On this page, use `useQuery` to get *all* companies (using `api.companies.getAllCompanies`).
    * Perform calculations in the frontend to generate new stats.
* **Example Stats to Show:**
    * **Conversion Funnel:**
        * Applications to OA ratio: `(companies.filter(c => c.status === 'OA').length / companies.length) * 100`
        * Applications to Interview ratio: `(companies.filter(c => c.status === 'Interview').length / companies.length) * 100`
    * **Success by Type:**
        * Pie chart showing status breakdown (Applied, Interview, Offer, Rejected).
        * Bar chart comparing "On-Campus" vs. "Off-Campus" application success rates.
    * **Activity Heatmap:** A chart showing applications by month.

**Benefit:** The user gets personalized, actionable feedback on their job search strategy (e.g., "My On-Campus applications are 3x more likely to get an interview").

---

## 4. In-App Notification Center

**Core Idea:** Add a notification bell icon in the app for a richer, more engaging reminder system, supplementing the existing email alerts.

**How to Implement:**
* **New Database Table:** Create a new table named `notifications`.
* **Schema Fields:**
    * `userId`: (links to the user)
    * `message`: (string, e.g., "Your application for Google is due in 4 hours.")
    * `read`: (boolean, default `false`)
    * `link`: (optional string, e.g., `/` to go to the dashboard)
* **Backend Changes:**
    * Update the cron job in `api/cron/send-reminders/route.ts`. In addition to sending an email, it should also trigger a `createNotification` mutation to add a new entry to the `notifications` table.
* **Frontend Changes:**
    * Add a `Bell` icon to `dashboard-header.tsx`.
    * When clicked, it queries `api.notifications.getUnread` and shows a dropdown list.
    * Clicking a notification marks it as `read` (via a `markAsRead` mutation) and navigates to the `link`.

**Benefit:** Users are more likely to see timely reminders, and it makes the app feel more alive and interactive. This also opens the door for other "smart" notifications, like "You've been in the 'Applied' stage for 7 days. Time to follow up?"


