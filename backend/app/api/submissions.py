from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid
from pathlib import Path
import aiofiles
from pydantic import BaseModel

from app.database import get_db
from app.models import Submission, Session as SessionModel
from app.schemas import (
    SubmissionResponse,
    PracticeProblem,
    SessionCreate,
    SessionResponse
)
from app.services.ocr import ParsingOrchestrator
from app.services.openai_client import openai_client
from app.services.gemini_client import gemini_client
from app.services.llm_service import llm_service # New import
from app.config import settings

router = APIRouter()
parsing_orchestrator = ParsingOrchestrator()

# New Pydantic model for GuidanceResponse, replacing the one from app.schemas for this context
class GuidanceResponse(BaseModel):
    micro_explanation: str
    step_breakdown: List[dict] = []
    error_warnings: List[str] = []
    interactive_checks: List[dict] = []
    reveal_sequence: List[dict] = []

# Simple in-memory store for the demo (to support the new /text and /guidance flow)
submission_store = {}

@router.post("/image", response_model=SubmissionResponse)
async def create_submission_image(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    text: Optional[str] = Form(None),  # Optional text context
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file (image or PDF) for homework help.
    Optionally include text context that will be sent to the AI along with the image.
    """
    # Validate file type
    file_ext = Path(file.filename).suffix.lower().replace('.', '')
    if file_ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    # Determine file type
    if file_ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        file_type = "image"
    elif file_ext == 'pdf':
        file_type = "pdf"
    else:
        file_type = "text"

    # Save uploaded file
    file_id = str(uuid.uuid4())
    file_path = Path(settings.UPLOAD_DIR) / f"{file_id}.{file_ext}"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    # Parse the submission (pass text context if provided)
    try:
        parsed_data = await parsing_orchestrator.parse_submission(
            file_path=str(file_path),
            text=text,  # Include text context
            file_type=file_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")

    # Classify the submission
    if parsed_data['detected_problems']:
        first_problem = parsed_data['detected_problems'][0]['text']
        classification = await openai_client.classify_submission(first_problem)
    else:
        classification = {
            "subject": "other",
            "topic": "unknown",
            "grade_level": 8,
            "difficulty": "intermediate",
            "prerequisites": [],
            "detected_gaps": []
        }

    # Create submission record
    submission = Submission(
        session_id=uuid.UUID(session_id) if session_id else None,
        file_path=str(file_path),
        file_type=file_type,
        raw_text=parsed_data['raw_text'],
        parsed_problems=parsed_data['detected_problems'],
        confidence_score=int(parsed_data['confidence_score']),
        subject=classification['subject'],
        topic=classification['topic'],
        grade_level=classification['grade_level'],
        difficulty=classification['difficulty'],
        prerequisites=classification['prerequisites'],
        detected_gaps=classification['detected_gaps']
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return submission


class TextSubmissionCreate(BaseModel):
    text: str
    session_id: Optional[str] = None

@router.post("/text", response_model=SubmissionResponse)
async def create_submission_text(
    submission_data: TextSubmissionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit typed text for homework help.
    """
    text = submission_data.text
    session_id = submission_data.session_id

    if not text or len(text.strip()) < 2:
        raise HTTPException(status_code=400, detail="Text too short")

    # Use Gemini for immediate dual response
    # Note: We are bypassing the full parsing orchestrator for speed in this "Zero-Friction" flow
    # But we still create a submission record for history
    
    # Classify briefly (or default)
    classification = {
        "subject": "general",
        "topic": "unknown",
        "grade_level": 8,
        "difficulty": "intermediate",
        "prerequisites": [],
        "detected_gaps": []
    }

    # Create submission record
    submission = Submission(
        session_id=uuid.UUID(session_id) if session_id else None,
        file_type="text",
        raw_text=text,
        parsed_problems=[{"text": text, "order": 0, "type": "text"}],
        confidence_score=100,
        subject=classification['subject'],
        topic=classification['topic'],
        grade_level=classification['grade_level'],
        difficulty=classification['difficulty'],
        prerequisites=classification['prerequisites'],
        detected_gaps=classification['detected_gaps']
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return submission


@router.get("/{submission_id}/guidance", response_model=GuidanceResponse)
async def get_guidance(
    submission_id: str,
    problem_index: int = 0,
    x_api_key: Optional[str] = Header(None),
    x_provider: Optional[str] = Header("gemini"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get scaffolded guidance for a specific problem in a submission.
    """
    # Fetch submission
    result = await db.execute(
        select(Submission).where(Submission.id == uuid.UUID(submission_id))
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Get the specific problem
    if problem_index >= len(submission.parsed_problems):
        raise HTTPException(status_code=400, detail="Invalid problem index")

    problem = submission.parsed_problems[problem_index]

    # Use LLMService for the dual response (Student + Parent)
    # We map the response to the GuidanceResponse structure
    
    llm_response = await llm_service.generate_dual_response(
        user_query=problem['text'],
        provider=x_provider,
        api_key=x_api_key
    )
    
    # Map to GuidanceResponse
    return {
        "micro_explanation": llm_response.get("student_response", ""),
        "step_breakdown": [], # Not used in this view
        "error_warnings": [
            f"Parent Tip: {llm_response.get('parent_context', {}).get('teaching_tips', '')}",
            f"Deeper Terms: {', '.join(llm_response.get('parent_context', {}).get('deeper_terms', []))}"
        ],
        "interactive_checks": [],
        "reveal_sequence": []
    }


@router.get("/{submission_id}/practice")
async def get_practice_problems(
    submission_id: str,
    problem_index: int = 0,
    count: int = 3,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate practice problems similar to the original.
    """
    # Fetch submission
    result = await db.execute(
        select(Submission).where(Submission.id == uuid.UUID(submission_id))
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if problem_index >= len(submission.parsed_problems):
        raise HTTPException(status_code=400, detail="Invalid problem index")

    problem = submission.parsed_problems[problem_index]

    # Generate practice problems
    practice_problems = await openai_client.generate_practice_problems(
        original_problem=problem['text'],
        subject=submission.subject or "other",
        topic=submission.topic or "unknown",
        difficulty=submission.difficulty or "intermediate",
        count=count
    )

    return {
        "submission_id": submission_id,
        "practice_problems": practice_problems
    }


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new learning session.
    """
    session = SessionModel(
        student_id=session_data.student_id,
        student_level=session_data.student_level
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get submission details by ID.
    """
    result = await db.execute(
        select(Submission).where(Submission.id == uuid.UUID(submission_id))
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    return submission
