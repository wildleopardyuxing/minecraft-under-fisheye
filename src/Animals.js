import * as THREE from 'three';

class Animal {
    constructor(game, x, y, z) {
        this.game = game;
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        // Fix: Add to world group so it rotates with the world!
        this.game.world.group.add(this.group);

        this.velocity = new THREE.Vector3();
        this.isDead = false;
        this.health = 3;

        // AI State
        this.state = 'IDLE'; // IDLE, WANDER, FLEE
        this.stateTimer = Math.random() * 3 + 2;
        this.moveSpeed = 0;

        // Initialize targetDir to be tangent to the surface
        const radialUp = this.group.position.clone().normalize();
        // Pick a random vector and cross with radialUp to get a tangent
        let randomVec = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        if (randomVec.clone().cross(radialUp).lengthSq() < 0.01) {
            randomVec = new THREE.Vector3(1, 0, 0); // Fallback if parallel
        }
        this.targetDir = new THREE.Vector3().crossVectors(radialUp, randomVec).normalize();

        this.createModel();
    }

    createModel() {
        // Override in subclass
    }

    update(deltaTime) {
        if (this.isDead) return;

        // AI Logic
        this.stateTimer -= deltaTime;
        if (this.stateTimer <= 0) {
            this.pickNewState();
        }

        // 1. Calculate Radial Up (Current Surface Normal)
        const radialUp = this.group.position.clone().normalize();

        // 2. Enforce targetDir is ALWAYS tangent to the sphere
        // This prevents the sheep from pitching up/down (looking into ground or sky)
        // v_tangent = v - (v . n) * n
        this.targetDir.sub(radialUp.clone().multiplyScalar(this.targetDir.dot(radialUp))).normalize();

        // If targetDir becomes zero (rare), pick a new random tangent
        if (this.targetDir.lengthSq() < 0.01) {
            let randomVec = new THREE.Vector3(Math.random(), Math.random(), Math.random());
            this.targetDir.crossVectors(radialUp, randomVec).normalize();
        }

        // Movement
        if (this.state === 'WANDER' || this.state === 'FLEE') {
            const moveDist = this.moveSpeed * deltaTime;

            // 3. Move
            this.group.position.add(this.targetDir.clone().multiplyScalar(moveDist));
        }

        // Physics: Snap to Sphere Surface + Hover
        // Simple Radial Projection
        const r = this.game.world.radius;
        const hoverHeight = 1.0; // Hover slightly to avoid clipping
        this.group.position.normalize().multiplyScalar(r + hoverHeight);

        // 4. Orientation
        // Align Up vector to Radial Up
        this.group.up.copy(radialUp);

        // Look in direction of movement (tangent)
        const lookTarget = this.group.position.clone().add(this.targetDir);
        this.group.lookAt(lookTarget);
    }

    pickNewState() {
        if (this.state === 'FLEE') {
            // Stop fleeing after a while
            this.state = 'IDLE';
            this.stateTimer = 2;
            this.moveSpeed = 0;
            return;
        }

        const r = Math.random();
        if (r < 0.6) {
            this.state = 'IDLE';
            this.stateTimer = Math.random() * 2 + 1;
            this.moveSpeed = 0;
        } else {
            this.state = 'WANDER';
            this.stateTimer = Math.random() * 3 + 1;
            this.moveSpeed = 2;

            // Pick random tangent direction
            const radialUp = this.group.position.clone().normalize();
            const randomDir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            this.targetDir.crossVectors(randomDir, radialUp).normalize();
        }
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.die();
        } else {
            this.state = 'FLEE';
            this.stateTimer = 5;
            this.moveSpeed = 6;

            // Run away from player
            // We need player position. Passed in game?
            if (this.game.player) {
                const away = this.group.position.clone().sub(this.game.player.camera.position).normalize();
                const radialUp = this.group.position.clone().normalize();
                this.targetDir.subVectors(away, radialUp.multiplyScalar(away.dot(radialUp))).normalize();
            }
        }
    }

    die() {
        this.isDead = true;
        this.game.scene.remove(this.group);
        // Remove from list? Handled in Animals manager
    }
}

class Sheep extends Animal {
    createModel() {
        // White Wool
        const woolMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        // Skin
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });

        // Body
        this.body = new THREE.Group();
        this.group.add(this.body);

        // Main Wool Body
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 1.2);
        const bodyMesh = new THREE.Mesh(bodyGeo, woolMat);
        bodyMesh.position.y = 0.6; // Lift up
        this.body.add(bodyMesh);

        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMesh = new THREE.Mesh(headGeo, skinMat);
        headMesh.position.set(0, 1.1, 0.7);
        this.body.add(headMesh);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const legPositions = [
            [-0.25, 0.3, 0.4],
            [0.25, 0.3, 0.4],
            [-0.25, 0.3, -0.4],
            [0.25, 0.3, -0.4]
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, skinMat);
            leg.position.set(...pos);
            this.body.add(leg);
        });
    }
}

export class Animals {
    constructor(game, count = 10) {
        this.game = game;
        this.animals = [];

        for (let i = 0; i < count; i++) {
            // Random position
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const r = this.game.world.radius + 1;

            const x = r * Math.sin(theta) * Math.cos(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(theta);

            const sheep = new Sheep(game, x, y, z);
            this.animals.push(sheep);
        }
    }

    update(deltaTime) {
        this.animals.forEach(animal => animal.update(deltaTime));
        // Cleanup dead
        this.animals = this.animals.filter(a => !a.isDead);
    }
}
