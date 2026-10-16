import { requireProject, fail } from "@/lib/auth";
import { domainPrice } from "@/lib/vercel";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireProject((await params).id, ["owner", "admin", "developer"]);
    const q = new URL(req.url).searchParams.get("q")?.toLowerCase().trim() ?? "";
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(q)) return Response.json({ error: "Enter a full domain, like yourapp.com" }, { status: 400 });
    return Response.json(await domainPrice(q));
  } catch (e) { return fail(e); }
}
