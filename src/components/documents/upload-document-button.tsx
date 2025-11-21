"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useAction, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Cloud, HardDrive, Loader2, Upload } from "lucide-react"
import { Id } from "../../../convex/_generated/dataModel"
import useDrivePicker from "react-google-drive-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const MAX_FILE_SIZE_MB = 10;
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
  const [isOpen, setIsOpen] = useState(false); 
  const { user } = useUser();
  
  // Local Upload Mutations
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveDocument = useMutation(api.documents.saveDocument);

  // Drive Upload Action
  const saveGoogleDriveFile = useAction(api.drive.saveGoogleDriveFile);
  const getViewerToken = useAction(api.drive.getViewerToken);
  const [openDrivePicker] = useDrivePicker();
  
  // Local File Upload Logic
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return; // User cancelled selection
    
    // Close menu manually once we have a file
    setIsOpen(false);

    if (!user?.id) return;

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
      // Get upload URL
      const postUrl = await generateUploadUrl();

      // Upload file to storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      //Save document metadata to database
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
 
 // 2. Google Drive Picker Logic
  const handleGoogleDriveClick = async () => {
    // Check if env vars are loaded
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_GOOGLE_API_KEY || !process.env.NEXT_PUBLIC_GOOGLE_APP_ID) {
      toast.error("Google Drive configuration missing");
      return;
    }
    
    // Fetch the Google Access Token from Backend
    let oauthToken = null;
    try {
      oauthToken = await getViewerToken();
    } catch (err) {
      console.error("Failed to get OAuth token", err);
      toast.error("Authentication failed. Please sign in again.");
      return;
    }

    if (!oauthToken) {
      toast.error("Could not retrieve Google permissions. Try signing out and back in.");
      return;
    }
    
  // Open Picker with the Token
    const pickerConfig: any = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      appId: process.env.NEXT_PUBLIC_GOOGLE_APP_ID,
      viewId: "DOCS",
      token: oauthToken,
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,
      mimeTypes: ALLOWED_FILE_TYPES.join(","), 
      callbackFunction: (data: any) => {
        if (data.action === "picked") {
          const file = data.docs[0];
          handleDriveUpload(file);
        }
      },
    };
  
    openDrivePicker(pickerConfig);
  };

  const handleDriveUpload = async (file: any) => {
    setIsUploading(true);
    const toastId = toast.loading(`Importing ${file.name} from Drive...`);

    try {
      await saveGoogleDriveFile({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        companyId: companyId,
      });
      toast.success("Document imported successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Drive import error:", error);
      // Handle Google Doc specific error
      if (error.message && error.message.includes("403")) {
         toast.error("Permission denied. Ensure you picked a valid PDF/DOCX.", { id: toastId });
      } else {
         toast.error("Failed to import from Drive", { id: toastId });
      }
    } finally {
      setIsUploading(false);
    }
  };

 return (
    //Controlled Dropdown state
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isUploading}
          className="mr-10 md:mr-3 bg-green-300 hover:bg-green-400 text-slate-600 hover:text-gray-900 rounded-2xl transition-all duration-300 hover:scale-105 px-6 py-3 font-semibold"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 md:mr-2" />
          )}
          <span className="hidden md:inline">{isUploading ? "Uploading..." : "Upload Document"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-49 mt-5 bg-gray-900 border-gray-700 text-gray-200">
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          // Prevent closing immediately on click so input stays mounted
          onSelect={(e) => e.preventDefault()}
        >
          <label htmlFor="document-upload" className="flex items-center w-full cursor-pointer">
            <HardDrive className="mr-2 h-4 w-4 text-blue-400" />
            <span>From Computer</span>
            <input
              id="document-upload"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          onSelect={() => {
             setIsOpen(false); // Close menu for Drive option
             handleGoogleDriveClick();
          }}
          disabled={isUploading}
        >
          <Cloud className=" h-4 w-4 text-yellow-400" />
          <span>From Google Drive</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}