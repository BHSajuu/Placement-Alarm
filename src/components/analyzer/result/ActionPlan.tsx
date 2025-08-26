import React from 'react';
import CopyableText from "./CopyableText";

interface ActionPlanProps {
  steps: string[];
}

export default function ActionPlan({ steps }: ActionPlanProps) {
  if (!steps?.length) return null;

  return (
    <div className="space-y-3">
      {steps.slice(0, 5).map((step: string, index: number) => (
        <div key={index} className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors group">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
          <div className="flex-1">
            <CopyableText text={step} label={`Action step ${index + 1}`} className="text-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}