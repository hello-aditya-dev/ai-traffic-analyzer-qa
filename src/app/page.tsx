"use client";

import { NavProvider, useNav } from "@/components/traffic/nav-context";
import { AppShell } from "@/components/traffic/app-shell";
import { OverviewView } from "@/components/traffic/views/overview";
import { ProjectsView } from "@/components/traffic/views/projects";
import { WorkspaceView } from "@/components/traffic/views/workspace";
import { ZonesView } from "@/components/traffic/views/zones";
import { LinesView } from "@/components/traffic/views/lines";
import { ResultsView } from "@/components/traffic/views/results";
import { EventsView } from "@/components/traffic/views/events";
import { ReportsView } from "@/components/traffic/views/reports";
import { SettingsView } from "@/components/traffic/views/settings";
import { OnboardingView } from "@/components/traffic/views/onboarding";
import { DemoView } from "@/components/traffic/views/demo";
import { DocsView } from "@/components/traffic/views/docs";

function ActiveView() {
  const { view } = useNav();
  switch (view) {
    case "overview": return <OverviewView />;
    case "projects": return <ProjectsView />;
    case "workspace": return <WorkspaceView />;
    case "zones": return <ZonesView />;
    case "lines": return <LinesView />;
    case "results": return <ResultsView />;
    case "events": return <EventsView />;
    case "reports": return <ReportsView />;
    case "settings": return <SettingsView />;
    case "onboarding": return <OnboardingView />;
    case "demo": return <DemoView />;
    case "docs": return <DocsView />;
    default: return <OverviewView />;
  }
}

export default function Home() {
  return (
    <NavProvider>
      <AppShell>
        <ActiveView />
      </AppShell>
    </NavProvider>
  );
}
