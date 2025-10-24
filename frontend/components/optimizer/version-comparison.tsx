/**
 * Version comparison component with side-by-side diff view.
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GitCompare, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState, useMemo } from "react";

export function VersionComparison() {
  const iterations = useOptimizationStore((state) => state.iterations);
  const selectedVersions = useOptimizationStore((state) => state.selectedVersions);
  const setSelectedVersions = useOptimizationStore((state) => state.setSelectedVersions);
  const [showFullPrompts, setShowFullPrompts] = useState(false);

  // Get the two versions to compare
  const version1 = iterations[selectedVersions[0] - 1];
  const version2 = iterations[selectedVersions[1] - 1];

  // Calculate metric differences
  const metricDiffs = useMemo(() => {
    if (!version1 || !version2) return null;

    return {
      aggregate: version2.metrics.aggregate - version1.metrics.aggregate,
      relevance: version2.metrics.relevance - version1.metrics.relevance,
      accuracy: version2.metrics.accuracy - version1.metrics.accuracy,
      consistency: version2.metrics.consistency - version1.metrics.consistency,
    };
  }, [version1, version2]);

  const renderMetricChange = (diff: number) => {
    if (diff > 0.1) {
      return (
        <div className="flex items-center gap-1 text-primary">
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs font-mono">+{diff.toFixed(2)}</span>
        </div>
      );
    } else if (diff < -0.1) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <TrendingDown className="w-3 h-3" />
          <span className="text-xs font-mono">{diff.toFixed(2)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-zinc-500">
          <Minus className="w-3 h-3" />
          <span className="text-xs font-mono">~{diff.toFixed(2)}</span>
        </div>
      );
    }
  };

  if (!iterations.length) {
    return (
      <Card variant="glass">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full glass-elevated flex items-center justify-center mb-4">
            <GitCompare className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-zinc-400">
            Run an optimization to compare versions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Version Comparison
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullPrompts(!showFullPrompts)}
            className="text-xs"
          >
            <ChevronDown className={cn(
              "w-4 h-4 mr-1 transition-transform",
              showFullPrompts && "rotate-180"
            )} />
            {showFullPrompts ? "Collapse" : "Expand"} Prompts
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Version Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-2">Version 1</label>
            <select
              value={selectedVersions[0]}
              onChange={(e) => setSelectedVersions([parseInt(e.target.value), selectedVersions[1]])}
              className="w-full px-3 py-2 bg-elevated border border-zinc-700 rounded-lg text-zinc-100 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all cursor-pointer"
            >
              {iterations.map((_, idx) => (
                <option key={idx} value={idx + 1}>
                  Iteration {idx + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-2">Version 2</label>
            <select
              value={selectedVersions[1]}
              onChange={(e) => setSelectedVersions([selectedVersions[0], parseInt(e.target.value)])}
              className="w-full px-3 py-2 bg-elevated border border-zinc-700 rounded-lg text-zinc-100 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all cursor-pointer"
            >
              {iterations.map((_, idx) => (
                <option key={idx} value={idx + 1}>
                  Iteration {idx + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics Comparison */}
        {version1 && version2 && metricDiffs && (
          <div className="glass-elevated rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-zinc-300">Metric Changes</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Aggregate */}
              <div className="space-y-1">
                <div className="text-xs text-zinc-500">Aggregate Score</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-zinc-400">
                      {version1.metrics.aggregate.toFixed(2)}
                    </span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-sm font-mono text-primary font-semibold">
                      {version2.metrics.aggregate.toFixed(2)}
                    </span>
                  </div>
                  {renderMetricChange(metricDiffs.aggregate)}
                </div>
              </div>

              {/* Relevance */}
              <div className="space-y-1">
                <div className="text-xs text-zinc-500">Relevance</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-zinc-400">
                      {version1.metrics.relevance.toFixed(2)}
                    </span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-sm font-mono text-white">
                      {version2.metrics.relevance.toFixed(2)}
                    </span>
                  </div>
                  {renderMetricChange(metricDiffs.relevance)}
                </div>
              </div>

              {/* Accuracy */}
              <div className="space-y-1">
                <div className="text-xs text-zinc-500">Accuracy</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-zinc-400">
                      {version1.metrics.accuracy.toFixed(2)}
                    </span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-sm font-mono text-white">
                      {version2.metrics.accuracy.toFixed(2)}
                    </span>
                  </div>
                  {renderMetricChange(metricDiffs.accuracy)}
                </div>
              </div>

              {/* Consistency */}
              <div className="space-y-1">
                <div className="text-xs text-zinc-500">Consistency</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-zinc-400">
                      {version1.metrics.consistency.toFixed(2)}
                    </span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-sm font-mono text-zinc-300">
                      {version2.metrics.consistency.toFixed(2)}
                    </span>
                  </div>
                  {renderMetricChange(metricDiffs.consistency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technique Comparison */}
        {version1 && version2 && (
          <div className="glass-elevated rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-zinc-300">Techniques Used</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-zinc-500">Version 1</div>
                <div className="flex flex-wrap gap-1.5">
                  {version1.techniques.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-700 text-zinc-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-zinc-500">Version 2</div>
                <div className="flex flex-wrap gap-1.5">
                  {version2.techniques.map((tech) => (
                    <span
                      key={tech}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium rounded-full",
                        version1.techniques.includes(tech)
                          ? "bg-zinc-700 text-zinc-300"
                          : "bg-primary/10 text-primary border border-primary/30"
                      )}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Prompt Comparison */}
        {showFullPrompts && version1 && version2 && (
          <div className="glass-elevated rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-zinc-300">Prompt Comparison</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-zinc-500">Version 1 Prompt</div>
                <div className="bg-background/50 p-3 rounded border border-zinc-700/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <pre className="text-xs text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">
                    {version1.prompt_version}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-zinc-500">Version 2 Prompt</div>
                <div className="bg-background/50 p-3 rounded border border-zinc-700/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <pre className="text-xs text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">
                    {version2.prompt_version}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Winner Indicator */}
        {version1 && version2 && metricDiffs && (
          <div className={cn(
            "p-3 rounded-lg border-2 text-center",
            metricDiffs.aggregate > 0.5
              ? "border-primary/50 bg-primary/5"
              : metricDiffs.aggregate < -0.5
              ? "border-red-500/50 bg-red-500/5"
              : "border-zinc-700 bg-elevated/30"
          )}>
            <div className="text-sm font-semibold">
              {metricDiffs.aggregate > 0.5 ? (
                <span className="text-primary">
                  Version 2 performs {metricDiffs.aggregate.toFixed(1)} points better
                </span>
              ) : metricDiffs.aggregate < -0.5 ? (
                <span className="text-red-400">
                  Version 1 performs {Math.abs(metricDiffs.aggregate).toFixed(1)} points better
                </span>
              ) : (
                <span className="text-zinc-400">
                  Performance is similar (±{Math.abs(metricDiffs.aggregate).toFixed(1)} points)
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

