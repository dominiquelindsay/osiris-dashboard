import { useState, useEffect } from "react";
import { getSatellites, propagateSatellite } from "../lib/satellite-data";
import { Globe, Clock, Users, Radio, ArrowUpRight } from "lucide-react";

export default function ISSTracker() {
  const [position, setPosition] = useState({ lat: 0, lng: 0, alt: 0 });
  const [crewCount] = useState(7);
  const [nextPass, setNextPass] = useState("--:--");
  const [velocity, setVelocity] = useState(7.66);

  useEffect(() => {
    const iss = getSatellites().find(s => s.name.includes("ISS"));
    if (!iss) return;

    const interval = setInterval(() => {
      const pos = propagateSatellite(iss);
      setPosition(pos);
      setVelocity(iss.velocity + (Math.random() - 0.5) * 0.01);
      
      const now = new Date();
      const passTime = new Date(now.getTime() + 90 * 60 * 1000);
      setNextPass(passTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="osiris-panel p-4">
        <div className="flex items-center gap-3 mb-4">
          <Globe size={20} className="text-[#00ccff]" />
          <div>
            <div className="text-lg font-bold text-glow-cyan tracking-wider">ISS (ZARYA)</div>
            <div className="text-[10px] text-[#666] uppercase tracking-[3px]">International Space Station</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-[10px] text-[#666] uppercase mb-1">Crew</div>
            <div className="flex items-center justify-center gap-2">
              <Users size={14} className="text-[#ffcc00]" />
              <span className="text-xl font-bold text-glow-amber">{crewCount}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#666] uppercase mb-1">Altitude</div>
            <div className="text-xl font-bold text-glow">{Math.round(position.alt)} km</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#666] uppercase mb-1">Velocity</div>
            <div className="text-xl font-bold text-glow">{velocity.toFixed(2)} km/s</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#666] uppercase mb-1">Next Pass</div>
            <div className="flex items-center justify-center gap-2">
              <Clock size={14} className="text-[#33ff00]" />
              <span className="text-xl font-bold text-glow">{nextPass}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="osiris-panel p-4 flex-1">
        <div className="terminal-header mb-4 flex items-center gap-2">
          <Radio size={12} className="text-[#ff3333] animate-pulse" />
          LIVE POSITION TRACKING
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="osiris-panel p-3">
            <div className="text-[10px] text-[#666] uppercase mb-1">Latitude</div>
            <div className="text-2xl font-mono text-glow">{position.lat.toFixed(4)}°</div>
            <div className="text-[10px] text-[#666] mt-1">
              {position.lat > 0 ? "North" : "South"}
            </div>
          </div>
          <div className="osiris-panel p-3">
            <div className="text-[10px] text-[#666] uppercase mb-1">Longitude</div>
            <div className="text-2xl font-mono text-glow">{position.lng.toFixed(4)}°</div>
            <div className="text-[10px] text-[#666] mt-1">
              {position.lng > 0 ? "East" : "West"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="osiris-btn text-[10px] flex items-center gap-1">
            <ArrowUpRight size={10} />
            EXTERNAL TRACKER
          </button>
          <button className="osiris-btn text-[10px] flex items-center gap-1">
            <Radio size={10} />
            RADIO FREQ
          </button>
        </div>
      </div>
    </div>
  );
}
