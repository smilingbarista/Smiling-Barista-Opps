// Zet de dagelijkse backup-PDF in Google Drive via een Google Apps Script
// web-app (draait onder het Google-account van Smiling Barista).
//
// Vereist de env-variabelen:
//   GDRIVE_WEBHOOK_URL     - de /exec-URL van de gedeployde Apps Script web-app
//   GDRIVE_WEBHOOK_SECRET  - moet overeenkomen met SECRET in het script
//
// Ontbreekt er iets, dan wordt er niets naar Drive gestuurd (de backup blijft
// wel in Supabase Storage staan).

export async function uploadBackupToDrive(
  pdf: Buffer,
  filename: string,
): Promise<"uploaded" | "skipped"> {
  const url = process.env.GDRIVE_WEBHOOK_URL;
  const secret = process.env.GDRIVE_WEBHOOK_SECRET;

  if (!url || !secret) {
    console.warn(
      "uploadBackupToDrive: GDRIVE_WEBHOOK_URL/SECRET niet ingesteld — backup niet naar Drive gestuurd.",
    );
    return "skipped";
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      filename,
      pdfBase64: pdf.toString("base64"),
    }),
  });

  const text = await res.text();
  if (!res.ok || !text.includes('"ok":true')) {
    throw new Error(
      `Drive-upload mislukt: ${res.status} ${text.slice(0, 300)}`,
    );
  }

  return "uploaded";
}
