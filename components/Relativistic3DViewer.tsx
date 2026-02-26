import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Float, MeshDistortMaterial, Text, MeshWobbleMaterial, Sparkles, Trail, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Relativistic3DViewerProps {
  velocity: number;
  gamma: number;
}

const HolographicAssistant = ({ velocity }: { velocity: number }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 1.5;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={meshRef} position={[3, 1.5, 0]}>
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        {/* Stylized "Space Cat" Head */}
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <MeshDistortMaterial 
            color="#ec4899" 
            speed={2} 
            distort={0.4} 
            emissive="#ec4899"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Ears */}
        <mesh position={[0.25, 0.3, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.6} />
        </mesh>
        <mesh position={[-0.25, 0.3, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.6} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.15, 0.05, 0.35]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.15, 0.05, 0.35]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.15}
          color="#ec4899"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          anchorX="center"
          anchorY="middle"
        >
          {velocity > 0.9 ? "MEOW-SPEED!" : "NAVIGATOR CAT"}
        </Text>
      </Float>
      <pointLight color="#ec4899" intensity={2} distance={3} />
    </group>
  );
};

const WarpTunnel = ({ velocity }: { velocity: number }) => {
  const tunnelRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (tunnelRef.current) {
      tunnelRef.current.rotation.z += 0.01 * (velocity + 0.1);
      // Pulse opacity with velocity
      (tunnelRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (velocity - 0.5) * 0.5);
    }
  });

  return (
    <mesh ref={tunnelRef} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[10, 10, 100, 32, 1, true]} />
      <meshBasicMaterial 
        color="#06b6d4" 
        transparent 
        opacity={0} 
        side={THREE.DoubleSide} 
        wireframe
      />
    </mesh>
  );
};

const Ship = ({ gamma, velocity }: { gamma: number; velocity: number }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      <Trail
        width={2}
        length={8}
        color={new THREE.Color("#06b6d4")}
        attenuation={(t) => t * t}
      >
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <group>
            {/* Main Body - Contracts along Z axis */}
            <mesh scale={[1, 1, 1 / gamma]}>
              <capsuleGeometry args={[0.5, 2, 4, 32]} />
              <MeshWobbleMaterial 
                color="#06b6d4" 
                speed={velocity * 5} 
                factor={velocity * 0.5}
                emissive="#06b6d4" 
                emissiveIntensity={1}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            
            {/* Engine Core */}
            <mesh position={[0, 0, 1.5 / gamma]} scale={[0.8, 0.8, 0.2]}>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshBasicMaterial color="#ec4899" />
              <pointLight color="#ec4899" intensity={5 * velocity} distance={10} />
            </mesh>

            {/* Wings */}
            <mesh position={[0.8, 0, 0]} scale={[1, 0.1, 1 / gamma]}>
              <boxGeometry args={[1, 1, 2]} />
              <meshStandardMaterial color="#1e293b" metalness={1} roughness={0} />
            </mesh>
            <mesh position={[-0.8, 0, 0]} scale={[1, 0.1, 1 / gamma]}>
              <boxGeometry args={[1, 1, 2]} />
              <meshStandardMaterial color="#1e293b" metalness={1} roughness={0} />
            </mesh>
          </group>
        </Float>
      </Trail>
      <Sparkles count={50} scale={5} size={2} speed={0.5} color="#06b6d4" />
    </group>
  );
};

const SpeedLines = ({ velocity }: { velocity: number }) => {
  const linesRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((line) => {
        line.position.z += delta * 50 * (velocity + 0.05);
        if (line.position.z > 15) line.position.z = -35;
      });
    }
  });

  return (
    <group ref={linesRef}>
      {[...Array(100)].map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30,
          Math.random() * -50
        ]}>
          <boxGeometry args={[0.01, 0.01, 5]} />
          <meshBasicMaterial 
            color={Math.random() > 0.5 ? "#06b6d4" : "#ec4899"} 
            transparent 
            opacity={0.4} 
          />
        </mesh>
      ))}
    </group>
  );
};

export const Relativistic3DViewer: React.FC<Relativistic3DViewerProps> = ({ velocity, gamma }) => {
  return (
    <div className="w-full h-full bg-[#020408] relative overflow-hidden">
      <Canvas shadows gl={{ antialias: false }}>
        <PerspectiveCamera makeDefault position={[0, 1, 10]} fov={50} />
        <Stars radius={100} depth={50} count={10000} factor={6} saturation={1} fade speed={2} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} angle={0.2} penumbra={1} intensity={2} castShadow />
        
        <OrbitControls 
          enablePan={false} 
          minDistance={5} 
          maxDistance={30} 
          autoRotate={false}
          makeDefault
        />
        
        <Ship gamma={gamma} velocity={velocity} />
        <SpeedLines velocity={velocity} />
        <WarpTunnel velocity={velocity} />
        <HolographicAssistant velocity={velocity} />
        
        {/* Grid Floor with Glow */}
        <gridHelper args={[200, 100, "#06b6d4", "#020617"]} position={[0, -5, 0]} />
        
        <fog attach="fog" args={['#020408', 5, 40]} />

        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.4} 
          />
          <ChromaticAberration offset={new THREE.Vector2(0.002 * velocity, 0.002 * velocity)} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
      
      {/* 3D Overlay Info - Redesigned for "震撼" feel */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-black/60 backdrop-blur-2xl border-l-4 border-cyan-500 p-6 rounded-r-3xl shadow-2xl transform -skew-x-12">
              <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-2">System_Status</div>
              <div className="text-4xl font-black text-white tracking-tighter">
                {(100/gamma).toFixed(1)}% <span className="text-xs text-slate-500 uppercase">Length_Distortion</span>
              </div>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Relativistic_Factor</div>
            <div className="text-5xl font-black text-white tracking-tighter">
              γ <span className="text-rose-500">{gamma.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 px-8 py-2 rounded-full">
            <div className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.5em] animate-pulse">
              Quantum_Field_Active // Warp_Drive_Engaged
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

