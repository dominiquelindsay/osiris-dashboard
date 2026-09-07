import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { getSatellites, propagateSatellite } from "../lib/satellite-data";

interface GlobeProps {
  selectedSatellite: number | null;
  onSatelliteSelect: (noradId: number) => void;
}

export default function Globe({ selectedSatellite: _selectedSatellite, onSatelliteSelect: _onSatelliteSelect }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    globe: THREE.Mesh;
    satellites: THREE.Points;
    orbits: THREE.Line[];
    animationId: number;
  } | null>(null);

  const init = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    
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
      ctx.moveTo(i * 1024 / 360, 0);
      ctx.lineTo(i * 1024 / 360, 512);
      ctx.stroke();
    }
    for (let i = -90; i <= 90; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, (90 - i) * 512 / 180);
      ctx.lineTo(1024, (90 - i) * 512 / 180);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      emissive: 0x001100,
      emissiveIntensity: 0.2,
      specular: 0x111111,
      shininess: 10,
    });
    
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x33ff00,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    const wireframeGeometry = new THREE.SphereGeometry(1.02, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x33ff00,
      transparent: true,
      opacity: 0.03,
      wireframe: true,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const r = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const satellites = getSatellites();
    const satPositions = new Float32Array(satellites.length * 3);
    const satColors = new Float32Array(satellites.length * 3);
    
    satellites.forEach((sat, i) => {
      satColors[i * 3] = sat.name.includes("ISS") ? 1 : 0.2;
      satColors[i * 3 + 1] = sat.name.includes("ISS") ? 0.8 : 1;
      satColors[i * 3 + 2] = 0;
    });

    const satGeometry = new THREE.BufferGeometry();
    satGeometry.setAttribute("position", new THREE.BufferAttribute(satPositions, 3));
    satGeometry.setAttribute("color", new THREE.BufferAttribute(satColors, 3));
    
    const satMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    
    const satPoints = new THREE.Points(satGeometry, satMaterial);
    scene.add(satPoints);

    const orbits: THREE.Line[] = [];
    satellites.forEach((sat) => {
      const orbitPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const r = 1 + sat.altitude / 6371;
        const x = r * Math.cos(angle) * Math.cos(sat.latitude * Math.PI / 180);
        const y = r * Math.sin(sat.latitude * Math.PI / 180);
        const z = r * Math.sin(angle) * Math.cos(sat.latitude * Math.PI / 180);
        orbitPoints.push(new THREE.Vector3(x, y, z));
      }
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: sat.name.includes("ISS") ? 0xffcc00 : 0x33ff00,
        transparent: true,
        opacity: 0.1,
      });
      orbits.push(new THREE.Line(orbitGeometry, orbitMaterial));
    });
    orbits.forEach(orbit => scene.add(orbit));

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      globe,
      satellites: satPoints,
      orbits,
      animationId: 0,
    };

    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const animate = () => {
      if (!sceneRef.current) return;
      const { scene, camera, renderer, globe, satellites } = sceneRef.current;

      globe.rotation.y += 0.001;

      const satData = getSatellites();
      const positions = satellites.geometry.attributes.position.array as Float32Array;
      
      satData.forEach((sat, i) => {
        const pos = propagateSatellite(sat);
        const lat = pos.lat * Math.PI / 180;
        const lng = pos.lng * Math.PI / 180;
        const r = 1 + pos.alt / 6371;
        
        positions[i * 3] = r * Math.cos(lat) * Math.cos(lng);
        positions[i * 3 + 1] = r * Math.sin(lat);
        positions[i * 3 + 2] = r * Math.cos(lat) * Math.sin(lng);
      });
      
      satellites.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        const { renderer, scene } = sceneRef.current;
        renderer.dispose();
        scene.clear();
        if (containerRef.current && renderer.domElement.parentNode) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-crosshair"
      style={{ minHeight: "400px" }}
    />
  );
}
