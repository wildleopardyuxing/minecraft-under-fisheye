export class Inventory {
    constructor(game) {
        this.game = game;
        this.items = {
            grass: 0,
            dirt: 0,
            stone: 0,
            wood: 0,
            leaf: 0
        };

        this.selected = 'stone'; // Default selected item

        this.createUI();
        this.updateUI();

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    createUI() {
        // Remove old UI if exists
        const old = document.getElementById('inventory');
        if (old) old.remove();

        const div = document.createElement('div');
        div.id = 'hotbar';
        document.body.appendChild(div);
        this.ui = div;

        // Crafting hint
        const hint = document.createElement('div');
        hint.style.position = 'absolute';
        hint.style.bottom = '80px'; // Moved up to avoid overlap
        hint.style.left = '50%';
        hint.style.transform = 'translateX(-50%)';
        hint.style.color = 'white';
        hint.style.textShadow = '1px 1px 0 #000';
        hint.style.fontSize = '12px';
        hint.innerText = 'Left Click: Action (Mine/Place) | C: Craft Pickaxe';
        document.body.appendChild(hint);
    }

    updateUI() {
        this.ui.innerHTML = '';

        // Define slots order
        const slots = ['grass', 'dirt', 'stone', 'wood', 'leaf', 'pickaxe'];

        slots.forEach((type, index) => {
            const count = this.items[type] || 0;
            const slot = document.createElement('div');
            slot.className = `slot ${this.selected === type ? 'selected' : ''}`;

            if (count > 0 || type === 'pickaxe') { // Show pickaxe even if 0? No, only if owned.
                // Wait, pickaxe is an item.
                if (this.items[type] > 0) {
                    const icon = document.createElement('div');
                    icon.className = 'slot-icon';

                    // Set background position based on type
                    // Atlas: 2x2. 
                    // Grass: 0,0. Dirt: 1,0. Stone: 0,1. Wood: 1,1. (In CSS coords)
                    // Wait, CSS background-position is x y.
                    // Texture is 2x2.
                    // Grass (0, 0.5) in UV -> Top-Left.
                    // In CSS background-image:
                    // Top-Left: 0 0
                    // Top-Right: 100% 0
                    // Bottom-Left: 0 100%
                    // Bottom-Right: 100% 100%

                    switch (type) {
                        case 'grass':
                            icon.style.backgroundImage = 'url(/textures.png)';
                            icon.style.backgroundPosition = '0 0';
                            break;
                        case 'dirt':
                            icon.style.backgroundImage = 'url(/textures.png)';
                            icon.style.backgroundPosition = '100% 0';
                            break;
                        case 'stone':
                            icon.style.backgroundImage = 'url(/textures.png)';
                            icon.style.backgroundPosition = '0 100%';
                            break;
                        case 'wood':
                            icon.style.backgroundImage = 'url(/textures.png)';
                            icon.style.backgroundPosition = '100% 100%';
                            break;
                        case 'leaf':
                            icon.style.backgroundImage = 'none';
                            icon.style.backgroundColor = '#2e7d32';
                            break;
                        case 'pickaxe':
                            icon.style.backgroundImage = 'none';
                            icon.style.backgroundColor = 'transparent';

                            // Draw Voxel Pickaxe Icon on Canvas
                            const canvas = document.createElement('canvas');
                            canvas.width = 32;
                            canvas.height = 32;
                            const ctx = canvas.getContext('2d');

                            // Draw simple pixel art pickaxe
                            ctx.fillStyle = '#8d6e63'; // Wood
                            // Handle (diagonal)
                            for (let i = 4; i < 28; i += 2) {
                                ctx.fillRect(i, 32 - i - 2, 4, 4);
                            }

                            ctx.fillStyle = '#9e9e9e'; // Stone
                            // Head (Arc)
                            ctx.fillRect(20, 2, 4, 4);
                            ctx.fillRect(16, 4, 4, 4);
                            ctx.fillRect(24, 4, 4, 4);
                            ctx.fillRect(12, 8, 4, 4);
                            ctx.fillRect(28, 8, 4, 4);

                            icon.style.backgroundImage = `url(${canvas.toDataURL()})`;
                            icon.style.backgroundSize = 'contain';
                            icon.style.backgroundRepeat = 'no-repeat';
                            break;
                    }

                    slot.appendChild(icon);

                    const countDiv = document.createElement('div');
                    countDiv.className = 'slot-count';
                    countDiv.innerText = count > 0 ? count : ''; // Don't show 0
                    slot.appendChild(countDiv);
                }
            }

            this.ui.appendChild(slot);
        });

        // Update Hand Tool based on count
        if (this.game && this.game.hand) {
            const count = this.items[this.selected] || 0;
            if (this.selected === 'pickaxe' && count > 0) {
                this.game.hand.setTool('pickaxe');
            } else if (count > 0) {
                this.game.hand.setTool(this.selected);
            } else {
                this.game.hand.setTool('hand'); // Empty hand
            }
        }
    }

    add(type, count = 1) {
        if (this.items.hasOwnProperty(type)) {
            this.items[type] += count;
            this.updateUI();
        } else {
            // Add new item type if not exists (e.g. Pickaxe)
            this.items[type] = count;
            this.updateUI();
        }
    }

    remove(type, count = 1) {
        if (this.items.hasOwnProperty(type) && this.items[type] >= count) {
            this.items[type] -= count;
            this.updateUI();
            return true;
        }
        return false;
    }

    craft() {
        // Simple recipe: 3 Wood + 2 Stone = 1 Pickaxe
        if (this.items.wood >= 3 && this.items.stone >= 2) {
            this.remove('wood', 3);
            this.remove('stone', 2);
            this.add('pickaxe', 1);
            console.log("Crafted Pickaxe!");
        } else {
            console.log("Not enough resources!");
        }
    }

    onKeyDown(e) {
        const key = parseInt(e.key);
        // Slots: 1:grass, 2:dirt, 3:stone, 4:wood, 5:leaf, 6:pickaxe
        const slots = ['grass', 'dirt', 'stone', 'wood', 'leaf', 'pickaxe'];

        if (key >= 1 && key <= slots.length) {
            this.selected = slots[key - 1];
            this.updateUI();
        }
        if (e.key.toLowerCase() === 'c') {
            this.craft();
        }
    }
}
