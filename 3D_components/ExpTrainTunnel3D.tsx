import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '../components/Button';
import { Camera, CameraOff, Info } from 'lucide-react';
import { SpeechControl } from '../components/SpeechControl';
import { usePageTracking, useARTracking, useAnalytics } from '../contexts/AnalyticsContext';

interface ExpTrainTunnel3DProps {
  startInAR?: boolean;
}

export const ExpTrainTunnel3D: React.FC<ExpTrainTunnel3DProps> = ({ startInAR = false }) => {
  // Asset path helper
  const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\.\//, '');

  const [velocity, setVelocity] = useState(0.866); // gamma = 2
  const [viewFrame, setViewFrame] = useState<'tunnel' | 'train'>('tunnel');
  const [arMode, setArMode] = useState(startInAR);

  // Analytics
  usePageTracking("ExpTrainTunnel");
  useARSession("ExpTrainTunnel", arMode);
  const { trackSlider } = useAnalytics();

  // Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const trainRef = useRef<THREE.Group | null>(null);
  const tunnelRef = useRef<THREE.Group | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const startRotYRef = useRef(0);

  // Constants
  const REST_TRAIN_LEN = 10;
  const REST_TUNNEL_LEN = 5;

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Floor
    const grid = new THREE.GridHelper(50, 50, 0x1e2548, 0x0f1225);
    grid.position.y = -2;
    scene.add(grid);

    // Pivot to rotate both
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotRef.current = pivot;

    // Load Tunnel GLB
    const tunnelGroup = new THREE.Group();
    pivot.add(tunnelGroup);
    tunnelRef.current = tunnelGroup as any;

    const tunnelLoader = new GLTFLoader();
    tunnelLoader.load(
      asset('./model/low_poly_style_subway_tunnel_section.glb'),
      (gltf) => {
        const tunnelModel = gltf.scene;

        // Optional: rotate to face correct direction
        tunnelModel.rotation.y = Math.PI / 2 * 3;
        tunnelModel.position.y = 3.3;

        // Optional: scale the tunnel to match REST_TUNNEL_LEN (length = 5)
        const bbox = new THREE.Box3().setFromObject(tunnelModel);
        const len = bbox.max.z - bbox.min.z || 1;
        const scale = REST_TUNNEL_LEN / len;
        const scaleCoef = scale * 5;
        tunnelModel.scale.set(scaleCoef, scaleCoef, scaleCoef);

        tunnelGroup.add(tunnelModel);
    },
    undefined,
    () => {
        // fallback if glb fails
        const fallbackGeo = new THREE.CylinderGeometry(3,3,REST_TUNNEL_LEN,32,1,true);
        fallbackGeo.rotateZ(Math.PI/2);
        const fallbackMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const fallback = new THREE.Mesh(fallbackGeo, fallbackMat);
        tunnelGroup.add(fallback);
    }
    );



    // Train Object (Initially Empty Group, populated by GLB or Fallback)
    const trainGroup = new THREE.Group();
    pivot.add(trainGroup);
    trainRef.current = trainGroup as any;

    const loader = new GLTFLoader();
    loader.load(
      asset('./model/train_-_british_rail_class_08_rail_blue_livery.glb'),
      (gltf) => {
        const glbTrain = gltf.scene;
        glbTrain.rotation.y = Math.PI / 2;
        glbTrain.position.z = 0.5;
        glbTrain.position.y = -1.7; // Lower to floor
        trainGroup.add(glbTrain);
        
        // Fit to REST_TRAIN_LEN
        const bbox = new THREE.Box3().setFromObject(glbTrain);
        const len = bbox.max.z - bbox.min.z || 1;
        const scale = REST_TRAIN_LEN / len;
        const scaleCoefTrain = scale * 0.5;
        glbTrain.scale.set(scale * 0.75, scaleCoefTrain, scaleCoefTrain);

        // --- NEW: Setup mixer for animations ---
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(glbTrain);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.loop = THREE.LoopRepeat;
            // Only play if velocity > 0
            if (velocity > 0) action.play();
          });
          (trainGroup as any).mixer = mixer;
        }
      },
      undefined,
      () => {
          // Fallback: Cyber Box
          const trainGeo = new THREE.BoxGeometry(REST_TRAIN_LEN, 2, 2);
          const trainMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8 });
          const train = new THREE.Mesh(trainGeo, trainMat);
          trainGroup.add(train);
      }
    );

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Animation Loop
    let t = 0;
    let frameId = 0;
    const animate = () => {
        frameId = requestAnimationFrame(animate);
        if (controlsRef.current) controlsRef.current.update();
        t += 0.01;

        const currentV = (window as any).ttVelocity || 0;
        const currentFrame = (window as any).ttFrame || 'tunnel';
        const gamma = 1 / Math.sqrt(1 - currentV * currentV);
        
        const simTime = (Date.now() / 1000) % 6; // 6s loop
        const offset = (simTime * 8) - 24; // move from -24 to +24

        if (currentFrame === 'tunnel') {
            // Tunnel Frame: 
            if (tunnelRef.current) {
                tunnelRef.current.scale.set(1, 1, 1); 
                tunnelRef.current.position.x = 0;
            }
            if (trainRef.current) {
                trainRef.current.scale.set(1/gamma, 1, 1);
                trainRef.current.position.x = offset; 
                // Update mixer if exists
                const mixer = (trainRef.current as any).mixer;
                if (mixer) {
                    const delta = 0.016; // ~60FPS, or use clock.getDelta()
                    if (velocity > 0) {
                        mixer.update(delta * (1 + velocity * 2)); // scale speed by velocity
                    } else {
                        mixer._actions.forEach((action: THREE.AnimationAction) => action.stop());
                    }
                }
            }
        } else {
            // Train Frame: 
            if (tunnelRef.current) {
                tunnelRef.current.scale.set(1/gamma, 1, 1); 
                tunnelRef.current.position.x = -offset;
            }
            if (trainRef.current) {
                trainRef.current.scale.set(1, 1, 1);
                trainRef.current.position.x = 0;
            }
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
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    }
  }, []);

  useEffect(() => {
    (window as any).ttVelocity = velocity;
    (window as any).ttFrame = viewFrame;
  }, [velocity, viewFrame]);

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

  const gamma = 1 / Math.sqrt(1 - velocity * velocity);

  const explanationText = viewFrame === 'tunnel' 
    ? `You are standing in the tunnel. To you, the train is whizzing by at ${(velocity*100).toFixed(0)}% light speed. Moving objects contract! So the train physically fits inside your tunnel for a brief moment.`
    : `You are sitting on the train. To you, the train is normal size. But the TUNNEL is rushing towards you at ${(velocity*100).toFixed(0)}% light speed. So the TUNNEL is the one that shrinks. The train definitely won't fit! This contradiction is resolved by the Relativity of Simultaneity.`;

  const handleVelocityChange = (v: number) => {
    setVelocity(v);
    trackSlider('train-velocity', v);
  }

  const handleFrameChange = (f: 'tunnel' | 'train') => {
    setViewFrame(f);
    trackClick(`btn-frame-${f}`);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Main Content (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-space-800 p-6 rounded-xl border border-space-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Train-Tunnel Paradox</h2>
                <Button 
                    size="sm" 
                    variant={arMode ? 'primary' : 'outline'}
                    onClick={() => setArMode(!arMode)}
                    className="flex items-center gap-2"
                >
                    {arMode ? <><CameraOff size={16} /> Disable AR</> : <><Camera size={16} /> AR View</>}
                </Button>
            </div>

            <div className="flex gap-4 mb-4 justify-center">
                <Button 
                    variant={viewFrame === 'tunnel' ? 'primary' : 'secondary'}
                    onClick={() => handleFrameChange('tunnel')}
                >
                    Tunnel Frame (Stationary Tunnel)
                </Button>
                <Button 
                    variant={viewFrame === 'train' ? 'primary' : 'secondary'}
                    onClick={() => handleFrameChange('train')}
                >
                    Train Frame (Stationary Train)
                </Button>
            </div>

            {/* 3D AR Canvas */}
            <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden border border-space-600 shadow-2xl mb-6">
                 <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${arMode ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
                 <div ref={mountRef} className="absolute inset-0 z-10" />
                 
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs bg-black/60 px-3 py-1 rounded text-slate-300 z-20 pointer-events-none">
                     Gray Ring: Tunnel (Rest Length 5) • Blue Box: Train (Rest Length 10)
                 </div>
            </div>

            <div className="space-y-4">
                 <div>
                    <label className="text-sm text-slate-400">Velocity: {velocity.toFixed(3)}c (Gamma: {gamma.toFixed(2)})</label>
                    <input 
                        type="range" min="0" max="0.95" step="0.01" 
                        value={velocity} onChange={(e) => handleVelocityChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                 </div>
            </div>
        </div>
      </div>

      {/* Side Panel (Right) */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        {/* Beginner Explanation Block with 2D Visual */}
         <div className="bg-space-800 p-4 rounded-xl border border-space-700">
            <h4 className="text-xs text-slate-400 uppercase mb-4 font-bold">Length Comparison (2D Ruler)</h4>
            
            <div className="space-y-4">
                {/* Tunnel Bar */}
                <div className="relative">
                     <div className="text-xs text-slate-400 mb-1">Tunnel Length</div>
                     <div 
                        className="h-4 bg-slate-500 rounded border border-slate-400 transition-all duration-300"
                        style={{ width: `${(viewFrame === 'train' ? (50/gamma) : 50)}%` }}
                     ></div>
                </div>

                {/* Train Bar */}
                <div className="relative">
                     <div className="text-xs text-cyan-400 mb-1">Train Length</div>
                     <div 
                        className="h-4 bg-cyan-600 rounded border border-cyan-400 transition-all duration-300"
                        style={{ width: `${(viewFrame === 'tunnel' ? (100/gamma) : 100)}%` }}
                     ></div>
                </div>
            </div>

            <div className="mt-4 text-xs text-center text-slate-500 border-t border-space-700 pt-2">
                {viewFrame === 'tunnel' 
                   ? "Tunnel Observer sees the TRAIN shrink." 
                   : "Train Observer sees the TUNNEL shrink."}
            </div>
         </div>

         <div className="bg-space-800 p-4 rounded-xl border border-space-700">
            <h4 className="flex items-center gap-2 text-sm font-bold text-blue-400 mb-2">
                <Info size={14} />
                Whose truth is real?
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
