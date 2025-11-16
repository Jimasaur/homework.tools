from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from pathlib import Path
import aiofiles

from app.database import get_db
from app.models import Submission, Session as SessionModel
from app.schemas import (
    SubmissionResponse,
    GuidanceResponse,
    PracticeProblem,
    SessionCreate,
    SessionResponse
)
from app.services.ocr import ParsingOrchestrator
from app.services.openai_client import openai_client
from app.config import settings

router = APIRouter()
parsing_orchestrator = ParsingOrchestrator()


@router.post("/upload", response_model=SubmissionResponse)
async def create_submission_upload(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file (image or PDF) for homework help.
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

    # Parse the submission
    try:
        parsed_data = await parsing_orchestrator.parse_submission(
            file_path=str(file_path),
            text=None,
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


@router.post("/text", response_model=SubmissionResponse)
async def create_submission_text(
    text: str = Form(...),
    session_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit typed text for homework help.
    """
    if not text or len(text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Text too short")

    # Parse the submission
    try:
        parsed_data = await parsing_orchestrator.parse_submission(
            file_path=None,
            text=text,
            file_type="text"
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
        file_type="text",
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


@router.get("/{submission_id}/guidance", response_model=GuidanceResponse)
async def get_guidance(
    submission_id: str,
    problem_index: int = 0,
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

    # Get session for scaffolding mode
    scaffolding_mode = "moderate"
    if submission.session_id:
        session_result = await db.execute(
            select(SessionModel).where(SessionModel.id == submission.session_id)
        )
        session = session_result.scalar_one_or_none()
        if session:
            scaffolding_mode = session.scaffolding_mode

    # Generate guidance
    guidance = await openai_client.generate_guidance(
        problem_text=problem['text'],
        subject=submission.subject or "other",
        grade_level=submission.grade_level or 8,
        scaffolding_mode=scaffolding_mode
    )

    return guidance


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
