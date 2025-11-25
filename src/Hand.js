import * as THREE from 'three';

export class Hand {
    constructor(game) {
        this.game = game;
        this.group = new THREE.Group();

        // Attach to camera so it moves with view
        this.game.camera.add(this.group);

        // Position relative to camera (bottom right)
        this.group.position.set(0.5, -0.5, -1);

        // Create Arm/Hand Mesh
        const armGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 }); // Skin color
        this.arm = new THREE.Mesh(armGeo, armMat);
        this.arm.position.set(0, -0.5, 0);
        this.arm.rotation.x = Math.PI / 4;
        this.group.add(this.arm);

        // Tool Mesh (Placeholder)
        this.toolGroup = new THREE.Group();
        this.toolGroup.position.set(0, 0.2, -0.2); // Hold in hand
        this.group.add(this.toolGroup);

        this.isSwinging = false;
        this.swingTime = 0;

        this.setTool(null);
    }

    setTool(type) {
        this.toolGroup.clear();

        if (type === 'pickaxe') {
            // Create simple pickaxe
            const handleGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
            const handleMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 }); // Wood
            const handle = new THREE.Mesh(handleGeo, handleMat);

            const headGeo = new THREE.BoxGeometry(0.6, 0.1, 0.1);
            const headMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e }); // Stone
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.set(0, 0.4, 0);

            this.toolGroup.add(handle);
            this.toolGroup.add(head);

            // Rotate tool to look natural
            this.toolGroup.rotation.set(0, 0, -Math.PI / 4);
        } else if (type && type !== 'hand') {
            // Block item
            const blockGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            // Reuse world materials? Or create new?
            // Let's just use a color for now to keep it simple, or try to clone material
            let color = 0xffffff;
            if (type === 'grass') color = 0x4caf50;
            if (type === 'dirt') color = 0x795548;
            if (type === 'stone') color = 0x9e9e9e;
            if (type === 'wood') color = 0x8d6e63;

            const blockMat = new THREE.MeshStandardMaterial({ color: color });
            const block = new THREE.Mesh(blockGeo, blockMat);
            this.toolGroup.add(block);
            this.toolGroup.rotation.set(0, Math.PI / 4, 0);
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
        this.group.position.y = -0.5 + Math.sin(time * 2) * 0.02;
        this.group.position.x = 0.5 + Math.cos(time * 1.5) * 0.02;

        // Swing Animation
        if (this.isSwinging) {
            this.swingTime += deltaTime * 10;
            if (this.swingTime > Math.PI) {
                this.isSwinging = false;
                this.swingTime = 0;
                this.group.rotation.x = 0;
                this.group.rotation.z = 0;
            } else {
                // Simple chop motion
                this.group.rotation.x = -Math.sin(this.swingTime) * 1.0;
                this.group.rotation.z = -Math.sin(this.swingTime) * 0.5;
            }
        }
    }
}
