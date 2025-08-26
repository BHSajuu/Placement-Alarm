import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  badge?: string;
}

export default function AccordionSection({ 
  title, 
  isExpanded, 
  onToggle, 
  children, 
  icon, 
  badge 
}: AccordionSectionProps) {
  return (
    <Card className="bg-gray-800/40 border-gray-700/50">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-700/20 transition-colors duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
              {icon}
            </div>
            <CardTitle className="text-xl text-white">{title}</CardTitle>
            {badge && (
              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                {badge}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}