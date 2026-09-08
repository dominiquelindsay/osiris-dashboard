import { useState, useEffect, useRef, useCallback } from "react";
import { generateThreatFeed, getLiveMalwareCount, type ThreatEvent } from "../lib/threat-data";
import { fetchRecentCves, type RealCve } from "../lib/nvd";
import {
  Shield, AlertTriangle, Bug, Target, Skull, Mail, Zap,
  X, ExternalLink, RefreshCw, Radio, ChevronRight,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof Bug> = {
  cve: Bug,
  breach: AlertTriangle,
  attack: Zap,
  malware: Skull,
  phishing: Mail,
  ddos: Target,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-[#ff3333] border-[#ff3333]",
  high: "text-[#ffaa00] border-[#ffaa00]",
  medium: "text-[#ffcc00] border-[#ffcc00]",
  low: "text-[#33ff00] border-[#33ff00]",
};

const FILTERS = ["all", "cve", "malware", "phishing", "ddos", "breach"] as const;

function timeAgo(date: Date): string {
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface ThreatTerminalProps {
  onDefconChange?: (active: boolean) => void;
}

const POLL_MS = 5 * 60 * 1000; // NVD anonymous rate limit is ~5 req / 30 s

export default function ThreatTerminal({ onDefconChange }: ThreatTerminalProps) {
  const [cves, setCves] = useState<RealCve[]>([]);
  const [feedMode, setFeedMode] = useState<"loading" | "live" | "simulated">("loading");
  const [simEvents, setSimEvents] = useState<ThreatEvent[]>([]);
  const [malwareCount, setMalwareCount] = useState(423);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RealCve | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCriticalRef = useRef(0);

  const loadCves = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchRecentCves(48, 40);
      setCves(data);
      setFeedMode("live");
      setLastUpdated(new Date());
    } catch {
      // NVD unreachable / rate-limited → fall back to simulated feed
      setFeedMode((mode) => (mode === "live" ? "live" : "simulated"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial load + 5-minute polling (live mode only)
  useEffect(() => {
    loadCves();
    const poll = setInterval(() => {
      loadCves();
    }, POLL_MS);
    return () => clearInterval(poll);
  }, [loadCves]);

  // Simulated fallback: ticking fake events when NVD is unreachable
  useEffect(() => {
    if (feedMode !== "simulated") return;
    if (simEvents.length === 0) setSimEvents(generateThreatFeed(15));
    const interval = setInterval(() => {
      setSimEvents((prev) => {
        const newEvent = generateThreatFeed(1)[0];
        newEvent.timestamp = new Date();
        return [newEvent, ...prev].slice(0, 50);
      });
      setMalwareCount(getLiveMalwareCount());
    }, 3000);
    return () => clearInterval(interval);
  }, [feedMode, simEvents.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [cves, simEvents]);

  // DEFCON trigger logic
  const criticalCount =
    feedMode === "live"
      ? cves.filter((c) => c.severity === "critical").length
      : simEvents.filter((e) => e.severity === "critical").length;

  useEffect(() => {
    const defconActive = criticalCount > 3;
    if (onDefconChange && criticalCount !== prevCriticalRef.current) {
      prevCriticalRef.current = criticalCount;
      onDefconChange(defconActive);
    }
  }, [criticalCount, onDefconChange]);

  const defconActive = criticalCount > 3;

  const stats =
    feedMode === "live"
      ? {
          critical: cves.filter((c) => c.severity === "critical").length,
          high: cves.filter((c) => c.severity === "high").length,
          medium: cves.filter((c) => c.severity === "medium").length,
          total: cves.length,
          malware: cves.filter((c) => c.kind === "malware").length,
        }
      : {
          critical: simEvents.filter((e) => e.severity === "critical").length,
          high: simEvents.filter((e) => e.severity === "high").length,
          medium: simEvents.filter((e) => e.severity === "medium").length,
          total: simEvents.length,
          malware: malwareCount,
        };

  const filteredCves = filter === "all" ? cves : cves.filter((c) => c.kind === filter);
  const filteredSim = filter === "all" ? simEvents : simEvents.filter((e) => e.type === filter);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className={`osiris-panel p-4 ${defconActive ? "defcon-pulse-border" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className={defconActive ? "text-[#ff3333] animate-pulse" : "text-[#ff3333]"} />
          <div className="flex-1">
            <div className={`text-lg font-bold tracking-wider ${defconActive ? "text-glow-red defcon-strobe" : "text-glow-red"}`}>
              THREAT INTEL TERMINAL
            </div>
            <div className="text-[10px] text-[#666] uppercase tracking-[3px]">Live Cyber Threat Intelligence</div>
          </div>
          {/* Feed source status */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadCves}
              disabled={refreshing}
              className="osiris-btn text-[9px] flex items-center gap-1 disabled:opacity-50"
              title="Refresh NVD feed"
            >
              <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            {feedMode === "live" && (
              <span className="flex items-center gap-1.5 text-[10px] text-[#33ff00]">
                <Radio size={11} className="animate-pulse" />
                NVD LIVE{lastUpdated ? ` · ${timeAgo(lastUpdated)}` : ""}
              </span>
            )}
            {feedMode === "loading" && (
              <span className="text-[10px] text-[#ffcc00] animate-pulse">CONNECTING TO NVD…</span>
            )}
            {feedMode === "simulated" && (
              <span className="flex items-center gap-1.5 text-[10px] text-[#ffaa00]">
                <AlertTriangle size={11} />
                NVD UNREACHABLE — SIMULATED FEED
              </span>
            )}
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
            <div className="text-[10px] text-[#666] uppercase">{feedMode === "live" ? "CVEs (48h)" : "Total"}</div>
            <div className="text-xl font-bold text-glow">{stats.total}</div>
          </div>
          <div className="osiris-panel p-2 text-center threat-pulse">
            <div className="text-[10px] text-[#666] uppercase">Malware</div>
            <div className="text-xl font-bold text-glow-red">{stats.malware}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`osiris-btn text-[10px] uppercase ${filter === f ? "border-[#33ff00] bg-[#33ff00]/10 text-glow" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Selected CVE detail card */}
      {selected && feedMode === "live" && (
        <div className="osiris-panel bg-[#050805]/95 border-[#33ff00]/40">
          <div className="terminal-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bug size={11} className="text-[#33ff00]" />
              VULNERABILITY INTEL · {selected.id}
            </span>
            <button
              onClick={() => setSelected(null)}
              className="text-[#666] hover:text-[#33ff00] transition-colors"
              aria-label="Close"
            >
              <X size={12} />
            </button>
          </div>
          <div className="p-3 text-[11px] space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-glow">{selected.id}</span>
              <span className={`text-[9px] px-1 border uppercase ${SEVERITY_COLORS[selected.severity]}`}>
                {selected.severity}
              </span>
              {selected.score !== null && (
                <span className="text-[10px] text-glow-amber font-bold">CVSS {selected.score.toFixed(1)}</span>
              )}
              <span className="text-[9px] text-[#666] uppercase">{selected.kind}</span>
            </div>
            <p className="text-[#9dcf9d] leading-relaxed">{selected.description}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[#9dcf9d]">
              <span className="text-[#5a7a5a]">Published</span>
              <span className="text-right">{selected.published.toLocaleString()} ({timeAgo(selected.published)})</span>
              <span className="text-[#5a7a5a]">Last Modified</span>
              <span className="text-right">{selected.lastModified.toLocaleString()}</span>
              {selected.vector && (
                <>
                  <span className="text-[#5a7a5a]">CVSS Vector</span>
                  <span className="text-right break-all">{selected.vector}</span>
                </>
              )}
              {selected.weaknesses.length > 0 && (
                <>
                  <span className="text-[#5a7a5a]">Weakness</span>
                  <span className="text-right">{selected.weaknesses.join(", ")}</span>
                </>
              )}
            </div>
            {selected.products.length > 0 && (
              <div>
                <div className="text-[#5a7a5a] uppercase text-[9px] tracking-wider mb-1">Affected Products</div>
                <div className="flex flex-wrap gap-1">
                  {selected.products.map((p) => (
                    <span key={p} className="text-[9px] px-1.5 py-0.5 border border-[#1a331a] text-[#9dcf9d]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selected.references.length > 0 && (
              <div>
                <div className="text-[#5a7a5a] uppercase text-[9px] tracking-wider mb-1">References</div>
                <div className="space-y-0.5">
                  {selected.references.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[10px] text-[#00ccff] hover:text-glow truncate underline decoration-[#00ccff]/30"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <a
              href={selected.nvdUrl}
              target="_blank"
              rel="noreferrer"
              className="osiris-btn text-[10px] inline-flex items-center gap-1 mt-1"
            >
              Open in NVD <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="osiris-panel flex-1 overflow-auto">
        <div className="terminal-header flex items-center gap-2 sticky top-0 z-10 bg-[#050505]">
          <AlertTriangle size={12} className={`${defconActive ? "text-[#ff3333] animate-pulse" : "text-[#ff3333]"}`}
          />
          {feedMode === "live"
            ? "LIVE THREAT FEED · SOURCE: NATIONAL VULNERABILITY DATABASE"
            : feedMode === "loading"
              ? "CONNECTING TO THREAT FEED…"
              : "SIMULATED THREAT FEED (OFFLINE MODE)"}
        </div>

        {/* Live NVD feed */}
        {feedMode === "live" && (
          <div className="p-2 space-y-1">
            {filteredCves.length === 0 && (
              <div className="p-4 text-center text-[#666] text-xs">No entries match this filter.</div>
            )}
            {filteredCves.map((cve) => {
              const Icon = TYPE_ICONS[cve.kind] || Bug;
              const isSelected = selected?.id === cve.id;
              return (
                <button
                  key={cve.id}
                  onClick={() => setSelected(isSelected ? null : cve)}
                  className={`w-full text-left p-2 border-l-2 ${SEVERITY_COLORS[cve.severity]} bg-[#0a0f0a] hover:bg-[#1a1a0a] transition-colors cursor-pointer ${
                    isSelected ? "bg-[#112211] ring-1 ring-[#33ff00]/40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon size={12} />
                      <span className="text-[10px] font-bold text-glow">{cve.id}</span>
                      <span className={`text-[9px] px-1 border ${SEVERITY_COLORS[cve.severity]}`}>
                        {cve.severity}
                      </span>
                      {cve.score !== null && (
                        <span className="text-[9px] text-[#ffaa00]">CVSS {cve.score.toFixed(1)}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[9px] text-[#666]">
                      {timeAgo(cve.published)}
                      <ChevronRight size={10} className={isSelected ? "rotate-90 transition-transform" : "transition-transform"} />
                    </span>
                  </div>
                  <div className="text-xs text-[#9dcf9d] line-clamp-2">{cve.description}</div>
                  <div className="flex items-center gap-3 text-[10px] text-[#666] mt-1">
                    <span>SRC: NVD</span>
                    {cve.products[0] && <span>TGT: {cve.products[0]}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading state */}
        {feedMode === "loading" && (
          <div className="p-8 text-center text-[#666] text-xs animate-pulse">
            Establishing secure uplink to National Vulnerability Database…
          </div>
        )}

        {/* Simulated fallback feed */}
        {feedMode === "simulated" && (
          <div className="p-2 space-y-1">
            {filteredSim.map((event, i) => {
              const Icon = TYPE_ICONS[event.type];
              return (
                <div
                  key={event.id}
                  className={`p-2 border-l-2 ${SEVERITY_COLORS[event.severity]} bg-[#0a0f0a] ${i === 0 ? "animate-pulse" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon size={12} />
                      <span className="text-[10px] uppercase tracking-wider font-bold">{event.type}</span>
                      <span className={`text-[9px] px-1 border ${SEVERITY_COLORS[event.severity]}`}>
                        {event.severity}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#666]">{event.timestamp.toLocaleTimeString()}</span>
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
        )}
      </div>
    </div>
  );
}
