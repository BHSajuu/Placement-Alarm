# Placement Alarm

![Placement Alarm Logo](/public/placement.png)

A platform to help students track and manage their placement process effectively.

## ✨ Features

* **Dashboard:** Get a quick overview of your application stats, including total applications, active interviews, offers, and rejections.
* **Company Directory:** A centralized place to manage all your job applications.
* **Add and Track Applications:** Easily add new company applications with details like role, package, deadline, and application link.
* **Smart Deadline Reminders:** Receive automated reminders for upcoming application deadlines via WhatsApp and Email.
* **User Authentication:** Secure user authentication powered by Clerk.
* **Profile Management:** Manage your profile information, including your name, email, and WhatsApp number for notifications.

## 🚀 Technologies Used

* **Framework:** Next.js
* **Database:** Convex
* **Authentication:** Clerk
* **Styling:** Tailwind CSS, shadcn/ui
* **Notifications:** Twilio (for WhatsApp), Nodemailer (for Email)
* **Deployment:** Vercel

## 📈 Future Improvements

* **Profile Page Performance:** Optimize the loading time of the profile page by converting user images to URLs using a third-party API and storing the URL in the database.
* **Pagination:** Implement pagination for the company list on the dashboard to improve performance with a large number of applications.
* **Independent Field Updates:** Enhance the status update modal to allow independent updating of each field without affecting others.
* **Notification Timing:** Adjust the notification timing to send reminders at 60-minute intervals.


