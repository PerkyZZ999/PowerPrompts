/**
 * Technique toggles component with checkbox grid and icons.
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Technique } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Brain, GitBranch, RefreshCw, BookOpen, Link2, Sparkles, Settings, ChevronDown, AlertTriangle } from "lucide-react";
import { useState } from "react";

const TECHNIQUE_INFO = {
  [Technique.COT]: {
    name: "Chain-of-Thought",
    icon: Brain,
    description: "Step-by-step reasoning process",
    color: "from-primary/20 to-primary-light/20",
  },
  [Technique.SELF_CONSISTENCY]: {
    name: "Self-Consistency",
    icon: RefreshCw,
    description: "Multiple paths with voting",
    color: "from-primary/15 to-white/15",
  },
  [Technique.TOT]: {
    name: "Tree of Thoughts",
    icon: GitBranch,
    description: "Branching exploration strategy",
    color: "from-slate-500/20 to-slate-600/20",
  },
  [Technique.RSIP]: {
    name: "RSIP",
    icon: Sparkles,
    description: "Recursive self-improvement",
    color: "from-primary/20 to-primary-dark/20",
  },
  [Technique.RAG]: {
    name: "RAG",
    icon: BookOpen,
    description: "Retrieval-augmented generation",
    color: "from-primary-dark/20 to-primary/15",
  },
  [Technique.PROMPT_CHAINING]: {
    name: "Prompt Chaining",
    icon: Link2,
    description: "Sequential prompt execution",
    color: "from-primary-light/20 to-primary/20",
  },
};

const checkCompatibility = (techniques: Technique[]): string | null => {
  const hasToT = techniques.includes(Technique.TOT);
  const hasCoT = techniques.includes(Technique.COT);
  const hasSelfConsistency = techniques.includes(Technique.SELF_CONSISTENCY);

  if (hasToT && !hasCoT) {
    return "Tree of Thoughts works best with Chain-of-Thought enabled";
  }
  if (hasSelfConsistency && !hasCoT) {
    return "Self-Consistency is most effective with Chain-of-Thought";
  }
  return null;
};

export function TechniqueToggles() {
  const techniques = useOptimizationStore((state) => state.techniques);
  const toggleTechnique = useOptimizationStore((state) => state.toggleTechnique);
  const isOptimizing = useOptimizationStore((state) => state.isOptimizing);
  const parameters = useOptimizationStore((state) => state.parameters);
  const updateParameters = useOptimizationStore((state) => state.updateParameters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const compatibilityWarning = checkCompatibility(techniques);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Advanced Techniques
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compatibility Warning */}
        {compatibilityWarning && (
          <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{compatibilityWarning}</span>
          </div>
        )}

        {/* Technique Grid */}
        <div className="grid grid-cols-2 gap-3">
        {Object.entries(TECHNIQUE_INFO).map(([key, info]) => {
          const isEnabled = techniques.includes(key as Technique);
          const Icon = info.icon;

          return (
            <button
              key={key}
              onClick={() => toggleTechnique(key as Technique)}
              disabled={isOptimizing}
              className={cn(
                "p-4 rounded-lg border-2 transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "relative overflow-hidden",
                isEnabled
                  ? "border-primary/50 bg-primary/10 shadow-neon-sm"
                  : "border-zinc-700 bg-elevated/30 hover:border-zinc-600"
              )}
            >
              {/* Background gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity",
                info.color,
                isEnabled && "opacity-100"
              )}></div>

              <div className="relative z-10">
                {/* Icon and Checkbox */}
                <div className="flex items-start justify-between mb-2">
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isEnabled ? "text-primary" : "text-zinc-400"
                  )} />
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                    isEnabled
                      ? "border-primary bg-primary"
                      : "border-zinc-600"
                  )}>
                    {isEnabled && (
                      <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Name and Description */}
                <h4 className={cn(
                  "text-sm font-semibold mb-1 transition-colors",
                  isEnabled ? "text-primary" : "text-zinc-200"
                )}>
                  {info.name}
                </h4>
                <p className="text-xs text-zinc-400 leading-tight">
                  {info.description}
                </p>
              </div>
            </button>
          );
        })}
        </div>

        {/* Advanced Parameters Accordion */}
        <div className="border-t border-zinc-700 pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 hover:bg-elevated/50 rounded-lg transition-colors"
            disabled={isOptimizing}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-zinc-200">
                Advanced Parameters
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-zinc-500 transition-transform",
              showAdvanced && "rotate-180"
            )} />
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Temperature
                  </label>
                  <span className="text-sm font-mono text-primary">
                    {parameters.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={parameters.temperature}
                  onChange={(e) => updateParameters({ temperature: parseFloat(e.target.value) })}
                  disabled={isOptimizing}
                  className="w-full h-2 bg-elevated rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary 
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-neon-sm
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Controls randomness. Higher values = more creative, lower = more focused
                </p>
              </div>

              {/* Top-P Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Top-P (Nucleus Sampling)
                  </label>
                  <span className="text-sm font-mono text-primary">
                    {parameters.top_p.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={parameters.top_p}
                  onChange={(e) => updateParameters({ top_p: parseFloat(e.target.value) })}
                  disabled={isOptimizing}
                  className="w-full h-2 bg-elevated rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary 
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-neon-sm
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Controls diversity. Higher values consider more options
                </p>
              </div>

              {/* Max Tokens Input */}
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  step="100"
                  value={parameters.max_tokens}
                  onChange={(e) => updateParameters({ max_tokens: parseInt(e.target.value) })}
                  disabled={isOptimizing}
                  className="w-full px-3 py-2 bg-elevated border border-zinc-700 rounded-lg text-zinc-100 font-mono text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Maximum length of generated response
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

