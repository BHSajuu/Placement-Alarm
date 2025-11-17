
"use client"

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UploadDocumentButton } from "./upload-document-button";
import { Button } from "../ui/button";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import toast from "react-hot-toast";

interface CompanyDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: Id<"companies">;
  companyName: string;
}

export function CompanyDocumentModal({ isOpen, onClose, companyId, companyName }: CompanyDocumentModalProps) {

    const documents = useQuery(
    api.documents.getCompanyDocuments,
    { companyId }
  );
  
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleDelete = (documentId: Id<"documents">, documentName: string) => {

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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] bg-gray-950 border-gray-700 text-white shadow-2xl shadow-blue-300/30 ">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            Documents for <span className="text-blue-400">{companyName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-end">
            <UploadDocumentButton companyId={companyId} />
          </div>

          <div className="pb-2 px-2 space-y-3 max-h-96 overflow-y-auto">
            {documents === undefined && (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
            
            {documents && documents.length === 0 && (
              <div className="text-center py-12 bg-gray-800/40 border border-gray-700/50 rounded-2xl">
                <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <h3 className="text-md font-medium text-white">No documents for this company.</h3>
                <p className="text-gray-400 text-sm">Upload one to get started.</p>
              </div>
            )}

            {documents && documents.map((document) => (
              <div 
                key={document._id} 
                className="w-80 md:w-auto bg-gray-700/50  rounded-2xl border border-gray-700/50 px-4 py-3 flex items-center justify-between hover:shadow-md hover:shadow-blue-200  transition-all duration-300"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
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
                    <p className="text-gray-300 text-sm">
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
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}