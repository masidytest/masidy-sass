"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DashboardLayout } from "@/lib/types/overview";

const LS_KEY = "masidy_dash_layout";
const PREF_KEY = "dashboard_layout";
const DEFAULT_WIDGETS = ["project", "requests", "advisor"];
const KNOWN_WIDGETS = new Set(["project", "requests", "advisor"]);

function sanitize(raw: unknown): string[] {
  if (!Array.isArray(raw)) return DEFAULT_WIDGETS;
  const filtered = (raw as unknown[]).filter(
    (id): id is string => typeof id === "string" && KNOWN_WIDGETS.has(id)
  );
  return filtered.length > 0 ? filtered : DEFAULT_WIDGETS;
}

export function useDashboardLayout() {
  const [widgets, setWidgetsState] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_WIDGETS;
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? sanitize(JSON.parse(raw)) : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from server on mount, server wins over localStorage
  useEffect(() => {
    fetch("/api/user/preferences")
      .then(r => r.json())
      .then((data: unknown) => {
        if (data && typeof data === "object" && "widgets" in data) {
          const serverWidgets = sanitize((data as DashboardLayout).widgets);
          setWidgetsState(serverWidgets);
          localStorage.setItem(LS_KEY, JSON.stringify(serverWidgets));
        }
      })
      .catch(() => {}); // silently fall back to localStorage
  }, []);

  const setWidgets = useCallback((next: string[]) => {
    const sanitized = sanitize(next);
    setWidgetsState(sanitized);
    // Instant localStorage write
    localStorage.setItem(LS_KEY, JSON.stringify(sanitized));
    // Debounced server write
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: sanitized } satisfies DashboardLayout),
      }).catch(() => {});
    }, 800);
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, [setWidgets]);

  return { widgets, setWidgets, resetLayout, KNOWN_WIDGETS };
}
