import { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import BootSequence from "./components/BootSequence";
import SatellitePanel from "./components/SatellitePanel";
import ThreatTerminal from "./components/ThreatTerminal";
import RedTeamSim from "./components/RedTeamSim";
import ISSTracker from "./components/ISSTracker";
import ConstellationOverlord from "./components/ConstellationOverlord";
import SpaceWeatherRadar from "./components/SpaceWeatherRadar";
import Globe from "./components/Globe";
import { useAudio } from "./hooks/useAudio";
import { useVoiceCommand } from "./hooks/useVoiceCommand";
import { CONFLICT_ZONES } from "./lib/conflict-data";
import { MIGRATION_ROUTES } from "./lib/migration-data";
import { Flame, Route, AlertTriangle, Volume2, VolumeX } from "lucide-react";

const INTENSITY_BADGES: Record<string, string> = {
  critical: "text-[#ff3333] border-[#ff3333]",
  high: "text-[#ffaa00] border-[#ffaa00]",
  medium: "text-[#ffcc00] border-[#ffcc00]",
  low: "text-[#33ff00] border-[#33ff00]",
};

function App() {
  const [bootComplete, setBootComplete] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSatellite, setSelectedSatellite] = useState<number | null>(null);
  const [defconActive, setDefconActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevDefconRef = useRef(false);

  const { playClick, playAlert, playBootSound, playThreatAlert, playBeep } = useAudio();

  const handleViewChange = useCallback((view: string) => {
    setActiveView(view);
    if (soundEnabled) playClick();
  }, [playClick, soundEnabled]);

  const handleVoiceCommand = useCallback((cmd: string) => {
    if (cmd === "defcon") {
      setDefconActive(prev => !prev);
      if (soundEnabled) playAlert();
    } else {
      setActiveView(cmd);
      if (soundEnabled) playClick();
    }
  }, [playAlert, playClick, soundEnabled]);

  const { listening, startListening, stopListening, error: voiceError } = useVoiceCommand(handleVoiceCommand);

  const handleSatelliteSelect = useCallback((noradId: number) => {
    setSelectedSatellite(noradId);
  }, []);

  const handleDefconChange = useCallback((active: boolean) => {
    setDefconActive(active);
  }, []);

  // Play boot sound when boot completes
  useEffect(() => {
    if (bootComplete && soundEnabled) {
      playBootSound();
    }
  }, [bootComplete, soundEnabled, playBootSound]);

  // Play DEFCON activation/deactivation sounds
  useEffect(() => {
    if (!bootComplete) return;
    if (defconActive && !prevDefconRef.current) {
      if (soundEnabled) playThreatAlert();
    } else if (!defconActive && prevDefconRef.current) {
      if (soundEnabled) playBeep(600, 0.3, "sine");
    }
    prevDefconRef.current = defconActive;
  }, [defconActive, bootComplete, soundEnabled, playThreatAlert, playBeep]);

  // Apply DEFCON class to body for CSS overrides
  useEffect(() => {
    if (defconActive) {
      document.body.classList.add("defcon-active");
    } else {
      document.body.classList.remove("defcon-active");
    }
  }, [defconActive]);

  const handleVoiceToggle = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
    if (soundEnabled) playClick();
  }, [listening, startListening, stopListening, playClick, soundEnabled]);

  if (!bootComplete) {
    return <BootSequence onComplete={() => setBootComplete(true)} />;
  }

  return (
    <div className="h-screen flex bg-[#050505] text-[#33ff00] overflow-hidden crt-scanlines">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        voiceListening={listening}
        onVoiceToggle={handleVoiceToggle}
        defconActive={defconActive}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className={`h-10 border-b border-[#1a331a] flex items-center justify-between px-4 bg-[#0a0f0a] ${defconActive ? "defcon-pulse-border" : ""}`}>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#666] uppercase tracking-[3px]">
              {activeView === "dashboard" && "Command Center"}
              {activeView === "constellation" && "Constellation Overlord"}
              {activeView === "iss" && "ISS Tracker"}
              {activeView === "threats" && "Threat Intelligence"}
              {activeView === "redteam" && "Red Team Simulator"}
              {activeView === "spaceweather" && "Space Weather Radar"}
              {activeView === "conflicts" && "Armed Conflict Zones"}
              {activeView === "migration" && "Global Migration Flows"}
              {activeView === "terminal" && "System Terminal"}
            </span>
            {defconActive && (
              <span className="flex items-center gap-1 text-[10px] text-[#ff3333] font-bold defcon-strobe">
                <AlertTriangle size={12} />
                DEFCON ALERT
              </span>
            )}
            {voiceError && (
              <span className="text-[10px] text-[#ff3333]">Voice: {voiceError}</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[#666]">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playClick();
              }}
              className="flex items-center gap-1 hover:text-[#33ff00] transition-colors"
            >
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              <span>{soundEnabled ? "SND:ON" : "SND:OFF"}</span>
            </button>
            <span className="flex items-center gap-1">
              <span className={`status-dot ${defconActive ? "status-danger animate-pulse" : "status-online"}`}></span>
              {defconActive ? "ALERT" : "CONNECTED"}
            </span>
            <span>{new Date().toLocaleTimeString("en-US", { hour12: false })}</span>
            <span>UTC</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Dashboard / Globe view */}
          {activeView === "dashboard" && (
            <div className="h-full flex">
              <div className="flex-1 relative">
                <Globe 
                  selectedSatellite={selectedSatellite} 
                  onSatelliteSelect={handleSatelliteSelect}
                  showConflicts={true}
                  showMigration={true}
                />
                <div className="absolute top-4 left-4 pointer-events-none">
                  <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Active Satellites</div>
                  <div className="text-2xl font-bold text-glow">4,892</div>
                </div>
                <div className="absolute bottom-4 left-4 pointer-events-none">
                  <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Ground Stations</div>
                  <div className="text-xl font-bold text-glow-amber">12 Online</div>
                </div>
                <div className="absolute top-4 right-4 pointer-events-none text-right">
                  <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Conflict Zones</div>
                  <div className="text-xl font-bold text-glow-red">{CONFLICT_ZONES.length} Active</div>
                </div>
                <div className="absolute bottom-4 right-4 pointer-events-none text-right">
                  <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Migration Routes</div>
                  <div className="text-xl font-bold text-glow">{MIGRATION_ROUTES.length} Tracked</div>
                </div>
              </div>
              
              <div className="w-80 border-l border-[#1a331a] bg-[#0a0f0a]">
                <SatellitePanel 
                  selectedSatellite={selectedSatellite}
                  onSelectSatellite={handleSatelliteSelect}
                />
              </div>
            </div>
          )}

          {/* Constellation Overlord */}
          {activeView === "constellation" && (
            <div className="h-full p-4">
              <ConstellationOverlord />
            </div>
          )}

          {/* ISS Tracker */}
          {activeView === "iss" && (
            <div className="h-full p-4">
              <ISSTracker />
            </div>
          )}

          {/* Threat Intel */}
          {activeView === "threats" && (
            <div className="h-full p-4">
              <ThreatTerminal onDefconChange={handleDefconChange} />
            </div>
          )}

          {/* Red Team Simulator */}
          {activeView === "redteam" && (
            <div className="h-full p-4">
              <RedTeamSim />
            </div>
          )}

          {/* Space Weather Radar */}
          {activeView === "spaceweather" && (
            <div className="h-full p-4">
              <SpaceWeatherRadar />
            </div>
          )}

          {/* Conflict Zones Table View */}
          {activeView === "conflicts" && (
            <div className="h-full p-4 flex flex-col gap-4">
              <div className="osiris-panel p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Flame size={20} className="text-[#ff3333]" />
                  <div>
                    <div className="text-lg font-bold text-glow-red tracking-wider">ARMED CONFLICT ZONES</div>
                    <div className="text-[10px] text-[#666] uppercase tracking-[3px]">Global Active Conflict Monitor</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">Critical</div>
                    <div className="text-xl font-bold text-glow-red">
                      {CONFLICT_ZONES.filter(z => z.intensity === "critical").length}
                    </div>
                  </div>
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">High</div>
                    <div className="text-xl font-bold text-glow-amber">
                      {CONFLICT_ZONES.filter(z => z.intensity === "high").length}
                    </div>
                  </div>
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">Total Zones</div>
                    <div className="text-xl font-bold text-glow">{CONFLICT_ZONES.length}</div>
                  </div>
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">Countries Affected</div>
                    <div className="text-xl font-bold text-glow">
                      {new Set(CONFLICT_ZONES.map(z => z.country)).size}
                    </div>
                  </div>
                </div>
              </div>
              <div className="osiris-panel flex-1 overflow-auto">
                <div className="terminal-header flex items-center gap-2">
                  <Flame size={12} className="text-[#ff3333]" />
                  ACTIVE CONFLICT REGISTRY
                </div>
                <table className="osiris-table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Country</th>
                      <th>Type</th>
                      <th>Intensity</th>
                      <th>Status</th>
                      <th>Casualties</th>
                      <th>Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONFLICT_ZONES.map((zone) => (
                      <tr key={zone.id}>
                        <td className="text-xs font-bold">{zone.name}</td>
                        <td className="text-[10px] text-[#666]">{zone.country}</td>
                        <td className="text-[10px]">{zone.type}</td>
                        <td>
                          <span className={`text-[9px] px-1 border ${INTENSITY_BADGES[zone.intensity]}`}>
                            {zone.intensity.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-[10px]">{zone.status}</td>
                        <td className="text-[10px] text-[#ff3333]">{zone.casualties}</td>
                        <td className="text-[10px] text-[#666]">{zone.since}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Migration Flows Table View */}
          {activeView === "migration" && (
            <div className="h-full p-4 flex flex-col gap-4">
              <div className="osiris-panel p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Route size={20} className="text-[#33ff00]" />
                  <div>
                    <div className="text-lg font-bold text-glow tracking-wider">GLOBAL MIGRATION FLOWS</div>
                    <div className="text-[10px] text-[#666] uppercase tracking-[3px]">Human Movement Tracking System</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">Crisis Routes</div>
                    <div className="text-xl font-bold text-glow-red">
                      {MIGRATION_ROUTES.filter(r => r.type.includes("Refugee") || r.type.includes("Crisis")).length}
                    </div>
                  </div>
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">Labor Routes</div>
                    <div className="text-xl font-bold text-glow">
                      {MIGRATION_ROUTES.filter(r => r.type.includes("Labor")).length}
                    </div>
                  </div>
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">Total Routes</div>
                    <div className="text-xl font-bold text-glow">{MIGRATION_ROUTES.length}</div>
                  </div>
                  <div className="osiris-panel p-2 text-center">
                    <div className="text-[10px] text-[#666] uppercase">Regions Covered</div>
                    <div className="text-xl font-bold text-glow-amber">6</div>
                  </div>
                </div>
              </div>
              <div className="osiris-panel flex-1 overflow-auto">
                <div className="terminal-header flex items-center gap-2">
                  <Route size={12} className="text-[#33ff00]" />
                  MIGRATION ROUTE REGISTRY
                </div>
                <table className="osiris-table">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Volume</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MIGRATION_ROUTES.map((route) => (
                      <tr key={route.id}>
                        <td className="text-xs font-bold">{route.name}</td>
                        <td className="text-[10px] text-[#666]">{route.origin.name}</td>
                        <td className="text-[10px] text-[#666]">{route.destination.name}</td>
                        <td className="text-[10px] font-bold" style={{ color: route.color }}>{route.volume}</td>
                        <td className="text-[10px]">{route.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Terminal */}
          {activeView === "terminal" && (
            <div className="h-full p-4 flex flex-col">
              <div className="terminal-window flex-1 flex flex-col">
                <div className="terminal-header">root@osiris:~#</div>
                <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                  <div className="text-glow mb-2">root@osiris:~# uname -a</div>
                  <div className="text-[#666] mb-4">Linux osiris 6.8.0-osiris #1 SMP PREEMPT x86_64 GNU/Linux</div>
                  
                  <div className="text-glow mb-2">root@osiris:~# satctl status</div>
                  <div className="text-[#666] mb-1">[OK] Satellite tracker daemon: RUNNING</div>
                  <div className="text-[#666] mb-1">[OK] TLE database: 4,892 entries loaded</div>
                  <div className="text-[#666] mb-1">[OK] Ground stations: 12/12 online</div>
                  <div className="text-[#666] mb-4">[OK] SGP4 propagator: ACTIVE</div>
                  
                  <div className="text-glow mb-2">root@osiris:~# threatctl status</div>
                  <div className="text-[#666] mb-1">[OK] Threat intel daemon: RUNNING</div>
                  <div className="text-[#666] mb-1">[OK] CVE database: 245,331 entries</div>
                  <div className="text-[#666] mb-1">[OK] IOC feeds: 8 sources connected</div>
                  <div className="text-amber-400 mb-4">[WARNING] Anomalous traffic on port 4444</div>

                  <div className="text-glow mb-2">root@osiris:~# weatherctl status</div>
                  <div className="text-[#666] mb-1">[OK] Space weather monitor: RUNNING</div>
                  <div className="text-[#666] mb-1">[OK] ACE satellite data: RECEIVING</div>
                  <div className="text-[#666] mb-1">[OK] Kp index calculator: ACTIVE</div>
                  <div className="text-[#666] mb-4">[OK] Solar wind sensor: ONLINE</div>

                  <div className="text-glow mb-2">root@osiris:~# conflictctl status</div>
                  <div className="text-[#666] mb-1">[OK] Conflict zone tracker: RUNNING</div>
                  <div className="text-[#666] mb-1">[OK] ACLED feed: CONNECTED</div>
                  <div className="text-[#666] mb-1">[OK] UCDP data: SYNCED</div>
                  <div className="text-[#666] mb-4">[OK] Armed conflict zones: 15 tracked</div>

                  <div className="text-glow mb-2">root@osiris:~# migratectl status</div>
                  <div className="text-[#666] mb-1">[OK] Migration flow tracker: RUNNING</div>
                  <div className="text-[#666] mb-1">[OK] UNHCR data feed: CONNECTED</div>
                  <div className="text-[#666] mb-1">[OK] IOM displacement data: SYNCED</div>
                  <div className="text-[#666] mb-4">[OK] Migration routes: 12 tracked</div>
                  
                  <div className="text-glow mb-2">root@osiris:~# satctl list --active</div>
                  <div className="text-[#666] mb-1">NORAD 25544 ISS (ZARYA) [LEO] - ACTIVE</div>
                  <div className="text-[#666] mb-1">NORAD 54217 STARLINK-35572 [LEO] - ACTIVE</div>
                  <div className="text-[#666] mb-1">NORAD 54134 STARLINK-35489 [LEO] - ACTIVE</div>
                  <div className="text-[#666] mb-1">NORAD 20580 HUBBLE [LEO] - ACTIVE</div>
                  <div className="text-[#666] mb-4">... and 4,888 more</div>
                  
                  <div className="text-glow flex items-center gap-1">
                    root@osiris:~#
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
