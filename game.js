let scene, camera, renderer, buildings = [], portal, controls, targetPosition;
let walkAction;
let spiderTarget = new THREE.Vector3();
const loadingManager = new THREE.LoadingManager();
let modelsLoaded = 0;
const totalModels = 12; // 11 buildings + 1 sheep
const PORTAL_ACTIVATION_DISTANCE = 3;
let portalGlowIntensity = 0;
const PORTAL_DISTANCE_FROM_BUILDING = 4; // Distance of portal from building
let cameraOffset, lookTarget;
const buildingGroups = {
    Traveling: [],
    Beauty: [],
    Fashion: [],
    Festival: []
};
const portals = []; // Add portals array
const visibleGroups = new Set();

const mapSize = 41; // Map size
const boundary = 39;
const wallThickness = 1;
let isMoving = false;
let mixer;
let walkingAction;
let moveSpeed = 0.05;  // Speed of the movement
let sheep = null;  // Changed from spider to sheep
let characterLoaded = false; // Flag to check if character is already loaded
const clock = new THREE.Clock();  // Clock for animation updates
const movementThreshold = 0.1; // You can adjust this value

// Building positions and information
const buildingPositions = [
    { x: -14, z: 0,    model: 'box.glb',
        info: {
        name: 'Hongdae Street Market',
        description: 'Famous for street performances and youth culture',
        location: 'Hongdae, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM',
        group: 'Festival'
    }},
    { x: -18, z: -10, model: 'build.glb', info: {
        name: 'Gyeongbokgung Palace',
        description: 'The main royal palace of the Joseon dynasty',
        location: 'Jongno-gu, Seoul',
        type: 'Historical Site',
        hours: '9:00 AM - 6:00 PM',
        group: 'Traveling'
    }},
    { x: -16, z: 10, model: 'build.glb', info: {
        name: 'N Seoul Tower',
        description: 'Iconic communication and observation tower',
        location: 'Namsan, Seoul',
        type: 'Landmark',
        hours: '10:00 AM - 11:00 PM',
        group: 'Traveling'
    }},
    { x: 3, z: -16, model: 'building.glb', info: {
        name: 'Lotte World',
        description: 'World\'s largest indoor theme park',
        location: 'Songpa-gu, Seoul',
        type: 'Amusement Park',
        hours: '9:30 AM - 10:00 PM',
        group: 'Traveling'
    }},
    { x: 5, z: 10, model: 'tree.glb', info: {
        name: 'Bukchon Hanok Village',
        description: 'Traditional Korean village with hanok houses',
        location: 'Jongno-gu, Seoul',
        type: 'Cultural Site',
        hours: '24/7',
        group: 'Traveling'
    }},
    { x: 15, z: -20, model: 'container.glb', info: {
        name: 'Dongdaemun Design Plaza',
        description: 'Major urban development landmark',
        location: 'Jung-gu, Seoul',
        type: 'Architecture',
        hours: '10:00 AM - 7:00 PM',
        group: 'Fashion'
    }},
    { x: 17, z: 5, model: 'chair.glb', info: {
        name: 'Myeongdong Shopping Street',
        description: 'Popular shopping and food district',
        location: 'Jung-gu, Seoul',
        type: 'Shopping',
        hours: '10:00 AM - 10:00 PM',
        group: 'Fashion'
    }},
    { x: -1, z: -8, model: 'building.glb', info: {
        name: 'COEX Mall',
        description: 'Largest underground shopping mall in Asia',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping Mall',
        hours: '10:30 AM - 10:00 PM',
        group: 'Fashion'
    }},
    { x: 10, z: -10, model: 'tree.glb', info: {
        name: 'Insadong',
        description: 'Traditional Korean culture and crafts',
        location: 'Jongno-gu, Seoul',
        type: 'Cultural District',
        hours: '10:00 AM - 8:00 PM',
        group: 'Beauty'
    }},
    { x: -10, z: -15, model: 'container.glb', info: {
        name: 'Namdaemun Market',
        description: 'Largest traditional market in Korea',
        location: 'Jung-gu, Seoul',
        type: 'Market',
        hours: '11:00 PM - 4:00 PM',
        group: 'Beauty'
    }},
    { x: -8, z: 14, model: 'build.glb', info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM',
        group: 'Beauty'
    }},
    { x: 8, z: 3, model: 'sofa.glb', info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM',
        group: 'Beauty'
    }},
    { x: 16, z: 14, model: 'sofa.glb', info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM',
        group: 'Beauty'
    }},
    { x: -5, z: 2, model: 'build.glb', info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM',
        group: 'Beauty'
    }}
];

// Remove loading text when everything is loaded
loadingManager.onLoad = function() {
    modelsLoaded++;
    if (modelsLoaded === totalModels) {
        document.getElementById('loading-screen').style.display = 'none';
    }
};

// Start everything
init();
animate();

function updateCameraOffset() {
    const isMobile = window.innerWidth < 768;
    
    cameraOffset = isMobile ? new THREE.Vector3(7, 12, 12) : new THREE.Vector3(10, 15, 15);
}

function moveToPointer(x, y) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    
    // Create a plane for raycasting
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
        // Check if the target position is valid (not inside buildings or walls)
        if (!checkCollisions(intersectionPoint.x, intersectionPoint.z)) {
            spiderTarget.set(intersectionPoint.x, 0.1, intersectionPoint.z);
            isMoving = true;
            if (walkAction) walkAction.paused = false;
        }
    }
}

function checkCollisions(newX, newZ) {
    const spiderRadius = 0.5;
    const bufferZone = 0.5;
    
    // Check boundary collisions with walls
    const wallBoundary = boundary - wallThickness;
    if (Math.abs(newX) > wallBoundary - spiderRadius || Math.abs(newZ) > wallBoundary - spiderRadius) {
        return true;
    }
    
    // Check building collisions
    for (const building of buildings) {
        
        const bounds = new THREE.Box3().setFromObject(building);
        const min = bounds.min;
        const max = bounds.max;
        
        // Add buffer zone to building bounds
        const minX = min.x - bufferZone;
        const maxX = max.x + bufferZone;
        const minZ = min.z - bufferZone;
        const maxZ = max.z + bufferZone;
        
        if (newX + spiderRadius > minX &&
            newX - spiderRadius < maxX &&
            newZ + spiderRadius > minZ &&
            newZ - spiderRadius < maxZ) {
            return true;
        }
    }
    return false;
}

renderer.domElement.addEventListener('touchstart', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    moveToPointer(x, y);
});

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const wallHeight = 3;

function createWall(x, z, width, depth) {
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
    });
    
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, wallHeight, depth),
        wallMaterial
    );
    
    wall.position.set(x, wallHeight / 2, z);


    // Add wall to buildings array for collision detection
    scene.add(wall);
    buildings.push(wall);

    // Make walls always visible
    wall.visible = false;
}

  // Create 4 walls around the square map
  createWall(0, -mapSize / 2 - 0.5, mapSize + 2, 1); // North
  createWall(0, mapSize / 2 + 0.5, mapSize + 2, 1);  // South
  createWall(-mapSize / 2 - 0.5, 0, 1, mapSize + 2); // West
  createWall(mapSize / 2 + 0.5, 0, 1, mapSize + 2);  // East


  let frameCount = 0;
function animate() {
  requestAnimationFrame(animate);
  frameCount++;
  if (frameCount % 2 === 0) return; // Skip every other frame
  renderer.render(scene, camera);
}

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Create camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    updateCameraOffset();

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);


    // Add lights

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);

    scene.add(directionalLight);


    // Add ground with texture
// Create the gradient texture using a canvas
const canvas = document.createElement('canvas');
canvas.width = 1024; // Size of the texture (adjust as necessary)
canvas.height = 1024; // Ensure it's square for a seamless gradient

// Get the 2D drawing context of the canvas
const ctx = canvas.getContext('2d');
    // Vertical gradient from top to bottom
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFD666');  // Top color
    gradient.addColorStop(1, '#ffab50');  // Bottom color

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradientTexture = new THREE.CanvasTexture(canvas);

    gradientTexture.wrapS = THREE.ClampToEdgeWrapping;  // Prevent repeating horizontally
    gradientTexture.wrapT = THREE.ClampToEdgeWrapping;  // Prevent repeating vertically
    gradientTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();


    // Use the gradient texture in a standard material
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        map: gradientTexture,
        roughness: 0.9,
        metalness: 0.1
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate the ground to be flat
    ground.receiveShadow = true;

    scene.add(ground);

    // Load buildings
    const gltfLoader = new THREE.GLTFLoader(loadingManager);
    buildingPositions.forEach((pos, index) => {
      gltfLoader.load(`models/${pos.model}`, (gltf) => {
        const building = gltf.scene;
            
            building.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Add colors based on model type
                    let materialColor;
                    switch(pos.model) {
                        case 'box.glb':
                            materialColor = 0x4CAF50; // Green
                            break;
                        case 'build.glb':
                            materialColor = 0x2196F3; // Blue
                            break;
                        case 'chair.glb':
                            materialColor = 0xFF9800; // Orange
                            break;
                        case 'container.glb':
                            materialColor = 0x9C27B0; // Purple
                            break;
                        case 'sofa.glb':
                            materialColor = 0xF44336; // Red
                            break;
                        case 'tree.glb':
                            materialColor = 0x7CFC00; // Brown
                            break;
                        case 'building.glb':
                            materialColor = 0x607D8B; // Blue Grey
                            break;
                        default:
                            materialColor = 0xFFFFFF; // White
                    }
                    
                    child.material = new THREE.MeshStandardMaterial({
                        color: materialColor,
                        roughness: 0.7,
                        metalness: 0.2
                    });
                }
            });
            
            const box = new THREE.Box3().setFromObject(building);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            building.scale.setScalar(scale);
            
            building.position.sub(center.multiplyScalar(scale));
            building.position.y = 0;
            building.position.x = pos.x;
            building.position.z = pos.z;

            // Rotate build.glb model
            if (pos.model === 'build.glb') {
                building.rotation.y = -Math.PI / 2; // Rotate 90 degrees around X axis
                building.position.y = 0.3; // Move to Y=1
            }

            if (pos.model === 'box.glb') {
                building.position.y = 0.5; // Move to Y=1
            }
            
            if (pos.model === 'sofa.glb') {
                building.rotation.y = -Math.PI / 2; // Rotate 90 degrees around X axis
            }

            // Add building to its group
            if (pos.info.group) {
                buildingGroups[pos.info.group].push(building);
            }
            
            scene.add(building);
            buildings.push(building);

            // Create portal for the building
            const portalGeometry = new THREE.CircleGeometry(1, 32);
            const portalMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFD666,
                transparent: true,
                opacity: 0.5,
            });

            const portal = new THREE.Mesh(portalGeometry, portalMaterial);
            portal.rotation.x = -Math.PI / 2;
            portal.position.set(
                pos.x,
                0.1,
                pos.z + PORTAL_DISTANCE_FROM_BUILDING
            );
            
            portal.userData = { 
                info: pos.info,
                group: pos.info.group // Store group information
            };
            
            // Add portal glow
            const portalGlow = new THREE.PointLight(0xFFD666, 0, 5);
            portal.add(portalGlow);
            
            scene.add(portal);
            portals.push(portal);
        });
    });

    // Load character only once
    if (!characterLoaded) {
        gltfLoader.load('models/sheep.glb', (gltf) => {
            sheep = gltf.scene;
            scene.add(sheep);

            sheep.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Add color to the sheep
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xFFFFFF,  // White color for the sheep
                        roughness: 0.7,
                        metalness: 0.1
                    });
                }
            });
        
            sheep.position.set(0, 1, 0);
            spiderTarget.copy(sheep.position);
        
            const box = new THREE.Box3().setFromObject(sheep);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            sheep.position.sub(center.multiplyScalar(scale));
            sheep.position.set(0, 1, 0);
            sheep.scale.set(1, 1, 1);

            spiderTarget.copy(sheep.position);
            targetPosition = sheep.position.clone();
            lookTarget = sheep.position.clone();
        
            characterLoaded = true;
        });
    }

    // Add click handler for spider movement
    function handleTapOrClick(event) {
        let clientX, clientY;
    
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
    
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    
        const intersects = raycaster.intersectObject(ground);
        if (intersects.length > 0) {
            // Get the target position
            const targetX = intersects[0].point.x;
            const targetZ = intersects[0].point.z;
    
            // Check if there's no collision
            if (!checkCollisions(targetX, targetZ)) {
                // Set the target position and mark the character as moving
                spiderTarget.set(targetX, 0.1, targetZ);
                isMoving = true;
                if (walkingAction) walkingAction.paused = false; // Start animation
            }
        }
    }






    renderer.domElement.addEventListener('click', handleTapOrClick);
    renderer.domElement.addEventListener('touchstart', handleTapOrClick);

    // Add button click handler
    document.getElementById('detailButton').addEventListener('click', () => {
        const popup = document.getElementById('popup');
        const info = popup.dataset.info ? JSON.parse(popup.dataset.info) : null;
        if (info) {
            document.getElementById('popupTitle').textContent = info.name;
            document.getElementById('popupDescription').textContent = info.description;
            document.getElementById('popupLocation').textContent = info.location;
            document.getElementById('popupType').textContent = info.type;
            document.getElementById('popupHours').textContent = info.hours;
            popup.style.display = 'block';
        }
});


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

function updateBuildingVisibility() {
    // Hide all buildings and portals first
    buildings.forEach(b => b.visible = false);
    portals.forEach(p => p.visible = false);
    
    // Show buildings and portals for visible groups
    visibleGroups.forEach(group => {
        // Show buildings in this group
        buildingGroups[group]?.forEach(b => b.visible = true);
        
        // Show portals for buildings in this group
        portals.forEach(portal => {
            if (portal.userData.group === group) {
                portal.visible = true;
            }
        });
    });
}

    // Add close popup handler
    document.getElementById('closePopup').addEventListener('click', () => {
        document.getElementById('popup').style.display = 'none';
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    updateCameraOffset();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleTapOrClick(event, ground) {
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Update matrix world before raycasting
    scene.updateMatrixWorld();

    const intersects = raycaster.intersectObject(ground);
    if (intersects.length > 0) {
        const targetX = intersects[0].point.x;
        const targetZ = intersects[0].point.z;

        spiderTarget.set(targetX, 0.1, targetZ);
        isMoving = true;  // Start moving towards the target position
    }
}


function updateCharacterMovement() {
    if (!sheep) return;

    const speed = 0.01;
    const distance = sheep.position.distanceTo(spiderTarget);

    if (distance > 0.1) {
        isMoving = true;

        // Calculate the direction vector
        const direction = new THREE.Vector3().subVectors(spiderTarget, sheep.position).normalize();
        
        // Calculate the next position
        const nextX = sheep.position.x + direction.x * speed;
        const nextZ = sheep.position.z + direction.z * speed;
        
        // Check if the next position would cause a collision
        if (!checkCollisions(nextX, nextZ)) {
            // If no collision, update position while maintaining Y at 1
            sheep.position.x = nextX;
            sheep.position.z = nextZ;
            sheep.position.y = 1; // Keep Y position at 1
            
            // Only rotate if we're actually moving and the direction is not zero
            if (distance > 0.2 && !direction.equals(new THREE.Vector3(0, 0, 0))) {
                const targetRotation = Math.atan2(direction.x, direction.z);
                sheep.rotation.y = targetRotation;
            }
        } else {
            // If there would be a collision, stop moving
            isMoving = false;
            spiderTarget.copy(sheep.position);
        }
    } else {
        isMoving = false;
    }
}



// Animation loop
function animate() {
    requestAnimationFrame(animate);

    updateCharacterMovement();

    // Update sheep position
    if (sheep) {
        const direction = new THREE.Vector3()
            .subVectors(spiderTarget, sheep.position)
            .normalize();

        if (sheep.position.distanceTo(spiderTarget) > 0.1) {
            sheep.position.add(direction.multiplyScalar(0.1));
            sheep.position.y = 1; // Keep Y position at 1

            // Only rotate if we're actually moving and the direction is not zero
            if (sheep.position.distanceTo(spiderTarget) > 0.2 && !direction.equals(new THREE.Vector3(0, 0, 0))) {
                const targetRotation = Math.atan2(direction.x, direction.z);
                sheep.rotation.y = targetRotation;
            }
        }

        // Use cameraOffset instead of fixedOffset
        const desiredCameraPosition = sheep.position.clone().add(cameraOffset);
        camera.position.lerp(desiredCameraPosition, 0.05);
        lookTarget.lerp(sheep.position, 0.1);
        camera.lookAt(lookTarget);

        // Check distance to portals
        let nearestPortal = null;
        let minDistance = Infinity;

        scene.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CircleGeometry) {
                const distance = sheep.position.distanceTo(child.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPortal = child;
                }
            }
        });

        if (nearestPortal && minDistance < PORTAL_ACTIVATION_DISTANCE) {
            portalGlowIntensity = Math.min(portalGlowIntensity + 0.05, 1);
            document.getElementById('detailButton').classList.add('active');
            document.getElementById('popup').dataset.info = JSON.stringify(nearestPortal.userData.info);
        } else {
            portalGlowIntensity = Math.max(portalGlowIntensity - 0.05, 0);
            document.getElementById('detailButton').classList.remove('active');
        }

        // Update portal glows
        scene.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CircleGeometry) {
                const distance = sheep.position.distanceTo(child.position);
                const intensity = Math.max(0, 1 - distance / PORTAL_ACTIVATION_DISTANCE);
                child.material.opacity = 0.5 + intensity * 0.5;
                if (child.children[0]) {
                    child.children[0].intensity = intensity * 2;
                }
            }
        });
    }

    renderer.render(scene, camera);
}

// Initialize all groups as visible when the page loads
window.addEventListener('load', () => {
    Object.keys(buildingGroups).forEach(group => visibleGroups.add(group));
    document.querySelectorAll('.filter-buttons button').forEach(button => {
        const filter = button.getAttribute('data-filter');
        if (filter) {
            button.classList.add('active');
        }
    });
    updateBuildingVisibility();
}); 