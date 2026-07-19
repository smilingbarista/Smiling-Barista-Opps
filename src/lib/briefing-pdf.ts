import { jsPDF } from "jspdf";
import type { BriefingSection } from "@/lib/briefing-content";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function buildBriefingPdf(
  title: string,
  briefingLabel: string,
  sections: BriefingSection[],
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const brand: [number, number, number] = [3, 102, 197];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...brand);
  doc.text(`${briefingLabel}: ${title}`, MARGIN, y);
  y += 10;

  for (const section of sections) {
    if (y > 270) {
      doc.addPage();
      y = MARGIN;
    }

    if (section.heading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...brand);
      doc.text(section.heading, MARGIN, y);
      y += 7;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);

    for (const row of section.rows) {
      const text =
        section.heading === row.label && section.rows.length === 1
          ? row.value
          : `${row.label}: ${row.value}`;
      const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH);
      for (const line of wrapped) {
        if (y > 280) {
          doc.addPage();
          y = MARGIN;
        }
        doc.text(line, MARGIN, y);
        y += 5.5;
      }
    }
    y += 4;
  }

  return doc;
}
