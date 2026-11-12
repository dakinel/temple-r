import * as THREE from 'three';
import {
  createCoinTexture,
  createCrashBarrierTexture,
  createMarginCallTexture,
  createCandlestickTexture,
  createDiamondTexture,
} from './textures';

/**
 * 3D procedural models for character, chasing spider demon, track elements, and obstacles.
 * The runner is a Comic Sci-Fi Robot with:
 * - Pure metal colors (polished steel, chrome, dark titanium, burnished brass)
 * - Way smaller, compact drone body chassis
 * - Organic, desynchronized "not so sync" expandable arm locomotion
 * - 3-pronged tri-claw hands with glowing amber palm sensors
 * - Compact glass dome housing the DiceBear avatar face
 */

export interface AdventurerModel {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  backpack: THREE.Group;
  faceMesh: THREE.Mesh;
  backFaceMesh?: THREE.Mesh;
  updateAnimation: (time: number, speed: number, state: 'run' | 'jump' | 'slide' | 'fall') => void;
  updateAppearance: (
    shirtColor: number,
    vestColor: number,
    pantsColor: number,
    frontCanvas?: HTMLCanvasElement,
    backCanvas?: HTMLCanvasElement
  ) => void;
}

export interface SpiderModel {
  group: THREE.Group;
  legs: THREE.Group[];
  mandibles: THREE.Group;
  abdomen: THREE.Mesh;
  updateAnimation: (time: number, speed: number, attackLunge: boolean) => void;
}

/**
 * Shared cel-shading gradient ramp for sharp comic/cartoon lighting.
 */
function createToonGradientMap(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  const steps = ['#32363e', '#687280', '#b5c0ce', '#ffffff'];
  steps.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(i, 0, 1, 1);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

// 1. COMPACT SCI-FI ROBOT WITH METALLIC COLORS & DESYNCHRONIZED EXPANDABLE ARMS
export function createAdventurer(): AdventurerModel {
  const group = new THREE.Group();
  const toonGradient = createToonGradientMap();

  // --- Authentic High-Quality Metal Materials ---
  // Polished Steel Chassis
  const steelBodyMat = new THREE.MeshStandardMaterial({
    color: 0xc2ccd7,
    metalness: 0.92,
    roughness: 0.22,
  });

  // High-Shine Polished Chrome (pistons, rings, claw tips)
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe8eef5,
    metalness: 0.97,
    roughness: 0.12,
  });

  // Dark Burnished Titanium (joints, undercarriage, collar lip)
  const darkTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x383e47,
    metalness: 0.88,
    roughness: 0.32,
  });

  // Industrial Burnished Brass / Gold (bezels, bolts, hinge pins)
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xdaa538,
    metalness: 0.90,
    roughness: 0.24,
  });

  // Anodized Metallic Accent (tintable by adventurer selection)
  const accentMetalMat = new THREE.MeshStandardMaterial({
    color: 0x3d6b82,
    metalness: 0.86,
    roughness: 0.25,
  });

  const secondaryAccentMat = new THREE.MeshStandardMaterial({
    color: 0x8a5b30,
    metalness: 0.86,
    roughness: 0.25,
  });

  // Glowing Fiery Red/Orange Chest Reactor
  const chestCoreMat = new THREE.MeshStandardMaterial({
    color: 0xff3810,
    emissive: 0xff5500,
    emissiveIntensity: 3.0,
    roughness: 0.15,
  });

  // Glowing Amber/Yellow Palm Repulsor Eye
  const palmCoreMat = new THREE.MeshStandardMaterial({
    color: 0xffeb00,
    emissive: 0xffc800,
    emissiveIntensity: 2.8,
    roughness: 0.18,
  });

  // Transparent Glass Dome (depthWrite: false ensures face textures are always 100% visible)
  const glassDomeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.06,
    metalness: 0.1,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  // Hardened Tool Steel for Claws
  const clawMetalMat = new THREE.MeshStandardMaterial({
    color: 0xbac4cf,
    metalness: 0.94,
    roughness: 0.18,
  });

  // --- WAY SMALLER COMPACT METALLIC BODY (Central Drone Core Pod) ---
  const chassis = new THREE.Group();
  chassis.position.y = 0.95; // Lower, sleek, agile center of gravity
  group.add(chassis);

  // Compact curved metallic chest pod (radius ~0.16m, ~50% smaller radius than before!)
  const chestGeom = new THREE.SphereGeometry(0.16, 20, 16);
  chestGeom.scale(1.0, 0.82, 0.90);
  const chestMesh = new THREE.Mesh(chestGeom, steelBodyMat);
  chestMesh.castShadow = true;
  chassis.add(chestMesh);

  // Compact tapered lower waist pod (no human legs)
  const waistPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.07, 0.11, 16),
    steelBodyMat
  );
  waistPod.position.y = -0.11;
  waistPod.castShadow = true;
  chassis.add(waistPod);

  // Dark titanium waist ring collar
  const waistRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.022, 10, 20),
    darkTitaniumMat
  );
  waistRing.rotation.x = Math.PI / 2;
  waistRing.position.y = -0.16;
  chassis.add(waistRing);

  // Compact neck collar rim
  const neckCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.14, 0.07, 20),
    steelBodyMat
  );
  neckCollar.position.y = 0.13;
  neckCollar.castShadow = true;
  chassis.add(neckCollar);

  const collarLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.018, 10, 24),
    darkTitaniumMat
  );
  collarLip.rotation.x = Math.PI / 2;
  collarLip.position.y = 0.165;
  chassis.add(collarLip);

  // Front sensor lens on neck collar
  const collarSensor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.018, 10),
    brassMat
  );
  collarSensor.rotation.x = Math.PI / 2;
  collarSensor.position.set(0, 0.14, 0.14);
  chassis.add(collarSensor);

  const collarSensorLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 8, 8),
    chestCoreMat
  );
  collarSensorLens.position.set(0, 0.14, 0.15);
  chassis.add(collarSensorLens);

  // Compact Glowing Fiery Chest Reactor Core
  const chestBezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.014, 10, 20),
    brassMat
  );
  chestBezel.position.set(0, 0.01, 0.145);
  chassis.add(chestBezel);

  const chestCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 16, 16),
    chestCoreMat
  );
  chestCore.position.set(0, 0.01, 0.132);
  chassis.add(chestCore);

  const chestCoreLight = new THREE.PointLight(0xff5500, 2.0, 3.5);
  chestCoreLight.position.set(0, 0.01, 0.22);
  chassis.add(chestCoreLight);

  // Compact Layered Shoulder Fin Pauldrons (Scaled down to fit smaller body)
  const createShoulderFins = (isLeft: boolean) => {
    const finGroup = new THREE.Group();
    finGroup.position.set(isLeft ? -0.17 : 0.17, 0.10, 0);

    const finCount = 3;
    for (let f = 0; f < finCount; f++) {
      const scale = 0.45 + f * 0.15;
      const fin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03 * scale, 0.07 * scale, 0.18 * scale, 8),
        steelBodyMat
      );
      fin.position.set(
        (isLeft ? -1 : 1) * (0.03 + f * 0.035),
        f * 0.035,
        (f - 1) * 0.025
      );
      fin.rotation.z = (isLeft ? 1 : -1) * (0.55 + f * 0.15);
      fin.rotation.x = (f - 1) * 0.2;
      fin.scale.set(1, 1, 0.35);
      fin.castShadow = true;
      finGroup.add(fin);
    }
    return finGroup;
  };
  chassis.add(createShoulderFins(true));
  chassis.add(createShoulderFins(false));

  // --- PROMINENT DUAL-SIDED CYBERNETIC AVATAR MEDALLION TERMINAL ---
  // Large, high-visibility disc terminal (radius 0.21m) mounted atop the compact robot chassis.
  // Front face (+Z) shows the explorer avatar portrait.
  // Back face (-Z) shows the generated authentic back-of-head avatar seen from the chase camera!
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.18, 0);
  group.add(headGroup);

  // Sturdy dark titanium neck pivot joint
  const headStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.065, 0.09, 14),
    darkTitaniumMat
  );
  headStem.position.y = 0.045;
  headStem.castShadow = true;
  headGroup.add(headStem);

  const neckJointRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.012, 8, 20),
    brassMat
  );
  neckJointRing.rotation.x = Math.PI / 2;
  neckJointRing.position.y = 0.06;
  headGroup.add(neckJointRing);

  // Cybernetic Terminal Housing (Dual-sided Medallion Casing)
  const medallionCasing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.224, 0.224, 0.054, 32),
    darkTitaniumMat
  );
  medallionCasing.rotation.x = Math.PI / 2;
  medallionCasing.position.y = 0.14;
  medallionCasing.castShadow = true;
  headGroup.add(medallionCasing);

  // Front & Back Burnished Brass Bezel Rims
  const frontBezelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.222, 0.014, 10, 32),
    brassMat
  );
  frontBezelRim.position.set(0, 0.14, 0.028);
  headGroup.add(frontBezelRim);

  const backBezelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.222, 0.014, 10, 32),
    brassMat
  );
  backBezelRim.position.set(0, 0.14, -0.028);
  headGroup.add(backBezelRim);

  // Glowing Amber Perimeter Status Light Ring
  const statusGlowRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.007, 8, 32),
    palmCoreMat
  );
  statusGlowRing.position.set(0, 0.14, 0);
  headGroup.add(statusGlowRing);

  // Protective Transparent Energy Shield Canopy (depthWrite: false avoids any clipping)
  const canopyGeom = new THREE.SphereGeometry(0.24, 24, 16);
  canopyGeom.scale(1, 1.15, 0.55);
  const glassCanopy = new THREE.Mesh(canopyGeom, glassDomeMat);
  glassCanopy.position.set(0, 0.14, 0);
  glassCanopy.renderOrder = 10;
  headGroup.add(glassCanopy);

  // Initial Front Face Canvas & Material
  const initFaceCanvas = document.createElement('canvas');
  initFaceCanvas.width = 512;
  initFaceCanvas.height = 512;
  const ifctx = initFaceCanvas.getContext('2d')!;
  ifctx.fillStyle = '#ffdfbf';
  ifctx.fillRect(0, 0, 512, 512);
  ifctx.fillStyle = '#221105';
  ifctx.beginPath();
  ifctx.arc(176, 210, 28, 0, Math.PI * 2);
  ifctx.arc(336, 210, 28, 0, Math.PI * 2);
  ifctx.fill();
  ifctx.strokeStyle = '#5a2d0c';
  ifctx.lineWidth = 12;
  ifctx.beginPath();
  ifctx.arc(256, 290, 68, 0.2, Math.PI - 0.2);
  ifctx.stroke();

  const initFrontTex = new THREE.CanvasTexture(initFaceCanvas);
  initFrontTex.colorSpace = THREE.SRGBColorSpace;

  const frontFaceMat = new THREE.MeshStandardMaterial({
    map: initFrontTex,
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Front Face Mesh (visible from front selfie camera mode)
  const frontFaceMesh = new THREE.Mesh(new THREE.CircleGeometry(0.21, 32), frontFaceMat);
  frontFaceMesh.position.set(0, 0.14, 0.029);
  headGroup.add(frontFaceMesh);

  // Initial Back Face Canvas (authentic back of head with full hair, nape & ears)
  const initBackCanvas = document.createElement('canvas');
  initBackCanvas.width = 512;
  initBackCanvas.height = 512;
  const ibctx = initBackCanvas.getContext('2d')!;
  ibctx.fillStyle = '#fae1c3';
  ibctx.fillRect(0, 0, 512, 512);
  // Neck
  ibctx.fillStyle = '#ecad80';
  ibctx.beginPath();
  ibctx.moveTo(172, 310);
  ibctx.bezierCurveTo(162, 400, 138, 460, 115, 512);
  ibctx.lineTo(397, 512);
  ibctx.bezierCurveTo(374, 460, 350, 400, 340, 310);
  ibctx.fill();
  // Hair dome
  ibctx.fillStyle = '#e5d7a3';
  ibctx.beginPath();
  ibctx.ellipse(256, 215, 148, 134, 0, 0, Math.PI * 2);
  ibctx.fill();

  const initBackTex = new THREE.CanvasTexture(initBackCanvas);
  initBackTex.colorSpace = THREE.SRGBColorSpace;

  const backFaceMat = new THREE.MeshStandardMaterial({
    map: initBackTex,
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Back Face Mesh (directly facing the chase camera)
  const backFaceMesh = new THREE.Mesh(new THREE.CircleGeometry(0.21, 32), backFaceMat);
  backFaceMesh.rotation.y = Math.PI;
  backFaceMesh.scale.x = -1; // Align texture coordinates with chase camera screen orientation
  backFaceMesh.position.set(0, 0.14, -0.029);
  headGroup.add(backFaceMesh);

  const faceMesh = frontFaceMesh;

  // --- TWO BIG EXPANDABLE METALLIC ARMS WITH TRI-CLAW HANDS ---
  // Attached to the compact body at x = ±0.24, creating an exaggerated, agile silhouette!
  interface ExpandableArm {
    root: THREE.Group;
    shoulderPivot: THREE.Group;
    telescopeAssembly: THREE.Group;
    elbow: THREE.Group;
    wrist: THREE.Group;
    palm: THREE.Group;
    claws: THREE.Group[];
  }

  function createExpandableArm(isLeft: boolean): ExpandableArm {
    const root = new THREE.Group();
    // Attached tightly to compact chassis sides
    root.position.set(isLeft ? -0.24 : 0.24, 0.98, 0);
    group.add(root);

    // Shoulder sphere socket
    const shoulderSocket = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 14),
      darkTitaniumMat
    );
    shoulderSocket.castShadow = true;
    root.add(shoulderSocket);

    // Brass shoulder collar ring
    const shoulderRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.015, 8, 18),
      brassMat
    );
    shoulderRing.rotation.y = Math.PI / 2;
    root.add(shoulderRing);

    // Shoulder Pivot
    const shoulderPivot = new THREE.Group();
    root.add(shoulderPivot);

    // Telescoping Upper Arm Assembly (This group dynamically expands & contracts!)
    const telescopeAssembly = new THREE.Group();
    shoulderPivot.add(telescopeAssembly);

    // Segmented corrugated metallic rings (comic tentacle / accordion style)
    const ringCount = 7;
    for (let r = 0; r < ringCount; r++) {
      const ringGroup = new THREE.Group();
      ringGroup.position.y = -0.07 - r * 0.07;

      // Outer polished steel ribbed ring
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.082 - r * 0.003, 0.026, 10, 18),
        steelBodyMat
      );
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.castShadow = true;
      ringGroup.add(ringMesh);

      // Inner chrome sliding piston sleeve
      const sleeveMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065 - r * 0.002, 0.065 - r * 0.002, 0.07, 12),
        chromeMat
      );
      ringGroup.add(sleeveMesh);

      telescopeAssembly.add(ringGroup);
    }

    // Flexible Elbow Joint
    const elbow = new THREE.Group();
    elbow.position.y = -0.07 - ringCount * 0.07;
    telescopeAssembly.add(elbow);

    const elbowHinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.15, 14),
      darkTitaniumMat
    );
    elbowHinge.rotation.z = Math.PI / 2;
    elbow.add(elbowHinge);

    const elbowCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      brassMat
    );
    elbowCap.position.set(isLeft ? -0.085 : 0.085, 0, 0);
    elbow.add(elbowCap);

    // Lower Arm / Forearm Segmented Extension
    const forearmGroup = new THREE.Group();
    elbow.add(forearmGroup);

    const forearmRings = 5;
    for (let fr = 0; fr < forearmRings; fr++) {
      const fRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.024, 10, 16),
        steelBodyMat
      );
      fRing.rotation.x = Math.PI / 2;
      fRing.position.y = -0.05 - fr * 0.065;
      fRing.castShadow = true;
      forearmGroup.add(fRing);

      const fSleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.058, 0.065, 12),
        chromeMat
      );
      fSleeve.position.y = -0.05 - fr * 0.065;
      forearmGroup.add(fSleeve);
    }

    // Wrist Pivot
    const wrist = new THREE.Group();
    wrist.position.y = -0.05 - forearmRings * 0.065;
    forearmGroup.add(wrist);

    // --- 3-PRONGED TRI-CLAW HAND ---
    const palm = new THREE.Group();
    wrist.add(palm);

    // Circular metallic palm chassis
    const palmBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.135, 0.07, 18),
      steelBodyMat
    );
    palmBase.rotation.x = Math.PI / 2;
    palmBase.castShadow = true;
    palm.add(palmBase);

    // Glowing Amber/Yellow Palm Repulsor Eye
    const palmEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.046, 14, 14),
      palmCoreMat
    );
    palmEye.position.set(0, 0, 0.04);
    palm.add(palmEye);

    const eyeBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.012, 8, 18),
      brassMat
    );
    eyeBezel.position.set(0, 0, 0.04);
    palm.add(eyeBezel);

    // 3 Curved Mechanical Claw Fingers at 120° angles (0, 2π/3, 4π/3)
    const claws: THREE.Group[] = [];
    for (let c = 0; c < 3; c++) {
      const angle = (c * Math.PI * 2) / 3;
      const clawRoot = new THREE.Group();
      clawRoot.position.set(
        Math.cos(angle) * 0.115,
        Math.sin(angle) * 0.115,
        0
      );
      clawRoot.rotation.z = angle - Math.PI / 2;

      // Knuckle hinge
      const knuckle = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 8, 8),
        darkTitaniumMat
      );
      clawRoot.add(knuckle);

      // Curved Claw Segment 1
      const clawSeg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.022, 0.12, 10),
        clawMetalMat
      );
      clawSeg1.position.set(0, 0.06, 0.018);
      clawSeg1.rotation.x = 0.42;
      clawSeg1.castShadow = true;
      clawRoot.add(clawSeg1);

      // Claw Hinge 2
      const clawHinge2 = new THREE.Group();
      clawHinge2.position.set(0, 0.12, 0.045);
      clawRoot.add(clawHinge2);

      // Curved Claw Tip
      const clawTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.11, 8),
        chromeMat
      );
      clawTip.position.set(0, 0.055, -0.01);
      clawTip.rotation.x = -0.52;
      clawHinge2.add(clawTip);

      palm.add(clawRoot);
      claws.push(clawRoot);
    }

    return {
      root,
      shoulderPivot,
      telescopeAssembly,
      elbow,
      wrist,
      palm,
      claws,
    };
  }

  const leftArmObj = createExpandableArm(true);
  const rightArmObj = createExpandableArm(false);

  // Invisible dummy groups to satisfy AdventurerModel interface
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const torso = chassis;
  const backpack = new THREE.Group();
  backpack.position.set(0, 0.95, -0.20);
  group.add(backpack);

  const leftArm = leftArmObj.root;
  const rightArm = rightArmObj.root;

  // --- "NOT SO SYNC MOVES" ASYMMETRIC LOCOMOTIVE PHYSICS ---
  // Desynchronized phase offsets, uneven reach strides, staggered claw articulation,
  // and organic recoil physics give the robot a dynamic, imperfect, living mechanical gait!
  const updateAnimation = (time: number, speed: number, state: 'run' | 'jump' | 'slide' | 'fall') => {
    if (state === 'run') {
      const runFreq = speed * 1.45;
      const strideTime = time * runFreq;

      // === NOT SO SYNC: ASYMMETRIC PHASE & TIMING OFFSETS ===
      // Instead of rigid 180° mirror symmetry, we introduce an organic staggered cadence!
      // Left arm has a lead stride; Right arm follows with a slight micro-delay and harmonic bounce.
      const phaseL = strideTime;
      const phaseR = strideTime + Math.PI * 0.84 + Math.sin(strideTime * 0.5) * 0.18;

      // Asymmetric swing curves: Left arm has long sweeping strokes, Right arm has quick snappy pushes
      const swingL = Math.sin(phaseL);
      const swingR = Math.sin(phaseR) * 0.92 + Math.cos(phaseR * 2) * 0.14;

      // === DESYNCHRONIZED EXPANSION AS MOVE MECHANIC ===
      // Left arm expands with a wide, elastic stretch
      const expandL = 0.86 + Math.max(0, swingL) * 0.74;
      // Right arm expands with a snappier, stepped extension
      const expandR = 0.89 + Math.max(0, swingR) * 0.64 + (Math.sin(phaseR * 3) > 0.5 ? 0.06 : 0);

      leftArmObj.telescopeAssembly.scale.set(
        1 / Math.sqrt(expandL),
        expandL,
        1 / Math.sqrt(expandL)
      );
      rightArmObj.telescopeAssembly.scale.set(
        1 / Math.sqrt(expandR),
        expandR,
        1 / Math.sqrt(expandR)
      );

      // Asymmetric Shoulder Reach: Left reaches wider, Right pushes more forward
      leftArmObj.shoulderPivot.rotation.x = swingL * 0.88;
      rightArmObj.shoulderPivot.rotation.x = swingR * 0.82;

      // Asymmetric lateral arm flares (uneven stance width)
      leftArmObj.shoulderPivot.rotation.z = -0.18 - Math.max(0, swingL) * 0.16;
      rightArmObj.shoulderPivot.rotation.z = 0.12 + Math.max(0, swingR) * 0.10;

      // Desynchronized Elbow Articulation:
      // Left elbow bends deep during high recovery; Right elbow snaps forward with a tighter angle
      leftArmObj.elbow.rotation.x = -0.42 - Math.max(0, swingL) * 0.82 + Math.min(0, swingL) * 0.32;
      rightArmObj.elbow.rotation.x = -0.32 - Math.max(0, swingR) * 0.68 + Math.min(0, swingR) * 0.22;

      // Wrist Orientation (adjusting for independent elbow & shoulder angles)
      leftArmObj.wrist.rotation.x = -leftArmObj.shoulderPivot.rotation.x - leftArmObj.elbow.rotation.x;
      rightArmObj.wrist.rotation.x = -rightArmObj.shoulderPivot.rotation.x - rightArmObj.elbow.rotation.x;

      // Tri-Claw Desynchronized Articulation:
      // Independent finger wave: Claws don't open and close simultaneously!
      const plantL = Math.max(0, -swingL);
      const plantR = Math.max(0, -swingR);

      leftArmObj.claws.forEach((claw, idx) => {
        // Progressive wave across left claws
        const clawDelay = idx * 0.14;
        const delayedPlant = Math.max(0, -Math.sin(phaseL - clawDelay));
        const hinge = claw.children[2];
        if (hinge) hinge.rotation.x = -0.52 + delayedPlant * 0.48;
        claw.rotation.x = delayedPlant * 0.32;
      });

      rightArmObj.claws.forEach((claw, idx) => {
        // Quick snap grip on right claws
        const delayedPlant = Math.max(0, -Math.sin(phaseR - (2 - idx) * 0.12));
        const hinge = claw.children[2];
        if (hinge) hinge.rotation.x = -0.50 + delayedPlant * 0.44;
        claw.rotation.x = delayedPlant * 0.28;
      });

      // Asymmetric Chassis Vaulting & Weight Transfer:
      // The compact drone body bobs and rolls with the uneven ground strikes
      const vaultBob = Math.abs(Math.sin(phaseL)) * 0.12 + Math.abs(Math.sin(phaseR)) * 0.06;
      chassis.position.y = 0.95 + vaultBob;
      headGroup.position.y = 1.18 + vaultBob;

      // Staggered lateral body roll
      chassis.rotation.z = Math.sin(phaseL) * 0.11 - Math.sin(phaseR) * 0.05;
      chassis.rotation.y = Math.sin(strideTime * 1.1) * 0.12;
      headGroup.rotation.z = -chassis.rotation.z * 0.5 + Math.sin(time * 4) * 0.03; // organic head tilt

      // Reactor core energy pulse
      chestCoreLight.intensity = 2.0 + Math.sin(time * 11) * 0.7;
      chestCore.scale.setScalar(1 + Math.sin(time * 11) * 0.08);

      group.rotation.x = 0.12;
      group.scale.set(1, 1, 1);
    } else if (state === 'jump') {
      // Explosive asymmetric launch
      const jumpExpand = 1.48;
      leftArmObj.telescopeAssembly.scale.set(0.9, jumpExpand, 0.9);
      rightArmObj.telescopeAssembly.scale.set(0.88, jumpExpand * 0.96, 0.88);

      leftArmObj.shoulderPivot.rotation.x = -1.18;
      rightArmObj.shoulderPivot.rotation.x = -1.10;
      leftArmObj.elbow.rotation.x = -0.88;
      rightArmObj.elbow.rotation.x = -0.78;
      leftArmObj.wrist.rotation.x = 0.82;
      rightArmObj.wrist.rotation.x = 0.76;

      leftArmObj.claws.forEach((c) => { c.rotation.x = 0.65; });
      rightArmObj.claws.forEach((c) => { c.rotation.x = 0.55; });

      chassis.position.y = 0.98;
      headGroup.position.y = 1.21;
      group.rotation.x = -0.15;
      group.scale.set(0.96, 1.06, 0.96);
    } else if (state === 'slide') {
      // High-speed cyber sled with slight staggered lead
      const slideExpandL = 1.68;
      const slideExpandR = 1.62;
      leftArmObj.telescopeAssembly.scale.set(0.85, slideExpandL, 0.85);
      rightArmObj.telescopeAssembly.scale.set(0.85, slideExpandR, 0.85);

      leftArmObj.shoulderPivot.rotation.x = 1.15;
      rightArmObj.shoulderPivot.rotation.x = 1.08;
      leftArmObj.elbow.rotation.x = -0.20;
      rightArmObj.elbow.rotation.x = -0.24;
      leftArmObj.wrist.rotation.x = -0.92;
      rightArmObj.wrist.rotation.x = -0.86;

      leftArmObj.claws.forEach((c) => { c.rotation.x = -0.28; });
      rightArmObj.claws.forEach((c) => { c.rotation.x = -0.24; });

      chassis.position.y = 0.44;
      headGroup.position.y = 0.62;
      group.rotation.x = -0.50;
      group.position.y = -0.42;
      group.scale.set(1.15, 0.65, 1.25);
    } else if (state === 'fall') {
      const fallExpand = 1.0 + Math.sin(time * 15) * 0.40;
      leftArmObj.telescopeAssembly.scale.set(1, fallExpand, 1);
      rightArmObj.telescopeAssembly.scale.set(1, 1.9 - fallExpand, 1);

      leftArmObj.shoulderPivot.rotation.x = Math.sin(time * 12) * 1.5;
      rightArmObj.shoulderPivot.rotation.x = -Math.sin(time * 11) * 1.4;
      group.rotation.x = time * 3;
      group.rotation.z = Math.sin(time * 4) * 0.8;
      group.scale.set(1, 1, 1);
    }
  };

  const updateAppearance = (
    shirtColor: number,
    vestColor: number,
    _pantsColor: number,
    frontCanvas?: HTMLCanvasElement,
    backCanvas?: HTMLCanvasElement
  ) => {
    accentMetalMat.color.setHex(shirtColor);
    secondaryAccentMat.color.setHex(vestColor);

    if (frontCanvas) {
      const tex = new THREE.CanvasTexture(frontCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      frontFaceMat.map = tex;
      frontFaceMat.needsUpdate = true;
    }

    if (backCanvas) {
      const bTex = new THREE.CanvasTexture(backCanvas);
      bTex.colorSpace = THREE.SRGBColorSpace;
      backFaceMat.map = bTex;
      backFaceMat.needsUpdate = true;
    } else if (frontCanvas && !backFaceMat.map) {
      const tex = new THREE.CanvasTexture(frontCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      backFaceMat.map = tex;
      backFaceMat.needsUpdate = true;
    }
  };

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    headGroup,
    backpack,
    faceMesh,
    backFaceMesh,
    updateAnimation,
    updateAppearance,
  };
}

// 2. CHASING DEMON SPIDER (Matching stylized cel-shaded aesthetic)
export function createChasingSpider(): SpiderModel {
  const group = new THREE.Group();
  const toonGradient = createToonGradientMap();

  const chitinMat = new THREE.MeshToonMaterial({
    color: 0x1f1616,
    gradientMap: toonGradient,
  });
  const abdomenMat = new THREE.MeshToonMaterial({
    color: 0x3d0e0e,
    gradientMap: toonGradient,
  });
  const glowEyeMat = new THREE.MeshStandardMaterial({
    color: 0xff1515,
    emissive: 0xff0000,
    emissiveIntensity: 1.8,
  });
  const fangMat = new THREE.MeshToonMaterial({
    color: 0xdedede,
    gradientMap: toonGradient,
  });

  // Cephalothorax
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 12), chitinMat);
  thorax.scale.set(1, 0.7, 1.2);
  thorax.position.y = 0.55;
  thorax.castShadow = true;
  group.add(thorax);

  // Large bulbous abdomen
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 14), abdomenMat);
  abdomen.scale.set(1.1, 0.95, 1.5);
  abdomen.position.set(0, 0.75, -1.2);
  abdomen.castShadow = true;
  group.add(abdomen);

  // Glowing demonic red eyes
  const eyeGeom = new THREE.SphereGeometry(0.065, 8, 8);
  const eyeOffsets = [
    [-0.14, 0.62, 0.55],
    [0.14, 0.62, 0.55],
    [-0.06, 0.68, 0.57],
    [0.06, 0.68, 0.57],
    [-0.22, 0.56, 0.48],
    [0.22, 0.56, 0.48],
  ];
  eyeOffsets.forEach(([ex, ey, ez]) => {
    const eye = new THREE.Mesh(eyeGeom, glowEyeMat);
    eye.position.set(ex, ey, ez);
    group.add(eye);
  });

  // Snapping Mandibles
  const mandibles = new THREE.Group();
  mandibles.position.set(0, 0.42, 0.6);

  const leftFang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), fangMat);
  leftFang.rotation.x = Math.PI * 0.7;
  leftFang.rotation.z = -0.25;
  leftFang.position.set(-0.16, 0, 0.1);

  const rightFang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), fangMat);
  rightFang.rotation.x = Math.PI * 0.7;
  rightFang.rotation.z = 0.25;
  rightFang.position.set(0.16, 0, 0.1);

  mandibles.add(leftFang);
  mandibles.add(rightFang);
  group.add(mandibles);

  // 8 jointed creepy arachnid legs
  const legs: THREE.Group[] = [];
  for (let i = 0; i < 8; i++) {
    const isLeft = i < 4;
    const legIdx = i % 4;
    const legRoot = new THREE.Group();

    const zPos = 0.3 - legIdx * 0.35;
    legRoot.position.set(isLeft ? -0.4 : 0.4, 0.52, zPos);

    const upperLeg = new THREE.Group();
    const upperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.75, 8), chitinMat);
    upperMesh.position.y = 0.35;
    upperMesh.rotation.z = isLeft ? 0.6 : -0.6;
    upperLeg.add(upperMesh);
    legRoot.add(upperLeg);

    const lowerLeg = new THREE.Group();
    lowerLeg.position.set(isLeft ? -0.45 : 0.45, 0.7, 0);
    const lowerMesh = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.95, 8), chitinMat);
    lowerMesh.position.y = -0.45;
    lowerMesh.rotation.z = isLeft ? -0.4 : 0.4;
    lowerLeg.add(lowerMesh);
    upperLeg.add(lowerLeg);

    const baseAngleY = (legIdx - 1.5) * 0.35 * (isLeft ? 1 : -1);
    legRoot.rotation.y = baseAngleY;

    group.add(legRoot);
    legs.push(legRoot);
  }

  const updateAnimation = (time: number, speed: number, attackLunge: boolean) => {
    const legSpeed = speed * 2.2;
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const phase = (i % 2 === 0 ? 0 : Math.PI) + (Math.floor(i / 2) * 0.7);
      const wave = Math.sin(time * legSpeed + phase);
      leg.rotation.z = wave * 0.3;
      leg.rotation.x = Math.cos(time * legSpeed + phase) * 0.25;
    }

    abdomen.rotation.x = Math.sin(time * 5) * 0.08;
    mandibles.scale.setScalar(1 + Math.sin(time * 8) * 0.2);

    if (attackLunge) {
      mandibles.position.z = 0.8;
      group.scale.set(1.2, 1.2, 1.2);
    } else {
      mandibles.position.z = 0.6;
      group.scale.set(1, 1, 1);
    }
  };

  return {
    group,
    legs,
    mandibles,
    abdomen,
    updateAnimation,
  };
}

// 3. OBSTACLES: Market Crash Dip Hurdle (Tap/Click Jump Over), Margin Call Laser Arch (Slide Under)
export function createFallenTreeObstacle(): THREE.Group {
  const group = new THREE.Group();
  const crashTexture = createCrashBarrierTexture();
  const candleTexture = createCandlestickTexture();

  // Crash barrier face material
  const barrierMat = new THREE.MeshStandardMaterial({
    map: crashTexture,
    roughness: 0.4,
    metalness: 0.2,
  });

  // Candlestick red posts
  const postMat = new THREE.MeshStandardMaterial({
    map: candleTexture,
    roughness: 0.5,
    metalness: 0.3,
  });

  // Dark steel base frame
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
  });

  // Glowing red hazard warning lights
  const redGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff0000,
    emissiveIntensity: 2.5,
  });

  // Main Market Dip Crash Bar (height ~0.55m so a click/tap jump clears it cleanly)
  const barGeom = new THREE.BoxGeometry(3.6, 0.45, 0.3);
  const barMesh = new THREE.Mesh(barGeom, barrierMat);
  barMesh.position.y = 0.28;
  barMesh.castShadow = true;
  group.add(barMesh);

  // Left & Right Candlestick Stanchions
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.85, 12), postMat);
  postL.position.set(-1.8, 0.42, 0);
  postL.castShadow = true;
  group.add(postL);

  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.85, 12), postMat);
  postR.position.set(1.8, 0.42, 0);
  postR.castShadow = true;
  group.add(postR);

  // Flashing red warning beacons on top of posts
  const beaconL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), redGlowMat);
  beaconL.position.set(-1.8, 0.88, 0);
  group.add(beaconL);

  const beaconR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), redGlowMat);
  beaconR.position.set(1.8, 0.88, 0);
  group.add(beaconR);

  // Red neon underglow beam
  const light = new THREE.PointLight(0xff1100, 1.4, 4);
  light.position.set(0, 0.2, 0);
  group.add(light);

  return group;
}

export function createSlideGateObstacle(): THREE.Group {
  const group = new THREE.Group();
  const marginCallTexture = createMarginCallTexture();

  const signMat = new THREE.MeshStandardMaterial({
    map: marginCallTexture,
    roughness: 0.3,
    metalness: 0.2,
  });

  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.25,
  });

  const laserMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 3.0,
  });

  // High gantry columns
  const columnGeom = new THREE.BoxGeometry(0.4, 3.6, 0.4);
  const leftCol = new THREE.Mesh(columnGeom, trussMat);
  leftCol.position.set(-1.85, 1.8, 0);
  leftCol.castShadow = true;
  group.add(leftCol);

  const rightCol = new THREE.Mesh(columnGeom, trussMat);
  rightCol.position.set(1.85, 1.8, 0);
  rightCol.castShadow = true;
  group.add(rightCol);

  // Heavy "MARGIN CALL" overhead signboard
  const signGeom = new THREE.BoxGeometry(3.9, 1.3, 0.25);
  const sign = new THREE.Mesh(signGeom, signMat);
  sign.position.set(0, 2.2, 0);
  sign.castShadow = true;
  group.add(sign);

  // Warning amber lasers hanging under the sign
  for (let s = -1.4; s <= 1.4; s += 0.5) {
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), laserMat);
    laser.position.set(s, 1.35, 0);
    group.add(laser);
  }

  return group;
}

// 4. GOLD BULLION DOLLAR COIN MODEL ($)
export function createGoldCoin(): THREE.Mesh {
  const coinTex = createCoinTexture();
  const coinMat = new THREE.MeshStandardMaterial({
    map: coinTex,
    color: 0xfff066,
    metalness: 0.88,
    roughness: 0.18,
  });
  const geom = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24);
  const coin = new THREE.Mesh(geom, coinMat);
  coin.rotation.x = Math.PI / 2;
  coin.position.y = 0.6;
  coin.castShadow = true;
  return coin;
}

// 5. WALL STREET CHARGING BULL STATUE (Start Pedestal Trophy)
export function createGoldenIdol(): THREE.Group {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.92,
    roughness: 0.16,
  });

  const greenGlowMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 2.5,
  });

  // Solid dark granite trading floor pedestal
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.35, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.4 })
  );
  base.position.y = 0.18;
  group.add(base);

  // Wall Street Charging Bull Muscular Torso
  const bullTorso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), goldMat);
  bullTorso.scale.set(1.1, 1.0, 1.6);
  bullTorso.position.set(0, 0.68, 0);
  bullTorso.castShadow = true;
  group.add(bullTorso);

  // Shoulder Hump
  const bullHump = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), goldMat);
  bullHump.position.set(0, 0.95, 0.25);
  bullHump.scale.set(1.1, 0.9, 1.1);
  group.add(bullHump);

  // Lowered Head (charging posture)
  const bullHead = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 12), goldMat);
  bullHead.rotation.x = -Math.PI * 0.65;
  bullHead.position.set(0, 0.62, 0.75);
  bullHead.castShadow = true;
  group.add(bullHead);

  // Fierce Curved Bull Horns
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), goldMat);
  hornL.rotation.x = -Math.PI * 0.3;
  hornL.rotation.z = 0.65;
  hornL.position.set(-0.25, 0.88, 0.68);
  group.add(hornL);

  const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), goldMat);
  hornR.rotation.x = -Math.PI * 0.3;
  hornR.rotation.z = -0.65;
  hornR.position.set(0.25, 0.88, 0.68);
  group.add(hornR);

  // Glowing Green Bullish Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), greenGlowMat);
  eyeL.position.set(-0.14, 0.66, 0.82);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), greenGlowMat);
  eyeR.position.set(0.14, 0.66, 0.82);
  group.add(eyeL);
  group.add(eyeR);

  // Sturdy golden legs
  const legOffsets = [
    [-0.28, 0.32, 0.45],
    [0.28, 0.32, 0.45],
    [-0.26, 0.32, -0.45],
    [0.26, 0.32, -0.45],
  ];
  legOffsets.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.45, 10), goldMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  return group;
}
