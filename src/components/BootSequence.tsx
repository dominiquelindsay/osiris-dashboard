import { useState, useEffect } from "react";

const BOOT_LINES = [
  { text: "OSIRIS KERNEL v4.2.1 [BUILD 20250906]", delay: 0 },
  { text: "Copyright (c) 2025 Open Source Intelligence Systems", delay: 100 },
  { text: "", delay: 200 },
  { text: "Initializing hardware abstraction layer...", delay: 300 },
  { text: "  [OK] CPU: ARM Cortex-A78 @ 2.4GHz", delay: 500 },
  { text: "  [OK] RAM: 32GB DDR5 @ 4800MHz", delay: 600 },
  { text: "  [OK] GPU: Mali-G710 MP10", delay: 700 },
  { text: "  [OK] Storage: 2TB NVMe SSD", delay: 800 },
  { text: "", delay: 900 },
  { text: "Loading kernel modules...", delay: 1000 },
  { text: "  [OK] satcom_drv.ko loaded", delay: 1200 },
  { text: "  [OK] crypto_accel.ko loaded", delay: 1300 },
  { text: "  [OK] threat_intel.ko loaded", delay: 1400 },
  { text: "  [OK] orbit_prop.ko loaded", delay: 1500 },
  { text: "", delay: 1600 },
  { text: "Initializing satellite tracking subsystem...", delay: 1700 },
  { text: "  [OK] TLE database loaded: 4,892 satellites", delay: 1900 },
  { text: "  [OK] SGP4 propagator initialized", delay: 2000 },
  { text: "  [OK] Ground station network: 12 stations online", delay: 2100 },
  { text: "", delay: 2200 },
  { text: "Initializing threat intelligence engine...", delay: 2300 },
  { text: "  [OK] CVE database: 245,331 entries", delay: 2500 },
  { text: "  [OK] IOC feeds: 8 sources connected", delay: 2600 },
  { text: "  [OK] Dark web monitors: ACTIVE", delay: 2700 },
  { text: "  [WARNING] Anomalous traffic detected on port 4444", delay: 2800 },
  { text: "", delay: 2900 },
  { text: "Initializing 3D visualization engine...", delay: 3000 },
  { text: "  [OK] WebGL context established", delay: 3200 },
  { text: "  [OK] Earth texture loaded (8K)", delay: 3300 },
  { text: "  [OK] Satellite mesh buffers allocated", delay: 3400 },
  { text: "", delay: 3500 },
  { text: "Running security checks...", delay: 3600 },
  { text: "  [OK] Firewall: ACTIVE", delay: 3800 },
  { text: "  [OK] IDS signatures: 12,445 loaded", delay: 3900 },
  { text: "  [OK] Encryption: AES-256-GCM", delay: 4000 },
  { text: "", delay: 4100 },
  { text: "Mounting virtual filesystems...", delay: 4200 },
  { text: "  [OK] /dev/satcom mounted", delay: 4400 },
  { text: "  [OK] /dev/threat mounted", delay: 4500 },
  { text: "  [OK] /dev/orbit mounted", delay: 4600 },
  { text: "", delay: 4700 },
  { text: "Starting OSIRIS services...", delay: 4800 },
  { text: "  [OK] Satellite Tracker daemon started (PID: 1842)", delay: 5000 },
  { text: "  [OK] Threat Intel daemon started (PID: 1843)", delay: 5100 },
  { text: "  [OK] Red Team Simulator started (PID: 1844)", delay: 5200 },
  { text: "  [OK] Globe Renderer started (PID: 1845)", delay: 5300 },
  { text: "", delay: 5400 },
  { text: "========================================", delay: 5500 },
  { text: "  OSIRIS SYSTEM READY", delay: 5600 },
  { text: "  OPEN SOURCE INTELLIGENCE", delay: 5700 },
  { text: "  SECURE CONNECTION ESTABLISHED", delay: 5800 },
  { text: "========================================", delay: 5900 },
  { text: "", delay: 6000 },
  { text: "> _", delay: 6100, cursor: true },
];

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    BOOT_LINES.forEach((line, index) => {
      const timeout = setTimeout(() => {
        setVisibleLines(index + 1);
        if (index === BOOT_LINES.length - 1) {
          setShowCursor(true);
          setTimeout(onComplete, 1500);
        }
      }, line.delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-start justify-start p-8 font-mono text-xs md:text-sm overflow-auto">
      <div className="w-full max-w-4xl">
        {BOOT_LINES.slice(0, visibleLines).map((line, index) => (
          <div 
            key={index} 
            className={`mb-0.5 ${line.text.includes("WARNING") ? "text-amber-400 text-glow-amber" : ""} ${line.text.includes("OSIRIS SYSTEM READY") ? "text-xl font-bold text-glow mt-4" : ""}`}
          >
            {line.text.startsWith("  [OK]") && (
              <span className="text-green-500 mr-1">[OK]</span>
            )}
            {line.text.startsWith("  [WARNING]") && (
              <span className="text-amber-400 mr-1">[WARNING]</span>
            )}
            {line.text.replace("  [OK] ", "").replace("  [WARNING] ", "")}
            {line.cursor && showCursor && (
              <span className="animate-pulse text-green-400">_</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
