import { Center, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { buildPlate3DGroup } from '@/geometry/buildPlate3DGroup'
import type { FoldedProfile } from '@/geometry/types'
import { useWebGLAvailable } from '@/hooks/useWebGLAvailable'

const MAX_DPR = 2

function getDeviceDpr(): number {
  if (typeof window === 'undefined') return 1
  return Math.min(window.devicePixelRatio || 1, MAX_DPR)
}

interface Plate3DSceneProps {
  profile: FoldedProfile
}

function Plate3DScene({ profile }: Plate3DSceneProps) {
  const group = useMemo(() => buildPlate3DGroup(profile), [profile])

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
          antialias: true,
          alpha: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(getDeviceDpr())
          gl.domElement.style.touchAction = 'none'
        }}
      >
        <color attach="background" args={['#09090b']} />
        <Suspense fallback={null}>
          <Plate3DScene profile={profile} />
        </Suspense>
      </Canvas>
    </div>
  )
}
