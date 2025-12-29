//--------------------------------
// jc://remote/
//--------------------------------

let macro_container = `
    <div class="macro-edit-container">
      <div class="macro-edit-palette" id="palette"></div>
      <div class="macro-edit-area">
      
        <div class="macro-device">
            <div class="macro-device-header">Devices</div>
            <div class="macro-device-content open">
                 <div class="devices" id="deviceBar"></div>
            </div>
        </div>
      
        <div class="macro-device">
            <div class="macro-device-header">Edit Macro</div>
            <div class="macro-edit-content open">
                <div class="macro-dropzone" id="macroDropzone"></div>
            </div>
        </div>
      
        <div class="macro-output">
            <h3>Macro Output</h3>
            <textarea id="macroOutput" readonly>
        </div>
      </div>
    </div>
    `;

/* class to create a GUI macro editor */
class MacroEditor {
    constructor(config) {
        this.categories = config.categories;
        this.devices = config.devices;

        this.paletteEl = config.paletteEl;
        this.deviceBarEl = config.deviceBarEl;
        this.dropzoneEl = config.dropzoneEl;
        this.outputEl = config.outputEl;

        this.macros = {};
        this.devices.forEach(d => this.macros[d] = []);
        this.activeDevice = this.devices[0];

        this.dragged = null;
        this.dropIndex = null;
        this.firstOpen = true;

        this.init();
    }

    /* ---------- Init ---------- */
    init() {
        this.renderPalette();
        this.renderDevices();
        this.renderMacro();
        this.attachGlobalDragEnd();
    }

    /* ---------- Palette ---------- */
    renderPalette() {
        this.paletteEl.innerHTML = "";

        for (const [category, data] of Object.entries(this.categories)) {
        const box = document.createElement("div");
        box.className = "category";

        const header = document.createElement("div");
        header.className = "category-header";
        header.textContent = category;

        const content = document.createElement("div");
        content.className = "category-content";
        if (this.firstOpen) {
        content.classList.add("open");
        this.firstOpen = false;
    }

    const tags = document.createElement("div");
    tags.className = "tags";

    data.commands.forEach((cmd, index) => {
        const tag = document.createElement("div");
        tag.className = "tag";
        tag.textContent = cmd;
        tag.style.background = data.color;
        tag.draggable = true;
        tag.ondragstart = () => {
            this.dragged = { source: "palette", category, index };
        };
        tags.appendChild(tag);
    });

    header.onclick = () => content.classList.toggle("open");
    content.appendChild(tags);
    box.append(header, content);
    this.paletteEl.appendChild(box);
    }
}

    /* ---------- Devices ---------- */
    renderDevices() {
        this.deviceBarEl.innerHTML = "";
        this.devices.forEach(device => {
            const el = document.createElement("div");
            el.className = "device" + (device === this.activeDevice ? " active" : "");
            el.textContent = device;
            el.onclick = () => {
                this.activeDevice = device;
                this.renderDevices();
                this.renderMacro();
            };
            this.deviceBarEl.appendChild(el);
        });
    }

    /* ---------- Macro Drop ---------- */
    attachDropzoneHandlers() {
        this.dropzoneEl.ondragover = e => {
            e.preventDefault();
            this.dropIndex = this.calculateDropIndex(e);
        };

    this.dropzoneEl.ondrop = e => {
        e.preventDefault();
        const macro = this.macros[this.activeDevice];

        if (!this.dragged) return;

        if (this.dragged.source === "palette") {
        const { category, index } = this.dragged;
        macro.splice(this.dropIndex, 0, {
        category,
        command: this.categories[category].commands[index],
        color: this.categories[category].color
    });
}

    if (this.dragged.source === "macro") {
    const [moved] = macro.splice(this.dragged.index, 1);
    macro.splice(this.dropIndex, 0, moved);
}

    this.dragged = null;
    this.renderMacro();
};
}

    /* ---------- Macro Drop - calculate index ---------- */
    calculateDropIndex(e) {
    const items = [...this.dropzoneEl.children];
    let idx = items.length;

    items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const withinX = Math.abs(e.clientX - (r.left + r.width / 2)) < r.width / 2;
        const withinY = Math.abs(e.clientY - (r.top + r.height / 2)) < r.height / 2;
        if (withinX && withinY) idx = Math.min(idx, i);
    });

    return idx;
}

    /* ---------- Drag-out Delete ---------- */
    attachGlobalDragEnd() {
        document.addEventListener("dragend", e => {
            if (this.dragged?.source === "macro") {
                const r = this.dropzoneEl.getBoundingClientRect();
                if (
                e.clientX < r.left || e.clientX > r.right ||
                e.clientY < r.top || e.clientY > r.bottom
                ) {
                    this.macros[this.activeDevice].splice(this.dragged.index, 1);
                }
            }
            this.dragged = null;
            this.renderMacro();
        });
    }

    /* ---------- Render Macro ---------- */
    renderMacro() {
        this.dropzoneEl.innerHTML = "";
        const macro = this.macros[this.activeDevice];

        macro.forEach((item, index) => {
            const tag = document.createElement("div");
            tag.className = "macro-tag";
            tag.textContent = item.command;
            tag.style.background = item.color;
            tag.draggable = true;
            tag.ondragstart = () => {
                this.dragged = { source: "macro", index };
            };
            this.dropzoneEl.appendChild(tag);
        });

        this.attachDropzoneHandlers();
        this.updateOutput();
    }

    /* ---------- Output ---------- */
    updateOutput() {
        const result = {};
        this.devices.forEach(d => {
            result[d] = this.macros[d].map(m =>
            m.category === "Timing" ? m.command : `${m.category}_${m.command}`
            );
        });
        this.outputEl.value = JSON.stringify(result, null, 2);
    }
}

function init_macro_editor() {
    const editor = new MacroEditor({
        categories: {
            Movement: {color: "#28a745", commands: ["UP", "DOWN", "LEFT", "RIGHT"]},
            Actions: {color: "#dc3545", commands: ["JUMP", "SHOOT", "RELOAD"]},
            Timing: {color: "#007bff", commands: [100, 250, 500]}
        },
        devices: ["device1", "device2"],
        paletteEl: document.getElementById("palette"),
        deviceBarEl: document.getElementById("deviceBar"),
        dropzoneEl: document.getElementById("macroDropzone"),
        outputEl: document.getElementById("macroOutput")
    });
}
