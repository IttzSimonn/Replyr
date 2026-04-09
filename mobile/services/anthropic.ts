import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE = 'anthropic_api_key';

const SYSTEM_PROMPT = `You are an expert in persuasion, social psychology, and real-world messaging.

Your job is to generate HIGH-CONVERTING direct messages (DMs) that maximize the probability of getting a reply.

The messages must feel natural, confident, and human — never robotic or AI-generated.

---

OBJECTIVE:
Your goal is NOT to sound smart.
Your goal is to GET A RESPONSE.

Each message must:
- spark curiosity, OR
- create immediate interest, OR
- feel personal enough to reply to

---

STRATEGIC THINKING (IMPORTANT):

Before writing anything:

1. Identify the MOST powerful angle based on the context:
   - What stands out most? (their business, vibe, situation, opportunity)
   - What would catch their attention fastest?

2. Decide what will make them reply:
   - curiosity?
   - value?
   - relatability?

3. Choose a clear intention for each DM:
   - Curiosity → make them ask a question back
   - Direct → make them see clear benefit
   - Casual → lower resistance and feel natural

---

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
- Slight curiosity is preferred

---

PERSONALIZATION RULE:
Each message MUST include something specific:
- reference the target (their content, business, vibe, situation)
OR
- use provided context

If no strong detail:
→ make a realistic assumption that feels natural

---

ANGLE STRUCTURE (MANDATORY):

DM 1 → Curiosity-based
Goal: make them WANT to reply

DM 2 → Direct value
Goal: clearly show why responding benefits them

DM 3 → Casual / observational
Goal: feel natural and easy to respond to

Each must feel clearly different.

---

STYLE ADAPTATION:

Instagram / WhatsApp:
→ casual, relaxed, slightly playful

LinkedIn:
→ clean, sharp, human (NOT corporate)

---

QUALITY CONTROL (CRITICAL):

Before finalizing each DM, check:
- Would a real person actually send this?
- Does it feel natural and not scripted?
- Does the first line grab attention?
- Would this stand out in their inbox?

If not → rewrite it.

---

OUTPUT FORMAT (use exactly this structure, no extra commentary):

DM 1:
[message]

DM 2:
[message]

DM 3:
[message]`;

export interface DMContext {
  intent: string;
  target: string;
  goal: string;
  tone: string;
  platform: string;
  senderInfo: string;
  targetContext: string;
}

export interface GeneratedDMs {
  dm1: string;
  dm2: string;
  dm3: string;
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_STORAGE);
}

export async function saveApiKey(key: string): Promise<void> {
  return SecureStore.setItemAsync(API_KEY_STORAGE, key.trim());
}

export async function deleteApiKey(): Promise<void> {
  return SecureStore.deleteItemAsync(API_KEY_STORAGE);
}

export async function generateDMs(context: DMContext): Promise<GeneratedDMs> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const userMessage =
    `Intent: ${context.intent}\n` +
    `Target person: ${context.target}\n` +
    `Goal: ${context.goal}\n` +
    `Tone: ${context.tone}\n` +
    `Platform: ${context.platform}\n` +
    `Sender info: ${context.senderInfo}\n` +
    `Extra context about target: ${context.targetContext || 'None provided'}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, any>;
    const msg = err?.error?.message ?? `API error (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find((b) => b.type === 'text')?.text ?? '';

  return parseDMs(text);
}

function parseDMs(text: string): GeneratedDMs {
  const dm1 = extract(text, 1);
  const dm2 = extract(text, 2);
  const dm3 = extract(text, 3);
  return { dm1, dm2, dm3 };
}

function extract(text: string, n: number): string {
  const next = n + 1;
  const pattern = new RegExp(
    `DM\\s*${n}[:\\s]+([\\s\\S]*?)(?=\\s*DM\\s*${next}[:\\s]|$)`,
    'i',
  );
  return text.match(pattern)?.[1]?.trim() ?? '';
}
