import React from 'react';
import { CheckCircle } from "lucide-react";
import CopyableText from "./CopyableText";

interface CompetitiveAdvantagesProps {
  advantages: string[];
}

export default function CompetitiveAdvantages({ advantages }: CompetitiveAdvantagesProps) {
  if (!advantages?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {advantages.slice(0, 4).map((advantage: string, index: number) => (
        <div key={index} className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <CopyableText text={advantage} label="Competitive advantage" className="text-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}