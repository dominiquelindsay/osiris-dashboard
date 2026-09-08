import { useState, useEffect, useRef } from "react";
import { generateThreatFeed, getLiveMalwareCount, type ThreatEvent } from "../lib/threat-data";
import { Shield, AlertTriangle, Bug, Target, Skull, Mail, Zap } from "lucide-react";

const TYPE_ICONS = {
  cve: Bug,
  breach: AlertTriangle,
  attack: Zap,
  malware: Skull,
  phishing: Mail,
  ddos: Target,
};

const SEVERITY_COLORS = {
  critical: "text-[#ff3333] border-[#ff3333]",
  high: "text-[#ffaa00] border-[#ffaa00]",
  medium: "text-[#ffcc00] border-[#ffcc00]",
  low: "text-[#33ff00] border-[#33ff00]",
};

interface ThreatTerminalProps {
  onDefconChange?: (active: boolean) => void;
}

export default function ThreatTerminal({ onDefconChange }: ThreatTerminalProps) {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [malwareCount, setMalwareCount] = useState(423);
  const [filter, setFilter] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCriticalRef = useRef(0);

  useEffect(() => {
    setEvents(generateThreatFeed(15));
    
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvent = generateThreatFeed(1)[0];
        newEvent.timestamp = new Date();
        const updated = [newEvent, ...prev].slice(0, 50);
        return updated;
      });
      setMalwareCount(getLiveMalwareCount());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  // DEFCON trigger logic
  useEffect(() => {
    const criticalCount = events.filter(e => e.severity === "critical").length;
    const defconActive = criticalCount > 3;
    if (onDefconChange && criticalCount !== prevCriticalRef.current) {
      prevCriticalRef.current = criticalCount;
      onDefconChange(defconActive);
    }
  }, [events, onDefconChange]);

  const filteredEvents = filter === "all" ? events : events.filter(e => e.type === filter);
  
  const stats = {
    critical: events.filter(e => e.severity === "critical").length,
    high: events.filter(e => e.severity === "high").length,
    medium: events.filter(e => e.severity === "medium").length,
    total: events.length,
  };

  const defconActive = stats.critical > 3;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className={`osiris-panel p-4 ${defconActive ? "defcon-pulse-border" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className={defconActive ? "text-[#ff3333] animate-pulse" : "text-[#ff3333]"} />
          <div>
            <div className={`text-lg font-bold tracking-wider ${defconActive ? "text-glow-red defcon-strobe" : "text-glow-red"}`}>THREAT INTEL TERMINAL</div>
            <div className="text-[10px] text-[#666] uppercase tracking-[3px]">Live Cyber Threat Intelligence</div>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          <div className={`osiris-panel p-2 text-center ${defconActive && stats.critical > 0 ? "defcon-pulse-border" : ""}`}>
            <div className="text-[10px] text-[#666] uppercase">Critical</div>
            <div className={`text-xl font-bold ${defconActive ? "text-glow-red defcon-strobe" : "text-glow-red"}`}>{stats.critical}</div>
          </div>
          <div className="osiris-panel p-2 text-center">
            <div className="text-[10px] text-[#666] uppercase">High</div>
            <div className="text-xl font-bold text-glow-amber">{stats.high}</div>
          </div>
          <div className="osiris-panel p-2 text-center">
            <div className="text-[10px] text-[#666] uppercase">Medium</div>
            <div className="text-xl font-bold text-glow">{stats.medium}</div>
          </div>
          <div className="osiris-panel p-2 text-center">
            <div className="text-[10px] text-[#666] uppercase">Total</div>
            <div className="text-xl font-bold text-glow">{stats.total}</div>
          </div>
          <div className="osiris-panel p-2 text-center threat-pulse">
            <div className="text-[10px] text-[#666] uppercase">Live Malware</div>
            <div className="text-xl font-bold text-glow-red">{malwareCount}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "cve", "attack", "malware", "phishing", "ddos"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`osiris-btn text-[10px] uppercase ${filter === f ? "border-[#33ff00] bg-[#33ff00]/10 text-glow" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="osiris-panel flex-1 overflow-auto">
        <div className="terminal-header flex items-center gap-2">
          <AlertTriangle size={12} className={`${defconActive ? "text-[#ff3333] animate-pulse" : "text-[#ff3333]"}`} />
          LIVE THREAT FEED
        </div>
        <div className="p-2 space-y-1">
          {filteredEvents.map((event, i) => {
            const Icon = TYPE_ICONS[event.type];
            return (
              <div 
                key={event.id} 
                className={`p-2 border-l-2 ${SEVERITY_COLORS[event.severity]} bg-[#0a0f0a] hover:bg-[#1a1a0a] transition-colors ${i === 0 ? "animate-pulse" : ""}`}
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
                  <span>SRC: {event.source}</span>
                  <span>TGT: {event.target}</span>
                  {event.location && <span>LOC: {event.location}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
