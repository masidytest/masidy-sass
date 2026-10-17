export function retailDomainPriceCents(amountUsd: number | string) {
  const amount = Number(amountUsd);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Domain provider returned an invalid price");
  return Math.ceil(amount * 120);
}
