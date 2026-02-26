import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Button } from '../components/Button';
import { Camera, CameraOff, Play, RotateCcw, Info, Sparkles } from 'lucide-react';
import { SpeechControl } from '../components/SpeechControl';
import { usePageTracking, useARTracking, useAnalytics } from '../contexts/AnalyticsContext';

// Asset path helper
const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\.\//, '');

interface ExpTwin3DProps {
  startInAR?: boolean;
}

export const ExpTwin3D: React.FC<ExpTwin3DProps> = ({ startInAR = false }) => {
  const [velocity, setVelocity] = useState(0.8);
  const [distance, setDistance] = useState(5); 
  const [arMode, setArMode] = useState(startInAR);
  const [playing, setPlaying] = useState(false);

  // Analytics
  usePageTracking("ExpTwinParadox");
  useARSession("ExpTwinParadox", arMode);
  const { trackSlider } = useAnalytics();
  
  // Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const shipRef = useRef<THREE.Group | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const lifeForceRef = useRef<THREE.Mesh | null>(null); // AR Visual for aging
  const progressRef = useRef(0);
  const playingRef = useRef(false);

  // Constants
  const SIM_SPEED = 0.005;

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const sunLight = new THREE.PointLight(0xffffff, 2, 100);
    sunLight.position.set(-10, 10, -10);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x404040));

    // Earth
    const earthGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x2233ff, roughness: 0.6 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(-8, 0, 0);
    scene.add(earth);
    earthRef.current = earth;

    // Life Force Sphere (AR visualization of age)
    // Starts big and cyan (young), becomes small and grey (dead)
    const lifeGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const lifeMat = new THREE.MeshStandardMaterial({ 
        color: 0x00f3ff, 
        emissive: 0x00f3ff, 
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8 
    });
    const lifeForce = new THREE.Mesh(lifeGeo, lifeMat);
    lifeForce.position.set(-8, 3, 0);
    scene.add(lifeForce);
    lifeForceRef.current = lifeForce;

    // Destination Star
    const starGeo = new THREE.SphereGeometry(1, 16, 16);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(8, 0, 0); // Target position
    scene.add(star);

    // Trajectory Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-8, 0, 0),
        new THREE.Vector3(8, 0, 0)
    ]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    // Ship
    const shipGroup = new THREE.Group();
    const shipGeo = new THREE.ConeGeometry(0.5, 2, 8);
    shipGeo.rotateZ(-Math.PI / 2); // Point right
    const shipMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x004455 });
    const ship = new THREE.Mesh(shipGeo, shipMat);
    shipGroup.add(ship);
    shipGroup.position.set(-8, 0, 0);
    scene.add(shipGroup);
    shipRef.current = shipGroup;

    // Animation Loop
    const animate = () => {
        requestAnimationFrame(animate);

        // Rotation
        if (earthRef.current) earthRef.current.rotation.y += 0.01;

        // Logic
        if (playingRef.current) {
            progressRef.current += SIM_SPEED;
            if (progressRef.current > 2) {
                progressRef.current = 2;
                playingRef.current = false;
                setPlaying(false);
            }
        }

        const t = progressRef.current; // 0 to 1 (out), 1 to 2 (back)
        
        // Physics update
        const v = (window as any).twinVelocity || 0.8;
        const d = (window as any).twinDistance || 5;
        const gamma = 1 / Math.sqrt(1 - v*v);
        
        // Update Ship Position
        if (shipRef.current) {
            let xPos = -8;
            if (t <= 1) {
                // Outbound
                xPos = -8 + (t * 16);
                shipRef.current.rotation.z = -Math.PI / 2;
            } else {
                // Return
                xPos = 8 - ((t - 1) * 16);
                shipRef.current.rotation.z = Math.PI / 2;
            }
            shipRef.current.position.x = xPos;
            shipRef.current.scale.set(1/gamma, 1, 1);
        }

        // Calculate Ages for UI
        const totalTripTimeEarth = (d / v) * 2; 
        const progressRatio = t / 2; // 0 to 1
        const currentEarthAge = progressRatio * totalTripTimeEarth;
        const currentShipAge = currentEarthAge / gamma;

        // Update Global Vars for React UI
        (window as any).currentEarthAge = 20 + currentEarthAge;
        (window as any).currentShipAge = 20 + currentShipAge;

        // Update AR Life Force Visualization (Earth Twin)
        // Age 20 -> 100% Life, Age 100 -> 0% Life
        if (lifeForceRef.current) {
             const earthAgeVal = 20 + currentEarthAge;
             const lifeRatio = Math.max(0, 1 - (earthAgeVal - 20) / 80); // 1.0 at 20, 0.0 at 100
             
             // Scale down
             const s = 0.2 + (lifeRatio * 0.8);
             lifeForceRef.current.scale.set(s, s, s);
             
             // Color shift from Cyan (Young) to Grey (Old/Dead)
             const color = new THREE.Color().setHSL(0.5, 1.0, 0.5).lerp(new THREE.Color(0x333333), 1 - lifeRatio);
             (lifeForceRef.current.material as THREE.MeshStandardMaterial).color.set(color);
             (lifeForceRef.current.material as THREE.MeshStandardMaterial).emissive.set(color);
        }
        
        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if (!mountRef.current) return;
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    }
  }, []);

  useEffect(() => {
     (window as any).twinVelocity = velocity;
     (window as any).twinDistance = distance;
  }, [velocity, distance]);

  useEffect(() => {
     playingRef.current = playing;
     if (playing && progressRef.current >= 2) {
         progressRef.current = 0;
     }
  }, [playing]);

  // AR Handling
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current) return;
    if (arMode) {
        rendererRef.current.setClearColor(0x000000, 0);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => {
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  videoRef.current.play();
              }
          })
          .catch(err => {
              console.error(err);
              setArMode(false);
          });
    } else {
        rendererRef.current.setClearColor(0x0b0d17, 1);
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    }
}, [arMode]);

  const explanationText = "The symmetry is broken because the Space Twin must turn around (accelerate). Acceleration switches inertial frames. The twin who stays home remains in one frame and experiences more time.";

  const handleVelocityChange = (v: number) => {
      setVelocity(v);
      trackSlider('twin-velocity', v);
  }

  const handleDistanceChange = (d: number) => {
      setDistance(d);
      trackSlider('twin-distance', d);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Main Content (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-space-800 p-6 rounded-xl border border-space-700">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold">The Twin Paradox</h2>
                 <Button 
                    size="sm" 
                    variant={arMode ? 'primary' : 'outline'}
                    onClick={() => setArMode(!arMode)}
                    className="flex items-center gap-2"
                >
                    {arMode ? <><CameraOff size={16} /> Disable AR</> : <><Camera size={16} /> AR View</>}
                </Button>
            </div>
            
            {/* 3D Viewport */}
            <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden border border-space-600 shadow-2xl mb-6">
                <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${arMode ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
                <div ref={mountRef} className="absolute inset-0 z-10" />
                
                <div className="absolute top-4 left-4 z-20 pointer-events-none text-xs text-white/70 bg-black/40 p-1 rounded">
                    AR Visual: Floating Orb represents Earth Twin's Life Force. Watch it dim!
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                    <Button onClick={() => setPlaying(!playing)} variant="primary" className="shadow-xl">
                        {playing ? 'In Flight...' : <><Play size={16} className="mr-2"/> Launch Mission</>}
                    </Button>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium text-slate-300">Ship Velocity: {velocity.toFixed(2)}c</label>
                    <input 
                        type="range" min="0.1" max="0.99" step="0.01" 
                        value={velocity} onChange={(e) => handleVelocityChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-300">Distance: {distance} ly</label>
                    <input 
                        type="range" min="1" max="20" step="1" 
                        value={distance} onChange={(e) => handleDistanceChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Side Panel (Right) */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        {/* FACE MORPHING */}
        <div className="bg-space-800 p-4 rounded-xl border border-space-700">
            <h4 className="text-xs text-slate-400 uppercase mb-4 font-bold flex items-center gap-2">
                 Biological Aging Monitor
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
                <TwinFaceCard idPrefix="earth" label="Earth Twin" color="text-blue-400" />
                <TwinFaceCard idPrefix="ship" label="Space Twin" color="text-cyan-400" />
            </div>
        </div>

        {/* EXPLANATION */}
        <div className="bg-space-800 p-4 rounded-xl border border-space-700">
            <h4 className="flex items-center gap-2 text-sm font-bold text-purple-400 mb-2">
                <Info size={14} />
                The Acceleration Key
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
                {explanationText}
            </p>
            <SpeechControl text={explanationText} />
        </div>
      </div>
    </div>
  );
};

const TwinFaceCard: React.FC<{idPrefix: string, label: string, color: string}> = ({idPrefix, label, color}) => {
    const [ageState, setAgeState] = useState(20);

    // 6 Stages of Aging (Consistent Male Identity)
    // Using specific Unsplash IDs or reliable placeholders
    const STAGES = [
        { min: 0, max: 5, img: asset("./twin_image/baby.jpeg"), label: "Baby" },
        { min: 6, max: 18, img: asset("./twin_image/child.jpeg"), label: "Child" },
        { min: 19, max: 30, img: asset("./twin_image/young adult.jpeg"), label: "Young Adult" },
        { min: 31, max: 65, img: asset("./twin_image/adult.jpeg"), label: "Adult" },
        { min: 66, max: 110, img: asset("./twin_image/elderly.jpeg"), label: "Elderly" },
        { min: 110, max: 9999, img: asset("./twin_image/grave.jpeg"), label: "Deceased" }, // Grave/Dark abstract
    ];

    useEffect(() => {
        const update = () => {
            const ageKey = idPrefix === 'earth' ? 'currentEarthAge' : 'currentShipAge';
            const currentAge = (window as any)[ageKey] || 20;
            setAgeState(currentAge);
            requestAnimationFrame(update);
        };
        const handle = requestAnimationFrame(update);
        return () => cancelAnimationFrame(handle);
    }, [idPrefix]);

    const currentStage = STAGES.find(s => ageState >= s.min && ageState < s.max) || STAGES[5];

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-space-700 mb-2 bg-black">
                <img 
                    src={currentStage.img} 
                    alt={currentStage.label} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" 
                />
            </div>
            <div className={`font-bold ${color}`}>{label}</div>
            <div className="text-2xl font-mono text-white flex flex-col items-center">
                <span>{ageState.toFixed(1)} <span className="text-xs text-slate-500">yrs</span></span>
                <span className="text-xs text-slate-400 uppercase tracking-widest">{currentStage.label}</span>
            </div>
        </div>
    );
}