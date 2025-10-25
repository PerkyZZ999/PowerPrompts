# 🔧 Network Error Fix - Backend Connection Issue

## ❌ Error: "NetworkError when attempting to fetch resource"

This error means the frontend **cannot reach the backend server**.

---

## ✅ Quick Fixes (Try These In Order)

### **1. Check if Backend is Running** ⚠️

**Open your backend terminal** and check if you see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**If you DON'T see this:**

```powershell
# Restart the backend
cd backend
uvicorn app.main:app --reload --port 8000
```

---

### **2. Test Backend Health Check**

Open a **new terminal** and run:

```powershell
curl http://localhost:8000/health
```

**Expected Response:**

```json
{ "status": "healthy", "version": "1.0.0", "app_name": "PowerPrompts" }
```

**If you get an error:**

- Backend is not running! ← Restart it

---

### **3. Check Frontend Environment**

**Open:** `frontend/.env.local`

**Should contain:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=cG93ZXJwcm9tcHRz
```

**If missing or wrong:**

- Fix the URL
- Restart frontend: `npm run dev`

---

### **4. Test API Connection from Browser**

**Open browser console** (F12) and run:

```javascript
fetch("http://localhost:8000/health")
  .then((r) => r.json())
  .then((d) => console.log("✓ Backend reachable:", d))
  .catch((e) => console.error("✗ Backend unreachable:", e));
```

**Expected:**

```
✓ Backend reachable: {status: "healthy", ...}
```

**If you see error:**

- CORS issue
- Backend not running
- Wrong port

---

### **5. Hard Refresh Frontend**

After confirming backend is running:

- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

---

## 🔍 Detailed Debugging Steps

### **Step 1: Check Backend Logs**

When you try to start optimization, your **backend terminal** should show:

```
INFO:     POST /api/optimize
INFO:     Accepted connection
```

**If you DON'T see this:**

- Backend is not receiving the request
- Check if backend is running on port 8000

---

### **Step 2: Check Frontend Console**

Open DevTools (F12) → Console

**Should see:**

```
Connecting to SSE: http://localhost:8000/api/optimize
API Key: ✓ Present
SSE connection opened
```

**If you see:**

```
NetworkError when attempting to fetch resource
```

**Possible causes:**

1. ❌ Backend not running
2. ❌ Backend running on wrong port
3. ❌ Firewall blocking connection
4. ❌ Browser CORS blocking

---

### **Step 3: Check Network Tab**

Open DevTools (F12) → Network tab

1. Try starting optimization
2. Look for `/api/optimize` request
3. Check status:
   - **Failed** → Backend unreachable
   - **401** → API key issue
   - **500** → Backend error
   - **200** → Success!

---

## 🛠️ Common Issues & Solutions

### **Issue 1: Backend Not Running**

**Symptoms:**

- No backend terminal window
- Or terminal shows: `Address already in use`

**Solution:**

```powershell
# Windows: Kill any process on port 8000
netstat -ano | findstr :8000
# Find PID, then:
taskkill /PID <PID> /F

# Then restart backend
cd backend
uvicorn app.main:app --reload --port 8000
```

---

### **Issue 2: Wrong Port**

**Symptoms:**

- Backend running but on different port (e.g., 8001)

**Solution:**

- Check backend terminal for actual port
- Update `frontend/.env.local`:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8001
  ```
- Restart frontend

---

### **Issue 3: CORS Blocked**

**Symptoms:**

- Browser console shows: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
Backend CORS is already configured for `http://localhost:3000`

- Make sure frontend is running on port 3000
- Check `backend/app/main.py` line 21:
  ```python
  allow_origins=["http://localhost:3000"]
  ```

---

### **Issue 4: API Key Mismatch**

**Symptoms:**

- 401 Unauthorized error

**Solution:**
Check keys match:

- Frontend: `frontend/.env.local` → `cG93ZXJwcm9tcHRz`
- Backend: `backend/.env` → `cG93ZXJwcm9tcHRz`

---

## ✅ Quick Restart (If Nothing Works)

### **Restart Everything:**

**Terminal 1 - Backend:**

```powershell
cd C:\Users\charl\Desktop\MyProjects\PowerPrompts\backend
uvicorn app.main:app --reload --port 8000
```

**Wait for:**

```
INFO:     Application startup complete.
```

**Terminal 2 - Frontend:**

```powershell
cd C:\Users\charl\Desktop\MyProjects\PowerPrompts\frontend
npm run dev
```

**Wait for:**

```
✓ Ready on http://localhost:3000
```

**Then:**

1. Open http://localhost:3000
2. Hard refresh: `Ctrl + Shift + R`
3. Try optimization again

---

## 📊 What I Changed

**File: `frontend/lib/streaming.ts`**

- ✅ Added debug logging
- ✅ Added `mode: "cors"` to fetch
- ✅ Added `credentials: "include"` for CORS

**You should now see in console:**

```
Connecting to SSE: http://localhost:8000/api/optimize
API Key: ✓ Present
```

---

## 🎯 Next Steps

1. **Check if backend is running**
2. **Test health endpoint**: `curl http://localhost:8000/health`
3. **Hard refresh browser**: `Ctrl + Shift + R`
4. **Check console for new debug logs**
5. **Share backend terminal output** if still not working

---

**Let me know what you see in:**

1. Backend terminal (when you try optimization)
2. Frontend console (F12 → Console)
3. Network tab (F12 → Network → /api/optimize request)

This will help me pinpoint the exact issue! 🔍
