/**
 * Zustand store for optimization state management.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Framework,
  Technique,
  LLMParameters,
  DatasetConfig,
  IterationResult,
  OptimizationComplete,
} from "@/lib/types";

/**
 * Optimization state interface.
 */
interface OptimizationState {
  // Input State
  prompt: string;
  framework: Framework;
  techniques: Technique[];
  parameters: LLMParameters;
  datasetConfig: DatasetConfig;
  iterationCount: number; // 1-3 iterations

  // Optimization State
  isOptimizing: boolean;
  currentIteration: number;
  totalIterations: number;
  iterations: IterationResult[];
  bestVersion: number | null;
  completedResult: OptimizationComplete | null;
  
  // Detailed Progress Tracking
  currentStep: string;
  testProgress: { current: number; total: number } | null;
  currentTechnique: string | null;
  datasetInfo: { count: number; domain: string } | null;

  // UI State
  activeTab: "input" | "progress" | "results";
  selectedVersions: [number, number]; // For comparison

  // Actions
  setPrompt: (prompt: string) => void;
  setFramework: (framework: Framework) => void;
  toggleTechnique: (technique: Technique) => void;
  updateParameters: (params: Partial<LLMParameters>) => void;
  updateDatasetConfig: (config: Partial<DatasetConfig>) => void;
  setIterationCount: (count: number) => void;

  startOptimization: () => void;
  setTotalIterations: (total: number) => void;
  setCurrentStep: (step: string) => void;
  setTestProgress: (current: number, total: number) => void;
  setCurrentTechnique: (technique: string | null) => void;
  setDatasetInfo: (count: number, domain: string) => void;
  updateIteration: (iteration: IterationResult) => void;
  completeOptimization: (result: OptimizationComplete) => void;
  resetOptimization: () => void;
  setBestVersion: (iteration: number) => void;

  setActiveTab: (tab: "input" | "progress" | "results") => void;
  setSelectedVersions: (versions: [number, number]) => void;
}

/**
 * Default LLM parameters.
 */
const DEFAULT_PARAMETERS: LLMParameters = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 16000, // High default for modern models
  model: "gpt-oss-120b", // Fast model with ~500 TPS throughput
};

/**
 * Default dataset configuration.
 */
const DEFAULT_DATASET_CONFIG: DatasetConfig = {
  example_count: 15,
  difficulty_levels: ["easy", "medium", "hard"],
};

/**
 * Create optimization store with persistence.
 */
export const useOptimizationStore = create<OptimizationState>()(
  persist(
    (set) => ({
      // Initial State
      prompt: "",
      framework: Framework.RACE,
      techniques: [Technique.RSIP],
      parameters: DEFAULT_PARAMETERS,
      datasetConfig: DEFAULT_DATASET_CONFIG,
      iterationCount: 1, // Default to 1 iteration for speed

      isOptimizing: false,
      currentIteration: 0,
      totalIterations: 1,
      iterations: [],
      bestVersion: null,
      completedResult: null,
      
      currentStep: "",
      testProgress: null,
      currentTechnique: null,
      datasetInfo: null,

      activeTab: "input",
      selectedVersions: [0, 1],

      // Actions
      setPrompt: (prompt) => set({ prompt }),
      
      setFramework: (framework) => set({ framework }),
      
      toggleTechnique: (technique) =>
        set((state) => ({
          techniques: state.techniques.includes(technique)
            ? state.techniques.filter((t) => t !== technique)
            : [...state.techniques, technique],
        })),

      updateParameters: (params) =>
        set((state) => ({
          parameters: { ...state.parameters, ...params },
        })),

      updateDatasetConfig: (config) =>
        set((state) => ({
          datasetConfig: { ...state.datasetConfig, ...config },
        })),

      setIterationCount: (count) =>
        set({ iterationCount: Math.min(3, Math.max(1, count)) }), // Clamp between 1-3

      startOptimization: () => {
        console.log("🟢 [Store] startOptimization called");
        set({
          isOptimizing: true,
          currentIteration: 0,
          totalIterations: 1,
          iterations: [],
          bestVersion: null,
          completedResult: null,
          currentStep: "Starting optimization...",
          testProgress: null,
          currentTechnique: null,
          datasetInfo: null,
          activeTab: "progress",
        });
        console.log("🟢 [Store] State updated to isOptimizing: true");
      },

      setTotalIterations: (total) => set({ totalIterations: total }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setTestProgress: (current, total) =>
        set({ testProgress: { current, total } }),

      setCurrentTechnique: (technique) => set({ currentTechnique: technique }),

      setDatasetInfo: (count, domain) =>
        set({ datasetInfo: { count, domain } }),

      updateIteration: (iteration) =>
        set((state) => ({
          currentIteration: iteration.iteration,
          iterations: [...state.iterations, iteration],
        })),

      setBestVersion: (iteration) => set({ bestVersion: iteration }),

      completeOptimization: (result) =>
        set({
          isOptimizing: false,
          bestVersion: result.best_version,
          completedResult: result,
          currentStep: "Optimization complete!",
          activeTab: "results",
        }),

      resetOptimization: () =>
        set({
          isOptimizing: false,
          currentIteration: 0,
          totalIterations: 1,
          iterations: [],
          bestVersion: null,
          completedResult: null,
          currentStep: "",
          testProgress: null,
          currentTechnique: null,
          datasetInfo: null,
        }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setSelectedVersions: (versions) => set({ selectedVersions: versions }),
    }),
    {
      name: "powerprompts-storage",
      partialize: (state) => ({
        // Only persist input configuration, not optimization results
        prompt: state.prompt,
        framework: state.framework,
        techniques: state.techniques,
        parameters: state.parameters,
      }),
    }
  )
);

