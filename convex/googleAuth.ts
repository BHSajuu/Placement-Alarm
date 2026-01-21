"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { google } from "googleapis";
import { internal } from "./_generated/api";

// Helper to create the OAuth2 client
const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_PARSING_CLIENT_ID,
    process.env.GOOGLE_PARSING_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/profile` 
  );
};

// 1. Generate the Google Login URL
export const getAuthUrl = action({
  args: {},
  handler: async () => {
    const oauth2Client = createOAuthClient();
    
    const scopes = [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email"
    ];

    return oauth2Client.generateAuthUrl({
      access_type: "offline", 
      scope: scopes,
      prompt: "consent", 
    });
  },
});

// 2. Exchange Code for Token and Save
export const exchangeCodeAndSave = action({
  args: { code: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const oauth2Client = createOAuthClient();
    
    try {
      const { tokens } = await oauth2Client.getToken(args.code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email;

      if (!tokens.refresh_token || !email) {
        throw new Error("Failed to retrieve refresh token or email.");
      }

      // UPDATED: Calls the mutation in 'users.ts' instead of 'googleAuth.ts'
      await ctx.runMutation(internal.users.saveParsingCredentials, {
        userId: args.userId,
        email: email,
        refreshToken: tokens.refresh_token,
      });

      return { success: true, email };
    } catch (error) {
      console.error("Auth Error:", error);
      throw new Error("Failed to link Google account");
    }
  },
});