"use client";

import { useEffect } from "react";
import { usePrefs } from "@/lib/client/prefs";

/** Keeps <html data-theme> in line with the setting after the first paint (see THEME_SCRIPT). */
export function ThemeSync() {
  const [prefs] = usePrefs();
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", prefs.theme);
  }, [prefs.theme]);
  return null;
}
