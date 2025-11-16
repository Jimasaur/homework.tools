# Homework.tools - Adaptive Homework Guidance Platform

## One-Page Pitch

**Homework.tools** transforms homework from frustration into understanding. Students upload any problem—photo, PDF, or typed text—and receive intelligent, scaffolded guidance that teaches rather than tells. Unlike answer-key services, we enforce a tutor-not-cheater philosophy: conceptual breakdowns, strategic hints, parallel practice problems, and adaptive difficulty that meets each student where they are.

**For students:** Stop spinning your wheels. Get unstuck with explanations that match your level, practice problems that build confidence, and instant feedback that shows you're learning.

**For parents:** See what your child actually understands, get conversation starters for the dinner table, and receive actionable recommendations—not just "they got it wrong."

**The difference:** We don't give answers. We give understanding. We detect knowledge gaps, adapt to learning pace, and generate unlimited practice variations. Academic integrity built-in.

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │   Dropzone   │  │ Live Preview │  │  Progressive Reveal    ││
│  │ Upload UI    │  │   Component  │  │    Scaffolding UI      ││
│  └──────────────┘  └──────────────┘  └────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────┤
│  │  Session Manager  │  Practice Generator  │  Parent Dashboard ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────────────┤
│  │  Rate Limiter  │  Auth Middleware  │  Session Controller    ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OCR/Parse  │    │   Orchestrator   │    │  OpenAI API     │
│   Pipeline   │    │     Agent        │    │   Integration   │
│              │    │                  │    │                 │
│ • Tesseract  │    │ • Classification │    │ • GPT-4o        │
│ • PyMuPDF    │    │ • Routing        │    │ • Structured    │
│ • Pydantic   │    │ • Safety Check   │    │   Outputs       │
└──────────────┘    └──────────────────┘    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Math Tutor  │    │  Reading Comp    │    │  Science Tutor  │
│  Microservice│    │  Tutor Service   │    │   Microservice  │
└──────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (PostgreSQL + Redis)               │
│  ┌──────────────────────────────────────────────────────────────┤
│  │  Submissions  │  Sessions  │  Student Profiles  │  Analytics ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand (lightweight, session-based)
- **File Upload:** react-dropzone
- **Math Rendering:** KaTeX or MathJax
- **Real-time:** Socket.io-client (optional for live feedback)

### Backend
- **API Framework:** FastAPI (Python 3.11+)
- **OCR:** Tesseract + pytesseract, Google Cloud Vision API (fallback)
- **PDF Processing:** PyMuPDF (fitz)
- **LLM Integration:** OpenAI Python SDK (GPT-4o for reasoning, GPT-4o-mini for classification)
- **Validation:** Pydantic v2
- **Task Queue:** Celery + Redis (for async OCR/processing)
- **Caching:** Redis (session state, rate limiting)

### Database
- **Primary:** PostgreSQL 15+ (relational data: users, submissions, sessions)
- **Cache/Session:** Redis 7+ (ephemeral state, real-time data)

### DevOps & Infrastructure
- **Containerization:** Docker + Docker Compose
- **Hosting:**
  - Frontend: Vercel or Netlify
  - Backend: Railway, Render, or AWS ECS
- **Monitoring:** Sentry (errors), PostHog (analytics)
- **CI/CD:** GitHub Actions

---

## Component Breakdown

### 1. Upload & Parsing Pipeline

#### Frontend Component: `UploadDropzone`
- Accept `.jpg`, `.png`, `.pdf`, `.txt`
- Show live preview with OCR confidence overlay
- Progress indicator for processing

#### Backend Service: `ParsingOrchestrator`
```python
class ParsedSubmission(BaseModel):
    raw_text: str
    cleaned_text: str
    detected_problems: list[Problem]
    confidence_score: float
    format: Literal["image", "pdf", "text"]
```

**Flow:**
1. Upload → S3/local storage
2. Trigger async OCR job (Tesseract + Vision API fallback)
3. Extract text → structure problems using GPT-4o-mini
4. Return `Submission` object

---

### 2. Classification & Routing

#### `OrchestratorAgent`
- **Input:** `ParsedSubmission`
- **Output:** `ClassifiedSubmission`

```python
class ClassifiedSubmission(BaseModel):
    subject: Literal["math", "reading_comp", "writing", "science", "other"]
    topic: str  # "algebra-linear-equations", "biology-cell-structure"
    grade_level: int  # 1-12, inferred
    difficulty: Literal["basic", "intermediate", "advanced"]
    prerequisites: list[str]
    detected_gaps: list[str]
```

**Process:**
1. GPT-4o analyzes problem structure, vocabulary, notation
2. Classify subject using few-shot prompts
3. Infer grade level via difficulty heuristics
4. Detect prerequisite knowledge
5. Route to appropriate domain tutor

---

### 3. Domain Micro-Tutors

Each tutor follows the same interface but specializes in pedagogy.

#### `MathTutor`
- **Specialties:** Arithmetic, algebra, geometry, calculus, word problems
- **Strategy:**
  - Conceptual explanation (why, not just how)
  - Step breakdown with placeholders (`"What's the next step?"`)
  - Common error warnings (`"Students often forget to distribute here"`)
  - Worked example (withheld by default, reveal on request)

#### `ReadingCompTutor`
- **Specialties:** Main idea, inference, vocabulary, author's purpose
- **Strategy:**
  - Passage highlighting
  - Question decomposition
  - Elimination reasoning
  - Context clue scaffolding

#### `ScienceTutor`
- **Specialties:** Biology, chemistry, physics, earth science
- **Strategy:**
  - Diagram/visual aids
  - Hypothesis testing framework
  - Real-world connections
  - Safety considerations

---

### 4. Scaffolded Guidance Generation

#### `GuidanceBuilder`
```python
class GuidanceResponse(BaseModel):
    micro_explanation: str  # 2-3 sentences, grade-appropriate
    step_breakdown: list[Step]
    error_warnings: list[str]
    interactive_checks: list[Question]
    practice_analogs: list[Problem]
    reveal_sequence: list[RevealLevel]
```

**RevealLevel Progression:**
1. **Hint 1:** Conceptual nudge
2. **Hint 2:** Strategic direction
3. **Hint 3:** Partial work
4. **Full Solution:** Complete worked example (requires confirmation)

**Example (Math):**
```
Problem: "Solve for x: 2x + 5 = 13"

micro_explanation: "This is a linear equation. Our goal is to get x alone
by doing the same operation to both sides."

step_breakdown:
  1. "What operation would remove the +5 from the left side?"
  2. "After subtracting 5 from both sides, what equation do you have?"
  3. "How do you isolate x from 2x?"

error_warnings:
  - "Don't subtract 5 from only one side—balance is key!"

interactive_checks:
  - "What's 13 - 5?" → validate input
  - "If 2x = 8, then x = ?" → validate input

reveal_sequence:
  1. "Think about inverse operations..."
  2. "First, subtract 5 from both sides..."
  3. "2x + 5 - 5 = 13 - 5 → 2x = 8"
  4. [Full solution: 2x = 8 → x = 4]
```

---

### 5. Practice Problem Generator

#### `PracticeGenerator`
- **Input:** Original problem, student level, topic
- **Output:** 3-5 parallel problems with increasing variation

**Strategy:**
- **Problem 1:** Same structure, different numbers
- **Problem 2:** Same concept, slightly different format
- **Problem 3:** Multi-step variation
- **Problem 4:** Real-world application
- **Problem 5:** Challenge (optional)

**Example:**
```
Original: "2x + 5 = 13"
Practice 1: "3x + 7 = 22"
Practice 2: "4(x - 2) = 12"
Practice 3: "2x + 5 = 3x - 1"
Practice 4: "You buy 2 shirts for $x each and pay $5 shipping. Total is $13.
             Find the cost per shirt."
```

---

### 6. Session Management & Adaptation

#### `SessionTracker`
```python
class Session(BaseModel):
    student_id: str
    level_estimate: int
    pace: Literal["slow", "medium", "fast"]
    prior_outcomes: list[Outcome]
    scaffolding_mode: Literal["minimal", "moderate", "heavy"]
    misconceptions: list[Misconception]
    strengths: list[str]
```

**Adaptive Logic:**
- If student answers practice correctly 3× → increase difficulty
- If student requests hints 2+ times → decrease difficulty, add explanation
- Track error patterns → flag misconception, generate targeted practice
- Adjust language complexity based on grade level + performance

---

### 7. Parent Mode

#### `ParentDashboard`
```python
class ParentReport(BaseModel):
    session_summary: str
    problems_attempted: int
    concepts_mastered: list[str]
    misconceptions_map: dict[str, str]
    practice_recommendations: list[str]
    conversation_starters: list[str]
    time_on_task: int  # minutes
```

**Example Output:**
```markdown
## Session Summary (March 15, 2025)

Your child worked on **linear equations** for 25 minutes.

### What Went Well ✓
- Correctly solved 4/5 practice problems
- Strong understanding of inverse operations

### Growth Areas 📚
- **Misconception:** Forgets to distribute when parentheses are involved
  - Example: Wrote 2(x+3) = 2x + 3 instead of 2x + 6

### Recommended Practice
1. 10 more distribution problems (mixed with simple equations)
2. Khan Academy: "Distributive Property" module

### Conversation Starters 💬
- "Can you show me how you solved 2x + 5 = 13?"
- "What's the trickiest part about equations with parentheses?"
```

---

## Safety & Academic Integrity

### Tutor-Not-Cheater Policy

**Enforcement:**
1. **No Direct Answers:** Default response is scaffolded reasoning
2. **Full Solution Gating:** Requires explicit "Show me the answer" request + confirmation dialog
3. **High-Stakes Detection:** Flag keywords like "final exam," "test," "quiz" → escalate to human review or refuse
4. **Rate Limiting:** Max 10 submissions/hour for free tier
5. **Parent Verification:** Optional PIN code for minors (<13)

**Prompt Engineering:**
```python
SYSTEM_PROMPT = """
You are an educational tutor, not an answer service. Your goal is to help
students LEARN, not complete assignments for them.

Rules:
- Never provide direct answers unless pedagogically justified
- Always explain WHY, not just HOW
- Guide with questions, not statements
- Detect when a student is trying to cheat (e.g., "just give me the answer")
  and redirect with encouragement
"""
```

---

## Data Model

### Core Entities

#### `Submission`
```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    session_id UUID REFERENCES sessions(id),
    raw_text TEXT,
    parsed_problems JSONB,
    subject VARCHAR(50),
    topic VARCHAR(100),
    grade_level INT,
    difficulty VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `Session`
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    student_level INT,
    pace VARCHAR(20),
    scaffolding_mode VARCHAR(20),
    misconceptions JSONB,
    started_at TIMESTAMP,
    ended_at TIMESTAMP
);
```

#### `Student`
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    grade_level INT,
    learning_preferences JSONB,
    parent_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `PracticeAttempt`
```sql
CREATE TABLE practice_attempts (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    problem_id UUID,
    student_answer TEXT,
    is_correct BOOLEAN,
    hints_used INT,
    time_spent INT,  -- seconds
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## User Modes

### 1. "Explain it like I'm [age/grade]"
- **Input:** Problem + target age/grade
- **Output:** Adjusted vocabulary, examples, metaphors
- **Example:**
  - Grade 3: "Think of the equals sign like a balance scale"
  - Grade 9: "Linear equations represent a straight line on a graph"

### 2. "Practice Mode"
- Generate unlimited variations
- Track accuracy streak
- Unlock difficulty tiers

### 3. "Show Me Where I'm Stuck"
- Student uploads partial work (photo of scratch paper)
- OCR extracts steps
- AI identifies error point
- Targeted hint at exact line

### 4. "Parent Interpret"
- Weekly digest email
- Misconceptions map
- Practice recommendations
- Conversation starters

---

## MVP Specification

### Phase 1: Core Tutor (Weeks 1-4)
**Features:**
- [ ] Image/PDF/text upload
- [ ] Math tutor (algebra, arithmetic only)
- [ ] Basic scaffolding (3-level hint reveal)
- [ ] 3 practice problems per submission
- [ ] Simple session tracking (in-memory)

**Tech Stack:**
- React + Vite frontend
- FastAPI backend
- OpenAI GPT-4o
- No database (ephemeral sessions)

**Success Criteria:**
- Student can upload a linear equation
- Receive 3 hints before seeing answer
- Generate 3 practice problems
- Solve practice problems with inline validation

---

### Phase 2: Multi-Domain + Persistence (Weeks 5-8)
**Features:**
- [ ] Reading comprehension tutor
- [ ] Science tutor
- [ ] PostgreSQL database
- [ ] User accounts (email-based)
- [ ] Session history

---

### Phase 3: Adaptive Learning (Weeks 9-12)
**Features:**
- [ ] Difficulty adjustment algorithm
- [ ] Misconception detection
- [ ] Parent dashboard
- [ ] PDF session summary export

---

### Phase 4: Polish & Scale (Weeks 13-16)
**Features:**
- [ ] Gamification (streak counter, badges)
- [ ] Printable practice packets
- [ ] Teacher dashboard (class code upload)
- [ ] Mobile-responsive design

---

## Compliance Summary

### COPPA (Children's Online Privacy Protection Act)
**Requirements:**
- Parental consent for users <13
- No behavioral advertising to minors
- Data minimization

**Implementation:**
- [ ] Age gate on signup
- [ ] Parent email verification for <13
- [ ] No third-party analytics for minors
- [ ] Delete account option
- [ ] Privacy policy in plain language

### FERPA (Family Educational Rights and Privacy Act)
**Requirements:**
- Student education records protected
- Parental access to records
- Consent for disclosure

**Implementation:**
- [ ] Parent dashboard (read-only access)
- [ ] Data export on request
- [ ] No selling of student data
- [ ] Teacher accounts require school email verification

### General Data Protection (GDPR-ready)
- [ ] Right to access
- [ ] Right to erasure
- [ ] Data portability
- [ ] Consent management

---

## Pricing Tiers

### Free Tier
- **Price:** $0/month
- **Limits:**
  - 10 submissions/day
  - 3 practice problems per submission
  - No session history (ephemeral)
  - Community support
- **Use Case:** Casual homework help, trial users

### Student Plan
- **Price:** $9.99/month or $79/year
- **Features:**
  - Unlimited submissions
  - 10 practice problems per submission
  - Full session history
  - Misconception tracking
  - PDF export
  - Priority support
- **Use Case:** Individual students (K-12)

### Family Plan
- **Price:** $19.99/month or $159/year
- **Features:**
  - Everything in Student Plan
  - Up to 5 student profiles
  - Parent dashboard
  - Weekly progress emails
  - Conversation starter suggestions
  - Custom difficulty settings per child
- **Use Case:** Households with multiple children

### Teacher Plan
- **Price:** $49/month or $399/year
- **Features:**
  - Everything in Family Plan
  - Up to 50 students
  - Class-level analytics
  - Bulk problem upload
  - Assignment tracking
  - Printable practice packet generator
  - Admin dashboard
- **Use Case:** Individual teachers, tutors, homeschool co-ops

### School/District Plan
- **Price:** Custom (contact sales)
- **Features:**
  - Everything in Teacher Plan
  - Unlimited students
  - SSO integration
  - LMS integration (Canvas, Google Classroom)
  - Dedicated account manager
  - SLA guarantees
  - Custom branding
- **Use Case:** Schools, districts, tutoring centers

---

## Expansion Options

### 1. Gamified Streaks
- Daily login rewards
- Accuracy streaks
- Topic mastery badges
- Leaderboards (opt-in, privacy-safe)

### 2. Printable Practice Packets
- Generate PDF worksheets
- Answer keys for parents/teachers
- Customizable difficulty
- Themed packets (e.g., "Fractions Week")

### 3. Teacher Dashboard Features
- Class code system (students join via code)
- Assignment creation
- Student progress heatmaps
- Bulk problem upload (CSV/spreadsheet)
- Printable reports

### 4. Mobile App
- Native iOS/Android
- Offline mode (cached practice problems)
- Push notifications for streaks
- Camera integration for instant upload

### 5. AI Tutor Voice Mode
- Voice-to-text problem input
- Text-to-speech explanations
- Conversational tutoring
- Accessibility for visually impaired

### 6. Peer Learning (Opt-in)
- Anonymous student discussion forums
- Moderated Q&A
- Study group matching

---

## Success Metrics

### Product Metrics
- **Engagement:** Average session duration, problems/session
- **Learning:** Practice accuracy improvement, misconception resolution rate
- **Retention:** 7-day, 30-day active users
- **Satisfaction:** NPS score, parent/student surveys

### Business Metrics
- **Conversion:** Free → Paid rate
- **LTV:** Customer lifetime value
- **CAC:** Customer acquisition cost
- **Churn:** Monthly churn rate by tier

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Students use for cheating | High | Gating, detection, educator partnerships |
| OCR accuracy on messy handwriting | Medium | Vision API fallback, manual retry option |
| OpenAI API costs at scale | High | Cache common problems, use GPT-4o-mini for classification |
| COPPA compliance complexity | High | Legal review, parent consent flows |
| Teacher adoption resistance | Medium | Free teacher tier, case studies, training webinars |

---

## Next Steps

### Immediate (Week 1)
1. Finalize tech stack decisions
2. Set up repository (monorepo vs. multi-repo)
3. Design database schema
4. Create wireframes for upload flow
5. Draft OpenAI prompt templates

### Short-term (Weeks 2-4)
1. Build MVP (math tutor only)
2. Deploy to staging environment
3. Internal testing with 5-10 students
4. Iterate on scaffolding quality

### Medium-term (Weeks 5-12)
1. Add reading/science tutors
2. Implement session persistence
3. Launch beta with 100 users
4. Develop parent dashboard

### Long-term (3-6 months)
1. Public launch
2. Teacher outreach campaign
3. Mobile app development
4. Partnerships with tutoring centers

---

## Appendix: Example Workflows

### Workflow 1: Student Uploads Algebra Problem

1. Student takes photo of problem: "Solve 3x - 7 = 14"
2. System OCRs → detects math → routes to MathTutor
3. MathTutor classifies: algebra, linear equations, grade 7-8
4. Generates guidance:
   - **Micro-explanation:** "Isolate x by undoing operations"
   - **Hint 1:** "What's the inverse of subtracting 7?"
   - **Hint 2:** "Add 7 to both sides first"
   - **Hint 3:** "After adding 7, you get 3x = 21. Now divide."
5. Student clicks "Practice" → gets 3 similar problems
6. Student solves 2/3 correctly → system notes "strong on single-step, needs work on distribution"
7. Session saved → parent email digest sent

### Workflow 2: Parent Reviews Progress

1. Parent logs into dashboard
2. Sees: "Sarah completed 12 problems this week in Algebra"
3. Misconception map shows: "Struggles with negative numbers in equations"
4. Recommendations:
   - Practice: "20 more integer problems"
   - Conversation starter: "Ask Sarah to explain why -3 + 5 = 2"
5. Exports PDF summary for conference with teacher

---

## Tech Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend Framework | React 18 + TypeScript | Modern, type-safe, ecosystem support |
| Build Tool | Vite | Fast dev server, optimized builds |
| UI Components | Tailwind + shadcn/ui | Beautiful, accessible, customizable |
| Backend Framework | FastAPI | High performance, async, OpenAPI docs |
| LLM Provider | OpenAI (GPT-4o/4o-mini) | Best reasoning, structured outputs |
| Database | PostgreSQL 15 | Relational integrity, JSONB support |
| Cache/Sessions | Redis | Fast, ephemeral, pub/sub |
| OCR | Tesseract + Vision API | Free + premium fallback |
| Hosting (Backend) | Railway or Render | Easy deploys, autoscaling |
| Hosting (Frontend) | Vercel | Optimized for React, CDN |
| Monitoring | Sentry + PostHog | Errors + product analytics |

---

**End of Specification**

*Last Updated: 2025-11-15*
*Version: 1.0 (MVP Spec)*
