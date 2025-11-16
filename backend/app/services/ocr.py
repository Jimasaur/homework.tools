from openai import AsyncOpenAI
import fitz  # PyMuPDF
from pathlib import Path
from typing import Optional
import re
import base64
from app.config import settings


class OCRService:
    """Service for extracting text from images and PDFs using OpenAI Vision."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def extract_from_image(self, image_path: str) -> tuple[str, float]:
        """
        Extract text from an image file using OpenAI Vision.

        Returns:
            tuple: (extracted_text, confidence_score)
        """
        try:
            # Read and encode image
            with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')

            # Determine image format
            suffix = Path(image_path).suffix.lower()
            mime_type = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }.get(suffix, 'image/jpeg')

            # Use OpenAI Vision to extract text
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Extract ALL text from this image. This is a homework problem.

Include:
- All problem text, questions, and instructions
- Mathematical equations and expressions
- Diagrams labels or annotations
- Multiple choice options if present

Format the output as clean, readable text. Preserve problem numbering if present."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000,
                temperature=0.2
            )

            text = response.choices[0].message.content.strip()
            # OpenAI Vision is highly reliable, confidence is high
            confidence = 95.0 if text else 0.0

            return text, confidence

        except Exception as e:
            print(f"OCR Error: {e}")
            return "", 0.0

    async def extract_from_pdf(self, pdf_path: str) -> tuple[str, float]:
        """
        Extract text from a PDF file.
        First tries native text extraction, then falls back to OpenAI Vision for scanned PDFs.

        Returns:
            tuple: (extracted_text, confidence_score)
        """
        try:
            doc = fitz.open(pdf_path)
            text_parts = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                text_parts.append(text)

            full_text = "\n".join(text_parts).strip()

            # If native extraction yields good text, use it
            if len(full_text) > 50:  # Threshold for meaningful content
                confidence = 95.0
                doc.close()
                return full_text, confidence

            # Otherwise, convert pages to images and use OpenAI Vision
            print("PDF appears to be scanned, using OpenAI Vision...")
            all_text = []

            for page_num in range(min(len(doc), 5)):  # Limit to first 5 pages
                page = doc[page_num]
                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom
                img_path = f"/tmp/page_{page_num}.png"
                pix.save(img_path)

                # Extract text using Vision
                page_text, _ = await self.extract_from_image(img_path)
                all_text.append(page_text)

            doc.close()
            full_text = "\n\n".join(all_text).strip()
            confidence = 90.0 if full_text else 0.0

            return full_text, confidence

        except Exception as e:
            print(f"PDF Extraction Error: {e}")
            return "", 0.0

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters that might interfere
        text = re.sub(r'[^\w\s\d\+\-\*\/\=\(\)\.\,\?\!\:\;\"\']', '', text)

        return text.strip()

    @staticmethod
    def detect_problems(text: str) -> list[dict]:
        """
        Detect individual problems in text.
        Simple heuristic: split by numbered patterns (1., 2., etc.)
        """
        # Pattern for numbered problems: "1.", "2)", "Question 1:", etc.
        pattern = r'(?:^|\n)(?:\d+[\.\)]|\w+\s+\d+:)'

        splits = re.split(pattern, text)
        problems = []

        for idx, problem_text in enumerate(splits):
            if problem_text.strip():
                problems.append({
                    "text": problem_text.strip(),
                    "order": idx,
                    "type": None  # Will be classified later
                })

        # If no numbered problems found, treat entire text as one problem
        if len(problems) <= 1:
            problems = [{
                "text": text.strip(),
                "order": 0,
                "type": None
            }]

        return problems


class ParsingOrchestrator:
    """Orchestrates the parsing pipeline."""

    def __init__(self):
        self.ocr_service = OCRService()

    async def parse_submission(
        self,
        file_path: Optional[str],
        text: Optional[str],
        file_type: str
    ) -> dict:
        """
        Parse a submission and extract structured data.

        Args:
            file_path: Path to uploaded file (for image/pdf)
            text: Direct text input
            file_type: Type of submission (image, pdf, text)

        Returns:
            ParsedSubmission dict
        """
        if text:
            # Direct text input
            raw_text = text
            confidence = 100.0
        elif file_type == "image" and file_path:
            # Extract from image
            raw_text, confidence = await self.ocr_service.extract_from_image(file_path)
        elif file_type == "pdf" and file_path:
            # Extract from PDF
            raw_text, confidence = await self.ocr_service.extract_from_pdf(file_path)
        else:
            raise ValueError("Invalid submission: must provide text or file")

        # Clean the text
        cleaned_text = self.ocr_service.clean_text(raw_text)

        # Detect individual problems
        detected_problems = self.ocr_service.detect_problems(cleaned_text)

        return {
            "raw_text": raw_text,
            "cleaned_text": cleaned_text,
            "detected_problems": detected_problems,
            "confidence_score": confidence,
            "format": file_type
        }
