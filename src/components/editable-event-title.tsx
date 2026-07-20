"use client";

import { useState, useTransition } from "react";
import { updateEventTitle } from "@/app/[locale]/events/[id]/actions";

export function EditableEventTitle({
  eventId,
  base,
  readOnly,
}: {
  eventId: string;
  base: string;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(base);
  const [current, setCurrent] = useState(base);
  const [isPending, startTransition] = useTransition();

  function save() {
    const trimmed = value.trim();
    setEditing(false);
    if (!trimmed || trimmed === current) {
      setValue(current);
      return;
    }
    setCurrent(trimmed);
    startTransition(async () => {
      await updateEventTitle(eventId, trimmed);
    });
  }

  if (readOnly) return <>{current}</>;

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setValue(current);
            setEditing(false);
          }
        }}
        className="w-72 max-w-full rounded border border-brand bg-transparent px-1 align-baseline text-xl font-semibold outline-none"
      />
    );
  }

  return (
    <span
      onClick={() => {
        setValue(current);
        setEditing(true);
      }}
      className="cursor-pointer rounded px-1 hover:bg-black/5"
    >
      {current}
    </span>
  );
}
