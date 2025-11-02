/**
 * Metrics Dashboard Component
 * Displays optimization results with best prompt and detailed metrics
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import {
  BarChart3,
  Copy,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

export function MetricsDashboard() {
  const { completedResult, bestVersion, iterations } = useOptimizationStore();
  const [copied, setCopied] = useState(false);

  if (!completedResult || iterations.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">
          No optimization results yet.
          <br />
          Start an optimization to see metrics.
        </p>
      </div>
    );
  }

  const bestIteration = iterations.find(
    (iter) => iter.iteration === bestVersion,
  );
  if (!bestIteration) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bestIteration.prompt);
    setCopied(true);
    toast.success("Copied!", "Optimized prompt copied to clipboard", 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  const metrics = bestIteration.metrics;

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/30">
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Best Result</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Iteration {bestVersion}</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {metrics.aggregate.toFixed(1)}
              <span className="text-lg text-zinc-400">/100</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Total Time</p>
            <p className="text-lg font-semibold text-white mt-1">
              {completedResult.total_duration_seconds.toFixed(1)}s
            </p>
          </div>
        </div>
      </div>

      {/* Optimized Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-zinc-400">
            Optimized Prompt
          </h4>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700/30 max-h-60 overflow-y-auto custom-scrollbar">
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
            {bestIteration.prompt}
          </pre>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-zinc-400">Detailed Metrics</h4>
        <div className="space-y-2">
          {/* Relevance */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Relevance</span>
              <span className="text-white font-mono font-semibold">
                {metrics.relevance.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${metrics.relevance}%` }}
              />
            </div>
          </div>

          {/* Accuracy */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Accuracy</span>
              <span className="text-white font-mono font-semibold">
                {metrics.accuracy.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${metrics.accuracy}%` }}
              />
            </div>
          </div>

          {/* Consistency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Consistency</span>
              <span className="text-white font-mono font-semibold">
                {metrics.consistency.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${metrics.consistency}%` }}
              />
            </div>
          </div>

          {/* Efficiency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Efficiency</span>
              <span className="text-white font-mono font-semibold">
                {metrics.efficiency.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${metrics.efficiency}%` }}
              />
            </div>
          </div>

          {/* Readability */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Readability</span>
              <span className="text-white font-mono font-semibold">
                {metrics.readability.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-all duration-500"
                style={{ width: `${metrics.readability}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Iteration Comparison */}
      {iterations.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-400">All Iterations</h4>
          <div className="space-y-2">
            {iterations.map((iter) => (
              <div
                key={iter.iteration}
                className={`p-3 rounded-lg border transition-all ${
                  iter.iteration === bestVersion
                    ? "bg-primary/10 border-primary/50"
                    : "bg-zinc-900/30 border-zinc-700/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {iter.iteration === bestVersion && (
                      <Sparkles className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-white font-medium">
                      Iteration {iter.iteration}
                    </span>
                  </div>
                  <span className="font-mono text-white font-semibold">
                    {iter.metrics.aggregate.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Techniques Used */}
      {bestIteration.techniques.length > 0 && (
        <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-700/30">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">
            Techniques Applied
          </h4>
          <div className="flex flex-wrap gap-2">
            {bestIteration.techniques.map((technique) => (
              <span
                key={technique}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {technique.replace("_", " ").toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
