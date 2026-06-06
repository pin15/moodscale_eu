import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { ScreenQuad, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { onEnterViewport, prefersReducedMotion } from "@/components/motion/reducedMotion";
import styles from "./DoubleExposureHead.module.css";

export interface SceneProps {
  sceneSrc: string;
  depthSrc: string;
  maskSrc: string;
  intensity?: number;
  facing?: "left" | "right";
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0); // full-screen quad, no camera
  }
`;

const fragmentShader = `
  uniform sampler2D uScene;
  uniform sampler2D uDepth;
  uniform sampler2D uMask;     // alpha = inside head
  uniform vec2  uPointer;      // -1..1, eased
  uniform float uScroll;       // small parallax from scroll progress, eased
  uniform float uIntensity;    // displacement strength (subtle)
  uniform float uFlip;         // +1 keep, -1 mirror horizontally (facing)
  varying vec2 vUv;

  void main() {
    // Orientation: mirror horizontally for "right"-facing layouts.
    vec2 uv = vec2(uFlip > 0.0 ? vUv.x : 1.0 - vUv.x, vUv.y);

    float depth = texture2D(uDepth, uv).r;          // 0 far .. 1 near
    // Near pixels move more than far pixels -> parallax. Flip pointer.x with
    // the orientation so the drift direction stays natural after mirroring.
    vec2 pointer = vec2(uPointer.x * uFlip, uPointer.y);
    vec2 offset = (pointer * uIntensity + vec2(0.0, uScroll * 0.5 * uIntensity))
                  * (depth - 0.5) * 2.0;

    vec3 col = texture2D(uScene, uv + offset).rgb;
    float mask = texture2D(uMask, uv).a;
    gl_FragColor = vec4(col, mask);                 // transparent outside silhouette
  }
`;

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function hasWebGL(): boolean {
  if (typeof window === "undefined" || !("WebGLRenderingContext" in window)) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function HeadQuad({ sceneSrc, depthSrc, maskSrc, intensity, facing, active, onReady }: {
  sceneSrc: string;
  depthSrc: string;
  maskSrc: string;
  intensity: number;
  facing: "left" | "right";
  active: MutableRefObject<boolean>;
  onReady: () => void;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const announced = useRef(false);

  const [scene, depth, mask] = useTexture([sceneSrc, depthSrc, maskSrc]);

  useMemo(() => {
    scene.colorSpace = THREE.SRGBColorSpace;
    depth.colorSpace = THREE.NoColorSpace;
    mask.colorSpace = THREE.NoColorSpace;
    for (const t of [scene, depth, mask]) {
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.needsUpdate = true;
    }
  }, [scene, depth, mask]);

  const uniforms = useMemo(
    () => ({
      uScene: { value: scene },
      uDepth: { value: depth },
      uMask: { value: mask },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uIntensity: { value: intensity },
      uFlip: { value: facing === "right" ? -1 : 1 },
    }),
    [scene, depth, mask],
  );

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uIntensity.value = intensity;
  }, [intensity]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uFlip.value = facing === "right" ? -1 : 1;
  }, [facing]);

  const scrollTarget = useRef(0);
  useEffect(() => {
    let kill: (() => void) | undefined;
    let cancelled = false;
    import("@/components/motion/gsap.client")
      .then(({ ScrollTrigger }) => {
        if (cancelled) return;
        const st = ScrollTrigger.create({
          trigger: "[data-fx='double-exposure-head']",
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            scrollTarget.current = self.progress * 2 - 1;
          },
        });
        kill = () => st.kill();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      kill?.();
    };
  }, []);

  useFrame((state: RootState, dt: number) => {
    const mat = matRef.current;
    if (!mat || !active.current) return;

    const dtc = Math.min(dt, 0.1);
    const t = state.clock.elapsedTime;

    const driftX = Math.sin(t * 0.18) * 0.15;
    const driftY = Math.cos(t * 0.13) * 0.15;

    const targetX = THREE.MathUtils.clamp(state.pointer.x + driftX, -1, 1);
    const targetY = THREE.MathUtils.clamp(state.pointer.y + driftY, -1, 1);

    const p = mat.uniforms.uPointer.value as THREE.Vector2;
    p.x = damp(p.x, targetX, 3, dtc);
    p.y = damp(p.y, targetY, 3, dtc);
    mat.uniforms.uScroll.value = damp(mat.uniforms.uScroll.value, scrollTarget.current, 3, dtc);

    if (!announced.current) {
      announced.current = true;
      onReady();
    }
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </ScreenQuad>
  );
}

function ContextLossGuard({
  onLost,
  active,
}: {
  onLost: () => void;
  active: MutableRefObject<boolean>;
}) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      active.current = false;
      onLost();
    };
    canvas.addEventListener("webglcontextlost", lost as EventListener, false);
    return () => canvas.removeEventListener("webglcontextlost", lost as EventListener);
  }, [gl, onLost, active]);
  return null;
}

export default function Scene({
  sceneSrc,
  depthSrc,
  maskSrc,
  intensity = 0.06,
  facing = "left",
}: SceneProps) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [dead, setDead] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const inView = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion() || !hasWebGL()) return;
    setEnabled(true);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!enabled || !wrapRef.current) return;
    const el = wrapRef.current;

    const sync = () => {
      active.current = inView.current && !document.hidden;
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView.current = entries.some((e) => e.isIntersecting);
        sync();
      },
      { rootMargin: "0px" },
    );
    const stop = onEnterViewport(
      el,
      () => {
        setMounted(true);
        io.observe(el);
      },
      "200px 0px",
    );

    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [enabled]);

  if (!enabled || dead) return null;

  return (
    <div
      ref={wrapRef}
      className={styles.canvas}
      data-ready={ready ? "true" : "false"}
      aria-hidden="true"
    >
      {mounted && (
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
          frameloop="always"
          style={{ width: "100%", height: "100%" }}
        >
          <ContextLossGuard active={active} onLost={() => setDead(true)} />
          <Suspense fallback={null}>
            <HeadQuad
              sceneSrc={sceneSrc}
              depthSrc={depthSrc}
              maskSrc={maskSrc}
              intensity={intensity}
              facing={facing}
              active={active}
              onReady={() => setReady(true)}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
