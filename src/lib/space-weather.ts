export interface SpaceWeatherEvent {
  id: string;
  timestamp: Date;
  type: "flare" | "storm" | "cme" | "wind" | "radiation";
  severity: "normal" | "moderate" | "strong" | "severe" | "extreme";
  description: string;
  value: string;
  impact: string;
}

const FLARE_DESCRIPTIONS = [
  "X-class solar flare detected",
  "M-class flare with radio blackout",
  "C-class minor flare",
  "Double-peaked X-flare event",
  "Long-duration CME-associated flare",
];

const STORM_DESCRIPTIONS = [
  "Geomagnetic storm Kp=7 (G3 - Strong)",
  "Minor geomagnetic storm Kp=5 (G1)",
  "Severe geomagnetic storm Kp=8 (G4)",
  "Extreme geomagnetic storm Kp=9 (G5)",
  "Substorm activity in polar regions",
];

const CME_DESCRIPTIONS = [
  "Full halo CME Earth-directed",
  "Partial halo CME with glancing blow",
  "Fast CME (1200 km/s) detected",
  "Slow CME (400 km/s) non-threatening",
  "CME arrival at L1 (ACE satellite)",
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSpaceWeatherFeed(count: number = 15): SpaceWeatherEvent[] {
  const events: SpaceWeatherEvent[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const type = randomChoice(["flare", "storm", "cme", "wind", "radiation"] as const);
    let description: string;
    let value: string;
    let impact: string;
    
    switch (type) {
      case "flare":
        description = randomChoice(FLARE_DESCRIPTIONS);
        value = `${Math.floor(Math.random() * 100) / 10} x10^-7 W/m²`;
        impact = randomChoice(["HF radio blackout", "GPS degradation", "Satellite damage risk", "Aurora potential"]);
        break;
      case "storm":
        description = randomChoice(STORM_DESCRIPTIONS);
        value = `Kp=${Math.floor(Math.random() * 5) + 5}`;
        impact = randomChoice(["Aurora visible at mid-latitudes", "Power grid fluctuations", "Satellite tumbling risk", "Pipeline corrosion increase"]);
        break;
      case "cme":
        description = randomChoice(CME_DESCRIPTIONS);
        value = `${Math.floor(Math.random() * 1200 + 300)} km/s`;
        impact = randomChoice(["Arrival in 24-48 hours", "Glancing blow expected", "Direct hit probability 80%", "Minor geomagnetic effects"]);
        break;
      case "wind":
        description = "Solar wind speed change detected";
        value = `${Math.floor(Math.random() * 500 + 300)} km/s`;
        impact = randomChoice(["Magnetosphere compression", "Minor aurora", "No significant effects"]);
        break;
      case "radiation":
        description = "High-energy proton event";
        value = `${Math.floor(Math.random() * 1000 + 10)} pfu`;
        impact = randomChoice(["Radiation hazard to astronauts", "Satellite electronics risk", "Polar flight rerouting advised"]);
        break;
    }
    
    events.push({
      id: `SW-${Date.now()}-${i}`,
      timestamp: new Date(now.getTime() - i * Math.random() * 3600000),
      type,
      severity: randomChoice(["normal", "moderate", "strong", "severe", "extreme"] as const),
      description,
      value,
      impact,
    });
  }
  
  return events;
}

export function getCurrentKpIndex(): number {
  return Math.floor(Math.random() * 9);
}

export function getSolarWindSpeed(): number {
  return Math.floor(Math.random() * 400 + 300);
}

export function getBzComponent(): number {
  return Math.floor(Math.random() * 20 - 10);
}
