import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generatePhysicsExplanation } from '../services/geminiService';
import { Button } from '../components/Button';
import { Info, Play, Pause, RotateCcw, Camera, CameraOff, Rocket } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePageTracking, useARTracking, useAnalytics } from '../contexts/AnalyticsContext';

// Asset path helper
const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\.\//, '');

interface Simulation3DProps {
  velocity?: number;
  setVelocity?: (v: number) => void;
  startInAR?: boolean;
}

// Graph Component (unchanged logic)
const LorentzGraph = ({ currentV }: { currentV: number }) => {
  const data = [];
  for (let v = 0; v <= 99; v += 1) {
    const vel = v / 100;
    const g = 1 / Math.sqrt(1 - vel * vel);
    data.push({ v: vel, gamma: g > 10 ? 10 : g });
  }

  return (
    <div className="h-48 w-full mt-4 bg-space-800/50 rounded-lg p-2 border border-space-700">
      <p className="text-xs text-slate-400 mb-2 text-center">Lorentz Factor (γ) vs Velocity (c)</p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorGamma" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2548" />
          <XAxis dataKey="v" stroke="#64748b" tickFormatter={(val) => `${val.toFixed(1)}c`} />
          <YAxis stroke="#64748b" domain={[1, 10]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0b0d17', borderColor: '#1e2548', color: '#fff' }}
            formatter={(value: number) => [value.toFixed(2), 'Gamma']}
            labelFormatter={(label) => `Velocity: ${label}c`}
          />
          <Area type="monotone" dataKey="gamma" stroke="#06b6d4" fillOpacity={1} fill="url(#colorGamma)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const Simulation3D: React.FC<Simulation3DProps> = ({ velocity: propVelocity, setVelocity: propSetVelocity, startInAR = false }) => {
  const [localVelocity, setLocalVelocity] = useState(0);
  const velocity = propVelocity ?? localVelocity;
  const setVelocity = propSetVelocity ?? setLocalVelocity;

  const [isPlaying, setIsPlaying] = useState(true);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExpl, setLoadingExpl] = useState(false);
  const [arMode, setArMode] = useState(startInAR);
  const [arError, setArError] = useState<string | null>(null);

  // Analytics Hook
  usePageTracking("WarpDriveSandbox");
  useARSession("WarpDriveSandbox", arMode);
  const { trackSlider, trackClick } = useAnalytics();

  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const shipRef = useRef<THREE.Group | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
    const frameIdRef = useRef(0);
    const controlsRef = useRef<OrbitControls | null>(null);

  // Physics calculations
  const gamma = 1 / Math.sqrt(1 - velocity * velocity);
  const timeDilation = gamma; 
  const lengthContraction = 100 / gamma;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0d17, 0.05);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00f3ff, 2, 50);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);
    const engineLight = new THREE.PointLight(0xffaa00, 3, 20);
    engineLight.position.set(0, 0, 3);
    scene.add(engineLight);

    // Try to load a Rocket Ship GLB; fallback to procedural model if it fails
    const shipGroup = new THREE.Group();
    const loader = new GLTFLoader();
    loader.load(
      asset('./model/multi_universe_space_ship_3d_model.glb'),
      (gltf) => {
        const ship = gltf.scene;
        ship.scale.set(0.8, 0.8, 0.8);
        ship.position.set(0, 0, 0);
        shipGroup.add(ship);
        scene.add(shipGroup);
        shipRef.current = shipGroup;
        // ------------------------
        // NEW: Animation Mixer for GLB animations (smoke tail)
        // ------------------------
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(ship);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.loop = THREE.LoopRepeat;
            if (velocity > 0) action.play(); // only play if velocity > 0
          });
          (shipGroup as any).mixer = mixer;

          const smokeMeshes: THREE.Mesh[] = [];
          ship.traverse((child) => {
            if (child.isMesh && child.name.includes('mesh_')) { 
              smokeMeshes.push(child);
            }
          });
          (shipGroup as any).smokeMeshes = smokeMeshes;
        }
      },
      undefined,
      () => {
        const fuselageGeo = new THREE.ConeGeometry(0.5, 3, 32);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 });
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        shipGroup.add(fuselage);
        const cockpitGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.3, -0.5);
        shipGroup.add(cockpit);
        const wingGeo = new THREE.BoxGeometry(3, 0.1, 1);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 0.5);
        shipGroup.add(wings);
        const glowGeo = new THREE.ConeGeometry(0.4, 1, 16);
        glowGeo.rotateX(-Math.PI / 2);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, 0, 1.5);
        shipGroup.add(glow);
        scene.add(shipGroup);
        shipRef.current = shipGroup;
      }
    );

    // Build Starfield
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);
    // Store original positions to calculate aberration
    const origPosArray = new Float32Array(starCount * 3); 

    for(let i = 0; i < starCount * 3; i+=3) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        posArray[i] = x;
        posArray[i+1] = y;
        posArray[i+2] = z;
        origPosArray[i] = x;
        origPosArray[i+1] = y;
        origPosArray[i+2] = z;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    starsGeo.userData = { originalPositions: origPosArray };

    const starsMat = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xffffff,
    });
    const starSystem = new THREE.Points(starsGeo, starsMat);
    scene.add(starSystem);
    starsRef.current = starSystem;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Handle Resize
    const handleResize = () => {
        if (!mountRef.current || !renderer || !camera) return;
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
        rendererRef.current = null;
    }
  }, []);

  // Animation Loop
  const clock = new THREE.Clock();
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    let time = 0;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) controlsRef.current.update();

      if (!isPlaying) {
          rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
          return;
      }

      time += 0.01;

      // 1. Length Contraction (Scale Ship Z-axis)
      const contractionFactor = Math.max(0.01, 1 / gamma); 
      if (shipRef.current) {
          shipRef.current.scale.set(1, 1, contractionFactor);
          // 4. Ship Movement
          shipRef.current.position.y = Math.sin(time) * 0.1;
          shipRef.current.rotation.z = Math.cos(time * 0.5) * 0.05;
      }

      // ------------------------
      // NEW: Update mixer (smoke tail animation)
      if (shipRef.current && (shipRef.current as any).mixer) {
          const delta = clock.getDelta();
          const mixer = (shipRef.current as any).mixer;

          if (velocity > 0) {
              // Ensure all actions are playing
              mixer._actions.forEach((action: THREE.AnimationAction) => {
                  if (!action.isRunning()) action.play();
              });
              mixer.update(delta * (1 + velocity * 2)); // scale speed with velocity
          } else {
              // Stop all actions when velocity = 0
              mixer._actions.forEach((action: THREE.AnimationAction) => {
                  action.stop();
              });
          }
      }

      // 2. Star Animation (Movement & Aberration)
      if (starsRef.current) {
          const stars = starsRef.current;
          const positions = stars.geometry.attributes.position.array as Float32Array;
          const originalPositions = stars.geometry.userData.originalPositions as Float32Array;
          
          const speed = 0.05 + (velocity * 2.0);
          const beta = velocity; 

          for(let i = 0; i < positions.length; i+=3) {
              let z = positions[i+2];
              z += speed;
              if (z > 20) z = -80;
              
              let x0 = originalPositions[i];
              let y0 = originalPositions[i+1];

              // Relativistic Aberration
              const aberrationCompression = 1.0 - (beta * 0.8); 
              
              positions[i] = x0 * aberrationCompression;
              positions[i+1] = y0 * aberrationCompression;
              positions[i+2] = z;
          }
          stars.geometry.attributes.position.needsUpdate = true;

          // 3. Doppler Shift
          if (velocity > 0.1) {
              (stars.material as THREE.PointsMaterial).color.setHex(0xaaaaff).lerp(new THREE.Color(0x0000ff), velocity);
          } else {
            (stars.material as THREE.PointsMaterial).color.setHex(0xffffff);
          }
      }

      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    };

    animate();

    return () => cancelAnimationFrame(frameIdRef.current);
  }, [velocity, isPlaying, gamma]);

  // Handle AR Toggle
  useEffect(() => {
      if (!rendererRef.current || !sceneRef.current) return;

      if (arMode) {
          rendererRef.current.setClearColor(0x000000, 0);
          sceneRef.current.fog = null;
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            })
            .catch(err => {
                console.error("AR Error:", err);
                setArError("Camera access denied or unavailable.");
                setArMode(false);
            });

      } else {
          rendererRef.current.setClearColor(0x0b0d17, 1);
          sceneRef.current.fog = new THREE.FogExp2(0x0b0d17, 0.05);
          if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              videoRef.current.srcObject = null;
          }
      }
  }, [arMode]);

  const handleExplain = async () => {
    trackClick("btn-explain-sim");
    setLoadingExpl(true);
    const text = await generatePhysicsExplanation("Time Dilation and Length Contraction", velocity, gamma);
    setExplanation(text);
    setLoadingExpl(false);
  };

  const handleVelocityChange = (v: number) => {
    setVelocity(v);
    trackSlider("warp-velocity", v);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4">
      <div className="flex-1 flex flex-col gap-4">
        
        {/* 3D Viewport */}
        <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden border-2 border-space-700 shadow-2xl group">
          <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${arMode ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
          <div ref={mountRef} className="absolute inset-0 z-10" />
          
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
             <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <Rocket size={20} className="text-cyan-400" />
                 Warp Drive Sandbox
             </h2>
             <div className="font-mono text-xs text-cyan-400 bg-black/70 p-2 rounded border border-cyan-900 w-fit">
                <div>MODE: {arMode ? 'AUGMENTED REALITY' : 'DEEP SPACE'}</div>
                <div>TARGET SPEED: {(velocity * 299792458).toLocaleString()} m/s</div>
             </div>
          </div>

          <div className="absolute top-4 right-4 z-20">
              <Button size="sm" variant={arMode ? 'primary' : 'secondary'} onClick={() => setArMode(!arMode)} className="flex items-center gap-2 shadow-lg">
                  {arMode ? <><CameraOff size={16} /> Disable AR</> : <><Camera size={16} /> Enable AR Mode</>}
              </Button>
          </div>
          
          {arError && <div className="absolute bottom-4 left-4 z-20 bg-red-900/80 text-white text-xs p-2 rounded border border-red-500">{arError}</div>}
        </div>

        {/* Controls */}
        <div className="bg-space-800 p-6 rounded-xl border border-space-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">Flight Controls</h2>
            <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleVelocityChange(0)}>
                    <RotateCcw size={16} />
                </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Velocity (v/c)</label>
                <span className="font-mono text-cyan-400 text-lg">{velocity.toFixed(3)}c</span>
              </div>
              <input type="range" min="0" max="0.995" step="0.001" value={velocity} onChange={(e) => handleVelocityChange(parseFloat(e.target.value))} className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-space-900/50 p-4 rounded-lg border border-space-700">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Time Dilation</div>
                  <div className="text-2xl font-bold text-white">1s <span className="text-sm text-slate-500">becomes</span> {timeDilation.toFixed(2)}s</div>
               </div>
               <div className="bg-space-900/50 p-4 rounded-lg border border-space-700">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Lorentz Factor (γ)</div>
                  <div className="text-2xl font-bold text-neon-pink">{gamma.toFixed(2)}</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Side Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
         <div className="bg-space-800 p-6 rounded-xl border border-space-700 h-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info size={18} className="text-cyan-400" />
                Relativity Analysis
            </h3>
            <div className="text-sm text-slate-300 space-y-4 mb-6">
                <p>As the spaceship approaches the speed of light, two major phenomena occur for a stationary observer:</p>
                <ul className="list-disc pl-4 space-y-2 text-slate-400">
                    <li><strong className="text-white">Length Contraction:</strong> The ship appears to shorten (flatten) in the direction of motion.</li>
                    <li><strong className="text-white">Relativistic Aberration:</strong> Stars appear to cluster in front of the ship.</li>
                </ul>
            </div>
            <Button onClick={handleExplain} disabled={loadingExpl} className="w-full mb-4" variant="outline">
                {loadingExpl ? 'Analyzing Space-Time...' : 'Ask AI to Explain This State'}
            </Button>
            {explanation && <div className="bg-space-900 p-4 rounded border border-cyan-900/50 text-sm leading-relaxed"><p className="text-cyan-100">{explanation}</p></div>}
            <LorentzGraph currentV={velocity} />
         </div>
      </div>
    </div>
  );
};
