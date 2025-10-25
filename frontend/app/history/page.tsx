/**
 * Optimization History Page
 * View all past optimizations with metrics and prompts
 */

"use client";

import { useState, useEffect } from "react";
import {
  History,
  Copy,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  original_prompt: string;
  framework: string;
  techniques: string[];
  created_at: string;
  best_score: number;
  total_iterations: number;
  duration_seconds: number;
}

interface HistoryDetail extends HistoryItem {
  versions: Array<{
    iteration: number;
    prompt: string;
    metrics: {
      relevance: number;
      accuracy: number;
      consistency: number;
      efficiency: number;
      readability: number;
      aggregate_score: number;
    };
    created_at: string;
  }>;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

      const response = await fetch(`${apiUrl}/api/history`, {
        headers: {
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load optimization history");
      toast.error("Error", "Failed to load optimization history", 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

      const response = await fetch(`${apiUrl}/api/history/${id}`, {
        headers: {
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch optimization detail");
      }

      const data = await response.json();
      setSelectedItem(data);
    } catch (err) {
      console.error("Error fetching detail:", err);
      toast.error("Error", "Failed to load optimization details", 3000);
    }
  };

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Copied!", "Prompt copied to clipboard", 2000);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-center">
          <History className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Loading optimization history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="glass border-b border-zinc-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-zinc-400 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-white font-space-grotesk">
                  Optimization History
                </h1>
              </div>
            </div>
            <div className="text-sm text-zinc-400">
              {history.length} optimization{history.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History List */}
          <div className="lg:col-span-1 space-y-4">
            {history.length === 0 ? (
              <div className="glass p-8 rounded-lg border border-zinc-700/50 text-center">
                <History className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">
                  No optimization history yet
                </p>
                <p className="text-sm text-zinc-600">
                  Run your first optimization to see it here
                </p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => fetchDetail(item.id)}
                  className={cn(
                    "w-full glass p-4 rounded-lg border transition-all text-left",
                    selectedItem?.id === item.id
                      ? "border-primary bg-primary/5"
                      : "border-zinc-700/50 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {item.original_prompt.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        selectedItem?.id === item.id
                          ? "text-primary"
                          : "text-zinc-600",
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-mono text-white">
                        {item.best_score.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">
                        {item.duration_seconds.toFixed(0)}s
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                      {item.framework}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {!selectedItem ? (
              <div className="glass p-12 rounded-lg border border-zinc-700/50 text-center">
                <History className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">
                  Select an optimization from the list to view details
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Original Prompt */}
                <div className="glass p-6 rounded-lg border border-zinc-700/50">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Original Prompt
                  </h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    {selectedItem.original_prompt}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400">
                      {selectedItem.framework}
                    </span>
                    {selectedItem.techniques.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-primary/10 rounded-full text-xs text-primary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Versions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">
                    All Iterations
                  </h3>
                  {selectedItem.versions
                    .sort((a, b) => a.iteration - b.iteration)
                    .map((version) => (
                      <div
                        key={version.iteration}
                        className="glass p-4 rounded-lg border border-zinc-700/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium">
                              Iteration {version.iteration}
                            </h4>
                            <p className="text-xs text-zinc-500 mt-1">
                              Score:{" "}
                              {version.metrics.aggregate_score.toFixed(1)}/100
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleCopyPrompt(
                                version.prompt,
                                `${selectedItem.id}-${version.iteration}`,
                              )
                            }
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm"
                          >
                            {copiedId ===
                            `${selectedItem.id}-${version.iteration}` ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="px-2 py-1 bg-zinc-800/50 rounded text-xs">
                            <span className="text-zinc-500">Relevance</span>
                            <span className="float-right text-white font-mono">
                              {version.metrics.relevance.toFixed(0)}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-zinc-800/50 rounded text-xs">
                            <span className="text-zinc-500">Accuracy</span>
                            <span className="float-right text-white font-mono">
                              {version.metrics.accuracy.toFixed(0)}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-zinc-800/50 rounded text-xs">
                            <span className="text-zinc-500">Consistency</span>
                            <span className="float-right text-white font-mono">
                              {version.metrics.consistency.toFixed(0)}
                            </span>
                          </div>
                        </div>

                        {/* Prompt Preview */}
                        <div className="p-3 bg-zinc-900/50 rounded border border-zinc-700/30 max-h-96 overflow-y-auto custom-scrollbar">
                          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                            {version.prompt}
                          </pre>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
