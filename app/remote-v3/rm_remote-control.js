//--------------------------------
// jc://remote/elements/
//--------------------------------


/* class to generate from text for buttons SVG images that can be scaled automatically with the button size */
class RemoteSvgTextImage extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.text = "Even much longer button text ...";
        this.fontSize = 40;
        this.fontFamily = "Arial";
        this.fontColor = "white";
        this.fontWeight = "";
        this.targetRatio = 4 / 2;
        this.image_cache = {};
        this.image_cache_layout = {};
    }

    /* split text into lines */
    splitIntoLines(words, lineCount) {
        const lines = Array.from({ length: lineCount }, () => []);
        const wordsPerLine = Math.ceil(Number(words.length / lineCount));

        let index = 0;
        for (let i = 0; i < lineCount; i++) {
            for (let j = 0; j < wordsPerLine && index < words.length; j++) {
                lines[i].push(words[index++]);
            }
        }
        return lines.map(l => l.join(" "));
    }

    /* Helper: measure text */
    measure(lines) {
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const g = document.createElementNS(tempSvg.namespaceURI, "g");
        let line_count = 0;

        tempSvg.appendChild(g);
        document.body.appendChild(tempSvg);

        lines.forEach((line, i) => {
            const t = document.createElementNS(tempSvg.namespaceURI, "text");
            t.setAttribute("y", String(i * this.fontSize * 1.2));
            t.setAttribute("font-size", this.fontSize);
            t.setAttribute("font-family", this.fontFamily);
            t.setAttribute("font-weight", this.fontWeight);
            t.setAttribute("fill", this.fontColor);
            t.textContent = line;
            g.appendChild(t);
            line_count += 1;
        });

        const box = g.getBBox();
        document.body.removeChild(tempSvg);

        const isIPhone = /iPhone/.test(navigator.userAgent);
        console.error(box, isIPhone);

        if (line_count > 1 && isIPhone) {
            line_count = line_count * 0.75;
            box.height = box.height * line_count;
            box.width = box.width * line_count;
        }

        console.error(box);

        return box;
    }

    measure_test(lines) {
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const text = document.createElementNS(tempSvg.namespaceURI, "text");

        text.setAttribute("font-size", this.fontSize);
        text.setAttribute("font-family", this.fontFamily);
        text.setAttribute("font-weight", this.fontWeight);
        text.setAttribute("fill", this.fontColor);

        lines.forEach((line, i) => {
            const tspan = document.createElementNS(tempSvg.namespaceURI, "tspan");
            tspan.setAttribute("x", "0");
            if (i > 0) {
                tspan.setAttribute("dy", "1.2em");
            }
            tspan.textContent = line;
            text.appendChild(tspan);
        });

        tempSvg.appendChild(text);
        document.body.appendChild(tempSvg);

        const box = text.getBBox();
        document.body.removeChild(tempSvg);

        return box;
    }


    /* Try different line breaks */
    bestLayout(text) {
        let words;
        if (text.length > 8) {
            words = text.split(/(\s|-)/).filter(Boolean);
        }
        else {
            let amount = Number((10 - text.length)/2);
            amount = Math.ceil(amount);
            for (let i = 0; i < amount; i++) {
                text = "\u00A0"+text+"\u00A0";
            }
            words = [text];
        }
        let best = null;
        let bestScore = Infinity;

        for (let linesCount = 1; linesCount <= words.length; linesCount++) {
            const textLines = this.splitIntoLines(words, linesCount);

            const box = this.measure(textLines);
            const ratio = box.width / box.height;
            const score = Math.abs(Number(ratio - this.targetRatio));

            if (score < bestScore) {
                bestScore = score;
                best = { lines: textLines, box };
            }
        }
        return best;
    }

    /* Build final SVG */
    create_now(container, text="") {

        if (!this.image_cache[text]) {

            const layout = this.bestLayout(text);
            const padding = this.fontSize * 0.1; // 10% padding

            let svg = document.getElementById(container);

            if (!svg) { this.logging.error("create(): container '"+container+"' not found.")}

            svg.innerHTML = "";
            svg.setAttribute("viewBox", `${-padding} ${-padding} ${layout.box.width + padding * 2} ${layout.box.height + padding * 2}`);
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

            const lineHeight = this.fontSize * 1.2; // adjust spacing between lines
            const totalTextHeight = layout.lines.length * lineHeight;

            let startY = layout.box.height / 2 - totalTextHeight / 2 + lineHeight / 2;

            const isIPhone = /iPhone/.test(navigator.userAgent);
            if (isIPhone && layout.lines.length === 1) { startY += 0; }
            if (isIPhone && layout.lines.length === 2) { startY += 8; }
            if (isIPhone && layout.lines.length === 3) { startY -= 4; }

            /*
            layout.lines.forEach((line, i) => {
                const t = document.createElementNS(svg.namespaceURI, "text");
                t.setAttribute("x", String(layout.box.width / 2)); // horizontal center
                t.setAttribute("y", String(startY + i * lineHeight)); // vertical position per line
                t.setAttribute("text-anchor", "middle"); // center horizontally
                t.setAttribute("dominant-baseline", "middle"); // center each line vertically on its y
                t.setAttribute("font-size", this.fontSize);
                t.setAttribute("font-family", this.fontFamily);
                t.setAttribute("font-weight", this.fontWeight);
                t.setAttribute("fill", this.fontColor);
                t.textContent = String(line);
                svg.appendChild(t);
            });

             */

            const textEl = document.createElementNS(svg.namespaceURI, "text");

            textEl.setAttribute("x", String(layout.box.width / 2));
            textEl.setAttribute("y", String(startY));
            textEl.setAttribute("text-anchor", "middle");
            textEl.setAttribute("dominant-baseline", "middle");
            textEl.setAttribute("font-size", this.fontSize);
            textEl.setAttribute("font-family", this.fontFamily);
            textEl.setAttribute("font-weight", this.fontWeight);
            textEl.setAttribute("fill", this.fontColor);

            layout.lines.forEach((line, i) => {
                const tspan = document.createElementNS(svg.namespaceURI, "tspan");
                tspan.setAttribute("x", String(layout.box.width / 2));
                if (i > 0) {
                    //tspan.setAttribute("dy", "1.2em");
                    tspan.setAttribute("dy", `${this.fontSize * 1.2}`);
                }
                tspan.textContent = line;
                textEl.appendChild(tspan);
            });

            svg.appendChild(textEl);

            this.image_cache[text] = svg.innerHTML;
            this.image_cache_layout[text] = layout;
        }
        else {
            const layout = this.image_cache_layout[text];
            const padding = this.fontSize * 0.1; // 10% padding
            let svg = document.getElementById(container);
            svg.setAttribute("viewBox", `${-padding} ${-padding} ${layout.box.width + padding * 2} ${layout.box.height + padding * 2}`);
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svg.innerHTML = this.image_cache[text];
        }
    }

    /* async call of create_now() */
    create(container, text="") {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.create_now(container, text));
        } else {
            // fallback
            setTimeout(() => this.create_now(container, text), 0);
        }
    }
}


/* class to create some basic elements for remote controls*/
class RemoteControlBasic extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.data           = {};
        this.edit_mode      = false;
        this.keyboard       = new RemoteControlKeyboard(name+".keyboard");	// rm_remotes-keyboard.js
        this.svg_image      = new RemoteSvgTextImage(this.name + ".svg_image");

        this.default_size();
    }

    // create button for multiple commands (macro)
    btn_group(id, label, scene, style, group, disabled ) {
        if (group) {
            let d = this.image( label, style );
            let b = this.default( id, d[0], d[1], 'apiGroupSend("'+group.join("_")+'","'+scene+'");', disabled );
            this.logging.debug("button_macro - "+b);
            return b;
        }
        else { return this.default( id, label, style+" notfound", "", "disabled" ); }
    }

    // create button for channel (macro)
    channel(id, label, scene, macro, style, disabled="") {
        let macro_string = "";
        for (let i=0; i<macro.length; i++) { macro_string = macro_string + macro[i] + "::"; }

        this.logging.debug(label+" - "+macro_string);
        return "<button id='" + id + "' class='channel-entry " + style + "' " + disabled + " onclick=\"apiMacroSend('" + macro_string + "','"+scene+"','"+label+"');\">" + label + "</button>";
    }

    // default buttons
    default(id, label, style, script_apiCommandSend, disabled="", button_style="", text_as_image=true) {

        let onContext  = "";
        let onClick    = "";
        let button_color = rmData.elements.data("button_colors");  // definition of button color

        if (Array.isArray(script_apiCommandSend)) {
            onClick    = "onmousedown_left_right(event,\"" + script_apiCommandSend[0].replaceAll("\"","#") + "\",\"" + script_apiCommandSend[1].replaceAll("\"","#") + "\");";
            onClick    = "onmousedown='"+onClick+"'";
            onContext  = "oncontextmenu=\"return false;\"";
        }
        else if (script_apiCommandSend !== "") {
            onClick    = "onclick='" + script_apiCommandSend + "'";
            onClick    = onClick.replaceAll("##", "{{!!}}");
            onClick    = onClick.replaceAll("#", "\"");
            onClick    = onClick.replaceAll("{{!!}}", "#");
        }

        //if (!isNaN(label)) { label = "<big>" + label + "</big>"; }
        if (style !== "") { style = " " + style; }
        if (id.indexOf("||") > 0) { id = id.split("||")[0]; }
        if (label.indexOf("<img") < 0 && label !== "&nbsp;" && !(label in button_color) && text_as_image) {
            let label_id = label;
            label = "<svg id='svg_image_"+label_id+"'></svg>";
            setTimeout(() => {
                this.svg_image.create("svg_image_"+label_id, label_id);
            }, 100);
        }

        return "<button id='" + id.toLowerCase() + "' class='rm-button" + style + "' " + button_style + " " + onClick + " " + onContext + " " + disabled + " >" + label + "</button>";
    }

    // set default button size
    default_size() {
        this.width	= "";
        this.height	= "";
        this.margin	= "";
    }

    // create button for single command
    device(id, label, device, style, cmd, disabled ) {

        if (label.indexOf("||") > 0) { label = label.split("||")[1]; }
        if (cmd.indexOf("||") > 0)   { cmd = cmd.split("||")[0]; }

        let label2 = this.image( label, style );
        if (label === ".") {
            disabled = "disabled";
            label2[0] = "&nbsp;";
        }
        if (cmd !== "") {
            cmd = 'apiCommandSend("'+cmd+'","","","'+device+'");';
        }
        return this.default( id, label2[0], label2[1], cmd, disabled );
    }

    // create button for single command -> if no command assigned yet to record command for button
    device_add(id, label, device, style, cmd, disabled ) {

        let device_button = cmd.split("_");
        let label2 = this.image( label, style );
        if (label === ".")	{ disabled = "disabled"; label2[0] = "&nbsp;"; }

        return this.default(id, label2[0], label2[1], 'apiCommandRecord("' + device_button[0] + '","' + device_button[1] + '");', disabled);
    }

    // create button for single command
    device_keyboard(keyboard, id, label, device, style, cmd, disabled) {

        let label2 	= this.image( label, style );
        if (label === ".") {
            disabled = "disabled";
            label2[0] = "&nbsp;";
        }
        if (cmd !== "") {
            cmd = keyboard.toggle_cmd();
        }
        return this.default( id, label2[0], label2[1], cmd, disabled );
    }

    // button edit mode
    edit(onclick, label, disabled="", id="") {
        let style = "";
        if (this.width !== "")  { style += "width:"+this.width+";"; }
        if (this.height !== "") { style += "height:"+this.height+";"; }
        if (this.margin !== "") { style += "margin:"+this.margin+";"; }

        if (disabled === "disabled") { style += "background-color:gray;"; }
        return "<button id=\""+id+"\" style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
    }

    // check if image exists for button
    image(label, style) {

        // set vars
        let button_color = rmData.elements.data("button_colors");  // definition of button color
        let button_img2  = rmData.elements.data("button_images");  // definition of images for buttons (without path and ".png")

        // if image available set image
        let button_img   = [];
        for (let key in button_img2) { button_img[key] = this.imageHTML(button_img2[key]); }

        // check label
        if (label in button_color) { style = style + " bg" + label + " "; }
        else if (label in button_img && showImg ) { label = button_img[label]; }

        return [label, style];
    }

    // create image tag for button image
    imageHTML(file) {

        return "<img src='icon/"+file+"' class='rm-button-image' alt='"+file+"' />";
    }

    // write line with text ...
    line(text="") {
        let remote = "";
        remote += "<div class='remote-line'><hr/>";
        if (text !== "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
        remote += "</div>";
        return remote;
    }

    // create button for multiple commands (macro)
    macro(id, label, scene, style, macro, disabled ) {

        if (label.indexOf("||") > 0) { label = label.split("||")[1]; }

        if (macro) {
            let d = this.image( label, style );
            let macro_string = "";
            let macro_wait = "";

            for (let i=0; i<macro.length; i++) {

                if (isNaN(macro[i]) && macro[i].indexOf("WAIT") > -1) {
                    let wait = macro[i].split("-");
                    macro_wait = 'appMsg.wait_time("'+lang("MACRO_PLEASE_WAIT")+'", '+wait[1]+');';
                }
                else {
                    macro_string = macro_string + macro[i] + "::";
                }
            }
            let b = this.default( id, d[0], d[1], 'apiMacroSend("'+macro_string+'","'+scene+'");'+macro_wait, disabled );
            this.logging.debug("button_macro - "+b);
            return b;
        }
        else {
            return this.default( id, label, style+" notfound", "", "disabled" );
        }
    }

    // default with size from values
    sized(id, label, style, script_apiCommandSend, disabled="") {
        let button_style	= "";
        if (this.width  !== "") { button_style += "width:" + this.width + ";max-width:" + this.width + ";"; }
        if (this.height !== "") { button_style += "height:" + this.height + ";max-height:" + this.height + ";"; }
        if (button_style !== "") { button_style  = "style='" + button_style + "'"; }

        return this.default(id, label, style, script_apiCommandSend, disabled, button_style, false);
    }

}


/*  class to create advanced elements such as color picker, slider, and toggle for the remote control */
class RemoteControlAdvanced extends RemoteDefaultClass{

    constructor(name, remote) {
        super(name);

        // set main data
        this.data = {};
        this.remote = remote;
        this.active_name = this.remote.active_name;
        this.active_type = this.remote.active_type;

        // connect pure elements
        this.e_color_picker = new RemoteElementColorPicker(this.name + ".e_color_picker");
        this.e_slider = new RemoteElementSlider(this.name + ".e_slider");
        this.color_picker_models = ["Brightness", "Color RGB", "Color CIE_1931", "Color RGB (small)", "Color CIE_1931 (small)", "Color temperature"];

        this.logging.debug("Create RemoteControlAdvanced (" + this.name + "/" + this.active_name + "/" + this.active_type + ")");
    }

    /* update API data */
    update(api_data) {

        this.data = api_data;
        this.active_name = this.remote.active_name;
    }

    /* create color picker */
    colorPicker(api_data, id, device, type = "devices", data) {

        this.logging.debug(this.name + ".colorPicker: " + id + "/" + device + "/" + type + "/" + data);
        this.update(api_data);

        /*
        if (device.indexOf("group") >= 0) {
            this.logging.warn("Groups are not yet available for color pickers.");
            return "";
        }
*/

        let color_model = "RGB";
        let send_command = data[1];
        let sub_id = device + "_" + send_command;
        let label = "";
        if (data.length > 2) {
            color_model = data[2];
        }
        if (data.length > 3) {
            label = data[3];
        }

        let display_start = "<button id=\"color-picker_" + sub_id + "_button\" class=\"color-picker\"><span class='center'>";
        display_start += "<canvas id=\"color-picker_" + sub_id + "\">";

        let display_end = "</canvas>";
        display_end += "<canvas id=\"color-picker_demo_" + sub_id + "\" class=\"color-picker-demo\">" + label + "</canvas></span>";
        display_end += "</span></button>";

        let text = display_start;
        //text += this.color_picker.colorPickerHTML_v1(send_command);
        text += display_end;

        setTimeout(() => {
            this.e_color_picker.colorPickerHTML("color-picker_" + sub_id, sub_id, send_command, color_model);
        }, 100);
        return text;
    }

    /* create slider */
    slider(api_data, id, device, type = "devices", data) {

        this.logging.debug(this.name + ".slider: " + id + "/" + device + "/" + type + "/" + data);
        this.update(api_data);

        let init;
        let disabled = false;
        let status_data = {};
        let device_api = "";
        let device_api_status = "";

        if ((type === "devices" && !rmData.devices.exists(device)) || (type === "scenes" && !rmData.scenes.exists(device))) {
            this.logging.error(this.name + ".slider_element: Could not create slider element: " + type + " '" + device + "' does not exist.");
            return "";
        }

        if (device.indexOf("group_") >= 0) {
            let group_name = device.split("_")[1];
            let group_devices = rmData.device_groups.list_devices(group_name);

            if (rmData.device_groups.exists(group_name) || group_devices.length === 0) {
                this.logging.error(this.name + ".slider_element: Group " + group_name + " not defined correctly.");
                return "";
            }

            let check_device = group_devices[0];
            let status_check_device = rmStatus.status_device(check_device, true);

            status_data = status_check_device["status"];
            device_api = `${status_check_device["api"]}_${status_check_device["api-device"]}`;
            device_api_status = status_check_device["api-device-message"];

        }
        else {
            let status_check_device = rmStatus.status_device(device, true);
            status_data = status_check_device["status"];
            device_api = `${status_check_device["api"]}_${status_check_device["api-device"]}`;
            device_api_status = status_check_device["api-device-message"];
        }

        if (!device_api_status) {
            this.logging.error("API Device not defined correctly for " + device + ": " + device_api + " doesn't exist.")
        } else if (device_api_status.toLowerCase() !== "connected") {
            disabled = true;
        }

        if (data[4] && status_data[data[4]]) {
            init = status_data[data[4]];
        }

        let min = 0;
        let max = 100;
        let display_start = "<button id=\"slider_" + device + "_" + data[1] + "\" class=\"rm-slider-button\">";
        let display_end = "</button>";

        if (data.length > 3) {
            let min_max = data[3].split("-");
            min = min_max[0];
            max = min_max[1];
        }

        let text = display_start;
        text += this.e_slider.sliderHTML(data[1], data[2], device, data[1], min, max, init, disabled);
        text += display_end;
        return text;
    }

    /* create toggle element (ON | OFF) - "TOGGLE||<status-field>||<description/label>||<TOGGLE_CMD_ON>||<TOGGLE_CMD_OFF>" */
    toggle(api_data, id, device, type = "device", data, short = false) {

        this.logging.debug(this.name + ".toggle: " + id + "/" + device + "/" + type + "/" + data);
        this.update(api_data);

        let init, key, status_data;
        let reset_value = "";
        let group = false;
        let device_id;
        let definition = device.split("||");

        if (definition.length > 1) {
            // if scene
            device_id = definition[1].split("_")[0];
            if (device_id.indexOf("group") >= 0) {
                device_id = definition[1].split("_")[0] + "_" + definition[1].split("_")[1];
                group = true;
            }
        } else {
            // else if device
            device_id = device;
        }

        if (rmData.devices.exists(device_id) && rmData.devices.api_method(device_id) !== "query") {
            reset_value = "<span style='color:gray'>[<status onclick=\"appFW.requestAPI('GET',['set','" + device_id + "','power','OFF'], '', '', '' );\" style='cursor:pointer;'>OFF</status> | ";
            reset_value += "<status onclick=\"appFW.requestAPI('GET',['set','" + device_id + "','power','ON'], '', '', '' );\" style='cursor:pointer;'>ON</status>]</span>";
        }

        let toggle_start = "";
        let toggle_end = "";
        if (!short) {
            toggle_start += "<button id=\"slider_" + device + "_" + data[1] + "\" class=\"rm-toggle-label long\">" + data[2] + " &nbsp; &nbsp;  " + reset_value + "</button>";
            toggle_start += "<button id=\"slider_" + device + "_" + data[1] + "2\" class=\"rm-toggle-button\">";
            toggle_end += "</button>";
        } else {
            toggle_start += "<div class='header_image_toggle'>"
            toggle_end += "</div>"
        }

        let disabled = false;
        let device_key = data[1].split("_");
        if (device_key.length > 1) {
            device = device_key[0];
            key = device_key[1]
        } else {
            key = data[1];
        }

        let device_api = "";
        let device_api_status = "";

        if (this.data["STATUS"]["devices"][device]) {
            status_data = this.data["STATUS"]["devices"][device];
            device_api = this.data["STATUS"]["devices"][device]["api"];
            device_api_status = this.data["STATUS"]["interfaces"][device_api];
        }

        if (!group && status_data[key] && device_api_status === "Connected") {
            if (status_data[key].toUpperCase() === "TRUE") {
                init = "1";
            } else if (status_data[key].toUpperCase() === "FALSE") {
                init = "0";
            } else if (status_data[key].toUpperCase() === "ON") {
                init = "1";
            } else if (status_data[key].toUpperCase() === "OFF") {
                init = "0";
            } else {
                init = "";
            }
        } else {
            init = "";
            disabled = true;
        }

        if (data[3].indexOf("_") < 0)   { data[3] = device + "_" + data[3]; }
        if (data[4].indexOf("_") < 0)   { data[4] = device + "_" + data[4]; }

        let text = "<div class=\"rm-toggle-container\">";
        text += toggle_start;
        text += this.e_slider.toggleHTML(data[1], data[2], device, data[3], data[4], init, disabled);
        text += toggle_end;
        text += "</div>";
        return text;
    }
}

