/**
 * Model Selector Component
 * Allows users to select the LLM model for optimization
 * Models are fetched from the backend API (/api/models)
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import { ChevronDown, Sparkles, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Model interface (matches backend)
 */
interface Model {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Fallback models if API fails
 */
const FALLBACK_MODELS: Model[] = [
  {
    id: "gpt-5-2025-08-07",
    name: "GPT-5",
    description: "Most capable model for complex tasks",
    category: "Flagship",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "High-intelligence flagship model",
    category: "GPT-4",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Affordable and intelligent small model",
    category: "GPT-4",
  },
];

export function ModelSelector() {
  const { parameters, updateParameters, isOptimizing } = useOptimizationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<Model[]>(FALLBACK_MODELS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch models from backend
  useEffect(() => {
    async function fetchModels() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

        const response = await fetch(`${apiUrl}/api/models`, {
          headers: {
            "X-API-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
        } else {
          setModels(FALLBACK_MODELS);
        }

        setError(null);
      } catch (err) {
        console.error("[ModelSelector] Failed to fetch models:", err);
        setError("Using fallback models");
        setModels(FALLBACK_MODELS);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  const selectedModel = models.find((m) => m.id === parameters.model);

  const handleSelectModel = (modelId: string) => {
    updateParameters({ model: modelId });
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#bfff45]" />
        <label className="text-sm font-medium text-white">LLM Model</label>
        {loading && (
          <span className="text-xs text-[#888888]">(Loading...)</span>
        )}
        {error && (
          <span className="text-xs text-[#ff6b6b]" title={error}>
            <AlertCircle className="w-3 h-3 inline" />
          </span>
        )}
      </div>

      {/* Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isOptimizing}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-[#0a0a0a]/50 backdrop-blur-sm
            border border-[#2a2a2a]
            text-left
            transition-all duration-200
            ${
              isOptimizing
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-[#bfff45]/30 hover:bg-[#0a0a0a]/70 cursor-pointer"
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-white font-medium">
                {selectedModel?.name || "Unknown Model"}
              </div>
              <div className="text-[#888888] text-xs mt-1">
                {selectedModel?.description || parameters.model}
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#888888] transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && !isOptimizing && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div
              className="
                absolute top-full left-0 right-0 mt-2 z-20
                bg-[#0a0a0a]/95 backdrop-blur-xl
                border border-[#2a2a2a]
                rounded-lg
                shadow-2xl
                overflow-hidden
              "
            >
              {models.map((model, index) => (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`
                    w-full px-4 py-3
                    text-left
                    transition-all duration-150
                    hover:bg-[#bfff45]/10
                    ${
                      model.id === parameters.model
                        ? "bg-[#bfff45]/5 border-l-2 border-[#bfff45]"
                        : ""
                    }
                    ${index !== 0 ? "border-t border-[#1a1a1a]" : ""}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            model.id === parameters.model
                              ? "text-[#bfff45]"
                              : "text-white"
                          }`}
                        >
                          {model.name}
                        </span>
                        <span className="text-[#666666] text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a]">
                          {model.category}
                        </span>
                      </div>
                      <div className="text-[#888888] text-xs mt-1">
                        {model.description}
                      </div>
                    </div>
                    {model.id === parameters.model && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#bfff45]" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Model ID Display */}
      <div className="text-xs text-[#666666] font-mono">
        Model ID: {parameters.model}
      </div>
    </div>
  );
}

