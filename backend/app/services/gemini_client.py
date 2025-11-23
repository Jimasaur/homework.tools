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
        prompt = f"""You are a helpful homework assistant for students and their parents.

        User Query: {user_query}
        Target Grade Level: {grade_level}

        Provide a JSON response with two distinct parts:
        1. "student_response": A clear, direct explanation that helps the student understand the concept. Be concise and respectful. Only use analogies if they genuinely clarify a difficult concept. Focus on helping them actually solve the problem or understand the topic.
        2. "parent_context": Additional context for parents including relevant technical terms, teaching suggestions, and common misconceptions to watch for.

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
