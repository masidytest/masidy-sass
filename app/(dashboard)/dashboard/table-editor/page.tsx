import type { Metadata } from "next";
import TableEditorClient from "./table-editor-client";

export const metadata: Metadata = { title: "Table editor" };

export default function TableEditorPage() {
  return <TableEditorClient />;
}
