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
        this.yaw = 0;
        this.pitch = 0;
        this.isLocked = false;

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === document.body;
        });

        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseMove(event) {
        if (!this.isLocked) return;

        const sensitivity = 0.002;
        this.yaw -= event.movementX * sensitivity;
        this.pitch -= event.movementY * sensitivity;

        // Clamp pitch
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        // Update Camera Rotation
        // Camera is at (0, R+h, 0).
        // Yaw rotates around Y axis.
        // Pitch rotates around local X axis.

        const quaternion = new THREE.Quaternion();
        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);

        quaternion.multiplyQuaternions(qYaw, qPitch);
        this.game.camera.quaternion.copy(quaternion);
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

        if (!this.isLocked) {
            document.body.requestPointerLock();
            return;
        }

        // Raycast from center of screen
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.game.camera);

        // Intersect with all meshes in the world group
        const intersects = this.raycaster.intersectObjects(this.game.world.group.children);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const type = hit.object.userData.type;

            // Swing hand
            this.game.hand.swing();

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

        // Calculate movement direction relative to camera Yaw
        // Forward (W) -> Rotate World around Right Vector
        // Right (D) -> Rotate World around Forward Vector (actually -Forward)

        // Camera Right Vector (ignoring pitch for movement)
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        // Camera Forward Vector (ignoring pitch)
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        if (this.keys.w) {
            // Move Forward: Rotate world around Right vector?
            // If we move forward, the world rolls towards us.
            // Axis of rotation is Perpendicular to Forward and Up. That is Right.
            // Direction: Positive or Negative?
            // If we look -Z, Right is +X.
            // Rotating +X brings +Z up (towards -Z). Correct.
            worldGroup.rotateOnWorldAxis(right, moveSpeed);
            isMoving = true;
        }
        if (this.keys.s) {
            worldGroup.rotateOnWorldAxis(right, -moveSpeed);
            isMoving = true;
        }
        if (this.keys.a) {
            // Move Left: Rotate world around Forward vector?
            // If we look -Z, Forward is -Z.
            // Rotating around -Z (CCW): +X goes to +Y.
            // We want ground to move Right (+X).
            // So we need to rotate around Forward (-Z) in negative direction?
            // Or rotate around Z axis.
            // Let's visualize.
            // Move Left -> Ground moves Right.
            // Axis is Forward.
            worldGroup.rotateOnWorldAxis(forward, moveSpeed); // Check sign
            isMoving = true;
        }
        if (this.keys.d) {
            worldGroup.rotateOnWorldAxis(forward, -moveSpeed);
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
