import { CONSTELLATIONS, type ConstellationData } from "../lib/satellite-data";
import { Satellite, Radio, Eye, BarChart3 } from "lucide-react";

export default function ConstellationOverlord() {
  const getStatusColor = (c: ConstellationData) => {
    if (c.active === c.count && c.count > 0) return "text-[#33ff00]";
    if (c.active > 0) return "text-[#ffcc00]";
    return "text-[#666]";
  };

  const getCoverageColor = (coverage: string) => {
    switch (coverage) {
      case "Global": return "text-[#33ff00]";
      case "Planned": return "text-[#666]";
      default: return "text-[#ffcc00]";
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="osiris-panel p-4">
        <div className="flex items-center gap-3 mb-4">
          <Satellite size={20} className="text-[#ffcc00]" />
          <div>
            <div className="text-lg font-bold text-glow-amber tracking-wider">CONSTELLATION OVERLORD</div>
            <div className="text-[10px] text-[#666] uppercase tracking-[3px]">Global Satellite Network Monitor</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center osiris-panel p-2">
            <div className="text-[10px] text-[#666] uppercase mb-1">Total Sats</div>
            <div className="text-2xl font-bold text-glow">
              {CONSTELLATIONS.reduce((a, c) => a + c.count, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center osiris-panel p-2">
            <div className="text-[10px] text-[#666] uppercase mb-1">Active</div>
            <div className="text-2xl font-bold text-glow">
              {CONSTELLATIONS.reduce((a, c) => a + c.active, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center osiris-panel p-2">
            <div className="text-[10px] text-[#666] uppercase mb-1">Orbital Planes</div>
            <div className="text-2xl font-bold text-glow">
              {CONSTELLATIONS.reduce((a, c) => a + c.orbitalPlanes, 0)}
            </div>
          </div>
          <div className="text-center osiris-panel p-2">
            <div className="text-[10px] text-[#666] uppercase mb-1">Networks</div>
            <div className="text-2xl font-bold text-glow">
              {CONSTELLATIONS.length}
            </div>
          </div>
        </div>
      </div>

      <div className="osiris-panel flex-1 overflow-auto">
        <div className="terminal-header flex items-center gap-2">
          <Eye size={12} />
          ACTIVE CONSTELLATIONS
        </div>
        <table className="osiris-table">
          <thead>
            <tr>
              <th>Network</th>
              <th className="text-right">Total</th>
              <th className="text-right">Active</th>
              <th className="text-right">Planes</th>
              <th className="text-right">Inclination</th>
              <th className="text-right">Altitude</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {CONSTELLATIONS.map((c) => (
              <tr key={c.name} className="hover:bg-[#33ff00]/5">
                <td className="font-bold text-xs">
                  <div className="flex items-center gap-2">
                    <Radio size={12} className={getStatusColor(c)} />
                    <span className={getStatusColor(c)}>{c.name}</span>
                  </div>
                </td>
                <td className="text-right text-xs text-[#666]">{c.count.toLocaleString()}</td>
                <td className="text-right text-xs">
                  <span className={getStatusColor(c)}>{c.active.toLocaleString()}</span>
                  <span className="text-[#666] ml-1">
                    ({((c.active / Math.max(c.count, 1)) * 100).toFixed(0)}%)
                  </span>
                </td>
                <td className="text-right text-xs text-[#666]">{c.orbitalPlanes}</td>
                <td className="text-right text-xs text-[#33ff00]">{c.inclination}°</td>
                <td className="text-right text-xs text-[#33ff00]">{c.altitude} km</td>
                <td className={`text-xs ${getCoverageColor(c.coverage)}`}>{c.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="osiris-panel p-4">
        <div className="terminal-header flex items-center gap-2 mb-3">
          <BarChart3 size={12} />
          COVERAGE HEATMAP
        </div>
        <div className="flex items-end gap-1 h-24">
          {CONSTELLATIONS.filter(c => c.active > 0).map((c) => {
            const height = Math.min((c.active / 5000) * 100, 100);
            return (
              <div key={c.name} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-gradient-to-t from-[#1a331a] to-[#33ff00] opacity-60 hover:opacity-100 transition-opacity"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[8px] text-[#666] uppercase truncate w-full text-center">
                  {c.name.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
