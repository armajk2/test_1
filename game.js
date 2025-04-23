// script.js
let scene, camera, renderer, character, targetPosition, cameraOffset, lookTarget;
const mapSize = 20;
const boundary = 19;
const wallThickness = 1;
const buildings = [];
const buildingGroups = {
  Traveling: [],
  Beuaty: [],
  Fashion: [],
  Festival: []

};
const visibleGroups = new Set();
const portals = [];
const buildingInfo = []; // Store building information for popups
let currentBuildingIndex = 0; // Track the current building index
let isNearPortal = false; // Track if character is near a portal
let activePortalIndex = -1; // Track which portal is active

// Define a safe zone in the center of the map for the character
const safeZoneRadius = 3; // Radius of the safe zone

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

  // Set character position to the center of the map
  character.position.set(0, 0.6, 0);
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

  // Initialize all groups as visible
  Object.keys(buildingGroups).forEach(group => visibleGroups.add(group));
  
  // Set initial button states - make all buttons active
  document.querySelectorAll('.filter-buttons button').forEach(button => {
    const filter = button.getAttribute('data-filter');
    if (filter) { // Only for filter buttons, not the "Check the Detail" button
      button.classList.add('active');
    }
  });

  document.querySelectorAll('.filter-buttons button').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      
      // Skip if it's the "Check the Detail" button
      if (!filter) return;

      if (filter === 'all') {
        // Check if all groups are currently visible
        const allVisible = Object.keys(buildingGroups).every(group => visibleGroups.has(group));
        
        if (allVisible) {
          // If all are visible, hide all
          visibleGroups.clear();
          document.querySelectorAll('.filter-buttons button').forEach(b => {
            if (b.getAttribute('data-filter')) {
              b.classList.remove('active');
            }
          });
        } else {
          // If not all are visible, show all
          Object.keys(buildingGroups).forEach(group => visibleGroups.add(group));
          document.querySelectorAll('.filter-buttons button').forEach(b => {
            if (b.getAttribute('data-filter')) {
              b.classList.add('active');
            }
          });
        }
      } else {
        if (visibleGroups.has(filter)) {
          visibleGroups.delete(filter);
          button.classList.remove('active');
        } else {
          visibleGroups.add(filter);
          button.classList.add('active');
        }
        
        // Update the "All" button state based on whether all groups are visible
        const allButton = document.querySelector('.filter-buttons button[data-filter="all"]');
        const allGroupsVisible = Object.keys(buildingGroups).every(group => visibleGroups.has(group));
        
        if (allGroupsVisible) {
          allButton.classList.add('active');
        } else {
          allButton.classList.remove('active');
        }
      }

      updateBuildingVisibility();
    });
  });
  
  // Add event listener for the "Check the Detail" button
  const checkDetailBtn = document.getElementById('check-detail-btn');
  checkDetailBtn.addEventListener('click', () => {
    console.log("Check Detail button clicked. isNearPortal:", isNearPortal, "activePortalIndex:", activePortalIndex);
    if (isNearPortal && activePortalIndex !== -1) {
      showBuildingInfo(activePortalIndex);
    }
  });
  
  // Initialize the "Check the Detail" button as disabled
  checkDetailBtn.classList.add('disabled');
  checkDetailBtn.classList.remove('active');
}

function updateBuildingVisibility() {
  buildings.forEach(b => b.visible = false);
  portals.forEach(p => p.visible = false); // Hide all portals by default
  
  visibleGroups.forEach(group => {
    buildingGroups[group]?.forEach(b => b.visible = true);
    
    // Show portals for the visible group
    portals.forEach(portal => {
      if (portal.userData.group === group) {
        portal.visible = true;
      }
    });
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
    { 
      group: 'Traveling', 
      texture: 'textures/h1.jpg', 
      w: 2, 
      h: 3, 
      d: 2, 
      name: 'Hongdae Street Market', 
      description: 'Famous for street performances and youth culture',
      location: 'Hongdae, Seoul',
      type: 'Shopping & Entertainment',
      hours: '10:00 AM - 10:00 PM'
    },
    { 
      group: 'Traveling', 
      texture: 'textures/h2.jpg', 
      w: 3, 
      h: 4, 
      d: 2, 
      name: 'Hongdae Club Street', 
      description: 'Nightlife and entertainment district',
      location: 'Hongdae, Seoul',
      type: 'Nightlife',
      hours: '6:00 PM - 5:00 AM'
    },
    { 
      group: 'Traveling', 
      texture: 'textures/h3.jpg', 
      w: 2, 
      h: 2, 
      d: 2, 
      name: 'Hongdae Art Center', 
      description: 'Contemporary art exhibitions and performances',
      location: 'Hongdae, Seoul',
      type: 'Arts & Culture',
      hours: '11:00 AM - 8:00 PM'
    },
    { 
      group: 'Traveling', 
      texture: 'textures/h4.jpg', 
      w: 2.5, 
      h: 5, 
      d: 2.5, 
      name: 'Hongdae Shopping Street', 
      description: 'Fashion and accessories shopping area',
      location: 'Hongdae, Seoul',
      type: 'Shopping',
      hours: '10:00 AM - 10:00 PM'
    },
    { 
      group: 'Traveling', 
      texture: 'textures/h2.jpg', 
      w: 2, 
      h: 4, 
      d: 2, 
      name: 'Hongdae Food Street', 
      description: 'Local and international cuisine',
      location: 'Hongdae, Seoul',
      type: 'Dining',
      hours: '11:00 AM - 11:00 PM'
    },
    { 
      group: 'Beuaty', 
      texture: 'textures/g1.jpg', 
      w: 3, 
      h: 3, 
      d: 2, 
      name: 'Gangnam Station', 
      description: 'Major transportation hub and shopping area',
      location: 'Gangnam, Seoul',
      type: 'Transportation & Shopping',
      hours: '5:30 AM - 12:30 AM'
    },
    { 
      group: 'Beuaty', 
      texture: 'textures/g2.jpg', 
      w: 2.5, 
      h: 2, 
      d: 2.5, 
      name: 'COEX Mall', 
      description: 'Largest underground shopping mall in Asia',
      location: 'Gangnam, Seoul',
      type: 'Shopping',
      hours: '10:00 AM - 10:00 PM'
    },
    { 
      group: 'Beuaty', 
      texture: 'textures/g3.jpg', 
      w: 2, 
      h: 5, 
      d: 3, 
      name: 'Bongeunsa Temple', 
      description: 'Historic Buddhist temple in modern district',
      location: 'Gangnam, Seoul',
      type: 'Religious & Cultural',
      hours: '3:00 AM - 10:00 PM'
    },
    { 
      group: 'Beuaty', 
      texture: 'textures/g4.jpg', 
      w: 3, 
      h: 3, 
      d: 2, 
      name: 'Gangnam Style Street', 
      description: 'Made famous by PSY\'s Gangnam Style',
      location: 'Gangnam, Seoul',
      type: 'Entertainment',
      hours: '24/7'
    },
    { 
      group: 'Fashion', 
      texture: 'textures/m1.jpg', 
      w: 2, 
      h: 2.5, 
      d: 2, 
      name: 'Myeongdong Shopping Street', 
      description: 'Major shopping district for cosmetics and fashion',
      location: 'Myeongdong, Seoul',
      type: 'Shopping',
      hours: '10:00 AM - 10:00 PM'
    },
    { 
      group: 'Fashion', 
      texture: 'textures/m2.jpg', 
      w: 2.5, 
      h: 2, 
      d: 2, 
      name: 'Myeongdong Cathedral', 
      description: 'Historic Catholic church and landmark',
      location: 'Myeongdong, Seoul',
      type: 'Religious & Historical',
      hours: '9:00 AM - 9:00 PM'
    },
    { 
      group: 'Festival', 
      texture: 'textures/m2.jpg', 
      w: 2.5, 
      h: 2, 
      d: 2, 
      name: 'Myeongdong Cathedral', 
      description: 'Historic Catholic church and landmark',
      location: 'Myeongdong, Seoul',
      type: 'Religious & Historical',
      hours: '9:00 AM - 9:00 PM'
    },
    { 
      group: 'Festival', 
      texture: 'textures/m2.jpg', 
      w: 2.5, 
      h: 2, 
      d: 2, 
      name: 'Myeongdong Cathedral', 
      description: 'Historic Catholic church and landmark',
      location: 'Myeongdong, Seoul',
      type: 'Religious & Historical',
      hours: '9:00 AM - 9:00 PM'
    }
    
  ];

  data.forEach(({ group, texture, w, h, d, name, description, location, type, hours }) => {
    const material = new THREE.MeshBasicMaterial({ map: loader.load(texture) });
    const geo = new THREE.BoxGeometry(w, h, d);
    const building = new THREE.Mesh(geo, material);
    
    let x, z;
    let attempts = 0;
    do {
      // Keep buildings inside walls
      x = Math.random() * (boundary * 2 - w - wallThickness) - (boundary - wallThickness);
      z = Math.random() * (boundary * 2 - d - wallThickness) - (boundary - wallThickness);
      attempts++;
    } while (isPositionOccupied(x, z, w, d) && attempts < 100);

    building.position.set(x, h / 2, z);
    building.userData = { group }; // Store group information in userData
    scene.add(building);
    buildings.push(building);
    buildingGroups[group].push(building);

    // Store building information
    buildingInfo.push({ 
      name, 
      description, 
      position: building.position.clone(), 
      group,
      location,
      type,
      hours
    });

    // Create portal in front of the building
    const portalGeometry = new THREE.CircleGeometry(1, 32);
    const portalMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFD666, // your key color
      transparent: true, 
      opacity: 0.7,
      emissive: 0xFFD666,
      emissiveIntensity: 0
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    
    // Set portal position in front of the building, ensuring it stays inside walls
    const portalOffset = 1.5; // Distance in front of building
    const portalZ = Math.min(z + d/2 + portalOffset, boundary - wallThickness - 1);
    portal.position.set(x, 0.01, portalZ);
    
    // Tilt the portal slightly for better visibility
    portal.rotation.x = -Math.PI / 2; // Flat on ground
    
    // Add a pulsing light to the portal
    const portalLight = new THREE.PointLight(0xFFD666, 0, 3);
    portalLight.position.set(x, 0.5, portalZ);
    scene.add(portalLight);
    portal.userData = { group, light: portalLight }; // Store light reference in userData
    
    portal.userData = { group }; // Store group information in userData
    scene.add(portal);
    portals.push(portal);
  });
}

function isPositionOccupied(x, z, w, d) {
  // Check if position is in the safe zone
  const distanceFromCenter = Math.sqrt(x * x + z * z);
  if (distanceFromCenter < safeZoneRadius) {
    return true;
  }
  
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

  // Update portal glow based on character position
  let wasNearPortal = isNearPortal;
  isNearPortal = false;
  activePortalIndex = -1;
  
  portals.forEach((portal, index) => {
    const distance = character.position.distanceTo(portal.position);
    
    if (distance < 2) { // If character is within 2 units of portal
      const intensity = 1 - (distance / 2); // Calculate glow intensity
      portal.material.opacity = 0.7 + (intensity * 0.3); // Increase portal opacity
      portal.material.emissiveIntensity = intensity * 2; // Increase glow intensity
      
      // Add pulsing effect to the portal
      const pulseIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
      portal.scale.set(1 + pulseIntensity * 0.1, 1 + pulseIntensity * 0.1, 1);
      
      // Check if character is very close to portal
      if (distance < 0.5) {
        isNearPortal = true;
        activePortalIndex = index;
        console.log("Character is near portal:", index, "Distance:", distance);
      }
    } else {
      portal.material.opacity = 0.7; // Reset portal
      portal.material.emissiveIntensity = 0; // Remove glow
      portal.scale.set(1, 1, 1); // Reset scale
    }
  });
  
  // Update the "Check the Detail" button state
  const checkDetailBtn = document.getElementById('check-detail-btn');
  if (isNearPortal) {
    checkDetailBtn.classList.remove('disabled');
    checkDetailBtn.classList.add('active');
    console.log("Button is now active");
  } else {
    checkDetailBtn.classList.add('disabled');
    checkDetailBtn.classList.remove('active');
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

// Function to show building information
function showBuildingInfo(index) {
  const info = buildingInfo[index];
  
  // Get the building info popup elements
  const buildingInfoPopup = document.getElementById('building-info');
  const buildingName = document.getElementById('building-name');
  const buildingDescription = document.getElementById('building-description');
  const buildingLocation = document.getElementById('building-location');
  const buildingType = document.getElementById('building-type');
  const buildingHours = document.getElementById('building-hours');
  
  // Update the popup content
  buildingName.textContent = info.name;
  buildingDescription.textContent = info.description;
  buildingLocation.textContent = `Location: ${info.location}`;
  buildingType.textContent = `Type: ${info.type}`;
  buildingHours.textContent = `Hours: ${info.hours}`;
  
  // Show the popup
  buildingInfoPopup.style.display = 'flex';
  
  // Add a console log for debugging
  console.log("Showing building info:", info.name);
}

// Function to close building information
function closeBuildingInfo() {
  const buildingInfoPopup = document.getElementById('building-info');
  buildingInfoPopup.style.display = 'none';
  
  // Add a console log for debugging
  console.log("Closing building info popup");
}

// Make closeBuildingInfo available globally
window.closeBuildingInfo = closeBuildingInfo;

// Add a click event listener to the document to close the popup when clicking outside
document.addEventListener('click', function(event) {
  const buildingInfoPopup = document.getElementById('building-info');
  const closeBtn = document.querySelector('.close-btn');
  
  // If the popup is visible and the click is not on the close button
  if (buildingInfoPopup.style.display === 'flex' && 
      event.target !== closeBtn && 
      !buildingInfoPopup.contains(event.target)) {
    closeBuildingInfo();
  }
});

