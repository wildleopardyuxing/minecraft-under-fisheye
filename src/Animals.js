import * as THREE from 'three';

export class Animals {
    constructor(game, count = 10) {
        this.game = game;
        this.group = new THREE.Group();
        this.animals = [];

        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White sheep?

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geometry, material);

            // Random position
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const r = this.game.world.radius + 1; // On top of blocks

            const x = r * Math.sin(theta) * Math.cos(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(theta);

            mesh.position.set(x, y, z);
            this.group.add(mesh);

            this.animals.push({
                mesh: mesh,
                velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2)
            });
        }
    }

    update(deltaTime) {
        const r = this.game.world.radius + 1; // Stay on surface

        this.animals.forEach(animal => {
            // Move
            const move = animal.velocity.clone().multiplyScalar(deltaTime);
            animal.mesh.position.add(move);

            // Re-project to sphere surface
            animal.mesh.position.normalize().multiplyScalar(r);

            // Align rotation
            const normal = animal.mesh.position.clone().normalize();
            const up = new THREE.Vector3(0, 1, 0);
            animal.mesh.quaternion.setFromUnitVectors(up, normal);

            // Randomly change direction
            if (Math.random() < 0.02) {
                animal.velocity = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2);
            }
        });
    }
}
