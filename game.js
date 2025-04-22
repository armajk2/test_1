// script.js
let scene, camera, renderer, character, targetPosition, cameraOffset, lookTarget;
const mapSize = 20;
const boundary = 19;
const wallThickness = 1;
const buildings = [];
const buildingGroups = {
  hongdae: [],
  gangnam: [],
  myeongdong: []
};
const visibleGroups = new Set();

init();
animate();

function init() {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  updateCameraOffset();

  const tileSize = 2;
  const tileTexture = new THREE.TextureLoader().load('textures/ground.jpg');
  tileTexture.wrapS = tileTexture.wrapT = THREE.RepeatWrapping;
  tileTexture.repeat.set(1, 1); // You can increase this for more detail per tile
  const tileMaterial = new THREE.MeshBasicMaterial({ map: tileTexture });
  
  for (let i = -mapSize / 2; i < mapSize / 2; i++) {
    for (let j = -mapSize / 2; j < mapSize / 2; j++) {
      const geo = new THREE.PlaneGeometry(tileSize, tileSize);
      const tile = new THREE.Mesh(geo, tileMaterial);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(i * tileSize, 0, j * tileSize);
      scene.add(tile);
    }
  }
  
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 50;
  light.shadow.camera.left = -30;
  light.shadow.camera.right = 30;
  light.shadow.camera.top = 30;
  light.shadow.camera.bottom = -30;
  scene.add(light);
  
  // Optional: add a helper to visualize the light's shadow camera
  // scene.add(new THREE.CameraHelper(light.shadow.camera));
  
  const charGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
  const charMaterial = new THREE.MeshBasicMaterial({ color: 0x00cc66 });
  character = new THREE.Mesh(charGeometry, charMaterial);

  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
  const outline = new THREE.Mesh(charGeometry, outlineMat);
  outline.scale.set(1.1, 1.1, 1.1);
  character.add(outline);

  character.position.y = 0.6;
  scene.add(character);

  targetPosition = character.position.clone();
  lookTarget = character.position.clone();

  createWalls();
  createManualBuildings();

  renderer.domElement.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    moveToPointer(x, y);
  });

  renderer.domElement.addEventListener('touchstart', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    moveToPointer(x, y);
  });


  window.addEventListener('resize', onWindowResize);

  document.querySelectorAll('.filter-buttons button').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');

      if (filter === 'all') {
        visibleGroups.clear();
        Object.keys(buildingGroups).forEach(group => visibleGroups.add(group));
        document.querySelectorAll('.filter-buttons button').forEach(b => b.classList.remove('active'));
      } else {
        if (visibleGroups.has(filter)) {
          visibleGroups.delete(filter);
          button.classList.remove('active');
        } else {
          visibleGroups.add(filter);
          button.classList.add('active');
        }
      }

      updateBuildingVisibility();
    });
  });
}

function updateBuildingVisibility() {
  buildings.forEach(b => b.visible = false);
  visibleGroups.forEach(group => {
    buildingGroups[group]?.forEach(b => b.visible = true);
  });
}

function updateCameraOffset() {
  const isMobile = window.innerWidth < 768;
  cameraOffset = isMobile ? new THREE.Vector3(7, 12, 12) : new THREE.Vector3(10, 15, 15);
}

function checkCollisions(newX, newZ) {
  const characterRadius = 0.4;
  const bufferZone = 0.2;
  for (const building of buildings) {
    if (!building.visible) continue;
    const bounds = new THREE.Box3().setFromObject(building);
    const min = bounds.min, max = bounds.max;
    if (newX + characterRadius + bufferZone > min.x &&
        newX - characterRadius - bufferZone < max.x &&
        newZ + characterRadius + bufferZone > min.z &&
        newZ - characterRadius - bufferZone < max.z) {
      return true;
    }
  }
  return false;
}

function moveToPointer(x, y) {
  const mouse = new THREE.Vector2(x, y);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, point);

  const tx = Math.min(Math.max(point.x, -boundary + wallThickness), boundary - wallThickness);
  const tz = Math.min(Math.max(point.z, -boundary + wallThickness), boundary - wallThickness);

  if (!checkCollisions(tx, tz)) {
    targetPosition.set(tx, 0.6, tz);
  }
}

function createWalls() {
  const wallHeight = 1;
  const wallColor = 0xFFD666;  // This is your key color, or you can use any hex color value
  
  // Create a transparent material for the walls
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x000000,    // You can choose any color, it won't be visible with opacity 0
    transparent: true,  // Enable transparency
    opacity: 0          // Set opacity to 0 (fully transparent)
  });
  // Geometry for the walls
  const geometry = new THREE.BoxGeometry(boundary * 2 + wallThickness, wallHeight, wallThickness);

  // Create four walls
  const walls = [
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
  ];

  // Position the walls appropriately
  walls[0].position.set(0, wallHeight / 1.6, boundary);
  walls[1].position.set(0, wallHeight / 2, -boundary);
  walls[2].rotation.y = Math.PI / 2;
  walls[2].position.set(boundary, wallHeight / 1.6, 0);
  walls[3].rotation.y = Math.PI / 2;
  walls[3].position.set(-boundary, wallHeight / 2, 0);

  // Add the walls to the scene
  walls.forEach(wall => scene.add(wall));
}

function createManualBuildings() {
  const loader = new THREE.TextureLoader();
  const data = [
    { group: 'hongdae', texture: 'textures/h1.jpg', w: 2, h: 3, d: 2 },
    { group: 'hongdae', texture: 'textures/h2.jpg', w: 3, h: 4, d: 2 },
    { group: 'hongdae', texture: 'textures/h3.jpg', w: 2, h: 2, d: 2 },
    { group: 'hongdae', texture: 'textures/h4.jpg', w: 2.5, h: 5, d: 2.5 },
    { group: 'hongdae', texture: 'textures/h5.jpg', w: 2, h: 4, d: 2 },
    { group: 'gangnam', texture: 'textures/g1.jpg', w: 3, h: 3, d: 2 },
    { group: 'gangnam', texture: 'textures/g2.jpg', w: 2.5, h: 2, d: 2.5 },
    { group: 'gangnam', texture: 'textures/g3.jpg', w: 2, h: 5, d: 3 },
    { group: 'gangnam', texture: 'textures/g4.jpg', w: 3, h: 3, d: 2 },
    { group: 'myeongdong', texture: 'textures/m1.jpg', w: 2, h: 2.5, d: 2 },
    { group: 'myeongdong', texture: 'textures/m2.jpg', w: 2.5, h: 2, d: 2 }
  ];

  data.forEach(({ group, texture, w, h, d }) => {
    const material = new THREE.MeshBasicMaterial({ map: loader.load(texture) });
    const geo = new THREE.BoxGeometry(w, h, d);
    const building = new THREE.Mesh(geo, material);
    
    let x, z;
let attempts = 0;
do {
  x = Math.random() * (boundary * 2 - w) - boundary;
  z = Math.random() * (boundary * 2 - d) - boundary;
  attempts++;
} while (isPositionOccupied(x, z, w, d) && attempts < 100);

    building.position.set(x, h / 2, z);
    
    
    // Create portal
    const portalGeometry = new THREE.CircleGeometry(1, 64); // bigger & smoother
    const portalMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.rotation.x = -Math.PI / 2; // Flat on ground
  
    // Offset the portal to be in front of the building
    const portalOffset = d / 2 + 0.3; // a little in front
    portal.position.set(x, 0.01, z + d / 2 + 1);
  
    scene.add(building);
    scene.add(portal);
    
    buildings.push(building);
    buildingGroups[group].push(building);

    
  });
}

function isPositionOccupied(x, z, w, d) {
  for (const b of buildings) {
    const bounds = new THREE.Box3().setFromObject(b);
    const min = bounds.min, max = bounds.max;

    const proposedMinX = x - w / 2, proposedMaxX = x + w / 2;
    const proposedMinZ = z - d / 2, proposedMaxZ = z + d / 2;

    const intersects =
      proposedMaxX > min.x && proposedMinX < max.x &&
      proposedMaxZ > min.z && proposedMinZ < max.z;

    if (intersects) return true;
  }
  return false;
}

function animate() {
  requestAnimationFrame(animate);

  const nextPosition = character.position.clone().lerp(targetPosition, 0.05);
  if (!checkCollisions(nextPosition.x, nextPosition.z)) {
    character.position.copy(nextPosition);
  }

  character.rotation.x = -0.1;
  character.rotation.z = 0.1;

  const desiredCamPos = character.position.clone().add(cameraOffset);
  camera.position.lerp(desiredCamPos, 0.05);
  lookTarget.lerp(character.position, 0.1);
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

function onWindowResize() {
  updateCameraOffset();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
