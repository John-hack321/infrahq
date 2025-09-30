'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Interactive 3D Torus Knot
function Interactive3DObject() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const previousMouse = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!isDragging && groupRef.current) {
      groupRef.current.rotation.y += 0.002;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.001;
    }
  });

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotation.x;
      groupRef.current.rotation.y = rotation.y;
    }
  }, [rotation]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    previousMouse.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      
      setRotation(prev => ({
        x: prev.x + deltaY * 0.01,
        y: prev.y + deltaX * 0.01
      }));
      
      previousMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging]);

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[0.9, 0.9, 0.9]}>
      <mesh 
        ref={meshRef} 
        onPointerDown={handlePointerDown}
        castShadow
      >
        <torusKnotGeometry args={[1.8, 0.4, 120, 20]} />
        <meshStandardMaterial
          color="#10b981"
          roughness={0.1}
          metalness={0.9}
          emissive="#10b981"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

// CSS-based interactive grid background
function InteractiveGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #10b981 1px, transparent 1px),
            linear-gradient(to bottom, #10b981 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 10%, transparent 70%)',
        }}
      />
      
      {/* Animated dots */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #10b981 0%, transparent 70%)',
          opacity: 0.5,
          backgroundSize: '200px 200px',
          backgroundPosition: 'var(--mouse-x) var(--mouse-y)',
          transition: 'background-position 0.1s ease-out',
          pointerEvents: 'none',
        }}
      />
      
      {/* Mouse tracking */}
      <div 
        className="absolute inset-0"
        onMouseMove={(e) => {
          const x = e.clientX / window.innerWidth * 100;
          const y = e.clientY / window.innerHeight * 100;
          document.documentElement.style.setProperty('--mouse-x', `${x}%`);
          document.documentElement.style.setProperty('--mouse-y', `${y}%`);
        }}
      />
    </div>
  );
}

// Ambient particles
function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();
  const particleCount = 80;

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 25;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

    const isRed = Math.random() > 0.75;
    colors[i * 3] = isRed ? 0.9 : 0.1;
    colors[i * 3 + 1] = isRed ? 0.3 : 0.7;
    colors[i * 3 + 2] = isRed ? 0.3 : 0.5;
  }

  useFrame((state) => {
    if (pointsRef.current) {
      const positions = (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
        
        positions[i3] += mouse.x * 0.003;
        positions[i3 + 1] -= mouse.y * 0.003;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Scene
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ef4444" />
      <AmbientParticles />
      <Interactive3DObject />
    </>
  );
}

export default function InfraredLanding() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Interactive Grid Background */}
      <InteractiveGrid />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-white to-red-50/20 z-0"></div>
      
      {/* Main Content Grid */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-12 flex items-center">
        <div className="grid grid-cols-12 gap-16 w-full items-center">
          
          {/* Left Column - Text Content */}
          <div className="col-span-12 lg:col-span-6 space-y-10">
            {/* Logo/Brand */}
            <div className="space-y-3">
              <div className="inline-block">
                <h1 className="text-7xl font-bold tracking-tight text-gray-900">
                  Infrared
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-red-500 mt-2"></div>
              </div>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-6">
              <h2 className="text-5xl font-light text-gray-900 leading-tight">
                We build companies<br />that shape the future
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg font-light">
                A venture studio at the frontier of technology. We identify paradigm shifts, 
                architect solutions, and launch companies that define new markets.
              </p>
            </div>

            {/* Stats/Quick Info */}
            <div className="flex gap-12 pt-4">
              <div>
                <div className="text-4xl font-bold text-emerald-600">10+</div>
                <div className="text-sm text-gray-500 mt-1">Companies Built</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-600">$2B+</div>
                <div className="text-sm text-gray-500 mt-1">Value Created</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-600">4</div>
                <div className="text-sm text-gray-500 mt-1">Verticals</div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-4 pt-6">
              <button className="px-8 py-4 bg-gray-900 text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors duration-200">
                VIEW PORTFOLIO
              </button>
              <button className="px-8 py-4 border border-gray-300 text-gray-900 text-sm font-medium tracking-wide hover:border-gray-900 transition-colors duration-200">
                PARTNER WITH US
              </button>
            </div>
          </div>

          {/* Right Column - 3D Canvas */}
          <div className="col-span-12 lg:col-span-6 h-full flex items-center justify-center overflow-visible">
            <div className="w-full h-[600px] -mr-16 lg:-mr-24 xl:-mr-32">
              <Canvas
                camera={{ position: [0, 0, 10], fov: 40 }}
                style={{ background: 'transparent' }}
              >
                <Scene />
              </Canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="absolute bottom-8 left-12 right-12 z-10 flex justify-between items-center">
        <div className="text-xs text-gray-400 tracking-wider">
          SAN FRANCISCO · LONDON · SINGAPORE
        </div>
        <div className="text-xs text-gray-400">
          © 2025 INFRARED VENTURES
        </div>
      </div>
    </div>
  );
}
