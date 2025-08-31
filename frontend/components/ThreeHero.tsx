'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Stars } from '@react-three/drei'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'

function TorusKnot() {
  return (
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh rotation={[0.6, 0.2, 0]}>
        <torusKnotGeometry args={[1.4, 0.45, 220, 32]} />
        <meshStandardMaterial color="#00a8ff" metalness={0.6} roughness={0.25} emissive="#0052ff" emissiveIntensity={0.35} />
      </mesh>
    </Float>
  )
}

function InteractiveRing() {
  const group = useRef<THREE.Group>(null)
  const count = 36
  const radius = 2.2
  const nodes = useMemo(() => new Array(count).fill(0).map((_, i) => {
    const a = (i / count) * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0)
  }), [count])

  useFrame(({ pointer }) => {
    if (!group.current) return
    // repel/attract effect
    group.current.children.forEach((child, idx) => {
      const m = child as THREE.Mesh
      const p = nodes[idx]
      const mouse = new THREE.Vector3(pointer.x * 3, pointer.y * 2, 0)
      const dir = m.position.clone().sub(mouse)
      const dist = Math.max(0.2, dir.length())
      const force = 0.4 / (dist * dist)
      // blend towards original ring position plus repel offset
      const target = p.clone().add(dir.normalize().multiplyScalar(force))
      m.position.lerp(target, 0.08)
    })
  })

  return (
    <group ref={group}>
      {nodes.map((p, idx) => (
        <mesh key={idx} position={p.toArray()}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#00a8ff" emissive="#0052ff" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

export default function ThreeHero() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <color attach="background" args={[0, 0, 0]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 2]} intensity={1.2} />
      <directionalLight position={[-3, -2, -2]} intensity={0.3} color="#ffc400" />
      <Suspense fallback={null}>
        <TorusKnot />
        <InteractiveRing />
        <Stars radius={50} depth={20} count={1200} factor={3} saturation={0} speed={0.6} />
      </Suspense>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
    </Canvas>
  )
}


