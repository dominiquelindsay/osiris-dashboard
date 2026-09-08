export interface ConflictZone {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  intensity: "low" | "medium" | "high" | "critical";
  type: string;
  casualties: string;
  status: string;
  since: string;
}

export const CONFLICT_ZONES: ConflictZone[] = [
  { id: "CZ-001", name: "Gaza Strip", country: "Palestine/Israel", lat: 31.5, lng: 34.4, intensity: "critical", type: "Ground + Air Conflict", casualties: "35,000+", status: "ACTIVE", since: "2023-10-07" },
  { id: "CZ-002", name: "Eastern Ukraine", country: "Ukraine/Russia", lat: 48.5, lng: 37.8, intensity: "critical", type: "Ground + Artillery War", casualties: "500,000+", status: "ACTIVE", since: "2022-02-24" },
  { id: "CZ-003", name: "Kachin State", country: "Myanmar", lat: 25.8, lng: 97.4, intensity: "high", type: "Civil War", casualties: "12,000+", status: "ACTIVE", since: "2011-06-09" },
  { id: "CZ-004", name: "Tigray Region", country: "Ethiopia", lat: 14.2, lng: 38.3, intensity: "high", type: "Civil War (truce)", casualties: "600,000+", status: "TENSE TRUCE", since: "2020-11-04" },
  { id: "CZ-005", name: "Kashmir", country: "India/Pakistan", lat: 34.1, lng: 74.7, intensity: "medium", type: "Border Skirmishes", casualties: "45,000+ (cumulative)", status: "TENSE", since: "1947 (sporadic)" },
  { id: "CZ-006", name: "Donbas Region", country: "Ukraine", lat: 48.0, lng: 38.0, intensity: "critical", type: "Artillery + Ground", casualties: "14,000+ (pre-2022)", status: "ACTIVE", since: "2014-04-12" },
  { id: "CZ-007", name: "Yemen Civil War", country: "Yemen", lat: 15.4, lng: 44.2, intensity: "critical", type: "Multi-faction Civil War", casualties: "377,000+", status: "ACTIVE", since: "2014-09-21" },
  { id: "CZ-008", name: "Kivu Region", country: "DRC", lat: -2.0, lng: 28.5, intensity: "high", type: "Insurgency + Militias", casualties: "6,000,000+ (cumulative)", status: "ACTIVE", since: "1996 (ongoing)" },
  { id: "CZ-009", name: "Syria Northwest", country: "Syria", lat: 35.8, lng: 36.5, intensity: "medium", type: "Civil War (winded down)", casualties: "500,000+", status: "LOW INTENSITY", since: "2011-03-15" },
  { id: "CZ-010", name: "Western Sahara", country: "Morocco/Polisario", lat: 24.5, lng: -13.0, intensity: "low", type: "Frozen Conflict", casualties: "14,000+", status: "FROZEN", since: "1975-11-06" },
  { id: "CZ-011", name: "Kashmir LoC", country: "India/Pakistan", lat: 34.5, lng: 73.8, intensity: "medium", type: "Cross-border Firing", casualties: "Ongoing", status: "ACTIVE", since: "1947" },
  { id: "CZ-012", name: "South Sudan", country: "South Sudan", lat: 7.0, lng: 30.0, intensity: "high", type: "Civil War", casualties: "400,000+", status: "ACTIVE", since: "2013-12-15" },
  { id: "CZ-013", name: "Mali / Sahel", country: "Mali/Niger/Burkina", lat: 17.5, lng: -2.0, intensity: "high", type: "Insurgency / Jihadist", casualties: "20,000+", status: "ACTIVE", since: "2012-01-16" },
  { id: "CZ-014", name: "Nagorno-Karabakh", country: "Azerbaijan/Armenia", lat: 39.8, lng: 46.7, intensity: "high", type: "Territorial Conflict", casualties: "7,000+", status: "POST-CONFLICT", since: "2020-09-27" },
  { id: "CZ-015", name: "Boko Haram Zone", country: "Nigeria/Cameroon", lat: 11.8, lng: 13.2, intensity: "high", type: "Terrorist Insurgency", casualties: "350,000+", status: "ACTIVE", since: "2009-07-26" },
];
