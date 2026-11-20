"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectAttribute,
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  ToneMappingEffect,
  VignetteEffect,
} from "postprocessing";
import sceneState from "./scene-state.json";
import { evaluate, scrollState, type Keyframe } from "./timeline";

/* ---------------------------------------------------------------- types */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}
interface PwObject {
  type: string;
  name: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  visible: boolean;
  fov?: number;
  near?: number;
  far?: number;
  zoom?: number;
  controls?: { type: string; maxRotation: { x: number; y: number }; easingDuration: number };
  lightType?: string;
  intensity?: number;
  color?: string;
  background?: string;
  geometry?: { type: string; radius?: number; widthSegments: number; heightSegments: number; width?: number; height?: number };
  materialId?: string;
  materials?: string[];
  object?: { assetUrl: string };
}
type MaterialDef = Record<string, string | number | boolean>;
interface Track {
  trackIdByPropPath: Record<string, string>;
  trackData: Record<string, { keyframes: { byId: Record<string, Keyframe> } }>;
}
interface UniformDef {
  dataType: string;
  value: number | { x: number; y: number };
}
interface CustomEffectDef {
  enabled: boolean;
  opacity: number;
  blendFunction: number;
  uniforms: Record<string, UniformDef>;
  fragmentShader: string;
}

const engine = sceneState.engineState as unknown as {
  sceneObjectId: string;
  defaultCameraId: string;
  pwObjects: Record<string, PwObject>;
  pwMaterials: Record<string, MaterialDef>;
  parents: Record<string, string>;
  effects: Record<string, Record<string, number | string | boolean>> & Record<string, unknown>;
  effectsOrder: string[];
};
const tracks = (sceneState.animations.sheetsById.DEFAULT_ANIMATION_SHEET_NAME.sequence.tracksByObject as unknown) as Record<string, Track>;

const MODEL_DIR = "/sites/bunnies/models/";
const localModel = (url: string) => MODEL_DIR + url.split("/").pop();

/** Resolve `var(--x)` colours against the page stylesheet. */
function resolveColor(value: string): string {
  const m = value.match(/^var\((--[^)]+)\)$/);
  if (!m) return value;
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || "#ffffff";
}

/* ------------------------------------------------------------- materials */

const COLOR_KEYS = new Set(["color", "emissive", "sheenColor", "specularColor", "attenuationColor"]);

function buildMaterial(def: MaterialDef): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial();
  // Applied in the source's key order: e.g. `reflectivity` after `ior` overrides the IOR, as in the original engine.
  for (const [k, v] of Object.entries(def)) {
    if (k === "uuid" || k === "name" || k === "type" || k === "overrideObjectId") continue;
    if (k === "side") {
      mat.side = v === "DOUBLE" ? THREE.DoubleSide : v === "BACK" ? THREE.BackSide : THREE.FrontSide;
      continue;
    }
    if (COLOR_KEYS.has(k)) {
      (mat[k as "color"] as THREE.Color).set(resolveColor(String(v)));
      continue;
    }
    if (k === "attenuationDistance") {
      mat.attenuationDistance = Number(v) > 0 ? Number(v) : Infinity;
      continue;
    }
    if (k in mat) (mat as unknown as Record<string, unknown>)[k] = v;
  }
  mat.needsUpdate = true;
  return mat;
}

/* ----------------------------------------------------------- custom FX */

/** The page's "fluted glass" post effect: vertical refracting strips over the left half of the frame. */
class FlutedGlassEffect extends Effect {
  constructor(def: CustomEffectDef) {
    const uniforms = new Map<string, THREE.Uniform>();
    for (const [name, u] of Object.entries(def.uniforms)) {
      const val = typeof u.value === "number" ? u.value : new THREE.Vector2(u.value.x, u.value.y);
      uniforms.set(name, new THREE.Uniform(val));
    }
    uniforms.set("uTime", new THREE.Uniform(0));
    // The source samples its input as `uPreviousFrame`; postprocessing exposes it as `inputBuffer`.
    const frag = def.fragmentShader
      .replace(/uniform\s+sampler2D\s+uPreviousFrame\s*;/, "")
      .replace(/\buPreviousFrame\b/g, "inputBuffer");
    super("FlutedGlass", frag, {
      blendFunction: def.blendFunction as BlendFunction,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms,
    });
    this.blendMode.opacity.value = def.opacity;
  }
  update(_r: THREE.WebGLRenderer, _i: THREE.WebGLRenderTarget, dt = 0) {
    const t = this.uniforms.get("uTime");
    if (t) t.value += dt;
  }
  setSize(width: number, height: number) {
    const r = this.uniforms.get("uResolution");
    if (r) (r.value as THREE.Vector2).set(width, height);
  }
}

/* ------------------------------------------------------------------ scene */

export function Scene({ onReady }: { onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", stencil: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    el.appendChild(renderer.domElement);

    // Build the object graph.
    const nodes = new Map<string, THREE.Object3D>();
    const materials = new Map<string, THREE.MeshPhysicalMaterial>();
    for (const [id, def] of Object.entries(engine.pwMaterials)) materials.set(id, buildMaterial(def));

    const scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera();
    const pending: Promise<void>[] = [];
    const draco = new DRACOLoader().setDecoderPath("/sites/bunnies/draco/");
    const gltf = new GLTFLoader().setDRACOLoader(draco);
    const modelCache = new Map<string, Promise<THREE.Group>>();
    const loadModel = (url: string) => {
      if (!modelCache.has(url)) modelCache.set(url, gltf.loadAsync(url).then((g) => g.scene));
      return modelCache.get(url)!;
    };

    for (const [id, o] of Object.entries(engine.pwObjects)) {
      let node: THREE.Object3D;
      if (id === engine.sceneObjectId) {
        scene.background = new THREE.Color(o.background || "#000000");
        node = scene;
      } else if (o.type === "CAMERA") {
        const cam = new THREE.PerspectiveCamera(o.fov, 16 / 9, o.near, o.far);
        cam.zoom = o.zoom ?? 1;
        if (id === engine.defaultCameraId) camera = cam;
        node = cam;
      } else if (o.type === "LIGHT" && o.lightType === "DIRECTIONAL") {
        node = new THREE.DirectionalLight(resolveColor(o.color || "#ffffff"), o.intensity);
      } else if (o.type === "MESH" && o.geometry) {
        const g = o.geometry;
        const geo =
          g.type === "SPHERE"
            ? new THREE.SphereGeometry(g.radius, g.widthSegments, g.heightSegments)
            : new THREE.PlaneGeometry(g.width, g.height, g.widthSegments, g.heightSegments);
        node = new THREE.Mesh(geo, materials.get(o.materialId || ""));
      } else if (o.type === "IMPORTED" && o.object) {
        const group = new THREE.Group();
        const mat = materials.get(o.materials?.[0] || "");
        pending.push(
          loadModel(localModel(o.object.assetUrl)).then((src) => {
            const clone = src.clone(true);
            clone.traverse((c) => {
              if ((c as THREE.Mesh).isMesh && mat) (c as THREE.Mesh).material = mat;
            });
            group.add(clone);
          }),
        );
        node = group;
      } else {
        node = new THREE.Group();
      }
      node.name = o.name;
      if (node !== scene) {
        node.position.set(o.position.x, o.position.y, o.position.z);
        node.rotation.set(o.rotation.x, o.rotation.y, o.rotation.z);
        node.scale.set(o.scale.x, o.scale.y, o.scale.z);
        node.visible = o.visible;
      }
      nodes.set(id, node);
    }
    for (const [child, parent] of Object.entries(engine.parents)) {
      const c = nodes.get(child);
      const p = nodes.get(parent);
      if (c && p && c !== p) p.add(c);
    }
    scene.add(new THREE.AmbientLight(0xffffff, 0));

    // Scroll-timeline tracks.
    type Setter = (v: number) => void;
    const bound: { keys: Keyframe[]; set: Setter }[] = [];
    for (const [id, track] of Object.entries(tracks)) {
      const target: THREE.Object3D | THREE.Material | undefined = nodes.get(id) || materials.get(id);
      if (!target) continue;
      for (const [pathJson, trackId] of Object.entries(track.trackIdByPropPath)) {
        const data = track.trackData[trackId];
        if (!data) continue;
        const keys = Object.values(data.keyframes.byId).sort((a, b) => a.position - b.position);
        if (!keys.length) continue;
        const path = JSON.parse(pathJson) as string[];
        let set: Setter | undefined;
        if (path.length === 2 && (path[0] === "position" || path[0] === "rotation" || path[0] === "scale") && target instanceof THREE.Object3D) {
          const vec = target[path[0] as "position"] as unknown as Record<string, number>;
          const axis = path[1];
          set = (v) => {
            vec[axis] = v;
          };
        } else if (path.length === 1 && target instanceof THREE.Material && path[0] in target) {
          const key = path[0];
          set = (v) => {
            (target as unknown as Record<string, number>)[key] = v;
          };
        }
        if (set) bound.push({ keys, set });
      }
    }

    // Post-processing chain, in the source's order.
    const fx = engine.effects as unknown as Record<string, Record<string, number | string | boolean>>;
    const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
    composer.addPass(new RenderPass(scene, camera));
    const main: Effect[] = [];
    const on = (k: string) => fx[k] && fx[k].enabled;
    let fluted: FlutedGlassEffect | undefined;
    for (const key of engine.effectsOrder) {
      if (!on(key)) continue;
      const e = fx[key];
      if (key === "BLOOM") {
        const bloom = new BloomEffect({
          blendFunction: Number(e.blendFunction) as BlendFunction,
          intensity: Number(e.intensity),
          radius: Number(e.radius),
          mipmapBlur: true,
          luminanceThreshold: Number(e.luminanceThreshold),
          luminanceSmoothing: Number(e.luminanceSmoothing),
        });
        // The source ties the luminance pass to its `filter` flag (false here), so the whole frame blooms.
        bloom.luminancePass.enabled = Boolean(e.filter);
        bloom.blendMode.opacity.value = Number(e.opacity);
        main.push(bloom);
      } else if (key === "VIGNETTE") {
        const v = new VignetteEffect({ blendFunction: Number(e.blendFunction) as BlendFunction, offset: Number(e.offset), darkness: Number(e.darkness) });
        v.blendMode.opacity.value = Number(e.opacity);
        main.push(v);
      } else if (key === "TONE_MAPPING") {
        main.push(
          new ToneMappingEffect({
            blendFunction: Number(e.blendFunction) as BlendFunction,
            mode: Number(e.mode),
            whitePoint: Number(e.whitePoint),
            middleGrey: Number(e.middleGrey),
            minLuminance: Number(e.minLuminance),
            averageLuminance: Number(e.averageLuminance),
            adaptationRate: Number(e.adaptationRate),
            resolution: Number(e.resolution),
          }),
        );
      } else if (key === "HUE_SATURATION") {
        const h = new HueSaturationEffect({ blendFunction: Number(e.blendFunction) as BlendFunction, hue: Number(e.hue), saturation: Number(e.saturation) });
        h.blendMode.opacity.value = Number(e.opacity);
        main.push(h);
      } else if (key === "NOISE") {
        const n = new NoiseEffect({ blendFunction: Number(e.blendFunction) as BlendFunction });
        n.blendMode.opacity.value = Number(e.opacity);
        main.push(n);
      } else if ((e as { type?: string }).type === "CUSTOM_EFFECT") {
        fluted = new FlutedGlassEffect(e as unknown as CustomEffectDef);
      }
    }
    if (main.length) composer.addPass(new EffectPass(camera, ...main));
    if (fluted) composer.addPass(new EffectPass(camera, fluted));
    if (on("SMAA")) composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: Number(fx.SMAA.preset), edgeDetectionMode: Number(fx.SMAA.edgeMode) })));

    // Tilt controls: the camera eases towards the pointer by at most ~1°.
    const camDef = engine.pwObjects[engine.defaultCameraId];
    const maxRot = camDef.controls?.maxRotation ?? { x: 0, y: 0 };
    const tiltTime = camDef.controls?.easingDuration ?? 0.6;
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const resize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let progress = scrollState.progress;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      progress = scrollState.progress;
      for (const b of bound) b.set(evaluate(b.keys, progress));
      const k = 1 - Math.exp(-dt / Math.max(0.05, tiltTime / 4));
      camera.rotation.y += (-pointer.x * maxRot.y - camera.rotation.y) * k;
      camera.rotation.x += (-pointer.y * maxRot.x - camera.rotation.x) * k;
      composer.render(dt);
      raf = requestAnimationFrame(loop);
    };

    Promise.all(pending)
      .catch(() => undefined)
      .then(() => {
        if (disposed) return;
        for (const b of bound) b.set(evaluate(b.keys, scrollState.progress));
        raf = requestAnimationFrame(loop);
        ready.current?.();
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      composer.dispose();
      renderer.dispose();
      draco.dispose();
      materials.forEach((m) => m.dispose());
      renderer.domElement.remove();
    };
  }, []);

  return <div className="pwb-scene" id="ijsk" ref={host} />;
}
