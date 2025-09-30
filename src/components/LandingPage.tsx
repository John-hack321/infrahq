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

// Interactive grid with glowing cells
function InteractiveGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<Map<string, { element: HTMLDivElement; opacity: number }>>(new Map());
  const animationFrameId = useRef<number>();
  const gridSize = 40; // Size of each grid cell in pixels
  const fadeSpeed = 2.0; // Controls how fast the glow fades (higher = faster)
  
  // Track mouse position and update active cells
  const handleMouseMove = (e: MouseEvent) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Make sure coordinates are within bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    
    // Calculate which cell the cursor is in
    const cellX = Math.floor(x / gridSize) * gridSize;
    const cellY = Math.floor(y / gridSize) * gridSize;
    const cellKey = `${cellX},${cellY}`;
    
    // Get or create the cell
    let cell = cellsRef.current.get(cellKey);
    if (!cell) {
      const element = document.createElement('div');
      element.className = 'absolute transition-all duration-300';
      element.style.left = `${cellX}px`;
      element.style.top = `${cellY}px`;
      element.style.width = `${gridSize}px`;
      element.style.height = `${gridSize}px`;
      element.style.pointerEvents = 'none';
      gridRef.current.appendChild(element);
      
      cell = { element, opacity: 0 };
      cellsRef.current.set(cellKey, cell);
    }
    
    // Reset the cell's opacity to full when hovered
    cell.opacity = 1;
    updateCellStyle(cell);
  };
  
  // Update a cell's visual style based on its current opacity
  const updateCellStyle = (cell: { element: HTMLDivElement; opacity: number }) => {
    const { element, opacity } = cell;
    const glowColor = '#10b981';
    
    element.style.backgroundColor = `rgba(16, 185, 129, ${opacity * 0.1})`;
    element.style.border = `1px solid rgba(16, 185, 129, ${opacity * 0.8})`;
    element.style.boxShadow = `0 0 ${opacity * 12}px ${opacity * 6}px rgba(16, 185, 129, ${opacity * 0.7})`;
    element.style.borderRadius = '2px';
    element.style.transition = 'opacity 0.1s linear, transform 0.05s ease-out';
    element.style.transform = `scale(${1 + opacity * 0.1})`;
  };
  
  // Animation loop to handle fading out cells
  const animate = (timestamp: number) => {
    let needsUpdate = false;
    const deltaTime = 16; // ~60fps
    
    cellsRef.current.forEach((cell, key) => {
      if (cell.opacity > 0) {
        // Decrease opacity based on time and fade speed
        cell.opacity = Math.max(0, cell.opacity - (fadeSpeed * deltaTime) / 1000);
        updateCellStyle(cell);
        needsUpdate = true;
      } else if (cell.element.parentNode) {
        // Remove the element when fully faded out
        cell.element.remove();
        cellsRef.current.delete(key);
      }
    });
    
    if (needsUpdate || cellsRef.current.size > 0) {
      animationFrameId.current = requestAnimationFrame(animate);
    } else {
      animationFrameId.current = undefined;
    }
  };
  
  // Set up and clean up event listeners and animation
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    
    // Use window for better tracking
    window.addEventListener('mousemove', handleMouseMove);
    
    // Start the animation loop if not already running
    if (!animationFrameId.current) {
      const animateLoop = (timestamp: number) => {
        animate(timestamp);
      };
      animationFrameId.current = requestAnimationFrame(animateLoop);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      
      // Clean up animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Clean up DOM elements
      cellsRef.current.forEach(cell => {
        if (cell.element.parentNode) {
          cell.element.remove();
        }
      });
      cellsRef.current.clear();
    };
  }, []);
  
  return (
    <div 
      ref={gridRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {/* Background grid lines */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          pointerEvents: 'none',
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
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-white to-red-50/20 z-0"></div>
      
      {/* Interactive Grid Background */}
      <InteractiveGrid />
      
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
