import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export const generateUploadUrl = mutation(async (ctx) =>{
      return await ctx.storage.generateUploadUrl();
})

export const saveDocument = mutation({
      args:{
          storageId: v.id("_storage"),
          documentName: v.string(),
          fileType: v.string(),
          fileSize: v.number(),
          companyId: v.optional(v.id("companies")),
      },
      handler: async(ctx, args )=>{
          const identity = await ctx.auth.getUserIdentity();
          if(!identity){
            throw new Error("Unauthorized");
          }
          const userId = identity.subject;

     // SERVER-SIDE VALIDATION
          const metadata = await ctx.storage.getMetadata(args.storageId);

          if (!metadata) {
            throw new Error("File metadata not found, upload may have failed.");
          }

          // 1. Validate File Type
          // First check if contentType exists, then check if it's in the allowed list.
          if (!metadata.contentType || !ALLOWED_FILE_TYPES.includes(metadata.contentType)) {
            // If invalid (either no content type or not an allowed one), delete the file.
            await ctx.storage.delete(args.storageId);
            throw new Error(`Invalid or missing file type. Only PDF and DOCX are allowed. Got: ${metadata.contentType}`);
          }

          // 2. Validate File Size
          if (metadata.size > MAX_FILE_SIZE_BYTES) {
            // If invalid, delete the file from storage
            await ctx.storage.delete(args.storageId);
            throw new Error(`File is too large. Max size: 5MB. Got ${metadata.size} bytes`);
          }

          await ctx.db.insert("documents",{
            userId,
            storageId: args.storageId,
            documentName: args.documentName,
            fileType: metadata.contentType, 
            fileSize: metadata.size,        
            companyId: args.companyId,
          })
      }
})

export const getCompanyDocuments = query({
  args: { 
    companyId: v.id("companies") 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("userId"), userId)) // Ensure user owns them
      .order("desc")
      .collect();
    
    return Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return {
          ...doc,
          url: url || null,
        };
      })
    );
  },
});


export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    // 1. Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // 2. Check if the user owns this document
    if (document.userId !== userId) {
      throw new Error("You are not authorized to delete this document");
    }

    // 3. Delete the file from storage
    await ctx.storage.delete(document.storageId);

    // 4. Delete the document from the database
    await ctx.db.delete(args.documentId);

    return { success: true };
  },
});