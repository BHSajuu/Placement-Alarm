"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { google } from "googleapis";
import { parseCompanyEmail } from "../src/lib/gemini";

// Helper to get Gmail Client 
async function getGmailClient(userId: string) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) return null;

  const res = await fetch(
    `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_google`,
    { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const tokenData = data[0];

  if (!tokenData?.token) return null;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: tokenData.token });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

function getBody(payload: any) {
  let body = '';
  if (payload.parts) {
    payload.parts.forEach((part: any) => {
      if (part.mimeType === 'text/plain') {
        body += part.body.data ? Buffer.from(part.body.data, 'base64').toString() : '';
      } else if (part.mimeType === 'multipart/alternative') {
        body += getBody(part);
      }
    });
  } else if (payload.body && payload.body.data) {
    body = Buffer.from(payload.body.data, 'base64').toString();
  }
  return body || payload.snippet; // Fallback to snippet if all else fails
}

function isValidPlacementEmail(subject: string, body: string): boolean {
  // 1. Subject Validation
  // Regex looks for "||" followed by whitespace and one of the valid types
  // Matches: "Google || FTE", "Amazon || 6M+PPO", etc.
  const subjectPattern = /\|\|\s*(\s*FTE|\s*6M\s*\+\s*PPO|\s*6M\s*\+\s*FTE|\s*Full-Time\s*Employment\s*\(FTE\)|\s*Intern\s*\+\s*FTE|\s*Intern\s*\+\s*PPO|\s*Intern|\s*Internship)/i;  
  if (!subjectPattern.test(subject)) {
    return false;
  }

  return true;
}

// helper: get the type part from subject like "OneBanc || 6M + PPO"
function extractTypeFromSubject(subject: string): string {
  if (!subject) return '';
  const parts = subject.split('||').map(p => p.trim()).filter(Boolean);
  // if email subject is "Company || type" -> return second part
  if (parts.length >= 2) return parts[1];
  // otherwise try to match patterns like "6M + PPO" anywhere in subject
  const match = subject.match(/\|\|\s*(\s*FTE|\s*6M\s*\+\s*PPO|\s*6M\s*\+\s*FTE|\s*Full-Time\s*Employment\s*\(FTE\)|\s*Intern\s*\+\s*FTE|\s*Intern\s*\+\s*PPO|\s*Intern|\s*Internship)/i);
  return match ? match[0].replace(/\s*\+\s*/g, ' + ').trim() : '';
}

// helper: normalize tiny spacing differences (optional)
function normalizeTypeString(s: string): string {
  return (s || '').replace(/\s*\+\s*/g, ' + ').replace(/\s+/g, ' ').trim();
}

export const checkEmailsAndSync = action({
  args: {},
  handler: async (ctx) => {

    const users = await ctx.runQuery(internal.users.getAllUsersInternal);

    for (const user of users) {
      const gmail = await getGmailClient(user.userId);
      if (!gmail) continue;

      try {
        //  Search for unread emails from the college domain
        const res = await gmail.users.messages.list({
          userId: "me",
          q: "from:*.nits.ac.in is:unread", // Filter by domain and unread status
          maxResults: 5, // Process a few at a time to stay in free limits
        });

        const messages = res.data.messages;
        if (!messages || messages.length === 0) continue;

        for (const msg of messages) {
          if(!msg.id) continue;

          // Fetch full email content
          const email = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "full",
          });

          const subjectHeader = email.data.payload?.headers?.find(h => h.name === "Subject");
          const subject = subjectHeader?.value || "New Placement Email";
          
          // Extract Body 
           const body = getBody(email.data.payload);

           // FILTER CHECK
            if (!isValidPlacementEmail(subject, body)) {
              console.log(`Skipping invalid email: ${subject}`);
              // Mark as read so we don't fetch it again endlessly
              await gmail.users.messages.modify({
                userId: "me",
                id: msg.id,
                requestBody: { removeLabelIds: ["UNREAD"] },
              });
              continue; 
            }
            
           console.log(`Processing email: ${subject}`);

          // AI Parse
          const extractedData = await parseCompanyEmail(subject, body);
          
          // Extract type from subject and normalize it
          const extractedType = extractTypeFromSubject(subject);
          if (extractedData) {
            extractedData.type = normalizeTypeString(extractedType);
          }
          

          if (extractedData) {
            // Create Notification Proposal
            await ctx.runMutation(internal.notifications.createProposalNotification, {
              userId: user.userId,
              emailId: msg.id,
              companyData: JSON.stringify(extractedData),
              message: `New Opportunity detected: ${extractedData.name} \n Role: ${extractedData.role} \n CTC: ${extractedData.package} \n Eligible Branches: ${extractedData["eligible-branch"]} \n Eligibility Criteria: ${extractedData["eligibility-criteria"]}`,
            });

            // Mark email as read so we don't process it again
            await gmail.users.messages.modify({
              userId: "me",
              id: msg.id,
              requestBody: { removeLabelIds: ["UNREAD"] },
            });
          }else {
              console.log("Failed to extract data from email:", subject);
          }
        }
      } catch (error) {
        console.error(`Error syncing gmail for ${user.userId}:`, error);
      }
    }
  },
});