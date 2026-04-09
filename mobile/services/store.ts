import { DMContext } from './anthropic';

export interface StoredDMs {
  dm1: string;
  dm2: string;
  dm3: string;
  platform: string;
}

let _last: StoredDMs | null = null;
let _context: DMContext | null = null;

export function setLastDMs(dms: StoredDMs): void { _last = dms; }
export function getLastDMs(): StoredDMs | null { return _last; }
export function setLastContext(ctx: DMContext): void { _context = ctx; }
export function getLastContext(): DMContext | null { return _context; }
