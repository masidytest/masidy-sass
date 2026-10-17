import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Compute" };

const ACCENT = "#75ea5e";

const tiers = [
  { name: "Nano", cpu: "Shared", ram: "512 MB", price: "Included", current: true },
  { name: "Micro", cpu: "2-core shared", ram: "1 GB", price: "$10/mo", current: false },
  { name: "Small", cpu: "2-core shared", ram: "2 GB", price: "$25/mo", current: false },
  { name: "Medium", cpu: "2-core shared", ram: "4 GB", price: "$50/mo", current: false },
  { name: "Large", cpu: "2-core dedicated", ram: "8 GB", price: "$100/mo", current: false },
  { name: "XL", cpu: "4-core dedicated", ram: "16 GB", price: "$200/mo", current: false },
];

export default function ComputePage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Compute</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Upgrade your compute size to get more CPU and RAM for your project.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        {tiers.map(({ name, cpu, ram, price, current }) => (
          <div key={name} style={{ border: `1px solid ${current ? ACCENT : "#26262a"}`, borderRadius: 12, background: "#151517", padding: 20, position: "relative" }}>
            {current && (
              <span style={{ position: "absolute", top: 12, right: 12, fontFamily: "'Geist Mono',monospace", fontSize: 10, padding: "2px 8px", borderRadius: 99, background: `${ACCENT}22`, color: ACCENT }}>CURRENT</span>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{name}</div>
            <div style={{ fontSize: 28, fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, marginBottom: 12 }}>{price}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#a1a1aa" }}>
              <span>CPU: {cpu}</span>
              <span>RAM: {ram}</span>
            </div>
            {!current && (
              <button style={{ marginTop: 16, width: "100%", padding: "8px 0", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                Upgrade to {name}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
