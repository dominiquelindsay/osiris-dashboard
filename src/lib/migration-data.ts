export interface MigrationRoute {
  id: string;
  name: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  volume: string; // annual
  type: string;
  color: string;
}

export const MIGRATION_ROUTES: MigrationRoute[] = [
  { id: "MR-001", name: "Venezuela → Colombia", origin: { lat: 10.5, lng: -66.9, name: "Caracas, VE" }, destination: { lat: 4.7, lng: -74.0, name: "Bogotá, CO" }, volume: "2.5M", type: "Refugee Crisis", color: "#ff3333" },
  { id: "MR-002", name: "Syria → Turkey", origin: { lat: 33.5, lng: 36.3, name: "Damascus, SY" }, destination: { lat: 39.9, lng: 32.8, name: "Ankara, TR" }, volume: "3.7M", type: "War Refugee", color: "#ff3333" },
  { id: "MR-003", name: "Ukraine → Poland", origin: { lat: 50.4, lng: 30.5, name: "Kyiv, UA" }, destination: { lat: 52.2, lng: 21.0, name: "Warsaw, PL" }, volume: "1.5M", type: "War Refugee", color: "#ff3333" },
  { id: "MR-004", name: "Afghanistan → Pakistan", origin: { lat: 34.5, lng: 69.1, name: "Kabul, AF" }, destination: { lat: 33.7, lng: 73.0, name: "Islamabad, PK" }, volume: "1.4M", type: "Refugee", color: "#ffaa00" },
  { id: "MR-005", name: "Central America → US", origin: { lat: 14.6, lng: -90.5, name: "Guatemala City, GT" }, destination: { lat: 32.7, lng: -117.1, name: "San Diego, US" }, volume: "500K/yr", type: "Economic Migrant", color: "#ffaa00" },
  { id: "MR-006", name: "Nigeria → EU", origin: { lat: 9.0, lng: 7.4, name: "Abuja, NG" }, destination: { lat: 41.9, lng: 12.5, name: "Rome, IT" }, volume: "100K/yr", type: "Mixed", color: "#ffcc00" },
  { id: "MR-007", name: "Myanmar → Bangladesh", origin: { lat: 21.9, lng: 96.1, name: "Naypyidaw, MM" }, destination: { lat: 23.8, lng: 90.4, name: "Dhaka, BD" }, volume: "1.1M", type: "Rohingya Crisis", color: "#ff3333" },
  { id: "MR-008", name: "Mali → Algeria", origin: { lat: 12.6, lng: -8.0, name: "Bamako, ML" }, destination: { lat: 36.7, lng: 3.0, name: "Algiers, DZ" }, volume: "50K/yr", type: "Sahel Exodus", color: "#ffaa00" },
  { id: "MR-009", name: "South Sudan → Uganda", origin: { lat: 4.8, lng: 31.6, name: "Juba, SS" }, destination: { lat: 0.3, lng: 32.5, name: "Kampala, UG" }, volume: "900K", type: "Refugee", color: "#ff3333" },
  { id: "MR-010", name: "Yemen → Horn of Africa", origin: { lat: 15.4, lng: 44.2, name: "Sanaa, YE" }, destination: { lat: 9.5, lng: 44.0, name: "Hargeisa, SO" }, volume: "200K", type: "War Refugee", color: "#ff3333" },
  { id: "MR-011", name: "India → Gulf States", origin: { lat: 28.6, lng: 77.2, name: "Delhi, IN" }, destination: { lat: 25.2, lng: 55.3, name: "Dubai, AE" }, volume: "8M/yr", type: "Labor Migration", color: "#33ff00" },
  { id: "MR-012", name: "Philippines → Global", origin: { lat: 14.5, lng: 121.0, name: "Manila, PH" }, destination: { lat: 1.3, lng: 103.8, name: "Singapore, SG" }, volume: "1.8M/yr", type: "OFW (Labor)", color: "#33ff00" },
];
