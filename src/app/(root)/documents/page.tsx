
"use client"

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { UploadDocumentButton } from "@/components/documents/upload-document-button";
import { ArrowLeft, FileText, Loader2, Trash2, Building2, LinkIcon } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import { formatBytes } from "@/lib/utils";


export default function DocumentsPage() {
  const { user, isLoaded } = useUser();
  

  const documents = useQuery(
    api.documents.getAllDocuments,
    !user ? "skip" : undefined
  );

  if (!isLoaded || documents === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12" style={{ animation: "fadeInUp 0.8s ease-out" }}>
        
        <Link href="/profile">
          <div className="group mb-8 inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 cursor-pointer">
            <div className="p-2 rounded-full bg-gray-800/50 group-hover:bg-gray-700/50 transition-all duration-300">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="font-medium">Back to Profile</span>
          </div>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent tracking-tight">
              All Documents
            </h1>
            <p className="text-gray-400">Manage your general and company-specific documents.</p>
          </div>
          <UploadDocumentButton /> 
        </div>

        <DocumentList />
      </div>
    </div>
  );
}

function DocumentList() {
  const documents = useQuery(api.documents.getAllDocuments);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleDelete = (documentId: Id<"documents">, documentName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return;
    }

    const toastId = toast.loading(`Deleting ${documentName}...`);
    deleteDocument({ documentId })
      .then(() => {
        toast.success("Document deleted successfully!", { id: toastId });
      })
      .catch((err) => {
        console.error("Failed to delete document:", err);
        toast.error("Failed to delete document", { id: toastId });
      });
  };

  if (documents === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-4 h-24 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-800/40 border border-gray-700/50 rounded-2xl">
        <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white">No Documents Uploaded</h3>
        <p className="text-gray-400">Click "Upload New Document" to add one.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map((document) => (
        <div 
          key={document._id} 
          className="bg-gray-800/40 backdrop-blur-3xl rounded-2xl border border-gray-700/50 p-5 flex flex-col gap-3 shadow-lg transition-all duration-300 hover:border-gray-600/50 hover:shadow-purple-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 overflow-hidden">
              <FileText className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <a
                  href={document.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-medium truncate block hover:underline"
                  title={document.documentName}
                >
                  {document.documentName}
                </a>
                <p className="text-gray-400 text-sm">
                  {formatBytes(document.fileSize)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(document._id, document.documentName)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 hover:scale-110 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {document.companyName ? (
            <div className="border-t border-gray-700/50 pt-3 flex items-center gap-2 text-sm text-gray-300">
              <Building2 className="h-4 w-4 text-gray-400" />
              Linked to: <span className="font-medium text-blue-300">{document.companyName}</span>
            </div>
          ) : (
            <div className="border-t border-gray-700/50 pt-3 flex items-center gap-2 text-sm text-gray-400">
              <LinkIcon className="h-4 w-4 text-gray-500" />
              General Document (not linked to a company)
            </div>
          )}
        </div>
      ))}
    </div>
  );
}