# 📚 Homework.tools

**Adaptive homework guidance platform that teaches, not tells.**

Upload a photo, PDF, or type your homework problem. Get intelligent, scaffolded guidance that helps you learn—not just answers. Built with OpenAI GPT-4o and Vision APIs.

## ✨ Features

- 📤 **Upload Anything**: Photos, PDFs, or typed text
- 🔍 **Smart OCR**: OpenAI Vision extracts text from images
- 🎯 **Auto-Classification**: Detects subject, topic, grade level
- 📖 **Scaffolded Learning**: Step-by-step guidance with progressive hints
- ✍️ **Practice Problems**: Generate 5 similar problems to master concepts
- 🛡️ **Academic Integrity**: Tutor-not-cheater philosophy enforced

## 🎥 How It Works

1. **Upload** → Student uploads homework (image/PDF/text)
2. **Extract** → OpenAI Vision reads the problem
3. **Classify** → GPT-4o identifies subject, topic, difficulty
4. **Guide** → Get conceptual explanation + step-by-step hints
5. **Practice** → Solve similar problems to build mastery

## Project Structure

```
homework.tools/
├── frontend/          # React + Vite + TypeScript
├── backend/           # FastAPI + Python
├── docker-compose.yml # Local development environment
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (optional, recommended)

### Option 1: Docker (Recommended)
```bash
docker-compose up
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/homework_tools
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
```

## Development

- **Frontend Dev Server**: `npm run dev` (in `frontend/`)
- **Backend Dev Server**: `uvicorn app.main:app --reload` (in `backend/`)
- **Type Checking**: `npm run type-check` (frontend)
- **Linting**: `npm run lint` (frontend), `ruff check .` (backend)

## 📚 Documentation

- **[PRODUCT_SPEC.md](PRODUCT_SPEC.md)** - Complete product specification, architecture, and roadmap
- **[SETUP.md](SETUP.md)** - Detailed setup instructions and troubleshooting
- **[BUILD_SUMMARY.md](BUILD_SUMMARY.md)** - Build summary, tech stack, and deployment guide

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| AI/ML | OpenAI GPT-4o, GPT-4o-mini, Vision API |
| Database | PostgreSQL 15, Redis 7 |
| DevOps | Docker, Docker Compose |

## 🚀 Quick Test

Once running, try this:

1. Navigate to http://localhost:5173
2. Click "Type your problem instead"
3. Enter: `Solve for x: 2x + 5 = 13`
4. Click "Get Help"

You'll see:
- ✅ Problem classification (Math, Algebra)
- ✅ Conceptual explanation
- ✅ Step-by-step guidance
- ✅ Progressive hints (4 levels)
- ✅ 5 practice problems

## 📖 API Documentation

Interactive API docs available at http://localhost:8000/docs when backend is running.

Key endpoints:
- `POST /api/submissions/upload` - Upload file
- `POST /api/submissions/text` - Submit text
- `GET /api/submissions/{id}/guidance` - Get guidance
- `GET /api/submissions/{id}/practice` - Get practice problems

## 🎯 Roadmap

- ✅ **Phase 1 (MVP)**: Math tutor, upload, guidance, practice
- ⏳ **Phase 2**: Reading comprehension, science, user auth
- 📅 **Phase 3**: Adaptive difficulty, parent dashboard, analytics
- 📅 **Phase 4**: Gamification, teacher dashboard, mobile app

See [PRODUCT_SPEC.md](PRODUCT_SPEC.md) for detailed roadmap.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainer.

## 📝 License

Proprietary - All rights reserved

---

**Built with ❤️ using OpenAI APIs**
