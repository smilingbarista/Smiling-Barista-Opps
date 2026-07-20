"use client";

import { useRef, useTransition } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);

  if (readOnly && images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && <h2 className="font-medium">{t("images")}</h2>}
      {images.length === 0 && readOnly === false && (
        <p className="text-sm text-black/50">{t("noImages")}</p>
      )}
      {images.length > 0 && (
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
        </div>
      )}
      {!readOnly && (
        <form
          ref={formRef}
          action={(formData) =>
            startTransition(async () => {
              await uploadEventImage(eventId, formData);
              formRef.current?.reset();
            })
          }
        >
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={isPending}
            onChange={() => formRef.current?.requestSubmit()}
            className="text-sm"
          />
        </form>
      )}
    </div>
  );
}
