"use client";

import dynamic from "next/dynamic";

const OverviewClient = dynamic(
  () => import("@/components/overview/OverviewClient"),
  {
    ssr: false,
    loading: () => (
      <main style={{ padding: "32px 40px", background: "#0e0e0f", minHeight: "100vh" }}>
        <div style={{ color: "#a1a1aa", fontSize: 14 }}>Loading…</div>
      </main>
    ),
  }
);

export default function OverviewPage() {
  return <OverviewClient />;
}
