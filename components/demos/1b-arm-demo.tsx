"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createCursorSmoother } from "@/components/demos/cursor-smoother";
import { asset } from "@/lib/asset";
import { DragDot, type DragPhase } from "@/components/ui/drag-dot";

/**
 * Meca500-R3 arm, rebuilt in three.js from the URDF published in
 * github.com/gilesknap/robot-arm-sim (robots/Meca500-R3/robot.urdf).
 *
 * Joint origins, axes and limits are copied verbatim from that URDF, and the
 * meshes are the repo's own STL files decimated and packed to glB. Upstream
 * drives the six joints with sliders; here they track the cursor, follow the
 * manual controls, or play a scripted action — all clamped to the same limits.
 * In cursor mode the arm reaches toward the pointer and the wrist pitches to
 * aim the claw gripper (built here, not in the URDF) straight at it.
 */

type Joint = {
  name: string;
  label: string;
  mesh: string;
  origin: [number, number, number];
  axis: [number, number, number];
  limit: [number, number];
  visual: [number, number, number];
};

const BASE_MESH = "A0";

export const ARM_JOINTS: Joint[] = [
  { name: "joint_1", label: "Base",         mesh: "A1",          origin: [0, 0, 0.093],     axis: [0, 0, 1], limit: [-3.054, 3.054],   visual: [0, 0, -0.008093] },
  { name: "joint_2", label: "Shoulder",     mesh: "A2",          origin: [0, 0, 0.042],     axis: [0, 1, 0], limit: [-1.2217, 1.5708], visual: [0, -0.00019, 0] },
  { name: "joint_3", label: "Elbow",        mesh: "A3_4",        origin: [0, 0, 0.135],     axis: [0, 1, 0], limit: [-2.3562, 1.2217], visual: [0, 0.000227, 0] },
  { name: "joint_4", label: "Forearm roll", mesh: "A5",          origin: [0.062, 0, 0.038], axis: [1, 0, 0], limit: [-2.9671, 2.9671], visual: [-0.000866, 0, 0] },
  { name: "joint_5", label: "Wrist pitch",  mesh: "A6",          origin: [0.055, 0, 0],     axis: [0, 1, 0], limit: [-2.0071, 2.0071], visual: [0, 0.000026, 0] },
  { name: "joint_6", label: "Wrist roll",   mesh: "EndEffector", origin: [0, 0, 0],         axis: [1, 0, 0], limit: [-3.1416, 3.1416], visual: [0.065795, 0, 0] },
];

/** Industrial livery: cast-iron base, safety orange structure, yellow joints. */
const LIVERY: Record<string, { color: number; metalness: number; roughness: number }> = {
  A0:          { color: 0x2c2e33, metalness: 0.5,  roughness: 0.55 },
  A1:          { color: 0xf5811f, metalness: 0.32, roughness: 0.42 },
  A2:          { color: 0xffc20e, metalness: 0.32, roughness: 0.4 },
  A3_4:        { color: 0xf5811f, metalness: 0.32, roughness: 0.42 },
  A5:          { color: 0xffc20e, metalness: 0.32, roughness: 0.4 },
  A6:          { color: 0xf5811f, metalness: 0.32, roughness: 0.42 },
  EndEffector: { color: 0x2c2e33, metalness: 0.62, roughness: 0.38 },
};

export const ARM_HOME = [0, 0.25, -0.45, 0, 0.35, 0];
/** Folded, turned away: where the arm starts before it rises into place. */
const ARM_PARKED = [-0.7, -0.55, 1.1, 0, 0.95, 0];
/** Entrance: the arm unfolds from ARM_PARKED while the camera dollies in. */
const INTRO_SECONDS = 1.8;
const INTRO_DOLLY = 0.55;
/**
 * Portrait screens: the wide sweeps (base yaw, forearm roll) of the scripted
 * actions are scaled down so the arm can be framed much larger and still
 * never leave the view.
 */
const NARROW_ASPECT = 0.9;
const NARROW_SWEEP = 0.6;
const narrowPose = (pose: number[]) => pose.map((v, i) => (i === 0 || i === 3 ? v * NARROW_SWEEP : v));
/** Phones (`compact`): sweeps trimmed further so the arm frames larger still. */
const COMPACT_SWEEP = 0.35;
const compactPose = (pose: number[]) => pose.map((v, i) => (i === 0 || i === 3 ? v * COMPACT_SWEEP : v));
/** Canvas padding on touch screens: the hint and toolbar sit lower there. */
const TOUCH_PAD = { top: 84, bottom: 124 };

/** `grip` is the claw closure at that keyframe: 0 open, 1 closed. */
type Keyframe = { pose: number[]; hold: number; grip?: number };

export const ARM_ACTIONS = {
  wave: {
    label: "Say hi",
    loop: false,
    // Hand up, wrist cocked, then roll the forearm so the claw swings side to
    // side toward the viewer. Kept low enough to stay in frame.
    frames: [
      { pose: [0, 0.35, -0.85, 0, 0.6, 0], hold: 0.7 },
      { pose: [0, 0.35, -0.85, 0.6, 0.6, 0], hold: 0.3, grip: 0.6 },
      { pose: [0, 0.35, -0.85, -0.6, 0.6, 0], hold: 0.3 },
      { pose: [0, 0.35, -0.85, 0.6, 0.6, 0], hold: 0.3, grip: 0.6 },
      { pose: [0, 0.35, -0.85, -0.6, 0.6, 0], hold: 0.3 },
      { pose: [0, 0.35, -0.85, 0, 0.6, 0], hold: 0.3 },
      { pose: ARM_HOME, hold: 0.8 },
    ] as Keyframe[],
  },
  dance: {
    label: "Dance",
    loop: false,
    // Three short steps, then back to rest: a side-to-side sway with the claw
    // snapping, a twist, and a bob. Peaks stay near the resting height so the
    // camera can frame the arm large.
    frames: [
      // 1. sway
      { pose: [0.8, 0.35, -0.75, 0.9, 0.9, 1.3], hold: 0.45, grip: 1 },
      { pose: [-0.8, 0.35, -0.75, -0.9, 0.9, -1.3], hold: 0.45 },
      { pose: [0.8, 0.35, -0.75, 0.9, 0.9, 1.3], hold: 0.45, grip: 1 },
      { pose: [-0.8, 0.35, -0.75, -0.9, 0.9, -1.3], hold: 0.45 },
      // 2. twist
      { pose: [0.5, 0.55, -0.45, 1.4, 0.5, 2.2], hold: 0.45, grip: 1 },
      { pose: [-0.5, 0.55, -0.45, -1.4, 0.5, -2.2], hold: 0.45 },
      { pose: [0.5, 0.55, -0.45, 1.4, 0.5, 2.2], hold: 0.45, grip: 1 },
      { pose: [-0.5, 0.55, -0.45, -1.4, 0.5, -2.2], hold: 0.45 },
      // 3. bob
      { pose: [0, 0.55, -0.95, 0, 0.9, 0], hold: 0.4, grip: 1 },
      { pose: [0, 0.15, -0.35, 0, 0.5, 0], hold: 0.4 },
      { pose: [0, 0.55, -0.95, 0, 0.9, 0], hold: 0.4, grip: 1 },
      { pose: [0, 0.15, -0.35, 0, 0.5, 0], hold: 0.4 },
      // and rest
      { pose: ARM_HOME, hold: 0.8 },
    ] as Keyframe[],
  },
  pick: {
    label: "Pick & place",
    loop: false,
    frames: [
      { pose: [-0.9, 0.55, -0.20, 0, 0.75, 0], hold: 0.7 },
      { pose: [-0.9, 0.80, -0.05, 0, 0.85, 0], hold: 0.4 },
      { pose: [-0.9, 0.80, -0.05, 0, 0.85, 0], hold: 0.25, grip: 1 },
      { pose: [-0.9, 0.35, -0.60, 0, 0.60, 0], hold: 0.5, grip: 1 },
      { pose: [0.9, 0.35, -0.60, 0, 0.60, 0], hold: 0.8, grip: 1 },
      { pose: [0.9, 0.80, -0.05, 0, 0.85, 0], hold: 0.45, grip: 1 },
      { pose: [0.9, 0.80, -0.05, 0, 0.85, 0], hold: 0.25 },
      { pose: [0.9, 0.35, -0.60, 0, 0.60, 0], hold: 0.45 },
      { pose: ARM_HOME, hold: 0.7 },
    ] as Keyframe[],
  },
} as const;

export type ArmActionId = keyof typeof ARM_ACTIONS;

export type ArmControl = {
  mode: "cursor" | "manual" | "action";
  joints: number[];
  /** Bumping `key` replays the same action. */
  action?: { id: ArmActionId; key: number } | null;
  /**
   * "touch": there is no cursor to follow, so the arm wanders on its own and
   * a tap gives it something to reach for.
   */
  input?: "pointer" | "touch";
  /** Touch only: press and hold the gripper to drag the arm around. */
  dragGrip?: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));


/**
 * Planar reach solver.
 *
 * Link lengths come straight out of the URDF:
 *   L1  shoulder -> elbow          joint_3 origin z = 0.135
 *   L2  elbow    -> wrist          joint_4 (0.062, 0.038) + joint_5 (0.055, 0)
 * B2 is the built-in bend of the elbow->wrist segment away from the link axis.
 * LTOOL runs from the wrist centre to the claw's grasp point.
 */
const L1 = 0.135;
const L2 = Math.hypot(0.117, 0.038);
const B2 = Math.atan2(0.117, 0.038);
const LTOOL = 0.145;
const REACH = L1 + L2 + LTOOL;

/** Shoulder pivot height above the base: joint_1 z + joint_2 z. */
const SHOULDER_Z = 0.093 + 0.042;
/** How far in front of the shoulder the cursor's reach plane sits. */
const REACH_PLANE = 0.28;
/**
 * How much of the target's height the wrist follows. Below 1 the wrist lags
 * toward shoulder height, so the wrist has to pitch to aim at the cursor.
 */
const WRIST_FOLLOW = 0.45;

/**
 * Joint angles that reach toward a target point (URDF base frame, metres)
 * and pitch the wrist so the gripper points straight at it.
 */
function solveReach(x: number, y: number, z: number): number[] {
  const q1 = Math.atan2(y, x); // base yaws to face the target

  // Work in the vertical plane through the shoulder: tx forward, tz up.
  const tx = Math.hypot(x, y);
  const tz = z - SHOULDER_Z;
  const dist = Math.max(Math.hypot(tx, tz), 1e-6);

  // Park the wrist a tool-length short of the target along the reach line,
  // then damp its height so the gripper has to tilt up or down to aim.
  const rw = clamp(dist - LTOOL, 0.09, L1 + L2 - 1e-3);
  let wx = (tx / dist) * rw;
  let wz = (tz / dist) * rw * WRIST_FOLLOW;
  const dw = Math.hypot(wx, wz);
  if (dw > L1 + L2 - 1e-3) {
    wx *= (L1 + L2 - 1e-3) / dw;
    wz *= (L1 + L2 - 1e-3) / dw;
  }

  // Two-link IK for shoulder and elbow.
  const d = clamp(Math.hypot(wx, wz), Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4);
  const psi = Math.acos(clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1));
  const gamma = Math.atan2(wx, wz);
  const q2 = gamma - Math.atan2(L2 * Math.sin(psi), L1 + L2 * Math.cos(psi));
  const q3 = psi - B2;

  // Wrist pitch aims the gripper from the wrist at the target (angles are
  // measured from vertical, like gamma).
  const aim = Math.atan2(tx - wx, tz - wz);
  const q5 = aim - Math.PI / 2 - q2 - q3;

  return [q1, q2, q3, 0, q5, 0];
}

/** Finger swing about its knuckle: open, and closed with the tips touching. */
const FINGER_OPEN = 0.35;
const FINGER_CLOSED = -0.14;

/**
 * Two-finger claw gripper in the joint_6 frame (x = tool axis). A black palm
 * on an adapter plate, with angled fingers whose tips hook inward. Each
 * finger pivots at the palm edge to open and close.
 */
function buildGripper() {
  const geometries: THREE.BufferGeometry[] = [];
  const mats = {
    body: new THREE.MeshStandardMaterial({ color: 0x1c1d21, metalness: 0.55, roughness: 0.45 }),
    finger: new THREE.MeshStandardMaterial({ color: 0x26282d, metalness: 0.6, roughness: 0.4 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x0e0f11, metalness: 0.05, roughness: 0.9 }),
    pin: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.3 }),
  };
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
    geometries.push(geometry);
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  const FLANGE = 0.0745; // EndEffector flange face along x
  const group = new THREE.Group();

  const adapter = mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.007, 32), mats.body);
  adapter.rotation.z = -Math.PI / 2;
  adapter.position.x = FLANGE + 0.0035;
  group.add(adapter);

  const palm = mesh(new RoundedBoxGeometry(0.024, 0.048, 0.026, 3, 0.004), mats.body);
  palm.position.x = FLANGE + 0.007 + 0.012;
  group.add(palm);

  const KNUCKLE_X = FLANGE + 0.007 + 0.022;
  const PROX = { len: 0.034, angle: 0.45 };
  const DIST = { len: 0.03, angle: -0.75 };
  const T = 0.007; // finger thickness
  const DEPTH = 0.014;

  const fingers = [1, -1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(KNUCKLE_X, 0.014 * side, 0);
    pivot.scale.y = side; // mirror the +y finger for the -y side
    group.add(pivot);

    const seg = (from: THREE.Vector2, len: number, angle: number) => {
      const s = mesh(new RoundedBoxGeometry(len + T, T, DEPTH, 2, 0.0025), mats.finger);
      s.rotation.z = angle;
      s.position.set(from.x + (Math.cos(angle) * len) / 2, from.y + (Math.sin(angle) * len) / 2, 0);
      pivot.add(s);
      return new THREE.Vector2(from.x + Math.cos(angle) * len, from.y + Math.sin(angle) * len);
    };
    const knuckle = new THREE.Vector2(0, 0);
    const joint = seg(knuckle, PROX.len, PROX.angle);
    const tip = seg(joint, DIST.len, DIST.angle);

    // Pins at both finger joints, and a grip pad on the inside of the tip.
    [knuckle, joint].forEach((at) => {
      const pin = mesh(new THREE.CylinderGeometry(0.0032, 0.0032, DEPTH + 0.004, 16), mats.pin);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(at.x, at.y, 0);
      pivot.add(pin);
    });
    const pad = mesh(new THREE.BoxGeometry(0.014, 0.003, DEPTH - 0.002), mats.pad);
    pad.rotation.z = DIST.angle;
    const inward = new THREE.Vector2(Math.sin(DIST.angle), -Math.cos(DIST.angle)).multiplyScalar(T / 2);
    pad.position.set(
      tip.x - Math.cos(DIST.angle) * 0.008 + inward.x,
      tip.y - Math.sin(DIST.angle) * 0.008 + inward.y,
      0
    );
    pivot.add(pad);
    return pivot;
  });

  const setGrip = (g: number) => {
    const angle = FINGER_OPEN + (FINGER_CLOSED - FINGER_OPEN) * clamp(g, 0, 1);
    fingers.forEach((f) => (f.rotation.z = angle));
  };
  setGrip(0);

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    Object.values(mats).forEach((m) => m.dispose());
  };

  return { group, setGrip, dispose };
}

/** Pixel margins the arm keeps from the canvas edges when the hero passes
 *  none (`pad`): the top clears the floating nav capsule, the bottom the
 *  hero's variant switcher. */
const FRAME_PAD = { top: 100, bottom: 92 };

export function RobotArmHero({
  className,
  control,
  onActionEnd,
  onArmClick,
  compact = false,
  handles = false,
  onJointDrag,
  pad,
}: {
  className?: string;
  control: ArmControl;
  onActionEnd?: () => void;
  /** A quick click on the arm itself (not empty canvas). */
  onArmClick?: () => void;
  /** Phones: trim the actions' sweeps further so the arm can frame larger. */
  compact?: boolean;
  /**
   * Pixel margins to keep clear at the top and bottom of the canvas, for
   * whatever the hero lays over it (navbar, switcher, toolbar). The camera
   * refits when they change. Defaults to FRAME_PAD / TOUCH_PAD.
   */
  pad?: { top: number; bottom: number };
  /** Show a draggable dot on every joint (touch screens). */
  handles?: boolean;
  /** A dot was dragged: the joint's new target angle. */
  onJointDrag?: (index: number, value: number) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef(control);
  const endRef = useRef(onActionEnd);
  const clickRef = useRef(onArmClick);
  const handlesRef = useRef(handles);
  const compactRef = useRef(compact);
  const padRef = useRef(pad);
  // Set by the scene effect: reframes the arm for the current pads.
  const refitRef = useRef<(() => void) | null>(null);
  const dragRef = useRef(onJointDrag);
  const handleRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Set by the scene effect; turns a dot drag into a joint angle.
  const jointDragRef = useRef<((i: number, dx: number, dy: number, phase: DragPhase) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Feed the latest props to the render loop without rebuilding the scene.
  useEffect(() => {
    controlRef.current = control;
  }, [control]);
  useEffect(() => {
    endRef.current = onActionEnd;
  }, [onActionEnd]);
  useEffect(() => {
    clickRef.current = onArmClick;
  }, [onArmClick]);
  useEffect(() => {
    handlesRef.current = handles;
    dragRef.current = onJointDrag;
  }, [handles, onJointDrag]);
  useEffect(() => {
    compactRef.current = compact;
  }, [compact]);
  useEffect(() => {
    padRef.current = pad;
    refitRef.current?.();
  }, [pad]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(0.6, 0.9, 0.8);
    // The key light also casts the floor shadow.
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 4;
    key.shadow.camera.left = key.shadow.camera.bottom = -0.5;
    key.shadow.camera.right = key.shadow.camera.top = 0.5;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.002;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-0.8, 0.3, -0.6);
    scene.add(rim);

    // URDF is Z-up; three.js is Y-up. The rig then yaws the arm so it reaches
    // toward the camera (URDF +X -> three +Z) instead of off to the side.
    const rig = new THREE.Group();
    rig.rotation.y = -Math.PI / 2;
    scene.add(rig);
    const root = new THREE.Group();
    root.rotation.x = -Math.PI / 2;
    rig.add(root);

    // Soft floor shadow under the base.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.ShadowMaterial({ opacity: 0.16 })
    );
    floor.receiveShadow = true;
    root.add(floor);

    // Filled in once the meshes load; refits the camera on every resize.
    let fit: (() => void) | null = null;
    refitRef.current = () => fit?.();
    // Where fit() put the camera, so the entrance can dolly in toward it.
    const fitPos = new THREE.Vector3();
    const fitLook = new THREE.Vector3();
    const viewDir = new THREE.Vector3(0, 0, 1);
    let introStart = -1;
    let introDone = false;
    // Portrait framing in effect (see NARROW_ASPECT); actions use narrowPose.
    let narrowView = false;

    // Cursor reach: pointer ray -> a plane in front of the shoulder -> target
    // in the URDF base frame. Set up once the arm is framed.
    const raycaster = new THREE.Raycaster();
    const reachPlane = new THREE.Plane();
    const toBase = new THREE.Matrix4();
    const hit = new THREE.Vector3();
    let reachReady = false;

    const gripper = buildGripper();
    let grip = 0;
    let pointerDown = false;

    const loader = new GLTFLoader();
    const materials: THREE.Material[] = [];
    const pivots: THREE.Group[] = [];
    const angles = [...ARM_HOME];
    let frame = 0;
    let disposed = false;

    const load = (name: string) =>
      new Promise<THREE.Object3D>((resolve, reject) =>
        loader.load(
          asset(`/robot-arm/${name}.glb`),
          (gltf) => {
            const spec = LIVERY[name] ?? LIVERY.A0;
            const material = new THREE.MeshStandardMaterial(spec);
            materials.push(material);
            gltf.scene.traverse((o) => {
              const mesh = o as THREE.Mesh;
              if (!mesh.isMesh) return;
              mesh.material = material;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            });
            resolve(gltf.scene);
          },
          undefined,
          reject
        )
      );

    (async () => {
      try {
        const meshes = await Promise.all(
          [BASE_MESH, ...ARM_JOINTS.map((j) => j.mesh)].map(load)
        );
        if (disposed) return;

        const S = 0.001; // meshes are millimetres; the URDF scales by 0.001

        const base = meshes[0];
        base.scale.setScalar(S);
        root.add(base);

        let parent: THREE.Object3D = root;
        ARM_JOINTS.forEach((joint, i) => {
          const pivot = new THREE.Group();
          pivot.position.set(...joint.origin);
          parent.add(pivot);
          pivots.push(pivot);

          const link = meshes[i + 1];
          link.scale.setScalar(S);
          link.position.set(...joint.visual);
          pivot.add(link);
          parent = pivot;
        });
        pivots[pivots.length - 1].add(gripper.group);

        // Frame over every scripted pose (home + each action keyframe) so
        // nothing swings out of view. Each link's own bounding box is
        // tracked through the poses, which fits far tighter than one box
        // around the whole arm. Cursor mode needs no budget: the tool tip
        // sits under the pointer, so the arm stays between base and cursor.
        const poses: number[][] = [
          ARM_HOME,
          ...Object.values(ARM_ACTIONS).flatMap((a) =>
            a.frames.map((f) => f.pose as number[])
          ),
        ];
        const links: { object: THREE.Object3D; box: THREE.Box3 }[] = [];
        [...meshes, gripper.group].forEach((m) =>
          m.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.geometry.computeBoundingBox();
            links.push({ object: mesh, box: mesh.geometry.boundingBox! });
          })
        );
        const cornersOf = (box: THREE.Box3) =>
          [0, 1, 2, 3, 4, 5, 6, 7].map(
            (k) =>
              new THREE.Vector3(
                k & 1 ? box.max.x : box.min.x,
                k & 2 ? box.max.y : box.min.y,
                k & 4 ? box.max.z : box.min.z
              )
          );
        const setPose = (pose: number[]) => {
          pivots.forEach((pivot, i) => {
            const [lo, hi] = ARM_JOINTS[i].limit;
            const a = clamp(pose[i] ?? 0, lo, hi);
            const [ax, ay, az] = ARM_JOINTS[i].axis;
            pivot.rotation.set(ax * a, ay * a, az * a);
          });
          scene.updateMatrixWorld(true);
        };
        const collect = (list: number[][]) => {
          const pts: THREE.Vector3[] = [];
          list.forEach((pose) => {
            setPose(pose);
            links.forEach(({ object, box }) =>
              cornersOf(box).forEach((c) => pts.push(c.applyMatrix4(object.matrixWorld)))
            );
          });
          return pts;
        };
        // Two envelopes: the full one, and a narrower one for portrait screens
        // where the wide sweeps are scaled down so the arm frames larger.
        const pointsFull = collect(poses);
        const pointsNarrow = collect(poses.map(narrowPose));
        const pointsCompact = collect(poses.map(compactPose));
        setPose(ARM_HOME);

        // Near-frontal view, slightly raised.
        const dir = new THREE.Vector3(0.18, 0.22, 1).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(up, dir).normalize();
        const camUp = new THREE.Vector3().crossVectors(dir, right);
        const aim = new THREE.Vector3();
        let framed: THREE.Vector3[] = [];
        let framedKey = "";

        // Centre the rig on an envelope and place the reach plane for it.
        const frameWith = (pts: THREE.Vector3[]) => {
          const center = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
          rig.position.set(-center.x, -center.y, -center.z);
          scene.updateMatrixWorld(true);
          const rel = pts.map((p) => p.clone().sub(center));
          const us = rel.map((p) => p.dot(right));
          const vs = rel.map((p) => p.dot(camUp));
          aim
            .set(0, 0, 0)
            .addScaledVector(right, (Math.min(...us) + Math.max(...us)) / 2)
            .addScaledVector(camUp, (Math.min(...vs) + Math.max(...vs)) / 2);

          // Reach plane: faces the camera, REACH_PLANE in front of the shoulder.
          const shoulder = root.localToWorld(new THREE.Vector3(0, 0, SHOULDER_Z));
          const forward = root
            .localToWorld(new THREE.Vector3(1, 0, 0))
            .sub(root.localToWorld(new THREE.Vector3()));
          reachPlane.setFromNormalAndCoplanarPoint(
            dir,
            shoulder.addScaledVector(forward.normalize(), REACH_PLANE)
          );
          toBase.copy(root.matrixWorld).invert();
          reachReady = true;
          return rel;
        };

        fit = () => {
          // Frame the envelope inside the padded canvas: shrink the vertical
          // budget by both pads, then aim off-centre by their difference.
          const h = mount.clientHeight || 1;
          narrowView = camera.aspect < NARROW_ASPECT;
          const key = !narrowView ? "full" : compactRef.current ? "compact" : "narrow";
          if (key !== framedKey) {
            framedKey = key;
            framed = frameWith(
              key === "full" ? pointsFull : key === "compact" ? pointsCompact : pointsNarrow
            );
          }
          const pad = padRef.current ?? (isTouch() ? TOUCH_PAD : FRAME_PAD);
          const tanFull = Math.tan((camera.fov * Math.PI) / 360);
          const top = 1 - (2 * pad.top) / h;
          const bottom = 1 - (2 * pad.bottom) / h;
          const tanV = (tanFull * (top + bottom)) / 2;
          const shift = (tanFull * (top - bottom)) / 2;
          const tanH = tanFull * camera.aspect * 0.94;
          let dist = 0;
          framed.forEach((c) => {
            const p = c.clone().sub(aim);
            const z = p.dot(dir);
            dist = Math.max(
              dist,
              z + Math.abs(p.dot(camUp)) / tanV,
              z + Math.abs(p.dot(right)) / tanH
            );
          });
          const look = aim.clone().addScaledVector(camUp, -shift * dist);
          camera.position.copy(dir).multiplyScalar(dist).add(look);
          camera.lookAt(look);
          fitPos.copy(camera.position);
          fitLook.copy(look);
          viewDir.copy(dir);
          camera.updateMatrixWorld();
        };
        fit();

        // Start folded and away; the tick unfolds it and dollies the camera in.
        ARM_PARKED.forEach((v, i) => (angles[i] = v));
        renderer.domElement.style.opacity = "0";
        introStart = -2; // pending: the next tick stamps the start time
        setReady(true);
      } catch {
        if (!disposed) setFailed(true);
      }
    })();

    // Pointer in the canvas's normalised device coords (+y up), clamped so
    // the arm never chases a cursor sitting over the navbar or off-canvas.
    // Positions come through a smoother: normal movement passes straight
    // through, a cursor that appears suddenly is eased in.
    const pointer = new THREE.Vector2(0, -0.1);
    const toNdc = (x: number, y: number, out: THREE.Vector2) => {
      const r = mount.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      out.set(
        clamp(((x - r.left) / r.width) * 2 - 1, -1, 1),
        clamp(1 - ((y - r.top) / r.height) * 2, -0.95, 0.92)
      );
      return true;
    };
    const isTouch = () => controlRef.current.input === "touch";
    const smoother = createCursorSmoother(
      (x, y) => {
        toNdc(x, y, pointer);
        // On touch the target keeps a margin, so the arm stays well in frame.
        if (isTouch()) pointer.set(clamp(pointer.x, -0.8, 0.8), clamp(pointer.y, -0.6, 0.75));
      },
      {
        origin: () => {
          const r = mount.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 };
        },
      }
    );
    // Touch: a finger only steers the arm while it is dragging the gripper;
    // otherwise the arm wanders by itself and a tap gives it a target.
    let dragging = false;
    let holdUntil = 0; // seconds (clock time) to keep a tapped or dragged target
    let wanderNext = 0;
    let nowT = 0; // clock time as of the latest tick, for the event handlers
    // The cursor left the window: the arm goes back to its home pose and
    // idles there until the cursor returns.
    let away = false;
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget && !isTouch()) away = true;
    };
    document.addEventListener("pointerout", onLeave);
    const onMove = (e: PointerEvent) => {
      away = false;
      if (isTouch() && !dragging) return;
      // Over the hero's own buttons the cursor is busy; leave the arm be.
      if (!dragging && (e.target as Element | null)?.closest?.("[data-no-track]")) return;
      smoother.feed(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove);

    // Hold the pointer down to close the claw. A quick click that lands on the
    // arm's own meshes (not the floor, not empty canvas) makes it say hi.
    const clickNdc = new THREE.Vector2();
    const clickRay = new THREE.Raycaster();
    const hitsArm = (x: number, y: number) => {
      if (!toNdc(x, y, clickNdc)) return false;
      clickRay.setFromCamera(clickNdc, camera);
      return clickRay.intersectObject(rig, true).some((h) => h.object !== floor);
    };
    const hitsGripper = (x: number, y: number) => {
      if (!toNdc(x, y, clickNdc)) return false;
      clickRay.setFromCamera(clickNdc, camera);
      return clickRay.intersectObject(gripper.group, true).length > 0;
    };
    let downAt = 0;
    let downX = 0;
    let downY = 0;
    let downOnCanvas = false;
    const onDown = (e: PointerEvent) => {
      pointerDown = true;
      downAt = performance.now();
      downX = e.clientX;
      downY = e.clientY;
      downOnCanvas = e.target === renderer.domElement;
      if (!isTouch() || !downOnCanvas || !introDone) return;
      if (controlRef.current.dragGrip && hitsGripper(e.clientX, e.clientY)) {
        dragging = true;
      } else {
        // A tap anywhere gives the arm something to reach for.
        smoother.feed(e.clientX, e.clientY);
        holdUntil = nowT + 3;
      }
    };
    const onUp = (e: PointerEvent) => {
      const wasDown = pointerDown;
      pointerDown = false;
      if (dragging) {
        dragging = false;
        holdUntil = nowT + 2;
        return;
      }
      if (!wasDown || !downOnCanvas || e.type !== "pointerup") return;
      const quick = performance.now() - downAt < 350;
      const still = Math.hypot(e.clientX - downX, e.clientY - downY) < 8;
      if (introDone && quick && still && hitsArm(e.clientX, e.clientY)) clickRef.current?.();
    };
    // Dragging the gripper must not scroll the page: claim the gesture when
    // it starts on the gripper.
    const onTouchStart = (e: TouchEvent) => {
      const t0 = e.touches[0];
      if (!t0 || !controlRef.current.dragGrip || !introDone) return;
      if (hitsGripper(t0.clientX, t0.clientY)) e.preventDefault();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fit?.();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Action playback state.
    let playingKey: number | null = null;
    let endedKey: number | null = null;
    let actionStart = 0;
    let actionFrom: number[] = [...ARM_HOME];
    let actionGrip = 0;

    const clock = new THREE.Clock();
    // Mode changes (an action ending, the panel opening or closing) are
    // bridged by a short tween from the pose at the change to the live
    // target, so the arm never darts back to the sliders or the cursor.
    const BRIDGE_SECONDS = 1.4;
    let lastMode: ArmControl["mode"] | null = null;
    let wasAway = false;
    let bridgeStart = -1;
    const bridgeFrom = [...ARM_HOME];
    let bridgeGrip = 0;
    // Slider values from the previous frame, to tell a drag from a jump.
    let lastJoints: number[] | null = null;
    const startBridge = (t: number) => {
      bridgeStart = t;
      angles.forEach((a, i) => (bridgeFrom[i] = a));
      bridgeGrip = grip;
    };

    // Joint handles (touch): each dot follows its joint on screen, and a drag
    // turns the joint in the direction that moves the tool tip with the
    // finger, so any joint can be steered without knowing its axis.
    const hv = new THREE.Vector3();
    const tipA = new THREE.Vector3();
    const tipB = new THREE.Vector3();
    const toScreen = (v: THREE.Vector3) => {
      v.project(camera);
      return { x: ((v.x + 1) / 2) * mount.clientWidth, y: ((1 - v.y) / 2) * mount.clientHeight };
    };
    const hw2 = new THREE.Vector3();
    const handleWorld = (i: number, out: THREE.Vector3) => {
      // The wrist joints sit within a few centimetres of each other, so their
      // dots are spread out: forearm roll mid-forearm, wrist pitch at the
      // wrist, wrist roll out on the gripper fingers.
      if (i === 3) return pivots[2].getWorldPosition(out).lerp(pivots[4].getWorldPosition(hw2), 0.5);
      if (i === 5) return gripper.group.localToWorld(out.set(0.105, 0, 0));
      return pivots[i].getWorldPosition(out);
    };
    const applyJoint = (i: number, a: number) => {
      const [ax, ay, az] = ARM_JOINTS[i].axis;
      pivots[i].rotation.set(ax * a, ay * a, az * a);
    };
    // Screen direction the tool tip moves for a small increase of joint i, and
    // how many pixels it moves per radian. Drives both the drag mapping and
    // the chevrons on the dot, so they stay right as the pose changes.
    const tipDirection = (i: number) => {
      const eps = 0.02;
      const p0 = toScreen(gripper.group.localToWorld(tipA.set(LTOOL, 0, 0)));
      applyJoint(i, angles[i] + eps);
      rig.updateMatrixWorld(true);
      const p1 = toScreen(gripper.group.localToWorld(tipB.set(LTOOL, 0, 0)));
      applyJoint(i, angles[i]);
      rig.updateMatrixWorld(true);
      let vx = (p1.x - p0.x) / eps;
      let vy = (p1.y - p0.y) / eps;
      let pxPerRad = Math.hypot(vx, vy);
      if (pxPerRad < 40) {
        // Tip is on (or near) this axis, as for the wrist roll: drag sideways.
        return { vx: 1, vy: 0, pxPerRad: 140 };
      }
      vx /= pxPerRad;
      vy /= pxPerRad;
      // Capped so a joint can sweep its range in a couple of finger-widths.
      pxPerRad = clamp(pxPerRad, 80, 220);
      return { vx, vy, pxPerRad };
    };
    const updateHandles = () => {
      handleRefs.current.forEach((el, i) => {
        if (!el || i >= pivots.length) return;
        const p = toScreen(handleWorld(i, hv));
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        const d = tipDirection(i);
        el.style.setProperty("--arrow-angle", `${(Math.atan2(d.vy, d.vx) * 180) / Math.PI}deg`);
      });
    };
    let dragValue = 0;
    jointDragRef.current = (i, dx, dy, phase) => {
      if (i >= pivots.length) return;
      if (phase === "start") {
        dragValue = controlRef.current.joints[i] ?? angles[i];
        return;
      }
      if (phase !== "move") return;
      const { vx, vy, pxPerRad } = tipDirection(i);
      const delta = clamp((dx * vx + dy * vy) / pxPerRad, -0.25, 0.25);
      const [lo, hi] = ARM_JOINTS[i].limit;
      dragValue = clamp(dragValue + delta, lo, hi);
      dragRef.current?.(i, dragValue);
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      nowT = t;
      const { mode, joints, action } = controlRef.current;
      if (lastMode !== null && mode !== lastMode && mode !== "action") startBridge(t);
      // Leaving or coming back is bridged like a mode change.
      if (mode === "cursor" && away !== wasAway) startBridge(t);
      wasAway = away;
      lastMode = mode;

      // Entrance: unfold from the parked pose while the camera dollies in.
      // The cursor is ignored until the arm is in place, then followed gently.
      if (introStart === -2) introStart = t;
      if (introStart >= 0 && !introDone) {
        const p = clamp((t - introStart) / INTRO_SECONDS, 0, 1);
        const e = 1 - (1 - p) ** 3;
        pivots.forEach((pivot, i) => {
          angles[i] = ARM_PARKED[i] + (ARM_HOME[i] - ARM_PARKED[i]) * e;
          const [ax, ay, az] = ARM_JOINTS[i].axis;
          pivot.rotation.set(ax * angles[i], ay * angles[i], az * angles[i]);
        });
        camera.position.copy(fitPos).addScaledVector(viewDir, INTRO_DOLLY * (1 - e));
        camera.lookAt(fitLook);
        gripper.setGrip(0);
        // Fade the canvas in over the first part of the entrance.
        renderer.domElement.style.opacity = String(clamp(p / 0.4, 0, 1));
        renderer.render(scene, camera);
        if (p >= 1) {
          introDone = true;
          renderer.domElement.style.opacity = "";
          fit?.();
          startBridge(t);
        }
        return;
      }

      let targets: number[];
      let snap = false;
      let gripTarget = mode === "cursor" && pointerDown ? 1 : 0;

      if (mode === "action" && action) {
        if (playingKey !== action.key) {
          playingKey = action.key;
          actionStart = t;
          actionFrom = [...angles];
          actionGrip = grip;
        }

        const { frames, loop } = ARM_ACTIONS[action.id];
        const shape = !narrowView ? (p: number[]) => p : compactRef.current ? compactPose : narrowPose;
        const poseAt = (k: number) => shape(frames[k].pose as number[]);
        const total = frames.reduce((sum, f) => sum + f.hold, 0);
        let elapsed = t - actionStart;

        if (elapsed >= total) {
          if (loop) {
            elapsed %= total;
            actionFrom = poseAt(frames.length - 1);
            actionGrip = (frames[frames.length - 1] as Keyframe).grip ?? 0;
          } else {
            // Fire once, not on every frame after the action completes.
            if (endedKey !== action.key) {
              endedKey = action.key;
              endRef.current?.();
            }
            elapsed = total;
          }
        }

        let acc = 0;
        let idx = 0;
        while (idx < frames.length - 1 && elapsed >= acc + frames[idx].hold) {
          acc += frames[idx].hold;
          idx++;
        }
        const from = idx === 0 ? actionFrom : poseAt(idx - 1);
        const to = poseAt(idx);
        const local = clamp((elapsed - acc) / frames[idx].hold, 0, 1);
        const e = easeInOut(local);
        targets = to.map((v, i) => from[i] + (v - from[i]) * e);
        const gripFrom = idx === 0 ? actionGrip : ((frames[idx - 1] as Keyframe).grip ?? 0);
        const gripTo = (frames[idx] as Keyframe).grip ?? 0;
        gripTarget = gripFrom + (gripTo - gripFrom) * e;
        snap = true;
      } else if (mode === "manual") {
        playingKey = null;
        // A drag changes a slider a little per frame; a jump (Reset pose) is
        // bridged like a mode change so the arm glides there.
        if (lastJoints && joints.some((v, i) => Math.abs(v - (lastJoints as number[])[i]) > 0.3)) {
          startBridge(t);
        }
        lastJoints = [...joints];
        targets = joints;
      } else if (away) {
        // Facing front with a slow, small idle sway.
        playingKey = null;
        targets = ARM_HOME.map((v, i) =>
          i === 0 ? v + Math.sin(t * 0.35) * 0.12
          : i === 4 ? v + Math.sin(t * 0.55) * 0.07
          : i === 3 ? v + Math.sin(t * 0.25) * 0.1
          : v
        );
      } else if (reachReady) {
        playingKey = null;
        // No cursor: wander to a new spot every few seconds, unless a tap or
        // a drag has given the arm a target to hold.
        if (isTouch() && !dragging && t >= holdUntil && t >= wanderNext) {
          const r = mount.getBoundingClientRect();
          const nx = (Math.random() * 2 - 1) * 0.55;
          const ny = -0.05 + Math.random() * 0.6; // shoulder height and up, never the floor
          smoother.feed(r.left + ((nx + 1) / 2) * r.width, r.top + ((1 - ny) / 2) * r.height);
          wanderNext = t + 2 + Math.random() * 2.5;
        }
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(reachPlane, hit)) {
          hit.applyMatrix4(toBase);
          // Toward the edges and corners of the canvas the target is pushed
          // outward, so the arm stretches to its full length there; around
          // the centre it keeps its relaxed, in-frame reach.
          const edge = Math.max(Math.abs(pointer.x), Math.abs(pointer.y) / 0.95);
          const stretch = isTouch() ? 1 : 1 + 0.9 * edge * edge;
          hit.x *= stretch;
          hit.y *= stretch;
          hit.z = SHOULDER_Z + (hit.z - SHOULDER_Z) * stretch;
          const breathe = Math.sin(t * 0.7) * 0.004;
          targets = solveReach(hit.x, hit.y, hit.z + breathe);
        } else {
          targets = ARM_HOME;
        }
      } else {
        playingKey = null;
        targets = ARM_HOME;
      }

      // Scripted actions play as authored. During a bridge the pose tweens
      // from where it was to the live target; otherwise live modes ease toward
      // the target per frame (sliders feel direct, the cursor is softer).
      const bridging = bridgeStart >= 0 && t - bridgeStart < BRIDGE_SECONDS;
      const be = bridging ? easeInOut((t - bridgeStart) / BRIDGE_SECONDS) : 1;
      const ease = mode === "manual" ? 0.25 : 0.1;

      pivots.forEach((pivot, i) => {
        const [lo, hi] = ARM_JOINTS[i].limit;
        const target = clamp(targets[i] ?? 0, lo, hi);
        angles[i] = snap
          ? target
          : bridging
            ? bridgeFrom[i] + (target - bridgeFrom[i]) * be
            : angles[i] + (target - angles[i]) * ease;
        const [ax, ay, az] = ARM_JOINTS[i].axis;
        pivot.rotation.set(ax * angles[i], ay * angles[i], az * angles[i]);
      });

      grip = snap
        ? gripTarget
        : bridging
          ? bridgeGrip + (gripTarget - bridgeGrip) * be
          : grip + (gripTarget - grip) * 0.25;
      gripper.setGrip(grip);

      renderer.render(scene, camera);
      if (handlesRef.current) updateHandles();
    };
    tick();

    return () => {
      disposed = true;
      jointDragRef.current = null;
      refitRef.current = null;
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      smoother.dispose();
      renderer.dispose();
      gripper.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      materials.forEach((m) => m.dispose());
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={className}>
      <div ref={mountRef} className="h-full w-full" />
      {handles &&
        ARM_JOINTS.map((joint, i) => (
          <DragDot
            key={joint.name}
            ref={(el) => {
              handleRefs.current[i] = el;
            }}
            label={joint.label}
            readout={`${Math.round(((control.joints[i] ?? 0) * 180) / Math.PI)}°`}
            onDrag={(dx, dy, phase) => jointDragRef.current?.(i, dx, dy, phase)}
            className={ready ? undefined : "hidden"}
            style={{ left: -100, top: -100 }}
          />
        ))}
      {!ready && !failed && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="loader" />
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">
          The 3D arm could not be loaded.
        </div>
      )}
    </div>
  );
}
