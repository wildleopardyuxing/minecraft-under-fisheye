import * as THREE from 'three';

export class Player {
    constructor(game) {
        this.game = game;
        this.speed = 10;
        this.bobbingTime = 0;

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        this.raycaster = new THREE.Raycaster();

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent context menu on right click
    }

    onKeyDown(event) {
        const key = event.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }
    }

    onKeyUp(event) {
        const key = event.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
    }

    onMouseDown(event) {
        if (!this.game.world) return;

        // Calculate mouse position in normalized device coordinates
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.game.camera);

        // Intersect with all meshes in the world group
        const intersects = this.raycaster.intersectObjects(this.game.world.group.children);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const type = hit.object.userData.type;

            if (event.button === 0) { // Left click: Mine
                if (hit.instanceId !== undefined) {
                    this.game.world.removeBlock(hit.instanceId, type);
                    this.game.inventory.add(type, 1);
                }
            } else if (event.button === 2) { // Right click: Place
                const selectedType = this.game.inventory.selected;
                if (this.game.inventory.items[selectedType] > 0) {
                    const normal = hit.face.normal;

                    // Transform hit point to local space of World Group
                    const localPoint = hit.point.clone().applyMatrix4(this.game.world.group.matrixWorld.clone().invert());

                    // Add normal (assuming axis aligned blocks and no scaling on group other than rotation)
                    // Since group is rotated, we need to rotate the normal too?
                    // Wait, hit.face.normal is in World Space? 
                    // Three.js docs: "face.normal is the normal of the face in object space."
                    // BUT, for InstancedMesh, it might be different.
                    // Actually, usually face.normal is in object space.
                    // If object is rotated, we need to transform it.
                    // But here, the InstancedMesh is NOT rotated. The Group is.
                    // So face.normal is in Group Local Space.
                    // So we can just use it directly.

                    const pos = localPoint.add(normal.multiplyScalar(0.5)).round();

                    this.game.world.addBlock(pos.x, pos.y, pos.z, selectedType);
                    this.game.inventory.remove(selectedType, 1);
                }
            }
        }
    }

    update(deltaTime) {
        if (!this.game.world) return;

        const moveSpeed = 1.0 * deltaTime;
        const worldGroup = this.game.world.group;
        let isMoving = false;

        if (this.keys.w) {
            worldGroup.rotateX(moveSpeed);
            isMoving = true;
        }
        if (this.keys.s) {
            worldGroup.rotateX(-moveSpeed);
            isMoving = true;
        }
        if (this.keys.a) {
            worldGroup.rotateZ(-moveSpeed);
            isMoving = true;
        }
        if (this.keys.d) {
            worldGroup.rotateZ(moveSpeed);
            isMoving = true;
        }

        // View Bobbing
        if (isMoving) {
            this.bobbingTime += deltaTime * 10;
            const bobOffset = Math.sin(this.bobbingTime) * 0.1;
            this.game.camera.position.y = this.game.world.radius + 1.8 + bobOffset;
        } else {
            // Reset to rest height smoothly
            this.bobbingTime = 0;
            this.game.camera.position.y = THREE.MathUtils.lerp(this.game.camera.position.y, this.game.world.radius + 1.8, deltaTime * 5);
        }
    }
}
