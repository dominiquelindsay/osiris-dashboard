// Critical infrastructure & trade data — curated from public sources (IAEA PRIS, WNA, port authority charts).

export interface NuclearFacility {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: "Power Plant" | "Enrichment" | "Reprocessing" | "Research" | "Weapons Complex" | "Waste / Storage";
  status: "OPERATIONAL" | "UNDER CONSTRUCTION" | "DECOMMISSIONING" | "DESTROYED / EXCLUSION";
  reactors?: string;
}

export const NUCLEAR_FACILITIES: NuclearFacility[] = [
  { id: "NF-001", name: "Zaporizhzhia NPP", country: "Ukraine", lat: 47.51, lng: 34.58, type: "Power Plant", status: "OPERATIONAL", reactors: "6× VVER-1000 (largest in Europe)" },
  { id: "NF-002", name: "Chernobyl Exclusion Zone", country: "Ukraine", lat: 51.39, lng: 30.10, type: "Waste / Storage", status: "DESTROYED / EXCLUSION", reactors: "Sarcophagus + ISF-2" },
  { id: "NF-003", name: "Fukushima Daiichi", country: "Japan", lat: 37.42, lng: 141.03, type: "Power Plant", status: "DECOMMISSIONING", reactors: "6× BWR (4 destroyed)" },
  { id: "NF-004", name: "Kashiwazaki-Kariwa", country: "Japan", lat: 37.43, lng: 138.60, type: "Power Plant", status: "OPERATIONAL", reactors: "7× BWR (largest by capacity)" },
  { id: "NF-005", name: "Sellafield", country: "United Kingdom", lat: 54.42, lng: -3.50, type: "Reprocessing", status: "DECOMMISSIONING" },
  { id: "NF-006", name: "La Hague", country: "France", lat: 49.68, lng: -1.88, type: "Reprocessing", status: "OPERATIONAL" },
  { id: "NF-007", name: "Gravelines NPP", country: "France", lat: 51.01, lng: 2.12, type: "Power Plant", status: "OPERATIONAL", reactors: "6× PWR" },
  { id: "NF-008", name: "Cattenom NPP", country: "France", lat: 49.42, lng: 6.22, type: "Power Plant", status: "OPERATIONAL", reactors: "4× PWR" },
  { id: "NF-009", name: "Natanz Enrichment", country: "Iran", lat: 33.72, lng: 51.73, type: "Enrichment", status: "OPERATIONAL" },
  { id: "NF-010", name: "Fordow Fuel Plant", country: "Iran", lat: 34.88, lng: 50.99, type: "Enrichment", status: "OPERATIONAL" },
  { id: "NF-011", name: "Bushehr NPP", country: "Iran", lat: 28.83, lng: 50.89, type: "Power Plant", status: "OPERATIONAL", reactors: "1× VVER-1000" },
  { id: "NF-012", name: "Yongbyon Complex", country: "North Korea", lat: 39.80, lng: 125.75, type: "Weapons Complex", status: "OPERATIONAL" },
  { id: "NF-013", name: "Dimona (Negev Center)", country: "Israel", lat: 31.00, lng: 35.14, type: "Research", status: "OPERATIONAL" },
  { id: "NF-014", name: "Los Alamos National Lab", country: "United States", lat: 35.88, lng: -106.30, type: "Weapons Complex", status: "OPERATIONAL" },
  { id: "NF-015", name: "Pantex Plant", country: "United States", lat: 35.32, lng: -101.56, type: "Weapons Complex", status: "OPERATIONAL" },
  { id: "NF-016", name: "Hanford Site", country: "United States", lat: 46.55, lng: -119.49, type: "Waste / Storage", status: "DECOMMISSIONING" },
  { id: "NF-017", name: "Savannah River Site", country: "United States", lat: 33.25, lng: -81.66, type: "Weapons Complex", status: "OPERATIONAL" },
  { id: "NF-018", name: "Oak Ridge / Y-12", country: "United States", lat: 35.93, lng: -84.31, type: "Enrichment", status: "OPERATIONAL" },
  { id: "NF-019", name: "Palo Verde", country: "United States", lat: 33.39, lng: -112.86, type: "Power Plant", status: "OPERATIONAL", reactors: "3× PWR (largest US)" },
  { id: "NF-020", name: "Diablo Canyon", country: "United States", lat: 35.21, lng: -120.85, type: "Power Plant", status: "OPERATIONAL", reactors: "2× PWR" },
  { id: "NF-021", name: "Three Mile Island", country: "United States", lat: 40.15, lng: -76.72, type: "Power Plant", status: "DECOMMISSIONING" },
  { id: "NF-022", name: "Bruce Power", country: "Canada", lat: 44.33, lng: -81.60, type: "Power Plant", status: "OPERATIONAL", reactors: "8× CANDU" },
  { id: "NF-023", name: "Darlington NGS", country: "Canada", lat: 43.87, lng: -78.72, type: "Power Plant", status: "OPERATIONAL", reactors: "4× CANDU" },
  { id: "NF-024", name: "Kudankulam NPP", country: "India", lat: 8.17, lng: 77.71, type: "Power Plant", status: "OPERATIONAL", reactors: "2× VVER-1000" },
  { id: "NF-025", name: "Kalpakkam (IGCAR/PFBR)", country: "India", lat: 12.56, lng: 80.18, type: "Research", status: "OPERATIONAL" },
  { id: "NF-026", name: "Koeberg NPP", country: "South Africa", lat: -33.68, lng: 18.43, type: "Power Plant", status: "OPERATIONAL", reactors: "2× PWR" },
  { id: "NF-027", name: "Angra NPP", country: "Brazil", lat: -23.01, lng: -44.46, type: "Power Plant", status: "OPERATIONAL", reactors: "2× PWR" },
  { id: "NF-028", name: "Atucha / Embalse", country: "Argentina", lat: -33.97, lng: -59.21, type: "Power Plant", status: "OPERATIONAL" },
  { id: "NF-029", name: "Olkiluoto", country: "Finland", lat: 61.24, lng: 21.44, type: "Power Plant", status: "OPERATIONAL", reactors: "3× (incl. EPR) + Onkalo repository" },
  { id: "NF-030", name: "Forsmark NPP", country: "Sweden", lat: 60.40, lng: 18.17, type: "Power Plant", status: "OPERATIONAL", reactors: "3× BWR" },
  { id: "NF-031", name: "Temelín NPP", country: "Czech Republic", lat: 49.18, lng: 14.38, type: "Power Plant", status: "OPERATIONAL", reactors: "2× VVER-1000" },
  { id: "NF-032", name: "Paks NPP", country: "Hungary", lat: 46.57, lng: 18.86, type: "Power Plant", status: "OPERATIONAL", reactors: "4× VVER-440" },
  { id: "NF-033", name: "Kozloduy NPP", country: "Bulgaria", lat: 43.75, lng: 23.77, type: "Power Plant", status: "OPERATIONAL", reactors: "2× VVER-1000" },
  { id: "NF-034", name: "Cernavodă NPP", country: "Romania", lat: 44.32, lng: 28.06, type: "Power Plant", status: "OPERATIONAL", reactors: "2× CANDU" },
  { id: "NF-035", name: "Doel / Tihange", country: "Belgium", lat: 51.32, lng: 4.26, type: "Power Plant", status: "OPERATIONAL" },
  { id: "NF-036", name: "Qinshan NPP", country: "China", lat: 30.44, lng: 120.94, type: "Power Plant", status: "OPERATIONAL", reactors: "9 units" },
  { id: "NF-037", name: "Tianwan NPP", country: "China", lat: 34.69, lng: 119.46, type: "Power Plant", status: "OPERATIONAL", reactors: "8× VVER" },
  { id: "NF-038", name: "Daya Bay", country: "China", lat: 22.60, lng: 114.54, type: "Power Plant", status: "OPERATIONAL", reactors: "6 units" },
  { id: "NF-039", name: "Khmelnytskyi NPP", country: "Ukraine", lat: 50.30, lng: 26.65, type: "Power Plant", status: "OPERATIONAL", reactors: "2× VVER-1000" },
  { id: "NF-040", name: "Barakah NPP", country: "UAE", lat: 23.96, lng: 52.26, type: "Power Plant", status: "OPERATIONAL", reactors: "4× APR-1400" },
  { id: "NF-041", name: "Akkuyu NPP", country: "Turkey", lat: 36.14, lng: 33.54, type: "Power Plant", status: "UNDER CONSTRUCTION", reactors: "4× VVER-1200" },
  { id: "NF-042", name: "Rooppur NPP", country: "Bangladesh", lat: 24.07, lng: 89.05, type: "Power Plant", status: "UNDER CONSTRUCTION", reactors: "2× VVER-1200" },
  { id: "NF-043", name: "Mayak (Ozërsk)", country: "Russia", lat: 55.71, lng: 60.90, type: "Reprocessing", status: "OPERATIONAL" },
  { id: "NF-044", name: "Kursk NPP", country: "Russia", lat: 51.68, lng: 35.60, type: "Power Plant", status: "OPERATIONAL", reactors: "RBMK + VVER" },
  { id: "NF-045", name: "Leningrad NPP", country: "Russia", lat: 59.83, lng: 29.05, type: "Power Plant", status: "OPERATIONAL", reactors: "RBMK/VVER mix" },
  { id: "NF-046", name: "Hinkley Point C", country: "United Kingdom", lat: 51.21, lng: -3.13, type: "Power Plant", status: "UNDER CONSTRUCTION", reactors: "2× EPR" },
  { id: "NF-047", name: "Ohi / Takahama", country: "Japan", lat: 35.54, lng: 135.50, type: "Power Plant", status: "OPERATIONAL" },
  { id: "NF-048", name: "Lop Nur Test Site", country: "China", lat: 41.70, lng: 88.35, type: "Weapons Complex", status: "OPERATIONAL" },
  { id: "NF-049", name: "Almaraz NPP", country: "Spain", lat: 39.81, lng: -5.70, type: "Power Plant", status: "OPERATIONAL", reactors: "2× PWR" },
  { id: "NF-050", name: "Ignalina (decomm.)", country: "Lithuania", lat: 55.60, lng: 26.56, type: "Power Plant", status: "DECOMMISSIONING", reactors: "2× RBMK-1500" },
];

export interface ShippingLane {
  id: string;
  name: string;
  points: [number, number][]; // [lat, lng]
  volume: string;
}

export const SHIPPING_LANES: ShippingLane[] = [
  { id: "SL-001", name: "Transatlantic Northern", volume: "~4M TEU/yr", points: [[40.6, -73.8], [42, -60], [45, -45], [48, -30], [50, -15], [51.5, 1.5], [53.5, 4.5]] },
  { id: "SL-002", name: "Suez Corridor", volume: "~19,000 ships/yr", points: [[31.3, 32.3], [30.0, 32.6], [29.9, 32.6], [27.0, 34.5], [22.0, 38.0], [12.6, 45.0], [11.5, 51.5]] },
  { id: "SL-003", name: "Mediterranean East-West", volume: "very high", points: [[36.0, -5.6], [35.5, 0], [36.5, 5], [37.5, 10], [38.0, 15.5], [36.5, 22], [34.5, 28], [31.3, 32.3]] },
  { id: "SL-004", name: "Malacca Strait", volume: "~94,000 ships/yr", points: [[5.5, 95.3], [4.0, 98.5], [2.5, 100.5], [1.3, 103.5], [1.1, 104.5]] },
  { id: "SL-005", name: "Asia-Europe (Indian Ocean)", volume: "backbone", points: [[11.5, 51.5], [8, 60], [6, 72], [6.5, 78], [5.5, 81], [5.5, 95.3]] },
  { id: "SL-006", name: "Panama Canal Approach", volume: "~13,000 ships/yr", points: [[9.4, -79.9], [9.0, -79.5], [8.95, -79.55], [9.35, -79.9]] },
  { id: "SL-007", name: "Transpacific (Asia–US West)", volume: "~25M TEU/yr", points: [[31.2, 121.5], [35, 140], [40, 160], [42, -170], [40, -150], [37.8, -122.4]] },
  { id: "SL-008", name: "South China Sea", volume: "very high", points: [[1.3, 104.5], [5, 109], [10, 112], [15, 114], [20, 116], [22.3, 114.2]] },
  { id: "SL-009", name: "East Asia–Middle East", volume: "oil backbone", points: [[26.5, 56.3], [24, 59], [18, 62], [13, 55], [11.5, 51.5]] },
  { id: "SL-010", name: "Hormuz Strait", volume: "~21% global oil", points: [[26.6, 56.25], [26.4, 56.6], [26.2, 56.9]] },
  { id: "SL-011", name: "English Channel / Dover", volume: "busiest strait", points: [[50.5, -1.5], [50.9, 0.5], [51.0, 1.4], [51.5, 2.5]] },
  { id: "SL-012", name: "Bosphorus", volume: "~40,000 ships/yr", points: [[41.2, 29.1], [41.0, 29.0], [40.9, 28.9], [40.5, 27.5]] },
  { id: "SL-013", name: "Cape of Good Hope", volume: "Suez alternative", points: [[12.6, 45.0], [5, 48], [-5, 42], [-15, 38], [-30, 33], [-35, 25], [-34.4, 18.5]] },
  { id: "SL-014", name: "Danish Straits (Baltic)", volume: "high", points: [[57.7, 10.6], [56.5, 11.5], [55.4, 12.9], [54.5, 13.5]] },
  { id: "SL-015", name: "US Gulf–Atlantic", volume: "energy corridor", points: [[29.3, -94.8], [27, -90], [25, -84], [27, -79], [31, -76]] },
  { id: "SL-016", name: "Australia–China Iron Ore", volume: "bulk backbone", points: [[-20.3, 118.6], [-15, 115], [-8, 112], [0, 108], [8, 109], [15, 114]] },
];
