//--------------------------------
// jc://remote/
//--------------------------------

let macro_sample_data_set = {
    categories: {
        Movement: {color: "#28a745", commands: ["UP", "DOWN", "LEFT", "RIGHT"]},
        Actions: {color: "#dc3545", commands: ["JUMP", "SHOOT", "RELOAD"]},
        Timing: {color: "#007bff", commands: [100, 250, 500]}
    },
    initial: {
        "device1": ["Movement_UP","Timing_100","Movement_DOWN"],
        "device2": ["Actions_JUMP","Timing_100","Actions_SHOOT"],
    },
    devices: ["device1", "device2"],
}
let macro_container = `
    <div class="macro-edit-container">
      <div class="macro-edit-palette" id="palette"></div>
      <div class="macro-edit-area">
      
        <div class="macro-device">
            <div class="macro-device-header">Macros</div>
            <div class="macro-device-content open" id="device-content">
                <div class="nav-arrow left" data-dir="-1" id="macro-nav-left">◀</div>
                <div class="devices" id="deviceBar"></div>
                <div class="nav-arrow right" data-dir="1" id="macro-nav-right">▶</div>
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
class RemoteMacroEditor {
    constructor(container, config) {
        this.config = config;
        this.container_name = container;
        this.colors = {
            timing: ["blue"],
            macros: [
                "#ba68c8",
                "#ab47bc",
                "#9c27b0",
                "#8e24aa",
                "#7b1fa2",
                "#6a1b9a",
                "#4a148c",
                "#3a0f72",
                "#2c0a59",
                "#1d043f"
            ],
            devices: [
                "#66bb6a",
                "#4caf50",
                "#43a047",
                "#388e3c",
                "#2e7d32",
                "#1b5e20",
                "#15471a",
                "#103215",
                "#0b210f",
                "#060d08",
                "#558b2f",
                "#33691e",
                "#254d16",
                "#18340e",
                "#0c1a07",
                "#00796b",
                "#00594f",
                "#004036",
                "#00261f",
                "#00110c",
                "#004d33",
                "#003f2a",
                "#003119",
                "#002410",
                "#001708"
            ],
            groups: [
                "#ef5350",
                "#f44336",
                "#e53935",
                "#d32f2f",
                "#c62828",
                "#b71c1c",
                "#9e1515",
                "#820f0f",
                "#660a0a",
                "#4d0707",
                "#e91e63",
                "#d81b60",
                "#c2185b",
                "#ad1457",
                "#880e4f",
                "#7a0c48",
                "#640937",
                "#500726",
                "#3c0415",
                "#280208",
                "#ff4d4d",
                "#e60000",
                "#b30000",
                "#800000",
                "#4d0000"
            ],
        };
        this.category_color = {}

        this.openFirstCategory = this.config.openFirstCategory ?? false;
        this.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        this.touchPos = null;

        this.default_timing = { color: "darkblue", commands: [1,2,3,5,7,10,15,20] };
        this.default_wait = { color: "blue", commands: ["WAIT-10","WAIT-15","WAIT-20","WAIT-30","WAIT-40","WAIT-50","WAIT-60","WAIT-90","WAIT-120"] };

        this.init();
        this.load_data(this.config);
    }

    /* ---------- Init ---------- */
    init() {
        this.container = document.getElementById(this.container_name);
        if (!this.container) {
            console.error("RemoteMacroEdit.init(): container elemente '"+this.container_name+"' doesn't exist.")
        } else {
            this.container.innerHTML = macro_container;
            this.paletteEl = document.getElementById("palette"),
            this.deviceBarEl = document.getElementById("deviceBar"),
            this.dropzoneEl = document.getElementById("macroDropzone"),
            this.outputEl = document.getElementById("macroOutput")
        }

        this.categories = this.config.categories;
        this.devices = this.config.devices;
        this.inital = this.config.initial;

        this.macros = {};
        this.category_color = {}
        this.devices.forEach(d => this.macros[d] = []);
        this.activeDevice = this.devices[0];

        if (!this.config.categories.Timing) { this.config.categories.Timing = this.default_timing; }
        if (!this.config.categories.Waiting) { this.config.categories.Waiting = this.default_wait; }

        this.dragged = null;
        this.dropIndex = null;
        this.firstOpen = true;
        this.dropSucceeded = false;
    }

    /* (re)load data into the macro editing */
    load_data(config) {
        this.config = config;
        this.init();

        this.renderPalette();
        this.renderDevices();
        this.loadInitialData();

        this.attachDeviceNavigation();
        this.renderMacro();
        this.attachGlobalDragEnd();

        if (this.isTouch) {
            this.attachTouchDelete();
            this.attachTouchMove();
        }

        this.deviceBarEl.addEventListener("scroll", () => this.updateDeviceNavVisibility());
        this.updateDeviceNavVisibility();
    }

    /* load initial data set if given */
    loadInitialData() {
        if (!this.inital) return;

        for (const [device, entries] of Object.entries(this.inital)) {
            if (!this.macros[device]) continue;

            this.macros[device] = entries.map(entry => {
                // numbers (e.g. timing values)
                if (typeof entry === "number") {
                    return {
                        category: "Timing",
                        command: entry,
                        color: this.categories["Timing"]?.color || "#999"
                    };
                }

                // strings
                if (typeof entry === "string") {
                    const [category, ...rest] = entry.split("_");
                    const command = rest.join("_");

                    return {
                        category,
                        command,
                        color: this.categories[category]?.color || "#999"
                    };
                }

                return null;
            }).filter(Boolean);
        }
    }

    /* ---------- Palette ---------- */
    renderPalette() {
        this.paletteEl.innerHTML = "";

        let count = -1;
        let count_colors = {
            "devices": 0,
            "groups": 0,
            "macros": 0,
            "timing": 0
        }

        for (const [category, data] of Object.entries(this.categories)) {
            const box = document.createElement("div");
            box.className = "category";

            const header = document.createElement("div");
            header.className = "category-header";

            if (data.color === "devices") { header.textContent = "Device: " + category; }
            else if (data.color === "macros") { header.textContent = "Macros: " + category; }
            else if (data.color === "groups") { header.textContent = "Groups: " + category; }
            else { header.textContent = category; }

            const content = document.createElement("div");
            content.className = "category-content";
            if (this.firstOpen && this.openFirstCategory) {
                content.classList.add("open");
                this.firstOpen = false;
            }

            const tags = document.createElement("div");
            tags.className = "tags";

            if (this.colors[data.color]) {
                this.category_color[category] = this.colors[data.color][count_colors[data.color]];
                if (count_colors[data.color] < this.colors[data.color].length) {
                    count_colors[data.color] += 1;
                }
            } else {
                this.category_color[category] = data.color;
            }
            header.style.backgroundColor = this.category_color[category];
            header.style.color = "white";

            data.commands.forEach((cmd, index) => {
                const tag = document.createElement("div");
                tag.className = "tag";
                tag.textContent = cmd;
                tag.style.background = this.category_color[category];
                tag.draggable = true;
                tag.ondragstart = () => {
                    this.dragged = { source: "palette", category, index };
                };
                tag.ondragstart = () => {
                    this.dragged = { source: "palette", category, index };
                    this.dropSucceeded = false;
                };
                if (this.isTouch) {
                    tag.addEventListener("touchstart", e => {
                        this.dragged = { source: "macro", index };
                    });
                    this.attachTouchDrag(tag, { source: "palette", category, index });
                }

                tags.appendChild(tag);
            });

            header.onclick = () => {
                const isOpen = content.classList.contains("open");

                // close all categories first
                const all = this.paletteEl.querySelectorAll(".category-content");
                all.forEach(c => c.classList.remove("open"));

                // only reopen if it was previously closed
                if (!isOpen) {
                    content.classList.add("open");
                }
            };


            content.appendChild(tags);
            box.append(header, content);
            this.paletteEl.appendChild(box);
        }
    }

    /* add devices to bar */
    renderDevices(keep_scroll) {
        let scroll = 0;
        if (keep_scroll) { scroll = this.deviceBarEl.scrollLeft; }

        this.deviceBarEl.innerHTML = "";
        this.devices.forEach(device => {
            const el = document.createElement("div");
            el.className = "device" + (device === this.activeDevice ? " active" : "");
            el.textContent = device;
            el.onclick = () => {
                this.activeDevice = device;
                this.renderDevices(true);
                this.renderMacro();
            };
            this.deviceBarEl.appendChild(el);
        });
        if (keep_scroll) { this.deviceBarEl.scrollLeft = scroll; }
    }

    /* ---------- Macro Drop ---------- */
    attachDropzoneHandlers() {
        this.dropzoneEl.ondragover = e => {
            e.preventDefault();
            this.dropIndex = this.calculateDropIndex(e);
        };

        this.dropzoneEl.ondrop = e => {
            e.preventDefault();

            this.dropSucceeded = true;
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

    /* add device navigation if not enough space */
    attachDeviceNavigation() {
        const container = this.deviceBarEl;
        const navs = this.container.querySelectorAll(".nav-arrow");

        navs.forEach(nav => {
            nav.onclick = () => {
                container.scrollLeft += Number(nav.dataset.dir) * 120;
                this.updateDeviceNavVisibility();
            };
        });
        this.updateDeviceNavVisibility();
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

    /* NEW */
    calculateDropIndexFromPoint(x, y) {
        const items = [...this.dropzoneEl.children];
        let idx = items.length;

        items.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            const withinX = Math.abs(x - (r.left + r.width / 2)) < r.width / 2;
            const withinY = Math.abs(y - (r.top + r.height / 2)) < r.height / 2;
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

    /* handle touch delete by moving element out off the dropzone */
    attachTouchDelete() {
        if (!this.isTouch) return;

        document.addEventListener("touchend", e => {
            if (!this.dragged || this.dragged.source !== "macro") return;

            const { x, y } = this.touchPos;
            const r = this.dropzoneEl.getBoundingClientRect();

            const inside =
                x >= r.left && x <= r.right &&
                y >= r.top && y <= r.bottom;

            if (inside) {
                // 🔹 TOUCH SORT
                const macro = this.macros[this.activeDevice];
                const idx = this.calculateDropIndex({
                    clientX: x,
                    clientY: y
                });

                const [moved] = macro.splice(this.dragged.index, 1);
                macro.splice(idx, 0, moved);
            } else {
                // 🔹 TOUCH DELETE
                this.macros[this.activeDevice].splice(this.dragged.index, 1);
            }

            this.dragged = null;
            this.touchPos = null;
            this.renderMacro();
        });
    }

    /* NEW: enable touch */
    attachTouchDrag(el, dragInfo) {
        let ghost = null;

        el.addEventListener("touchstart", e => {
            e.preventDefault();

            this.dragged = dragInfo;

            const touch = e.touches[0];
            const rect = el.getBoundingClientRect();

            ghost = el.cloneNode(true);
            ghost.style.position = "fixed";
            ghost.style.pointerEvents = "none";
            ghost.style.opacity = "0.8";
            ghost.style.left = rect.left + "px";
            ghost.style.top = rect.top + "px";
            ghost.style.zIndex = "9999";

            document.body.appendChild(ghost);

            this.touchOffsetX = touch.clientX - rect.left;
            this.touchOffsetY = touch.clientY - rect.top;
        }, { passive: false });

        document.addEventListener("touchmove", e => {
            if (!ghost) return;

            const touch = e.touches[0];
            ghost.style.left = (touch.clientX - this.touchOffsetX) + "px";
            ghost.style.top = (touch.clientY - this.touchOffsetY) + "px";

            this.dropIndex = this.calculateDropIndexFromPoint(
                touch.clientX,
                touch.clientY
            );
        }, { passive: false });

        document.addEventListener("touchend", () => {
            if (!ghost) return;

            ghost.remove();
            ghost = null;

            if (this.dropIndex != null) {
                this.handleDrop();
            }

            this.dragged = null;
            this.dropIndex = null;
        });
    }

    /* handle sorting per touch within the dropzone */
    attachTouchMove() {
        if (!this.isTouch) return;

        document.addEventListener("touchmove", e => {
            if (!this.dragged) return;
            const touch = e.touches[0];
            this.touchPos = { x: touch.clientX, y: touch.clientY };
        }, { passive: false });
    }

    /* NEW */
    handleDrop() {
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

        this.renderMacro();
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
            tag.style.background = this.category_color[item.category] || "gray";
            tag.draggable = true;
            tag.ondragstart = () => {
                this.dragged = { source: "macro", index };
            };
            tag.ondragstart = () => {
                this.dragged = { source: "macro", index };
                this.dropSucceeded = false;
            };
            if (this.isTouch) {
                tag.addEventListener("touchstart", e => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.dragged = { source: "macro", index };
                    this.touchPos = { x: touch.clientX, y: touch.clientY };
                });
                this.attachTouchDrag(tag, { source: "macro", index });
            }
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
            (m.category === "Timing" || m.category === "Waiting") ? m.command : `${m.category}_${m.command}`
            );
        });
        this.outputEl.value = JSON.stringify(result, null, 2);
    }

    /* hide navigation if not required */
    updateDeviceNavVisibility() {
        const content = this.deviceBarEl;
        const left = this.container.querySelector(".nav-arrow.left");
        const right = this.container.querySelector(".nav-arrow.right");
        const container = document.getElementById("device-content");

        const maxScroll = content.scrollWidth - container.offsetWidth;
        left.style.display = content.scrollLeft > 0 ? "block" : "none";
        right.style.display = content.scrollLeft < maxScroll ? "block" : "none";
    }
}

