import type { Application } from "@splinetool/runtime";

/**
 * Drives the humanoid Spline scene's head and upper body from code.
 *
 * Spline has no public API for posing objects that its own events also drive
 * (the scene's look-at turns the head and torso toward the cursor), so this
 * reaches into runtime internals. Every access is guarded: `attachHumanoidRig`
 * returns null when something is missing, and the scene then keeps its
 * built-in behaviour.
 *
 *  - `app._scene` is walked by name path; the public getAllObjects() is flat.
 *  - Spline turns matrixAutoUpdate off and rebuilds a node's matrix only when
 *    its own events touch it. Each joint's `updateMatrix` is wrapped so those
 *    writes (the look-at) are blended with our pose instead of winning.
 *  - `app._renderer.renderSplineScene` is wrapped to advance our pose and
 *    rebuild the joints' matrices right before each frame is drawn.
 */

// Minimal structural types for the three.js-style objects Spline exposes.
interface Euler {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): Euler;
  copy(e: Euler): Euler;
}
interface Mat4 {
  elements: ArrayLike<number>;
}
interface SceneNode {
  name: string;
  children: SceneNode[];
  rotation: Euler;
  matrixWorld: Mat4;
  updateMatrix(): void;
  updateMatrixWorld?(force?: boolean): void;
}
interface CameraLike {
  matrixWorldInverse: Mat4;
  projectionMatrix: Mat4;
}
interface Renderer {
  renderSplineScene?: (scene: unknown, camera: unknown) => unknown;
}
interface Internals {
  disposed?: boolean;
  _scene?: { children?: SceneNode[] };
  _renderer?: Renderer;
  _skipRender?: boolean;
  requestRender?: () => void;
}

/**
 * Head and upper-body pose, as rotations (radians) from the scene's neutral
 * stance, in the viewer's terms:
 *   headTurn  + turns the face toward the viewer's right
 *   headNod   + tips the face down
 *   headTilt  + tilts the head toward the viewer's right
 *   bodyTurn  + turns the torso (above the waist) toward the viewer's right
 *   bodyLean  + leans the torso toward the viewer's right
 */
export type BotPose = [headTurn: number, headNod: number, headTilt: number, bodyTurn: number, bodyLean: number];
export const BOT_NEUTRAL: BotPose = [0, 0, 0, 0, 0];

/**
 * Controlled nodes and how the pose maps onto their Euler angles. Both are
 * authored at zero rotation; the look-at only ever swings them away from it.
 */
const JOINTS = [
  {
    path: "Scene 1/Bot/Top part",
    euler: ([, , , turn, lean]: BotPose) => [0, turn, -lean] as const,
  },
  {
    path: "Scene 1/Bot/Top part/Head",
    euler: ([turn, nod, tilt]: BotPose) => [nod, turn, -tilt] as const,
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Column-major 4x4 times a homogeneous vector, as three.js stores matrices. */
function mul(m: ArrayLike<number>, v: number[]) {
  const out = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) out[i] = m[i] * v[0] + m[i + 4] * v[1] + m[i + 8] * v[2] + m[i + 12] * v[3];
  return out;
}

type Joint = {
  node: SceneNode;
  /** Latest rotation Spline itself wrote (the look-at). */
  anim: Euler;
  original: () => void;
  euler: (pose: BotPose) => readonly [number, number, number];
};

/**
 * Arm nodes whose idle swing can be pulled in toward the body: the shoulder
 * group spreads on z, the elbow bends outward on y. Both arms are instances
 * of the same component, so the paths mirror.
 */
const ARM_NODES = [
  { path: "Scene 1/Bot/Top part/Hand/Hand LEFT", axis: "z", kind: "spread" },
  { path: "Scene 1/Bot/Top part/Hand Instance/Hand LEFT", axis: "z", kind: "spread" },
  { path: "Scene 1/Bot/Top part/Hand/Hand LEFT/arm/elbow", axis: "y", kind: "elbow" },
  { path: "Scene 1/Bot/Top part/Hand Instance/Hand LEFT/arm/elbow", axis: "y", kind: "elbow" },
] as const;
/** At full compaction the spread and the elbow's outward bend keep this much. */
const ARMS_IN_SPREAD = 0.45;
const ARMS_IN_ELBOW = 0.6;

type ArmNode = {
  node: SceneNode;
  anim: Euler;
  axis: "y" | "z";
  kind: "spread" | "elbow";
  original: () => void;
};

export type HumanoidRig = {
  /** Called once per rendered frame, before the pose is applied. */
  onFrame: ((dt: number) => void) | null;
  /**
   * Pull the arms in toward the body: 0 leaves the scene's idle swing alone,
   * 1 keeps it close (for narrow screens). Eased, so changes don't pop.
   */
  setArmsIn(amount: number): void;
  /**
   * Where a point on a node lands on screen, in normalised device coords
   * (-1..1, y up), as of the last rendered frame. `offset` is in the node's
   * own space. Null before the first frame or for an unknown path.
   */
  project(path: string, offset: readonly [number, number, number]): { x: number; y: number } | null;
  /**
   * Set the target pose and how much it overrides the scene's own look-at
   * (0 = Spline's look-at, 1 = fully ours). `rate` is the pose's approach
   * speed per second; `weightRate` (defaults to `rate`) is how fast the
   * override itself blends in or out.
   */
  drive(pose: BotPose, weight: number, rate?: number, weightRate?: number): void;
  /** Make sure Spline renders the next frame. */
  wake(): void;
  dispose(): void;
};

/** True once Spline has torn the app down (e.g. a React dev double-mount). */
export function isAppDisposed(app: Application) {
  return (app as unknown as Internals).disposed === true;
}

export function attachHumanoidRig(app: Application): HumanoidRig | null {
  const internals = app as unknown as Internals;
  if (internals.disposed) return null;
  const renderer = internals._renderer;
  const renderScene = renderer?.renderSplineScene;
  const sceneRoots = internals._scene?.children;
  if (!renderer || !renderScene || !sceneRoots) return null;

  // Index every node by its name path.
  const byPath = new Map<string, SceneNode>();
  const walk = (node: SceneNode, path: string) => {
    byPath.set(path, node);
    node.children?.forEach((c) => walk(c, `${path}/${c.name}`));
  };
  sceneRoots.forEach((n) => walk(n, n.name));

  const nodes = JOINTS.map((j) => byPath.get(j.path));
  if (nodes.some((n) => !n)) return null;

  let pose: BotPose = [...BOT_NEUTRAL];
  let target: BotPose = [...BOT_NEUTRAL];
  let weight = 0;
  let targetWeight = 0;
  let armsIn = 0;
  let targetArmsIn = 0;
  let lastCamera: CameraLike | null = null;
  // Points whose screen position is wanted, refreshed right after each draw
  // (while the posed matrices are still in place).
  const anchors = new Map<string, { path: string; offset: readonly [number, number, number]; ndc: { x: number; y: number } | null }>();
  const toNdc = (path: string, offset: readonly [number, number, number]) => {
    const node = byPath.get(path);
    if (!node || !lastCamera) return null;
    let v = mul(node.matrixWorld.elements, [offset[0], offset[1], offset[2], 1]);
    v = mul(lastCamera.matrixWorldInverse.elements, v);
    v = mul(lastCamera.projectionMatrix.elements, v);
    return v[3] ? { x: v[0] / v[3], y: v[1] / v[3] } : null;
  };
  let rate = 8;
  let weightRate = 8;
  let applied = false;
  let inOurPass = false;

  const joints: Joint[] = JOINTS.map((j, i) => {
    const node = nodes[i]!;
    const anim = new (node.rotation.constructor as new () => Euler)().copy(node.rotation);
    return { node, anim, original: node.updateMatrix.bind(node), euler: j.euler };
  });

  // Blend Spline's own write with our pose whenever a joint's matrix is built.
  // The blended rotation exists only while the matrix is composed; the node
  // gets its pure look-at rotation straight back, because Spline's look-at
  // lerps from the node's current rotation and would otherwise chase our
  // blend and snap the head instead of easing it.
  joints.forEach((joint) => {
    joint.node.updateMatrix = () => {
      const r = joint.node.rotation;
      if (!inOurPass) joint.anim.copy(r);
      if (weight > 0) {
        const [x, y, z] = joint.euler(pose);
        const a = joint.anim;
        r.set(a.x + (x - a.x) * weight, a.y + (y - a.y) * weight, a.z + (z - a.z) * weight);
        joint.original();
        r.copy(joint.anim);
      } else {
        joint.original();
      }
    };
  });

  // Arms: scale the idle swing's spread toward the body. Spline's tweens write
  // absolute values, so scaling what it wrote and restoring it afterwards
  // (the matrix keeps the scaled value) never compounds.
  const arms: ArmNode[] = [];
  ARM_NODES.forEach((a) => {
    const node = byPath.get(a.path);
    if (!node) return; // scene changed: skip quietly, the rest still works
    const anim = new (node.rotation.constructor as new () => Euler)().copy(node.rotation);
    arms.push({ node, anim, axis: a.axis, kind: a.kind, original: node.updateMatrix.bind(node) });
  });
  arms.forEach((arm) => {
    arm.node.updateMatrix = () => {
      const r = arm.node.rotation;
      if (!inOurPass) arm.anim.copy(r);
      const keep = 1 - armsIn * (1 - (arm.kind === "spread" ? ARMS_IN_SPREAD : ARMS_IN_ELBOW));
      if (keep < 1) {
        const a = arm.anim;
        r.set(a.x, arm.axis === "y" ? a.y * keep : a.y, arm.axis === "z" ? a.z * keep : a.z);
        arm.original();
        r.copy(a);
      } else {
        arm.original();
      }
    };
  });

  const wake = () => {
    internals._skipRender = false;
    internals.requestRender?.();
  };

  const step = (dt: number) => {
    const k = 1 - Math.exp(-rate * dt);
    const kw = 1 - Math.exp(-weightRate * dt);
    pose = pose.map((v, i) => v + (target[i] - v) * k) as BotPose;
    weight += (targetWeight - weight) * kw;

    // Arms: rebuild their matrices with the current compaction every frame.
    armsIn += (targetArmsIn - armsIn) * (1 - Math.exp(-3 * dt));
    if (Math.abs(targetArmsIn - armsIn) < 0.002) armsIn = targetArmsIn;
    if (armsIn > 0 || arms.some((a) => a.node.rotation !== a.anim)) {
      inOurPass = true;
      arms.forEach((a) => a.node.updateMatrix());
      inOurPass = false;
      internals._skipRender = false;
    }
    if (weight < 0.002 && targetWeight === 0) weight = 0;
    if (weight === 0 && !applied) return;

    inOurPass = true;
    if (weight === 0) {
      // Hand the joints back to Spline exactly where it left them.
      joints.forEach((j) => j.node.rotation.copy(j.anim));
      applied = false;
    } else {
      applied = true;
    }
    joints.forEach((j) => j.node.updateMatrix());
    inOurPass = false;
    internals._skipRender = false;
  };

  const rig: HumanoidRig = {
    onFrame: null,
    drive(nextPose, nextWeight, nextRate = 8, nextWeightRate = nextRate) {
      target = [...nextPose];
      targetWeight = clamp(nextWeight, 0, 1);
      rate = nextRate;
      weightRate = nextWeightRate;
    },
    setArmsIn(amount) {
      targetArmsIn = clamp(amount, 0, 1);
    },
    project(path, offset) {
      const key = `${path}|${offset.join(",")}`;
      let a = anchors.get(key);
      if (!a) {
        a = { path, offset, ndc: null };
        anchors.set(key, a);
      }
      return a.ndc;
    },
    wake,
    dispose() {
      renderer.renderSplineScene = renderScene;
      joints.forEach((j) => {
        j.node.rotation.copy(j.anim);
        j.node.updateMatrix = j.original;
        j.original();
      });
      arms.forEach((a) => {
        a.node.rotation.copy(a.anim);
        a.node.updateMatrix = a.original;
        a.original();
      });
    },
  };

  let last = performance.now();
  renderer.renderSplineScene = (scene: unknown, camera: unknown) => {
    lastCamera = camera as CameraLike;
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    try {
      rig.onFrame?.(dt);
      step(dt);
    } catch {
      // Never let the rig break Spline's own render.
    }
    const result = renderScene.call(renderer, scene, camera);
    // Screen positions are read now, from the matrices the frame was drawn with.
    anchors.forEach((a) => {
      a.ndc = toNdc(a.path, a.offset);
    });
    // The frame was drawn from blended matrices. Spline's look-at reads the
    // node's matrices, not its rotation, as the start of its own easing, so
    // rebuild the pure ones now; the next frame blends again before drawing.
    if (applied) {
      inOurPass = true;
      joints.forEach((j) => {
        j.node.rotation.copy(j.anim);
        j.original();
        j.node.updateMatrixWorld?.(true);
      });
      inOurPass = false;
    }
    return result;
  };

  return rig;
}
