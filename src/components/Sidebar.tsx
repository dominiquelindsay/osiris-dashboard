import { useState } from "react";
import { Satellite, Globe, Shield, Terminal, Crosshair, Eye, Sun, Flame, Route, Mic, MicOff } from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  voiceListening?: boolean;
  onVoiceToggle?: () => void;
  defconActive?: boolean;
}

const MENU_ITEMS = [
  { id: "dashboard", label: "Command", icon: Eye },
  { id: "constellation", label: "Constellation", icon: Satellite },
  { id: "iss", label: "ISS Tracker", icon: Globe },
  { id: "threats", label: "Threat Intel", icon: Shield },
  { id: "redteam", label: "Red Team", icon: Crosshair },
  { id: "spaceweather", label: "Space Wx", icon: Sun },
  { id: "conflicts", label: "Conflict Zones", icon: Flame },
  { id: "migration", label: "Migration Flows", icon: Route },
  { id: "terminal", label: "Terminal", icon: Terminal },
];

export default function Sidebar({ activeView, onViewChange, voiceListening = false, onVoiceToggle, defconActive = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div 
      className={`h-full flex flex-col border-r border-[#1a331a] bg-[#050505] transition-all duration-300 ${collapsed ? "w-14" : "w-56"}`}
    >
      <div className="p-4 border-b border-[#1a331a] flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 32 32" className={`w-7 h-7 ${defconActive ? "text-[#ff3333]" : "text-[#ffcc00]"}`}>
            <path 
              fill="currentColor" 
              d="M16 2C9.373 2 4 7.373 4 14s5.373 12 12 12 12-5.373 12-12S22.627 2 16 2zm0 2c5.514 0 10 4.486 10 10 0 2.5-.92 4.788-2.438 6.563L20 16h-2.5c0-1.5-1-2.5-2.5-2.5S12.5 14.5 12.5 16H10l-3.562 4.563C4.92 18.788 4 16.5 4 14c0-5.514 4.486-10 10-10zm-1 6c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm8 0c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z"
            />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div className={`text-sm font-bold tracking-[4px] ${defconActive ? "text-[#ff3333] defcon-strobe" : "text-[#ffcc00]"} text-glow-amber`}>OSIRIS</div>
            <div className="text-[9px] tracking-[2px] text-[#666] uppercase">Open Source Intel</div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-b border-[#1a331a]">
        <div className="flex items-center gap-2">
          {defconActive ? (
            <span className="status-dot status-danger animate-pulse"></span>
          ) : (
            <span className="status-dot status-online"></span>
          )}
          {!collapsed && (
            <span className={`text-[10px] uppercase tracking-wider ${defconActive ? "text-[#ff3333] defcon-strobe font-bold" : "text-[#666]"}`}>
              {defconActive ? "DEFCON ACTIVE" : "System Online"}
            </span>
          )}
        </div>
      </div>

      {/* Voice command toggle */}
      <div className="px-3 py-2 border-b border-[#1a331a]">
        <button
          onClick={onVoiceToggle}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-[10px] uppercase tracking-wider border rounded transition-all ${
            voiceListening 
              ? "border-[#33ff00] bg-[#33ff00]/10 text-[#33ff00] voice-active" 
              : "border-[#1a331a] text-[#666] hover:border-[#33ff00] hover:text-[#33ff00]"
          }`}
        >
          {voiceListening ? <Mic size={14} /> : <MicOff size={14} />}
          {!collapsed && <span>{voiceListening ? "Listening..." : "Voice Cmd"}</span>}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-auto">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider transition-all border-l-2 ${
                isActive 
                  ? "border-[#33ff00] bg-[#33ff00]/10 text-[#33ff00] text-glow" 
                  : "border-transparent text-[#666] hover:text-[#33ff00] hover:bg-[#33ff00]/5"
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1a331a] space-y-2">
        {!collapsed && (
          <>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#666]">CPU</span>
              <span className="text-[#33ff00]">34%</span>
            </div>
            <div className="w-full h-1 bg-[#1a331a]">
              <div className="h-full bg-[#33ff00] w-[34%]"></div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#666]">MEM</span>
              <span className="text-[#33ff00]">62%</span>
            </div>
            <div className="w-full h-1 bg-[#1a331a]">
              <div className="h-full bg-[#33ff00] w-[62%]"></div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#666]">NET</span>
              <span className="text-[#33ff00]">↑12 ↓45 MB/s</span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 text-[#666] hover:text-[#33ff00] border-t border-[#1a331a] text-center text-[10px] uppercase tracking-wider"
      >
        {collapsed ? ">>" : "<< Collapse"}
      </button>
    </div>
  );
}
