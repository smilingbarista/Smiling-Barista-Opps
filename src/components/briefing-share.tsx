"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  buildBriefingSections,
  buildBriefingText,
} from "@/lib/briefing-content";
import type { EventRow } from "@/lib/types";

type Format = "pdf" | "tekst";
type Channel = "whatsapp" | "email";

export function BriefingShare({ event }: { event: EventRow }) {
  const t = useTranslations("event");
  const [format, setFormat] = useState<Format>("pdf");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      const sections = buildBriefingSections(event, t);
      const text = buildBriefingText(event.title, t("briefingTitle"), sections);

      if (format === "tekst") {
        sendText(channel, event.title, text);
        return;
      }

      const { buildBriefingPdf } = await import("@/lib/briefing-pdf");
      const doc = buildBriefingPdf(event.title, t("briefingTitle"), sections);
      const blob = doc.output("blob");
      const fileName = `briefing-${event.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `${t("briefingTitle")}: ${event.title}`,
          text,
        });
        return;
      }

      doc.save(fileName);
      sendText(channel, event.title, `${text}\n\n(${t("pdfDownloadedNote")})`);
    } finally {
      setSending(false);
    }
  }

  function sendText(ch: Channel, title: string, text: string) {
    if (ch === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      const subject = encodeURIComponent(`${t("briefingTitle")}: ${title}`);
      window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(text)}`;
    }
  }

  return (
    <div className="no-print flex flex-wrap items-end gap-3 rounded border border-black/10 p-3">
      <label className="flex flex-col gap-1 text-sm">
        {t("format")}
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as Format)}
          className="rounded border border-black/20 px-2 py-1"
        >
          <option value="pdf">{t("formatPdf")}</option>
          <option value="tekst">{t("formatText")}</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("channel")}
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as Channel)}
          className="rounded border border-black/20 px-2 py-1"
        >
          <option value="whatsapp">{t("channelWhatsapp")}</option>
          <option value="email">{t("channelEmail")}</option>
        </select>
      </label>
      <button
        onClick={handleSend}
        disabled={sending}
        className="rounded bg-brand px-4 py-2 text-sm text-brand-foreground disabled:opacity-50"
      >
        {t("send")}
      </button>
    </div>
  );
}
