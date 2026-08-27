// Verstuurt de dagelijkse backup-PDF per e-mail via SMTP (Google Workspace).
//
// Vereist de env-variabelen SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS en
// BACKUP_EMAIL_TO. Ontbreekt er iets, dan wordt er geen mail verstuurd (de
// backup blijft gewoon in Supabase Storage staan).

import nodemailer from "nodemailer";

export async function sendBackupEmail(
  pdf: Buffer,
  filename: string,
): Promise<"sent" | "skipped"> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.BACKUP_EMAIL_TO;

  if (!host || !user || !pass || !to) {
    console.warn(
      "sendBackupEmail: SMTP-config onvolledig — geen mail verstuurd.",
    );
    return "skipped";
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const today = new Date().toISOString().slice(0, 10);

  await transporter.sendMail({
    from: process.env.BACKUP_EMAIL_FROM ?? user,
    to,
    subject: `Veloprep back-up ${today}`,
    text: `In bijlage de automatische Veloprep-back-up van ${today} (alle events, kalender en lijst).`,
    attachments: [
      {
        filename,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  return "sent";
}
