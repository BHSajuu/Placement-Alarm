"use client";

import React, { useState } from 'react';
import { CheckSquare, AlertCircle, Star, Brain } from "lucide-react";
import OverallScoreCard from "./result/OverallScoreCard";
import MarketCompetitivenessCard from "./result/MarketCompetitivenessCard";
import CategoryScoresGrid from "./result/CategoryScoresGrid";
import AccordionSection from "./result/AccordionSection";
import PrioritySuggestions from "./result/PrioritySuggestions";
import CriticalGaps from "./result/CriticalGaps";
import CompetitiveAdvantages from "./result/CompetitiveAdvantages";
import ActionPlan from "./result/ActionPlan";

function AnalyzerResult({ result, history }: { result: any, history: any[] | undefined}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    suggestions: true,
    gaps: false,
    advantages: false,
    nextSteps: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <OverallScoreCard result={result} />

      {/* Market Competitiveness */}
      {result.market_competitiveness && (
        <MarketCompetitivenessCard 
          marketData={result.market_competitiveness} 
          atsScore={result.ats_compatibility?.score || 0} 
        />
      )}

      {/* Category Scores */}
      <CategoryScoresGrid categories={result.categorical_scores || []} />

      {/* Priority Improvements - Accordion */}
      <AccordionSection
        title="Top Priority Fixes"
        isExpanded={expandedSections.suggestions}
        onToggle={() => toggleSection('suggestions')}
        icon={<CheckSquare className="h-5 w-5 text-blue-400" />}
        badge={`${result.actionable_suggestions?.length || 0} items`}
      >
        <PrioritySuggestions suggestions={result.actionable_suggestions || []} />
      </AccordionSection>

      {/* Critical Gaps - Accordion */}
      <AccordionSection
        title="What's Missing"
        isExpanded={expandedSections.gaps}
        onToggle={() => toggleSection('gaps')}
        icon={<AlertCircle className="h-5 w-5 text-red-400" />}
      >
        <CriticalGaps gaps={result.critical_gaps} />
      </AccordionSection>

      {/* Competitive Advantages - Accordion */}
      {result.competitive_advantages?.length > 0 && (
        <AccordionSection
          title="Your Strengths"
          isExpanded={expandedSections.advantages}
          onToggle={() => toggleSection('advantages')}
          icon={<Star className="h-5 w-5 text-yellow-400" />}
          badge={`${result.competitive_advantages.length} strengths`}
        >
          <CompetitiveAdvantages advantages={result.competitive_advantages} />
        </AccordionSection>
      )}

      {/* Action Plan - Accordion */}
      {result.next_steps?.length > 0 && (
        <AccordionSection
          title="Your Action Plan"
          isExpanded={expandedSections.nextSteps}
          onToggle={() => toggleSection('nextSteps')}
          icon={<Brain className="h-5 w-5 text-green-400" />}
          badge="Priority Order"
        >
          <ActionPlan steps={result.next_steps} />
        </AccordionSection>
      )}
    </div>
  );
}

export default AnalyzerResult;