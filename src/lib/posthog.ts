"use client";

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const isBrowser = typeof window !== "undefined";

export const isPosthogConfigured = Boolean(posthogApiKey && posthogHost);

interface PosthogWindow extends Window {
  __POSTHOG_INITIALIZED?: boolean;
  posthog?: {
    capture: (...args: unknown[]) => void;
    identify: (...args: unknown[]) => void;
    reset: () => void;
    init: (apiKey: string, options: Record<string, unknown>) => void;
  };
}

// Lazy load posthog-js only in browser
let posthogInstance: PosthogWindow["posthog"] | null = null;

function getPosthog(): PosthogWindow["posthog"] | null {
  if (!isBrowser) {
    return null;
  }

  if (posthogInstance) {
    return posthogInstance;
  }

  try {
    // Use dynamic import to avoid SSR issues
    // We need require here because dynamic import() is async and we need sync access
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const posthogModule = require("posthog-js");
    posthogInstance = (posthogModule.default ||
      posthogModule) as PosthogWindow["posthog"];
    return posthogInstance;
  } catch (error) {
    console.warn("PostHog not available:", error);
    return null;
  }
}

export function initPosthog() {
  if (!isPosthogConfigured || !isBrowser) {
    return;
  }

  const win = window as PosthogWindow;
  if (win.__POSTHOG_INITIALIZED) {
    return;
  }

  const apiKey = posthogApiKey;
  const host = posthogHost;
  if (!apiKey || !host) {
    return;
  }

  const posthog = getPosthog();
  if (!posthog) {
    return;
  }

  posthog.init(apiKey, {
    api_host: "/ingest", // Use Next.js proxy to avoid ad blockers
    ui_host: host,
    persistence: "localStorage+cookie",
    capture_pageview: false,
    capture_pageleave: false,
    debug: false, // Disable debug for performance
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_compression: false,
    enable_recording_console_log: false,
    // Disable feature flags to avoid extra requests
    advanced_disable_feature_flags: true,
    advanced_disable_feature_flags_on_first_load: true,
    advanced_disable_decide: true,
    loaded: () => {
      win.__POSTHOG_INITIALIZED = true;
    },
  });

  win.__POSTHOG_INITIALIZED = true;
}

// Export a safe posthog object that only works in browser
export const posthog = {
  capture: (...args: unknown[]) => {
    const ph = getPosthog();
    if (ph && typeof ph.capture === "function") {
      try {
        ph.capture(...args);
      } catch (error) {
        console.warn("PostHog capture error:", error);
      }
    }
  },
  identify: (...args: unknown[]) => {
    const ph = getPosthog();
    if (ph && typeof ph.identify === "function") {
      try {
        ph.identify(...args);
      } catch (error) {
        console.warn("PostHog identify error:", error);
      }
    }
  },
  reset: () => {
    const ph = getPosthog();
    if (ph && typeof ph.reset === "function") {
      try {
        ph.reset();
      } catch (error) {
        console.warn("PostHog reset error:", error);
      }
    }
  },
};
