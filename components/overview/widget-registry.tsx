import { RequestsCharts } from "./RequestsCharts";
import { AdvisorWidget } from "./AdvisorWidget";

// Each entry maps a widget id to its title and component.
// The component receives { projectId: string }.
// "project" is intentionally absent — it is rendered inline in OverviewPage
// because it needs multiple data sources (infra, stats, branches, backups).
//
// To add a new widget:
// 1. Create a component in components/overview/ that accepts { projectId: string }
// 2. Add an entry here: myWidget: { title: "My Widget", component: MyWidget }
// 3. Add "myWidget" to KNOWN_WIDGETS in lib/hooks/use-dashboard-layout.ts

export const WIDGET_REGISTRY: Record<
  string,
  { title: string; component: React.ComponentType<{ projectId: string }> }
> = {
  requests: { title: "Requests", component: RequestsCharts },
  advisor: { title: "Advisors", component: AdvisorWidget },
};
