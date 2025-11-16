import { v } from "convex/values";
import { mutation, query } from "./_generated/server";



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

          await ctx.db.insert("documents",{
            userId,
            storageId: args.storageId,
            documentName: args.documentName,
            fileType: args.fileType,
            fileSize: args.fileSize,
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