/**
 * Analytics — lightweight event tracking stub.
 * Drop in a real provider (Amplitude, PostHog, etc.) by replacing `logEvent`.
 */

type EventName =
  | 'generate_tap'
  | 'generate_success'
  | 'paywall_shown'
  | 'upgrade_tap';

type EventProps = Record<string, string | number | boolean>;

function logEvent(name: EventName, props?: EventProps): void {
  if (__DEV__) {
    console.log(`[analytics] ${name}`, props ?? {});
  }
  // TODO: forward to real analytics provider
  // e.g. amplitude.track(name, props);
}

export const analytics = {
  generateTap: (props?: EventProps) => logEvent('generate_tap', props),
  generateSuccess: (props?: EventProps) => logEvent('generate_success', props),
  paywallShown: (variant: 'soft' | 'hard') => logEvent('paywall_shown', { variant }),
  upgradeTap: () => logEvent('upgrade_tap'),
};
