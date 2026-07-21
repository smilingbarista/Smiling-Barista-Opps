"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  uploadEventImage,
  deleteEventImage,
} from "@/app/[locale]/events/[id]/actions";
import type { EventImageRow } from "@/lib/types";

function publicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-images/${path}`;
}

export function EventImages({
  eventId,
  images,
  readOnly = false,
}: {
  eventId: string;
  images: EventImageRow[];
  readOnly?: boolean;
}) {
  const t = useTranslations("event");
  const common = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (readOnly && images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && <h2 className="font-medium">{t("images")}</h2>}
      {images.length === 0 && readOnly === false && (
        <p className="text-sm text-black/50">{t("noImages")}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicUrl(img.path)}
              alt=""
              className="h-32 w-32 rounded border border-black/10 object-cover"
            />
            {!readOnly && (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteEventImage(eventId, img.id, img.path);
                  })
                }
                className="no-print absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                aria-label={common("delete")}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <form
            ref={formRef}
            action={(formData) =>
              startTransition(async () => {
                setError(null);
                const result = await uploadEventImage(eventId, formData);
                if (result.error) setError(result.error);
                formRef.current?.reset();
              })
            }
          >
            <label
              className="group flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-black/20 text-black/40 transition hover:scale-105 hover:border-brand hover:text-brand"
              title={t("addImage")}
            >
              <span className="text-3xl leading-none opacity-40 transition group-hover:opacity-100">
                +
              </span>
              <span className="text-xs">{t("addImage")}</span>
              <input
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
                disabled={isPending}
                onChange={() => formRef.current?.requestSubmit()}
                className="sr-only"
              />
            </label>
          </form>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
