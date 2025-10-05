'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FloatingDust() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Ensure the canvas is behind other content but above the background
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '0'; // Below content but above background
    
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Create particles
    const particlesCount = 200; // Increased number of particles
    const positions = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);
    
    for (let i = 0; i < particlesCount; i++) {
      // Random positions in a sphere
      const i3 = i * 3;
      const radius = 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random sizes
      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.2, // Slightly larger particles
      color: 0x10b981, // emerald-500
      transparent: true,
      opacity: 0.9, // More visible
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Position camera
    camera.position.z = 15;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate particles
      particles.rotation.x += 0.0005;
      particles.rotation.y += 0.0005;
      
      // Move particles in a gentle floating motion
      const time = Date.now() * 0.001;
      const positions = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3] += Math.sin(time * 0.1 + i) * 0.01;
        positions[i3 + 1] += Math.cos(time * 0.15 + i) * 0.01;
      }
      
      geometry.attributes.position.needsUpdate = true;
      
      renderer.render(scene, camera);
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 1, // Above the background but below other content
        mixBlendMode: 'overlay' // Try different blend modes for different effects
      }}
    />
  );
}
