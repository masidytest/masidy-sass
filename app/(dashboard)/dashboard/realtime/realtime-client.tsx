"use client";

import { useEffect, useState } from "react";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { useProject } from "@/lib/hooks/use-project";

type Message = { id: string; text: string; receivedAt: string };
const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;
const button = { padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" } as const;

export default function RealtimeClient() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState(0);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!project) {
      setLoading(false);
      return;
    }
    if (!project.supabase_ref || project.status !== "active") {
      setLoading(false);
      setError("Project is not active yet.");
      return;
    }
    const activeProject = project;
    let active = true;
    let realtimeClient: SupabaseClient | null = null;
    let realtimeChannel: RealtimeChannel | null = null;
    setLoading(true);
    setError("");

    async function connect() {
      const [keysResponse, tablesResponse] = await Promise.all([
        fetch(`/api/projects/${activeProject.id}/keys`),
        fetch(`/api/projects/${activeProject.id}/database/tables`),
      ]);
      const [keys, tableData] = await Promise.all([keysResponse.json(), tablesResponse.json()]);
      if (!keysResponse.ok) throw new Error(keys.error ?? "Could not load the project public key");
      if (!tablesResponse.ok) throw new Error(tableData.error ?? "Could not load database tables");
      if (typeof keys.publicKey !== "string" || !keys.publicKey) throw new Error("Project public key is unavailable");
      if (!Array.isArray(tableData.tables)) throw new Error("Database returned an unexpected tables response");
      const tableNames = tableData.tables.map((table: { name: string }) => table.name);
      if (active) {
        setTables(tableNames);
        setSelectedTable(current => tableNames.includes(current) ? current : tableNames[0] ?? "");
      }
      realtimeClient = createClient(`https://${activeProject.supabase_ref}.supabase.co`, keys.publicKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      realtimeChannel = realtimeClient.channel(`masidy-console-${activeProject.id}`, {
        config: { broadcast: { self: true }, presence: { key: crypto.randomUUID() } },
      });
      realtimeChannel.on("broadcast", { event: "console-message" }, event => {
          const payload = event.payload as { id?: string; text?: string; receivedAt?: string };
          if (payload.id && typeof payload.text === "string") {
            setMessages(current => [...current, {
              id: payload.id!,
              text: payload.text!,
              receivedAt: payload.receivedAt ?? new Date().toISOString(),
            }].slice(-50));
          }
        });
      if (selectedTable) realtimeChannel.on("postgres_changes", { event: "*", schema: "public", table: selectedTable }, payload => {
          setMessages(current => [...current, {
            id: crypto.randomUUID(),
            text: `${payload.eventType} on public.${selectedTable}: ${JSON.stringify(payload).slice(0, 1200)}`,
            receivedAt: new Date().toISOString(),
          }].slice(-50));
        });
      realtimeChannel.on("presence", { event: "sync" }, () => {
          setPeers(Object.keys(realtimeChannel!.presenceState()).length);
        }).subscribe(status => {
          if (!active) return;
          if (status === "SUBSCRIBED") {
            setConnected(true);
            void realtimeChannel!.track({ joined_at: new Date().toISOString() })
              .then(result => { if (result !== "ok") setError(`Presence tracking failed: ${result}`); });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnected(false);
            if (status !== "CLOSED") setError(`Realtime connection status: ${status}`);
          }
        });
      if (active) {
        setClient(realtimeClient);
        setChannel(realtimeChannel);
      }
    }

    connect().catch(e => {
      if (active) setError(e instanceof Error ? e.message : "Could not connect to Realtime");
    }).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      setConnected(false);
      if (realtimeClient && realtimeChannel) void realtimeClient.removeChannel(realtimeChannel);
    };
  }, [project, selectedTable]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!channel || !client || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const payload = { id: crypto.randomUUID(), text: message.trim(), receivedAt: new Date().toISOString() };
      const result = await channel.send({ type: "broadcast", event: "console-message", payload });
      if (result !== "ok") throw new Error(`Realtime broadcast failed: ${result}`);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Realtime</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Test broadcast messages and subscribe to live Postgres changes for a public table.</p>
      </div>
      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 5px", fontSize: 16 }}>Live project channel</h2>
            <div style={{ color: "#a1a1aa", fontSize: 12 }}>masidy-console-{project.id}</div>
          </div>
          <div style={{ color: connected ? "#75ea5e" : "#a1a1aa", fontSize: 13 }}>
            {loading ? "Connecting…" : connected ? `Connected · ${peers} console participant${peers === 1 ? "" : "s"}` : "Disconnected"}
          </div>
        </div>
        <p style={{ margin: "0 0 16px", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>
          Broadcast messages are ephemeral and are not stored. Postgres events require the selected table to be enabled in the <code>supabase_realtime</code> publication and readable under its RLS policies. Participant count includes only dashboards on this channel.
        </p>
        <label htmlFor="realtime-table" style={{ display: "block", marginBottom: 7, fontSize: 13, color: "#a1a1aa" }}>Subscribe to public table changes</label>
        <select id="realtime-table" value={selectedTable} disabled={tables.length === 0}
          onChange={event => { setMessages([]); setSelectedTable(event.target.value); }}
          style={{ width: "100%", maxWidth: 420, padding: 9, marginBottom: 14, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }}>
          {tables.length === 0 ? <option value="">No public tables available</option>
            : tables.map(table => <option key={table} value={table}>{table}</option>)}
        </select>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label htmlFor="realtime-message" style={{ position: "absolute", left: -9999 }}>Broadcast message</label>
          <input id="realtime-message" value={message} maxLength={500} onChange={e => setMessage(e.target.value)} placeholder="Type a test message"
            style={{ flex: "1 1 240px", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit" }} />
          <button type="submit" disabled={!connected || sending || !message.trim()} style={{ ...button, opacity: !connected || sending ? 0.5 : 1 }}>{sending ? "Sending…" : "Broadcast"}</button>
        </form>
        <div style={{ marginTop: 18, borderTop: "1px solid #26262a", paddingTop: 12 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Recent broadcasts</h3>
          {messages.length === 0 ? <p style={{ margin: 0, color: "#a1a1aa", fontSize: 13 }}>No messages received in this session.</p>
            : messages.map(item => <div key={item.id} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: "1px solid #26262a", fontSize: 13 }}>
              <time style={{ color: "#71717a", whiteSpace: "nowrap" }}>{new Date(item.receivedAt).toLocaleTimeString()}</time>
              <span style={{ overflowWrap: "anywhere" }}>{item.text}</span>
            </div>)}
        </div>
      </section>
    </main>
  );
}
