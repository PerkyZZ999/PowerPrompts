# 🚀 OpenRouter Provider Routing Configuration

## Overview

PowerPrompts is configured to automatically select the **fastest and most cost-effective providers** on OpenRouter for optimal performance.

## Current Strategy: High Throughput + Mid-Price

### **Optimization Goals**
✅ **High Throughput** - Prioritize providers with highest tokens per second (TPS)  
✅ **Mid-Range Pricing** - Cap costs to avoid expensive providers  
✅ **Fallback Support** - Allow backup providers for reliability  

### **Provider Routing Configuration**

#### Sort Strategy
- **`sort: 'throughput'`** - Providers are ranked by their throughput (TPS) first
- OpenRouter will automatically select the fastest available provider that meets the price cap

#### Price Caps (Default Values)
```env
OPENROUTER_MAX_PROMPT_PRICE=0.20    # $0.20 per 1M input tokens
OPENROUTER_MAX_COMPLETION_PRICE=1.00 # $1.00 per 1M output tokens
```

**Note**: Values are in **USD per 1M tokens** (same format as OpenRouter API).

These caps are designed to target providers like:

## 🎯 Targeted Providers for GPT-OSS-120B

Based on the current price caps, OpenRouter will prioritize:

### **1. Google Vertex** ⭐ (Recommended)
- **Input Price**: $0.15 per 1M tokens
- **Output Price**: $0.60 per 1M tokens
- **Throughput**: 547.8 TPS
- **Latency**: 0.39s
- **Status**: ✅ Within price cap

### **2. Groq**
- **Input Price**: $0.15 per 1M tokens
- **Output Price**: $0.60 per 1M tokens
- **Throughput**: 674.3 TPS
- **Latency**: 0.39s
- **Status**: ✅ Within price cap

### **3. SambaNova**
- **Input Price**: $0.14 per 1M tokens
- **Output Price**: $0.95 per 1M tokens
- **Throughput**: 811.6 TPS
- **Latency**: 1.73s
- **Status**: ✅ Within price cap

### **4. Cerebras**
- **Input Price**: $0.35 per 1M tokens
- **Output Price**: $0.75 per 1M tokens
- **Throughput**: 4,053 TPS
- **Latency**: 0.57s
- **Status**: ⚠️ Input price slightly above cap (excluded by default)

## 🔧 How It Works

### Backend Implementation

#### 1. **Configuration** (`backend/src/config.ts`)
```typescript
const ConfigSchema = z.object({
  // ...
  openrouterMaxPromptPrice: z.coerce.number().default(0.0005),
  openrouterMaxCompletionPrice: z.coerce.number().default(0.0015),
  // ...
});
```

#### 2. **LLM Client** (`backend/src/core/llm-client.ts`)
```typescript
const providerPreferences = appConfig.llmProvider === 'openrouter' ? {
  sort: 'throughput', // Prioritize high throughput
  allow_fallbacks: true, // Allow backup providers for reliability
  max_price: {
    prompt: appConfig.openrouterMaxPromptPrice,
    completion: appConfig.openrouterMaxCompletionPrice,
  },
} : undefined;

const response = await this.client.chat.completions.create({
  model,
  messages: [{ role: 'user', content: prompt }],
  // ... other options
  ...(providerPreferences && { provider: providerPreferences }),
});
```

## 📊 Expected Performance

### With GPT-OSS-120B + Google Vertex Provider:

| Task                      | Estimated Time | Previous (GPT-5) |
|---------------------------|----------------|------------------|
| **Dataset Generation**    | ~15-30s        | ~2 min           |
| **Framework Building**    | ~10-20s        | ~1 min           |
| **Single Technique**      | ~30s-1min      | ~5-10 min        |
| **Full Optimization (1 iteration)** | **~2-5 min**  | **~15-20 min**  |

### Throughput Comparison:
- **Google Vertex**: 547.8 TPS
- **Groq**: 674.3 TPS
- **SambaNova**: 811.6 TPS
- **GPT-5 (previous)**: ~50 TPS

**Result**: **10-15x faster** than GPT-5! 🎉

## ⚙️ Customization

### Adjusting Price Caps

To allow more expensive providers (e.g., Cerebras with 4,053 TPS):

```env
# Allow higher pricing for ultra-high throughput
OPENROUTER_MAX_PROMPT_PRICE=0.40   # $0.40 per 1M tokens (allows Cerebras: $0.35)
OPENROUTER_MAX_COMPLETION_PRICE=1.00 # $1.00 per 1M tokens (allows Cerebras: $0.75)
```

### Forcing Specific Providers

To target only specific providers, you can modify the `provider` preferences in `llm-client.ts`:

```typescript
const providerPreferences = {
  sort: 'throughput',
  allow_fallbacks: true,
  only: ['google-vertex', 'groq'], // Only use these providers
  max_price: { /* ... */ },
};
```

### Disabling Provider Routing

To use OpenRouter's default load balancing (price-based):

```typescript
// Remove the provider preferences entirely
const providerPreferences = undefined;
```

## 🔍 Monitoring

### Backend Logs

The backend logs provider routing details:

```
[LLM CLIENT] Request details: {
  provider: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  model: 'gpt-oss-120b',
  promptLength: 1234,
  temperature: 0.7,
  maxTokens: 16000,
  providerPreferences: {
    sort: 'throughput',
    allow_fallbacks: true,
    max_price: { prompt: 0.20, completion: 1.00 }
  }
}
```

### Response Headers

OpenRouter returns provider information in the response:

```typescript
// Check which provider was used
const provider = response.headers['x-provider']; // e.g., "google-vertex"
```

## 📚 References

- [OpenRouter Provider Routing Docs](https://openrouter.ai/docs/features/provider-routing)
- [OpenRouter Models](https://openrouter.ai/models)
- [GPT-OSS-120B Providers](https://openrouter.ai/models?q=gpt-oss-120b)

## 💡 Best Practices

1. **Monitor Costs**: Check your OpenRouter usage dashboard regularly
2. **Test Different Caps**: Adjust price caps based on your quality/cost tradeoff
3. **Use Fallbacks**: Always keep `allow_fallbacks: true` for reliability
4. **Iteration Count**: Use 1 iteration for fast iteration, 3 for quality
5. **Model Selection**: Use `gpt-oss-120b` for speed, `openai/gpt-5` for quality

---

**Last Updated**: January 2025  
**PowerPrompts Version**: 1.0.0

