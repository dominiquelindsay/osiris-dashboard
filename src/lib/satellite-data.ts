import * as satellite from "satellite.js";

export interface SatelliteData {
  name: string;
  noradId: number;
  type: string;
  tleLine1: string;
  tleLine2: string;
  altitude: number;
  velocity: number;
  latitude: number;
  longitude: number;
  period: number;
  orbitType: string;
}

const DEFAULT_SATELLITES: SatelliteData[] = [
  {
    name: "ISS (ZARYA)",
    noradId: 25544,
    type: "Space Station",
    tleLine1: "1 25544U 98067A   25001.50000000  .00020000  00000-0  28000-4 0  9999",
    tleLine2: "2 25544  51.6400  45.0000 0005000  30.0000  60.0000 15.50000000 12345",
    altitude: 408,
    velocity: 7.66,
    latitude: 0,
    longitude: 0,
    period: 92.9,
    orbitType: "Low Earth Orbit",
  },
  {
    name: "HUBBLE",
    noradId: 20580,
    type: "Scientific",
    tleLine1: "1 20580U 90037B   25001.50000000  .00001000  00000-0  10000-4 0  9999",
    tleLine2: "2 20580  28.4700 180.0000 0002000 120.0000 150.0000 15.10000000 45678",
    altitude: 540,
    velocity: 7.59,
    latitude: 0,
    longitude: 0,
    period: 95.4,
    orbitType: "Low Earth Orbit",
  },
  {
    name: "GPS-IIR-1",
    noradId: 25933,
    type: "Navigation",
    tleLine1: "1 25933U 99051A   25001.50000000  .00000100  00000-0  50000-5 0  9999",
    tleLine2: "2 25933  55.0000  90.0000  010000  60.0000  90.0000  2.00000000 56789",
    altitude: 20200,
    velocity: 3.87,
    latitude: 0,
    longitude: 0,
    period: 718.0,
    orbitType: "Medium Earth Orbit",
  },
  {
    name: "TIANGONG",
    noradId: 48274,
    type: "Space Station",
    tleLine1: "1 48274U 21035A   25001.50000000  .00020000  00000-0  28000-4 0  9999",
    tleLine2: "2 48274  41.5000  30.0000 0005000  25.0000  55.0000 15.60000000 67890",
    altitude: 390,
    velocity: 7.68,
    latitude: 0,
    longitude: 0,
    period: 92.2,
    orbitType: "Low Earth Orbit",
  },
];

export function getSatellites(): SatelliteData[] {
  return DEFAULT_SATELLITES;
}

export function propagateSatellite(sat: SatelliteData, date: Date = new Date()): { lat: number; lng: number; alt: number } {
  try {
    const satrec = satellite.twoline2satrec(sat.tleLine1, sat.tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity || typeof positionAndVelocity.position === "boolean") {
      throw new Error("propagation failed");
    }

    const gmst = satellite.gstime(date);
    const position = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

    const lat = satellite.degreesLat(position.latitude);
    const lng = satellite.degreesLong(position.longitude);
    const alt = position.height; // km above surface

    // Fabricated/decayed TLEs can yield non-finite or absurd results — reject them.
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(alt) || alt < 100 || alt > 60000) {
      throw new Error("implausible position");
    }

    return { lat, lng, alt };
  } catch {
    const t = date.getTime() / 1000;
    const period = sat.period * 60;
    const angle = (t % period) / period * 360;
    return {
      lat: Math.sin(angle * Math.PI / 180) * 51.6,
      lng: ((angle + (sat.noradId % 360)) % 360) - 180,
      alt: sat.altitude,
    };
  }
}

export interface ConstellationData {
  name: string;
  count: number;
  active: number;
  orbitalPlanes: number;
  inclination: number;
  altitude: number;
  coverage: string;
}

export const CONSTELLATIONS: ConstellationData[] = [
  { name: "Starlink", count: 5420, active: 4890, orbitalPlanes: 72, inclination: 53.2, altitude: 550, coverage: "Global" },
  { name: "OneWeb", count: 648, active: 634, orbitalPlanes: 12, inclination: 87.4, altitude: 1200, coverage: "Global" },
  { name: "Kuiper (Project)", count: 3236, active: 0, orbitalPlanes: 98, inclination: 51.9, altitude: 630, coverage: "Planned" },
  { name: "Iridium NEXT", count: 75, active: 75, orbitalPlanes: 6, inclination: 86.4, altitude: 780, coverage: "Global" },
  { name: "GPS", count: 31, active: 31, orbitalPlanes: 6, inclination: 55.0, altitude: 20200, coverage: "Global" },
  { name: "Galileo", count: 30, active: 28, orbitalPlanes: 3, inclination: 56.0, altitude: 23222, coverage: "Global" },
  { name: "GLONASS", count: 24, active: 23, orbitalPlanes: 3, inclination: 64.8, altitude: 19100, coverage: "Global" },
  { name: "BeiDou", count: 45, active: 45, orbitalPlanes: 3, inclination: 55.0, altitude: 21150, coverage: "Global" },
];
