from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime
from uuid import UUID


# ============================================================================
# Submission Schemas
# ============================================================================

class Problem(BaseModel):
    """Individual problem extracted from submission."""
    text: str
    order: int = 0
    type: Optional[str] = None


class ParsedSubmission(BaseModel):
    """Result from parsing pipeline."""
    raw_text: str
    cleaned_text: str
    detected_problems: List[Problem]
    confidence_score: float = Field(ge=0, le=100)
    format: Literal["image", "pdf", "text"]


class ClassifiedSubmission(BaseModel):
    """Result from classification."""
    subject: Literal["math", "reading_comp", "writing", "science", "other"]
    topic: str
    grade_level: int = Field(ge=1, le=12)
    difficulty: Literal["basic", "intermediate", "advanced"]
    prerequisites: List[str] = []
    detected_gaps: List[str] = []


class SubmissionCreate(BaseModel):
    """Create submission request."""
    text: Optional[str] = None
    session_id: Optional[UUID] = None


class SubmissionResponse(BaseModel):
    """Submission response."""
    id: UUID
    subject: Optional[str]
    topic: Optional[str]
    grade_level: Optional[int]
    difficulty: Optional[str]
    parsed_problems: List[dict]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Guidance Schemas
# ============================================================================

class Step(BaseModel):
    """Single step in guidance."""
    order: int
    text: str
    hint: Optional[str] = None


class Question(BaseModel):
    """Interactive check question."""
    text: str
    expected_answer: Optional[str] = None
    explanation: str


class RevealLevel(BaseModel):
    """Progressive hint reveal."""
    level: int
    content: str
    reveal_type: Literal["hint", "partial", "full"]


class GuidanceResponse(BaseModel):
    """Complete guidance for a problem."""
    micro_explanation: str
    step_breakdown: List[Step]
    error_warnings: List[str] = []
    interactive_checks: List[Question] = []
    practice_analogs: List[dict] = []
    reveal_sequence: List[RevealLevel] = []


# ============================================================================
# Practice Schemas
# ============================================================================

class PracticeProblem(BaseModel):
    """Generated practice problem."""
    id: UUID
    text: str
    difficulty: Literal["basic", "intermediate", "advanced"]
    variation_type: str  # "same_structure", "format_change", "multi_step", etc.
    solution: Optional[str] = None  # Hidden by default


class PracticeAttemptCreate(BaseModel):
    """Create practice attempt."""
    problem_id: UUID
    student_answer: str
    time_spent: int  # seconds


class PracticeAttemptResponse(BaseModel):
    """Practice attempt result."""
    id: UUID
    is_correct: bool
    feedback: str
    hints_available: int
    next_hint: Optional[str] = None


# ============================================================================
# Session Schemas
# ============================================================================

class SessionCreate(BaseModel):
    """Create learning session."""
    student_id: Optional[UUID] = None
    student_level: Optional[int] = None


class SessionResponse(BaseModel):
    """Session response."""
    id: UUID
    student_level: Optional[int]
    pace: str
    scaffolding_mode: str
    started_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Parent Dashboard Schemas
# ============================================================================

class MisconceptionSummary(BaseModel):
    """Misconception summary for parents."""
    topic: str
    description: str
    example: Optional[str]
    resolved: bool


class ParentReport(BaseModel):
    """Parent dashboard report."""
    session_summary: str
    problems_attempted: int
    concepts_mastered: List[str]
    misconceptions_map: List[MisconceptionSummary]
    practice_recommendations: List[str]
    conversation_starters: List[str]
    time_on_task: int  # minutes
