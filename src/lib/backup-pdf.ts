import { jsPDF } from "jspdf";
import type { EventRow } from "@/lib/types";

const MARGIN = 12;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const BRAND: [number, number, number] = [3, 102, 197];
const DAY_NAMES = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const MONTH_NAMES = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function drawMonthGrid(doc: jsPDF, year: number, month: number, events: EventRow[]) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND);
  doc.text(`${MONTH_NAMES[month]} ${year}`, MARGIN, MARGIN + 5);

  const gridTop = MARGIN + 12;
  const cellW = (PAGE_WIDTH - MARGIN * 2) / 7;
  const cellH = (PAGE_HEIGHT - gridTop - MARGIN) / 6;

  doc.setFontSize(9);
  doc.setTextColor(...BRAND);
  DAY_NAMES.forEach((name, i) => {
    doc.text(name, MARGIN + i * cellW + 1.5, gridTop - 2);
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;

  const byDay = new Map<number, string[]>();
  for (const e of events) {
    const day = Number(e.event_date.slice(8, 10));
    (byDay.get(day) ?? byDay.set(day, []).get(day)!).push(e.title);
  }

  let col = firstDow;
  let row = 0;
  doc.setDrawColor(200, 200, 200);

  for (let day = 1; day <= daysInMonth; day++) {
    const x = MARGIN + col * cellW;
    const y = gridTop + row * cellH;
    doc.rect(x, y, cellW, cellH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(String(day), x + 1.5, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(3, 102, 197);
    let ty = y + 8.5;
    const titles = byDay.get(day) ?? [];
    for (const title of titles) {
      if (ty > y + cellH - 2) break;
      const wrapped = doc.splitTextToSize(title, cellW - 3);
      doc.text(wrapped[0], x + 1.5, ty);
      ty += 3;
    }

    col++;
    if (col > 6) {
      col = 0;
      row++;
    }
  }
}

function drawEventList(doc: jsPDF, events: EventRow[]) {
  doc.addPage();
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND);
  doc.text("Alle events", MARGIN, y);
  y += 10;

  doc.setFontSize(9);
  for (const e of [...events].sort((a, b) => a.event_date.localeCompare(b.event_date))) {
    if (y > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(e.event_date, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const line = [e.title, e.address, e.status === "gearchiveerd" ? "(gearchiveerd)" : null]
      .filter(Boolean)
      .join(" — ");
    const wrapped = doc.splitTextToSize(line, PAGE_WIDTH - MARGIN * 2 - 28);
    doc.text(wrapped, MARGIN + 28, y);
    y += Math.max(5, wrapped.length * 4.5);
  }
}

export function buildBackupPdf(events: EventRow[]): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const months = Array.from(new Set(events.map((e) => monthKey(e.event_date)))).sort();

  months.forEach((key, i) => {
    if (i > 0) doc.addPage();
    const [year, month] = key.split("-").map(Number);
    const monthEvents = events.filter((e) => monthKey(e.event_date) === key);
    drawMonthGrid(doc, year, month - 1, monthEvents);
  });

  drawEventList(doc, events);

  return doc;
}
