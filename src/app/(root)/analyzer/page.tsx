"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ResumeAnalyzer } from "@/components/analyzer/resume-analyzer";
import AnalyzerResult from "@/components/analyzer/AnalyzerResult";
import { AnalysisSidebar } from "@/components/analyzer/AnalysisSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";

type ActiveView = "analyzer" | "result";

export default function AnalyzerPage() {
  const [activeTab, setActiveTab] = useState<ActiveView>("analyzer");
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [originalResumeText, setOriginalResumeText] = useState<string>("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<Id<"analyses"> | "new" | null>(null);

  const analysisHistory = useQuery(api.gemini.getAnalysisHistory) || [];

  const handleAnalysisComplete = (result: any, resumeText: string) => {
    setCurrentAnalysis(result);
    setOriginalResumeText(resumeText);
    setSelectedAnalysisId("new");
    setActiveTab("result");
  };

  const handleSelectHistoryItem = (id: Id<"analyses"> | "new") => {
    setSelectedAnalysisId(id);
    setActiveTab("result"); // Ensure we are on the result tab
  };

  const displayedAnalysis = selectedAnalysisId === "new"
    ? currentAnalysis
    : analysisHistory.find(a => a._id === selectedAnalysisId)?.analysis;

  const displayedResumeText = selectedAnalysisId === "new"
    ? originalResumeText
    : analysisHistory.find(a => a._id === selectedAnalysisId)?.resumeText;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Optimize Your Resume
          </h1>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Get AI-powered insights on how well your resume matches any job description, with specific suggestions for improvement.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveView)}>
          <TabsList className="pb-11 px-6 grid w-full grid-cols-2 gap-6 mb-4 bg-gray-700/50 border border-gray-600/50">
            <TabsTrigger value="analyzer" className={`p-2 ${activeTab === "analyzer" ? "text-black" : "text-white"}`}>Analyzer</TabsTrigger>
            <TabsTrigger value="result" className={`p-2 ${activeTab === "result" ? "text-black" : "text-white"}`}>Results</TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer">
            <ResumeAnalyzer onAnalysisComplete={handleAnalysisComplete} />
          </TabsContent>
          <TabsContent value="result" className="focus-visible:ring-0">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-grow">
                {displayedAnalysis ? (
                  <AnalyzerResult
                    result={displayedAnalysis}
                    
                  />
                ) : (
                  <div className="text-center py-16 mt-8 bg-gray-800/30 rounded-lg h-full flex flex-col justify-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-300 text-lg font-medium">No analysis selected.</p>
                    <p className="text-gray-400 text-sm mt-2">Complete a new analysis or select one from the history.</p>
                  </div>
                )}
              </div>
              <AnalysisSidebar
                analyses={analysisHistory}
                currentAnalysis={currentAnalysis}
                selectedId={selectedAnalysisId}
                onSelect={handleSelectHistoryItem}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}