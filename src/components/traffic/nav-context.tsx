"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type ViewId =
  | "overview"
  | "projects"
  | "workspace"
  | "zones"
  | "lines"
  | "results"
  | "events"
  | "reports"
  | "settings"
  | "onboarding"
  | "demo"
  | "docs";

export interface NavState {
  view: ViewId;
  projectId?: string;
  analysisId?: string;
}

interface NavContextValue extends NavState {
  navigate: (view: ViewId, opts?: { projectId?: string; analysisId?: string }) => void;
  openProject: (projectId: string, view?: ViewId) => void;
  openAnalysis: (analysisId: string, projectId?: string) => void;
  reset: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavState>({ view: "overview" });

  const navigate = useCallback((view: ViewId, opts?: { projectId?: string; analysisId?: string }) => {
    setState((s) => ({ view, projectId: opts?.projectId ?? s.projectId, analysisId: opts?.analysisId ?? s.analysisId }));
  }, []);

  const openProject = useCallback((projectId: string, view: ViewId = "workspace") => {
    setState({ view, projectId, analysisId: undefined });
  }, []);

  const openAnalysis = useCallback((analysisId: string, projectId?: string) => {
    setState((s) => ({ view: "workspace", projectId: projectId ?? s.projectId, analysisId }));
  }, []);

  const reset = useCallback(() => setState({ view: "overview" }), []);

  return (
    <NavContext.Provider value={{ ...state, navigate, openProject, openAnalysis, reset }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within NavProvider");
  return ctx;
}
