import { HttpError, requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";
import { z } from "zod";

type AddonVariant = {
  id: string;
  name: string;
  price?: { amount?: number; interval?: string; description?: string };
};
type Addon = { type: string; name: string; variants?: AddonVariant[] };
type AddonsResponse = { selected_addons?: unknown[]; available_addons?: Addon[] };

const selectionSchema = z.object({
  addonType: z.string().min(1).max(100),
  variantId: z.string().min(1).max(100),
});

async function getAddons(ref: string) {
  return supabaseManagementRequest<AddonsResponse>(
    `/projects/${encodeURIComponent(ref)}/billing/addons`,
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) throw new HttpError(409, "Project is still provisioning");
    return Response.json(await getAddons(project.supabase_ref));
  } catch (e) { return fail(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) throw new HttpError(409, "Project is still provisioning");
    const { addonType, variantId } = selectionSchema.parse(await req.json());
    const current = await getAddons(project.supabase_ref);
    const addon = current.available_addons?.find(item => item.type === addonType);
    if (!addon?.type.toLowerCase().includes("compute")) {
      throw new HttpError(400, "Only compute add-ons can be changed here");
    }
    const variant = addon.variants?.find(item => item.id === variantId);
    if (!variant) throw new HttpError(400, "That compute option is not available for this project");
    await supabaseManagementRequest(
      `/projects/${encodeURIComponent(project.supabase_ref)}/billing/addons`,
      {
        method: "PATCH",
        body: JSON.stringify({ addon_type: addon.type, addon_variant: variant.id }),
      },
    );
    return Response.json({ ok: true, selected: variant });
  } catch (e) { return fail(e); }
}
