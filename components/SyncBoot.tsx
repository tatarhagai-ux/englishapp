"use client";

import { useEffect } from "react";
import { startAutoSync } from "@/lib/client/sync";

/** Starts cross-device sync once per visit. Does nothing until Supabase is set up. */
export function SyncBoot() {
  useEffect(() => startAutoSync(), []);
  return null;
}
