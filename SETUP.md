# Homework.tools - Setup Guide

Complete setup instructions for running the homework.tools platform locally.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **Docker & Docker Compose** (optional, recommended) ([Download](https://www.docker.com/))
- **PostgreSQL** 15+ (if not using Docker)
- **Redis** 7+ (if not using Docker)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

## Quick Start (Docker - Recommended)

### 1. Clone and Setup

```bash
cd homework.tools
```

### 2. Configure Environment Variables

Create `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-actual-key-here
DATABASE_URL=postgresql://homework_user:homework_pass@postgres:5432/homework_tools
REDIS_URL=redis://redis:6379
ENVIRONMENT=development
```

Create `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```

### 3. Start Everything with Docker

```bash
docker-compose up
```

Wait for all services to start. You should see:
- ✅ Postgres ready
- ✅ Redis ready
- ✅ Backend ready at http://localhost:8000
- ✅ Frontend ready at http://localhost:5173

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs
- **API Health Check:** http://localhost:8000/api/health

---

## Manual Setup (Without Docker)

### 1. Setup PostgreSQL

Install PostgreSQL and create a database:

```bash
# On macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb homework_tools
```

### 2. Setup Redis

```bash
# On macOS with Homebrew
brew install redis
brew services start redis
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
OPENAI_API_KEY=sk-your-actual-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/homework_tools
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
```

Run the backend:
```bash
uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

Run the frontend:
```bash
npm run dev
```

Frontend will be available at http://localhost:5173

---

## Testing the Application

### 1. Upload Test

1. Navigate to http://localhost:5173
2. Click "Type your problem instead"
3. Enter: `Solve for x: 2x + 5 = 13`
4. Click "Get Help"

You should see:
- Problem classification (Math, Algebra)
- Conceptual explanation
- Step-by-step guidance
- Progressive hint reveal
- Practice problems

### 2. Image Upload Test

1. Take a photo of a math problem (or any homework)
2. Drag and drop it into the upload zone
3. Wait for processing (uses OpenAI Vision)
4. View the extracted text and guidance

### 3. API Test

```bash
# Health check
curl http://localhost:8000/api/health

# Test text submission
curl -X POST http://localhost:8000/api/submissions/text \
  -F "text=Solve for x: 3x - 7 = 14"
```

---

## Project Structure

```
homework.tools/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── services/
│   │   │   ├── ocr.py        # OpenAI Vision OCR
│   │   │   └── openai_client.py  # LLM integration
│   │   ├── config.py         # Settings
│   │   ├── database.py       # Database connection
│   │   └── main.py           # FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── UploadZone.tsx
│   │   │   ├── GuidanceDisplay.tsx
│   │   │   └── PracticeProblems.tsx
│   │   ├── store/
│   │   │   └── useStore.ts   # Zustand state management
│   │   ├── lib/
│   │   │   └── api.ts        # API client
│   │   ├── App.tsx           # Main app
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
├── PRODUCT_SPEC.md
├── SETUP.md
└── README.md
```

---

## Development Workflow

### Backend Development

```bash
cd backend

# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# Run tests (when created)
pytest

# Format code
ruff format .

# Lint code
ruff check .
```

### Frontend Development

```bash
cd frontend

# Run dev server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Migrations (Future)

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | ✅ Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ Yes |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | ✅ Yes |
| `ENVIRONMENT` | Environment (development/production) | `development` | No |
| `SECRET_KEY` | JWT secret key | - | Production only |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` | No |
| `MAX_UPLOAD_SIZE_MB` | Max file upload size | `10` | No |
| `ALLOWED_EXTENSIONS` | Allowed file extensions | `jpg,jpeg,png,pdf,txt` | No |

### Frontend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api` | No |

---

## Common Issues & Solutions

### Issue: "Database connection failed"

**Solution:**
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -l | grep homework_tools`

### Issue: "OpenAI API error"

**Solution:**
- Verify OPENAI_API_KEY is set correctly
- Check API key has sufficient credits
- Test key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Issue: "Frontend can't connect to backend"

**Solution:**
- Ensure backend is running on port 8000
- Check VITE_API_URL in frontend/.env
- Check CORS settings in backend config

### Issue: "OCR not extracting text correctly"

**Solution:**
- Ensure image is clear and high resolution
- Check OpenAI API key has Vision access
- Try uploading a different format (PDF vs image)

### Issue: "Port already in use"

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or change port in config
```

---

## Production Deployment

### Backend (Railway/Render)

1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables in dashboard
4. Add PostgreSQL and Redis add-ons
5. Deploy!

### Frontend (Vercel/Netlify)

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.com/api`
6. Deploy!

### Docker Production

```bash
# Build and push images
docker build -t your-registry/homework-backend:latest ./backend
docker build -t your-registry/homework-frontend:latest ./frontend

docker push your-registry/homework-backend:latest
docker push your-registry/homework-frontend:latest

# Deploy to your infrastructure
```

---

## Next Steps

1. ✅ Get the app running locally
2. Test with real homework problems
3. Review [PRODUCT_SPEC.md](PRODUCT_SPEC.md) for architecture details
4. Add more domain tutors (reading comprehension, science)
5. Implement user authentication
6. Add parent dashboard
7. Deploy to production

---

## Support

- **Issues:** Check logs in console/terminal
- **API Docs:** http://localhost:8000/docs
- **Database:** Use tools like pgAdmin or Postico
- **Redis:** Use RedisInsight for debugging

## License

Proprietary - All rights reserved
