import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { Animals } from './Animals.js';
import { Inventory } from './Inventory.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 50);

        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Setup Inventory
        this.inventory = new Inventory();

        // Setup World
        this.world = new World();
        this.scene.add(this.world.group);

        // Setup Animals
        this.animals = new Animals(this);
        this.scene.add(this.animals.group);

        // Setup Player
        this.player = new Player(this);

        // Setup Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        // Camera Positioning
        // Player is at the "top" of the world (0, radius, 0)
        // To feel like walking on ground, place camera at eye level (radius + 1.8)
        // And look forward (-Z)

        const radius = this.world.radius;
        this.camera.position.set(0, radius + 1.8, 0);
        this.camera.lookAt(0, radius, -10);

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        this.clock = new THREE.Clock();
    }

    start() {
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        this.player.update(deltaTime);
        this.world.update(deltaTime);
        this.animals.update(deltaTime);

        this.renderer.render(this.scene, this.camera);
    }
}
