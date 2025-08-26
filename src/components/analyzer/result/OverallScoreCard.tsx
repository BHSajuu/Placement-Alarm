import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";
import ScoreCircle from "../ScoreCircle";
import CopyableText from "./CopyableText";

interface OverallScoreCardProps {
  result: any;
}

export default function OverallScoreCard({ result }: OverallScoreCardProps) {
  return (
    <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl text-white flex items-center gap-3">
          <Sparkles size={28} className="text-yellow-300" />
          Resume Analysis Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score & Summary */}
        <div className="flex flex-col lg:flex-row items-center gap-8 p-6 bg-gray-900/30 rounded-lg border border-gray-700/50">
          <ScoreCircle score={result.overall_score} />
          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-bold text-white">Overall Assessment</h3>
            <CopyableText text={result.summary} label="Summary" />
            <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700/30">
              <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                First Impression (15-second scan):
              </h4>
              <p className="text-slate-300 italic">"{result.first_impression}"</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}