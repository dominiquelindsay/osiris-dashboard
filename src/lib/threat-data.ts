export interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: "cve" | "breach" | "attack" | "malware" | "phishing" | "ddos";
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  target: string;
  description: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}

const THREAT_TYPES: ThreatEvent["type"][] = ["cve", "breach", "attack", "malware", "phishing", "ddos"];
const SEVERITIES: ThreatEvent["severity"][] = ["critical", "high", "medium", "low"];

const SOURCES = [
  "APT29 (Cozy Bear)", "APT28 (Fancy Bear)", "Lazarus Group", "MuddyWater",
  "Unknown Actor", "Script Kiddie", "Insider Threat", "Ransomware Gang",
  "State Sponsor", "Cyber Mercenary", "Botnet Herder", "Dark Web Forum",
];

const TARGETS = [
  "Financial Sector", "Healthcare System", "Government Network", "Cloud Provider",
  "Energy Grid", "Telecom Infrastructure", "Satellite Operator", "Defense Contractor",
  "University Network", "Retail Chain", "Social Media Platform", "Crypto Exchange",
];

const LOCATIONS = [
  { name: "Moscow, RU", lat: 55.7558, lng: 37.6173 },
  { name: "Beijing, CN", lat: 39.9042, lng: 116.4074 },
  { name: "Pyongyang, KP", lat: 39.0392, lng: 125.7625 },
  { name: "Tehran, IR", lat: 35.6892, lng: 51.3890 },
  { name: "Washington, US", lat: 38.9072, lng: -77.0369 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo, JP", lat: 35.6762, lng: 139.6503 },
  { name: "Seoul, KR", lat: 37.5665, lng: 126.9780 },
  { name: "Tel Aviv, IL", lat: 32.0853, lng: 34.7818 },
  { name: "Bucharest, RO", lat: 44.4268, lng: 26.1025 },
  { name: "Nairobi, KE", lat: -1.2921, lng: 36.8219 },
  { name: "Sao Paulo, BR", lat: -23.5505, lng: -46.6333 },
];

const CVE_DESCRIPTIONS = [
  "Zero-day in Apache Struts allows RCE",
  "SQL injection in Oracle WebLogic",
  "Privilege escalation in Linux kernel",
  "Buffer overflow in OpenSSL library",
  "Path traversal in Nginx config",
  "XXE vulnerability in SAP systems",
  "Deserialization flaw in Java apps",
  "Type confusion in Chrome V8 engine",
  "Use-after-free in Firefox",
  "Integer overflow in Windows SMB",
];

const ATTACK_DESCRIPTIONS = [
  "Brute force detected on SSH port 22",
  "C2 beaconing to known bad IP",
  "Lateral movement via PsExec",
  "Data exfiltration via DNS tunneling",
  "Credential harvesting via Mimikatz",
  "Supply chain compromise detected",
  "Watering hole attack on vendor site",
  "Spear phishing campaign launched",
  "Zero-day exploit deployed",
  "Ransomware payload delivered",
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return `THREAT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function generateThreatEvent(): ThreatEvent {
  const type = randomChoice(THREAT_TYPES);
  const location = randomChoice(LOCATIONS);
  const now = new Date();
  
  let description: string;
  switch (type) {
    case "cve":
      description = randomChoice(CVE_DESCRIPTIONS);
      break;
    case "breach":
      description = `Data breach: ${Math.floor(Math.random() * 100)}M records exposed`;
      break;
    case "attack":
      description = randomChoice(ATTACK_DESCRIPTIONS);
      break;
    case "malware":
      description = `${randomChoice(["Trojan", "Worm", "Rootkit", "Spyware", "Adware"])} variant detected`;
      break;
    case "phishing":
      description = `Credential phishing targeting ${randomChoice(TARGETS)}`;
      break;
    case "ddos":
      description = `DDoS attack: ${Math.floor(Math.random() * 500 + 100)} Gbps`;
      break;
    default:
      description = "Unknown threat detected";
  }

  return {
    id: generateId(),
    timestamp: now,
    type,
    severity: randomChoice(SEVERITIES),
    source: randomChoice(SOURCES),
    target: randomChoice(TARGETS),
    description,
    location: location.name,
    coordinates: { lat: location.lat, lng: location.lng },
  };
}

export function generateThreatFeed(count: number = 20): ThreatEvent[] {
  const events: ThreatEvent[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const event = generateThreatEvent();
    event.timestamp = new Date(now.getTime() - i * Math.random() * 60000);
    events.push(event);
  }
  return events;
}

export function getLiveMalwareCount(): number {
  const base = 423;
  const now = Date.now();
  const increment = Math.floor((now / 1000) % 10000 / 10);
  return base + increment + Math.floor(Math.random() * 5);
}
