"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

type SavedQuery = { name: string; query: string };
type QueryRow = Record<string, unknown>;

const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;
const initialQuery = "SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'public'\nORDER BY table_name\nLIMIT 100;";

export default function SqlEditorPage() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<QueryRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [mode, setMode] = useState<"read" | "write">("read");

  useEffect(() => {
    if (!project) return;
    setSavedQueries([]);
    try {
      const stored = localStorage.getItem(`masidy_saved_queries_${project.id}`);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(item =>
          item && typeof item === "object" && "name" in item && typeof item.name === "string" &&
          "query" in item && typeof item.query === "string"
        )) {
          setSavedQueries(parsed as SavedQuery[]);
        } else {
          throw new Error("Saved query data has an invalid format.");
        }
      }
    } catch {
      setError("Saved queries could not be read from this browser.");
    }
  }, [project]);

  async function runQuery(e?: React.FormEvent) {
    e?.preventDefault();
    if (!project) return;
    if (mode === "write" && !window.confirm("Run this SQL directly against the project database? Database changes may be irreversible.")) return;
    setRunning(true);
    setError("");
    setStatusMessage("");
    setHasRun(false);
    try {
      const response = await fetch(`/api/projects/${project.id}/database/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Query failed");
      if (!Array.isArray(data.rows)) throw new Error("Database returned an unexpected query result");
      setRows(data.rows);
      setColumns(data.rows.length ? Object.keys(data.rows[0]) : []);
      setHasRun(true);
      if (mode === "write") setStatusMessage("SQL statement executed successfully.");
    } catch (e) {
      setRows([]);
      setColumns([]);
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setRunning(false);
    }
  }

  function saveQuery() {
    if (!project || !query.trim()) return;
    const name = window.prompt("Name this query");
    if (!name?.trim()) return;
    const next = [{ name: name.trim(), query }, ...savedQueries.filter(item => item.name !== name.trim())];
    try {
      localStorage.setItem(`masidy_saved_queries_${project.id}`, JSON.stringify(next));
      setSavedQueries(next);
      setError("");
    } catch {
      setError("Could not save the query in this browser.");
    }
  }

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>SQL editor</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Run bounded, read-only SELECT queries against your database.</p>
        </div>
        <button onClick={saveQuery} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Save query</button>
        <button onClick={() => void runQuery()} disabled={running} style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{running ? "Running…" : mode === "read" ? "Run query" : "Run SQL change"}</button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <label htmlFor="sql-mode" style={{ color: "#a1a1aa", fontSize: 13 }}>Execution mode</label>
        <select id="sql-mode" value={mode} onChange={event => setMode(event.target.value as "read" | "write")}
          style={{ padding: 8, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }}>
          <option value="read">Read-only SELECT</option>
          <option value="write">Owner SQL changes</option>
        </select>
        {mode === "write" && <span role="note" style={{ color: "#fca5a5", fontSize: 13 }}>Owner only. DDL/data changes are direct and may be irreversible; only one statement is allowed.</span>}
      </div>

      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      {statusMessage && <p role="status" style={{ color: "#75ea5e", fontSize: 14 }}>{statusMessage}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", gap: 20 }}>
        <section style={panel}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a", marginBottom: 10 }}>SAVED QUERIES</div>
          {savedQueries.length === 0 ? <p style={{ margin: "0 0 14px", fontSize: 14, color: "#a1a1aa" }}>Nothing saved yet.</p>
            : savedQueries.map((item, index) => (
              <div key={`${item.name}-${index}`} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 7 }}>
                <button onClick={() => setQuery(item.query)} title={item.query} style={{ ...panel, padding: "8px 10px", textAlign: "left", color: "#f4f4f5", cursor: "pointer", flex: 1 }}>{item.name}</button>
                <button aria-label={`Delete ${item.name}`} onClick={() => {
                  const next = savedQueries.filter((_, itemIndex) => itemIndex !== index);
                  try {
                    localStorage.setItem(`masidy_saved_queries_${project.id}`, JSON.stringify(next));
                    setSavedQueries(next);
                    setError("");
                  } catch {
                    setError("Could not update saved queries in this browser.");
                  }
                }} style={{ border: 0, background: "transparent", color: "#f87171", cursor: "pointer" }}>×</button>
              </div>
            ))}
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <form onSubmit={runQuery} style={panel}>
            <label htmlFor="sql-query" style={{ display: "block", marginBottom: 8, fontSize: 12, color: "#a1a1aa" }}>
              {mode === "read" ? "SQL · SELECT only · 500-row maximum" : "SQL · single statement · owner only"}
            </label>
            <textarea id="sql-query" value={query} onChange={e => setQuery(e.target.value)} spellCheck={false}
              style={{ display: "block", width: "100%", minHeight: 220, boxSizing: "border-box", resize: "vertical", padding: 14, background: "#0e0e0f", border: "1px solid #26262a", borderRadius: 8, color: "#e4e4e7", fontFamily: "'Geist Mono',monospace", fontSize: 13, lineHeight: 1.7 }} />
          </form>
          <section style={{ ...panel, minWidth: 0 }}>
            <div style={{ padding: "0 0 10px", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>RESULTS {hasRun && `· ${rows.length} ROW${rows.length === 1 ? "" : "S"}`}</div>
            {running ? <div style={{ padding: 40, textAlign: "center", color: "#a1a1aa" }}>Running query…</div>
              : error ? <div style={{ padding: 30, color: "#f87171" }}>The query failed; check the SQL and project access.</div>
              : !hasRun ? <div style={{ padding: 40, textAlign: "center", color: "#a1a1aa" }}>Run a SELECT query to see its results.</div>
              : rows.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#a1a1aa" }}>Query succeeded with no rows.</div>
              : <div style={{ overflow: "auto", maxHeight: 520 }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                  <thead><tr>{columns.map(column => <th key={column} style={{ position: "sticky", top: 0, background: "#151517", color: "#a1a1aa", fontFamily: "'Geist Mono',monospace", fontWeight: 500, textAlign: "left", padding: 10, borderBottom: "1px solid #33333a" }}>{column}</th>)}</tr></thead>
                  <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={column} style={{ padding: 10, borderBottom: "1px solid #26262a", verticalAlign: "top", maxWidth: 360, overflowWrap: "anywhere" }}>{row[column] == null ? <span style={{ color: "#71717a" }}>NULL</span> : typeof row[column] === "object" ? JSON.stringify(row[column]) : String(row[column])}</td>)}</tr>)}</tbody>
                </table>
              </div>}
          </section>
        </div>
      </div>
    </main>
  );
}
