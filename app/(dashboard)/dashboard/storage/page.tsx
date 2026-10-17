"use client";

import { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

type Bucket = { id: string; name: string; public: boolean; created_at: string };
type StoredObject = {
  id: string | null;
  name: string;
  created_at?: string;
  updated_at?: string;
  metadata?: { size?: number; mimetype?: string } | null;
};

const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;
const button = { padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" } as const;

export default function StoragePage() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [objects, setObjects] = useState<StoredObject[]>([]);
  const [objectOffset, setObjectOffset] = useState(0);
  const [objectsHaveMore, setObjectsHaveMore] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newBucket, setNewBucket] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBuckets = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/storage/buckets`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load buckets");
      if (!Array.isArray(data)) throw new Error("Storage returned an unexpected bucket list");
      setBuckets(data);
      setSelected(current => current && data.some((item: Bucket) => item.id === current) ? current : data[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load buckets");
    } finally {
      setLoading(false);
    }
  }, [project]);

  const loadObjects = useCallback(async (bucket: string, folder: string, offset: number) => {
    if (!project) return;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ bucket, prefix: folder, offset: String(offset) });
      const response = await fetch(`/api/projects/${project.id}/storage/objects?${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load files");
      if (!Array.isArray(data.objects) || typeof data.hasMore !== "boolean") {
        throw new Error("Storage returned an unexpected file list");
      }
      setObjects(data.objects);
      setObjectOffset(offset);
      setObjectsHaveMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load files");
      setObjects([]);
      setObjectsHaveMore(false);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { void loadBuckets(); }, [loadBuckets]);
  useEffect(() => {
    if (selected) void loadObjects(selected, prefix, 0);
    else {
      setObjects([]);
      setObjectOffset(0);
      setObjectsHaveMore(false);
    }
  }, [selected, prefix, loadObjects]);

  async function createBucket(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !newBucket.trim()) return;
    setCreating(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/storage/buckets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBucket.trim(), public: isPublic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create bucket");
      setNewBucket("");
      setShowForm(false);
      setMessage("Bucket created.");
      await loadBuckets();
      setSelected(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create bucket");
    } finally {
      setCreating(false);
    }
  }

  async function uploadFile(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !selected || !file) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const form = new FormData();
      form.set("bucket", selected);
      form.set("path", `${prefix}${file.name}`);
      form.set("file", file);
      const response = await fetch(`/api/projects/${project.id}/storage/objects`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not upload file");
      setFile(null);
      setMessage("File uploaded.");
      await loadObjects(selected, prefix, objectOffset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload file");
    } finally {
      setUploading(false);
    }
  }

  async function downloadObject(path: string) {
    if (!project || !selected) return;
    setError("");
    try {
      const query = new URLSearchParams({ bucket: selected, path, download: "true" });
      const response = await fetch(`/api/projects/${project.id}/storage/objects?${query}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Could not download file");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = path.split("/").pop() || "download";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download file");
    }
  }

  async function deleteObject(path: string) {
    if (!project || !selected || !window.confirm(`Delete ${path}? This cannot be undone.`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${project.id}/storage/objects`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: selected, path }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete file");
      setMessage("File deleted.");
      await loadObjects(selected, prefix, objectOffset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete file");
    }
  }

  const selectedBucket = buckets.find(bucket => bucket.id === selected);
  const pathParts = prefix.split("/").filter(Boolean);

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Storage</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Manage your project's buckets and files.</p>
        </div>
        <button onClick={() => setShowForm(value => !value)} style={{ ...button, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600 }}>
          New bucket
        </button>
      </div>

      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      {message && <p role="status" style={{ color: "#75ea5e", fontSize: 14 }}>{message}</p>}

      {showForm && (
        <form onSubmit={createBucket} style={{ ...panel, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 16 }}>Create a bucket</h2>
          <label htmlFor="bucket-name" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Bucket name</label>
          <input id="bucket-name" required value={newBucket} onChange={e => setNewBucket(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="my-bucket" maxLength={63}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 12 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#a1a1aa", marginBottom: 14 }}>
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> Public bucket
          </label>
          <button type="submit" disabled={creating} style={button}>{creating ? "Creating…" : "Create bucket"}</button>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", gap: 20 }}>
        <section style={panel}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a", marginBottom: 10 }}>BUCKETS</div>
          {loading && buckets.length === 0 ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>Loading…</p>
            : error && buckets.length === 0 ? <div role="alert" style={{ color: "#f87171", fontSize: 13 }}>{error}<button onClick={() => void loadBuckets()} style={button}>Retry</button></div>
            : buckets.length === 0 ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>No buckets yet.</p>
            : buckets.map(bucket => (
              <button key={bucket.id} onClick={() => { setSelected(bucket.id); setPrefix(""); }}
                style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: 0, background: selected === bucket.id ? "#1c1c1f" : "transparent", color: selected === bucket.id ? "#f4f4f5" : "#a1a1aa", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginBottom: 2 }}>
                {bucket.name}{bucket.public && <span style={{ marginLeft: 6, fontSize: 10, color: "#71717a" }}>public</span>}
              </button>
            ))}
        </section>

        <section style={{ ...panel, minWidth: 0 }}>
          {!selected ? <div style={{ padding: "50px 20px", textAlign: "center", color: "#a1a1aa" }}>Select or create a bucket.</div> : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <div>
                  <h2 style={{ margin: "0 0 5px", fontSize: 16 }}>{selectedBucket?.name}</h2>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                    <button onClick={() => setPrefix("")} style={{ ...button, padding: "3px 7px", border: 0 }}>Root</button>
                    {pathParts.map((part, index) => (
                      <span key={`${part}-${index}`}>
                        / <button onClick={() => setPrefix(pathParts.slice(0, index + 1).join("/") + "/")} style={{ ...button, padding: "3px 7px", border: 0 }}>{part}</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => void loadObjects(selected, prefix, objectOffset)} disabled={loading} style={button}>
                    {loading ? "Refreshing…" : "Refresh"}
                  </button>
                  <form onSubmit={uploadFile} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} aria-label="Choose a file to upload" />
                    <button type="submit" disabled={!file || uploading} style={{ ...button, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600 }}>
                      {uploading ? "Uploading…" : "Upload"}
                    </button>
                  </form>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,2fr) 1fr auto", gap: 12, padding: "10px 0", borderBottom: "1px solid #26262a", color: "#71717a", fontSize: 11, fontFamily: "'Geist Mono',monospace" }}>
                  <span>NAME</span><span>SIZE</span><span>ACTIONS</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 12, color: "#a1a1aa", fontSize: 12 }}>
                  <span>Showing {objects.length ? objectOffset + 1 : 0}–{objectOffset + objects.length}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { if (selected) void loadObjects(selected, prefix, Math.max(0, objectOffset - 100)); }}
                      disabled={loading || objectOffset === 0} style={button}>Previous</button>
                    <button onClick={() => { if (selected) void loadObjects(selected, prefix, objectOffset + 100); }}
                      disabled={loading || !objectsHaveMore || objectOffset >= 10_000} style={button}>Next</button>
                  </div>
                </div>
                {loading ? <p style={{ padding: 20, color: "#a1a1aa" }}>Loading files…</p>
                  : error ? <p role="alert" style={{ padding: 20, color: "#f87171" }}>Files could not be loaded.</p>
                  : objects.length === 0 ? <p style={{ padding: 20, color: "#a1a1aa" }}>This folder is empty.</p>
                  : objects.map(object => {
                    const folder = !object.id && !object.metadata;
                    const objectPath = `${prefix}${object.name}`;
                    return (
                      <div key={objectPath} style={{ display: "grid", gridTemplateColumns: "minmax(180px,2fr) 1fr auto", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: "1px solid #26262a", fontSize: 13 }}>
                        <span style={{ overflowWrap: "anywhere" }}>{folder ? "[folder] " : ""}{object.name}</span>
                        <span style={{ color: "#a1a1aa" }}>{object.metadata?.size == null ? "—" : `${(object.metadata.size / 1024).toFixed(1)} KB`}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {folder ? <button onClick={() => setPrefix(`${objectPath}/`)} style={button}>Open</button> : (
                            <>
                              <button onClick={() => void downloadObject(objectPath)} style={button}>Download</button>
                              <button onClick={() => void deleteObject(objectPath)} style={{ ...button, color: "#f87171" }}>Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
