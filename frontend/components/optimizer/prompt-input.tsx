/**
 * Prompt input component with character counter and neon effects.
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOptimization } from "@/hooks/use-optimization";
import { Play, StopCircle, X, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { toast } from "@/stores/toast-store";

const EXAMPLE_PROMPTS = [
  "Explain quantum computing to a 10-year-old",
  "Write a product description for an eco-friendly water bottle",
  "Create a Python function to calculate Fibonacci numbers",
  "Summarize the key principles of effective leadership",
  "Design a beginner-friendly workout plan for busy professionals"
];

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function PromptInput() {
  const prompt = useOptimizationStore((state) => state.prompt);
  const setPrompt = useOptimizationStore((state) => state.setPrompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  
  const { startOptimization, stopOptimization, isOptimizing } = useOptimization();
  
  // Debug: Log hook values on mount
  useEffect(() => {
    console.log("🔷 [PromptInput] Component mounted");
    console.log("  - startOptimization:", typeof startOptimization);
    console.log("  - isOptimizing:", isOptimizing);
  }, []);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('powerprompts-draft-prompt');
    if (draft && !prompt) {
      setPrompt(draft);
    }
  }, []);

  // Debounced autosave to localStorage
  const debouncedSave = useMemo(
    () => debounce((value: string) => {
      localStorage.setItem('powerprompts-draft-prompt', value);
    }, 500),
    []
  );

  // Handle prompt change with autosave and validation
  const handlePromptChange = useCallback((value: string) => {
    setPrompt(value);
    debouncedSave(value);
    
    // Validate
    if (value.length > 0 && value.length < 10) {
      setValidationError("Prompt must be at least 10 characters long");
    } else if (value.length > 5000) {
      setValidationError("Prompt must not exceed 5000 characters");
    } else {
      setValidationError(null);
    }
  }, [setPrompt, debouncedSave]);

  // Clear prompt and localStorage
  const handleClear = () => {
    setPrompt("");
    localStorage.removeItem('powerprompts-draft-prompt');
    setValidationError(null);
    toast.info("Prompt Cleared", "Your draft has been cleared", 2000);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Keyboard shortcuts (Ctrl+Enter / Cmd+Enter to start optimization)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (prompt.trim() && !validationError && !isOptimizing) {
          startOptimization();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, validationError, isOptimizing, startOptimization]);

  // Rotate example prompts every 5 seconds when empty
  useEffect(() => {
    if (!prompt) {
      const interval = setInterval(() => {
        setExampleIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [prompt]);

  const handleStart = () => {
    console.log("🔵 [PromptInput] Button clicked!");
    console.log("  - Prompt length:", prompt.length);
    console.log("  - Has validation error:", !!validationError);
    console.log("  - Is optimizing:", isOptimizing);
    
    if (prompt.trim() && !validationError) {
      console.log("✅ [PromptInput] Validation passed, calling startOptimization...");
      startOptimization();
    } else {
      console.warn("❌ [PromptInput] Validation failed:");
      console.warn("  - Prompt empty?", !prompt.trim());
      console.warn("  - Validation error:", validationError);
    }
  };

  const characterCount = prompt.length;
  const maxCharacters = 5000;
  const isInvalid = validationError !== null;

  return (
    <Card variant="glass" className="relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-radial-glow opacity-20 pointer-events-none"></div>

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow"></div>
            Input Prompt
          </span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono ${isInvalid ? 'text-red-400' : 'text-zinc-500'}`}>
              {characterCount} / {maxCharacters}
            </span>
            {prompt && (
              <button
                onClick={handleClear}
                disabled={isOptimizing}
                className="p-1.5 hover:bg-elevated rounded-lg transition-colors disabled:opacity-50"
                title="Clear prompt"
              >
                <X className="w-4 h-4 text-zinc-400 hover:text-white" />
              </button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder={prompt ? "" : `e.g., ${EXAMPLE_PROMPTS[exampleIndex]}`}
            className={`w-full min-h-[120px] max-h-[300px] p-4 bg-elevated/50 border ${
              isInvalid ? 'border-red-500/50' : 'border-zinc-700'
            } rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 ${
              isInvalid ? 'focus:ring-red-500/50 focus:border-red-500/50' : 'focus:ring-primary/50 focus:border-primary/50'
            } transition-all resize-none font-mono text-sm`}
            maxLength={maxCharacters}
            disabled={isOptimizing}
          />
          
          {/* Neon border on focus */}
          <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 transition-opacity duration-200 peer-focus:opacity-100 neon-border"></div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Start/Stop Button */}
        <Button
          onClick={isOptimizing ? stopOptimization : handleStart}
          disabled={(!prompt.trim() || isInvalid) && !isOptimizing}
          variant="primary"
          size="lg"
          className="w-full font-semibold"
        >
          {isOptimizing ? (
            <>
              <StopCircle className="w-5 h-5 mr-2" />
              Stop Optimization
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Optimization
            </>
          )}
        </Button>

        {/* Helper text */}
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <span className="text-primary font-semibold">Tip:</span> Be specific about your use case and desired outcome for best results.
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Press <kbd className="px-1.5 py-0.5 bg-elevated border border-zinc-700 rounded text-zinc-400 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-elevated border border-zinc-700 rounded text-zinc-400 font-mono text-[10px]">Enter</kbd> to start optimization
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

