# Getting Started with Homework.tools

Follow this checklist to get homework.tools running on your machine in under 10 minutes.

## ✅ Pre-Flight Checklist

### 1. Install Prerequisites

- [ ] **Docker Desktop** installed and running
  - Download: https://www.docker.com/products/docker-desktop
  - Verify: Run `docker --version` in terminal

- [ ] **OpenAI API Key** obtained
  - Get one: https://platform.openai.com/api-keys
  - Should start with `sk-`
  - Ensure you have credits ($5+ recommended for testing)

- [ ] **Text Editor** installed
  - VS Code (recommended): https://code.visualstudio.com/
  - Or any text editor to edit `.env` files

### 2. Set Up Environment

- [ ] **Copy environment file**
  ```bash
  cp backend/.env.example backend/.env
  ```

- [ ] **Add your OpenAI API key**

  Open `backend/.env` in your text editor and replace:
  ```env
  OPENAI_API_KEY=sk-your-key-here
  ```

  With your actual key:
  ```env
  OPENAI_API_KEY=sk-proj-abc123...
  ```

- [ ] **Verify frontend environment (optional)**
  ```bash
  cp frontend/.env.example frontend/.env
  ```
  Default settings should work, but you can customize `VITE_API_URL` if needed.

### 3. Start the Application

- [ ] **Start Docker containers**
  ```bash
  docker-compose up
  ```

  Or on Windows, double-click `start.bat`

- [ ] **Wait for services to start** (1-2 minutes)

  You should see:
  ```
  ✅ postgres  | database system is ready to accept connections
  ✅ redis     | Ready to accept connections
  ✅ backend   | Application startup complete
  ✅ frontend  | ready in X ms
  ```

### 4. Verify Everything Works

- [ ] **Frontend loads**
  - Open http://localhost:5173 in your browser
  - You should see the Homework.tools upload page

- [ ] **Backend is healthy**
  - Open http://localhost:8000/api/health
  - Should return: `{"status": "healthy"}`

- [ ] **API docs accessible**
  - Open http://localhost:8000/docs
  - You should see interactive Swagger documentation

### 5. Test the App

- [ ] **Test with text input**
  1. Go to http://localhost:5173
  2. Click "Or type your problem instead"
  3. Enter: `Solve for x: 2x + 5 = 13`
  4. Click "Get Help"
  5. Wait 3-5 seconds
  6. You should see:
     - Problem classification (Math, Algebra)
     - Conceptual explanation
     - Step-by-step guidance
     - "Need More Help?" section with hints

- [ ] **Reveal hints**
  1. Click "Show First Hint"
  2. Click through hints 2, 3, 4
  3. Verify hint 4 shows full solution

- [ ] **Generate practice**
  1. Scroll down to "Ready to Practice?"
  2. Click "Generate Practice Problems"
  3. Wait 5-10 seconds
  4. You should see 5 practice problems

- [ ] **Test image upload (optional)**
  1. Take a photo of a math problem or find one online
  2. Go back to home (click "← New Problem")
  3. Drag and drop the image
  4. Verify OpenAI Vision extracts text correctly

---

## 🎉 Success!

If all checkboxes are ✅, you're ready to go!

---

## 🚨 Troubleshooting

### Issue: Docker not starting

**Symptoms:**
- `docker-compose up` fails
- Error: "Cannot connect to Docker daemon"

**Solutions:**
1. Ensure Docker Desktop is running
2. Restart Docker Desktop
3. Check Docker is installed: `docker --version`

---

### Issue: Backend shows OpenAI error

**Symptoms:**
- Error in browser: "OpenAI API error"
- Backend logs show "401 Unauthorized"

**Solutions:**
1. Verify `OPENAI_API_KEY` is set correctly in `backend/.env`
2. Check key is valid: https://platform.openai.com/api-keys
3. Ensure you have API credits: https://platform.openai.com/account/billing

---

### Issue: "Database connection failed"

**Symptoms:**
- Backend crashes on startup
- Error: "could not connect to server"

**Solutions:**
1. Wait longer (PostgreSQL can take 30-60s to start)
2. Check Docker logs: `docker-compose logs postgres`
3. Restart services: `docker-compose restart`

---

### Issue: Frontend shows blank page

**Symptoms:**
- http://localhost:5173 loads but nothing appears
- Console shows errors

**Solutions:**
1. Check frontend logs: `docker-compose logs frontend`
2. Verify `VITE_API_URL` in `frontend/.env`
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

### Issue: "Port already in use"

**Symptoms:**
- Error: "bind: address already in use"
- Ports 5173, 8000, 5432, or 6379 conflict

**Solutions:**

**Option 1: Stop conflicting service**
```bash
# Find process using port
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill process
kill <PID>
```

**Option 2: Change ports**

Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "3000:5173"  # Change 5173 to 3000

backend:
  ports:
    - "9000:8000"  # Change 8000 to 9000
```

Then access:
- Frontend: http://localhost:3000
- Backend: http://localhost:9000

---

### Issue: OCR not working on images

**Symptoms:**
- Image uploads but text not extracted
- Error: "OCR failed"

**Solutions:**
1. Verify OpenAI API key has Vision access
2. Try a clearer image (higher resolution)
3. Try a different format (PNG instead of JPG)
4. Check backend logs: `docker-compose logs backend`

---

## 📞 Still Stuck?

1. **Check logs**: `docker-compose logs -f` (follow all logs)
2. **Restart everything**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```
3. **Clean slate**:
   ```bash
   docker-compose down -v  # Removes volumes too
   docker-compose up --build
   ```
4. **Review documentation**:
   - [SETUP.md](SETUP.md) - Detailed setup guide
   - [BUILD_SUMMARY.md](BUILD_SUMMARY.md) - Technical details

---

## 🎓 Next Steps

Once everything is working:

1. ✅ Test with different types of problems
   - Math: algebra, geometry, calculus
   - Try uploading images of homework
   - Experiment with difficulty levels

2. ✅ Explore the code
   - Backend: `backend/app/`
   - Frontend: `frontend/src/`
   - Review architecture: [PRODUCT_SPEC.md](PRODUCT_SPEC.md)

3. ✅ Customize and extend
   - Add new subjects (reading, science)
   - Modify prompts in `backend/app/services/openai_client.py`
   - Adjust UI in `frontend/src/components/`

4. ✅ Deploy to production
   - See [BUILD_SUMMARY.md](BUILD_SUMMARY.md#-deployment-checklist)
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel/Netlify

---

## 🎯 Test Cases

Try these to verify everything works:

### Math - Algebra
```
Input: Solve for x: 3x - 7 = 14
Expected: Step-by-step algebraic solution
```

### Math - Word Problem
```
Input: Sarah has 12 apples. She gives away 1/4 of them. How many does she have left?
Expected: Real-world context explanation
```

### Math - Geometry
```
Input: Find the area of a triangle with base 8 and height 6.
Expected: Formula explanation + calculation
```

---

**Ready to learn!** 🚀

*Last updated: 2025-11-15*
