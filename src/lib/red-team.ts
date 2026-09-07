export interface AttackNode {
  id: string;
  name: string;
  type: "recon" | "weaponize" | "deliver" | "exploit" | "install" | "c2" | "action";
  status: "pending" | "active" | "complete" | "failed";
  progress: number;
  x: number;
  y: number;
  children: string[];
  parent: string | null;
}

export interface AttackCampaign {
  id: string;
  name: string;
  target: string;
  status: "planning" | "executing" | "breached" | "completed" | "detected";
  nodes: AttackNode[];
  startTime: Date;
  currentPhase: number;
}

const CAMPAIGN_NAMES = [
  "Operation Stellar Horizon",
  "Project Shadow Veil",
  "Mission Crimson Tide",
  "Campaign Phantom Signal",
  "Operation Ghost Protocol",
];

const TARGETS = [
  "SecureSat Uplink",
  "Ground Control Station",
  "Telemetry Array",
  "Payload Operations",
  "Mission Control Network",
];

export function createCampaign(): AttackCampaign {
  const id = `CAMPAIGN-${Math.floor(Math.random() * 10000)}`;
  const name = CAMPAIGN_NAMES[Math.floor(Math.random() * CAMPAIGN_NAMES.length)];
  const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
  
  const nodes: AttackNode[] = [
    { id: `${id}-recon`, name: "Reconnaissance", type: "recon", status: "pending", progress: 0, x: 50, y: 10, children: [`${id}-weaponize`], parent: null },
    { id: `${id}-weaponize`, name: "Weaponization", type: "weaponize", status: "pending", progress: 0, x: 50, y: 25, children: [`${id}-deliver`], parent: `${id}-recon` },
    { id: `${id}-deliver`, name: "Delivery", type: "deliver", status: "pending", progress: 0, x: 50, y: 40, children: [`${id}-exploit`], parent: `${id}-weaponize` },
    { id: `${id}-exploit`, name: "Exploitation", type: "exploit", status: "pending", progress: 0, x: 30, y: 55, children: [`${id}-install`], parent: `${id}-deliver` },
    { id: `${id}-install`, name: "Installation", type: "install", status: "pending", progress: 0, x: 30, y: 70, children: [`${id}-c2`], parent: `${id}-exploit` },
    { id: `${id}-c2`, name: "C2 Beacon", type: "c2", status: "pending", progress: 0, x: 70, y: 70, children: [`${id}-action`], parent: `${id}-install` },
    { id: `${id}-action`, name: "Data Exfil", type: "action", status: "pending", progress: 0, x: 70, y: 85, children: [], parent: `${id}-c2` },
  ];

  return {
    id,
    name,
    target,
    status: "planning",
    nodes,
    startTime: new Date(),
    currentPhase: 0,
  };
}

export function advanceCampaign(campaign: AttackCampaign): AttackCampaign {
  const newCampaign = { ...campaign, nodes: [...campaign.nodes] };
  const activeNodeIndex = newCampaign.nodes.findIndex(n => n.status === "active");
  
  if (activeNodeIndex >= 0) {
    const node = { ...newCampaign.nodes[activeNodeIndex] };
    node.progress += Math.random() * 15 + 5;
    
    if (node.progress >= 100) {
      node.progress = 100;
      node.status = "complete";
      
      const nextNodeId = node.children[0];
      if (nextNodeId) {
        const nextIndex = newCampaign.nodes.findIndex(n => n.id === nextNodeId);
        if (nextIndex >= 0) {
          newCampaign.nodes[nextIndex] = { ...newCampaign.nodes[nextIndex], status: "active", progress: 0 };
        }
      } else {
        newCampaign.status = "breached";
      }
      newCampaign.currentPhase++;
    }
    
    newCampaign.nodes[activeNodeIndex] = node;
  } else {
    newCampaign.nodes[0] = { ...newCampaign.nodes[0], status: "active", progress: 0 };
    newCampaign.status = "executing";
  }
  
  return newCampaign;
}

export function getNodeColor(type: AttackNode["type"]): string {
  switch (type) {
    case "recon": return "#00ccff";
    case "weaponize": return "#ffaa00";
    case "deliver": return "#ff6600";
    case "exploit": return "#ff3333";
    case "install": return "#ff0066";
    case "c2": return "#cc00ff";
    case "action": return "#ff0000";
    default: return "#33ff00";
  }
}
