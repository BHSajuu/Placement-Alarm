import React from 'react';
import { TrendingUp, DollarSign, Zap, BarChart } from "lucide-react";

interface MarketCompetitivenessCardProps {
  marketData: any;
  atsScore: number;
}

export default function MarketCompetitivenessCard({ marketData, atsScore }: MarketCompetitivenessCardProps) {
  if (!marketData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <span className="text-green-400 font-semibold">Market Score</span>
        </div>
        <div className="text-2xl font-bold text-white">{marketData.score}%</div>
      </div>
      
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-blue-400" />
          <span className="text-blue-400 font-semibold">Salary Range</span>
        </div>
        <div className="text-sm font-medium text-white">{marketData.salary_bracket}</div>
      </div>
      
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-purple-400" />
          <span className="text-purple-400 font-semibold">Growth Potential</span>
        </div>
        <div className="text-sm font-medium text-white">{marketData.improvement_potential}</div>
      </div>
      
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
        <div className="flex items-center gap-2 mb-2">
          <BarChart className="h-5 w-5 text-orange-400" />
          <span className="text-orange-400 font-semibold">ATS Score</span>
        </div>
        <div className="text-2xl font-bold text-white">{atsScore}%</div>
      </div>
    </div>
  );
}