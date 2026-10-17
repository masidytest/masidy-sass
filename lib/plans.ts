export const planCatalog = {
  starter: { name: "Starter", amount: 500, projectLimit: 1, description: "For one project and getting started." },
  balance: { name: "Balance", amount: 1000, projectLimit: 5, description: "Room to grow with up to five projects." },
  pro: { name: "Pro", amount: 2500, projectLimit: 25, description: "For teams running up to twenty-five projects." },
} as const;

export type PaidPlan = keyof typeof planCatalog;
