"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { google } from "googleapis";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; 

async function getGoogleDriveClient(userId: string) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) throw new Error("CLERK_SECRET_KEY missing");

  const response = await fetch(
    `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_google`,
    { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
  );

  if (!response.ok) return null;
  const data = await response.json();
  const tokenData = data[0];

  if (!tokenData?.token) return null;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: tokenData.token });

  return google.drive({ version: "v3", auth: oauth2Client });
}

export const saveGoogleDriveFile = action({
  args: {
    fileId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const drive = await getGoogleDriveClient(userId);
    if (!drive) throw new Error("Could not authenticate with Google Drive");

    // 1. Check file size (Add supportsAllDrives to fix 404 on some files)
    const meta = await drive.files.get({
      fileId: args.fileId,
      fields: "size, mimeType",
      supportsAllDrives: true, // <--- ADD THIS
    });

    const fileSize = parseInt(meta.data.size || "0");
    
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large (Max 10MB). Selected file is ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // 2. Download the file content
    const res = await drive.files.get(
      { 
        fileId: args.fileId, 
        alt: "media"
      },
      { responseType: "arraybuffer" }
    );

    const fileBuffer = res.data as ArrayBuffer;
    const blob = new Blob([fileBuffer], { type: args.mimeType });

    // 3. Store in Convex
    const storageId = await ctx.storage.store(blob);

    // 4. Save metadata
    await ctx.runMutation(internal.documents.createDocumentRecord, {
      userId,
      storageId,
      documentName: args.fileName,
      fileType: args.mimeType,
      fileSize: fileSize,
      companyId: args.companyId,
    });

    return { success: true };
  },
});


export const getViewerToken = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) return null;

    try {
      const response = await fetch(
        `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_google`,
        { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
      );

      if (!response.ok) return null;
      const data = await response.json();
      
      // Return the token string to the client
      return data[0]?.token || null;
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  },
});