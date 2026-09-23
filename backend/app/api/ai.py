import os
import json
from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.task import EnhanceTaskRequest, EnhanceTaskResponse

router = APIRouter(prefix="/tasks", tags=["AI Enhancement"])

@router.post("/enhance", response_model=EnhanceTaskResponse)
def enhance_task(
    payload: EnhanceTaskRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Enhances natural language task input into a polished title and description.
    Uses Google Gemini API or OpenAI API if key is configured in environment,
    with an automatic non-blocking fallback if no API key is provided.
    """
    prompt_text = payload.prompt.strip()

    # Check for Gemini API Key first
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            system_instruction = (
                "You are an expert productivity assistant. Convert raw natural language task input into "
                "a concise, actionable Title (max 60 chars) and a clear, detailed Description (1-3 sentences). "
                "Respond ONLY with a JSON object with keys 'title' and 'description'."
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_text,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json"
                )
            )

            parsed = json.loads(response.text)
            if "title" in parsed and "description" in parsed:
                return EnhanceTaskResponse(
                    title=parsed["title"].strip(),
                    description=parsed["description"].strip(),
                    ai_enhanced=True
                )
        except Exception:
            # Fall back gracefully on error
            pass

    # Fallback when AI API key is not configured or call fails
    cleaned_title = prompt_text.capitalize()
    fallback_desc = f"Action items and follow-up details for '{prompt_text}'."

    return EnhanceTaskResponse(
        title=cleaned_title,
        description=fallback_desc,
        ai_enhanced=False
    )
