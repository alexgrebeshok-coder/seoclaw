"use client";

import { useContext } from "react";
import { DashboardContext } from "@/components/dashboard-provider";
import type { User } from "@/lib/types";

export function useCurrentUser(): User | null {
  const state = useContext(DashboardContext);
  return state?.currentUser ?? null;
}
