import type { Metadata } from "next";
import ComputeClient from "./compute-client";

export const metadata: Metadata = { title: "Compute" };

export default function ComputePage() {
  return <ComputeClient />;
}
