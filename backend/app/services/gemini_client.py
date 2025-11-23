import google.generativeai as genai
from app.config import settings
import json
import os

class GeminiClient:
    """Wrapper for Google Gemini API calls."""

    def __init__(self):
        # Configure the API key
        # Note: In a real scenario, ensure GOOGLE_API_KEY is set in environment
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
        
        self.model_name = "gemini-pro"
        self.vision_model_name = "gemini-pro-vision"

    async def generate_dual_response(self, user_query: str, grade_level: int = 8) -> dict:
        """
        Generate a dual response: Student Explanation + Parent Context.
        """
        prompt = f"""You are a homework assistant.
        
        User Query: {user_query}
        Target Grade Level: {grade_level}

        Provide a JSON response with two distinct parts:
        1. "student_response": A clear, simple, conceptual explanation for the student. Use analogies. Be encouraging.
        2. "parent_context": A deeper explanation for the parent, including technical terms, teaching tips, and what to look out for.

        Format:
        {{
            "student_response": "...",
            "parent_context": {{
                "deeper_terms": ["term1", "term2"],
                "teaching_tips": "...",
                "explanation": "..."
            }}
        }}
        """

        try:
            model = genai.GenerativeModel(self.model_name)
            response = await model.generate_content_async(prompt)
            
            # Clean up response text to ensure it's valid JSON
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            
            return json.loads(text)
        except Exception as e:
            print(f"Gemini error: {e}")
            return {
                "student_response": "I'm having trouble connecting to my brain right now. Please try again!",
                "parent_context": {
                    "deeper_terms": [],
                    "teaching_tips": "Check internet connection or API status.",
                    "explanation": "Error generating response."
                }
            }

# Singleton instance
gemini_client = GeminiClient()
