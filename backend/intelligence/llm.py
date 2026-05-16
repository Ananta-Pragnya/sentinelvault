import json
import httpx
from config import get_settings

cfg = get_settings()

ALERT_SYSTEM_PROMPT = (
    "You are an alert intelligence analyst. Given a raw event cluster with "
    "anomaly scores, causal chain probabilities, and forecast data, produce:\n"
    "1. A title (max 12 words, plain English, no jargon)\n"
    "2. A summary (max 3 sentences explaining what happened, where, and why it matters)\n"
    "3. A rationale (max 5 bullet points showing the chain of reasoning)\n"
    'Format as JSON only, no markdown: {"title": str, "summary": str, "rationale_bullets": [str]}'
)

ASSISTANT_SYSTEM_PROMPT = (
    "You are an alert intelligence assistant for a financial and geopolitical "
    "risk platform. You have access to the user's recent alerts and profile. "
    "Answer questions about current risks, explain alerts, and identify exposures. "
    "Be concise, factual, and cite the alert IDs you are reasoning from."
)

_HEADERS = {
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
}


async def summarise_event(event_data: dict) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={**_HEADERS, "x-api-key": cfg.anthropic_api_key},
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "system": ALERT_SYSTEM_PROMPT,
                "messages": [{
                    "role": "user",
                    "content": f"Analyse this event cluster:\n\n{json.dumps(event_data, indent=2)}",
                }],
            },
        )
        response.raise_for_status()
        raw = response.json()["content"][0]["text"]
        return json.loads(raw)


async def assistant_response(message: str, history: list[dict], user_context: dict) -> str:
    context_block = (
        f"User profile: {json.dumps(user_context.get('profile', {}))}\n"
        f"Recent alerts (last 10): {json.dumps(user_context.get('recent_alerts', []), indent=2)}"
    )
    messages = history + [{
        "role": "user",
        "content": f"{context_block}\n\nUser question: {message}",
    }]
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={**_HEADERS, "x-api-key": cfg.anthropic_api_key},
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "system": ASSISTANT_SYSTEM_PROMPT,
                "messages": messages,
            },
        )
        response.raise_for_status()
        return response.json()["content"][0]["text"]
