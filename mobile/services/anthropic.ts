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

function extractDM(text: string, n: number): string {
  const pattern = new RegExp(
    `DM\\s*${n}[:\\s]+([\\s\\S]*?)(?=\\s*DM\\s*${n + 1}[:\\s]|$)`,
    'i',
  );
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

/**
 * Generate 3 DMs via a streaming SSE endpoint.
 * @param onChunk  Called with the accumulated raw text on every token — use this
 *                 to show live output in the UI while waiting.
 */
export function generateDMs(
  context: DMContext,
  onChunk?: (accumulated: string) => void,
): Promise<GeneratedDMs> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/generate`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 30000;

    let processed = 0;
    let fullText = '';

    xhr.onprogress = () => {
      // Only process newly arrived bytes
      const newData = xhr.responseText.slice(processed);
      processed = xhr.responseText.length;

      for (const line of newData.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload) as { t?: string; error?: string };
          if (parsed.error) { reject(new Error(parsed.error)); return; }
          if (parsed.t) {
            fullText += parsed.t;
            onChunk?.(fullText);
          }
        } catch {
          // partial JSON chunk — ignore, next onprogress will have more
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status !== 200) {
        try {
          const err = JSON.parse(xhr.responseText) as Record<string, any>;
          reject(new Error(err.detail ?? `Server error (${xhr.status})`));
        } catch {
          reject(new Error(`Server error (${xhr.status})`));
        }
        return;
      }
      resolve({
        dm1: extractDM(fullText, 1),
        dm2: extractDM(fullText, 2),
        dm3: extractDM(fullText, 3),
      });
    };

    xhr.onerror = () => reject(new Error('Network error. Please try again.'));
    xhr.ontimeout = () => reject(new Error('Request timed out. Please try again.'));

    xhr.send(JSON.stringify({
      intent: context.intent,
      target: context.target,
      goal: context.goal,
      tone: context.tone,
      platform: context.platform,
      sender_info: context.senderInfo,
      target_context: context.targetContext,
    }));
  });
}
