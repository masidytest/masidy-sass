import type { Metadata } from "next";
import RealtimeClient from "./realtime-client";

export const metadata: Metadata = { title: "Realtime" };

export default function RealtimePage() {
  return <RealtimeClient />;
}
