"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  id: string;
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}

export function SortableSection({ id, title, onRemove, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 8px 32px rgba(0,0,0,.5)" : "none",
    marginBottom: 24,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {/* Drag handle — only this triggers drag */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label={`Drag to reorder ${title}`}
          style={{
            flexShrink: 0,
            width: 24, height: 24,
            border: "none",
            background: "transparent",
            color: "#71717a",
            cursor: "grab",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hovered || isDragging ? 1 : 0,
            transition: "opacity .15s",
            padding: 0,
            borderRadius: 4,
          }}
        >
          {/* Six-dot grip */}
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <circle cx="3" cy="2" r="1.5"/><circle cx="9" cy="2" r="1.5"/>
            <circle cx="3" cy="7" r="1.5"/><circle cx="9" cy="7" r="1.5"/>
            <circle cx="3" cy="12" r="1.5"/><circle cx="9" cy="12" r="1.5"/>
          </svg>
        </button>

        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#f4f4f5", flex: 1 }}>{title}</h2>

        {/* Remove button */}
        <button
          onClick={onRemove}
          aria-label={`Remove ${title} section`}
          style={{
            flexShrink: 0,
            width: 28, height: 28,
            border: "1px solid #33333a",
            background: "transparent",
            color: "#71717a",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 6,
            opacity: hovered ? 1 : 0,
            transition: "opacity .15s",
            fontFamily: "inherit",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
