import { Center, OrbitControls } from '@react-three/drei'
import { Canvas, type RootState } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildPlate3DGroup } from '@/geometry/buildPlate3DGroup'
import type { FoldedProfile } from '@/geometry/types'
import { useWebGLAvailable } from '@/hooks/useWebGLAvailable'

const MAX_DPR = 2

function getDeviceDpr(): number {
  if (typeof window === 'undefined') return 1
  return Math.min(window.devicePixelRatio || 1, MAX_DPR)
}

function disposeGroup(group: THREE.Object3D) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      const mat = obj.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat.dispose()
    }
    if (obj instanceof THREE.Line) {
      obj.geometry.dispose()
      const mat = obj.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat.dispose()
    }
  })
}

interface Plate3DSceneProps {
  profile: FoldedProfile
}

function Plate3DScene({ profile }: Plate3DSceneProps) {
  const group = useMemo(() => buildPlate3DGroup(profile), [profile])

  useEffect(() => () => disposeGroup(group), [group])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[80, 120, 60]} intensity={1.1} />
      <directionalLight position={[-60, 40, -40]} intensity={0.35} />
      <Center>
        <primitive object={group} />
      </Center>
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={20}
        maxDistance={800}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </>
  )
}

interface Plate3DViewerProps {
  profile: FoldedProfile
  className?: string
}

export function Plate3DViewer({ profile, className }: Plate3DViewerProps) {
  const webgl = useWebGLAvailable()
  const glRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    return () => {
      const gl = glRef.current
      if (gl) {
        gl.dispose()
        gl.forceContextLoss()
        glRef.current = null
      }
    }
  }, [])

  const handleCreated = (state: RootState) => {
    const gl = state.gl
    glRef.current = gl
    gl.setPixelRatio(getDeviceDpr())
    gl.domElement.style.touchAction = 'none'
  }

  if (webgl === false) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-950 p-4 text-center text-sm text-zinc-400 ${className ?? ''}`}
      >
        3D preview is not available — WebGL is disabled or unsupported on this device.
      </div>
    )
  }

  if (webgl === null) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-950 text-sm text-zinc-500 ${className ?? ''}`}
      >
        Loading 3D…
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden bg-zinc-950 ${className ?? 'h-full min-h-[240px] w-full'}`}
      style={{ touchAction: 'none' }}
    >
      <Canvas
        className="block h-full w-full"
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        camera={{ position: [120, 80, 140], fov: 42, near: 0.1, far: 5000 }}
        dpr={getDeviceDpr()}
        frameloop="always"
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={handleCreated}
      >
        <color attach="background" args={['#09090b']} />
        <Suspense fallback={null}>
          <Plate3DScene profile={profile} />
        </Suspense>
      </Canvas>
    </div>
  )
}
