export type GmailSalesThread = {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  contact: {
    name: string;
    company: string;
    email: string;
    phone: string;
  } | null;
};

const SALES_QUERY =
  '{offerte event koffie velopresso workshop teambuilding "coffee & smiles" "latte art"}';

type GmailPayload = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
  headers?: { name?: string; value?: string }[];
};

type GmailMessage = {
  internalDate?: string;
  snippet?: string;
  payload?: GmailPayload;
};

type GmailThreadResponse = { id?: string; messages?: GmailMessage[] };

async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) throw new Error("Gmail token refresh failed");
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Gmail returned no access token");
  return data.access_token;
}

function getHeader(message: GmailMessage | undefined, name: string) {
  return (
    message?.payload?.headers?.find(
      (header) => header.name?.toLowerCase() === name.toLowerCase(),
    )?.value ?? ""
  );
}

function getEmailAddress(value: string) {
  return value.match(/<([^<>]+)>/)?.[1]?.trim() ?? value.trim();
}

function getContactName(from: string, email: string) {
  const displayName = from.match(/^\s*"?([^"<>]+?)"?\s*</)?.[1]?.trim();
  if (displayName) return displayName;
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getMessageText(payload: GmailPayload | undefined): string {
  if (!payload) return "";
  const ownBody = payload.body?.data
    ? Buffer.from(payload.body.data, "base64url").toString("utf8")
    : "";
  const nested = (payload.parts ?? []).map(getMessageText).filter(Boolean);
  if (payload.mimeType === "text/plain" && ownBody) return ownBody;
  if (ownBody && payload.mimeType === "text/html") {
    return ownBody
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<\/(?:p|div|li|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">");
  }
  return nested.join("\n") || ownBody;
}

function getSignatureDetails(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const signatureStart = lines.findLastIndex((line) => /^--\s*$/.test(line));
  const signature = lines.slice(signatureStart >= 0 ? signatureStart + 1 : -15);
  const phone = signature
    .map((line) => line.match(/(?:\+32|0032|0)(?:[\s()./-]*\d){7,9}/)?.[0])
    .find(Boolean) ?? "";
  const company = signature.find(
    (line) =>
      line.length <= 120 &&
      !line.includes("@") &&
      /\b(?:BVBA?|NV|VOF|SRL|SA|LTD|LLC|GMBH|INC)\b/i.test(line),
  ) ?? "";
  return { company, phone };
}

async function getThread(id: string, accessToken: string, mailbox: string) {
  const params = new URLSearchParams({ format: "full" });

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(id)}?${params}`,
    { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) throw new Error("Gmail thread request failed");

  const thread = (await response.json()) as GmailThreadResponse;
  const messages = [...(thread.messages ?? [])].sort(
    (a, b) => Number(b.internalDate ?? 0) - Number(a.internalDate ?? 0),
  );
  const latest = messages[0];
  const contactMessage = messages.find((message) => {
    const address = getEmailAddress(getHeader(message, "From"));
    return address.includes("@") && address.toLowerCase() !== mailbox.toLowerCase();
  });
  const contactFrom = getHeader(contactMessage, "From");
  const contactEmail = getEmailAddress(contactFrom);
  const details = getSignatureDetails(getMessageText(contactMessage?.payload));

  return {
    id: thread.id ?? id,
    subject: getHeader(latest, "Subject"),
    from: getHeader(latest, "From"),
    date: latest?.internalDate ?? "",
    snippet: latest?.snippet ?? "",
    contact: contactMessage
      ? {
          name: getContactName(contactFrom, contactEmail),
          company: details.company,
          email: contactEmail,
          phone: details.phone,
        }
      : null,
  } satisfies GmailSalesThread;
}

export async function getGmailSalesThreads(): Promise<{
  configured: boolean;
  threads: GmailSalesThread[];
}> {
  const configured = Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN,
  );
  if (!configured) return { configured: false, threads: [] };

  const accessToken = await getAccessToken();
  const profileResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!profileResponse.ok) throw new Error("Gmail profile request failed");
  const profile = (await profileResponse.json()) as { emailAddress?: string };
  const mailbox = profile.emailAddress ?? "";
  const params = new URLSearchParams({ q: SALES_QUERY, maxResults: "25" });
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?${params}`,
    { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) throw new Error("Gmail search failed");

  const data = (await response.json()) as {
    threads?: { id?: string }[];
  };
  const ids = (data.threads ?? []).flatMap((thread) =>
    thread.id ? [thread.id] : [],
  );
  const threads: GmailSalesThread[] = [];

  for (let index = 0; index < ids.length; index += 5) {
    const batch = await Promise.all(
      ids
        .slice(index, index + 5)
        .map((id) => getThread(id, accessToken, mailbox)),
    );
    threads.push(...batch);
  }

  return { configured: true, threads };
}