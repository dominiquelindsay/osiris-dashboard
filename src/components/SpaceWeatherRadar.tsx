import { useState, useEffect } from "react";
import { generateSpaceWeatherFeed, getCurrentKpIndex, getSolarWindSpeed, getBzComponent, type SpaceWeatherEvent } from "../lib/space-weather";
import { Sun, Wind, Zap, Activity, AlertTriangle, Radio } from "lucide-react";

const TYPE_ICONS = {
  flare: Sun,
  storm: Zap,
  cme: Wind,
  wind: Activity,
  radiation: Radio,
};

const SEVERITY_COLORS = {
  normal: "text-[#33ff00]",
  moderate: "text-[#ffcc00]",
  strong: "text-[#ffaa00]",
  severe: "text-[#ff3333]",
  extreme: "text-[#ff3333]",
};

export default function SpaceWeatherRadar() {
  const [events, setEvents] = useState<SpaceWeatherEvent[]>([]);
  const [kpIndex, setKpIndex] = useState(0);
  const [windSpeed, setWindSpeed] = useState(400);
  const [bz, setBz] = useState(0);

  useEffect(() => {
    setEvents(generateSpaceWeatherFeed(12));
    
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvent = generateSpaceWeatherFeed(1)[0];
        newEvent.timestamp = new Date();
        return [newEvent, ...prev].slice(0, 30);
      });
      setKpIndex(getCurrentKpIndex());
      setWindSpeed(getSolarWindSpeed());
      setBz(getBzComponent());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getKpColor = (kp: number) => {
    if (kp >= 7) return "text-glow-red";
    if (kp >= 5) return "text-glow-amber";
    return "text-glow";
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="osiris-panel p-4">
        <div className="flex items-center gap-3 mb-4">
          <Sun size={20} className="text-[#ffaa00]" />
          <div>
            <div className="text-lg font-bold text-glow-amber tracking-wider">SPACE WEATHER RADAR</div>
            <div className="text-[10px] text-[#666] uppercase tracking-[3px]">Solar Activity & Magnetosphere Monitor</div>
          </div>
        </div>
        
        {/* Live gauges */}
        <div className="grid grid-cols-3 gap-4">
          <div className="osiris-panel p-3 text-center">
            <div className="text-[10px] text-[#666] uppercase mb-2">Kp Index</div>
            <div className={`text-3xl font-bold ${getKpColor(kpIndex)}`}>{kpIndex}</div>
            <div className="w-full h-2 bg-[#1a331a] mt-2">
              <div className="h-full bg-gradient-to-r from-[#33ff00] via-[#ffcc00] to-[#ff3333]" style={{ width: `${(kpIndex / 9) * 100}%` }} />
            </div>
            <div className="text-[9px] text-[#666] mt-1">
              {kpIndex >= 7 ? "STORM WARNING" : kpIndex >= 5 ? "ELEVATED" : "QUIET"}
            </div>
          </div>
          <div className="osiris-panel p-3 text-center">
            <div className="text-[10px] text-[#666] uppercase mb-2">Solar Wind</div>
            <div className="text-3xl font-bold text-glow">{windSpeed}</div>
            <div className="text-[10px] text-[#666]">km/s</div>
            <div className="w-full h-2 bg-[#1a331a] mt-2">
              <div className="h-full bg-[#00ccff]" style={{ width: `${Math.min((windSpeed / 900) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="osiris-panel p-3 text-center">
            <div className="text-[10px] text-[#666] uppercase mb-2">Bz Component</div>
            <div className={`text-3xl font-bold ${bz < -5 ? "text-glow-red" : "text-glow-cyan"}`}>
              {bz > 0 ? "+" : ""}{bz}
            </div>
            <div className="text-[10px] text-[#666]">nT</div>
            <div className="w-full h-2 bg-[#1a331a] mt-2 relative">
              <div className="absolute left-1/2 w-px h-full bg-[#666]" />
              <div 
                className="h-full bg-[#00ccff]" 
                style={{ 
                  width: `${Math.min(Math.abs(bz) / 10 * 50, 50)}%`,
                  marginLeft: bz >= 0 ? "50%" : `${50 - Math.min(Math.abs(bz) / 10 * 50, 50)}%`
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Feed */}
      <div className="osiris-panel flex-1 overflow-auto">
        <div className="terminal-header flex items-center gap-2">
          <AlertTriangle size={12} className="text-[#ffaa00] animate-pulse" />
          LIVE SPACE WEATHER FEED
        </div>
        <div className="p-2 space-y-1">
          {events.map((event) => {
            const Icon = TYPE_ICONS[event.type];
            return (
              <div 
                key={event.id} 
                className={`p-2 border-l-2 ${SEVERITY_COLORS[event.severity]} bg-[#0a0f0a] hover:bg-[#1a1a0a] transition-colors`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={12} />
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      {event.type}
                    </span>
                    <span className={`text-[9px] px-1 border ${SEVERITY_COLORS[event.severity]}`}>
                      {event.severity}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#666]">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs mb-1">{event.description}</div>
                <div className="flex items-center gap-3 text-[10px] text-[#666]">
                  <span>VAL: {event.value}</span>
                  <span>IMPACT: {event.impact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
