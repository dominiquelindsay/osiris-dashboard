import { useState, useEffect, useCallback } from "react";
import { createCampaign, advanceCampaign, getNodeColor, type AttackCampaign, type AttackNode } from "../lib/red-team";
import { Crosshair, Play, RotateCcw, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function RedTeamSim() {
  const [campaign, setCampaign] = useState<AttackCampaign | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  }, []);

  const startCampaign = useCallback(() => {
    const newCampaign = createCampaign();
    setCampaign(newCampaign);
    setIsRunning(true);
    setLogs([`[${new Date().toLocaleTimeString()}] Campaign '${newCampaign.name}' initialized`]);
  }, []);

  const resetCampaign = useCallback(() => {
    setCampaign(null);
    setIsRunning(false);
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!isRunning || !campaign) return;

    const interval = setInterval(() => {
      setCampaign(prev => {
        if (!prev) return null;
        const advanced = advanceCampaign(prev);
        
        const activeNode = advanced.nodes.find(n => n.status === "active");
        if (activeNode && activeNode.progress < 15) {
          addLog(`[${new Date().toLocaleTimeString()}] Phase initiated: ${activeNode.name}`);
        }
        
        if (advanced.status === "breached") {
          addLog(`[${new Date().toLocaleTimeString()}] ⚠️ BREACH DETECTED - Data exfiltration complete`);
          setIsRunning(false);
        }
        
        return advanced;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, campaign, addLog]);

  const getStatusIcon = (status: AttackNode["status"]) => {
    switch (status) {
      case "complete": return <CheckCircle size={12} className="text-[#33ff00]" />;
      case "active": return <Clock size={12} className="text-[#ffcc00] animate-spin" />;
      case "failed": return <AlertTriangle size={12} className="text-[#ff3333]" />;
      default: return <div className="w-3 h-3 rounded-full border border-[#666]" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="osiris-panel p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crosshair size={20} className="text-[#ff3333]" />
            <div>
              <div className="text-lg font-bold text-glow-red tracking-wider">RED TEAM SIMULATOR</div>
              <div className="text-[10px] text-[#666] uppercase tracking-[3px]">Adversary Simulation Engine</div>
            </div>
          </div>
          <div className="flex gap-2">
            {!campaign ? (
              <button onClick={startCampaign} className="osiris-btn-danger flex items-center gap-2">
                <Play size={12} />
                LAUNCH CAMPAIGN
              </button>
            ) : (
              <button onClick={resetCampaign} className="osiris-btn flex items-center gap-2">
                <RotateCcw size={12} />
                RESET
              </button>
            )}
          </div>
        </div>

        {campaign && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="osiris-panel p-2">
              <div className="text-[10px] text-[#666] uppercase">Campaign</div>
              <div className="text-sm font-bold text-glow-red">{campaign.name}</div>
            </div>
            <div className="osiris-panel p-2">
              <div className="text-[10px] text-[#666] uppercase">Target</div>
              <div className="text-sm font-bold text-glow-amber">{campaign.target}</div>
            </div>
            <div className="osiris-panel p-2">
              <div className="text-[10px] text-[#666] uppercase">Status</div>
              <div className={`text-sm font-bold ${campaign.status === "breached" ? "text-glow-red" : "text-glow"}`}>
                {campaign.status.toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>

      {campaign && (
        <div className="osiris-panel flex-1 p-4">
          <div className="terminal-header mb-4">KILL CHAIN VISUALIZATION</div>
          
          <div className="relative h-full">
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {campaign.nodes.map((node) => 
                node.children.map(childId => {
                  const child = campaign.nodes.find(n => n.id === childId);
                  if (!child) return null;
                  return (
                    <line
                      key={`${node.id}-${childId}`}
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${child.x}%`}
                      y2={`${child.y}%`}
                      stroke={child.status === "complete" || child.status === "active" ? getNodeColor(child.type) : "#333"}
                      strokeWidth="2"
                      strokeDasharray={child.status === "active" ? "5,5" : "none"}
                      className={child.status === "active" ? "animate-pulse" : ""}
                    />
                  );
                })
              )}
            </svg>

            {campaign.nodes.map((node) => (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 2 }}
              >
                <div 
                  className={`osiris-panel p-3 min-w-[120px] text-center transition-all ${
                    node.status === "active" ? "border-[#ffcc00] shadow-lg shadow-[#ffcc00]/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getStatusIcon(node.status)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: getNodeColor(node.type) }}>
                    {node.name}
                  </div>
                  {node.status === "active" && (
                    <div className="mt-1">
                      <div className="w-full h-1 bg-[#1a331a]">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${node.progress}%`,
                            backgroundColor: getNodeColor(node.type)
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-[#666] mt-0.5">{Math.round(node.progress)}%</div>
                    </div>
                  )}
                  {node.status === "complete" && (
                    <div className="text-[9px] text-[#33ff00]">COMPLETE</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {campaign && (
        <div className="osiris-panel h-48 overflow-auto">
          <div className="terminal-header">OPERATION LOG</div>
          <div className="p-2 font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={log.includes("BREACH") ? "text-glow-red" : "text-[#33ff00]/70"}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
