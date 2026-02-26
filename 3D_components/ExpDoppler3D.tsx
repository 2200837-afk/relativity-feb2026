import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '../components/Button';
import { Camera, CameraOff, Info, AlertTriangle } from 'lucide-react';
import { SpeechControl } from '../components/SpeechControl';
import { usePageTracking, useARTracking, useAnalytics } from '../contexts/AnalyticsContext';

interface ExpDoppler3DProps {
  startInAR?: boolean;
}

export const ExpDoppler3D: React.FC<ExpDoppler3DProps> = ({ startInAR = false }) => {
  const [velocity, setVelocity] = useState(0); // -0.9 to 0.9
  const [arMode, setArMode] = useState(startInAR);
  const [arError, setArError] = useState<string | null>(null);

  // Analytics
  usePageTracking("ExpDoppler");
  useARSession("ExpDoppler", arMode);
  const { trackSlider } = useAnalytics();

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Base wavelength for green light (nm)
  const baseWavelength = 550;

  // Calculate Observed Wavelength
  const calculateWavelength = (v: number) => {
    // v > 0 = approaching
    return baseWavelength * Math.sqrt((1 - v) / (1 + v));
  };

  const observedWavelength = calculateWavelength(velocity);

  // Convert Wavelength to Color
  const wavelengthToColor = (wavelength: number) => {
    let r, g, b;
    if (wavelength >= 380 && wavelength < 440) {
      r = -(wavelength - 440) / (440 - 380); g = 0; b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
      r = 0; g = (wavelength - 440) / (490 - 440); b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
      r = 0; g = 1; b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
      r = (wavelength - 510) / (580 - 510); g = 1; b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
      r = 1; g = -(wavelength - 645) / (645 - 580); b = 0;
    } else if (wavelength >= 645 && wavelength < 781) {
      r = 1; g = 0; b = 0;
    } else {
      // Return a very dim color for UV/IR instead of pitch black
      if (wavelength < 380) return '#1a0033'; // Dim violet for UV
      if (wavelength > 781) return '#330000'; // Dim red for IR
      return '#000000';
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const colorHex = wavelengthToColor(observedWavelength);
  const isInvisible = observedWavelength < 380 || observedWavelength > 780;
  
  // Three.js Init
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // 🔥 Custom GLSL-based Sun Surface Shader (Hyper-Realistic Granulation)
    const SunMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xffaa00) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 color;
  
        // Simplex 3D Noise 
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          
          // First corner
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          
          // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          
          // x0 = x0 - 0.0 + 0.0 * C.xx ;
          // x1 = x0 - i1 + 1.0 * C.xx ;
          // x2 = x0 - i2 + 2.0 * C.xx ;
          // x3 = x0 - 1.0 + 3.0 * C.xx ;
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
          vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
          
          // Permutations
          i = mod289(i); 
          vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                   
          // Gradients: 7x7 points over a square, mapped onto an octahedron.
          // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
          float n_ = 0.142857142857; // 1.0/7.0
          vec3  ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          
          //Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        // Fractal Brownian Motion
        float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 2.5;
            for (int i = 0; i < 4; i++) { 
                value += amplitude * snoise(p * frequency);
                p += vec3(100.0); 
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return value * 0.5 + 0.5;
        }

        void main() {
          // View / Normal
          vec3 normal = normalize(vNormal);
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          float viewDot = max(0.0, dot(normal, viewDir)); // 1.0 center, 0.0 edge
          
          // 1. Dynamic Turbulence (Boiling Effect)
          float speed = 0.2;
          vec3 pos = vPosition * 3.0; 
          float noiseVal = fbm(pos + vec3(time * speed));
          
          // Sharpen noise for "granules"
          float granule = smoothstep(0.3, 0.7, noiseVal);

          // 2. Heat Gradient Calculation
          // Base Heat: Center is hot (1.0), Edge is cold (0.0)
          float heat = viewDot;
          
          // Add noise to heat: Hot spots are hotter
          // This mixes the boiling texture into the limb darkening
          heat = clamp(heat + (granule - 0.5) * 0.3, 0.0, 1.0);

          // 3. Color Palette (Gradual Shading)
          // We create a 3-stop gradient: Deep/Dark -> Main -> Bright/White
          
          vec3 colorCool = color * 0.15; // Dark Edge
          vec3 colorMain = color;        // True Doppler Color
          vec3 colorHot  = mix(color, vec3(1.0), 0.8); // Bright Core
          
          vec3 finalColor;
          if (heat > 0.5) {
             // Mix Main -> Hot
             float t = (heat - 0.5) * 2.0;
             finalColor = mix(colorMain, colorHot, t);
          } else {
             // Mix Cool -> Main
             float t = heat * 2.0;
             finalColor = mix(colorCool, colorMain, t);
          }

          // 4. Corona / Rim Glow
          float fresnel = 1.0 - viewDot;
          vec3 glow = color * pow(fresnel, 3.0) * 1.2;

          gl_FragColor = vec4(finalColor + glow, 1.0);
        }
      `
    });

    // Main Object (Sci-Fi Helmet instead of sphere)
    const starGroup = new THREE.Group();
    scene.add(starGroup);
    starRef.current = starGroup as any;

    // Create the Sun using the custom shader on a high-res sphere
    // We use this PERMANENTLY instead of trying to load a GLB, because a star is just a sphere
    // and our shader provides all the visual detail ("boiling" surface).
    const sunGeometry = new THREE.SphereGeometry(1.5, 128, 128);
    const sunMesh = new THREE.Mesh(sunGeometry, SunMaterial);
    sunMesh.name = "theSun";
    starGroup.add(sunMesh);

    // Ambient Particles (Dust) to show motion
    const partGeo = new THREE.BufferGeometry();
    const partCount = 500;
    const pos = new Float32Array(partCount * 3);
    for(let i=0; i<partCount*3; i++) {
        pos[i] = (Math.random() - 0.5) * 20;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const partMat = new THREE.PointsMaterial({ size: 0.05, color: 0x888888 });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Lights
    const pointLight = new THREE.PointLight(0xffffff, 2, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    scene.add(new THREE.AmbientLight(0x404040));

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // SunMaterial.uniforms.time.value += 0.01; // REMOVED: This was updating the template material, not instances

      if (controlsRef.current) controlsRef.current.update();
      
      if (starRef.current) {
          starRef.current.rotation.y += 0.005;

          // Update time uniform for all meshes using the shader
          starRef.current.traverse((child: any) => {
            if (child.isMesh && child.material && child.material.uniforms && child.material.uniforms.time) {
                child.material.uniforms.time.value += 0.01;
            }
          });
      }
      
      // Animate particles based on velocity to simulate motion
      if (particlesRef.current) {
         const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
         const speed = 0.1 * ((window as any).expDopplerVelocity || 0); 
         for(let i=2; i<positions.length; i+=3) {
             positions[i] += speed;
             if (positions[i] > 10) positions[i] = -10;
             if (positions[i] < -10) positions[i] = 10;
         }
         particlesRef.current.geometry.attributes.position.needsUpdate = true;
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

  // Update Star Material based on state
  useEffect(() => {
      (window as any).expDopplerVelocity = velocity;

      if (starRef.current) {
          // Apply color shift to all meshes in the group
          starRef.current.traverse((child: any) => {
            if (child.isMesh && child.material.uniforms?.color) {
              child.material.uniforms.color.value.set(colorHex);
            }
          });
          const scale = 1 + (velocity * 0.2);
          starRef.current.scale.set(scale, scale, scale);
      }
  }, [colorHex, velocity]);

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
                setArError("AR Error: " + err.message);
                setArMode(false);
            });
      } else {
          rendererRef.current.setClearColor(0x000000, 1);
          if (videoRef.current?.srcObject) {
              (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
              videoRef.current.srcObject = null;
          }
      }
  }, [arMode]);



  const explanationText = Math.abs(velocity) < 0.05 
    ? "You are nearly stationary relative to the star. The light waves reach your eyes at their normal frequency, so you see the star's true color (Green)."
    : velocity > 0 
        ? "You are rushing TOWARDS the light waves. This compresses the light's wavelength (Blueshift). If you go fast enough, the light shifts into Ultraviolet (UV) which is invisible to humans!"
        : "You are moving AWAY from the light source. The wavelength appears stretched out (Redshift). If you recede fast enough, the light shifts into Infrared (IR) and the star essentially disappears from sight.";

  const handleVelocityChange = (v: number) => {
    setVelocity(v);
    trackSlider("doppler-velocity", v);
  }

  const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\.\//, '');

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-300">
      {/* Main Content (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-space-800 p-6 rounded-xl border border-space-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold">Relativistic Doppler Shift</h2>
                    <p className="text-slate-300">
                    Observe how the star changes color as you change velocity relative to it.
                    </p>
                </div>
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
            <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden border border-space-600 shadow-inner group">
                <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${arMode ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
                <div ref={mountRef} className="absolute inset-0 z-10" />
                
                <div className="absolute bottom-4 left-4 z-20 font-mono text-xs text-white bg-black/50 p-2 rounded">
                    WAVELENGTH: {observedWavelength.toFixed(0)} nm
                </div>

                {/* Warning for invisible spectrum */}
                {isInvisible && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-none">
                        <AlertTriangle size={48} className={observedWavelength < 380 ? "text-purple-500" : "text-red-900"} />
                        <h3 className="text-xl font-bold text-white mt-2">
                            {observedWavelength < 380 ? "ULTRAVIOLET" : "INFRARED"}
                        </h3>
                        <p className="text-slate-400 text-sm bg-black/80 px-2 rounded">Invisible to human eye</p>
                    </div>
                )}

                {arError && <div className="absolute top-4 left-4 z-20 text-red-500 bg-black/80 p-2 rounded">{arError}</div>}
            </div>

            {/* Controls */}
            <div className="mt-6 space-y-6">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-red-400">Receding (Moving Away)</span>
                    <span className="text-slate-400 font-mono">
                        v = {velocity > 0 ? '+' : ''}{velocity.toFixed(2)}c
                    </span>
                    <span className="text-cyan-400">Approaching (Moving Towards)</span>
                </div>
                
                <input 
                    type="range"
                    min="-0.90"
                    max="0.90"
                    step="0.01"
                    value={velocity}
                    onChange={(e) => handleVelocityChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-red-900 via-green-900 to-blue-900 rounded-lg appearance-none cursor-pointer accent-white"
                />
            </div>
        </div>
      </div>

      {/* Side Panel (Right) */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
            {/* Visual Graph: Spectrum */}
            <div className="bg-space-800 p-4 rounded-xl border border-space-700">
                <h4 className="text-xs text-slate-400 uppercase mb-2 font-bold">Electromagnetic Spectrum</h4>
                <div className="relative h-12 w-full rounded bg-gradient-to-r from-purple-900 via-green-500 to-red-900 mb-2 overflow-hidden border border-space-700">
                    {/* Static Rest Marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white]" style={{ left: '50%' }}></div>
                    {/* Dynamic Observed Marker */}
                    <div 
                        className="absolute top-0 bottom-0 w-1 bg-black border-x border-white transition-all duration-300 z-10"
                        style={{ 
                            left: `${Math.min(100, Math.max(0, ((observedWavelength - 300) / (800 - 300)) * 100))}%` 
                        }}
                    ></div>
                    
                    {/* Labels for Invisible Zones */}
                    <div className="absolute left-2 top-4 text-[10px] text-purple-300 font-bold opacity-50">UV</div>
                    <div className="absolute right-2 top-4 text-[10px] text-red-300 font-bold opacity-50">IR</div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                    <span>300nm (UV)</span>
                    <span>550nm</span>
                    <span>800nm (IR)</span>
                </div>
            </div>

            {/* Explanation Text */}
            <div className="flex-1 bg-space-800 p-6 rounded-xl border border-space-700 flex flex-col">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-2">
                    <Info size={14} />
                    What is happening?
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
                    {explanationText}
                    </p>
                    <SpeechControl text={explanationText} />
            </div>
      </div>
    </div>
  );
};
