import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
    });
    console.log("Sentry initialized");
  }
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error("Error:", error, context);
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

export const setUserContext = (userId: string, email?: string) => {
  if (SENTRY_DSN) {
    Sentry.setUser({ id: userId, email });
  }
};