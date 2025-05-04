let scene, camera, renderer, buildings = [], spider, portal, controls;
let spiderTarget = new THREE.Vector3();
const loadingManager = new THREE.LoadingManager();
let modelsLoaded = 0;
const totalModels = 12; // 11 buildings + 1 spider
const PORTAL_ACTIVATION_DISTANCE = 3;
let portalGlowIntensity = 0;
const PORTAL_DISTANCE_FROM_BUILDING = 5; // Distance of portal from building
let cameraOffset, lookTarget;
const mapSize = 30; // Map size
const boundary = 19;
const wallThickness = 1;

// Building positions and information
const buildingPositions = [
    { x: -10, z: 0, info: {
        name: 'Hongdae Street Market',
        description: 'Famous for street performances and youth culture',
        location: 'Hongdae, Seoul',
        type: 'Shopping & Entertainment',
        hours: '10:00 AM - 10:00 PM'
    },
    category: 'Fashion'
    },
    { x: -20, z: -10, info: {
        name: 'Gyeongbokgung Palace',
        description: 'The main royal palace of the Joseon dynasty',
        location: 'Jongno-gu, Seoul',
        type: 'Historical Site',
        hours: '9:00 AM - 6:00 PM'
    }},
    { x: -15, z: 10, info: {
        name: 'N Seoul Tower',
        description: 'Iconic communication and observation tower',
        location: 'Namsan, Seoul',
        type: 'Landmark',
        hours: '10:00 AM - 11:00 PM'
    }},
    { x: 0, z: -15, info: {
        name: 'Lotte World',
        description: 'World\'s largest indoor theme park',
        location: 'Songpa-gu, Seoul',
        type: 'Amusement Park',
        hours: '9:30 AM - 10:00 PM'
    }},
    { x: 5, z: 15, info: {
        name: 'Bukchon Hanok Village',
        description: 'Traditional Korean village with hanok houses',
        location: 'Jongno-gu, Seoul',
        type: 'Cultural Site',
        hours: '24/7'
    }},
    { x: 15, z: -5, info: {
        name: 'Dongdaemun Design Plaza',
        description: 'Major urban development landmark',
        location: 'Jung-gu, Seoul',
        type: 'Architecture',
        hours: '10:00 AM - 7:00 PM'
    }},
    { x: 20, z: 5, info: {
        name: 'Myeongdong Shopping Street',
        description: 'Popular shopping and food district',
        location: 'Jung-gu, Seoul',
        type: 'Shopping',
        hours: '10:00 AM - 10:00 PM'
    }},
    { x: -5, z: -20, info: {
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
    { x: 15, z: 10, info: {
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
  

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    updateCameraOffset();

    camera.position.set(0, 30, 0);   // Position the camera above the scene
    camera.lookAt(0, 0, 0);          // Make it look at the center
    
    updateCameraOffset();

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Add orbit controls (disabled for rotation)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableRotate = false; // Disable rotation
    controls.enablePan = true; // Keep panning enabled

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.6);
    pointLight.position.set(-5, 5, -5);
    scene.add(pointLight);

    // Add ground with texture
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const groundTexture = textureLoader.load('textures/ground.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10); // Repeat texture 10x10 times

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
            color: 0xFFD666,
            transparent: true,
            opacity: 0.5,
            emissive: 0xFFD666,
            emissiveIntensity: 0
        });

        
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.rotation.x = -Math.PI / 2;

        // Position portal in front of the building
        const isSouthArea = pos.z < 0; // if z is negative, the building is in the south
        
        if (isSouthArea) {
            // Position portal only in the south area
            const angle = Math.atan2(pos.z, pos.x);
            portal.position.set(
                pos.x + Math.cos(angle) * PORTAL_DISTANCE_FROM_BUILDING,
                0.1,  // Slight elevation from the ground
                pos.z + Math.sin(angle) * PORTAL_DISTANCE_FROM_BUILDING
            );
            scene.add(portal);  // Add the portal to the scene
        }
        
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

        // Update camera position to follow spider smoothly
        const desiredCamPos = spider.position.clone().add(cameraOffset);
        camera.position.copy(spider.position).add(cameraOffset);
        camera.lookAt(spider.position);
        

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
    
    controls.update();
    renderer.render(scene, camera);
} 