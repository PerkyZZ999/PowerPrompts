# 🔍 Comprehensive Debugging Checklist

## ✅ Added Extensive Logging Throughout The System

I've added **detailed console logs** at every step from button click to SSE connection!

---

## 🎯 **IMPORTANT: What To Do NOW**

### **1. Hard Refresh Browser**

Press: **`Ctrl + Shift + R`** (Windows) or **`Cmd + Shift + R`** (Mac)

**WHY**: This clears cached JavaScript and ensures new logging code runs

---

### **2. Open Browser Console**

Press: **`F12`** → Click **"Console"** tab

**CLEAR any old logs**: Click the 🚫 icon or press `Ctrl+L`

---

### **3. Load The Page**

You should see when page loads:

```
🔷 [PromptInput] Component mounted
  - startOptimization: function
  - isOptimizing: false
```

**❌ If you DON'T see this:** The component isn't loading correctly. Share screenshot!

---

### **4. Click "Start Optimization"**

You should see this sequence:

```
🔵 [PromptInput] Button clicked!
  - Prompt length: 206
  - Has validation error: false
  - Is optimizing: false
✅ [PromptInput] Validation passed, calling startOptimization...
🟡 [useOptimization] startOptimization called!
📊 [useOptimization] Store state:
  - prompt: "Hello, I would like your help to create a new..."
  - framework: RACE
  - techniques: ["chain_of_thought", "rag"]
  - parameters: {temperature: 0.7, ...}
  - datasetConfig: {example_count: 15, ...}
📦 [useOptimization] Built request: {...}
🚀 [useOptimization] Calling store.startOptimization()...
🟢 [Store] startOptimization called
🟢 [Store] State updated to isOptimizing: true
=== STARTING OPTIMIZATION ===
URL: http://localhost:8000/api/optimize
Request: {...}
🔌 Connecting to SSE: http://localhost:8000/api/optimize
🔑 API Key: ✓ Present
📦 Request Body Length: 432 bytes
📡 Response Status: 200 OK
📋 Response Headers: {...}
SSE connection opened
```

---

## 🔍 **Diagnostic Scenarios**

### **Scenario A: Nothing Happens At All**

**Console shows: (silence, no logs)**

**Possible causes:**

1. Button click not registered
2. JavaScript error preventing execution
3. Component not properly mounted

**What to check:**

- Look for RED errors in console (before clicking)
- Check if browser cached old code (hard refresh again!)
- Try right-clicking button → "Inspect Element" to verify it's the correct button

---

### **Scenario B: Button Click Logs, Then Stops**

**Console shows:**

```
🔵 [PromptInput] Button clicked!
❌ [PromptInput] Validation failed:
  - Prompt empty? true
  - Validation error: null
```

**Cause:** Prompt is considered empty

**Solution:**

- Type a prompt longer than 10 characters
- Make sure textarea is not somehow disabled

---

### **Scenario C: Validation Passes, Hook Never Called**

**Console shows:**

```
🔵 [PromptInput] Button clicked!
✅ [PromptInput] Validation passed, calling startOptimization...
(then nothing)
```

**Cause:** `startOptimization` is undefined or not a function

**Solution:**

- Check the component mount log - does it say `startOptimization: function`?
- If it says `undefined`, the hook isn't working

---

### **Scenario D: Hook Runs, Store Never Updates**

**Console shows:**

```
🟡 [useOptimization] startOptimization called!
📊 [useOptimization] Store state: ...
📦 [useOptimization] Built request: ...
🚀 [useOptimization] Calling store.startOptimization()...
(then nothing - no "🟢 [Store] startOptimization called")
```

**Cause:** Store is broken or not properly connected

**Solution:** This is a critical issue - share full console output!

---

### **Scenario E: Store Updates, SSE Never Starts**

**Console shows:**

```
🟢 [Store] startOptimization called
🟢 [Store] State updated to isOptimizing: true
(then nothing - no "=== STARTING OPTIMIZATION ===")
```

**Cause:** SSE client creation code isn't running

**Solution:** This shouldn't happen - share full console output!

---

### **Scenario F: SSE Connection Fails**

**Console shows:**

```
🔌 Connecting to SSE: ...
📡 Response Status: 401 Unauthorized
❌ Request failed: ...
```

**Cause:** API key mismatch or backend auth issue

**Solutions:**

1. Check `frontend/.env.local` has: `NEXT_PUBLIC_API_KEY=cG93ZXJwcm9tcHRz`
2. Check `backend/.env` has: `API_KEY=cG93ZXJwcm9tcHRz`
3. Restart both servers

---

### **Scenario G: SSE Connects, Backend Silent**

**Console shows:**

```
📡 Response Status: 200 OK
SSE connection opened
(frontend shows progress, but backend terminal shows NOTHING)
```

**Cause:** Backend received request but crashed or hung

**Solutions:**

1. Check backend terminal for Python errors
2. Check if `OPENAI_API_KEY` is set in `backend/.env`
3. Look for any red error text in backend

---

## 📝 **What To Share With Me**

After you hard refresh and try again, please provide:

### **1. Browser Console Output**

- **Copy ALL text** from console (from page load to after clicking button)
- If console is empty, tell me "Console is empty"

### **2. Backend Terminal Output**

- Any new lines that appear after clicking "Start Optimization"
- If nothing appears, tell me "No backend activity"

### **3. Screenshots (if needed)**

- Console tab showing logs
- Network tab showing `/api/optimize` request (F12 → Network)

---

## 🚀 **Quick Test Before Trying**

Before clicking "Start Optimization", run this in console:

```javascript
// Test 1: Check environment
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
console.log(
  "API Key:",
  process.env.NEXT_PUBLIC_API_KEY ? "✓ Set" : "✗ Missing",
);

// Test 2: Check backend health
fetch("http://localhost:8000/health")
  .then((r) => r.json())
  .then((d) => console.log("✅ Backend healthy:", d))
  .catch((e) => console.error("❌ Backend error:", e));

// Test 3: Check store
console.log(
  "Store prompt:",
  window.localStorage.getItem("powerprompts-draft-prompt"),
);
```

---

## 💡 **Most Likely Issues**

### **Issue #1: Browser Cached Old Code**

**Fix:** Hard refresh (`Ctrl + Shift + R`) or clear cache

### **Issue #2: Missing OpenAI API Key**

**Fix:** Add `OPENAI_API_KEY=sk-your-key` to `backend/.env`

### **Issue #3: Environment Variables Not Loaded**

**Fix:** Restart **frontend** server after editing `.env.local`

### **Issue #4: API Key Mismatch**

**Fix:** Ensure both frontend and backend use `cG93ZXJwcm9tcHRz`

---

## 🎯 **Expected Complete Flow**

When everything works, you'll see this beautiful chain:

```
🔷 Component Mount
    ↓
🔵 Button Click
    ↓
✅ Validation Pass
    ↓
🟡 Hook Called
    ↓
🟢 Store Updated
    ↓
🔌 SSE Connection
    ↓
📡 Response OK
    ↓
🎉 Backend Processing
```

---

**The extensive logging will pinpoint EXACTLY where things break!**

Please hard refresh, try again, and share the console output! 🔍
