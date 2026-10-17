import { requireProject, fail } from "@/lib/auth";
import { domainPrice } from "@/lib/vercel";
import { retailDomainPriceCents } from "@/lib/domain-pricing";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireProject((await params).id, ["owner", "admin", "developer"]);
    const q = new URL(req.url).searchParams.get("q")?.toLowerCase().trim() ?? "";
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(q)) return Response.json({ error: "Enter a full domain, like yourapp.com" }, { status: 400 });
    const quote = await domainPrice(q);
    return Response.json({
      domain: q,
      available: quote.available,
      currency: "usd",
      purchaseAmountCents: quote.available ? retailDomainPriceCents(quote.purchasePrice) : null,
      renewalAmountCents: quote.available ? retailDomainPriceCents(quote.renewalPrice) : null,
      years: quote.years,
      markupPercent: 20,
    });
  } catch (e) { return fail(e); }
}
