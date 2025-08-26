import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

interface PrioritySuggestionsProps {
  suggestions: any[];
}

export default function PrioritySuggestions({ suggestions }: PrioritySuggestionsProps) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {suggestions?.map((sugg: any, index: number) => (
        <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPriorityColor(sugg.priority)}`}>
                {sugg.priority}
              </span>
              <p className="font-semibold text-purple-400">{sugg.area}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(sugg.example.after, 'Suggestion')}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-900/20 rounded-md border border-blue-500/20">
              <p className="text-sm text-blue-300"><strong>Fix:</strong> {sugg.suggestion}</p>
            </div>
            
            <div className="p-3 bg-green-900/30 rounded-md flex items-start gap-2 group cursor-pointer hover:bg-green-900/40 transition-colors"
                 onClick={() => copyToClipboard(sugg.example.after, 'Improved text')}>
              <ArrowRight size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-300"><strong>Use this:</strong> "{sugg.example.after}"</p>
                <p className="text-xs text-green-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to copy
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}