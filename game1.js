let scene, camera, renderer, controls;
let character, targetPosition;
const portals = [];
let isNearPortal = false;
let activePortalIndex = -1;
const buildingGroups = { Traveling: [], Beuaty: [], Fashion: [], Festival: [] };
const visibleGroups = new Set();
const boundary = 19;
const safeZoneRadius = 3;

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => {
  document.getElementById('loading').style.display = 'none';
};

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 5, 10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Load GLB Character
  const gltfLoader = new THREE.GLTFLoader(loadingManager);
  gltfLoader.load('models/building.glb', (gltf) => {
    character = gltf.scene;
    character.scale.set(1.5, 1.5, 1.5);
    character.position.set(0, 0, 0);
    scene.add(character);
    targetPosition = character.position.clone();
  });

  // Dummy portal
  const portalGeo = new THREE.TorusGeometry(0.5, 0.15, 16, 100);
  const portalMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7, emissive: 0x00ffff });
  const portal = new THREE.Mesh(portalGeo, portalMat);
  portal.position.set(2, 0.5, 2);
  scene.add(portal);
  portals.push(portal);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  updateCharacter();
  updatePortalGlow();
  controls.update();
  renderer.render(scene, camera);
}

function updateCharacter() {
  if (character && targetPosition) {
    const nextPosition = character.position.clone().lerp(targetPosition, 0.05);
    character.position.copy(nextPosition);
  }
}

function updatePortalGlow() {
  let wasNearPortal = isNearPortal;
  isNearPortal = false;
  activePortalIndex = -1;

  portals.forEach((portal, index) => {
    const distance = character?.position.distanceTo(portal.position) || 99;

    if (distance < 2) {
      const intensity = 1 - distance / 2;
      portal.material.opacity = 0.7 + intensity * 0.3;
      portal.material.emissiveIntensity = intensity * 2;
      const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
      portal.scale.set(1 + pulse * 0.1, 1 + pulse * 0.1, 1);

      if (distance < 0.5) {
        isNearPortal = true;
        activePortalIndex = index;
      }
    } else {
      portal.material.opacity = 0.7;
      portal.material.emissiveIntensity = 0;
      portal.scale.set(1, 1, 1);
    }
  });
}
