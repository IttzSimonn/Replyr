from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Replyr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Module-level client — instantiated once, reused across requests
_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Server API key not configured.")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


# Cached — never changes between requests, so Haiku will serve this from cache
SYSTEM_PROMPT = """You are a persuasion expert. Write 3 high-converting DMs that get real replies.

Rules:
- 1–3 lines max per DM, strong hook on the first line
- Natural and human — never robotic or AI-sounding
- No clichés, no "I hope this finds you well"
- Confidence > politeness
- Adapt style: Instagram/WhatsApp = casual; LinkedIn = sharp but human

Output exactly this format:

DM 1:
[curiosity-based — makes them want to reply]

DM 2:
[direct value — shows what's in it for them]

DM 3:
[casual/observational — feels easy to reply to]"""


class DMRequest(BaseModel):
    intent: str
    target: str
    goal: str
    tone: str
    platform: str
    sender_info: str
    target_context: str = ""


class DMResponse(BaseModel):
    dm1: str
    dm2: str
    dm3: str


@app.get("/")
def health():
    return {"status": "ok", "service": "Replyr API"}


@app.post("/generate", response_model=DMResponse)
def generate_dms(req: DMRequest):
    client = get_client()

    user_message = (
        f"Intent: {req.intent}\n"
        f"Target: {req.target}\n"
        f"Goal: {req.goal}\n"
        f"Tone: {req.tone}\n"
        f"Platform: {req.platform}\n"
        f"About sender: {req.sender_info}"
    )
    if req.target_context:
        user_message += f"\nAbout target: {req.target_context}"

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=450,
            system=[{
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=str(e))

    text = next(
        (b.text for b in response.content if b.type == "text"), ""
    )

    return DMResponse(
        dm1=_extract(text, 1),
        dm2=_extract(text, 2),
        dm3=_extract(text, 3),
    )


def _extract(text: str, n: int) -> str:
    pattern = rf"DM\s*{n}[:\s]+([\s\S]*?)(?=\s*DM\s*{n+1}[:\s]|$)"
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else ""
