import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CONFLICT_ZONES } from "../lib/conflict-data";
import type { ConflictZone } from "../lib/conflict-data";
import { MIGRATION_ROUTES } from "../lib/migration-data";
import type { MigrationRoute } from "../lib/migration-data";
import { NUCLEAR_FACILITIES, SHIPPING_LANES } from "../lib/infra-data";
import type { NuclearFacility, ShippingLane } from "../lib/infra-data";
import { fetchWildfires, fetchEarthquakes } from "../lib/live-data";
import type { WildfireEvent, QuakeEvent } from "../lib/live-data";
import { getSatellites, propagateSatellite } from "../lib/satellite-data";
import type { SatelliteData } from "../lib/satellite-data";
import {
  X, Camera, Flame, Atom, Activity, Ship, Route as RouteIcon,
  Satellite as SatelliteIcon, AlertTriangle, Map as MapIcon, Mountain,
} from "lucide-react";

interface CctvCam {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  img: string;
  video?: string | null;
}

type Selection =
  | { kind: "cctv"; cam: CctvCam }
  | { kind: "conflict"; zone: ConflictZone }
  | { kind: "nuclear"; site: NuclearFacility }
  | { kind: "fire"; fire: WildfireEvent }
  | { kind: "quake"; quake: QuakeEvent }
  | { kind: "satellite"; sat: SatelliteData }
  | { kind: "lane"; lane: ShippingLane }
  | { kind: "route"; route: MigrationRoute };

type LayerId = "cctv" | "conflicts" | "nuclear" | "fires" | "quakes" | "shipping" | "migration" | "satellites";

const LAYER_DEFS: { id: LayerId; label: string; icon: typeof Camera; color: string }[] = [
  { id: "cctv", label: "CCTV", icon: Camera, color: "#33ff00" },
  { id: "conflicts", label: "Conflicts", icon: AlertTriangle, color: "#ff3333" },
  { id: "nuclear", label: "Nuclear", icon: Atom, color: "#ffcc00" },
  { id: "fires", label: "Wildfires", icon: Flame, color: "#ff6600" },
  { id: "quakes", label: "Quakes", icon: Activity, color: "#00ccff" },
  { id: "shipping", label: "Shipping", icon: Ship, color: "#3399ff" },
  { id: "migration", label: "Migration", icon: RouteIcon, color: "#cc66ff" },
  { id: "satellites", label: "Satellites", icon: SatelliteIcon, color: "#ffcc00" },
];

const TILES = {
  map: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    className: "tiles-dark",
  },
  sat: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
    className: undefined as string | undefined,
  },
};

const CONFLICT_COLORS: Record<string, string> = {
  critical: "#ff2222",
  high: "#ff5533",
  medium: "#ffaa00",
  low: "#ffcc00",
};

function dotIcon(cls: string, size: number): L.DivIcon {
  return L.divIcon({
    className: "osiris-divicon",
    html: `<div class="${cls}" style="width:${size}px;height:${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface IntelMapProps {
  selectedSatellite: number | null;
  onSatelliteSelect: (noradId: number) => void;
}

export default function IntelMap({ selectedSatellite, onSatelliteSelect }: IntelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const groupsRef = useRef<Partial<Record<LayerId, L.LayerGroup>>>({});
  const satMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const livePosRef = useRef<Record<number, { lat: number; lng: number; alt: number }>>({});
  const onSatelliteSelectRef = useRef(onSatelliteSelect);
  onSatelliteSelectRef.current = onSatelliteSelect;

  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    cctv: true,
    conflicts: true,
    nuclear: true,
    fires: true,
    quakes: true,
    shipping: true,
    migration: true,
    satellites: true,
  });
  const [viewMode, setViewMode] = useState<"map" | "sat">("map");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [fires, setFires] = useState<WildfireEvent[]>([]);
  const [quakes, setQuakes] = useState<QuakeEvent[]>([]);
  const [cams, setCams] = useState<CctvCam[]>([]);
  const [feedsLive, setFeedsLive] = useState(false);
  const [camTick, setCamTick] = useState(0);
  const selectRef = useRef(setSelection);
  selectRef.current = setSelection;

  const counts: Record<LayerId, number> = {
    cctv: cams.length,
    conflicts: CONFLICT_ZONES.length,
    nuclear: NUCLEAR_FACILITIES.length,
    fires: fires.length,
    quakes: quakes.length,
    shipping: SHIPPING_LANES.length,
    migration: MIGRATION_ROUTES.length,
    satellites: getSatellites().length,
  };

  // --- Base map (once) ---------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [30, 10],
      zoom: 3,
      minZoom: 2,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
      preferCanvas: true,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    // Debug/testing handle (same pattern as the 3D globe).
    (window as unknown as Record<string, unknown>).__osirisMap = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Tile layer switching ----------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const t = TILES[viewMode];
    tileRef.current = L.tileLayer(t.url, {
      attribution: t.attribution,
      maxZoom: t.maxZoom,
      className: t.className,
    });
    tileRef.current.addTo(map);
  }, [viewMode]);

  // --- Live feeds (EONET + USGS), polled every 5 min ----------------------
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [f, q] = await Promise.all([fetchWildfires(100), fetchEarthquakes()]);
        if (cancelled) return;
        setFires(f);
        setQuakes(q);
        setFeedsLive(true);
      } catch {
        if (!cancelled) setFeedsLive(false);
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // --- Fetch baked CCTV snapshot (served from /public) --------------------
  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}cctv.json`)
      .then((r) => r.json())
      .then((d: CctvCam[]) => {
        if (!cancelled) setCams(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Build static layer groups (once) -----------------------------------
  useEffect(() => {
    const groups: Partial<Record<LayerId, L.LayerGroup>> = {};

    // Conflict zones — pulsing divIcons
    const conflictGroup = L.layerGroup();
    CONFLICT_ZONES.forEach((zone) => {
      const color = CONFLICT_COLORS[zone.intensity] || "#ffaa00";
      const m = L.marker([zone.lat, zone.lng], {
        icon: dotIcon("mk-pulse", 16),
        keyboard: false,
      });
      (m.options as { color?: string }).color = color;
      m.setIcon(
        L.divIcon({
          className: "osiris-divicon",
          html: `<div class="mk-pulse" style="--mk-color:${color}"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        })
      );
      m.on("click", () => selectRef.current({ kind: "conflict", zone }));
      conflictGroup.addLayer(m);
    });
    groups.conflicts = conflictGroup;

    // Nuclear facilities — hazard squares
    const nuclearGroup = L.layerGroup();
    NUCLEAR_FACILITIES.forEach((site) => {
      const m = L.marker([site.lat, site.lng], {
        icon: L.divIcon({
          className: "osiris-divicon",
          html: `<div class="mk-nuke">☢</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        keyboard: false,
      });
      m.on("click", () => selectRef.current({ kind: "nuclear", site }));
      nuclearGroup.addLayer(m);
    });
    groups.nuclear = nuclearGroup;

    // Shipping lanes
    const shippingGroup = L.layerGroup();
    SHIPPING_LANES.forEach((lane) => {
      const line = L.polyline(lane.points, {
        color: "#3399ff",
        weight: 1.5,
        opacity: 0.45,
        dashArray: "6 4",
      });
      line.on("click", () => selectRef.current({ kind: "lane", lane }));
      shippingGroup.addLayer(line);
    });
    groups.shipping = shippingGroup;

    // Migration routes
    const migrationGroup = L.layerGroup();
    MIGRATION_ROUTES.forEach((route) => {
      const line = L.polyline(
        [
          [route.origin.lat, route.origin.lng],
          [route.destination.lat, route.destination.lng],
        ],
        { color: route.color, weight: 2, opacity: 0.6 }
      );
      line.on("click", () => selectRef.current({ kind: "route", route }));
      migrationGroup.addLayer(line);
      [route.origin, route.destination].forEach((p) => {
        const dot = L.circleMarker([p.lat, p.lng], {
          radius: 4,
          color: route.color,
          weight: 1,
          fillColor: route.color,
          fillOpacity: 0.9,
        });
        dot.on("click", () => selectRef.current({ kind: "route", route }));
        migrationGroup.addLayer(dot);
      });
    });
    groups.migration = migrationGroup;

    // Satellites — positions updated by interval below
    const satGroup = L.layerGroup();
    const satMarkers = satMarkersRef.current;
    getSatellites().forEach((sat) => {
      const isISS = sat.name.includes("ISS");
      const m = L.marker([0, 0], {
        icon: L.divIcon({
          className: "osiris-divicon",
          html: `<div class="mk-sat" style="--mk-color:${isISS ? "#ffcc00" : "#33ff00"}"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
        keyboard: false,
      });
      m.on("click", () => {
        selectRef.current({ kind: "satellite", sat });
        onSatelliteSelectRef.current(sat.noradId);
      });
      satMarkers.set(sat.noradId, m);
      satGroup.addLayer(m);
    });
    groups.satellites = satGroup;

    groupsRef.current = { ...groupsRef.current, ...groups };
  }, []);

  // --- Build CCTV layer when snapshot loads (1,800+ cams, canvas renderer) --
  useEffect(() => {
    if (cams.length === 0) return;
    const group = L.layerGroup();
    cams.forEach((cam) => {
      const m = L.circleMarker([cam.lat, cam.lng], {
        radius: 3,
        color: "#33ff00",
        weight: 1,
        fillColor: "#33ff00",
        fillOpacity: 0.75,
      });
      m.on("click", () => selectRef.current({ kind: "cctv", cam }));
      group.addLayer(m);
    });
    groupsRef.current.cctv = group;
  }, [cams]);

  // --- Rebuild fire layer when data arrives --------------------------------
  useEffect(() => {
    const group = L.layerGroup();
    fires.forEach((fire) => {
      const m = L.circleMarker([fire.lat, fire.lng], {
        radius: 4,
        color: "#ff6600",
        weight: 1,
        fillColor: "#ff6600",
        fillOpacity: 0.65,
      });
      m.on("click", () => selectRef.current({ kind: "fire", fire }));
      group.addLayer(m);
    });
    groupsRef.current.fires = group;
  }, [fires]);

  // --- Rebuild quake layer when data arrives -------------------------------
  useEffect(() => {
    const group = L.layerGroup();
    quakes.forEach((quake) => {
      const m = L.circleMarker([quake.lat, quake.lng], {
        radius: Math.min(3 + quake.magnitude, 10),
        color: "#00ccff",
        weight: 1,
        fillColor: "#00ccff",
        fillOpacity: 0.5,
      });
      m.on("click", () => selectRef.current({ kind: "quake", quake }));
      group.addLayer(m);
    });
    groupsRef.current.quakes = group;
  }, [quakes]);

  // --- Sync layer toggles ---------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (Object.keys(groupsRef.current) as LayerId[]).forEach((id) => {
      const group = groupsRef.current[id];
      if (!group) return;
      if (layers[id] && !map.hasLayer(group)) map.addLayer(group);
      if (!layers[id] && map.hasLayer(group)) map.removeLayer(group);
    });
  });

  // --- Satellite live positions --------------------------------------------
  useEffect(() => {
    const update = () => {
      getSatellites().forEach((sat) => {
        const pos = propagateSatellite(sat);
        livePosRef.current[sat.noradId] = pos;
        const marker = satMarkersRef.current.get(sat.noradId);
        if (marker && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)) {
          marker.setLatLng([pos.lat, pos.lng]);
        }
      });
    };
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  // --- Fly to satellite when selected from the side panel -------------------
  useEffect(() => {
    if (selectedSatellite === null || !mapRef.current) return;
    const pos = livePosRef.current[selectedSatellite];
    if (pos) mapRef.current.flyTo([pos.lat, pos.lng], 5, { duration: 1.5 });
  }, [selectedSatellite]);

  // --- Refresh CCTV still image while its card is open -----------------------
  useEffect(() => {
    if (!selection || selection.kind !== "cctv") return;
    const id = setInterval(() => setCamTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, [selection]);

  const toggleLayer = (id: LayerId) => setLayers((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="relative w-full h-full" style={{ minHeight: "400px" }}>
      <div ref={containerRef} className="w-full h-full osiris-leaflet" />

      {/* Layer toggle rail */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1 osiris-panel bg-[#050805]/90 p-1.5">
        {LAYER_DEFS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => toggleLayer(id)}
            title={`${label} (${counts[id]})`}
            className={`relative flex items-center justify-center w-9 h-9 border transition-all ${
              layers[id]
                ? "border-[#33ff00]/60 bg-[#33ff00]/10"
                : "border-[#1a331a] opacity-40 hover:opacity-80"
            }`}
          >
            <Icon size={15} style={{ color }} />
            {layers[id] && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-[#050505] border border-[#1a331a] px-0.5 text-[#33ff00]">
                {counts[id] > 999 ? `${(counts[id] / 1000).toFixed(1)}k` : counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* View mode switch */}
      <div className="absolute left-3 bottom-3 z-[1000] flex gap-1 osiris-panel bg-[#050805]/90 p-1">
        <button
          onClick={() => setViewMode("map")}
          className={`osiris-btn text-[9px] flex items-center gap-1 ${viewMode === "map" ? "border-[#33ff00] bg-[#33ff00]/10 text-glow" : ""}`}
        >
          <MapIcon size={10} /> MAP
        </button>
        <button
          onClick={() => setViewMode("sat")}
          className={`osiris-btn text-[9px] flex items-center gap-1 ${viewMode === "sat" ? "border-[#33ff00] bg-[#33ff00]/10 text-glow" : ""}`}
        >
          <Mountain size={10} /> SAT
        </button>
      </div>

      {/* Feed status + legend */}
      <div className="absolute left-3 top-3 z-[1000] osiris-panel bg-[#050805]/90 px-2 py-1.5 text-[9px] space-y-1">
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${feedsLive ? "status-online" : "status-warning"}`}></span>
          <span className={feedsLive ? "text-[#33ff00]" : "text-[#ffaa00]"}>
            {feedsLive ? "FEEDS: LIVE (NASA EONET · USGS)" : "FEEDS: OFFLINE"}
          </span>
        </div>
        {LAYER_DEFS.filter(({ id }) => layers[id]).map(({ id, label, color }) => (
          <div key={id} className="flex items-center gap-1.5 text-[#888]">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }}></span>
            {label} · {counts[id]}
          </div>
        ))}
      </div>

      {/* Detail card */}
      {selection && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-96 max-w-[90%] osiris-panel bg-[#050805]/95 z-[1100]">
          <div className="terminal-header flex items-center justify-between">
            <span>
              {selection.kind === "cctv" && "CCTV · LIVE TRAFFIC CAMERA"}
              {selection.kind === "conflict" && "CONFLICT ZONE INTEL"}
              {selection.kind === "nuclear" && "NUCLEAR FACILITY INTEL"}
              {selection.kind === "fire" && "WILDFIRE · NASA EONET"}
              {selection.kind === "quake" && "EARTHQUAKE · USGS"}
              {selection.kind === "satellite" && "SATELLITE INTEL"}
              {selection.kind === "lane" && "SHIPPING LANE"}
              {selection.kind === "route" && "MIGRATION ROUTE"}
            </span>
            <button onClick={() => setSelection(null)} className="text-[#666] hover:text-[#33ff00]" aria-label="Close">
              <X size={12} />
            </button>
          </div>
          <div className="p-3 text-[11px] space-y-2 max-h-[60vh] overflow-auto">
            {selection.kind === "cctv" && (
              <>
                <div className="text-sm font-bold text-glow flex items-center gap-2">
                  <span className="status-dot status-online animate-pulse"></span>
                  {selection.cam.name}
                </div>
                <div className="text-[#5a7a5a] text-[10px] uppercase">
                  {selection.cam.city} · {selection.cam.lat.toFixed(4)}, {selection.cam.lng.toFixed(4)}
                </div>
                <div className="border border-[#1a331a] bg-black">
                  <img
                    key={camTick}
                    src={`${selection.cam.img}${selection.cam.img.includes("?") ? "&" : "?"}t=${camTick}`}
                    alt={selection.cam.name}
                    className="w-full"
                  />
                </div>
                {selection.cam.video && (
                  <video
                    key={`v-${selection.cam.id}`}
                    src={selection.cam.video}
                    controls
                    autoPlay
                    muted
                    className="w-full border border-[#1a331a] bg-black"
                  />
                )}
                <div className="text-[9px] text-[#3a5a3a] uppercase tracking-widest">
                  ● Live still refresh · 5s
                </div>
              </>
            )}
            {selection.kind === "conflict" && (
              <>
                <div className="text-sm font-bold text-glow-red">{selection.zone.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#d0a0a0]">
                  <span className="text-[#7a5a5a]">Country</span><span className="text-right">{selection.zone.country}</span>
                  <span className="text-[#7a5a5a]">Type</span><span className="text-right">{selection.zone.type}</span>
                  <span className="text-[#7a5a5a]">Intensity</span><span className="text-right uppercase text-glow-red">{selection.zone.intensity}</span>
                  <span className="text-[#7a5a5a]">Status</span><span className="text-right">{selection.zone.status}</span>
                  <span className="text-[#7a5a5a]">Casualties</span><span className="text-right">{selection.zone.casualties}</span>
                  <span className="text-[#7a5a5a]">Since</span><span className="text-right">{selection.zone.since}</span>
                </div>
              </>
            )}
            {selection.kind === "nuclear" && (
              <>
                <div className="text-sm font-bold text-glow-amber">☢ {selection.site.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#c9c79d]">
                  <span className="text-[#7a7a5a]">Country</span><span className="text-right">{selection.site.country}</span>
                  <span className="text-[#7a7a5a]">Type</span><span className="text-right">{selection.site.type}</span>
                  <span className="text-[#7a7a5a]">Status</span><span className="text-right">{selection.site.status}</span>
                  {selection.site.reactors && (
                    <>
                      <span className="text-[#7a7a5a]">Reactors</span><span className="text-right">{selection.site.reactors}</span>
                    </>
                  )}
                </div>
              </>
            )}
            {selection.kind === "fire" && (
              <>
                <div className="text-sm font-bold" style={{ color: "#ff6600" }}>{selection.fire.title}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#d0b090]">
                  <span className="text-[#7a6a5a]">Detected</span><span className="text-right">{selection.fire.date.toLocaleString()}</span>
                  <span className="text-[#7a6a5a]">Coordinates</span><span className="text-right">{selection.fire.lat.toFixed(3)}, {selection.fire.lng.toFixed(3)}</span>
                  <span className="text-[#7a6a5a]">Source</span><span className="text-right">NASA EONET</span>
                </div>
                {selection.fire.sourceUrl && (
                  <a href={selection.fire.sourceUrl} target="_blank" rel="noreferrer" className="text-[#00ccff] underline decoration-[#00ccff]/30 text-[10px]">
                    Instrument source ↗
                  </a>
                )}
              </>
            )}
            {selection.kind === "quake" && (
              <>
                <div className="text-sm font-bold text-[#00ccff]">{selection.quake.title}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#9dcfcf]">
                  <span className="text-[#5a7a7a]">Magnitude</span><span className="text-right font-bold">M {selection.quake.magnitude.toFixed(1)}</span>
                  <span className="text-[#5a7a7a]">Depth</span><span className="text-right">{selection.quake.depthKm.toFixed(1)} km</span>
                  <span className="text-[#5a7a7a]">Time</span><span className="text-right">{selection.quake.time.toLocaleString()}</span>
                </div>
                <a href={selection.quake.usgsUrl} target="_blank" rel="noreferrer" className="text-[#00ccff] underline decoration-[#00ccff]/30 text-[10px]">
                  USGS event page ↗
                </a>
              </>
            )}
            {selection.kind === "satellite" && (
              <>
                <div className="text-sm font-bold text-glow">{selection.sat.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#9dcf9d]">
                  <span className="text-[#5a7a5a]">NORAD</span><span className="text-right">{selection.sat.noradId}</span>
                  <span className="text-[#5a7a5a]">Type</span><span className="text-right">{selection.sat.type}</span>
                  <span className="text-[#5a7a5a]">Position</span>
                  <span className="text-right text-glow">
                    {livePosRef.current[selection.sat.noradId]
                      ? `${livePosRef.current[selection.sat.noradId].lat.toFixed(2)}°, ${livePosRef.current[selection.sat.noradId].lng.toFixed(2)}°`
                      : "acquiring…"}
                  </span>
                  <span className="text-[#5a7a5a]">Altitude</span>
                  <span className="text-right">
                    {livePosRef.current[selection.sat.noradId]
                      ? `${Math.round(livePosRef.current[selection.sat.noradId].alt)} km`
                      : `${selection.sat.altitude} km`}
                  </span>
                </div>
              </>
            )}
            {selection.kind === "lane" && (
              <>
                <div className="text-sm font-bold text-[#3399ff]">{selection.lane.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#9db8cf]">
                  <span className="text-[#5a6a7a]">Traffic Volume</span><span className="text-right">{selection.lane.volume}</span>
                </div>
              </>
            )}
            {selection.kind === "route" && (
              <>
                <div className="text-sm font-bold" style={{ color: selection.route.color }}>{selection.route.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#c39dcf]">
                  <span className="text-[#6a5a7a]">Origin</span><span className="text-right">{selection.route.origin.name}</span>
                  <span className="text-[#6a5a7a]">Destination</span><span className="text-right">{selection.route.destination.name}</span>
                  <span className="text-[#6a5a7a]">Annual Volume</span><span className="text-right">{selection.route.volume}</span>
                  <span className="text-[#6a5a7a]">Type</span><span className="text-right">{selection.route.type}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
