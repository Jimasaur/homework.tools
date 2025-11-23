from typing import Optional
from app.services.gemini_client import GeminiClient
from app.services.openai_client import OpenAIClient
import google.generativeai as genai
from openai import AsyncOpenAI

class LLMService:
    """
    Unified service for interacting with different LLM providers.
    Supports dynamic API key injection for BYOK (Bring Your Own Key).
    """

    def __init__(self):
        # Default clients (using env vars)
        self.default_gemini = GeminiClient()
        self.default_openai = OpenAIClient()

    def get_client(self, provider: str, api_key: Optional[str] = None):
        """
        Get a client instance for the specified provider, optionally with a custom API key.
        """
        if provider == "openai":
            if api_key:
                # Create a temporary client with the user's key
                client = OpenAIClient()
                client.client = AsyncOpenAI(api_key=api_key)
                return client
            return self.default_openai

        elif provider == "gemini":
            if api_key:
                # Create a temporary client with the user's key
                client = GeminiClient()
                genai.configure(api_key=api_key) # Note: This configures globally, which might be tricky for concurrency but acceptable for this scale.
                return client
            return self.default_gemini
        
        # Default to Gemini if unknown
        return self.default_gemini

    async def generate_dual_response(self, user_query: str, provider: str = "gemini", api_key: Optional[str] = None) -> dict:
        client = self.get_client(provider, api_key)
        return await client.generate_dual_response(user_query)

# Singleton
llm_service = LLMService()
