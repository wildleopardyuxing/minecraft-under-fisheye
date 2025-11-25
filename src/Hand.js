import * as THREE from 'three';

export class Hand {
    constructor(game) {
        this.game = game;
        this.group = new THREE.Group();

        // Attach to camera so it moves with view
        this.game.camera.add(this.group);

        // Position relative to camera (bottom right)
        this.group.position.set(0.5, -0.5, -0.8);
        this.group.rotation.set(0, 0, 0);

        // Load Texture
        const loader = new THREE.TextureLoader();
        this.texture = loader.load('/textures.png');
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.colorSpace = THREE.SRGBColorSpace;

        // Create Arm/Hand Mesh
        // Arm should come from bottom
        const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 }); // Skin color
        this.arm = new THREE.Mesh(armGeo, armMat);
        this.arm.position.set(0.2, -0.6, 0.2);
        this.arm.rotation.x = Math.PI / 8;
        this.arm.rotation.z = -Math.PI / 8;
        this.group.add(this.arm);

        // Tool Mesh Container
        this.toolGroup = new THREE.Group();
        this.toolGroup.position.set(0.2, -0.3, -0.2); // Hold in hand position
        this.group.add(this.toolGroup);

        this.isSwinging = false;
        this.swingTime = 0;

        this.setTool(null);
    }

    createMat(u, v) {
        const tex = this.texture.clone();
        tex.repeat.set(0.5, 0.5);
        tex.offset.set(u, v);
        return new THREE.MeshStandardMaterial({ map: tex });
    }

    setTool(type) {
        this.toolGroup.clear();

        if (type === 'pickaxe') {
            // Create Voxel Pickaxe
            const voxelSize = 0.05;
            const geo = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
            const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e }); // Stone/Iron

            const addVoxel = (x, y, z, mat) => {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
                this.toolGroup.add(mesh);
            };

            // Handle
            for (let i = 0; i < 8; i++) {
                addVoxel(0, i, 0, woodMat);
            }

            // Head (Pickaxe shape)
            // Center at top of handle (0, 7, 0)
            // Curve down
            addVoxel(0, 7, 0, stoneMat); // Center
            addVoxel(-1, 7, 0, stoneMat);
            addVoxel(1, 7, 0, stoneMat);
            addVoxel(-2, 6, 0, stoneMat);
            addVoxel(2, 6, 0, stoneMat);
            addVoxel(-3, 5, 0, stoneMat); // Tip
            addVoxel(3, 5, 0, stoneMat); // Tip

            // Orient the pickaxe
            // Try to make it look like held in right hand
            // Handle (Y) should point Up and slightly Forward/Left
            // Head (X) should point Forward/Left

            // Start with Handle Up, Head Forward
            // rotation.set(0, -Math.PI / 2, 0); 

            // Tilt forward (X)
            // Tilt left (Z)

            this.toolGroup.rotation.set(-Math.PI / 6, -Math.PI / 2, -Math.PI / 6);
            this.toolGroup.position.set(0.3, -0.3, -0.4);

        } else if (type && type !== 'hand') {
            // Block item
            const blockGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);

            let mat;
            switch (type) {
                case 'grass': mat = this.createMat(0, 0.5); break;
                case 'dirt': mat = this.createMat(0.5, 0.5); break;
                case 'stone': mat = this.createMat(0, 0); break;
                case 'wood': mat = this.createMat(0.5, 0); break;
                case 'leaf': mat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 }); break;
                default: mat = new THREE.MeshStandardMaterial({ color: 0xffffff }); break;
            }

            const block = new THREE.Mesh(blockGeo, mat);
            this.toolGroup.add(block);

            // Hold block
            this.toolGroup.rotation.set(0, Math.PI / 4, 0);
            this.toolGroup.position.set(0.2, -0.2, -0.3);
        }
    }

    swing() {
        if (this.isSwinging) return;
        this.isSwinging = true;
        this.swingTime = 0;
    }

    update(deltaTime) {
        // Idle Sway
        const time = this.game.clock.getElapsedTime();
        // Sway the whole group slightly
        const swayX = Math.cos(time * 2) * 0.02;
        const swayY = Math.sin(time * 4) * 0.02;

        // Base position
        const baseX = 0.5;
        const baseY = -0.5;

        // Swing Animation
        if (this.isSwinging) {
            this.swingTime += deltaTime * 15; // Speed of swing

            if (this.swingTime > Math.PI) {
                this.isSwinging = false;
                this.swingTime = 0;
                this.group.rotation.set(0, 0, 0);
                this.group.position.set(baseX, baseY, -0.8);
            } else {
                // Chop motion: Rotate X down, Move forward/down
                const swingProgress = Math.sin(this.swingTime);

                // Rotation
                this.group.rotation.x = -swingProgress * 1.5; // Rotate down
                this.group.rotation.y = -swingProgress * 0.5; // Rotate in

                // Position offset to make it look like a chop
                this.group.position.x = baseX + swayX - swingProgress * 0.2;
                this.group.position.y = baseY + swayY - swingProgress * 0.2;
                this.group.position.z = -0.8 - swingProgress * 0.4;
            }
        } else {
            // Just sway
            this.group.position.x = baseX + swayX;
            this.group.position.y = baseY + swayY;
            this.group.rotation.set(0, 0, 0);
        }
    }
}
