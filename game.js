// script.js
let scene, camera, renderer, character, targetPosition, cameraOffset, lookTarget;
const mapSize = 50;
const boundary = 49;
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
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  updateCameraOffset();

  const tileSize = 2;
  const tileColor = 0xeaeaea;
  for (let i = -mapSize / 2; i < mapSize / 2; i++) {
    for (let j = -mapSize / 2; j < mapSize / 2; j++) {
      const geo = new THREE.PlaneGeometry(tileSize, tileSize);
      const mat = new THREE.MeshBasicMaterial({ color: tileColor });
      const tile = new THREE.Mesh(geo, mat);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(i * tileSize, 0, j * tileSize);
      scene.add(tile);
    }
  }

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

  window.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    moveToPointer(x, y);
  });

  window.addEventListener('touchstart', (e) => {
    const x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    const y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
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
  const wallTexture = new THREE.TextureLoader().load('white-brick.png');
  const material = new THREE.MeshBasicMaterial({ map: wallTexture });
  const geometry = new THREE.BoxGeometry(boundary * 2 + wallThickness, wallHeight, wallThickness);

  const walls = [
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
    new THREE.Mesh(geometry, material),
  ];

  walls[0].position.set(0, wallHeight / 1.6, boundary);
  walls[1].position.set(0, wallHeight / 2, -boundary);
  walls[2].rotation.y = Math.PI / 2;
  walls[2].position.set(boundary, wallHeight / 1.6, 0);
  walls[3].rotation.y = Math.PI / 2;
  walls[3].position.set(-boundary, wallHeight / 2, 0);

  walls.forEach(wall => scene.add(wall));
}

function createManualBuildings() {
  const loader = new THREE.TextureLoader();
  const data = [
    { group: 'hongdae', texture: 'textures/h1.jpg', w: 2, h: 6, d: 2 },
    { group: 'hongdae', texture: 'textures/h2.jpg', w: 3, h: 5, d: 2 },
    { group: 'hongdae', texture: 'textures/h3.jpg', w: 2, h: 7, d: 2 },
    { group: 'hongdae', texture: 'textures/h4.jpg', w: 2.5, h: 6, d: 2.5 },
    { group: 'hongdae', texture: 'textures/h5.jpg', w: 2, h: 8, d: 2 },
    { group: 'gangnam', texture: 'textures/g1.jpg', w: 3, h: 9, d: 2 },
    { group: 'gangnam', texture: 'textures/g2.jpg', w: 2.5, h: 6, d: 2.5 },
    { group: 'gangnam', texture: 'textures/g3.jpg', w: 2, h: 7, d: 3 },
    { group: 'gangnam', texture: 'textures/g4.jpg', w: 3, h: 5, d: 2 },
    { group: 'myeongdong', texture: 'textures/m1.jpg', w: 2, h: 6, d: 2 },
    { group: 'myeongdong', texture: 'textures/m2.jpg', w: 2.5, h: 6.5, d: 2 }
  ];

  data.forEach(({ group, texture, w, h, d }) => {
    const material = new THREE.MeshBasicMaterial({ map: loader.load(texture) });
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    const x = Math.random() * (boundary * 2 - w) - boundary;
    const z = Math.random() * (boundary * 2 - d) - boundary;
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
    buildings.push(mesh);
    buildingGroups[group].push(mesh);
  });
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
