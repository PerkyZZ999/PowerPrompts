/**
 * Iteration Selector Component
 * Allows users to configure the number of optimization iterations (1-3)
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import { Zap } from "lucide-react";

const ITERATIONS = [
  {
    value: 1,
    label: "1 Iteration",
    description: "Fastest - Quick single optimization pass",
    time: "~2-5 min",
  },
  {
    value: 2,
    label: "2 Iterations",
    description: "Balanced - Two optimization passes",
    time: "~5-10 min",
  },
  {
    value: 3,
    label: "3 Iterations",
    description: "Thorough - Maximum quality improvement",
    time: "~10-15 min",
  },
];

export function IterationSelector() {
  const { iterationCount, setIterationCount, isOptimizing } = useOptimizationStore();

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#bfff45]" />
        <label className="text-sm font-medium text-white">Optimization Iterations</label>
      </div>

      {/* Description */}
      <p className="text-xs text-[#888888]">
        More iterations improve quality but take longer to complete
      </p>

      {/* Iteration Options */}
      <div className="grid grid-cols-3 gap-2">
        {ITERATIONS.map((iteration) => {
          const isSelected = iterationCount === iteration.value;
          
          return (
            <button
              key={iteration.value}
              onClick={() => setIterationCount(iteration.value)}
              disabled={isOptimizing}
              className={`
                relative px-3 py-3 rounded-lg
                border transition-all duration-200
                ${
                  isSelected
                    ? "border-[#bfff45] bg-[#bfff45]/10"
                    : "border-[#2a2a2a] bg-[#0a0a0a]/50 hover:border-[#bfff45]/30"
                }
                ${isOptimizing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 rounded-full bg-[#bfff45]" />
                </div>
              )}

              {/* Content */}
              <div className="text-left space-y-1">
                <div
                  className={`text-sm font-medium ${
                    isSelected ? "text-[#bfff45]" : "text-white"
                  }`}
                >
                  {iteration.label}
                </div>
                <div className="text-xs text-[#666666]">{iteration.time}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Iteration Details */}
      {iterationCount && (
        <div className="p-3 rounded-lg bg-[#0a0a0a]/50 border border-[#2a2a2a]">
          <p className="text-xs text-[#888888]">
            {ITERATIONS.find((i) => i.value === iterationCount)?.description}
          </p>
        </div>
      )}
    </div>
  );
}

