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
 * Generate 3 DMs. Supports both streaming (SSE) and plain JSON backends.
 * @param onChunk  Optional — called with accumulated text on each token for live UI.
 */
export function generateDMs(
  context: DMContext,
  onChunk?: (accumulated: string) => void,
): Promise<GeneratedDMs> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/generate`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 60000; // 60s — handles Render free-tier cold start

    let processed = 0;
    let fullText = '';

    xhr.onprogress = () => {
      // Parse SSE chunks as they arrive
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
          // partial chunk — next onprogress will complete it
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

      // Streaming backend: use accumulated SSE text
      if (fullText) {
        resolve({
          dm1: extractDM(fullText, 1),
          dm2: extractDM(fullText, 2),
          dm3: extractDM(fullText, 3),
        });
        return;
      }

      // Fallback: plain JSON backend (old format)
      try {
        const data = JSON.parse(xhr.responseText) as GeneratedDMs;
        if (data.dm1 || data.dm2 || data.dm3) {
          resolve(data);
          return;
        }
      } catch {}

      reject(new Error('No response from server. Please try again.'));
    };

    xhr.onerror = () => reject(new Error('Network error. Please try again.'));
    xhr.ontimeout = () => reject(new Error('Server is starting up — please try again in a moment.'));

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
