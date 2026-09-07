import { useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import BootSequence from "./components/BootSequence";
import SatellitePanel from "./components/SatellitePanel";
import ThreatTerminal from "./components/ThreatTerminal";
import RedTeamSim from "./components/RedTeamSim";
import ISSTracker from "./components/ISSTracker";
import ConstellationOverlord from "./components/ConstellationOverlord";
import Globe from "./components/Globe";

function App() {
  const [bootComplete, setBootComplete] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSatellite, setSelectedSatellite] = useState<number | null>(null);

  const handleSatelliteSelect = useCallback((noradId: number) => {
    setSelectedSatellite(noradId);
  }, []);

  if (!bootComplete) {
    return <BootSequence onComplete={() => setBootComplete(true)} />;
  }

  return (
    <div className="h-screen flex bg-[#050505] text-[#33ff00] overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-10 border-b border-[#1a331a] flex items-center justify-between px-4 bg-[#0a0f0a]">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#666] uppercase tracking-[3px]">
              {activeView === "dashboard" && "Command Center"}
              {activeView === "constellation" && "Constellation Overlord"}
              {activeView === "iss" && "ISS Tracker"}
              {activeView === "threats" && "Threat Intelligence"}
              {activeView === "redteam" && "Red Team Simulator"}
              {activeView === "terminal" && "System Terminal"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[#666]">
            <span className="flex items-center gap-1">
              <span className="status-dot status-online"></span>
              CONNECTED
            </span>
            <span>{new Date().toLocaleTimeString("en-US", { hour12: false })}</span>
            <span>UTC</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeView === "dashboard" && (
            <div className="h-full flex">
              <div className="flex-1 relative">
                <Globe 
                  selectedSatellite={selectedSatellite} 
                  onSatelliteSelect={handleSatelliteSelect} 
                />
                <div className="absolute top-4 left-4 pointer-events-none">
                  <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Active Satellites</div>
                  <div className="text-2xl font-bold text-glow">4,892</div>
                </div>
                <div className="absolute bottom-4 left-4 pointer-events-none">
                  <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Ground Stations</div>
                  <div className="text-xl font-bold text-glow-amber">12 Online</div>
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

          {activeView === "constellation" && (
            <div className="h-full p-4">
              <ConstellationOverlord />
            </div>
          )}

          {activeView === "iss" && (
            <div className="h-full p-4">
              <ISSTracker />
            </div>
          )}

          {activeView === "threats" && (
            <div className="h-full p-4">
              <ThreatTerminal />
            </div>
          )}

          {activeView === "redteam" && (
            <div className="h-full p-4">
              <RedTeamSim />
            </div>
          )}

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
