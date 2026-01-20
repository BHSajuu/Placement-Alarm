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

    // 1. Get Metadata to check type and size
    const meta = await drive.files.get({
      fileId: args.fileId,
      fields: "size, mimeType, name",
      supportsAllDrives: true,
    });

    const isGoogleDoc = meta.data.mimeType?.startsWith("application/vnd.google-apps");
    let fileSize = parseInt(meta.data.size || "0");

    // Google Docs don't have a 'size' until exported, so we skip size check for them initially
    if (!isGoogleDoc && fileSize > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large (Max 10MB). Selected file is ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    }

    let fileBuffer: ArrayBuffer;
    let finalMimeType = args.mimeType;
    let finalFileName = args.fileName;

    // 2. Download or Export based on file type
    if (isGoogleDoc) {
      // Logic: Export Google Docs to Microsoft Word/PDF format
      let exportMimeType = "application/pdf"; // Default fallback
      
      if (meta.data.mimeType === "application/vnd.google-apps.document") {
        exportMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // .docx
        if (!finalFileName.endsWith(".docx")) finalFileName += ".docx";
        finalMimeType = exportMimeType;
      } else if (meta.data.mimeType === "application/vnd.google-apps.spreadsheet") {
        exportMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; // .xlsx
        if (!finalFileName.endsWith(".xlsx")) finalFileName += ".xlsx";
        finalMimeType = exportMimeType;
      } else if (meta.data.mimeType === "application/vnd.google-apps.presentation") {
        exportMimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"; // .pptx
        if (!finalFileName.endsWith(".pptx")) finalFileName += ".pptx";
        finalMimeType = exportMimeType;
      }

      // Use .export() for Google Docs
      const res = await drive.files.export(
        { fileId: args.fileId, mimeType: exportMimeType },
        { responseType: "arraybuffer" }
      );
      fileBuffer = res.data as ArrayBuffer;

    } else {
      // Standard binary download (e.g., uploaded PDF, JPG, real .docx)
      const res = await drive.files.get(
        { fileId: args.fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );
      fileBuffer = res.data as ArrayBuffer;
    }

    // Double check size after export/download
    if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large (Max 10MB).`);
    }

    const blob = new Blob([fileBuffer], { type: finalMimeType });

    // 3. Store in Convex
    const storageId = await ctx.storage.store(blob);

    // 4. Save metadata
    await ctx.runMutation(internal.documents.createDocumentRecord, {
      userId,
      storageId,
      documentName: finalFileName,
      fileType: finalMimeType,
      fileSize: fileBuffer.byteLength,
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