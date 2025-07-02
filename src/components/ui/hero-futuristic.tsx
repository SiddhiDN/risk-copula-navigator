
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useAspect, useTexture } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';

const TEXTUREMAP = { src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800' };
const DEPTHMAP = { src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800' };

// Post Processing component
const PostProcessing = ({
  strength = 1,
  threshold = 1,
  fullScreenEffect = true,
}: {
  strength?: number;
  threshold?: number;
  fullScreenEffect?: boolean;
}) => {
  const { gl, scene, camera } = useThree();
  const progressRef = useRef({ value: 0 });

  useFrame(({ clock }) => {
    // Animate the scan line from top to bottom
    progressRef.current.value = (Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5);
    gl.render(scene, camera);
  }, 1);

  return null;
};

const WIDTH = 300;
const HEIGHT = 300;

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);
  const meshRef = useRef<Mesh>(null);
  const [visible, setVisible] = useState(false);
  const materialRef = useRef<THREE.ShaderMaterial>();

  useEffect(() => {
    // Show image after textures load
    if (rawMap && depthMap) {
      setVisible(true);
    }
  }, [rawMap, depthMap]);

  const material = useMemo(() => {
    if (!rawMap || !depthMap) return null;

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: rawMap },
        uDepthMap: { value: depthMap },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uProgress: { value: 0 },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform sampler2D uDepthMap;
        uniform vec2 uPointer;
        uniform float uProgress;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          float strength = 0.01;
          vec4 depth = texture2D(uDepthMap, vUv);
          vec2 distortedUv = vUv + depth.r * uPointer * strength;
          vec4 color = texture2D(uTexture, distortedUv);
          
          // Add scanning effect
          float scanLine = abs(vUv.y - uProgress);
          float scanWidth = 0.02;
          float scan = 1.0 - smoothstep(0.0, scanWidth, scanLine);
          
          // Add grid effect
          vec2 grid = fract(vUv * 120.0) - 0.5;
          float gridDist = length(grid);
          float gridEffect = 1.0 - smoothstep(0.4, 0.5, gridDist);
          
          // Combine effects
          vec3 scanColor = vec3(1.0, 0.0, 0.0) * scan * 0.5;
          vec3 gridColor = vec3(0.0, 1.0, 0.0) * gridEffect * 0.1;
          
          gl_FragColor = vec4(color.rgb + scanColor + gridColor, 1.0);
        }
      `,
      transparent: true,
    });

    materialRef.current = shaderMaterial;
    return shaderMaterial;
  }, [rawMap, depthMap]);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock, pointer }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = (Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5);
      materialRef.current.uniforms.uPointer.value = pointer;
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
    
    // Smooth appearance
    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as any;
      if ('opacity' in mat) {
        mat.opacity = THREE.MathUtils.lerp(
          mat.opacity,
          visible ? 1 : 0,
          0.07
        );
      }
    }
  });

  const scaleFactor = 0.40;
  
  if (!material) return null;

  return (
    <mesh ref={meshRef} scale={[w * scaleFactor, h * scaleFactor, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
};

export const Html = () => {
  const titleWords = 'Copula Risk Manager'.split(' ');
  const subtitle = 'Advanced dependence modeling for sophisticated risk analysis';
  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);
  const [subtitleDelay, setSubtitleDelay] = useState(0);

  useEffect(() => {
    // Generate random delays for glitch effect on client side only
    setDelays(titleWords.map(() => Math.random() * 0.07));
    setSubtitleDelay(Math.random() * 0.1);
  }, [titleWords.length]);

  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const timeout = setTimeout(() => setVisibleWords(visibleWords + 1), 600);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setSubtitleVisible(true), 800);
      return () => clearTimeout(timeout);
    }
  }, [visibleWords, titleWords.length]);

  return (
    <div className="h-svh">
      <div className="h-svh uppercase items-center w-full absolute z-60 pointer-events-none px-10 flex justify-center flex-col">
        <div className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold">
          <div className="flex space-x-2 lg:space-x-6 overflow-hidden text-white">
            {titleWords.map((word, index) => (
              <div
                key={index}
                className={index < visibleWords ? 'fade-in' : ''}
                style={{ animationDelay: `${index * 0.13 + (delays[index] || 0)}s`, opacity: index < visibleWords ? undefined : 0 }}
              >
                {word}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs md:text-xl xl:text-2xl 2xl:text-3xl mt-2 overflow-hidden text-white font-bold">
          <div
            className={subtitleVisible ? 'fade-in-subtitle' : ''}
            style={{ animationDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`, opacity: subtitleVisible ? undefined : 0 }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <button
        className="explore-btn"
        style={{ animationDelay: '2.2s' }}
      >
        Enter Application
        <span className="explore-arrow">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg">
            <path d="M11 5V17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 12L11 17L16 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
      </button>

      <Canvas>
        <PostProcessing fullScreenEffect={true} />
        <Scene />
      </Canvas>
    </div>
  );
};

export default Html;
