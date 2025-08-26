import React from 'react';
import { Brain, Target, TrendingUp, Users, BookOpen, Building, BarChart } from "lucide-react";

interface CategoryScoresGridProps {
  categories: any[];
}

export default function CategoryScoresGrid({ categories }: CategoryScoresGridProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical Skills Match': return <Brain className="h-5 w-5" />;
      case 'Experience Relevance': return <Target className="h-5 w-5" />;
      case 'Impact & Quantifiable Results': return <TrendingUp className="h-5 w-5" />;
      case 'Leadership & Soft Skills': return <Users className="h-5 w-5" />;
      case 'Education & Certifications': return <BookOpen className="h-5 w-5" />;
      case 'Industry Knowledge': return <Building className="h-5 w-5" />;
      default: return <BarChart className="h-5 w-5" />;
    }
  };

  return (
    <div>
      <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart size={20} />
        Category Breakdown
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat: any, index: number) => (
          <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getCategoryIcon(cat.category)}
                <h5 className="font-semibold text-white text-sm">{cat.category}</h5>
              </div>
              <span className="font-bold text-purple-400">{cat.score}/100</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${cat.score}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">{cat.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}