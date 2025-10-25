# 🚀 Optimization Performance Fix

## Issues Fixed

### **Issue 1: Too Many Dataset Examples Evaluated** ❌ → ✅

**Before**: Evaluated **all 15-17 examples** from the generated dataset  
**After**: Evaluate **5 randomly sampled examples** for speed

**Impact**: **3x faster evaluation** (5 examples vs 15+)

---

### **Issue 2: Self-Consistency Running for Every Example** ⚠️

**Behavior**: This is **EXPECTED** when self-consistency technique is enabled!

When you select **Self-Consistency**, it runs **3 LLM calls per example** to generate multiple reasoning paths and select the best one.

**Math**:

- **5 sampled examples** × **3 paths** = **15 LLM calls** for execution
- Plus **5 evaluation calls** (relevance, accuracy, readability) = **~20 total calls per iteration**

**Before (15 examples)**:

- 15 examples × 3 paths = **45 execution calls**
- Plus 15 evaluation calls = **~60 total calls** 😱

**After (5 examples)**:

- 5 examples × 3 paths = **15 execution calls**
- Plus 5 evaluation calls = **~20 total calls** ✅

---

## Performance Improvements

### **With Self-Consistency Enabled:**

| Metric                     | Before     | After        | Improvement    |
| -------------------------- | ---------- | ------------ | -------------- |
| **Examples Evaluated**     | 15-17      | 5            | **3x fewer**   |
| **Self-Consistency Calls** | 45-51      | 15           | **3x fewer**   |
| **Total LLM Calls**        | ~60-70     | ~20-25       | **~3x fewer**  |
| **Estimated Time**         | ~10-15 min | **~3-5 min** | **~3x faster** |

### **With Only CoT (No Self-Consistency):**

| Metric                 | Before   | After        | Improvement    |
| ---------------------- | -------- | ------------ | -------------- |
| **Examples Evaluated** | 15-17    | 5            | **3x fewer**   |
| **Execution Calls**    | 15-17    | 5            | **3x fewer**   |
| **Total LLM Calls**    | ~20-25   | ~10          | **~2x fewer**  |
| **Estimated Time**     | ~5-7 min | **~2-3 min** | **~2x faster** |

---

## Understanding Self-Consistency

### What It Does:

Self-consistency generates **multiple reasoning paths** (typically 3) for the same input and selects the most consistent answer. This improves accuracy but increases LLM calls.

### When to Use:

- ✅ **Complex reasoning tasks** where accuracy is critical
- ✅ **Math problems** or logic puzzles
- ✅ **Tasks with multiple valid approaches**

### When to Skip:

- ❌ **Simple prompts** that don't need multiple paths
- ❌ **Time-sensitive optimization** (use CoT only)
- ❌ **Cost-sensitive scenarios** (3x more LLM calls)

---

## Optimization Techniques Comparison

### **Chain-of-Thought (CoT)** 💭

- **LLM Calls**: 1 per example
- **Speed**: Fast ⚡
- **Use Case**: Forces step-by-step reasoning
- **Best For**: Most prompts, general reasoning

### **Self-Consistency** 🎯

- **LLM Calls**: 3 per example (3x CoT)
- **Speed**: Moderate 🐢
- **Use Case**: Multiple paths, select best
- **Best For**: Complex reasoning, math, logic

### **Tree of Thoughts (ToT)** 🌳

- **LLM Calls**: Many (depends on tree depth)
- **Speed**: Slow 🐌
- **Use Case**: Explore multiple solution branches
- **Best For**: Planning, search problems

### **RSIP (Recursive Self-Improvement)** 🔄

- **LLM Calls**: 2 per iteration (critique + improve)
- **Speed**: Fast per iteration ⚡
- **Use Case**: Iterative improvement based on metrics
- **Best For**: Progressive prompt refinement

---

## Recommended Configurations

### **Fast Iteration** ⚡ (2-3 minutes)

```
Framework: RACE or COSTAR
Techniques: CoT only
Iterations: 1
Examples: 5 (default)
```

### **Balanced** ⚖️ (3-5 minutes)

```
Framework: RACE or COSTAR
Techniques: CoT + RSIP
Iterations: 2
Examples: 5 (default)
```

### **High Quality** 🔥 (5-10 minutes)

```
Framework: RACE or COSTAR
Techniques: CoT + Self-Consistency + RSIP
Iterations: 3
Examples: 5 (default)
```

### **Maximum Quality** 💎 (10-15 minutes)

```
Framework: RACE or CREATE
Techniques: CoT + Self-Consistency + ToT + RSIP
Iterations: 3
Examples: 5 (default)
```

---

## What Changed in the Code

### **1. Sample Size Reduction**

```typescript
// Before: Use all examples
for (const example of dataset.examples) { ... }

// After: Sample 5 random examples
const sampleSize = Math.min(5, dataset.examples.length);
const sampledExamples = dataset.examples
  .sort(() => Math.random() - 0.5)
  .slice(0, sampleSize);

for (const example of sampledExamples) { ... }
```

### **2. Added Progress Logging**

```typescript
console.log(
  `[OPTIMIZATION] Evaluating ${sampleSize} sampled examples (out of ${dataset.examples.length} total)`,
);
console.log(`[OPTIMIZATION] Executing example ${i + 1}/${sampleSize}...`);
console.log(
  `[OPTIMIZATION] Applying self-consistency (3 paths) for example ${i + 1}...`,
);
```

---

## Expected Behavior

### **With Self-Consistency + CoT:**

```
[OPTIMIZATION] === Iteration 1/1 ===
[OPTIMIZATION] Evaluating 5 sampled examples (out of 15 total)

[OPTIMIZATION] Executing example 1/5...
[OPTIMIZATION] Applying self-consistency (3 paths) for example 1...
[TECHNIQUE] Applying Self-Consistency with 3 paths...
[LLM CLIENT] Attempting completion... (1/3)
[LLM CLIENT] Attempting completion... (2/3)
[LLM CLIENT] Attempting completion... (3/3)
[TECHNIQUE] Generated 3 paths, selecting best...

[OPTIMIZATION] Executing example 2/5...
[OPTIMIZATION] Applying self-consistency (3 paths) for example 2...
...

[OPTIMIZATION] Evaluating iteration...
[EVALUATOR] Evaluating 5 examples...
```

**Total**: 15 execution calls + 5 evaluation calls = **~20 LLM calls** ✅

---

## Cost Estimates (OpenRouter)

Using **gpt-oss-120b** with **Google Vertex** ($0.15 input / $0.60 output):

### **Before (15 examples, self-consistency)**:

- ~60-70 LLM calls
- Average ~10K tokens per call
- **Estimated cost**: ~$0.30-0.50 per optimization

### **After (5 examples, self-consistency)**:

- ~20-25 LLM calls
- Average ~10K tokens per call
- **Estimated cost**: **~$0.10-0.15 per optimization** 💰

**Savings**: **~70% cost reduction!** 🎉

---

## Next Steps

1. **Start Backend** - Backend should auto-reload with the fixes
2. **Test Optimization** - Try with CoT only first (fastest)
3. **Try Self-Consistency** - Test with CoT + Self-Consistency
4. **Monitor Logs** - Watch for the new sample size logging

---

**Last Updated**: January 2025  
**PowerPrompts Version**: 1.0.0
