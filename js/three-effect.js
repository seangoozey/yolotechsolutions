// Three.js Wireframe Effect for S&S Computer Repair Website

class WireframeEffect {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lines = [];
        this.targetPoints = [];
        this.animationId = null;
        this.isInitialized = false;
        this.wireframeModel = null;
        this.fallbackWireframe = null;
        this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.isPaused = false;
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xFFFFFF);
        
        // Initialize fog with responsive values
        this.updateFog();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Load wireframe model first, then create floating lines
        this.loadWireframeModel().then(() => {

        });
        
        // Add lights
        this.addLights();

        // Respect prefers-reduced-motion: render a single static frame
        // (also rendered once the model loads) instead of animating
        if (!this.reducedMotion) {
            this.animate();
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
            this.updateFog();
        });
        
        this.isInitialized = true;
    }
    
    loadWireframeModel() {
        return new Promise((resolve, reject) => {
            // Check if GLTFLoader is available
            if (typeof THREE.GLTFLoader === 'undefined') {
                console.error('GLTFLoader not available, using fallback');
                this.createFallbackTargetPoints();
                resolve();
                return;
            }
        
        const loader = new THREE.GLTFLoader();
        
        loader.load(
            './img/wireframe-computer.gltf',
            (gltf) => {
                this.wireframeModel = gltf.scene;
                
                // Scale and position the model
                this.wireframeModel.scale.set(15, 15, 15);
                this.wireframeModel.position.set(20, 0, 0);
                
                this.wireframeModel.traverse((child) => {
                   
                    // Hide the original LineSegments
                    child.visible = true;
                });
                
                this.scene.add(this.wireframeModel);

                // Draw the loaded model when reduced motion skips the animation loop
                if (this.reducedMotion && this.renderer) {
                    this.renderer.render(this.scene, this.camera);
                }

                resolve();
            },
            (progress) => {
                // Loading progress tracking removed
            },
            (error) => {
                console.error('Error loading GLTF model:', error);
                //this.createFallbackTargetPoints();
                resolve();
            }
        );
        });
    }
    
    createFallbackTargetPoints() {
        // Create fallback wireframe geometry if GLTF loading fails
        const geometry = new THREE.BoxGeometry(20, 15, 10);
        const edges = new THREE.EdgesGeometry(geometry);
        
        // Extract target points from wireframe edges
        const positions = edges.attributes.position.array;
        for (let i = 0; i < positions.length; i += 6) {
            this.targetPoints.push(new THREE.Vector3(
                positions[i],
                positions[i + 1],
                positions[i + 2]
            ));
            this.targetPoints.push(new THREE.Vector3(
                positions[i + 3],
                positions[i + 4],
                positions[i + 5]
            ));
        }
        
        // Create visible fallback wireframe
        this.fallbackWireframe = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ 
                color: 0xED2024,
                transparent: true,
                opacity: 0.1
            })
        );
        
        this.scene.add(this.fallbackWireframe);
    }
    
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Point light
        const pointLight = new THREE.PointLight(0xED2024, 1, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Animate floating lines
        this.lines.forEach((line, index) => {
            const userData = line.userData;
            
            // Move lines towards their targets
            if (userData.targetStart) {
                const currentPosition = line.geometry.attributes.position;
                const startPoint = new THREE.Vector3(
                    currentPosition.array[0],
                    currentPosition.array[1],
                    currentPosition.array[2]
                );
                const endPoint = new THREE.Vector3(
                    currentPosition.array[3],
                    currentPosition.array[4],
                    currentPosition.array[5]
                );
                
                // Calculate distance to target
                const distanceToTarget = startPoint.distanceTo(userData.targetStart);
                
                if (distanceToTarget > 0.1) {
                    // Interpolate both start and end points towards their targets
                    startPoint.lerp(userData.targetStart, userData.speed);
                    endPoint.lerp(userData.targetEnd, userData.speed);
                }
                
                // Update geometry
                currentPosition.array[0] = startPoint.x;
                currentPosition.array[1] = startPoint.y;
                currentPosition.array[2] = startPoint.z;
                currentPosition.array[3] = endPoint.x;
                currentPosition.array[4] = endPoint.y;
                currentPosition.array[5] = endPoint.z;
                currentPosition.needsUpdate = true;
            } else {
                // Floating animation for lines without targets
                const positions = line.geometry.attributes.position.array;
                positions[0] += userData.velocity.x;
                positions[1] += userData.velocity.y;
                positions[2] += userData.velocity.z;
                positions[3] += userData.velocity.x;
                positions[4] += userData.velocity.y;
                positions[5] += userData.velocity.z;
                
                // Bounce off boundaries
                const bounds = 50;
                for (let i = 0; i < 6; i += 3) {
                    if (Math.abs(positions[i]) > bounds) userData.velocity.x *= -1;
                    if (Math.abs(positions[i + 1]) > bounds) userData.velocity.y *= -1;
                    if (Math.abs(positions[i + 2]) > bounds) userData.velocity.z *= -1;
                }
                
                line.geometry.attributes.position.needsUpdate = true;
            }
            
            // Add subtle rotation
            line.rotation.y += 0.001;
        });
        
        // Rotate the wireframe model if it exists
        if (this.wireframeModel) {
            this.wireframeModel.rotation.y += 0.001;
            this.wireframeModel.rotation.x += 0.0005;
            this.wireframeModel.rotation.z += 0.0005;
        }
        
        // Rotate fallback wireframe if it exists
        if (this.fallbackWireframe) {
            this.fallbackWireframe.rotation.y += 0.001;
            this.fallbackWireframe.rotation.x += 0.0005;
            this.fallbackWireframe.rotation.z += 0.0005;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    // Stop the render loop while the hero is off-screen (saves GPU/battery)
    pause() {
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resume() {
        if (!this.isPaused || this.reducedMotion) {
            return;
        }
        this.isPaused = false;
        this.animate();
    }

    updateFog() {
        if (!this.scene) return;
        
        const windowWidth = window.innerWidth;
        const maxWidth = 1200; // Maximum width for fog calculation
        const minWidth = 320;  // Minimum width for fog calculation
        
        // Calculate fog distance based on screen width
        let fogDistance;
        if (windowWidth <= minWidth) {
            fogDistance = 200; // Maximum fog distance for small screens
        } else if (windowWidth >= maxWidth) {
            fogDistance = 100; // Minimum fog distance for large screens
        } else {
            // Linear interpolation between min and max fog distances
            const ratio = (windowWidth - minWidth) / (maxWidth - minWidth);
            fogDistance = 200 - (ratio * 100); // 200 to 100
        }
        
        // Update fog with new distance
        this.scene.fog = new THREE.Fog(0x000000, 1, fogDistance);
    }
    
    onWindowResize() {
        if (!this.isInitialized) return;
        
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer && this.container) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Dispose of geometries and materials
        this.lines.forEach(line => {
            line.geometry.dispose();
            line.material.dispose();
        });
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize the effect when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create container for Three.js effect
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const threeContainer = document.createElement('div');
        threeContainer.id = 'three-effect-container';
        threeContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        `;
        
        // Make hero content appear above the effect
        const heroContent = heroSection.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.position = 'relative';
            heroContent.style.zIndex = '2';
        }
        
        heroSection.style.position = 'relative';
        heroSection.appendChild(threeContainer);
        
        // Initialize Three.js effect
        const wireframeEffect = new WireframeEffect('three-effect-container');
        
        // Store reference for cleanup
        window.wireframeEffect = wireframeEffect;

        // Pause the render loop whenever the hero scrolls out of view
        if ('IntersectionObserver' in window) {
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        wireframeEffect.resume();
                    } else {
                        wireframeEffect.pause();
                    }
                });
            }, { threshold: 0 });
            heroObserver.observe(heroSection);
        }
    }
});
