"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/hooks/use-project";

type ProjectStats = { cpuLoad: number | null; disk: number | null; ram: number | null; connections: string | null };
type ComputeVariant = { id: string; name: string; price?: { amount?: number; interval?: string; description?: string } };
type ComputeAddon = { type: string; name: string; variants: ComputeVariant[] };
type AddonsData = { selected_addons?: { type: string; variant: ComputeVariant }[]; available_addons?: ComputeAddon[] };
const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;

export default function ComputeClient() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addons, setAddons] = useState<AddonsData | null>(null);
  const [addonsError, setAddonsError] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [changingCompute, setChangingCompute] = useState(false);
  const [computeMessage, setComputeMessage] = useState("");

  const loadAddons = useCallback(async () => {
    if (!project) return;
    setAddonsError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/compute`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load compute options");
      if (!Array.isArray(data.available_addons) || !Array.isArray(data.selected_addons)) {
        throw new Error("Compute options returned an unexpected response");
      }
      setAddons(data);
      const computeAddon = data.available_addons.find((item: ComputeAddon) => item.type.toLowerCase().includes("compute"));
      const current = data.selected_addons.find((item: { type: string }) => item.type.toLowerCase().includes("compute"));
      setSelectedVariant(current?.variant.id ?? computeAddon?.variants[0]?.id ?? "");
    } catch (e) {
      setAddonsError(e instanceof Error ? e.message : "Could not load compute options");
    }
  }, [project]);

  const loadStats = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/stats`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load compute usage");
      setStats(data);
    } catch (e) {
      setStats(null);
      setError(e instanceof Error ? e.message : "Could not load compute usage");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { void loadAddons(); }, [loadAddons]);

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  const metrics = [
    { label: "CPU load · 15m", value: stats?.cpuLoad == null ? "Unavailable" : stats.cpuLoad.toFixed(2) },
    { label: "Memory utilization", value: stats?.ram == null ? "Unavailable" : `${stats.ram}%` },
    { label: "Disk usage", value: stats?.disk == null ? "Unavailable" : `${stats.disk}%` },
    { label: "Database connections", value: stats?.connections ?? "Unavailable" },
  ];
  const computeAddon = addons?.available_addons?.find(item => item.type.toLowerCase().includes("compute"));
  const currentCompute = addons?.selected_addons?.find(item => item.type.toLowerCase().includes("compute"));
  const selectedOption = computeAddon?.variants.find(variant => variant.id === selectedVariant);

  async function changeCompute() {
    if (!project || !computeAddon || !selectedOption) return;
    const monthly = selectedOption.price?.amount == null
      ? "pricing is not reported"
      : `${new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(selectedOption.price.amount / 100)} ${selectedOption.price.interval ?? "monthly"}`;
    if (!window.confirm(`Change ${computeAddon.name} to ${selectedOption.name} (${monthly})? This may add charges to your project.`)) return;
    setChangingCompute(true);
    setComputeMessage("");
    setAddonsError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/compute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addonType: computeAddon.type, variantId: selectedOption.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not change compute size");
      setComputeMessage("Compute change submitted.");
      await loadAddons();
      await loadStats();
    } catch (e) {
      setAddonsError(e instanceof Error ? e.message : "Could not change compute size");
    } finally {
      setChangingCompute(false);
    }
  }

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Compute</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Live resource and connection metrics for {project.name}.</p>
        </div>
        <button onClick={() => void loadStats()} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {metrics.map(metric => (
          <section key={metric.label} style={panel}>
            <div style={{ color: "#a1a1aa", fontSize: 13 }}>{metric.label}</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 700 }}>{loading ? "…" : metric.value}</div>
          </section>
        ))}
      </div>
      <section style={{ ...panel, marginTop: 20 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>Compute changes</h2>
        {addonsError && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{addonsError}</p>}
        {computeMessage && <p role="status" style={{ color: "#75ea5e", fontSize: 14 }}>{computeMessage}</p>}
        {computeAddon ? <>
          <p style={{ margin: "0 0 12px", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>
            Current {computeAddon.name}: <strong style={{ color: "#f4f4f5" }}>{currentCompute?.variant.name ?? "Default"}</strong>. A compute change may add charges; the available price is shown below.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={selectedVariant} onChange={event => setSelectedVariant(event.target.value)}
              style={{ minWidth: 220, padding: 9, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }}>
              {computeAddon.variants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}{variant.price?.amount == null ? "" : ` · ${new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(variant.price.amount / 100)}/${variant.price.interval === "yearly" ? "yr" : "mo"}`}
                </option>
              ))}
            </select>
            <button onClick={() => void changeCompute()} disabled={changingCompute || !selectedOption || selectedOption.id === currentCompute?.variant.id}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {changingCompute ? "Submitting…" : "Change compute size"}
            </button>
          </div>
        </> : !addonsError ? <p style={{ margin: 0, color: "#a1a1aa", fontSize: 13 }}>
          No compute options are available for this project.
        </p> : null}
        <Link href="/dashboard/plans" style={{ display: "inline-block", marginTop: 14, color: "#75ea5e", fontSize: 13 }}>View your Masidy plan</Link>
      </section>
    </main>
  );
}
