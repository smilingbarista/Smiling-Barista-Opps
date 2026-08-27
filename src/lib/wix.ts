// Wix Bookings-koppeling: haalt de geplande workshops van de Smiling
// Barista-website (Wix) op zodat ze mee in de app-kalender en op het
// dashboard verschijnen. Alleen-lezen — boeken blijft via Wix.
//
// Vereist de env-variabele WIX_API_KEY (account-level API key met
// leesrechten voor Wix Bookings). Zonder key levert dit een lege lijst op
// en verdwijnt de workshop-sectie gewoon uit de UI.

const WIX_API = "https://www.wixapis.com";
const SITE_ID =
  process.env.WIX_SITE_ID ?? "f94fbe0f-3877-4be8-9c14-d13a44537e9b";
const BOOKING_BASE_URL =
  process.env.WIX_BOOKING_BASE_URL ?? "https://www.smilingbarista.com";

// Cache-tag waarmee de "Workshops nu inlezen"-knop de Wix-data ververst.
export const WIX_WORKSHOPS_TAG = "wix-workshops";

// Wix-data één week cachen. Workshops wijzigen zelden; dit houdt het aantal
// API-calls (en dus kosten) minimaal. De knop op de kalender ververst
// tussendoor handmatig via revalidateTag(WIX_WORKSHOPS_TAG).
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

export type WorkshopSession = {
  id: string;
  title: string;
  /** Lokale datum in Europe/Brussels, YYYY-MM-DD. */
  date: string;
  /** Lokale starttijd, HH:MM. */
  startTime: string;
  /** Lokale eindtijd, HH:MM (leeg indien onbekend). */
  endTime: string;
  /** UTC-start (ISO), voor de kalender. */
  startUtc: string;
  /** UTC-eind (ISO), voor de kalender. */
  endUtc: string | null;
  locationName: string | null;
  locationAddress: string | null;
  instructors: string[];
  totalCapacity: number | null;
  openSpots: number | null;
  /** Link naar de Wix-boekingspagina van deze workshop. */
  bookingUrl: string;
};

type WixEvent = {
  id: string;
  externalScheduleId?: string;
  scheduleName?: string;
  title?: string;
  type?: string;
  status?: string;
  start?: { localDate?: string; utcDate?: string; timeZone?: string };
  end?: { localDate?: string; utcDate?: string };
  location?: { name?: string; address?: string };
  resources?: { name?: string }[];
  totalCapacity?: number;
  remainingCapacity?: number;
};

async function wixFetch(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown },
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.WIX_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${WIX_API}${path}`, {
      method: init.method ?? "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        "wix-site-id": SITE_ID,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      next: { revalidate: REVALIDATE_SECONDS, tags: [WIX_WORKSHOPS_TAG] },
    });

    if (!res.ok) {
      console.error(
        `Wix ${path} → ${res.status}`,
        await res.text().catch(() => ""),
      );
      return null;
    }

    return (await res.json()) as Record<string, unknown>;
  } catch (error) {
    console.error(`Wix ${path} fetch failed`, error);
    return null;
  }
}

// serviceId → volledige URL van de Wix-boekingspagina. De services/query-lijst
// levert de URL niet betrouwbaar mee, dus we halen elke service apart op.
async function getBookingUrls(
  serviceIds: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();

  await Promise.all(
    serviceIds.map(async (id) => {
      const data = await wixFetch(`/bookings/v2/services/${id}`, {
        method: "GET",
      });
      const service = data?.service as
        | { urls?: { bookingPage?: { url?: string } } }
        | undefined;
      const url = service?.urls?.bookingPage?.url;
      if (url) urls.set(id, url);
    }),
  );

  return urls;
}

function toTime(localDate: string | undefined): string {
  return localDate ? localDate.slice(11, 16) : "";
}

/**
 * Alle workshopsessies vanaf nu, chronologisch. Lege lijst als de
 * Wix-koppeling niet geconfigureerd is of onbereikbaar is.
 */
export async function getWorkshopSessions(): Promise<WorkshopSession[]> {
  if (!process.env.WIX_API_KEY) return [];

  const now = new Date();
  // Ondergrens van de query op de 1e van de maand (stabiel binnen een maand),
  // zodat de fetch-cache niet elke dag/uur een nieuwe sleutel krijgt. Sessies
  // die eerder deze maand al voorbij zijn, filteren we hieronder in code weg.
  const monthAnchor = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}-01T00:00:00.000Z`;
  const todayIso = now.toISOString();

  // 1. Alle toekomstige sessies ophalen (met paginatie).
  const events: WixEvent[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 10; page++) {
    const paging = cursor ? { cursor } : { limit: 100 };
    const data = await wixFetch("/calendar/v3/events/query", {
      body: {
        query: {
          filter: { start: { $gte: monthAnchor } },
          sort: [{ fieldName: "start", order: "ASC" }],
          paging,
        },
      },
    });

    events.push(...((data?.events as WixEvent[]) ?? []));

    const meta = data?.pagingMetadata as
      | { hasNext?: boolean; cursors?: { next?: string } }
      | undefined;
    if (!meta?.hasNext || !meta.cursors?.next) break;
    cursor = meta.cursors.next;
  }

  // 2. Enkel groepsworkshops (klassen/cursussen) die nog moeten plaatsvinden,
  //    geen 1-op-1 afspraken.
  const workshopEvents = events.filter(
    (e) =>
      e.status !== "CANCELLED" &&
      e.start?.localDate &&
      (e.end?.utcDate ?? e.start.utcDate ?? "") >= todayIso &&
      (!e.type || e.type === "CLASS" || e.type === "COURSE"),
  );

  // 3. Boekings-URL per service ophalen.
  const serviceIds = [
    ...new Set(
      workshopEvents
        .map((e) => e.externalScheduleId)
        .filter((id): id is string => !!id),
    ),
  ];
  const bookingUrls = await getBookingUrls(serviceIds);

  return workshopEvents.map((event) => {
    const localStart = event.start!.localDate!;
    return {
      id: event.id,
      title: event.scheduleName || event.title || "Workshop",
      date: localStart.slice(0, 10),
      startTime: toTime(localStart),
      endTime: toTime(event.end?.localDate),
      startUtc: event.start?.utcDate ?? localStart,
      endUtc: event.end?.utcDate ?? null,
      locationName: event.location?.name ?? null,
      locationAddress: event.location?.address ?? null,
      instructors: (event.resources ?? [])
        .map((r) => r.name)
        .filter((n): n is string => !!n),
      totalCapacity: event.totalCapacity ?? null,
      openSpots: event.remainingCapacity ?? null,
      bookingUrl:
        (event.externalScheduleId
          ? bookingUrls.get(event.externalScheduleId)
          : undefined) ?? `${BOOKING_BASE_URL}/book-online`,
    };
  });
}
