import { Center, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { buildPlate3DGroup } from '@/geometry/buildPlate3DGroup'
import type { FoldedProfile } from '@/geometry/types'

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
    />
  </>
  )
}

interface Plate3DViewerProps {
  profile: FoldedProfile
  className?: string
}

export function Plate3DViewer({ profile, className }: Plate3DViewerProps) {
  return (
    <div className={className ?? 'h-full w-full min-h-[280px] bg-zinc-950'}>
      <Canvas
        camera={{ position: [120, 80, 140], fov: 42, near: 0.1, far: 5000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#09090b' }}
      >
        <color attach="background" args={['#09090b']} />
        <Suspense fallback={null}>
          <Plate3DScene profile={profile} />
        </Suspense>
      </Canvas>
    </div>
  )
}

