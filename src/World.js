import * as THREE from 'three';

const MAX_INSTANCES = 10000;

export class World {
    constructor(radius = 16) {
        this.radius = radius;
        this.group = new THREE.Group();
        this.blocks = new Map(); // "x,y,z" -> { type, index }

        // Keep track of meshes and counts
        this.meshes = {};
        this.counts = {};

        // Load Texture
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures.png');
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Helper to create material from atlas
        const createMat = (u, v) => {
            const tex = texture.clone();
            tex.repeat.set(0.5, 0.5);
            tex.offset.set(u, v);
            return new THREE.MeshStandardMaterial({ map: tex });
        };

        // Materials (Atlas: 2x2)
        // Top-Left: Grass (0, 0.5)
        // Top-Right: Dirt (0.5, 0.5)
        // Bottom-Left: Stone (0, 0)
        // Bottom-Right: Wood (0.5, 0)

        this.materials = {
            grass: createMat(0, 0.5),
            dirt: createMat(0.5, 0.5),
            stone: createMat(0, 0),
            wood: createMat(0.5, 0),
            leaf: new THREE.MeshStandardMaterial({ color: 0x2e7d32 }), // Keep leaves simple green for now
        };

        this.geometry = new THREE.BoxGeometry(1, 1, 1);

        // Initialize Meshes
        for (const type of Object.keys(this.materials)) {
            const mesh = new THREE.InstancedMesh(this.geometry, this.materials[type], MAX_INSTANCES);
            mesh.count = 0;
            mesh.userData.type = type;
            this.group.add(mesh);
            this.meshes[type] = mesh;
            this.counts[type] = 0;
        }

        this.generateWorld();
    }

    generateWorld() {
        const r = this.radius;

        // Generate Voxel Sphere
        for (let x = -r; x <= r; x++) {
            for (let y = -r; y <= r; y++) {
                for (let z = -r; z <= r; z++) {
                    const dist = Math.sqrt(x * x + y * y + z * z);

                    if (dist <= r && dist > r - 1) {
                        this.addBlock(x, y, z, 'grass');
                        if (Math.random() < 0.05) this.generateTree(x, y, z);
                    }
                    else if (dist <= r - 1 && dist > r - 3) {
                        this.addBlock(x, y, z, 'dirt');
                    }
                    else if (dist <= r - 3) {
                        this.addBlock(x, y, z, 'stone');
                    }
                }
            }
        }
    }

    generateTree(gx, gy, gz) {
        const normal = new THREE.Vector3(gx, gy, gz).normalize();
        let tx = gx, ty = gy, tz = gz;

        // Trunk
        for (let i = 1; i <= 3; i++) {
            const pos = new THREE.Vector3(gx, gy, gz).add(normal.clone().multiplyScalar(i)).round();
            if (!this.getBlock(pos.x, pos.y, pos.z)) {
                this.addBlock(pos.x, pos.y, pos.z, 'wood');
                tx = pos.x; ty = pos.y; tz = pos.z;
            }
        }

        // Leaves
        for (let lx = -1; lx <= 1; lx++) {
            for (let ly = -1; ly <= 1; ly++) {
                for (let lz = -1; lz <= 1; lz++) {
                    if (lx === 0 && ly === 0 && lz === 0) continue;
                    const lPos = new THREE.Vector3(tx + lx, ty + ly, tz + lz).round();
                    if (!this.getBlock(lPos.x, lPos.y, lPos.z)) {
                        this.addBlock(lPos.x, lPos.y, lPos.z, 'leaf');
                    }
                }
            }
        }
    }

    getBlock(x, y, z) {
        return this.blocks.get(`${x},${y},${z}`);
    }

    addBlock(x, y, z, type) {
        const key = `${x},${y},${z}`;
        if (this.blocks.has(key)) return; // Already exists

        const mesh = this.meshes[type];
        const count = this.counts[type];

        if (count >= MAX_INSTANCES) {
            console.warn(`Max instances reached for ${type}`);
            return;
        }

        const dummy = new THREE.Object3D();
        dummy.position.set(x, y, z);
        dummy.updateMatrix();

        mesh.setMatrixAt(count, dummy.matrix);
        mesh.count = count + 1;
        mesh.instanceMatrix.needsUpdate = true;

        this.blocks.set(key, { type, index: count });
        this.counts[type]++;
    }

    removeBlock(instanceId, type) {
        const mesh = this.meshes[type];
        const count = this.counts[type];

        if (count === 0) return;

        // Find the block being removed to delete from map
        const matrix = new THREE.Matrix4();
        mesh.getMatrixAt(instanceId, matrix);
        const pos = new THREE.Vector3();
        pos.setFromMatrixPosition(matrix);
        const key = `${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)}`;

        this.blocks.delete(key);

        // Swap with last
        const lastIndex = count - 1;

        // If we are removing the last one, just decrement
        if (instanceId === lastIndex) {
            this.counts[type]--;
            mesh.count = this.counts[type];
            mesh.instanceMatrix.needsUpdate = true;
            return;
        }

        const lastMatrix = new THREE.Matrix4();
        mesh.getMatrixAt(lastIndex, lastMatrix);

        // Update the "last" block's index in the map
        const lastPos = new THREE.Vector3();
        lastPos.setFromMatrixPosition(lastMatrix);
        const lastKey = `${Math.round(lastPos.x)},${Math.round(lastPos.y)},${Math.round(lastPos.z)}`;
        const lastBlock = this.blocks.get(lastKey);
        if (lastBlock) {
            lastBlock.index = instanceId; // It moved to the hole
        }

        mesh.setMatrixAt(instanceId, lastMatrix);
        mesh.count = count - 1;
        mesh.instanceMatrix.needsUpdate = true;

        this.counts[type]--;
    }

    update(deltaTime) {
        // World logic here
    }
}
