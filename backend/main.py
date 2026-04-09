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

SYSTEM_PROMPT = """You are an expert in persuasion, social psychology, and real-world messaging.

Your job is to generate HIGH-CONVERTING direct messages (DMs) that maximize the probability of getting a reply.

The messages must feel natural, confident, and human — never robotic or AI-generated.

OBJECTIVE:
Your goal is NOT to sound smart.
Your goal is to GET A RESPONSE.

Each message must:
- spark curiosity, OR
- create immediate interest, OR
- feel personal enough to reply to

WRITING RULES:
- Keep messages SHORT (1–3 lines max)
- First line MUST act as a strong hook
- Use natural, modern texting language
- Avoid perfect grammar if unnatural
- Avoid clichés and generic phrases
- NO AI phrases (e.g. "I hope this message finds you well")
- No long explanations
- No desperation
- Confidence > politeness

ANGLE STRUCTURE (MANDATORY):

DM 1 → Curiosity-based
Goal: make them WANT to reply

DM 2 → Direct value
Goal: clearly show why responding benefits them

DM 3 → Casual / observational
Goal: feel natural and easy to respond to

STYLE ADAPTATION:
Instagram / WhatsApp → casual, relaxed, slightly playful
LinkedIn → clean, sharp, human (NOT corporate)

OUTPUT FORMAT (use exactly this structure):

DM 1:
[message]

DM 2:
[message]

DM 3:
[message]"""


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
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Server API key not configured.")

    client = anthropic.Anthropic(api_key=api_key)

    user_message = (
        f"Intent: {req.intent}\n"
        f"Target person: {req.target}\n"
        f"Goal: {req.goal}\n"
        f"Tone: {req.tone}\n"
        f"Platform: {req.platform}\n"
        f"Sender info: {req.sender_info}\n"
        f"Extra context about target: {req.target_context or 'None provided'}"
    )

    try:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
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
