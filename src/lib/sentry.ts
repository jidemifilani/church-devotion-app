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

export { Sentry };
