//--------------------------------
// jc://remote/
//--------------------------------

let macro_sample_data_set = {
    categories: {
        Movement: {color: "devices", commands: ["UP", "DOWN", "LEFT", "RIGHT"]},
        Actions: {color: "#dc3545", commands: ["JUMP", "SHOOT", "RELOAD"]},
        Timing: {color: "#007bff", commands: [100, 250, 500], label: "Waiting time"}
    },
    devices: ["device1", "device2"],
    devices_edit: true,
    initial: {
        "device1": ["Movement_UP","Timing_100","Movement_DOWN"],
        "device2": ["Actions_JUMP","Timing_100","Actions_SHOOT"],
    },
    title: "Select macro"
}
let macro_container = `
    <div class="macro-edit-container">
      <div class="macro-edit-palette {layout}" id="{editor_id}palette"></div>
      <div class="macro-edit-area {layout}">
      
        <div class="macro-device">
            <div class="macro-device-header">{editor_title}<span class='macro-edit-add-open' id="{editor_id}-edit-button-open" style="display:none;"><img src='icon/edit.png' alt=''></span></div>
            <div class="macro-device-content open" id="{editor_id}device-content">
                <div class="nav-arrow left" data-dir="-1" id="macro-nav-left">❮</div>
                <div class="devices" id="{editor_id}deviceBar"></div>
                <div class="nav-arrow right" data-dir="1" id="macro-nav-right">❯</div>
            </div>
            <div class="macro-edit-add" id="{editor_id}macroAddDelete">
                <div class="macro-edit-add-div">
                    <span id="{editor_id}-macro-device-add"><input id="{editor_id}-add-id" class="macro-edit-input"> <button class="macro-edit-button" id="{editor_id}-edit-button-add">add</button></span>&nbsp;&nbsp; 
                    <span id="{editor_id}-macro-device-delete"><input id="{editor_id}-delete-id" class="macro-edit-input" disabled"> <button class="macro-edit-button" id="{editor_id}-edit-button-delete">delete</button></span>
                </div>
            
            </div>
        </div>
      
        <div class="macro-device">
            <div class="macro-device-header">Edit macro <span id="{editor_id}macroDeviceSelect"  style='font-weight: normal;'></span></div>
            <div class="macro-edit-content open">
                <div class="macro-dropzone" id="{editor_id}macroDropzone"></div>
            </div>
            <div class="macro-edit-detail open" id="{editor_id}macroOutputDetail">
        </div>

        <div class="macro-output">
            <h3>Macro Output</h3>
            <textarea id="{editor_id}macroOutput" readonly>
        </div>
      </div>
    </div>
    `;

/* class to create a GUI macro editor */
class RemoteMacroEditor extends RemoteDefaultClass {
    constructor(container_id, config=undefined, editor_id=undefined, output_id=undefined) {
        super("RemoteMacroEditor");

        this.config = config || macro_sample_data_set;
        this.container_name = container_id;
        this.colors = {
            timing: ["#0000CC"],
            waiting: ["#000088"],
            macros: [
                "#ab47bc",
                "#8e24aa",
                "#6a1b9a",
                "#3a0f72",
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
        this.json = new RemoteJsonHandling("RemoteMacroEditor.json");

        this.editorId = editor_id || "";
        this.outputId = output_id || this.editorId+"macroOutput";

        this.openFirstCategory = this.config.openFirstCategory ?? false;
        this.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        this.touchPos = null;

        this.default_timing = { color: this.colors.timing[0], commands: [1,2,3,5,7,10,15,20] };
        this.default_wait = { color: this.colors.waiting[0], commands: ["MSG-10","MSG-15","MSG-20","MSG-30","MSG-40","MSG-50","MSG-60","MSG-90","MSG-120"] };

        this.init();
        this.loadData(this.config);
    }

    /* ---------- Init ---------- */
    init() {
        this.container = document.getElementById(this.container_name);
        if (!this.container) {
            this.logging.error("init(): container elemente '"+this.container_name+"' doesn't exist.")
        } else {
            let layout = "flex";
            if (this.config.flex_layout === false) { layout = "fix"; }

            this.container.innerHTML = macro_container
                .replaceAll("{layout}", layout)
                .replaceAll("{editor_id}", this.editorId)
                .replaceAll("{editor_title}", this.config.title || "Select macro");
            this.paletteEl = document.getElementById(this.editorId+"palette");
            this.deviceBarEl = document.getElementById(this.editorId+"deviceBar");
            this.deviceSelectEl = document.getElementById(this.editorId+"macroDeviceSelect");
            this.dropzoneEl = document.getElementById(this.editorId+"macroDropzone");
            this.outputEl = document.getElementById(this.outputId);
            this.outputDetailEl = document.getElementById(this.editorId+"macroOutputDetail");
            this.addDeleteEl = document.getElementById(this.editorId+"macroAddDelete");
            this.editButtonAdd = document.getElementById(this.editorId+"-edit-button-add");
            this.editButtonDel = document.getElementById(this.editorId+"-edit-button-delete");
            this.editButtonOpen = document.getElementById(this.editorId+"-edit-button-open");
            this.editInputAdd = document.getElementById(this.editorId+"-add-id");
            this.editInputDel = document.getElementById(this.editorId+"-delete-id");
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
    loadData(config) {
        this.config = config;
        this.init();

        this.renderPalette();
        this.renderMacroList();
        this.loadInitialData();

        this.attachDeviceNavigation();
        this.renderMacro();
        this.attachGlobalDragEnd();
        this.attachOpenEditDevices();

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
                        label: entry+"s",
                        color: this.categories["Timing"]?.color || "#999"
                    }
                }
                else if (entry.indexOf("WAIT-") === 0 || entry.indexOf("MSG-") === 0) {
                    let entry_wait = `Msg ${entry.split("-")[1]}s`;
                    return {
                        category: "Waiting",
                        command: entry,
                        label: entry_wait,
                        color: this.categories["Waiting"]?.color || "#999"
                    }
                }
                else if (entry.indexOf("_") < 0) {
                    return {
                        category: "Unknown",
                        command: entry,
                        label:  "<i>? " + entry + "</i>",
                        color: "#999"
                    }
                }

                // strings
                if (typeof entry === "string") {
                    let [category, ...rest] = entry.split("_");
                    let command = rest.join("_");

                    if (category === "group") {
                        category = category + "_" + rest[0];
                        command = rest[1];
                    }

                    if (!this.categories[category]) {
                        return {
                            category,
                            command,
                            color: this.categories[category]?.color || "#999",
                            label:  "<i>? " + entry + "</i>"
                        }
                    }
                    else {
                        return {
                            category,
                            command,
                            color: this.categories[category]?.color || "#999"
                        }
                    }
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

            let category_header = category;
            if (data.label) { category_header = data.label + " <span style='font-weight: normal;'>[" + category_header + "]</span>"; }
            if (data.color === "devices") { category_header = "Device: " + category_header; }
            else if (data.color === "macros") { category_header = "Macro: " + category_header; }
            else if (data.color === "groups") { category_header = "Group: " + category_header; }
            else if (category === "Timing") { category_header = lang("MACRO_EDIT_TIMING"); }
            else if (category === "Waiting") { category_header = lang("MACRO_EDIT_WAITING"); }
            header.innerHTML = category_header;

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
                let cmd_label = cmd;
                if (typeof cmd === "number") {cmd_label = cmd + "s"; }
                else if (cmd.indexOf("WAIT-") === 0) { cmd_label = "Msg " + cmd.split("-")[1] + "s"; }
                else if (cmd.indexOf("MSG-") === 0) { cmd_label = "Msg " + cmd.split("-")[1] + "s"; }

                tag.className = "tag";
                tag.textContent = String(cmd_label);
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
    renderMacroList(keep_scroll) {
        let scroll = 0;
        let count = 0;
        let element_load = undefined;
        if (keep_scroll) {
            scroll = this.deviceBarEl.scrollLeft;
        }

        this.deviceBarEl.innerHTML = "";
        this.devices.forEach(device => {
            const el = document.createElement("div");
            el.className = "device" + (device === this.activeDevice ? " active" : "");
            el.textContent = device;
            el.onclick = () => {
                this.activeDevice = device;
                this.renderMacroList(true);
                this.renderMacro();
            };
            this.deviceBarEl.appendChild(el);
        });
        if (keep_scroll) {
            this.deviceBarEl.scrollLeft = scroll;
        }
    }

    /* ---------- Render Macro ---------- */
    renderMacro() {
        this.dropzoneEl.innerHTML = "";
        const macro = this.macros[this.activeDevice];

        if (macro) {
            macro.forEach((item, index) => {

                const tag = document.createElement("div");
                tag.className = "macro-tag";
                if (!item.label) {
                    let cmd_label = item.command;
                    if (typeof item.command === "number") {
                        cmd_label = item.command + "s";
                    } else if (item.command.indexOf("WAIT-") === 0) {
                        cmd_label = "Msg " + item.command.split("-")[1] + "s";
                    } else if (item.command.indexOf("MSG-") === 0) {
                        cmd_label = "Msg " + item.command.split("-")[1] + "s";
                    }

                    tag.textContent = cmd_label;
                } else {
                    tag.innerHTML = item.label;
                }

                tag.style.background = item.color;
                tag.style.background = this.category_color[item.category] || "gray";

                tag.draggable = true;
                tag.ondragstart = () => {
                    this.dragged = {source: "macro", index};
                };
                tag.ondragstart = () => {
                    this.dragged = {source: "macro", index};
                    this.dropSucceeded = false;
                };
                if (this.isTouch) {
                    tag.addEventListener("touchstart", e => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        this.dragged = {source: "macro", index};
                        this.touchPos = {x: touch.clientX, y: touch.clientY};
                    });
                    this.attachTouchDrag(tag, {source: "macro", index});
                }
                this.dropzoneEl.appendChild(tag);
            });
        }

        this.attachDropzoneHandlers();
        this.updateOutput();
    }

    /* ---------- Output ---------- */
    updateOutput() {
        const result = {};
        if (this.devices) {
            this.devices.forEach(d => {
                result[d] = this.macros[d].map(m =>
                    (m.category === "Timing" || m.category === "Waiting") ? m.command : `${m.category}_${m.command}`
                );
            });
        }

        this.outputEl.value = this.json.json2text("", result, "macros");
        this.outputDetailEl.innerHTML = JSON.stringify(result[this.activeDevice], null, 2);
        this.deviceSelectEl.innerHTML = `[${this.activeDevice}]`;
        this.editInputDel.value = this.activeDevice;
        this.editInputDel.disabled = true;

        if (Object.keys(this.devices).length === 0) {
            this.addDeleteEl.style.display = "block";
        }

        if (this.editInputDel.value.indexOf("!") === 0 || this.editInputDel.value === "undefined") { elementHidden(this.editorId+"-macro-device-delete"); }
        else { elementVisible(this.editorId+"-macro-device-delete"); }
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

    /* enable possibility to add or delete keys from the macros */
    attachOpenEditDevices() {
        if (this.config.devices_edit === true) {

            this.editButtonOpen.style = "block";

            // show or hide devices edit area
            this.editButtonOpen.onclick = () => {
                if (this.addDeleteEl.style.display === "block") {
                    this.addDeleteEl.style.display = "none";
                } else {
                    this.addDeleteEl.style.display = "block";
                }
            };

            // add a new device to the devices area and to the macro data
            this.editButtonAdd.onclick = () => {
                let new_key = getValueById(this.editorId+"-add-id");
                if (new_key !== "" && !this.devices.includes(new_key)) {
                    this.devices.push(new_key);
                    this.macros[new_key] = [];
                    this.activeDevice = new_key;
                }
                else if (this.devices.includes(new_key)) {
                    appMsg.alert("Macro '"+new_key+"' already exists.");
                }
                else if (new_key === "") {
                    appMsg.alert("Please add a macro key first.");
                }
                this.renderMacroList();
                this.renderMacro();
                this.updateDeviceNavVisibility();
            };

            // delete the selected device from the macro
            this.editButtonDel.onclick = () => {
                let del_key = getValueById(this.editorId+"-delete-id");
                let index = this.devices.indexOf(del_key);
                if (index >= 0) {
                    this.devices.splice(index, 1);
                    delete this.macros[del_key];

                    this.activeDevice = this.devices[0];
                    this.renderMacroList();
                    this.renderMacro();
                    this.updateDeviceNavVisibility();
                    appMsg.alert("The macro '"+del_key+"' has been deleted. If this was a mistake, just don't save your edits.");
                    }
            };
        }
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

    /* hide navigation if not required */
    updateDeviceNavVisibility() {
        const content = this.deviceBarEl;
        const left = this.container.querySelector(".nav-arrow.left");
        const right = this.container.querySelector(".nav-arrow.right");
        const container = document.getElementById(this.editorId+"device-content");

        const maxScroll = content.scrollWidth - container.offsetWidth;
        left.style.display = content.scrollLeft > 0 ? "block" : "none";
        right.style.display = content.scrollLeft < maxScroll ? "block" : "none";
    }

}


remote_scripts_loaded += 1;
