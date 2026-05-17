import json
import httpx
from config import get_settings

cfg = get_settings()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

ALERT_SYSTEM_PROMPT = (
    "You are an alert intelligence analyst. Given a raw event cluster with "
    "anomaly scores, causal chain probabilities, and forecast data, produce:\n"
    "1. A title (max 12 words, plain English, no jargon)\n"
    "2. A summary (max 3 sentences explaining what happened, where, and why it matters)\n"
    "3. A rationale (max 5 bullet points showing the chain of reasoning)\n"
    'Respond with JSON only, no markdown fences: {"title": str, "summary": str, "rationale_bullets": [str]}'
)

ASSISTANT_SYSTEM_PROMPT = (
    "You are an alert intelligence assistant for a financial and geopolitical "
    "risk platform. You have access to the user's recent alerts and profile. "
    "Answer questions about current risks, explain alerts, and identify exposures. "
    "Be concise, factual, and cite the alert IDs you are reasoning from."
)


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {cfg.groq_api_key}",
        "Content-Type": "application/json",
    }


async def summarise_event(event_data: dict) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GROQ_API_URL,
            headers=_headers(),
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": ALERT_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Analyse this event cluster:\n\n{json.dumps(event_data, indent=2)}",
                    },
                ],
                "max_tokens": 1024,
                "temperature": 0.3,
            },
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"]
        return json.loads(raw)


async def assistant_response(message: str, history: list[dict], user_context: dict) -> str:
    context_block = (
        f"User profile: {json.dumps(user_context.get('profile', {}))}\n"
        f"Recent alerts (last 10): {json.dumps(user_context.get('recent_alerts', []), indent=2)}"
    )
    messages = (
        [{"role": "system", "content": ASSISTANT_SYSTEM_PROMPT}]
        + history
        + [{"role": "user", "content": f"{context_block}\n\nUser question: {message}"}]
    )
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            GROQ_API_URL,
            headers=_headers(),
            json={
                "model": MODEL,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.5,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
