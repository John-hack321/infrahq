'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingDust from './FloatingDust';
import MobileMenu from './MobileMenu';

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
  const cellsRef = useRef<Map<string, { element: HTMLDivElement; opacity: number; lastUpdate: number }>>(new Map());
  const animationFrameId = useRef<number | null>(null);
  const activeCells = useRef<Set<string>>(new Set());
  const gridSize = 50; // Size of each grid cell in pixels
  const fadeSpeed = 0.8; // Slightly faster fade for better trail effect
  const trailLength = 40; // Number of cells to keep in the trail
  
  // Track previous positions for trail
  const positionHistory = useRef<Array<{x: number, y: number, time: number}>>([]);
  const lastUpdateTime = useRef<number>(0);
  
  // Track mouse position and update active cells
  const handleMouseMove = (e: MouseEvent) => {
    if (!gridRef.current) return;
    
    const now = Date.now();
    // Throttle updates for smoother performance
    if (now - lastUpdateTime.current < 16) return; // ~60fps
    lastUpdateTime.current = now;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Make sure coordinates are within bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    
    // Calculate which cell the cursor is in
    const centerCellX = Math.floor(x / gridSize);
    const centerCellY = Math.floor(y / gridSize);
    
    // Add current position to history
    positionHistory.current.unshift({
      x: centerCellX,
      y: centerCellY,
      time: now
    });
    
    // Keep only the last N positions for the trail
    if (positionHistory.current.length > trailLength) {
      positionHistory.current.pop();
    }
    
    // Clear the previous active cells set
    const newActiveCells = new Set<string>();
    
    // Update cells along the trail
    positionHistory.current.forEach((pos, index) => {
      const cellX = pos.x * gridSize;
      const cellY = pos.y * gridSize;
      
      // Skip if outside viewport
      if (cellX < 0 || cellY < 0 || cellX >= rect.width || cellY >= rect.height) return;
      
      const cellKey = `${cellX},${cellY}`;
      newActiveCells.add(cellKey);
      
      // Get or create the cell
      let cell = cellsRef.current.get(cellKey);
      if (!cell) {
        const element = document.createElement('div');
        element.className = 'absolute';
        element.style.left = `${cellX}px`;
        element.style.top = `${cellY}px`;
        element.style.width = `${gridSize}px`;
        element.style.height = `${gridSize}px`;
        element.style.pointerEvents = 'none';
        
        // Add null check before appending
        if (gridRef.current) {
          gridRef.current.appendChild(element);
          cell = { element, opacity: 0, lastUpdate: now };
          cellsRef.current.set(cellKey, cell);
        } else {
          return; // Skip if gridRef.current is null
        }
      }
      
      // Calculate opacity based on position in the trail (newer = more opaque)
      const opacity = 1 - (index / trailLength);
      cell.opacity = Math.max(0, Math.min(1, opacity));
      cell.lastUpdate = now;
      updateCellStyle(cell);
    });
    
    // Mark cells that are no longer active to start fading immediately
    activeCells.current.forEach(cellKey => {
      if (!newActiveCells.has(cellKey)) {
        const cell = cellsRef.current.get(cellKey);
        if (cell) {
          cell.lastUpdate = 0; // Mark for immediate fade
        }
      }
    });
    
    activeCells.current = newActiveCells;
  };
  
  // Update a cell's visual style based on its current opacity
  const updateCellStyle = (cell: { element: HTMLDivElement; opacity: number }) => {
    const { element, opacity } = cell;
    
    if (opacity <= 0) {
      // Completely hide the cell when opacity is 0
      element.style.opacity = '0';
      element.style.border = 'none';
      element.style.backgroundColor = 'transparent';
      element.style.boxShadow = 'none';
      element.style.transition = 'all 0.3s ease-out';
    } else {
      // Show the grid cell with smoother glow effect
      const scale = 0.9 + (opacity * 0.2); // Scale from 0.9 to 1.1 based on opacity
      element.style.opacity = opacity.toString();
      element.style.backgroundColor = `rgba(16, 185, 129, ${opacity * 0.15})`;
      element.style.border = `1px solid rgba(16, 185, 129, ${opacity * 0.9})`;
      element.style.boxShadow = `
        0 0 ${opacity * 20}px rgba(16, 185, 129, ${opacity * 0.7}),
        inset 0 0 ${opacity * 10}px rgba(16, 185, 129, ${opacity * 0.3})
      `;
      element.style.borderRadius = '2px';
      element.style.transform = `scale(${scale})`;
      element.style.transition = `all ${0.2 + (opacity * 0.3)}s ease-out`;
    }
  };
  
  // Animation loop to handle fading out cells
  const animate = () => {
    let hasActiveCells = false;
    
    cellsRef.current.forEach((cell, key) => {
      const isActive = activeCells.current.has(key);
      
      if (isActive) {
        // Cell is currently active, keep it lit
        hasActiveCells = true;
      } else if (cell.opacity > 0) {
        // Cell is not active, fade it out
        const fadeAmount = fadeSpeed * 0.02; // Increased fade speed for better responsiveness
        cell.opacity = Math.max(0, cell.opacity - fadeAmount);
        updateCellStyle(cell);
        hasActiveCells = true;
      } else if (cell.element.parentNode) {
        // Remove the element after it's been invisible
        cell.element.remove();
        cellsRef.current.delete(key);
      }
    });
    
    // Always continue the animation as long as we have cells
    if (cellsRef.current.size > 0) {
      if (animationFrameId.current === null) {
        const animateLoop = () => {
          animate();
          if (cellsRef.current.size > 0) {
            const id = requestAnimationFrame(animateLoop);
            animationFrameId.current = id;
          } else {
            animationFrameId.current = null;
          }
        };
        const id = requestAnimationFrame(animateLoop);
        animationFrameId.current = id;
      }
    } else {
      animationFrameId.current = null;
    }
  };
  
  // Set up and clean up event listeners and animation
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    
    // Use window for better tracking
    window.addEventListener('mousemove', handleMouseMove);
    
    // Start the animation loop
    const startAnimation = () => {
      // Always start the animation if there are cells to animate
      if (animationFrameId.current === null) {
        const animateLoop = () => {
          animate();
          if (cellsRef.current.size > 0) {
            const id = requestAnimationFrame(animateLoop);
            animationFrameId.current = id;
          } else {
            animationFrameId.current = null;
          }
        };
        const id = requestAnimationFrame(animateLoop);
        animationFrameId.current = id;
      }
    };
    
    // Start the animation immediately
    startAnimation();
    
    // Also start it on the next frame to ensure it keeps running
    const frameId = requestAnimationFrame(startAnimation);
    
    // Set up a periodic check to ensure animation keeps running
    const intervalId = setInterval(() => {
      if (cellsRef.current.size > 0 && animationFrameId.current === null) {
        startAnimation();
      }
    }, 1000); // Check every second if animation needs to be restarted
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      
      // Clean up animation frame and intervals
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      // Clear any pending animation frames
      cancelAnimationFrame(frameId);
      clearInterval(intervalId);
      
      // Clean up DOM elements
      cellsRef.current.forEach(cell => {
        if (cell.element.parentNode) {
          cell.element.remove();
        }
      });
      cellsRef.current.clear();
      activeCells.current.clear();
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
    />
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

const navLinks = [
  { name: 'About', href: '#' },
  { name: 'Blog', href: '#' },
  { name: 'Contact', href: '#' },
];

export default function InfraredLanding() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden">
      {/* Floating Dust Effect */}
      <FloatingDust />
      
      {/* Subtle gradient overlay - behind everything */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50/30 via-white to-red-50/20 -z-10"></div>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-white flex flex-col items-center justify-center"
            style={{ 
              width: '100vw', 
              height: '100vh',
              position: 'fixed',
              overflow: 'hidden'
            }}
          >
            <nav className="flex flex-col items-center justify-center space-y-10 w-full">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-4xl font-bold text-emerald-600 hover:text-black transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header - Fixed at the top */}
      <header className="fixed top-0 left-0 right-0 z-50 py-3 px-4 sm:py-4 sm:px-6 md:py-6 lg:px-12 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-black">._INFRARED</h1>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex space-x-8 xl:space-x-10">
            <a href="#" className="text-lg xl:text-xl font-bold text-emerald-600 hover:text-black transition-colors duration-200">About</a>
            <a href="#" className="text-lg xl:text-xl font-bold text-emerald-600 hover:text-black transition-colors duration-200">Blog</a>
            <a href="#" className="text-lg xl:text-xl font-bold text-emerald-600 hover:text-black transition-colors duration-200">Contact</a>
          </nav>
          
          {/* Mobile Menu Button - Only shows on mobile */}
          <div className="lg:hidden">
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Interactive Grid Background */}
      <InteractiveGrid />
      
      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 pb-8 sm:pt-20 lg:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 w-full">
          
          {/* Left Column - Text Content */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-10">
            {/* Logo/Brand */}
            <div className="space-y-2 sm:space-y-3">
              <div className="inline-block">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900">
                  Infrared
                </h1>
                <div className="h-1 w-12 sm:w-16 lg:w-24 bg-gradient-to-r from-emerald-500 to-red-500 mt-2"></div>
              </div>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light text-gray-900 leading-tight">
                We build companies<br />that shape the future
              </h2>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-lg font-light">
                A venture studio at the frontier of technology. We identify paradigm shifts, 
                architect solutions, and launch products that define new markets.
              </p>
            </div>

            {/* Stats/Quick Info */}
            <div className="flex flex-wrap gap-6 sm:gap-8 lg:gap-10 pt-2 sm:pt-4">
              <div className='flex flex-col items-start'>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600">3+</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Products in <br />Development</div>
              </div>
              <div className='flex flex-col items-start'>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600">$100k+</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Targeted Annual <br /> Revenue</div>
              </div>
              <div className='flex flex-col items-start'>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600">4</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Verticals</div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
              <div className="w-full sm:w-auto">
                <button className="relative w-full px-5 py-3 sm:px-6 sm:py-3 md:px-8 md:py-4 overflow-hidden group border-2 border-black bg-black">
                  <span className="relative z-10 text-xs sm:text-sm font-medium tracking-wide text-white group-hover:text-black transition-colors duration-300">
                    VIEW PORTFOLIO
                  </span>
                  <span className="absolute inset-0 bg-white transition-all duration-300 ease-out transform -translate-x-full group-hover:translate-x-0"></span>
                </button>
              </div>
              <div className="w-full sm:w-auto">
                <button className="relative w-full px-5 py-3 sm:px-6 sm:py-3 md:px-8 md:py-4 overflow-hidden group border-2 border-black bg-white">
                  <span className="relative z-10 text-xs sm:text-sm font-medium tracking-wide text-black group-hover:text-white transition-colors duration-300">
                    PARTNER WITH US
                  </span>
                  <span className="absolute inset-0 bg-black transition-all duration-300 ease-out transform translate-x-full group-hover:translate-x-0"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - 3D Canvas */}
          <div className="lg:col-span-6 flex items-center justify-center mt-8 lg:mt-0">
            <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] -mr-0 lg:-mr-16 xl:-mr-24">
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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 mt-8 lg:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="text-xs text-gray-400 tracking-wider">
            NAIROBI . KENYA
          </div>
          <div className="text-xs text-gray-400">
            © 2025 INFRARED VENTURES
          </div>
      </div>
    </div>
  </div>
  );
}
