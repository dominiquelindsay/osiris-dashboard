import { useState, useEffect } from "react";
import { getSatellites, propagateSatellite, type SatelliteData } from "../lib/satellite-data";
import { Orbit, Navigation, Activity } from "lucide-react";

interface SatellitePanelProps {
  onSelectSatellite: (noradId: number) => void;
  selectedSatellite: number | null;
}

export default function SatellitePanel({ onSelectSatellite, selectedSatellite }: SatellitePanelProps) {
  const [satellites, setSatellites] = useState<SatelliteData[]>(getSatellites());
  const [selected, setSelected] = useState<SatelliteData | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const sats = getSatellites();
      const updated = sats.map(sat => {
        const pos = propagateSatellite(sat);
        return { ...sat, latitude: pos.lat, longitude: pos.lng, altitude: pos.alt };
      });
      setSatellites(updated);
      
      if (selectedSatellite) {
        const sel = updated.find(s => s.noradId === selectedSatellite);
        if (sel) setSelected(sel);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSatellite]);

  useEffect(() => {
    if (selectedSatellite) {
      const sat = satellites.find(s => s.noradId === selectedSatellite);
      if (sat) setSelected(sat);
    }
  }, [selectedSatellite, satellites]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="osiris-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Alt (km)</th>
              <th>Vel (km/s)</th>
            </tr>
          </thead>
          <tbody>
            {satellites.map((sat) => (
              <tr 
                key={sat.noradId}
                className={`cursor-pointer ${selectedSatellite === sat.noradId ? "bg-[#33ff00]/10" : ""}`}
                onClick={() => onSelectSatellite(sat.noradId)}
              >
                <td className="text-glow text-xs">{sat.name}</td>
                <td className="text-[#666] text-xs">{sat.type}</td>
                <td className="text-[#33ff00] text-xs">{Math.round(sat.altitude)}</td>
                <td className="text-[#33ff00] text-xs">{sat.velocity.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="osiris-panel p-4 mt-2 border-t border-[#1a331a]">
          <div className="flex items-center gap-2 mb-3">
            <Orbit size={14} className="text-[#ffcc00]" />
            <span className="text-sm font-bold text-glow-amber tracking-wider">{selected.name}</span>
          </div>
          <div className="text-[10px] text-[#666] mb-2 uppercase tracking-wider">{selected.type}</div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-[#666] text-[10px] uppercase">Altitude</span>
              <span className="text-glow">{Math.round(selected.altitude)} km</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#666] text-[10px] uppercase">Orbit</span>
              <span className="text-glow">{selected.orbitType}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#666] text-[10px] uppercase">Latitude</span>
              <span className="text-glow">{selected.latitude.toFixed(3)}°</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#666] text-[10px] uppercase">Longitude</span>
              <span className="text-glow">{selected.longitude.toFixed(3)}°</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#666] text-[10px] uppercase">Velocity</span>
              <span className="text-glow">{selected.velocity.toFixed(2)} km/s</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#666] text-[10px] uppercase">Period</span>
              <span className="text-glow">{selected.period} min</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#666] text-[10px] uppercase">NORAD ID</span>
              <span className="text-glow">{selected.noradId}</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="osiris-btn text-[10px] flex items-center gap-1">
              <Navigation size={10} />
              TRACK ON GLOBE
            </button>
            <button className="osiris-btn text-[10px] flex items-center gap-1">
              <Activity size={10} />
              TELEMETRY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
