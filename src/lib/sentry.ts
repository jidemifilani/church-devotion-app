import type { ComponentType } from 'react';
import * as Sentry from '@sentry/react-native';

// no-ops until EXPO_PUBLIC_SENTRY_DSN is set (needs a Sentry account/project —
// see .env.example). Safe to import unconditionally either way.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
  });
}

// Sentry.wrap() starts an app-start span even without init(), which then
// warns that the span "could not be finished" when there's no DSN to report
// it to — only wrap when Sentry is actually initialized.
export function wrapRoot(component: ComponentType<Record<string, never>>): ComponentType<Record<string, never>> {
  return dsn ? Sentry.wrap(component) : component;
}

export { Sentry };
