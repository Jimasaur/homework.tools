from openai import AsyncOpenAI
from app.config import settings
import json
from typing import Optional, List


class OpenAIClient:
    """Wrapper for OpenAI API calls."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model_reasoning = "gpt-4o"
        self.model_classification = "gpt-4o-mini"

    async def classify_submission(self, problem_text: str) -> dict:
        """
        Classify a problem's subject, topic, grade level, and difficulty.

        Returns:
            ClassifiedSubmission dict
        """
        prompt = f"""Analyze this homework problem and classify it.

Problem:
{problem_text}

Provide a JSON response with:
- subject: one of [math, reading_comp, writing, science, other]
- topic: specific topic (e.g., "algebra-linear-equations", "biology-cell-structure")
- grade_level: integer 1-12
- difficulty: one of [basic, intermediate, advanced]
- prerequisites: list of prerequisite knowledge areas
- detected_gaps: list of potential knowledge gaps if student struggles with this

Response format:
{{
    "subject": "math",
    "topic": "algebra-linear-equations",
    "grade_level": 8,
    "difficulty": "intermediate",
    "prerequisites": ["basic arithmetic", "order of operations"],
    "detected_gaps": []
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model_classification,
                messages=[
                    {"role": "system", "content": "You are an expert educator who classifies homework problems."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            print(f"Classification error: {e}")
            # Return default classification
            return {
                "subject": "other",
                "topic": "unknown",
                "grade_level": 8,
                "difficulty": "intermediate",
                "prerequisites": [],
                "detected_gaps": []
            }

    async def generate_guidance(
        self,
        problem_text: str,
        subject: str,
        grade_level: int,
        scaffolding_mode: str = "moderate"
    ) -> dict:
        """
        Generate scaffolded guidance for a problem.

        Returns:
            GuidanceResponse dict
        """
        scaffolding_instructions = {
            "minimal": "Provide brief hints. Student needs little support.",
            "moderate": "Provide clear step-by-step guidance with strategic hints.",
            "heavy": "Provide detailed explanations with multiple checkpoints."
        }

        prompt = f"""You are a patient tutor helping a grade {grade_level} student.

Problem:
{problem_text}

Subject: {subject}
Scaffolding level: {scaffolding_mode}

{scaffolding_instructions.get(scaffolding_mode, scaffolding_instructions['moderate'])}

Generate guidance as JSON with:
- micro_explanation: 2-3 sentences explaining the concept (grade-appropriate)
- step_breakdown: list of steps, each with "order", "text", and optional "hint"
- error_warnings: list of common mistakes students make
- interactive_checks: list of questions to check understanding (text + explanation)
- reveal_sequence: progressive hints from level 1-4

IMPORTANT: Never provide direct answers. Guide with questions and hints.

Example format:
{{
    "micro_explanation": "This is a linear equation...",
    "step_breakdown": [
        {{"order": 1, "text": "What operation removes +5?", "hint": "Think inverse operations"}},
        {{"order": 2, "text": "After subtracting 5, what do you have?", "hint": null}}
    ],
    "error_warnings": ["Don't subtract from only one side"],
    "interactive_checks": [
        {{"text": "What's 13 - 5?", "expected_answer": "8", "explanation": "Good! Now you have 2x = 8"}}
    ],
    "reveal_sequence": [
        {{"level": 1, "content": "Think about inverse operations", "reveal_type": "hint"}},
        {{"level": 2, "content": "Subtract 5 from both sides", "reveal_type": "hint"}},
        {{"level": 3, "content": "2x + 5 - 5 = 13 - 5, so 2x = 8", "reveal_type": "partial"}},
        {{"level": 4, "content": "2x = 8, divide both sides by 2, x = 4", "reveal_type": "full"}}
    ]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model_reasoning,
                messages=[
                    {"role": "system", "content": "You are an educational tutor focused on teaching, not giving answers."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            print(f"Guidance generation error: {e}")
            return {
                "micro_explanation": "Let's work through this step by step.",
                "step_breakdown": [],
                "error_warnings": [],
                "interactive_checks": [],
                "reveal_sequence": []
            }

    async def generate_practice_problems(
        self,
        original_problem: str,
        subject: str,
        topic: str,
        difficulty: str,
        count: int = 3
    ) -> List[dict]:
        """
        Generate practice problems similar to the original.

        Returns:
            List of PracticeProblem dicts
        """
        prompt = f"""Generate {count} practice problems similar to this one:

Original Problem:
{original_problem}

Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

Create variations:
1. Same structure, different numbers
2. Same concept, slightly different format
3. Multi-step variation (if applicable)

Return JSON array:
[
    {{
        "text": "Problem 1 text...",
        "difficulty": "basic",
        "variation_type": "same_structure",
        "solution": "Step-by-step solution (for teacher reference)"
    }},
    ...
]"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model_reasoning,
                messages=[
                    {"role": "system", "content": "You are an expert at creating practice problems."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.8
            )

            result = json.loads(response.choices[0].message.content)
            # Handle both array and object responses
            if isinstance(result, dict) and "problems" in result:
                return result["problems"]
            elif isinstance(result, list):
                return result
            else:
                return []

        except Exception as e:
            print(f"Practice generation error: {e}")
            return []

    async def evaluate_answer(
        self,
        problem_text: str,
        student_answer: str,
        expected_answer: Optional[str] = None
    ) -> dict:
        """
        Evaluate a student's answer.

        Returns:
            dict with is_correct, feedback, next_hint
        """
        prompt = f"""Evaluate this student's answer.

Problem:
{problem_text}

Student's Answer:
{student_answer}

{"Expected Answer: " + expected_answer if expected_answer else ""}

Provide JSON:
{{
    "is_correct": true/false,
    "feedback": "Constructive feedback (be encouraging!)",
    "next_hint": "Hint if wrong, or null if correct"
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model_classification,
                messages=[
                    {"role": "system", "content": "You are an encouraging tutor evaluating student work."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.5
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            print(f"Evaluation error: {e}")
            return {
                "is_correct": False,
                "feedback": "Let's try again!",
                "next_hint": "Review the problem and try once more."
            }


# Singleton instance
openai_client = OpenAIClient()
