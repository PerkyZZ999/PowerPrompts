/**
 * Framework selector component with descriptions and neon highlights.
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Framework } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Layers, Info, BarChart3 } from "lucide-react";
import { useState } from "react";

type Complexity = "Simple" | "Moderate" | "Advanced";

const FRAMEWORK_METADATA = {
  [Framework.RACE]: {
    name: "RACE",
    description: "Role, Action, Context, Example",
    details:
      "Structured framework focusing on role definition, specific actions, contextual information, and concrete examples.",
    useCases: ["Technical", "Documentation", "Code Generation"],
    complexity: "Simple" as Complexity,
    recommended: "Clear, step-by-step instructions with examples",
    structure: `<role>Define who/what is responding</role>
<action>Specify what needs to be done</action>
<context>Provide relevant background</context>
<example>Show concrete examples</example>`,
  },
  [Framework.COSTAR]: {
    name: "CO-STAR",
    description: "Context, Objective, Style, Tone, Audience, Response",
    details:
      "Comprehensive framework covering all aspects of prompt engineering including context, objectives, and audience considerations.",
    useCases: ["Creative", "Marketing", "Content Writing"],
    complexity: "Advanced" as Complexity,
    recommended:
      "Nuanced content requiring specific tone and audience awareness",
    structure: `<context>Background information</context>
<objective>What you want to achieve</objective>
<style>Writing style preferences</style>
<tone>Desired emotional tone</tone>
<audience>Target audience details</audience>
<response>Expected response format</response>`,
  },
  [Framework.APE]: {
    name: "APE",
    description: "Action, Purpose, Expectation",
    details:
      "Simple yet effective framework emphasizing clear actions, defined purposes, and explicit expectations.",
    useCases: ["General", "Quick Tasks", "Q&A"],
    complexity: "Simple" as Complexity,
    recommended: "Quick, focused tasks with clear outcomes",
    structure: `<action>What to do</action>
<purpose>Why it matters</purpose>
<expectation>Expected outcome</expectation>`,
  },
  [Framework.CREATE]: {
    name: "CREATE",
    description: "Character, Request, Examples, Adjustments, Type, Extras",
    details:
      "Detailed framework for creating rich, multi-dimensional prompts with character definition and iterative refinement.",
    useCases: ["Roleplay", "Storytelling", "Complex Analysis"],
    complexity: "Moderate" as Complexity,
    recommended: "Rich narratives and character-driven responses",
    structure: `<character>Define persona/character</character>
<request>What you're asking for</request>
<examples>Concrete examples</examples>
<adjustments>Fine-tuning parameters</adjustments>
<type>Format/output type</type>
<extras>Additional constraints</extras>`,
  },
};

const getComplexityColor = (complexity: Complexity) => {
  switch (complexity) {
    case "Simple":
      return "bg-primary";
    case "Moderate":
      return "bg-yellow-500";
    case "Advanced":
      return "bg-red-500";
  }
};

const getComplexityBars = (complexity: Complexity) => {
  switch (complexity) {
    case "Simple":
      return 1;
    case "Moderate":
      return 2;
    case "Advanced":
      return 3;
  }
};

export function FrameworkSelector() {
  const framework = useOptimizationStore((state) => state.framework);
  const setFramework = useOptimizationStore((state) => state.setFramework);
  const isOptimizing = useOptimizationStore((state) => state.isOptimizing);
  const [hoveredFramework, setHoveredFramework] = useState<string | null>(null);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Framework Selection
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {Object.entries(FRAMEWORK_METADATA).map(([key, info]) => {
          const isSelected = framework === key;
          const isHovered = hoveredFramework === key;
          const complexityBars = getComplexityBars(info.complexity);

          return (
            <div key={key} className="relative">
              <button
                onClick={() => setFramework(key as Framework)}
                disabled={isOptimizing}
                onMouseEnter={() => setHoveredFramework(key)}
                onMouseLeave={() => setHoveredFramework(null)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all duration-200 text-left relative overflow-hidden",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  isSelected
                    ? "border-primary/50 bg-primary/10 shadow-neon-sm"
                    : "border-zinc-700 bg-elevated/30 hover:border-zinc-600",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4
                        className={cn(
                          "font-semibold font-space-grotesk",
                          isSelected ? "text-primary" : "text-zinc-200",
                        )}
                      >
                        {info.name}
                      </h4>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-primary animate-pulse-glow" />
                      )}
                    </div>

                    {/* Use Case Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {info.useCases.map((useCase) => (
                        <span
                          key={useCase}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/30"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-400 mb-2">
                      {info.description}
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-2">
                      {info.details}
                    </p>

                    {/* Recommended Tag */}
                    <div className="flex items-start gap-1.5 text-xs text-zinc-500">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">
                        <span className="font-semibold text-white">
                          Best for:
                        </span>{" "}
                        {info.recommended}
                      </span>
                    </div>
                  </div>

                  {/* Complexity Indicator */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {info.complexity}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-6 rounded-full transition-colors",
                            i < complexityBars
                              ? getComplexityColor(info.complexity)
                              : "bg-zinc-700",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {/* Hover Tooltip - Framework Structure Preview */}
              {isHovered && !isOptimizing && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 glass-elevated rounded-lg border border-primary/30 shadow-neon-md z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-white">
                        Framework Structure
                      </span>
                    </div>
                    <pre className="text-[10px] text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">
                      {info.structure}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
