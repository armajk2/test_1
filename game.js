let scene, camera, renderer, buildings = [], spider, portal, controls, targetPosition;
let spiderTarget = new THREE.Vector3();
const loadingManager = new THREE.LoadingManager();
let modelsLoaded = 0;
const totalModels = 12; // 11 buildings + 1 spider
const PORTAL_ACTIVATION_DISTANCE = 3;
let portalGlowIntensity = 0;
const PORTAL_DISTANCE_FROM_BUILDING = 5; // Distance of portal from building
let cameraOffset, lookTarget;
const buildingGroups = {
    Traveling: [],
    Beuaty: [],
    Fashion: [],
    Festival: []
};
const mapSize = 40; // Map size
const visibleGroups = new Set();
const boundary = 39;
const wallThickness = 1;

// Building positions and information
const buildingPositions = [
    { x: -14, z: 0, info: {
        name: 'Hongdae Street Market',
        description: 'Famous for street performances and youth culture',
        location: 'Hongdae, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM'
    }},
    { x: -18, z: -10, info: {
        name: 'Gyeongbokgung Palace',
        description: 'The main royal palace of the Joseon dynasty',
        location: 'Jongno-gu, Seoul',
        type: 'Historical Site',
        hours: '9:00 AM - 6:00 PM'
    }},
    { x: -16, z: 10, info: {
        name: 'N Seoul Tower',
        group: 'Traveling', // ← added
        description: 'Iconic communication and observation tower',
        location: 'Namsan, Seoul',
        type: 'Landmark',
        hours: '10:00 AM - 11:00 PM'
    }},
    { x: 3, z: -16, info: {
        name: 'Lotte World',
        group: 'Traveling', // ← added

        description: 'World\'s largest indoor theme park',
        location: 'Songpa-gu, Seoul',
        type: 'Amusement Park',
        hours: '9:30 AM - 10:00 PM'
    }},
    { x: 5, z: 15, info: {
        name: 'Bukchon Hanok Village',
        group: 'Traveling', // ← added

        description: 'Traditional Korean village with hanok houses',
        location: 'Jongno-gu, Seoul',
        type: 'Cultural Site',
        hours: '24/7'
    }},
    { x: 15, z: -20, info: {
        name: 'Dongdaemun Design Plaza',
        group: 'Fashion', // ← added
        description: 'Major urban development landmark',
        location: 'Jung-gu, Seoul',
        type: 'Architecture',
        hours: '10:00 AM - 7:00 PM'
    }},
    { x: 17, z: 5, info: {
        name: 'Myeongdong Shopping Street',
        description: 'Popular shopping and food district',
        location: 'Jung-gu, Seoul',
        type: 'Shopping',
        hours: '10:00 AM - 10:00 PM'
    }},
    { x: -1, z: -8, info: {
        name: 'COEX Mall',
        description: 'Largest underground shopping mall in Asia',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping Mall',
        hours: '10:30 AM - 10:00 PM'
    }},
    { x: 10, z: -10, info: {
        name: 'Insadong',
        description: 'Traditional Korean culture and crafts',
        location: 'Jongno-gu, Seoul',
        type: 'Cultural District',
        hours: '10:00 AM - 8:00 PM'
    }},
    { x: -10, z: -15, info: {
        name: 'Namdaemun Market',
        description: 'Largest traditional market in Korea',
        location: 'Jung-gu, Seoul',
        type: 'Market',
        hours: '11:00 PM - 4:00 PM'
    }},
    { x: -8, z: 14, info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM'
    }},
    { x: 8, z: 3, info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM'
    }},
    { x: 16, z: 14, info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM'
    }},
    { x: -5, z: 2, info: {
        name: 'Gangnam Style',
        description: 'Modern shopping and entertainment district',
        location: 'Gangnam-gu, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM'
    }}
];

// Remove loading text when everything is loaded
loadingManager.onLoad = function() {
    modelsLoaded++;
    if (modelsLoaded === totalModels) {
        document.getElementById('loading').style.display = 'none';
    }
};

// Start everything
init();
animate();

function updateCameraOffset() {
    const isMobile = window.innerWidth < 768;
    
    cameraOffset = isMobile ? new THREE.Vector3(7, 12, 12) : new THREE.Vector3(10, 15, 15);
}

function checkCollisions(newX, newZ) {
    const spiderRadius = 0.4;
    const bufferZone = 0.2;
    for (const building of buildings) {
    if (!building.visible) continue;
    const bounds = new THREE.Box3().setFromObject(building);
    const min = bounds.min, max = bounds.max;
    if (newX + spiderRadius + bufferZone > min.x &&
        newX - spiderRadius - bufferZone < max.x &&
        newZ + spiderRadius + bufferZone > min.z &&
        newZ - spiderRadius - bufferZone < max.z) {
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
        color: 0xff0000,        // Red color
        transparent: true,      // Allow opacity to work
        opacity: 0.5,           // 0.0 = fully transparent, 1.0 = fully opaque
});
    const wall = new THREE.Mesh(

    new THREE.BoxGeometry(width, wallHeight, depth),
    wallMaterial
    );
    wall.position.set(x, wallHeight / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    buildings.push(wall); // Include in collision detection
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
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const groundTexture = textureLoader.load('textures/ground.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        map: groundTexture,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create portals for each building
    buildingPositions.forEach((pos, index) => {
        const portalGeometry = new THREE.CircleGeometry(1, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color:0xFFD666, 
            transparent: true,
            opacity: 0.5,
        });

        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.rotation.x = -Math.PI / 2;

        // Always position the portal relative to the building
        portal.position.set(
            pos.x,
            0.1,
            pos.z + PORTAL_DISTANCE_FROM_BUILDING
        );
    
        portal.userData = { info: pos.info };
        scene.add(portal);
    
        const portalGlow = new THREE.PointLight(0xFFD666, 0, 5);
        portal.add(portalGlow);
    });
    

    // Load buildings
    const gltfLoader = new THREE.GLTFLoader(loadingManager);
    buildingPositions.forEach((pos, index) => {
        gltfLoader.load('models/building.glb', (gltf) => {
            const building = gltf.scene;
            
            building.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
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
            
            scene.add(building);
            buildings.push(building);
        });
    });

    // Load the spider
    const objLoader = new THREE.OBJLoader(loadingManager);
    objLoader.load('models/spider.obj', (object) => {
        spider = object;

        const material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });

        spider.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const box = new THREE.Box3().setFromObject(spider);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        spider.scale.setScalar(scale);

        spider.position.sub(center.multiplyScalar(scale));
        spider.position.set(0, 0.6, 0);

        scene.add(spider);
        spiderTarget.copy(spider.position);

        targetPosition = spider.position.clone();
        lookTarget = spider.position.clone();
    });

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
            // Get the potential target position from the raycast
            const targetX = intersects[0].point.x;
            const targetZ = intersects[0].point.z;
    
            // Check if the new position would collide with any walls
        if (!checkCollisions(targetX, targetZ)) {
            // If no collision, update the spider's target position
            spiderTarget.copy(intersects[0].point);
            spiderTarget.y = 0.1;
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
    buildings.forEach(b => b.visible = false);
    portals.forEach(p => p.visible = false); // Hide all portals by default
    visibleGroups.forEach(group => {
    buildingGroups[group]?.forEach(b => b.visible = true);
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

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update spider position
    if (spider) {
        const direction = new THREE.Vector3()
            .subVectors(spiderTarget, spider.position)
            .normalize();

        if (spider.position.distanceTo(spiderTarget) > 0.1) {
            spider.position.add(direction.multiplyScalar(0.1));

            if (!direction.equals(new THREE.Vector3(0, 0, 0))) {
                spider.lookAt(spider.position.clone().add(direction));
            }
        }

        // Use cameraOffset instead of fixedOffset
        const desiredCameraPosition = spider.position.clone().add(cameraOffset); // cameraOffset defined earlier
        camera.position.lerp(desiredCameraPosition, 0.05); // Smoothly move camera towards the target position
        lookTarget.lerp(spider.position, 0.1);
        camera.lookAt(lookTarget);
        // Optional: lock camera rotation (only needs to be set once, can move to init)

        // Check distance to portals
        let nearestPortal = null;
        let minDistance = Infinity;


        scene.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CircleGeometry) {
                const distance = spider.position.distanceTo(child.position);
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
                const distance = spider.position.distanceTo(child.position);
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