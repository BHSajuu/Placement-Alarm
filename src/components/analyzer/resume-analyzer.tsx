"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, Wand2 } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import mammoth from "mammoth";
import { parsePdf } from "@/lib/parsePdf";
import toast from "react-hot-toast";
import FileUploadZone from "./FileUploadZone";
import JobDescriptionInput from "./JobDesInput";
import { convertPdfToImage } from "@/lib/pdf2img";

interface ResumeAnalyzerProps {
  onAnalysisComplete: (result: any, resumeText: string) => void;
}

export function ResumeAnalyzer({ onAnalysisComplete }: ResumeAnalyzerProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusText, setStatusText] = useState('');


  const analyze = useAction(api.gemini.analyzeResume);
  const saveAnalysis = useMutation(api.gemini.saveAnalysis);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      toast.error("Please upload a resume.");
      return;
    }
    if (!jobDescription && !jobDescriptionFile) {
      toast.error("Please provide a job description.");
      return;
    }
    setIsLoading(true);
    setStatusText('Uploading the file...');

    try {
      let resumeText = "";
      if (resumeFile.type === "application/pdf") {
        resumeText = await parsePdf(resumeFile);
      } else if (resumeFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        resumeText = result.value;
      } else {
        toast.error("Unsupported file type for resume. Please upload a PDF or DOCX file.");
        setIsLoading(false);
        return;
      }

      setStatusText('Converting to image...');
      const resumeImageFile = await convertPdfToImage(resumeFile)


      setStatusText('Preparing data...');
      let jobDescriptionText = jobDescription;
      if (jobDescriptionFile) {
        if (jobDescriptionFile.type === "application/pdf") {
          jobDescriptionText = await parsePdf(jobDescriptionFile);
        } else if (jobDescriptionFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const arrayBuffer = await jobDescriptionFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          jobDescriptionText = result.value;
        } else {
          toast.error("Unsupported file type for job description. Please upload a PDF or DOCX file.");
          setIsLoading(false);
          return;
        }
      }


      setStatusText('Analyzing the resume...');
      const result = await analyze({
        resumeText: resumeText,
        jobDescriptionText: jobDescriptionText,
      });

      setStatusText('Saving the analysis...');
      await saveAnalysis({
        jobDescription: jobDescriptionText.substring(0, 1000), 
        resumeText: resumeText.substring(0, 1000), 
        analysis: result,
        overallScore: result.overallScore, 
        resumeImageFile: resumeImageFile,
      });
      setStatusText('Analysis complete, rendering results...');
      onAnalysisComplete(result, resumeText);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("An error occurred during analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="space-y-8">
      {isLoading ? (
        <>
          <h2>{statusText}</h2>
          <img src="/images/resume-scan.gif" className="w-full" />
        </>
      )
        :
        (
          <>
            <div className="flex flex-col lg:flex-row justify-center items-center gap-28 mb-12">
              <FileUploadZone
                title="Upload Resume"
                description="Upload your resume in PDF or DOCX format"
                acceptedTypes=".pdf,.docx"
                onFileSelect={handleFileChange}
                icon={FileUp}
                file={resumeFile ?? undefined}
                dragActive={isDragging}
              />
              <JobDescriptionInput
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                jobFile={jobDescriptionFile}
                onJobFileSelect={setJobDescriptionFile}
                dragActive={isDragging}
              />
            </div>

            <div className="text-center">
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-semibold"
              >
               <Wand2 className="mr-2 h-5 w-5" />
                Analyze Resume
              </Button>
            </div>
          </>
        )}
    </div>
  );
}