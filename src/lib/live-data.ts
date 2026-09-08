// Live natural-event feeds: NASA EONET (wildfires, storms) + USGS earthquake feed.
// Both are CORS-enabled and key-free.

export interface WildfireEvent {
  id: string;
  title: string;
  lat: number;
  lng: number;
  date: Date;
  sourceUrl: string | null;
}

export interface QuakeEvent {
  id: string;
  title: string;
  magnitude: number;
  lat: number;
  lng: number;
  depthKm: number;
  time: Date;
  usgsUrl: string;
}

interface EonetResponse {
  events?: {
    id: string;
    title: string;
    geometry?: { date: string; coordinates: [number, number] }[];
    sources?: { url: string }[];
  }[];
}

export async function fetchWildfires(limit = 100): Promise<WildfireEvent[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(
      `https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=${limit}`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
    const data: EonetResponse = await res.json();
    const out: WildfireEvent[] = [];
    for (const ev of data.events || []) {
      const geo = ev.geometry?.[ev.geometry.length - 1];
      if (!geo) continue;
      const [lng, lat] = geo.coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      out.push({
        id: ev.id,
        title: ev.title,
        lat,
        lng,
        date: new Date(geo.date),
        sourceUrl: ev.sources?.[0]?.url ?? null,
      });
    }
    return out;
  } finally {
    clearTimeout(timeout);
  }
}

interface UsgsResponse {
  features?: {
    id: string;
    properties: {
      title: string;
      mag: number | null;
      time: number;
      url: string;
    };
    geometry: { coordinates: [number, number, number] };
  }[];
}

export async function fetchEarthquakes(): Promise<QuakeEvent[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
    const data: UsgsResponse = await res.json();
    return (data.features || [])
      .filter((f) => f.properties.mag !== null)
      .map((f) => ({
        id: f.id,
        title: f.properties.title,
        magnitude: f.properties.mag as number,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        depthKm: f.geometry.coordinates[2],
        time: new Date(f.properties.time),
        usgsUrl: f.properties.url,
      }));
  } finally {
    clearTimeout(timeout);
  }
}
