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
        hint.style.bottom = '60px';
        hint.style.left = '50%';
        hint.style.transform = 'translateX(-50%)';
        hint.style.color = 'white';
        hint.style.textShadow = '1px 1px 0 #000';
        hint.style.fontSize = '12px';
        hint.innerText = 'C: Craft Pickaxe (3 Wood + 2 Stone)';
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
                            icon.style.backgroundColor = 'cyan';
                            // Add a simple pickaxe shape using CSS pseudo-elements? 
                            // For now just color is fine to distinguish.
                            icon.innerHTML = '⛏️'; // Emoji as placeholder
                            icon.style.display = 'flex';
                            icon.style.alignItems = 'center';
                            icon.style.justifyContent = 'center';
                            icon.style.fontSize = '20px';
                            break;
                    }

                    slot.appendChild(icon);

                    const countDiv = document.createElement('div');
                    countDiv.className = 'slot-count';
                    countDiv.innerText = count;
                    slot.appendChild(countDiv);
                }
            }

            this.ui.appendChild(slot);
        });
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
        if (key >= 1 && key <= 5) {
            const types = Object.keys(this.items);
            if (key <= types.length) {
                this.selected = types[key - 1];
                this.updateUI();
                if (this.game && this.game.hand) {
                    this.game.hand.setTool(this.selected);
                }
            }
        }
        if (e.key.toLowerCase() === 'c') {
            this.craft();
        }
    }
}
