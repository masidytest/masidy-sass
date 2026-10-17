"use client";

import { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

type TableInfo = { name: string; columns: { column_name: string; data_type: string; is_nullable: string }[] };
type TableData = { columns: { column_name: string; data_type: string }[]; rows: Record<string, unknown>[]; hasMore: boolean; offset: number };

const panel = { border: "1px solid #26262a", background: "#151517", borderRadius: 10 } as const;
const button = { padding: "7px 12px", borderRadius: 7, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" } as const;

function toCsv(columns: string[], rows: Record<string, unknown>[]) {
  const escape = (value: unknown) => `"${(value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)).replaceAll('"', '""')}"`;
  return [columns.map(escape).join(","), ...rows.map(row => columns.map(column => escape(row[column])).join(","))].join("\r\n");
}

export default function TableEditorClient() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inserting, setInserting] = useState(false);
  const [showInsert, setShowInsert] = useState(false);
  const [insertJson, setInsertJson] = useState("{}");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTables = useCallback(async () => {
    if (!project) return;
    setTablesLoading(true);
    try {
      setError("");
      const response = await fetch(`/api/projects/${project.id}/database/tables`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load database tables");
      if (!Array.isArray(data.tables)) throw new Error("Database returned an unexpected tables response");
      setTables(data.tables);
      setSelected(current => data.tables.some((table: TableInfo) => table.name === current) ? current : data.tables[0]?.name ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load database tables");
    } finally {
      setTablesLoading(false);
    }
  }, [project]);

  const loadRows = useCallback(async (table: string, pageOffset: number) => {
    if (!project || !table) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/database/tables/${encodeURIComponent(table)}?offset=${pageOffset}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load table rows");
      setTableData(data);
    } catch (e) {
      setTableData(null);
      setError(e instanceof Error ? e.message : "Could not load table rows");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { void loadTables(); }, [loadTables]);
  useEffect(() => { setOffset(0); }, [selected]);
  useEffect(() => { if (selected) void loadRows(selected, offset); }, [selected, offset, loadRows]);

  async function insertRow(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !selected) return;
    setInserting(true);
    setError("");
    setMessage("");
    try {
      const values: unknown = JSON.parse(insertJson);
      if (!values || Array.isArray(values) || typeof values !== "object") throw new Error("Enter a JSON object with column names and values.");
      const response = await fetch(`/api/projects/${project.id}/database/tables/${encodeURIComponent(selected)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not insert row");
      setShowInsert(false);
      setInsertJson("{}");
      setMessage("Row inserted.");
      setOffset(0);
      await loadRows(selected, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not insert row");
    } finally {
      setInserting(false);
    }
  }

  function exportRows() {
    if (!tableData) return;
    const blob = new Blob([toCsv(tableData.columns.map(column => column.column_name), tableData.rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected}-${offset}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (projectLoading) return <main style={{ padding: 32, color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: 32, color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  const columns = tableData?.columns ?? [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #26262a", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{selected || "Tables"}</h1>
        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, padding: "3px 8px", borderRadius: 99, border: "1px solid #33333a", color: "#a1a1aa" }}>PUBLIC SCHEMA · 100 ROW PAGE</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => {
          void loadTables();
          if (selected) void loadRows(selected, offset);
        }} disabled={tablesLoading || loading} style={button}>Refresh</button>
        <button onClick={exportRows} disabled={!tableData || tableData.rows.length === 0} style={button}>Export CSV</button>
        <button onClick={() => { setInsertJson("{}"); setShowInsert(true); }} disabled={!selected} style={{ ...button, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600 }}>Insert row</button>
      </div>

      {error && <p role="alert" style={{ margin: "12px 20px", color: "#f87171", fontSize: 14 }}>{error}</p>}
      {message && <p role="status" style={{ margin: "12px 20px", color: "#75ea5e", fontSize: 14 }}>{message}</p>}
      {showInsert && (
        <form onSubmit={insertRow} style={{ ...panel, margin: 20, padding: 16 }}>
          <label htmlFor="insert-json" style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#a1a1aa" }}>Row values as JSON. Omit columns with database defaults.</label>
          <textarea id="insert-json" value={insertJson} onChange={e => setInsertJson(e.target.value)} rows={5}
            style={{ width: "100%", boxSizing: "border-box", padding: 12, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", fontFamily: "'Geist Mono',monospace", fontSize: 13 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="submit" disabled={inserting} style={{ ...button, background: "#f4f4f5", color: "#0b0b0c" }}>{inserting ? "Inserting…" : "Insert"}</button>
            <button type="button" onClick={() => setShowInsert(false)} style={button}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 400 }}>
        <aside style={{ width: 240, flexShrink: 0, borderRight: "1px solid #26262a", padding: "16px 12px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a", padding: "0 8px 8px" }}>PUBLIC TABLES</div>
          {tablesLoading ? <p style={{ padding: 8, color: "#a1a1aa", fontSize: 13 }}>Loading…</p>
            : error && tables.length === 0 ? <p role="alert" style={{ padding: 8, color: "#f87171", fontSize: 13 }}>Table list could not be loaded.</p>
            : tables.length === 0 ? <p style={{ padding: 8, color: "#a1a1aa", fontSize: 13 }}>No public tables found.</p>
            : tables.map(table => (
              <button key={table.name} onClick={() => setSelected(table.name)} style={{ display: "block", width: "100%", padding: 8, border: 0, borderRadius: 7, background: selected === table.name ? "#1c1c1f" : "transparent", color: selected === table.name ? "#f4f4f5" : "#a1a1aa", fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginBottom: 2 }}>
                {table.name}<span style={{ float: "right", color: "#71717a", fontSize: 11 }}>{table.columns.length}</span>
              </button>
            ))}
        </aside>

        <main style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          {!selected ? <div style={{ padding: 56, color: error ? "#f87171" : "#a1a1aa", textAlign: "center" }}>{error ? "The public table list could not be loaded." : "Your public tables will appear here."}</div>
            : loading ? <div style={{ padding: 56, color: "#a1a1aa", textAlign: "center" }}>Loading rows…</div>
            : tableData && tableData.rows.length === 0 ? <div style={{ padding: 56, color: "#a1a1aa", textAlign: "center" }}>This table has no rows on this page.</div>
            : tableData && (
              <>
                <div style={{ overflow: "auto" }}>
                  <table style={{ borderCollapse: "collapse", minWidth: "100%", fontSize: 12 }}>
                    <thead><tr>{columns.map(column => <th key={column.column_name} style={{ padding: "10px 14px", borderBottom: "1px solid #26262a", color: "#a1a1aa", fontFamily: "'Geist Mono',monospace", fontWeight: 500, textAlign: "left", whiteSpace: "nowrap" }}>{column.column_name}<span style={{ display: "block", color: "#71717a", fontSize: 10 }}>{column.data_type}</span></th>)}</tr></thead>
                    <tbody>{tableData.rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={column.column_name} style={{ padding: "10px 14px", borderBottom: "1px solid #26262a", maxWidth: 400, overflowWrap: "anywhere", verticalAlign: "top" }}>{row[column.column_name] == null ? <span style={{ color: "#71717a" }}>NULL</span> : typeof row[column.column_name] === "object" ? JSON.stringify(row[column.column_name]) : String(row[column.column_name])}</td>)}</tr>)}</tbody>
                  </table>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: 14, color: "#a1a1aa", fontSize: 13 }}>
                  <span>Rows {offset + 1}–{offset + tableData.rows.length}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 100))} style={button}>Previous</button>
                    <button disabled={!tableData.hasMore} onClick={() => setOffset(offset + 100)} style={button}>Next</button>
                  </div>
                </div>
              </>
            )}
        </main>
      </div>
    </div>
  );
}
