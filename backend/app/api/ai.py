import os
import json
import logging
from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.task import EnhanceTaskRequest, EnhanceTaskResponse

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/tasks", tags=["AI Enhancement"])

# List of Gemini models to try in order of preference
GEMINI_MODELS = [
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
]

@router.post("/enhance", response_model=EnhanceTaskResponse)
def enhance_task(
    payload: EnhanceTaskRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Enhances natural language task input into a polished title and description.
    Uses Google Gemini API if configured, trying latest supported model versions,
    with an automatic non-blocking fallback if no valid key/model is available.
    """
    prompt_text = payload.prompt.strip()

    # Check for Gemini API Key
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    
    if gemini_key and not gemini_key.startswith("your_") and len(gemini_key) > 10:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            system_instruction = (
                "You are an expert productivity assistant. Convert raw natural language task input into "
                "a concise, actionable Title (max 60 chars) and a clear, detailed Description (1-3 sentences). "
                "Respond ONLY with a JSON object with keys 'title' and 'description'."
            )

            # Try generating content with supported models
            for model_name in GEMINI_MODELS:
                try:
                    response = client.models.generate_content(
                        model=model_name,
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
                except Exception as model_err:
                    logger.warning(f"Model {model_name} failed: {str(model_err)}")
                    continue

        except Exception as e:
            logger.warning(f"Gemini API client initialization failed: {str(e)}")

    # Fallback when AI API key is not configured or call fails
    cleaned_title = prompt_text.capitalize()
    fallback_desc = f"Action items and follow-up details for '{prompt_text}'."

    return EnhanceTaskResponse(
        title=cleaned_title,
        description=fallback_desc,
        ai_enhanced=False
    )
