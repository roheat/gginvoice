"use client";

import posthog from "posthog-js";

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const isBrowser = typeof window !== "undefined";

export const isPosthogConfigured = Boolean(posthogApiKey && posthogHost);

interface PosthogWindow extends Window {
  __POSTHOG_INITIALIZED?: boolean;
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
    loaded: (ph) => {
      win.__POSTHOG_INITIALIZED = true;
    },
  });

  win.__POSTHOG_INITIALIZED = true;
}

export { posthog };

