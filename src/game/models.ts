import * as THREE from 'three';
import {
  createCoinTexture,
  createCrashBarrierTexture,
  createMarginCallTexture,
  createCandlestickTexture,
  createDiamondTexture,
} from './textures';

/**
 * 3D procedural models for character, track elements, and obstacles.
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
  updateAnimation: (
    time: number,
    speed: number,
    state: 'run' | 'jump' | 'slide' | 'fall',
    landingImpact?: number,
    verticalVel?: number
  ) => void;
  updateAppearance: (
    shirtColor: number,
    vestColor: number,
    pantsColor: number,
    frontCanvas?: HTMLCanvasElement,
    backCanvas?: HTMLCanvasElement
  ) => void;
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

  // Premium Optical Glass Helmet Dome (depthWrite: false ensures inner head & face stay 100% crisp)
  const glassDomeMat = new THREE.MeshPhysicalMaterial({
    color: 0xdff6ff,
    transparent: true,
    opacity: 0.24,
    roughness: 0.04,
    metalness: 0.08,
    ior: 1.52,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.6,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  // Subtle Gold-Iridescent Inner Visor Shield Tint
  const visorTintMat = new THREE.MeshPhysicalMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.13,
    roughness: 0.06,
    metalness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2.2,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  // Hardened Tool Steel for Claws
  const clawMetalMat = new THREE.MeshStandardMaterial({
    color: 0xbac4cf,
    metalness: 0.94,
    roughness: 0.18,
  });

  // --- Forged Iron & Cybernetic Arm Materials ---
  // Forged Gunmetal Iron Armor Plates
  const ironArmPlateMat = new THREE.MeshStandardMaterial({
    color: 0x4b515b,
    metalness: 0.88,
    roughness: 0.42,
  });

  // Deep Cast-Iron Skeletal Frame & Actuators
  const darkIronFrameMat = new THREE.MeshStandardMaterial({
    color: 0x262a31,
    metalness: 0.90,
    roughness: 0.48,
  });

  // Machined Iron Pistons, Pins & Cyber Blade Claws
  const machinedIronMat = new THREE.MeshStandardMaterial({
    color: 0x6c7480,
    metalness: 0.92,
    roughness: 0.28,
  });

  // Cybernetic Cyan Optical Conduits & Servo Glow
  const cyberOpticMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.4,
    roughness: 0.15,
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

  // --- PREMIUM 3D GLASS SPACE/CYBER HELMET ENCLOSING THE PLAYER'S HEAD ---
  // Features a machined-iron locking neck collar, armored side ear-comm pods,
  // dorsal helmet spine ridge, 3D inner head core with front/back avatar faces,
  // subtle gold visor shield, and a crystal-clear specular glass bubble dome.
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.18, 0);
  group.add(headGroup);

  // Sturdy dark iron neck pivot joint
  const headStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.075, 0.08, 16),
    darkIronFrameMat
  );
  headStem.position.y = 0.04;
  headStem.castShadow = true;
  headGroup.add(headStem);

  // Precision Helmet Neck Seal Collar Ring (Machined Iron + Gold Clamp + Cyber Pressure Seal)
  const collarBaseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.172, 0.032, 14, 32),
    ironArmPlateMat
  );
  collarBaseRing.rotation.x = Math.PI / 2;
  collarBaseRing.position.y = 0.048;
  collarBaseRing.castShadow = true;
  headGroup.add(collarBaseRing);

  const collarGoldClamp = new THREE.Mesh(
    new THREE.TorusGeometry(0.194, 0.013, 10, 32),
    brassMat
  );
  collarGoldClamp.rotation.x = Math.PI / 2;
  collarGoldClamp.position.y = 0.062;
  headGroup.add(collarGoldClamp);

  const collarCyberSeal = new THREE.Mesh(
    new THREE.TorusGeometry(0.184, 0.006, 8, 32),
    cyberOpticMat
  );
  collarCyberSeal.rotation.x = Math.PI / 2;
  collarCyberSeal.position.y = 0.074;
  headGroup.add(collarCyberSeal);

  // 4 Radial Collar Locking Latches
  for (let l = 0; l < 4; l++) {
    const ang = (l * Math.PI) / 2 + Math.PI / 4;
    const latch = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.036, 0.045),
      machinedIronMat
    );
    latch.position.set(Math.cos(ang) * 0.19, 0.058, Math.sin(ang) * 0.19);
    latch.rotation.y = -ang;
    headGroup.add(latch);
  }

  // Left & Right Armored Helmet Ear-Pod Comm Modules
  for (const side of [-1, 1]) {
    const earHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.052, 16),
      ironArmPlateMat
    );
    earHousing.rotation.z = Math.PI / 2;
    earHousing.position.set(side * 0.258, 0.185, 0);
    earHousing.castShadow = true;
    headGroup.add(earHousing);

    const earTrimRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.056, 0.008, 8, 20),
      brassMat
    );
    earTrimRing.rotation.y = Math.PI / 2;
    earTrimRing.position.set(side * 0.285, 0.185, 0);
    headGroup.add(earTrimRing);

    const earOpticDot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.012, 12),
      cyberOpticMat
    );
    earOpticDot.rotation.z = Math.PI / 2;
    earOpticDot.position.set(side * 0.286, 0.185, 0);
    headGroup.add(earOpticDot);
  }

  // Dorsal Curved Helmet Spine Crest (Premium profile from rear chase & side cameras)
  const dorsalSpine = new THREE.Mesh(
    new THREE.TorusGeometry(0.268, 0.018, 10, 28, Math.PI * 0.72),
    darkIronFrameMat
  );
  dorsalSpine.rotation.y = Math.PI / 2;
  dorsalSpine.rotation.z = Math.PI * 0.18;
  dorsalSpine.position.set(0, 0.185, 0);
  headGroup.add(dorsalSpine);

  const dorsalTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.278, 0.006, 8, 28, Math.PI * 0.62),
    cyberOpticMat
  );
  dorsalTrim.rotation.y = Math.PI / 2;
  dorsalTrim.rotation.z = Math.PI * 0.23;
  dorsalTrim.position.set(0, 0.185, 0);
  headGroup.add(dorsalTrim);

  // Inner 3D Sculpted Head Core (sleek flight hood/cranium inside the glass dome)
  const innerHeadGeom = new THREE.SphereGeometry(0.178, 24, 20);
  innerHeadGeom.scale(0.95, 1.04, 0.86);
  const innerHeadCore = new THREE.Mesh(innerHeadGeom, darkIronFrameMat);
  innerHeadCore.position.set(0, 0.19, 0);
  innerHeadCore.castShadow = true;
  headGroup.add(innerHeadCore);

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

  // Front Face Mesh inside glass helmet (visible from front selfie camera mode)
  const frontFaceMesh = new THREE.Mesh(new THREE.CircleGeometry(0.165, 32), frontFaceMat);
  frontFaceMesh.position.set(0, 0.19, 0.152);
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

  // Back Face Mesh inside glass helmet (directly facing the chase camera)
  const backFaceMesh = new THREE.Mesh(new THREE.CircleGeometry(0.165, 32), backFaceMat);
  backFaceMesh.rotation.y = Math.PI;
  backFaceMesh.scale.x = -1; // Align texture coordinates with chase camera screen orientation
  backFaceMesh.position.set(0, 0.19, -0.152);
  headGroup.add(backFaceMesh);

  // Subtle Gold-Tinted Inner Curved Astronaut Visor Shield
  const visorShieldGeom = new THREE.SphereGeometry(
    0.258,
    32,
    20,
    Math.PI * 0.15,
    Math.PI * 0.7,
    Math.PI * 0.24,
    Math.PI * 0.46
  );
  const visorShield = new THREE.Mesh(visorShieldGeom, visorTintMat);
  visorShield.position.set(0, 0.185, 0);
  visorShield.renderOrder = 11;
  headGroup.add(visorShield);

  // Outer Crystal-Clear Spherical Glass Helmet Bubble Dome
  const canopyGeom = new THREE.SphereGeometry(0.272, 36, 28);
  canopyGeom.scale(1.0, 1.06, 1.04);
  const glassCanopy = new THREE.Mesh(canopyGeom, glassDomeMat);
  glassCanopy.position.set(0, 0.185, 0);
  glassCanopy.renderOrder = 12;
  headGroup.add(glassCanopy);

  const faceMesh = frontFaceMesh;

  // --- TWO IRON-COLORED CYBER ARMS WITH HYDRAULICS & ARTICULATED CYBER CLAWS ---
  // Attached to the compact body at x = ±0.24, built from layered iron armor plates,
  // hydraulic pistons, rotary servo joints, and glowing cybernetic conduits.
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
    const side = isLeft ? -1 : 1;
    const root = new THREE.Group();
    // Attached tightly to compact chassis sides
    root.position.set(side * 0.24, 0.98, 0);
    group.add(root);

    // Cast-iron rotary shoulder socket
    const shoulderSocket = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 14, 14),
      darkIronFrameMat
    );
    shoulderSocket.castShadow = true;
    root.add(shoulderSocket);

    // Machined iron shoulder collar ring
    const shoulderRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.112, 0.016, 8, 18),
      machinedIronMat
    );
    shoulderRing.rotation.y = Math.PI / 2;
    root.add(shoulderRing);

    // Shoulder Pivot
    const shoulderPivot = new THREE.Group();
    root.add(shoulderPivot);

    // Angular Iron Cyber Shoulder Pauldron Armor + Glowing Cyber Vent
    const pauldronPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.13, 0.17),
      ironArmPlateMat
    );
    pauldronPlate.position.set(side * 0.07, 0.03, 0);
    pauldronPlate.rotation.z = -side * 0.35;
    pauldronPlate.castShadow = true;
    shoulderPivot.add(pauldronPlate);

    const pauldronTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.08, 0.175),
      cyberOpticMat
    );
    pauldronTrim.position.set(side * 0.135, 0.02, 0);
    pauldronTrim.rotation.z = -side * 0.35;
    shoulderPivot.add(pauldronTrim);

    // Telescoping Upper Arm Cyber Assembly (dynamically expands & contracts)
    const telescopeAssembly = new THREE.Group();
    shoulderPivot.add(telescopeAssembly);

    // Central hexagonal iron cyber-spine core
    const upperSpine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.044, 0.48, 6),
      darkIronFrameMat
    );
    upperSpine.position.y = -0.28;
    upperSpine.castShadow = true;
    telescopeAssembly.add(upperSpine);

    // Dual parallel hydraulic piston actuators (front & back of upper arm)
    for (const zOff of [-0.052, 0.052]) {
      const outerCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.24, 8),
        darkIronFrameMat
      );
      outerCylinder.position.set(side * 0.025, -0.18, zOff);
      telescopeAssembly.add(outerCylinder);

      const pistonRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.28, 8),
        machinedIronMat
      );
      pistonRod.position.set(side * 0.025, -0.34, zOff);
      telescopeAssembly.add(pistonRod);
    }

    // 3 Layered Iron Armor Cuff Plates along the upper arm
    for (let r = 0; r < 3; r++) {
      const yPos = -0.13 - r * 0.14;
      const armorPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.135 - r * 0.008, 0.085, 0.13 - r * 0.006),
        ironArmPlateMat
      );
      armorPlate.position.set(side * 0.01, yPos, 0);
      armorPlate.castShadow = true;
      telescopeAssembly.add(armorPlate);

      // Cybernetic glowing LED side strip on outer armor face
      const ledStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.055, 0.055),
        cyberOpticMat
      );
      ledStrip.position.set(side * (0.078 - r * 0.004), yPos, 0);
      telescopeAssembly.add(ledStrip);
    }

    // Heavy Cybernetic Rotary Elbow Servo
    const elbow = new THREE.Group();
    elbow.position.y = -0.54;
    telescopeAssembly.add(elbow);

    const elbowServo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.082, 0.155, 12),
      darkIronFrameMat
    );
    elbowServo.rotation.z = Math.PI / 2;
    elbowServo.castShadow = true;
    elbow.add(elbowServo);

    // Outer hexagonal machined iron cap + cyber optic ring
    const elbowHexCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.175, 6),
      machinedIronMat
    );
    elbowHexCap.rotation.z = Math.PI / 2;
    elbow.add(elbowHexCap);

    const elbowOpticRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.009, 8, 18),
      cyberOpticMat
    );
    elbowOpticRing.rotation.y = Math.PI / 2;
    elbowOpticRing.position.set(side * 0.089, 0, 0);
    elbow.add(elbowOpticRing);

    // Angular Cyber Forearm Gauntlet
    const forearmGroup = new THREE.Group();
    elbow.add(forearmGroup);

    // Inner dark iron forearm frame
    const forearmCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.044, 0.36, 6),
      darkIronFrameMat
    );
    forearmCore.position.y = -0.19;
    forearmCore.castShadow = true;
    forearmGroup.add(forearmCore);

    // Outer iron armored gauntlet shell
    const forearmGauntlet = new THREE.Mesh(
      new THREE.BoxGeometry(0.138, 0.27, 0.128),
      ironArmPlateMat
    );
    forearmGauntlet.position.set(side * 0.014, -0.18, 0);
    forearmGauntlet.castShadow = true;
    forearmGroup.add(forearmGauntlet);

    // Machined iron cyber stabilizer fin / heat-sink blade on outer forearm
    const cyberFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.22, 0.055),
      machinedIronMat
    );
    cyberFin.position.set(side * 0.088, -0.17, -0.02);
    cyberFin.rotation.z = side * 0.08;
    forearmGroup.add(cyberFin);

    // Glowing cyber telemetry strip down the rear/outer forearm
    const forearmConduit = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.22, 0.024),
      cyberOpticMat
    );
    forearmConduit.position.set(side * 0.082, -0.18, 0.028);
    forearmGroup.add(forearmConduit);

    // Forearm dual micro-pistons
    for (const zOff of [-0.045, 0.045]) {
      const microPiston = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6),
        machinedIronMat
      );
      microPiston.position.set(-side * 0.035, -0.17, zOff);
      forearmGroup.add(microPiston);
    }

    // Iron Cyber Wrist Collar
    const wrist = new THREE.Group();
    wrist.position.y = -0.37;
    forearmGroup.add(wrist);

    const wristCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.064, 0.055, 8),
      darkIronFrameMat
    );
    wrist.add(wristCollar);

    const wristFlange = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.012, 8, 16),
      machinedIronMat
    );
    wristFlange.rotation.x = Math.PI / 2;
    wrist.add(wristFlange);

    // --- IRON CYBER-CLAW HAND ---
    const palm = new THREE.Group();
    wrist.add(palm);

    // Hexagonal armored iron palm block
    const palmBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.118, 0.128, 0.072, 6),
      ironArmPlateMat
    );
    palmBase.rotation.x = Math.PI / 2;
    palmBase.castShadow = true;
    palm.add(palmBase);

    // Dark iron backplate guard
    const palmBackGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.025),
      darkIronFrameMat
    );
    palmBackGuard.position.set(0, 0, -0.036);
    palm.add(palmBackGuard);

    // Glowing Cyber-Cyan Palm Repulsor Emitter
    const palmEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 14, 14),
      cyberOpticMat
    );
    palmEye.position.set(0, 0, 0.038);
    palm.add(palmEye);

    const eyeBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.050, 0.012, 8, 6),
      darkIronFrameMat
    );
    eyeBezel.position.set(0, 0, 0.038);
    palm.add(eyeBezel);

    // 3 Angular Iron Cyber Fingers / Claws at 120° angles
    const claws: THREE.Group[] = [];
    for (let c = 0; c < 3; c++) {
      const angle = (c * Math.PI * 2) / 3;
      const clawRoot = new THREE.Group();
      clawRoot.position.set(
        Math.cos(angle) * 0.112,
        Math.sin(angle) * 0.112,
        0
      );
      clawRoot.rotation.z = angle - Math.PI / 2;

      // child[0]: Dark iron servo knuckle
      const knuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.046, 6),
        darkIronFrameMat
      );
      knuckle.rotation.z = Math.PI / 2;
      clawRoot.add(knuckle);

      // child[1]: Angular iron cyber phalanx segment
      const clawSeg1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.115, 0.036),
        ironArmPlateMat
      );
      clawSeg1.position.set(0, 0.06, 0.018);
      clawSeg1.rotation.x = 0.42;
      clawSeg1.castShadow = true;
      clawRoot.add(clawSeg1);

      // child[2]: Claw Hinge 2 (exact index 2 expected by updateAnimation!)
      const clawHinge2 = new THREE.Group();
      clawHinge2.position.set(0, 0.12, 0.045);
      clawRoot.add(clawHinge2);

      // Joint pin inside hinge
      const jointPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.044, 6),
        darkIronFrameMat
      );
      jointPin.rotation.z = Math.PI / 2;
      clawHinge2.add(jointPin);

      // Tapered 4-sided machined iron cyber blade claw tip
      const clawTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.115, 4),
        machinedIronMat
      );
      clawTip.position.set(0, 0.055, -0.01);
      clawTip.rotation.x = -0.52;
      clawTip.rotation.y = Math.PI / 4;
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
  const updateAnimation = (
    time: number,
    speed: number,
    state: 'run' | 'jump' | 'slide' | 'fall',
    landingImpact: number = 0,
    verticalVel: number = 0
  ) => {
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

      // Landing squash-and-rebound curve (peaks quickly on touchdown, rebounds subtly)
      const squash = landingImpact > 0 ? Math.sin(landingImpact * Math.PI * 0.65) : 0;
      const crouchDrop = landingImpact * 0.30;

      // === DESYNCHRONIZED EXPANSION AS MOVE MECHANIC ===
      const armCompress = 1 - landingImpact * 0.24;
      const expandL = (0.86 + Math.max(0, swingL) * 0.74) * armCompress;
      const expandR = (0.89 + Math.max(0, swingR) * 0.64 + (Math.sin(phaseR * 3) > 0.5 ? 0.06 : 0)) * armCompress;

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

      // Asymmetric Shoulder Reach + landing brace forward
      leftArmObj.shoulderPivot.rotation.x = swingL * 0.88 * (1 - landingImpact * 0.5) + landingImpact * 0.45;
      rightArmObj.shoulderPivot.rotation.x = swingR * 0.82 * (1 - landingImpact * 0.5) + landingImpact * 0.38;

      // Flare arms outward on landing to stabilize impact
      leftArmObj.shoulderPivot.rotation.z = -0.18 - Math.max(0, swingL) * 0.16 - landingImpact * 0.42;
      rightArmObj.shoulderPivot.rotation.z = 0.12 + Math.max(0, swingR) * 0.10 + landingImpact * 0.42;

      // Desynchronized Elbow Articulation + deep landing shock bend
      leftArmObj.elbow.rotation.x = -0.42 - Math.max(0, swingL) * 0.82 + Math.min(0, swingL) * 0.32 - landingImpact * 0.65;
      rightArmObj.elbow.rotation.x = -0.32 - Math.max(0, swingR) * 0.68 + Math.min(0, swingR) * 0.22 - landingImpact * 0.58;

      // Wrist Orientation
      leftArmObj.wrist.rotation.x = -leftArmObj.shoulderPivot.rotation.x - leftArmObj.elbow.rotation.x;
      rightArmObj.wrist.rotation.x = -rightArmObj.shoulderPivot.rotation.x - rightArmObj.elbow.rotation.x;

      leftArmObj.claws.forEach((claw, idx) => {
        const clawDelay = idx * 0.14;
        const delayedPlant = Math.max(0, -Math.sin(phaseL - clawDelay));
        const hinge = claw.children[2];
        if (hinge) hinge.rotation.x = -0.52 + delayedPlant * 0.48 + landingImpact * 0.35;
        claw.rotation.x = delayedPlant * 0.32 + landingImpact * 0.25;
      });

      rightArmObj.claws.forEach((claw, idx) => {
        const delayedPlant = Math.max(0, -Math.sin(phaseR - (2 - idx) * 0.12));
        const hinge = claw.children[2];
        if (hinge) hinge.rotation.x = -0.50 + delayedPlant * 0.44 + landingImpact * 0.35;
        claw.rotation.x = delayedPlant * 0.28 + landingImpact * 0.25;
      });

      // Asymmetric Chassis Vaulting & Landing Compression
      const vaultBob = (Math.abs(Math.sin(phaseL)) * 0.12 + Math.abs(Math.sin(phaseR)) * 0.06) * (1 - landingImpact);
      chassis.position.y = 0.95 + vaultBob - crouchDrop;
      headGroup.position.y = 1.18 + vaultBob - crouchDrop * 1.08;

      // Staggered lateral body roll + subtle forward impact dip
      chassis.rotation.z = (Math.sin(phaseL) * 0.11 - Math.sin(phaseR) * 0.05) * (1 - landingImpact * 0.6);
      chassis.rotation.y = Math.sin(strideTime * 1.1) * 0.12 * (1 - landingImpact * 0.7);
      headGroup.rotation.z = -chassis.rotation.z * 0.5 + Math.sin(time * 4) * 0.03;
      headGroup.rotation.x = landingImpact * 0.22;

      // Reactor core energy surge on landing
      chestCoreLight.intensity = 2.0 + Math.sin(time * 11) * 0.7 + landingImpact * 3.5;
      chestCore.scale.setScalar(1 + Math.sin(time * 11) * 0.08 + landingImpact * 0.22);

      group.rotation.x = 0.12 + landingImpact * 0.18;
      group.position.y = -crouchDrop * 0.18;
      const scaleY = 1 - squash * 0.22;
      const scaleXZ = 1 + squash * 0.14;
      group.scale.set(scaleXZ, scaleY, scaleXZ);
    } else if (state === 'jump') {
      // Dynamic arc posture: rising stretches upward, descending braces for landing
      const fallFactor = Math.max(0, Math.min(1, -verticalVel / 10));
      const jumpExpand = 1.48 - fallFactor * 0.22;
      leftArmObj.telescopeAssembly.scale.set(0.9, jumpExpand, 0.9);
      rightArmObj.telescopeAssembly.scale.set(0.88, jumpExpand * 0.96, 0.88);

      leftArmObj.shoulderPivot.rotation.x = -1.18 + fallFactor * 0.85;
      rightArmObj.shoulderPivot.rotation.x = -1.10 + fallFactor * 0.82;
      leftArmObj.shoulderPivot.rotation.z = -0.15 - fallFactor * 0.28;
      rightArmObj.shoulderPivot.rotation.z = 0.15 + fallFactor * 0.28;
      leftArmObj.elbow.rotation.x = -0.88 - fallFactor * 0.25;
      rightArmObj.elbow.rotation.x = -0.78 - fallFactor * 0.25;
      leftArmObj.wrist.rotation.x = 0.82;
      rightArmObj.wrist.rotation.x = 0.76;

      leftArmObj.claws.forEach((c) => { c.rotation.x = 0.65 - fallFactor * 0.35; });
      rightArmObj.claws.forEach((c) => { c.rotation.x = 0.55 - fallFactor * 0.35; });

      chassis.position.y = 0.98;
      headGroup.position.y = 1.21;
      headGroup.rotation.x = fallFactor * 0.12;
      group.rotation.x = -0.15 + fallFactor * 0.22;
      const stretchY = 1.07 - fallFactor * 0.08;
      const stretchXZ = 0.95 + fallFactor * 0.05;
      group.scale.set(stretchXZ, stretchY, stretchXZ);
    } else if (state === 'slide') {
      // High-speed cyber sled with slight staggered lead
      const slideExpandL = 1.68;
      const slideExpandR = 1.62;
      leftArmObj.telescopeAssembly.scale.set(0.85, slideExpandL, 0.85);
      rightArmObj.telescopeAssembly.scale.set(0.85, slideExpandR, 0.85);

      leftArmObj.shoulderPivot.rotation.x = 1.15;
      rightArmObj.shoulderPivot.rotation.x = 1.08;
      leftArmObj.shoulderPivot.rotation.z = -0.15;
      rightArmObj.shoulderPivot.rotation.z = 0.15;
      leftArmObj.elbow.rotation.x = -0.20;
      rightArmObj.elbow.rotation.x = -0.24;
      leftArmObj.wrist.rotation.x = -0.92;
      rightArmObj.wrist.rotation.x = -0.86;

      leftArmObj.claws.forEach((c) => { c.rotation.x = -0.28; });
      rightArmObj.claws.forEach((c) => { c.rotation.x = -0.24; });

      chassis.position.y = 0.44;
      headGroup.position.y = 0.62;
      headGroup.rotation.x = 0;
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

// 2. OBSTACLES: Market Crash Dip Hurdle (Tap/Click Jump Over), Margin Call Laser Arch (Slide Under)
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
  const faceMat = new THREE.MeshStandardMaterial({
    map: coinTex,
    color: 0xffd700,
    emissive: 0xb4690e,
    emissiveIntensity: 0.45,
    metalness: 0.9,
    roughness: 0.16,
    envMapIntensity: 1.8,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xffc400,
    emissive: 0xa16207,
    emissiveIntensity: 0.4,
    metalness: 0.94,
    roughness: 0.14,
    envMapIntensity: 1.8,
  });
  const geom = new THREE.CylinderGeometry(0.38, 0.38, 0.09, 28);
  const coin = new THREE.Mesh(geom, [edgeMat, faceMat, faceMat]);
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
