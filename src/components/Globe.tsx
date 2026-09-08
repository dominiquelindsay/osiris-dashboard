import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getSatellites, propagateSatellite } from "../lib/satellite-data";
import type { SatelliteData } from "../lib/satellite-data";
import { CONFLICT_ZONES } from "../lib/conflict-data";
import type { ConflictZone } from "../lib/conflict-data";
import { MIGRATION_ROUTES } from "../lib/migration-data";
import type { MigrationRoute } from "../lib/migration-data";
import { X, Satellite as SatelliteIcon, Flame, Route as RouteIcon } from "lucide-react";

interface GlobeProps {
  selectedSatellite: number | null;
  onSatelliteSelect: (noradId: number) => void;
  showConflicts?: boolean;
  showMigration?: boolean;
}

type Selection =
  | { kind: "satellite"; sat: SatelliteData }
  | { kind: "conflict"; zone: ConflictZone }
  | { kind: "route"; route: MigrationRoute };

const INTENSITY_COLORS: Record<string, number> = {
  critical: 0xff2222,
  high: 0xff5533,
  medium: 0xffaa00,
  low: 0xffcc00,
};

const INTENSITY_SIZES: Record<string, number> = {
  critical: 0.045,
  high: 0.038,
  medium: 0.032,
  low: 0.026,
};

function latLngToVector3(lat: number, lng: number, radius: number = 1): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.cos(lngRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.sin(lngRad)
  );
}

function createArcPoints(start: THREE.Vector3, end: THREE.Vector3, segments: number = 60): THREE.Vector3[] {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).normalize().multiplyScalar(1.35);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(segments);
}

/** Fallback procedural texture if the remote earth texture can't load. */
function buildFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0a1628";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = "#1a3320";
  ctx.beginPath(); ctx.ellipse(200, 180, 80, 60, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(280, 340, 50, 90, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(520, 160, 40, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(540, 280, 60, 80, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(700, 180, 120, 70, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(800, 380, 50, 35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(51, 255, 0, 0.1)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 360; i += 30) {
    ctx.beginPath();
    ctx.moveTo((i * 1024) / 360, 0);
    ctx.lineTo((i * 1024) / 360, 512);
    ctx.stroke();
  }
  for (let i = -90; i <= 90; i += 30) {
    ctx.beginPath();
    ctx.moveTo(0, ((90 - i) * 512) / 180);
    ctx.lineTo(1024, ((90 - i) * 512) / 180);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

export default function Globe({
  selectedSatellite,
  onSatelliteSelect,
  showConflicts = true,
  showMigration = true,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  // Latest propagated positions, keyed by NORAD id — read by the popup.
  const livePosRef = useRef<Record<number, { lat: number; lng: number; alt: number }>>({});
  // Bridges so the Three.js effect can call React state without stale closures.
  const selectRef = useRef<(sel: Selection | null) => void>(() => {});
  const onSatelliteSelectRef = useRef(onSatelliteSelect);
  const selectedNoradRef = useRef<number | null>(selectedSatellite);
  const [, setTick] = useState(0);

  selectRef.current = setSelection;
  onSatelliteSelectRef.current = onSatelliteSelect;
  selectedNoradRef.current = selectedSatellite;

  // Refresh the popup's live coordinates while a satellite card is open.
  useEffect(() => {
    if (!selection || selection.kind !== "satellite") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, [selection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // --- Renderer / scene / camera -------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.6, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Controls: drag to rotate, scroll to zoom, auto-rotate ---------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.9;
    controls.minDistance = 1.6;
    controls.maxDistance = 8;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    let resumeTimer: number | null = null;
    const onControlStart = () => {
      controls.autoRotate = false;
      if (resumeTimer !== null) window.clearTimeout(resumeTimer);
    };
    const onControlEnd = () => {
      if (resumeTimer !== null) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        controls.autoRotate = true;
      }, 3000);
    };
    controls.addEventListener("start", onControlStart);
    controls.addEventListener("end", onControlEnd);

    // --- Globe with real earth texture (canvas fallback) ---------------
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: buildFallbackTexture(),
      emissive: 0x0a1a0a,
      emissiveIntensity: 0.35,
      specular: 0x223322,
      shininess: 6,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), globeMaterial);
    scene.add(globe);

    const texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = "anonymous";
    texLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-dark.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        globeMaterial.map = tex;
        globeMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        /* keep fallback texture */
      }
    );

    // Atmosphere glow
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.06, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x33ff00, transparent: true, opacity: 0.05, side: THREE.BackSide })
    );
    scene.add(atmosphere);

    // Faint wireframe grid
    const wireframe = new THREE.Mesh(
      new THREE.SphereGeometry(1.015, 36, 24),
      new THREE.MeshBasicMaterial({ color: 0x33ff00, transparent: true, opacity: 0.04, wireframe: true })
    );
    scene.add(wireframe);

    // Stars
    const starPositions = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const r = 20 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xaaccaa, size: 0.06 })));

    // --- Satellites -----------------------------------------------------
    const satellites = getSatellites();
    const satByNorad = new Map(satellites.map((s) => [s.noradId, s]));
    const satPositions = new Float32Array(satellites.length * 3);
    const satColors = new Float32Array(satellites.length * 3);
    satellites.forEach((sat, i) => {
      const isISS = sat.name.includes("ISS");
      satColors[i * 3] = isISS ? 1 : 0.25;
      satColors[i * 3 + 1] = isISS ? 0.8 : 1;
      satColors[i * 3 + 2] = 0;
    });
    const satGeometry = new THREE.BufferGeometry();
    satGeometry.setAttribute("position", new THREE.BufferAttribute(satPositions, 3));
    satGeometry.setAttribute("color", new THREE.BufferAttribute(satColors, 3));
    const satPoints = new THREE.Points(
      satGeometry,
      new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true })
    );
    scene.add(satPoints);

    // Orbit rings
    satellites.forEach((sat) => {
      const orbitPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const r = 1 + sat.altitude / 6371;
        orbitPoints.push(
          new THREE.Vector3(
            r * Math.cos(angle) * Math.cos((sat.latitude * Math.PI) / 180),
            r * Math.sin((sat.latitude * Math.PI) / 180),
            r * Math.sin(angle) * Math.cos((sat.latitude * Math.PI) / 180)
          )
        );
      }
      const orbit = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitPoints),
        new THREE.LineBasicMaterial({
          color: sat.name.includes("ISS") ? 0xffcc00 : 0x33ff00,
          transparent: true,
          opacity: 0.12,
        })
      );
      scene.add(orbit);
    });

    // Selection highlight ring (tracks the chosen satellite)
    const highlight = new THREE.Mesh(
      new THREE.RingGeometry(0.07, 0.09, 32),
      new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    highlight.visible = false;
    scene.add(highlight);

    // --- Pickable markers ------------------------------------------------
    const pickTargets: THREE.Object3D[] = [satPoints];

    // Conflict zones
    const conflictMeshes: THREE.Mesh[] = [];
    if (showConflicts) {
      CONFLICT_ZONES.forEach((zone) => {
        const pos = latLngToVector3(zone.lat, zone.lng, 1.02);
        const size = INTENSITY_SIZES[zone.intensity] || 0.02;
        const color = INTENSITY_COLORS[zone.intensity] || 0xffaa00;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 10, 10),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
        );
        mesh.position.copy(pos);
        mesh.userData = { kind: "conflict", zone };
        scene.add(mesh);
        conflictMeshes.push(mesh);
        pickTargets.push(mesh);
      });
    }

    // Migration routes
    const migrationDots: THREE.Mesh[] = [];
    const migrationPaths: THREE.Vector3[][] = [];
    if (showMigration) {
      MIGRATION_ROUTES.forEach((route) => {
        const start = latLngToVector3(route.origin.lat, route.origin.lng, 1.02);
        const end = latLngToVector3(route.destination.lat, route.destination.lng, 1.02);
        const arcPoints = createArcPoints(start, end);
        migrationPaths.push(arcPoints);

        const color = parseInt(route.color.replace("#", "0x"), 16);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(arcPoints),
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })
        );
        scene.add(line);

        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.016, 6, 6),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
        );
        dot.position.copy(arcPoints[0]);
        scene.add(dot);
        migrationDots.push(dot);

        // Clickable endpoint markers
        [start, end].forEach((p) => {
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.028, 8, 8),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
          );
          marker.position.copy(p);
          marker.userData = { kind: "route", route };
          scene.add(marker);
          pickTargets.push(marker);
        });
      });
    }

    // --- Lights -----------------------------------------------------------
    scene.add(new THREE.AmbientLight(0x607060, 1.1));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // --- Picking (click select + hover cursor) ---------------------------
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.07 };
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let dragged = false;
    let lastHover = 0;

    const setPointerFromEvent = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pick = (e: PointerEvent): THREE.Intersection | null => {
      setPointerFromEvent(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickTargets, false);
      return hits.length > 0 ? hits[0] : null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      dragged = false;
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) dragged = true;
      const now = performance.now();
      if (now - lastHover < 90) return;
      lastHover = now;
      container.style.cursor = pick(e) ? "pointer" : "grab";
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (dragged) return; // it was a rotate drag, not a click
      const hit = pick(e);
      if (!hit) {
        selectRef.current(null);
        return;
      }
      const obj = hit.object;
      if (obj === satPoints && hit.index !== undefined) {
        const sat = satellites[hit.index];
        if (sat) {
          selectRef.current({ kind: "satellite", sat });
          onSatelliteSelectRef.current(sat.noradId);
        }
        return;
      }
      const data = obj.userData as { kind?: string; zone?: ConflictZone; route?: MigrationRoute };
      if (data.kind === "conflict" && data.zone) {
        selectRef.current({ kind: "conflict", zone: data.zone });
      } else if (data.kind === "route" && data.route) {
        selectRef.current({ kind: "route", route: data.route });
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    // Debug/testing handle: lets E2E checks aim synthetic clicks at live objects.
    (window as unknown as Record<string, unknown>).__osirisGlobe = {
      camera,
      controls,
      conflictMeshes,
      satPoints,
      satellites,
      renderer,
      pickTargets,
    };

    // --- Resize -----------------------------------------------------------
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // --- Animation loop ---------------------------------------------------
    let animationId = 0;
    const animate = () => {
      const time = Date.now() * 0.001;

      // Propagate satellites to live positions
      satellites.forEach((sat, i) => {
        const pos = propagateSatellite(sat);
        livePosRef.current[sat.noradId] = pos;
        const lat = (pos.lat * Math.PI) / 180;
        const lng = (pos.lng * Math.PI) / 180;
        const r = 1 + pos.alt / 6371;
        const x = r * Math.cos(lat) * Math.cos(lng);
        const y = r * Math.sin(lat);
        const z = r * Math.cos(lat) * Math.sin(lng);
        // Guard: never let a non-finite vertex poison the points geometry.
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
        satPositions[i * 3] = x;
        satPositions[i * 3 + 1] = y;
        satPositions[i * 3 + 2] = z;
      });
      satGeometry.attributes.position.needsUpdate = true;

      // Selection highlight ring
      const selId = selectedNoradRef.current;
      if (selId !== null && satByNorad.has(selId)) {
        const idx = satellites.indexOf(satByNorad.get(selId)!);
        highlight.visible = true;
        highlight.position.set(satPositions[idx * 3], satPositions[idx * 3 + 1], satPositions[idx * 3 + 2]);
        highlight.lookAt(highlight.position.clone().multiplyScalar(2));
        const s = 1 + 0.15 * Math.sin(time * 4);
        highlight.scale.setScalar(s);
      } else {
        highlight.visible = false;
      }

      // Pulse conflict markers
      conflictMeshes.forEach((mesh, i) => {
        mesh.scale.setScalar(1 + 0.3 * Math.sin(time * 3 + i * 0.8));
      });

      // Animate migration dots along their arcs
      migrationDots.forEach((dot, i) => {
        const path = migrationPaths[i];
        if (!path || path.length === 0) return;
        const speed = 0.0008 + (i % 5) * 0.0002;
        const progress = (time * speed * 60) % 1;
        const idx = Math.floor(progress * (path.length - 1));
        const nextIdx = Math.min(idx + 1, path.length - 1);
        const localProgress = progress * (path.length - 1) - idx;
        dot.position.lerpVectors(path[idx], path[nextIdx], localProgress);
      });

      controls.update();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // --- Cleanup ------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationId);
      if (resumeTimer !== null) window.clearTimeout(resumeTimer);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          const mat = obj.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [showConflicts, showMigration]);

  const liveSat =
    selection?.kind === "satellite" ? livePosRef.current[selection.sat.noradId] : undefined;

  return (
    <div className="relative w-full h-full" style={{ minHeight: "400px" }}>
      <div ref={containerRef} className="w-full h-full cursor-grab" />

      {/* Interaction hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-[9px] text-[#3a5a3a] uppercase tracking-[3px]">
          Drag to rotate · Scroll to zoom · Click objects for intel
        </span>
      </div>

      {/* Detail card */}
      {selection && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-80 osiris-panel bg-[#050805]/95 z-20">
          <div className="terminal-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              {selection.kind === "satellite" && <SatelliteIcon size={11} className="text-[#33ff00]" />}
              {selection.kind === "conflict" && <Flame size={11} className="text-[#ff3333]" />}
              {selection.kind === "route" && <RouteIcon size={11} className="text-[#33ff00]" />}
              {selection.kind === "satellite" && "SATELLITE INTEL"}
              {selection.kind === "conflict" && "CONFLICT ZONE INTEL"}
              {selection.kind === "route" && "MIGRATION ROUTE INTEL"}
            </span>
            <button
              onClick={() => setSelection(null)}
              className="text-[#666] hover:text-[#33ff00] transition-colors"
              aria-label="Close"
            >
              <X size={12} />
            </button>
          </div>
          <div className="p-3 text-[11px] space-y-1.5">
            {selection.kind === "satellite" && (
              <>
                <div className="text-sm font-bold text-glow flex items-center gap-2">
                  <span className="status-dot status-online animate-pulse"></span>
                  {selection.sat.name}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#9dcf9d]">
                  <span className="text-[#5a7a5a]">NORAD ID</span>
                  <span className="text-right">{selection.sat.noradId}</span>
                  <span className="text-[#5a7a5a]">Type</span>
                  <span className="text-right">{selection.sat.type}</span>
                  <span className="text-[#5a7a5a]">Orbit</span>
                  <span className="text-right">{selection.sat.orbitType}</span>
                  <span className="text-[#5a7a5a]">Altitude</span>
                  <span className="text-right text-glow">
                    {liveSat ? `${Math.round(liveSat.alt)} km` : `${selection.sat.altitude} km`}
                  </span>
                  <span className="text-[#5a7a5a]">Velocity</span>
                  <span className="text-right">{selection.sat.velocity} km/s</span>
                  <span className="text-[#5a7a5a]">Position</span>
                  <span className="text-right text-glow">
                    {liveSat ? `${liveSat.lat.toFixed(2)}°, ${liveSat.lng.toFixed(2)}°` : "acquiring…"}
                  </span>
                  <span className="text-[#5a7a5a]">Period</span>
                  <span className="text-right">{selection.sat.period} min</span>
                </div>
                <div className="pt-1 text-[9px] text-[#3a5a3a] uppercase tracking-widest">
                  ● Live SGP4 tracking
                </div>
              </>
            )}
            {selection.kind === "conflict" && (
              <>
                <div className="text-sm font-bold text-glow-red">{selection.zone.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#d0a0a0]">
                  <span className="text-[#7a5a5a]">Country</span>
                  <span className="text-right">{selection.zone.country}</span>
                  <span className="text-[#7a5a5a]">Type</span>
                  <span className="text-right">{selection.zone.type}</span>
                  <span className="text-[#7a5a5a]">Intensity</span>
                  <span className="text-right uppercase text-glow-red">{selection.zone.intensity}</span>
                  <span className="text-[#7a5a5a]">Status</span>
                  <span className="text-right">{selection.zone.status}</span>
                  <span className="text-[#7a5a5a]">Casualties</span>
                  <span className="text-right">{selection.zone.casualties}</span>
                  <span className="text-[#7a5a5a]">Since</span>
                  <span className="text-right">{selection.zone.since}</span>
                </div>
              </>
            )}
            {selection.kind === "route" && (
              <>
                <div className="text-sm font-bold text-glow">{selection.route.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#9dcf9d]">
                  <span className="text-[#5a7a5a]">Origin</span>
                  <span className="text-right">{selection.route.origin.name}</span>
                  <span className="text-[#5a7a5a]">Destination</span>
                  <span className="text-right">{selection.route.destination.name}</span>
                  <span className="text-[#5a7a5a]">Annual Volume</span>
                  <span className="text-right text-glow">{selection.route.volume}</span>
                  <span className="text-[#5a7a5a]">Type</span>
                  <span className="text-right">{selection.route.type}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
