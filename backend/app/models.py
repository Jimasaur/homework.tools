from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Student(Base):
    """Student model."""
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grade_level = Column(Integer, nullable=True)
    learning_preferences = Column(JSON, default=dict)
    parent_email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Session(Base):
    """Learning session model."""
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    student_level = Column(Integer, nullable=True)
    pace = Column(String(20), default="medium")  # slow, medium, fast
    scaffolding_mode = Column(String(20), default="moderate")  # minimal, moderate, heavy
    misconceptions = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)


class Submission(Base):
    """Problem submission model."""
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)

    # Original content
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(50))  # image, pdf, text
    raw_text = Column(Text)

    # Parsed content
    parsed_problems = Column(JSON, default=list)
    confidence_score = Column(Integer, default=0)  # 0-100

    # Classification
    subject = Column(String(50), nullable=True)  # math, reading_comp, science, etc.
    topic = Column(String(100), nullable=True)
    grade_level = Column(Integer, nullable=True)
    difficulty = Column(String(20), nullable=True)  # basic, intermediate, advanced
    prerequisites = Column(JSON, default=list)
    detected_gaps = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PracticeAttempt(Base):
    """Student practice attempt model."""
    __tablename__ = "practice_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    problem_id = Column(UUID(as_uuid=True))  # Links to generated practice problem
    student_answer = Column(Text)
    is_correct = Column(Boolean)
    hints_used = Column(Integer, default=0)
    time_spent = Column(Integer)  # seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Misconception(Base):
    """Tracked student misconceptions."""
    __tablename__ = "misconceptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    topic = Column(String(100))
    description = Column(Text)
    example_problem = Column(Text, nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
