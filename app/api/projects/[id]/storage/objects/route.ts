import { createClient } from "@supabase/supabase-js";
import { fail, requireProject } from "@/lib/auth";
import { projectServiceRoleKey } from "@/lib/supabase-mgmt";
import { z } from "zod";

const objectInput = z.object({
  bucket: z.string().min(1).max(63),
  path: z.string().min(1).max(1024),
});

async function storageClient(ref: string) {
  const key = await projectServiceRoleKey(ref);
  return createClient(`https://${ref}.supabase.co`, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).storage;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const url = new URL(req.url);
    const bucket = z.string().min(1).max(63).parse(url.searchParams.get("bucket"));
    const path = url.searchParams.get("path");
    const storage = await storageClient(project.supabase_ref);
    if (path) {
      if (path.startsWith("/") || path.split("/").includes("..")) {
        return Response.json({ error: "Invalid storage path" }, { status: 400 });
      }
      const { data, error } = await storage.from(bucket).createSignedUrl(path, 120);
      if (error) return Response.json({ error: error.message }, { status: 502 });
      return Response.json({ url: data.signedUrl });
    }
    const prefix = url.searchParams.get("prefix") ?? "";
    if (prefix.length > 1024 || prefix.startsWith("/") || prefix.split("/").includes("..")) {
      return Response.json({ error: "Invalid storage path" }, { status: 400 });
    }
    const offset = Number(url.searchParams.get("offset") ?? "0");
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10_000) {
      return Response.json({ error: "Offset must be between 0 and 10000" }, { status: 400 });
    }
    const { data, error } = await storage
      .from(bucket)
      .list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) return Response.json({ error: error.message }, { status: 502 });
    return Response.json({ objects: data, prefix, offset, hasMore: data.length === 100 });
  } catch (e) { return fail(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const form = await req.formData();
    const input = objectInput.parse({
      bucket: form.get("bucket"),
      path: form.get("path"),
    });
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "A file is required" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) {
      return Response.json({ error: "Files must be 4 MB or smaller" }, { status: 413 });
    }
    if (input.path.startsWith("/") || input.path.split("/").includes("..")) {
      return Response.json({ error: "Invalid storage path" }, { status: 400 });
    }
    const { data, error } = await (await storageClient(project.supabase_ref))
      .from(input.bucket)
      .upload(input.path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) return Response.json({ error: error.message }, { status: 502 });
    return Response.json({ object: data }, { status: 201 });
  } catch (e) { return fail(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const input = objectInput.parse(await req.json());
    if (input.path.startsWith("/") || input.path.split("/").includes("..")) {
      return Response.json({ error: "Invalid storage path" }, { status: 400 });
    }
    const { data, error } = await (await storageClient(project.supabase_ref))
      .from(input.bucket)
      .remove([input.path]);
    if (error) return Response.json({ error: error.message }, { status: 502 });
    return Response.json({ removed: data });
  } catch (e) { return fail(e); }
}
