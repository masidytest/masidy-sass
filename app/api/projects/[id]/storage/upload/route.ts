import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireProject, fail } from "@/lib/auth";

// Client uploads: the browser sends the file straight to Blob using a short-lived token minted here.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireProject(id, ["owner", "admin", "developer"]);
    const body = (await req.json()) as HandleUploadBody;
    const json = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Tenant isolation: a project may only write under its own prefix.
        if (!pathname.startsWith(`${id}/`)) throw new Error("Invalid path");
        return { maximumSizeInBytes: 100 * 1024 * 1024 };
      },
      onUploadCompleted: async () => { /* record file metadata and usage here */ },
    });
    return Response.json(json);
  } catch (e) { return fail(e); }
}
