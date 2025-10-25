/**
 * Main optimizer page with high-tech AI layout.
 */

"use client";

import { PromptInput } from "@/components/optimizer/prompt-input";
import { FrameworkSelector } from "@/components/optimizer/framework-selector";
import { TechniqueToggles } from "@/components/optimizer/technique-toggles";
import { ModelSelector } from "@/components/optimizer/model-selector";
import { IterationSelector } from "@/components/optimizer/iteration-selector";
import { OptimizationProgress } from "@/components/optimizer/optimization-progress";
import { MetricsDashboard } from "@/components/optimizer/metrics-dashboard";
import { VersionComparison } from "@/components/optimizer/version-comparison";
import { ExportPanel } from "@/components/optimizer/export-panel";
import { Sparkles, BarChart3, GitCompare, Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ResultTab = "metrics" | "comparison" | "export";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ResultTab>("metrics");
  return (
    <main className="min-h-screen bg-background grid-bg">
      {/* High-Tech Header with Glassmorphism */}
      <header className="glass border-b border-zinc-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-primary animate-pulse-glow" />
                <div className="absolute inset-0 blur-md bg-primary/30 animate-pulse-glow"></div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight font-space-grotesk">
                <span className="neon-text">POWER</span>
                <span className="text-white">PROMPTS</span>
              </h1>
            </div>

            {/* Navigation & Version */}
            <div className="flex items-center gap-4">
              <a
                href="/history"
                className="text-zinc-400 hover:text-primary transition-colors text-sm font-medium"
              >
                History
              </a>
              <div className="glass-elevated px-3 py-1.5 rounded-lg">
                <span className="text-xs text-white uppercase tracking-wider font-semibold">
                  AI Optimizer
                </span>
                <span className="ml-2 text-xs text-primary font-mono">
                  v1.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated scan line effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input Configuration */}
          <div className="space-y-6">
            <PromptInput />
            <FrameworkSelector />
            <TechniqueToggles />
            <ModelSelector />
            <IterationSelector />
          </div>

          {/* Middle Column: Live Progress */}
          <div>
            <OptimizationProgress />
          </div>

          {/* Right Column: Results with Tabs */}
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="glass rounded-xl p-2 flex gap-2">
              <button
                onClick={() => setActiveTab("metrics")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                  activeTab === "metrics"
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-neon-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-elevated/50",
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Metrics
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                  activeTab === "comparison"
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-neon-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-elevated/50",
                )}
              >
                <GitCompare className="w-4 h-4" />
                Compare
              </button>
              <button
                onClick={() => setActiveTab("export")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                  activeTab === "export"
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-neon-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-elevated/50",
                )}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              {activeTab === "metrics" && <MetricsDashboard />}
              {activeTab === "comparison" && <VersionComparison />}
              {activeTab === "export" && <ExportPanel />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
