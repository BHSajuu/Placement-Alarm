import React from 'react';
import { Target, Building, Award, Users } from "lucide-react";
import CopyableText from "./CopyableText";
import toast from "react-hot-toast";

interface CriticalGapsProps {
  gaps: any;
}

export default function CriticalGaps({ gaps }: CriticalGapsProps) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {gaps?.missing_keywords?.length > 0 && (
        <div>
          <h5 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Missing Keywords
          </h5>
          <div className="flex flex-wrap gap-2">
            {gaps.missing_keywords.slice(0, 8).map((keyword: string, index: number) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-red-500/20 text-red-300 text-sm font-medium rounded-full border border-red-500/30 cursor-pointer hover:bg-red-500/30 transition-colors"
                onClick={() => copyToClipboard(keyword, 'Keyword')}
              >
                {keyword}
              </span>
            ))}
            {gaps.missing_keywords.length > 8 && (
              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-sm rounded-full">
                +{gaps.missing_keywords.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {gaps?.experience_gaps?.length > 0 && (
        <div>
          <h5 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Experience Gaps
          </h5>
          <div className="space-y-2">
            {gaps.experience_gaps.slice(0, 3).map((gap: string, index: number) => (
              <CopyableText key={index} text={gap} label="Experience gap" className="text-sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}