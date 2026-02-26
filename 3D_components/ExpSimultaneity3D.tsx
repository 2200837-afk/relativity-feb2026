import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '../components/Button';
import { Play, RotateCcw, Camera, CameraOff, Info } from 'lucide-react';
import { SpeechControl } from '../components/SpeechControl';
import { usePageTracking, useARTracking, useAnalytics } from '../contexts/AnalyticsContext';

interface ExpSimultaneity3DProps {
  startInAR?: boolean;
}

export const ExpSimultaneity3D: React.FC<ExpSimultaneity3DProps> = ({ startInAR = false }) => {
  // Asset path helper
  const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\.\//, '');

  const [frame, setFrame] = useState<'platform' | 'train'>('platform');
  const [playing, setPlaying] = useState(false);
  const [arMode, setArMode] = useState(startInAR);
  // Track frame inside animation loop
  const frameRef = useRef(frame);

  // Analytics
  usePageTracking("ExpSimultaneity");
  useARTracking("ExpSimultaneity", arMode);
  const { trackClick } = useAnalytics();

  // Three.js Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const trainRef = useRef<THREE.Group | null>(null);
  const lightSphereLeftRef = useRef<THREE.Mesh | null>(null);
  const lightOrigin = useRef(new THREE.Vector3());
  
  // UI Refs for high-perf updates
  const timelineBarRef = useRef<HTMLDivElement>(null);

  // timeline event flags
  const timelineEvents = useRef({
    leftHit: false,
    rightHit: false
  });
  
  // Animation State
  const progressRef = useRef(0);
  const playingRef = useRef(false);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Scene Setup
  useEffect(() => {
      if (!mountRef.current) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0b0d17);
      sceneRef.current = scene;

      const clock = new THREE.Clock();

      const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 100);
      camera.position.set(0, 5, 15);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      rendererRef.current = renderer;
      mountRef.current.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(5, 10, 5);
      scene.add(dirLight);

      // Floor / Tracks
      const grid = new THREE.GridHelper(50, 50, 0x1e2548, 0x0f1225);
      scene.add(grid);

      // --- PROCEDURAL SCI-FI TRAIN (REPLACED WITH GLB IF LOADED) ---
      const trainGroup = new THREE.Group();
      scene.add(trainGroup);
      trainRef.current = trainGroup;

      // Detectors (Independent of train model, always visible)
      const detGeo = new THREE.BoxGeometry(0.2, 1, 0.5);

      const beforeColorLeft = 0xff0000;     // green-ish
      const afterColorLeft  = 0x22C55E;     // hit color (red)

      const beforeColorRight = 0x052ca1;
      const afterColorRight  = 0x22C55E;    // hit color (blue)

      const detLeft = new THREE.Mesh(detGeo, new THREE.MeshStandardMaterial({ color: beforeColorLeft }));  
      detLeft.position.set(-3.9, 1.5, 0);
      detLeft.name = "detLeft";
      trainGroup.add(detLeft);

      const detRight = new THREE.Mesh(detGeo, new THREE.MeshStandardMaterial({ color: beforeColorRight }));
      detRight.position.set(3.9, 1.5, 0);
      detRight.name = "detRight";
      trainGroup.add(detRight);

      // Try loading standard GLB Train
      const loader = new GLTFLoader();
      loader.load(
        asset('./model/train_-_british_rail_class_08_rail_blue_livery.glb'),
        (gltf) => {
          const glbTrain = gltf.scene;
          // Hide procedural parts if any were added (we won't add them now)
          
          // The ToyTrain is huge and oriented differently. Adjust:
          glbTrain.position.set(0, 0.1, 0);
          glbTrain.rotation.y = Math.PI / 2; // Face X direction
          
          trainGroup.add(glbTrain);

          // --- Attach detectors to ends of the GLB train ---
          // Compute bounding box AFTER scaling
          const bbox2 = new THREE.Box3().setFromObject(glbTrain);
          const frontZ = bbox2.max.z;
          const backZ  = bbox2.min.z;
 
          // Make sure detectors follow the train model
          const detLeft = trainGroup.getObjectByName("detLeft");
          const detRight = trainGroup.getObjectByName("detRight");
 
          if (detLeft && detRight) {
              // Attach to GLB root
              glbTrain.add(detLeft);
              glbTrain.add(detRight);

              // Reposition relative to the GLB train
              detLeft.position.set(0, 3.3, backZ*2.9 - glbTrain.position.z);   // Rear detector
              detRight.position.set(0, 3.3, frontZ*3.0 - glbTrain.position.z); // Front detector
            //   detLeft.position.set(1.5, 0, backZ - glbTrain.position.z);
            //   detRight.position.set(1.5, 0, frontZ - glbTrain.position.z);
          }
          
          // Scale to fit ~10 units length
          const bbox = new THREE.Box3().setFromObject(glbTrain);
          const len = bbox.max.z - bbox.min.z || 1; // Train is long on Z in local space usually
          const scale = 10 / len; 
          const scaleConst = 0.5;
          glbTrain.scale.set(scale*scaleConst, scale*scaleConst, scale*scaleConst);

        //   // Adjust Detectors to ends of the new train
        //   detLeft.position.x = -5;
        //   detRight.position.x = 5;
        //   detLeft.position.y = 2;
        //   detRight.position.y = 2;

          // --- Animation Mixer ---
          if (gltf.animations && gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(glbTrain);
              const actions: THREE.AnimationAction[] = [];
              gltf.animations.forEach((clip) => {
                  const action = mixer.clipAction(clip);
                  action.loop = THREE.LoopRepeat;
                  actions.push(action);
              });
              (trainGroup as any).mixer = mixer;
              (trainGroup as any).actions = actions; // store actions
          }
        },
        undefined,
        () => {
            // FALLBACK: Procedural Train if GLB fails
            const bodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
            bodyGeo.rotateZ(Math.PI / 2);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 1.5;
            trainGroup.add(body);
            
            const noseGeo = new THREE.ConeGeometry(1.2, 2, 12);
            noseGeo.rotateZ(-Math.PI / 2);
            const noseFront = new THREE.Mesh(noseGeo, bodyMat);
            noseFront.position.set(5, 1.5, 0);
            trainGroup.add(noseFront);
            
            const noseBack = new THREE.Mesh(noseGeo, bodyMat);
            noseBack.rotation.z = Math.PI / 2;
            noseBack.position.set(-5, 1.5, 0);
            trainGroup.add(noseBack);
        }
      );

      // Light Source (Center)
      const bulbGeo = new THREE.SphereGeometry(0.2);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, 1.5, 0);
      trainGroup.add(bulb);

      // Light Pulses (Spheres that will expand)
      const pulseGeo = new THREE.SphereGeometry(1, 32, 32);
      const pulseMat = new THREE.MeshBasicMaterial({ 
          color: 0xffff00, 
          transparent: true, 
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
      });
      
      const sphereL = new THREE.Mesh(pulseGeo, pulseMat);
      sphereL.visible = false;
      scene.add(sphereL); 
      lightSphereLeftRef.current = sphereL;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.minDistance = 5;
      controls.maxDistance = 50;
      controlsRef.current = controls;

      // Animation Loop
      let frameId = 0;
      const animate = () => {
        if (controlsRef.current) controlsRef.current.update();

        // REAL collision check with expanding light sphere
        function checkDetectorHit(detector: any, lightSphere: any, hitColor: any, defaultColor: any) {
            if (!detector || !lightSphere) return;

            const detPos = new THREE.Vector3();
            detector.getWorldPosition(detPos);

            const lightPos = new THREE.Vector3();
            lightSphere.getWorldPosition(lightPos);

            const radius = lightSphere.scale.x; // sphere radius = scale
            const dist = detPos.distanceTo(lightPos);

            const mat = detector.material;

            if (dist <= radius) {
                mat.color.set(hitColor);
                detector.userData.hit = true;
            } else if (!detector.userData.hit) {
                mat.color.set(defaultColor);
            }
        }

        frameId = requestAnimationFrame(animate);
          
          if (playingRef.current) {
              progressRef.current += 0.005;
              if (progressRef.current > 1) {
                  progressRef.current = 1;
                  playingRef.current = false;
                  setPlaying(false);
              }
          }

          const t = progressRef.current; // 0 to 1
          if (lightSphereLeftRef.current) {
              lightSphereLeftRef.current.visible = t > 0;
          }
          
          // Sync UI Bar
          if (timelineBarRef.current) {
              timelineBarRef.current.style.width = `${t * 100}%`;
          }

          const maxTime = 5.0; // simulation seconds
          const simT = t * maxTime;
          
          const c = 5; // Light speed in sim units
          const v = 2.5; // Train speed (0.5c)
          
          const currentFrame = frameRef.current;

          // RESET VISUALS
          if (t === 0) {
              if (lightSphereLeftRef.current) {
                lightSphereLeftRef.current.visible = false;
                lightSphereLeftRef.current.scale.set(0.01, 0.01, 0.01);
              }
              const dL = trainGroup.getObjectByName('detLeft') as THREE.Mesh;
              const dR = trainGroup.getObjectByName('detRight') as THREE.Mesh;
              if (dL && dL.material) (dL.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
              if (dR && dR.material) (dR.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
              
              // Reset UI Markers
              const uiL = document.getElementById('ui-marker-left');
              const uiR = document.getElementById('ui-marker-right');
              if(uiL) uiL.classList.remove('bg-green-500', 'scale-150');
              if(uiR) uiR.classList.remove('bg-green-500', 'scale-150');

          } else {
              if (lightSphereLeftRef.current) lightSphereLeftRef.current.visible = true;
          }

          // when simulation begins, lock the light's origin
          if (t > 0 && progressRef.current === 0.005) {
              lightOrigin.current.copy(trainRef.current.position);
          }

          // LOGIC
          if (currentFrame === 'platform') {
              // Platform Frame: Train moves

          if (trainRef.current) {
              // Move train
              trainRef.current.position.x = playingRef.current ? v * simT : trainRef.current.position.x;
  
              // Update GLB animations
              const mixer = (trainRef.current as any).mixer;
              const actions = (trainRef.current as any).actions as THREE.AnimationAction[];
              if (mixer && actions) {
                const delta = clock.getDelta();

                if (playingRef.current) {
                    actions.forEach(a => {
                        a.paused = false;
                        if (!a._started) {   // custom flag to avoid repeated .play()
                            a.play();
                            a._started = true;
                        }
                    });
                    mixer.update(delta);
                } else {
                    actions.forEach(a => a.paused = true);
                }
              }
          }
              
              if (lightSphereLeftRef.current && trainRef.current) {
                  // Light emitted at x = train position at t=0
                  // Platform frame: light sphere stays at fixed origin after emission
                  lightSphereLeftRef.current.position.set(
                      lightOrigin.current.x,
                      1.5,
                      0
                  );
  
                  const r = c * simT;
                  lightSphereLeftRef.current.scale.set(r, r, r);
              }
              
              // Distance from center to each detector
              const L = 5; // since you used 5 after scaling
 
              // Platform frame hit times
              const tLeftHit  = L / (c + v); // back wall moves toward light
              const tRightHit = L / (c - v); // front wall moves away
              
              const dL = trainGroup.getObjectByName('detLeft') as THREE.Mesh;
              const dR = trainGroup.getObjectByName('detRight') as THREE.Mesh;

              // REAL LIGHT COLLISION
              checkDetectorHit(
                  dL,
                  lightSphereLeftRef.current,
                  afterColorLeft,
                  beforeColorLeft
              );
              checkDetectorHit(
                  dR,
                  lightSphereLeftRef.current,
                  afterColorRight,
                  beforeColorRight
              );
 
              // Update UI
              if (dL?.userData?.hit) {
                  document.getElementById('ui-marker-left')?.classList.add('bg-green-500', 'scale-150');
              }
              if (dR?.userData?.hit) {
                  document.getElementById('ui-marker-right')?.classList.add('bg-green-500', 'scale-150');
              }

          } else {
              // Train Frame: Train stationary
              if (trainRef.current) trainRef.current.position.x = 0;
              
              if (lightSphereLeftRef.current) {
                  lightSphereLeftRef.current.position.set(0, 1.5, 0);
                  const r = c * simT;
                  lightSphereLeftRef.current.scale.set(r, r, r);
              }
              
              // Hit Check (same distance used above)
              const L = 5
              const tHit = L / c;
              
              const dL = trainGroup.getObjectByName('detLeft') as THREE.Mesh;
              const dR = trainGroup.getObjectByName('detRight') as THREE.Mesh;

              // REAL LIGHT COLLISION
              checkDetectorHit(
                  dL,
                  lightSphereLeftRef.current,
                  afterColorLeft,
                  beforeColorLeft
              );
              checkDetectorHit(
                  dR,
                  lightSphereLeftRef.current,
                  afterColorRight,
                  beforeColorRight
              );

              // --- TIMELINE EVENT UPDATE (Train View) ---
              if (dL?.userData?.hit && !timelineEvents.current.leftHit) {
                  timelineEvents.current.leftHit = true;
                  document.getElementById('ui-marker-left')?.classList.add('bg-green-500', 'scale-150');
              }
 
              if (dR?.userData?.hit && !timelineEvents.current.rightHit) {
                  timelineEvents.current.rightHit = true;
                  document.getElementById('ui-marker-right')?.classList.add('bg-green-500', 'scale-150');
              }

              // --- TIMELINE EVENT UPDATE (Platform View) ---
              if (dL?.userData?.hit && !timelineEvents.current.leftHit) {
                  timelineEvents.current.leftHit = true;
                  document.getElementById('ui-marker-left')?.classList.add('bg-green-500', 'scale-150');
              }
 
              if (dR?.userData?.hit && !timelineEvents.current.rightHit) {
                  timelineEvents.current.rightHit = true;
                  document.getElementById('ui-marker-right')?.classList.add('bg-green-500', 'scale-150');
              }

            // Update UI
              if (dL?.userData?.hit) {
                  document.getElementById('ui-marker-left')?.classList.add('bg-green-500', 'scale-150');
              }
              if (dR?.userData?.hit) {
                  document.getElementById('ui-marker-right')?.classList.add('bg-green-500', 'scale-150');
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
    frameRef.current = frame;   // Use ref instead of window variable
    reset();
  }, [frame]);

  useEffect(() => {
    playingRef.current = playing;
    if (playing && progressRef.current >= 1) {
        progressRef.current = 0;
    }
  }, [playing]);

  const reset = () => {
      setPlaying(false);
      progressRef.current = 0;
      playingRef.current = false;

          // Reset train position
      if (trainRef.current) {
        trainRef.current.position.x = 0;
      }

      // Reset light origin
      lightOrigin.current.set(0, 0, 0);

      // Reset light sphere
      if (lightSphereLeftRef.current) {
          lightSphereLeftRef.current.visible = false;
          lightSphereLeftRef.current.scale.set(0.01, 0.01, 0.01);
      }

      // Reset timeline bar
      if (timelineBarRef.current) timelineBarRef.current.style.width = '0%';

        // Reset event flags
        timelineEvents.current.leftHit = false;
        timelineEvents.current.rightHit = false;

        // Reset UI markers
        document.getElementById('ui-marker-left')?.classList.remove('bg-green-500', 'scale-150');
        document.getElementById('ui-marker-right')?.classList.remove('bg-green-500', 'scale-150');

        // Reset detector hit flags
        const dL = trainRef.current?.getObjectByName('detLeft');
        const dR = trainRef.current?.getObjectByName('detRight');

        const beforeColorLeft = 0xff0000;     // green-ish
        const beforeColorRight = 0x052ca1;
      
        if (dL) (dL.material as THREE.MeshStandardMaterial).color.setHex(beforeColorLeft);
        if (dR) (dR.material as THREE.MeshStandardMaterial).color.setHex(beforeColorRight);

        if (dL) dL.userData.hit = false;
        if (dR) dR.userData.hit = false;
  };
  

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

  const explanationText = frame === 'platform' 
    ? "From the Platform View, the train is moving. The back wall (Left) is moving TOWARDS the light source, so it intercepts the light beam early. The front wall (Right) is moving AWAY, so the light has to chase it, taking longer to hit. Events are NOT simultaneous."
    : "From the Train View, the train is stationary. The light source is exactly in the middle. Since the speed of light is constant, it takes the exact same amount of time to reach both the left and right walls. Events ARE simultaneous.";

  const handleFrameChange = (newFrame: 'platform' | 'train') => {
      setFrame(newFrame);
      reset();
      trackClick(`btn-frame-${newFrame}`);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Main Content (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-space-800 p-6 rounded-xl border border-space-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Relativity of Simultaneity</h2>
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
                    size="sm" 
                    variant={frame === 'platform' ? 'primary' : 'secondary'}
                    onClick={() => handleFrameChange('platform')}
                >
                    Platform View (Stationary)
                </Button>
                <Button 
                    size="sm" 
                    variant={frame === 'train' ? 'primary' : 'secondary'}
                    onClick={() => handleFrameChange('train')}
                >
                    Train View (Moving)
                </Button>
            </div>

            {/* 3D AR Canvas */}
            <div className="relative w-full h-[400px] bg-space-900 rounded-xl overflow-hidden border border-space-600 shadow-2xl">
                 <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${arMode ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
                 <div ref={mountRef} className="absolute inset-0 z-10" />
                 
                 {/* Overlay UI */}
                 <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                     <Button onClick={() => {
                                        if (progressRef.current >= 1) reset();
                                        setPlaying(!playing);
                                    }} variant="primary" size="sm">
                        {playing ? 'Pause' : <><Play size={14} className="mr-2"/> Play Light Pulse</>}
                     </Button>
                     <Button onClick={reset} variant="secondary" size="sm">
                        <RotateCcw size={14} />
                     </Button>
                 </div>
            </div>
        </div>
      </div>

      {/* Side Panel (Right) */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        {/* Visual: Timeline */}
        <div className="bg-space-800 p-4 rounded-xl border border-space-700">
            <h4 className="text-xs text-slate-400 uppercase mb-4 font-bold">Event Timeline ({frame})</h4>
            <div className="relative w-full h-2 bg-space-700 rounded mb-6 mt-2 overflow-hidden">
                {/* Fill Bar */}
                <div ref={timelineBarRef} className="absolute top-0 left-0 h-full bg-slate-500/30 w-0 transition-none"></div>

                {/* Time markers */}
                {frame === 'platform' ? (
                    <>
                        <div id="ui-marker-left" className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-900 rounded-full border-2 border-space-900 transition-all duration-200" style={{left: '30%'}}></div>
                        <div className="absolute top-6 text-[10px] text-red-400 -translate-x-1/2" style={{left: '30%'}}>Left Hit</div>
                        
                        <div id="ui-marker-right" className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-900 rounded-full border-2 border-space-900 transition-all duration-200" style={{left: '70%'}}></div>
                        <div className="absolute top-6 text-[10px] text-cyan-400 -translate-x-1/2" style={{left: '70%'}}>Right Hit</div>
                    </>
                ) : (
                     <>
                        <div id="ui-marker-left" className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-900 rounded-full border-2 border-space-900 transition-all duration-200" style={{left: '50%'}}></div>
                        <div id="ui-marker-right" className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-900 rounded-full border-2 border-space-900 transition-all duration-200" style={{left: '50%'}}></div>
                        <div className="absolute top-6 text-[10px] text-purple-400 -translate-x-1/2 w-32 text-center" style={{left: '50%'}}>Simultaneous Hit</div>
                    </>
                )}
            </div>
            <div className="text-xs text-slate-500 text-center mt-6">
                Time flows from left to right →
            </div>
        </div>

        {/* Explanation Text */}
        <div className="bg-space-800 p-4 rounded-xl border border-space-700">
            <h4 className="flex items-center gap-2 text-sm font-bold text-green-400 mb-2">
                <Info size={14} />
                Why the difference?
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
