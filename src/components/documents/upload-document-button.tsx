
"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { Id } from "../../../convex/_generated/dataModel"

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
];


interface UploadDocumentButtonProps {
  companyId?: Id<"companies">;
}

export function UploadDocumentButton({ companyId }: UploadDocumentButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useUser();
  
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveDocument = useMutation(api.documents.saveDocument);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large! Max size: ${MAX_FILE_SIZE_MB}MB`);
      event.target.value = ""; 
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Only PDF and DOCX are allowed.");
      event.target.value = "";
      return;
    }
    
    setIsUploading(true);
    const toastId = toast.loading("Uploading document..."); 
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload file to storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // 3. Save document metadata to database
      await saveDocument({
        storageId: storageId,
        documentName: file.name, 
        fileType: file.type,
        fileSize: file.size,
        companyId: companyId,
      });

      toast.success("Document uploaded successfully!", { id: toastId }); 
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error("Failed to upload document", { id: toastId }); 
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
  <Button
    asChild
    className=" mr-10 md:mr-3 bg-green-300 hover:bg-green-400 text-slate-600 hover:text-gray-900 rounded-2xl transition-all duration-300 hover:scale-105 px-6 py-3 font-semibold"
  >
    <label htmlFor="document-upload" className="cursor-pointer flex items-center">
      {isUploading ? (
        <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
      ) : (
        <Upload className="h-4 w-4 md:mr-2" />
      )}
      <span className="hidden md:inline">{isUploading ? "Uploading..." : "Upload New Document"}</span>

      <input
        id="document-upload"
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </label>
  </Button>
 );
}