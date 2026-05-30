//--------------------------------
// jc://remote/
//--------------------------------
// Swipe navigation between remote controls
//--------------------------------


class RemoteSwipe extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.ordered_list  = [];   // [{type, id, label}, ...]
        this.swipe_bound   = false;
        this.touch_start_x = 0;
        this.touch_start_y = 0;
    }

    /* build ordered list of visible remotes — same order as drop-down menu */
    get_ordered_list(data) {
        const list        = [];
        const show_hidden = rmMenu.edit_mode_show;

        const add_group = (group_data, type) => {
            if (!group_data) return;

            // copy position to top level so sortDict can sort by it
            const d = {};
            for (const key in group_data) {
                d[key] = Object.assign({}, group_data[key]);
                d[key]["position"] = d[key]["settings"]["position"];
            }

            const order = sortDict(d, "position");
            for (const id of order) {
                if (type === "device" && id === "default") continue;
                const visible = group_data[id]["settings"]["visible"];
                if (visible !== "no" || show_hidden) {
                    list.push({
                        type,
                        id,
                        label: group_data[id]["settings"]["label"] || id
                    });
                }
            }
        };

        add_group(data["CONFIG"]["scenes"],  "scene");
        add_group(data["CONFIG"]["devices"], "device");

        return list;
    }

    /* init: rebuild ordered list and bind swipe gestures */
    init(data) {
        if (!data || !data["CONFIG"]) return;
        this.ordered_list = this.get_ordered_list(data);
        this.bind_swipe();
    }

    /* attach touch event listeners once to the main content area and background */
    bind_swipe() {
        if (this.swipe_bound) return;

        const on_start = (e) => {
            this.touch_start_x = e.touches[0].clientX;
            this.touch_start_y = e.touches[0].clientY;
        };
        const on_end = (e) => {
            const dx = e.changedTouches[0].clientX - this.touch_start_x;
            const dy = e.changedTouches[0].clientY - this.touch_start_y;
            // only act when horizontal movement dominates and exceeds threshold
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                this.navigate(dx < 0 ? 1 : -1);
            }
        };

        for (const id of ["frame_block_content", "app_background"]) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("touchstart", on_start, { passive: true });
                el.addEventListener("touchend",   on_end,   { passive: true });
            }
        }

        this.swipe_bound = true;
        this.logging.default("Swipe gestures bound to #frame_block_content and #app_background.");
    }

    /* navigate +1 (next / swipe-left) or -1 (prev / swipe-right) */
    navigate(dir) {
        const list = this.ordered_list;
        if (list.length === 0) return;

        const current = list.findIndex(
            e => e.type === rmRemote.active_type && e.id === rmRemote.active_name
        );
        if (current < 0) return;

        let next = current + dir;
        if (next < 0)            next = list.length - 1;
        if (next >= list.length) next = 0;

        const target = list[next];
        rmRemote.create(target.type, target.id);
    }

    /* navigate directly to a remote by index in the ordered list */
    navigate_to(index) {
        const list = this.ordered_list;
        if (index < 0 || index >= list.length) return;
        const target = list[index];
        rmRemote.create(target.type, target.id);
    }

    /* render dot indicators and show the bar */
    update_dots() {
        const el = document.getElementById("swipe-dots");
        if (!el) return;

        const list = this.ordered_list;
        if (list.length === 0) { this.hide(); return; }

        const current = list.findIndex(
            e => e.type === rmRemote.active_type && e.id === rmRemote.active_name
        );

        // when there are more than 8 remotes, show a sliding window of 7 dots
        const MAX_VISIBLE = 7;
        const HALF        = Math.floor(MAX_VISIBLE / 2);
        let start, end;

        if (list.length <= 8) {
            start = 0;
            end   = list.length - 1;
        } else {
            start = Math.max(0, current - HALF);
            end   = Math.min(list.length - 1, start + MAX_VISIBLE - 1);
            // shift start back if the window couldn't fill from the right
            if (end - start < MAX_VISIBLE - 1) {
                start = Math.max(0, end - MAX_VISIBLE + 1);
            }
        }

        // spread hues 0–300° across the full list so each remote has a stable color
        const total = Math.max(list.length - 1, 1);

        let html = "<div class='swipe-dot-bg'>";
        for (let i = start; i <= end; i++) {
            let cls = (i === current) ? "swipe-dot active" : "swipe-dot";
            // mark dots at window edges that have hidden remotes beyond them
            if ((i === start && start > 0) || (i === end && end < list.length - 1)) {
                cls += " edge";
            }
            const hue        = Math.round((i / total) * 300);
            const lightness  = (i === current) ? "65%" : "52%";
            const saturation = (i === current) ? "80%" : "65%";
            const color      = `hsl(${hue}deg, ${saturation}, ${lightness})`;
            const title      = list[i].label.replace(/"/g, "&quot;");
            html += `<span class="${cls}" style="background:${color}" onclick="rmSwipe.navigate_to(${i})" title="${title}"></span>`;
        }
        html += "</div>";
        el.innerHTML = html;
    }

    /* make the dot bar visible */
    show() {
        const el = document.getElementById("swipe-dots");
        if (el) el.style.display = "block";
        const bar = document.getElementById("swipe-bottom-bar");
        if (bar) bar.style.display = "block";
    }

    /* hide the dot bar */
    hide() {
        const el = document.getElementById("swipe-dots");
        if (el) el.style.display = "none";
        const bar = document.getElementById("swipe-bottom-bar");
        if (bar) bar.style.display = "none";
    }
}

remote_scripts_loaded += 1;
