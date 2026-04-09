import { BACKEND_URL } from '../config';

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

export async function generateDMs(context: DMContext): Promise<GeneratedDMs> {
  const response = await fetch(`${BACKEND_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: context.intent,
      target: context.target,
      goal: context.goal,
      tone: context.tone,
      platform: context.platform,
      sender_info: context.senderInfo,
      target_context: context.targetContext,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, any>;
    const msg = err?.detail ?? `Server error (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json() as GeneratedDMs;
  return data;
}
