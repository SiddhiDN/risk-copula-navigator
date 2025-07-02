
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';

const BlobShape = () => {
  const meshRef = useRef<Mesh>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 32, 32);
    const positions = geo.attributes.position.array as Float32Array;
    
    // Deform the sphere to create a blob shape
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Add noise-like deformation
      const noise = Math.sin(x * 3) * Math.cos(y * 3) * Math.sin(z * 3) * 0.3;
      const distance = Math.sqrt(x * x + y * y + z * z);
      const newDistance = distance + noise;
      
      positions[i] = (x / distance) * newDistance;
      positions[i + 1] = (y / distance) * newDistance;
      positions[i + 2] = (z / distance) * newDistance;
    }
    
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#ffffff') },
        uColor2: { value: new THREE.Color('#ff0000') },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float uTime;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          float wave = sin(pos.x * 2.0 + uTime) * cos(pos.y * 2.0 + uTime) * 0.1;
          pos += normal * wave;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          float pattern = sin(vPosition.x * 15.0) * sin(vPosition.y * 15.0) * sin(vPosition.z * 15.0);
          float dots = step(0.3, pattern);
          
          vec3 color = mix(uColor1, uColor2, dots);
          
          // Add rim lighting
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          rim = pow(rim, 2.0);
          color += uColor2 * rim * 0.5;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
    });
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = clock.getElapsedTime();
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} scale={[2, 1.5, 1.5]} />
  );
};

const DottedLine = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { geometry, material } = useMemo(() => {
    const positions = [];
    const colors = [];
    
    // Create dotted line pattern
    for (let i = 0; i < 100; i++) {
      const x = (i - 50) * 0.1;
      const y = Math.sin(i * 0.2) * 0.1;
      const z = 0;
      
      positions.push(x, y, z);
      colors.push(1, 0, 0); // Red color
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    
    return { geometry: geo, material: mat };
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] = Math.sin((i / 3) * 0.2 + clock.getElapsedTime() * 2) * 0.1;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} position={[0, -2, 0]} />
  );
};

const Scene = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0, 5);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <BlobShape />
      <DottedLine />
    </>
  );
};

export const Html = () => {
  const [titleVisible, setTitleVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  useEffect(() => {
    const titleTimer = setTimeout(() => setTitleVisible(true), 500);
    const buttonTimer = setTimeout(() => setButtonVisible(true), 1500);
    
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <Scene />
        </Canvas>
      </div>

      {/* Text Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        <div 
          className={`text-6xl md:text-8xl font-black text-white mb-8 text-center transition-all duration-1000 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ 
            fontFamily: 'Arial Black, sans-serif',
            letterSpacing: '0.05em',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
          }}
        >
          COPULA RISK MANAGER
        </div>
      </div>

      {/* Scroll Button */}
      <div 
        className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-1000 ${
          buttonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <button className="group border-2 border-white/30 rounded-full px-8 py-4 text-white font-medium hover:border-white/60 transition-all duration-300 pointer-events-auto backdrop-blur-sm bg-white/5">
          <div className="flex items-center gap-3">
            <span className="text-lg">Scroll to explore</span>
            <div className="transform group-hover:translate-y-1 transition-transform duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Html;
