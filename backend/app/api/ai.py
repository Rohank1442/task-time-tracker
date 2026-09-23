import os
import json
import time
import logging
from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.task import EnhanceTaskRequest, EnhanceTaskResponse

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/tasks", tags=["AI Enhancement"])

# Ordered list of active Gemini models to fallback across
GEMINI_MODELS = [
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
]

@router.post("/enhance", response_model=EnhanceTaskResponse)
def enhance_task(
    payload: EnhanceTaskRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Enhances natural language task input into a polished title and description.
    Uses Google Gemini API with automatic retry on 503 high demand spikes and
    model fallbacks, with a clean non-blocking fallback if all API calls fail.
    """
    prompt_text = payload.prompt.strip()

    # Retrieve key
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    
    if gemini_key and not gemini_key.startswith("your_") and len(gemini_key) > 5:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            system_instruction = (
                "You are an expert productivity assistant. Convert raw natural language task input into "
                "a concise, actionable Title (max 60 chars) and a clear, detailed Description (1-3 sentences). "
                "Respond ONLY with a JSON object with keys 'title' and 'description'."
            )

            for model_name in GEMINI_MODELS:
                # Retry up to 2 times per model if a temporary 503 high demand spike occurs
                for attempt in range(2):
                    try:
                        logger.info(f"Attempting Gemini model: {model_name} (attempt {attempt + 1})")
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
                            logger.info(f"Gemini enhancement SUCCESS with model {model_name}")
                            return EnhanceTaskResponse(
                                title=parsed["title"].strip(),
                                description=parsed["description"].strip(),
                                ai_enhanced=True
                            )
                    except Exception as model_err:
                        err_str = str(model_err)
                        logger.warning(f"Model {model_name} attempt {attempt + 1} error: {err_str}")
                        # If 503 high demand spike, pause briefly before retrying
                        if "503" in err_str or "UNAVAILABLE" in err_str:
                            time.sleep(0.5)
                            continue
                        else:
                            # 404 or other non-retryable error, switch to next model immediately
                            break

        except Exception as e:
            logger.error(f"Gemini client error: {str(e)}")

    logger.warning("Gemini enhancement failed or unavailable. Using default formatting.")

    cleaned_title = prompt_text.capitalize()
    fallback_desc = f"Action items and follow-up details for '{prompt_text}'."

    return EnhanceTaskResponse(
        title=cleaned_title,
        description=fallback_desc,
        ai_enhanced=False
    )
