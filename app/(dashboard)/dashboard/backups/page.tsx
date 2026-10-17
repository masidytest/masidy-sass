import type { Metadata } from "next";
import BackupsClient from "./backups-client";

export const metadata: Metadata = { title: "Backups" };

export default function BackupsPage() {
  return <BackupsClient />;
}
