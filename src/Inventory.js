export class Inventory {
    constructor() {
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
        const div = document.createElement('div');
        div.id = 'inventory';
        div.style.position = 'absolute';
        div.style.bottom = '10px';
        div.style.left = '10px';
        div.style.color = 'white';
        div.style.fontFamily = 'monospace';
        div.style.backgroundColor = 'rgba(0,0,0,0.5)';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        document.body.appendChild(div);
        this.ui = div;
    }

    updateUI() {
        let html = '<h3>Inventory</h3>';
        for (const [type, count] of Object.entries(this.items)) {
            const isSelected = this.selected === type ? '>' : '&nbsp;';
            html += `<div>${isSelected} ${type}: ${count}</div>`;
        }
        html += '<hr/>';
        html += '<div><small>C: Craft Pickaxe (3 Wood, 2 Stone)</small></div>';
        html += '<small>1-5 to select</small>';
        this.ui.innerHTML = html;
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
            }
        }
        if (e.key.toLowerCase() === 'c') {
            this.craft();
        }
    }
}
