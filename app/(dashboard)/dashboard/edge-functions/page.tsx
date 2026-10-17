import type { Metadata } from "next";
import EdgeFunctionsClient from "./edge-functions-client";

export const metadata: Metadata = { title: "Edge Functions" };

export default function EdgeFunctionsPage() {
  return <EdgeFunctionsClient />;
}
