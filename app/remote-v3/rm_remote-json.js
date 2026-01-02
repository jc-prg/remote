//--------------------------------
// jc://remote/JSON/
//--------------------------------


/*
* class to convert JSON data and edit it in <textarea> fields
*/
class RemoteJsonHandling {

    constructor(name) {
        this.name       = name;
        this.data           = {};
        this.logging        = new jcLogging(this.name);
        this.json_highlight = new RemoteJsonEditing(this.name+".json_highlight");
    }

    /* get JSON value (and check if correct) */
    get_value(id, default_data="" ) {

            if (typeof id === "object") {
                let stack = new Error().stack;
                let called_by = stack.split("\n")[2].replace("at ", "(call by: ") + ")";
                this.logging.error(this.name + ".get_value: id is not type 'string' but '" + (typeof id) + "' (" + JSON.stringify(id) + "). " + called_by);
                return;
            }
            else if (typeof id !== "string") {
                let stack = new Error().stack;
                let called_by = stack.split("\n")[2].replace("at ", "(call by: ") + ")";
                this.logging.error(this.name+".get_value: id is not type 'string' but '"+(typeof id)+"'.");
                return;
            }

            const element = document.getElementById(id);
            this.logging.debug(this.name+".get_value: "+id);

            if (!element)	{
                this.logging.error(this.name+".get_value: element not found "+id);
                return default_data;
            }

            return this.text2json( element.value, id );
        }

    /* convert text 2 json ... */
    text2json(json_text, id="" ) {

            // if string return value
            if (json_text === "" || (json_text.indexOf("[") < 0 && json_text.indexOf("{") < 0 && json_text.indexOf("\""))) { 
                return json_text; 
            }

            // parse and return object
            let object;
            try {
                object = JSON.parse(json_text);
            } catch(e) 	{
                alert(lang("FORMAT_INCORRECT")+": "+e);
                this.logging.error(lang("FORMAT_INCORRECT")+" / "+id+": "+e);
                this.logging.error(json_text);
                return;
            }
            this.logging.debug(object);
            return object;
        }

    /* replace JSON in area */
    textarea_replace(id, json, format="" ) {
        const element = document.getElementById(id);
        let text = "";
        text += this.json2text( id, json, format );

        if (element) {
            element.value = text;
            //this.json_highlight.update_text(id, text);
        } else {
            this.logging.error("Replace JSON in textarea - Element not found: "+id );
        }
    }

    /* create textarea to edit JSON */
    textarea(id, json, format="" ) {
            let text = "";
            text += "<span class='center'><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:95%;height:160px;\">";
            text += this.json2text( id, json, format );
            text.replaceAll('"', '<b>"</b>');
            text += "</textarea></span>";
            return text;
        }

    /* show json for buttons in text field */
    json2text(id, json, format="" ) {
            let text = "";
            if (format === "buttons") {
                let x=0;
                text += "[\n";
                for (let i=0;i<json.length;i++) {
                    x++;
                    text += "\""+json[i]+"\"";
                    if (i+1 < json.length)						{ text += ", "; }
                    if (Number.isInteger((x)/4))   				{ text += "\n\n"; x = 0; }
                    if (json.length > i+1 && json[i+1].includes("LINE") && x > 0) { text += "\n\n"; x = 0; }
                    if (json[i].includes("LINE"))                   { text += "\n\n"; x = 0; }
                    if (json[i].includes("TOGGLE"))                 { text += "\n\n"; x = 0; }
                    if (json[i].includes("HEADER-IMAGE"))           { text += "\n\n"; x = 0; }
                    if (json[i].includes("SLIDER"))                 { text += "\n\n"; x = 0; }
                    if (json[i].includes("COLOR-PICKER"))           { text += "\n\n"; x = 0; }
                }
                text += "\n]";
            }
            else if (format === "channels") {
                json = JSON.stringify(json);
                json = json.replaceAll( "],", "],\n\n" );
                json = json.replaceAll( ":", ":\n   " );
                json = json.replaceAll( "{", "{\n" );
                json = json.replaceAll( "}", "\n}" );
                text += json;
            }
            else if (format === "macros") {
                json = JSON.stringify(json);
                json = json.replaceAll( "],", "],\n\n" );
                json = json.replaceAll( ":", ":\n" );
                json = json.replaceAll( "{", "{\n" );
                json = json.replaceAll( "}", "\n}" );
                text += json;
            }
            else if (json !== undefined) {
                json = JSON.stringify(json);
                json = json.replaceAll( ",", ",\n" );
                json = json.replaceAll( "{", "{\n" );
                json = json.replaceAll( "}", "\n}" );
                text += json;
            }
            return text;
        }
}


/*
* class to edit JSON texts in a pre-formated and color coded style
*/
class RemoteJsonEditing {

    constructor(name, format_style = "default", style = "width: 95%; height: 160px;", highlighting=undefined) {
        this.name = name;
        this.default_size = style;
        this.format_style = format_style;   // other options: default, leafs, row4
        this.main_instance = "rm3json_edit";
        this.logging = new jcLogging(this.name);
        this.highlighting = highlighting || jsonHighlighting;

        this.start = this.start.bind(this);
        this.create = this.create.bind(this);
        this.customJSONStringify = this.customJSONStringify.bind(this);
    }

    create(container_id, id, json, format_style = "", style = "") {
        const editor    = this.get(id, json, format_style, style);
        if (document.getElementById(container_id)) {
            const container = document.getElementById(container_id);
            container.innerHTML = editor;

            if (this.highlighting) { this.start(id); }
        }
        else {
            this.logging.error("create: container for json editor '" + container_id + "' not found." );
        }
    }

    get(id, json, format_style = "", style = "") {
        const id_container = id + "_container";
        const id_highlight = id + "_highlight";
        const id_type      = id + "_type";
        const id_textarea  = id;
        const jsonText     = this.customJSONStringify(json, 2, format_style);

        if (style === "") { style = this.default_size; }

        const highlightHTML = this.highlighting ? `<pre id="`+id_highlight+`">`+this.syntaxHighlight(jsonText)+`</pre>` : "";
        const textareaClass = !this.highlighting ? "json-textarea-lazy" : "json-textarea-active";

        this.editor     = `<div id="`+id_container+`" class="json-editor-container" style="`+style+`">
            ${highlightHTML}
            <textarea id="`+id_textarea+`" class="`+textareaClass+`" spellcheck="false">`+jsonText+`</textarea>
            <div id="`+id_type+`">`+format_style+`</div>
            </div>`;

        return this.editor;
    }

    update_text(id, json) {
        let id_highlight = id + "_highlight";
        if (!document.getElementById(id) || !document.getElementById(id_highlight)) {
            this.logging.error("This is not a highlight container!");
            return;
        }
        document.getElementById(id_highlight).innerHTML = this.syntaxHighlight(json);
    }

    start(id) {
        const highlight = document.getElementById(id + "_highlight");
        const textarea  = document.getElementById(id);

        if (textarea) {
            // overlay highlighted text
            textarea.addEventListener("input", function () {
                highlight.innerHTML = rm3json_edit.syntaxHighlight(textarea.value);
            });
            textarea.dispatchEvent(new Event("input"));

            // Sync scroll position
            textarea.addEventListener("scroll", function () {
                highlight.scrollTop = textarea.scrollTop;
                highlight.scrollLeft = textarea.scrollLeft;
            });

            // Sync size changes with ResizeObserver
            const resizeObserver = new ResizeObserver(function () {
                highlight.style.width = textarea.offsetWidth + "px";
                highlight.style.height = textarea.offsetHeight + "px";
            });
            resizeObserver.observe(textarea);
        }
        else {
            console.error("RemoteJsonEditing.start: json editor '" + id + "' not found." );
        }
    }

    disable(id, disabled=true) {
        const highlight = document.getElementById(id + "_highlight");
        const textarea  = document.getElementById(id);

        textarea.disabled = disabled;
        if (disabled && highlight)   {
            highlight.style.background = "var(--json-color-background-disabled)";
        } else if (highlight) {
            highlight.style.background = "var(--json-color-background)";
        }
    }

    customJSONStringify(obj, indent = 2, format_style = "") {
        const space = " ".repeat(indent);
        let formatStyle = this.format_style;
        if (format_style !== "") { formatStyle = format_style; }

        function format(value, level = 0) {
            if (value === null || typeof value !== "object") {
                return JSON.stringify(value);
            }

            // ARRAYS
            if (Array.isArray(value)) {
                if (value.length === 0) return "[]";

                const items = value.map(v => format(v, level + 1));

                if (formatStyle === "compact") {
                    return `[${items.join(", ")}]`; // all inline
                }

                if (formatStyle === "rmc") {
                    const lines = [];
                    let currentLine = [];

                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];

                        // Special elements go on their own line
                        if (
                            item.startsWith('"LINE') ||
                            item.startsWith('"HEADER-IMAGE') ||
                            item.startsWith('"TOGGLE')
                        ) {
                            if (currentLine.length) {
                                lines.push(currentLine.join(", "));
                                currentLine = [];
                            }
                            lines.push(item); // single line
                        } else {
                            currentLine.push(item);
                            // Push line every 4 elements
                            if (currentLine.length === 4) {
                                lines.push(currentLine.join(", "));
                                currentLine = [];
                            }
                        }
                    }

                    // Push remaining items
                    if (currentLine.length) {
                        lines.push(currentLine.join(", "));
                    }

                    return `[\n${space.repeat(level + 1)}${lines.join(`,\n${space.repeat(level + 1)}`)}\n${space.repeat(level)}]`;
                }

                if (formatStyle === "rmc2") {
                    const lines = [];

                    for (let i = 0; i < items.length; i += 4) {
                        lines.push(items.slice(i, i + 4).join(", "));
                    }
                    return `[\n${space.repeat(level + 1)}${lines.join(`,\n${space.repeat(level + 1)}`)}\n${space.repeat(level)}]`;
                }

                // default: one element per line
                return `[\n${space.repeat(level + 1)}${items.join(`,\n${space.repeat(level + 1)}`)}\n${space.repeat(level)}]`;
            }

            // OBJECTS
            const entries = Object.entries(value);
            const inner = entries
                .map(([k, v]) => `${space.repeat(level + 1)}${JSON.stringify(k)}: ${format(v, level + 1)}`)
                .join(",\n");

            return `{\n${inner}\n${space.repeat(level)}}`;
        }

        return format(obj, 0);
    }

    syntaxHighlight(json) {
        if (!json) return "";
        json = json
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = "json-number";

                if (/^"/.test(match))               { cls = /:$/.test(match) ? "json-key" : "json-string"; }
                else if (/true|false/.test(match))  { cls = "json-boolean"; }
                else if (/null/.test(match))        { cls = "json-null"; }

                if (cls === "json-string") { match = match.replace( /\|\|/g, '<span class="json-separator">||</span>'); }

                return `<span class="${cls}">${match}</span>`;
            }
        );
    }
}


/*
* class to add elements to the JSON remote definition
*/
class RemoteJsonElements {

    constructor(name, remote_type, remote) {

        this.data = {};
        this.name = name;
        this.remote = remote;
        this.remote_type = remote_type;

        this.json = new RemoteJsonHandling(name + ".json");		// rm_remotes-elements.js
        this.logging = new jcLogging(this.name);
        this.logging.debug("Create RemoteJsonElements (" + name + "/" + remote_type + "/" + this.json_field_id + ")");

        if (this.remote_type === "scene") {
            this.json_field_id = "json::remote";
            this.json_field_id_channel = "json::macro-channel";
            this.json_field_id_display = "json::display";
            this.json_field_id_display2 = "json::display-size";
        } else if (this.remote_type === "device") {
            this.json_field_id = "remote_json_buttons";
            this.json_field_id_channel = "";
            this.json_field_id_display = 'remote_json_display';
            this.json_field_id_display2 = 'remote_display_size';
        } else {

            this.logging.error("Remote type '" + this.remote_type + "' not supported.");
        }
    }

    /* create preview of changed remote control (former .scene_preview and .remote_preview) */
    preview(scene_device) {

       this.remote.preview(this.remote_type, scene_device);
    }

    /* update configuration data */
    update(data) {

        this.data = data;
    }

    /* add button to JSON (former this.remote_add_button) */
    add_button(scene, button, position = "", multiple = false) {

        if (document.getElementById(button)) {
            button = getValueById(button);
        }
        if (button === "" || button === undefined) {
            appMsg.alert(lang("BUTTON_INSERT_NAME"));
            return;
        }

        let value = this.json.get_value(this.json_field_id);
        let value_new = [];

        if (this.remote_type === "scene" && button.indexOf("_") < 0 && button.indexOf("LINE") < 0  && button.indexOf("HEADER-IMAGE") < 0) { button = scene + "_" + button; }

        if (position === "FIRST") {
            value_new.push(button);
        }
        for (let i = 0; i < value.length; i++) {
            if (i === Number(position) && position !== "" && position !== "FIRST") {
                value_new.push(button);
            }
            value_new.push(value[i]);
        }

        if (position === "") {
            value_new.push(button);
        }

        this.json.textarea_replace(this.json_field_id, value_new);

        if (!multiple) {
            this.preview(scene);
        }
    }

    /* check if alternative image button and then add to JSON */
    add_button_select_image(scene, button, button_choice, button_value) {
        const radio_select = document.getElementsByName(button_choice);
        const button_select = document.getElementById(button);
        let selected_value = 'default';
        if (button_select) {
            button = button_select.value;
        }
        if (radio_select) {
            // Loop through them to find which one is checked
            for (const radio of radio_select) {
                if (radio.checked) {
                    selected_value = radio.value;
                    break;
                }
            }
            if (selected_value !== 'default') {
                const image_select = document.getElementById(button_value+"_"+selected_value);
                if (image_select) {
                    let image = image_select.value;
                    button += "||" + image;
                }
            }
        }
        this.add_button(scene, button);
    }

    /* add color picker to JSON*/
    add_color_picker(device_select, command_select, model_select, description_input, scene="", position = "") {

        //if (this.remote_type === "scene") {
        //    this.logging.warn("Color Picker not implemented for scenes yet.");
        //}


        let device = device_select;
        if (document.getElementById(device_select)) { device = getValueById(device_select); }

        let color_model = getValueById(model_select);
        let command = getValueById(command_select);
        let description = getValueById(description_input);

        if (command === "" || command === undefined) {
            appMsg.alert(lang("COLOR_PICKER_SELECT_CMD"));
            return;
        }
        if (color_model === "" || color_model === undefined) {
            appMsg.alert(lang("COLOR_PICKER_SELECT_MODEL"));
            return;
        }
        if (description === undefined) { description = ""; }


        let button_check = "COLOR-PICKER||send-" + command + "||" + color_model;
        let button = "COLOR-PICKER||send-" + command + "||" + color_model + "||" + description;
        this.logging.debug(device, button);
        if (this.remote_type === "scene") {
            button = device + "_" + button;
            button_check = device + "_" + button_check;
        }
        else {
            scene = device;
        }

        if (document.getElementById(this.json_field_id).innerHTML.indexOf(button_check) > -1) {
            appMsg.alert(lang("MSG_ONLY_ONE_COLOR_PICKER"));
        } else {
            this.add_button(scene, button, position);
            this.preview(scene);
        }
    }

    /* add display to JSON */
    add_display(scene, position = "") {

        let value = this.json.get_value(this.json_field_id);

        if (value.indexOf("DISPLAY") < 0) {
            this.add_button(scene, "DISPLAY", position);
            this.preview(scene);
        } else {
            appMsg.alert(lang("DISPLAY_EXISTS"));
        }
    }

    /* add display value from JSON */
    add_display_value(scene, device, value, label) {

        let device_new = getValueById(device);
        let value_new = getValueById(value);
        let label_new = getValueById(label);

        if (device_new === "" || value_new === undefined) {
            appMsg.alert(lang("DISPLAY_VALUE_SELECT"));
            return;
        }
        if (value_new === "" || value_new === undefined) {
            appMsg.alert(lang("DISPLAY_VALUE_SELECT"));
            return;
        }
        if (label_new === "" || label_new === undefined) {
            appMsg.alert(lang("DISPLAY_LABEL_ADD"));
            return;
        }

        let display_new = this.json.get_value(this.json_field_id_display);

        if (display_new[label_new] !== undefined) {
            appMsg.alert(lang("DISPLAY_LABEL_EXISTS_ALREADY"));
            return;
        }

        if (!display_new[label_new] && device_new !== "X") {
            display_new[label_new] = device_new + "_" + value_new;
        }
        else if (!display_new[label_new]) {
            display_new[label_new] = value_new;
        }

        this.json.textarea_replace(this.json_field_id_display, display_new);
        this.preview(scene);
    }

    /* remote header from JSON */
    add_header(scene, button, position = "") {

        let value = this.json.get_value(this.json_field_id);

        if (value.indexOf("HEADER-IMAGE") >= 0 || value.indexOf("HEADER-IMAGE||toggle") >= 0) {
            appMsg.alert(lang("HEADER_IMAGE_EXISTS"));
        } else if (value.indexOf("HEADER-IMAGE||toggle") < 0 && button === "HEADER-IMAGE||toggle") {

            // CHECK IF VALUES FOR TOGGLE ARE SET ...
            let header_toggle_value = getValueById("header_toggle_1value");
            let header_toggle_on = getValueById("header_toggle_1on");
            let header_toggle_off = getValueById("header_toggle_1off");

            if (header_toggle_value === undefined) {
                appMsg.alert("Select the power device value first!");
                return;
            } else if (header_toggle_on === undefined || header_toggle_on === "") {
                appMsg.alert("Select the power device ON command first!");
                return;
            } else if (header_toggle_off === undefined || header_toggle_off === "") {
                appMsg.alert("Select the power device OFF command first!");
                return;
            }

            let toggle_button = "TOGGLE||" + header_toggle_value + "||Power Device||" + header_toggle_on + "||" + header_toggle_off;

            this.add_button(scene, toggle_button, "FIRST", true);
            this.add_button(scene, button, "FIRST");
        } else if (value.indexOf("HEADER-IMAGE") < 0 && button === "HEADER-IMAGE") {
            this.add_button(scene, button, "FIRST");
        }
    }

    /* add a line with description */
    add_line(scene, button, position = "", multiple = false) {

        if (document.getElementById(button)) {
            button = "LINE||" + getValueById(button);
        }

        this.add_button(scene, button, position, multiple = false);
    }

    /* add a slider with description */
    add_slider(scene, slider_cmd, slider_param, slider_descr, slider_minmax, slider_device = "", position = "") {

        let button;
        let s_cmd = getValueById(slider_cmd);
        let s_param = getValueById(slider_param);
        let s_descr = getValueById(slider_descr);
        let s_minmax = getValueById(slider_minmax);
        let s_device = getValueById(slider_device);

        if (s_cmd === "" || s_cmd === undefined) {
            appMsg.alert(lang("SLIDER_SELECT_CMD"));
            return;
        }
        if (s_param === "" || s_param === undefined) {
            appMsg.alert(lang("SLIDER_SELECT_PARAM"));
            return;
        }
        if (s_descr === "" || s_descr === undefined) {
            appMsg.alert(lang("SLIDER_INSERT_DESCR"));
            return;
        }
        if (s_minmax === "" || s_minmax === undefined) {
            appMsg.alert(lang("SLIDER_INSERT_MINMAX"));
            return;
        }

        if (this.remote_type === "scene") {
            button = s_device + "_SLIDER||send-" + s_cmd + "||" + s_descr + "||" + s_minmax + "||" + s_param;
        } else {
            button = "SLIDER||send-" + s_cmd + "||" + s_descr + "||" + s_minmax + "||" + s_param;
        }
        this.add_button(scene, button, position);
        this.preview(scene);
    }

    /* add a toggle with description */
    add_toggle(scene, t_device, t_descr, t_value, t_on, t_off, position = "") {

        t_device = getValueById(t_device);
        t_value = getValueById(t_value);
        t_descr = getValueById(t_descr);
        t_on = getValueById(t_on);
        t_off = getValueById(t_off);
        let button;

        if (t_value === "" || t_value === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_VALUE"));
            return;
        }
        if (t_descr === "" || t_descr === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_DESCR"));
            return;
        }
        if (t_on === "" || t_on === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_ON"));
            return;
        }
        if (t_off === "" || t_off === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_OFF"));
            return;
        }

        if (this.remote_type === "scene") {
            if (t_device === "" || t_device === undefined) {
                appMsg.alert(lang("TOGGLE_SELECT_DEVICE"));
                return;
            }
            button = "TOGGLE||" + t_device + "_" + t_value + "||" + t_descr + "||" + t_device + "_" + t_on + "||" + t_device + "_" + t_off;
        } else {
            button = "TOGGLE||" + t_value + "||" + t_descr + "||" + t_on + "||" + t_off;
        }

        this.add_button(scene, button, position);
        this.preview(scene);
    }

    /* delete button from JSON */
    delete_button(scene, button) {

        if (Number.isInteger(Number(button))) {}
        else if (document.getElementById(button)) {
            button = getValueById(button);
        }
        if (button === "") {
            appMsg.alert(lang("BUTTON_SELECT"));
            return;
        }

        let value_org = this.json.get_value(this.json_field_id);
        let value_new = [];
        for (let i = 0; i < value_org.length; i++) {
            if (i !== Number(button)) {
                value_new.push(value_org[i]);
            }
        }

        this.json.textarea_replace(this.json_field_id, value_new);
        this.preview(scene);
    }

    /* delete value from display */
    delete_display_value(scene, remove_label) {

        let label_new = getValueById(remove_label);
        let display_new = this.json.get_value(this.json_field_id_display);

        if (label_new === "" || label_new === undefined) {
            appMsg.alert(lang("DISPLAY_LABEL_SELECT"));
            return;
        }
        if (!display_new[label_new]) {
            appMsg.alert(lang("DISPLAY_LABEL_DONT_EXIST"));
            return;
        } else {
            delete display_new[label_new];
        }

        this.json.textarea_replace(this.json_field_id_display, display_new);
        this.preview(scene);
    }

    /* delete header from JSON */
    delete_header(scene) {

        let value = this.json.get_value(this.json_field_id);

        if (value.indexOf("HEADER-IMAGE||toggle") >= 0) {
            this.delete_button(scene, "0");
            this.delete_button(scene, "0");
            this.preview(scene);
        } else if (value.indexOf("HEADER-IMAGE") >= 0) {
            this.delete_button(scene, "0");
            this.preview(scene);
        } else {
            appMsg.alert(lang("HEADER_IMAGE_EXISTS"));
        }
    }

    /* import remote definition from template to JSON */
    import_templates(scene, template) {

        let value = getValueById(template);
        if (value === "") {
            appMsg.alert(lang("DEVICE_SELECT_TEMPLATE"));
            return;
        }

        template = this.data["CONFIG"]["templates"]["definition"][value];
        let value_new = template["remote"];
        if (template["display"]) {
            let display_new = template["display"];
        } else {
            let display_new = {};
        }
        if (template["display-size"]) {
            let displaysize_new = template["display"];
        } else {
            let displaysize_new = "";
        }

        if (this.remote_type === "scene") {
            for (let i = 0; i < value_new.length; i++) {
                if (value_new[i] !== "." && value_new[i].indexOf("DISPLAY") < 0 && value_new[i].indexOf("LINE") < 0 && value_new[i].indexOf("_") < 0) {
                    value_new[i] = "XXXX_" + value_new[i];
                }
            }
        }

        this.json.textarea_replace(this.json_field_id, value_new);
        this.preview(scene);
    }

    /* move button in JSON (left or right) */
    move_button(scene, button, left_right) {

        let value = this.json.get_value(this.json_field_id);
        let temp = value[button];

        if (left_right === "left") {
            if (button > 0) {
                let target = button - 1;
                value[button] = value[target];
                value[target] = temp;
            }
        }
        if (left_right === "right") {
            if (button < value.length) {
                let target = button + 1;
                value[button] = value[target];
                value[target] = temp;
            }
        }

        this.json.textarea_replace(this.json_field_id, value);
        this.preview(scene);
    }

    /* get slider configuration */
    prepare_slider(device, slider_cmd, slider_param, slider_description, slider_minmax, position = "") {

        let s_param = getValueById(slider_param);
        let s_description = "description";

        if (device.startsWith("group_")) {
            let group = device.split("_")[1];
            let group_devices = this.data["CONFIG"]["macros"]["groups"][group]["devices"];
            if (group_devices.length > 0) {
                device = group_devices[0];
            } else {
                this.logging.warn("No devices defined for group '"+group+"'");
                return;
            }
        }

        let s_device = this.data["CONFIG"]["devices"][device]["settings"]["label"];
        if (s_param === "" || s_param === undefined) {
            appMsg.alert(lang("SLIDER_SELECT_PARAM"));
            return;
        }

        if (this.remote_type === "scene") {
            s_description = s_device + ": " + s_param.charAt(0).toUpperCase() + s_param.slice(1);
        } else {
            s_description = s_param.charAt(0).toUpperCase() + s_param.slice(1);
        }
        setValueById(slider_description, s_description);

        let cmd_definition = this.data["CONFIG"]["devices"][device]["commands"]["definition"];

        this.logging.info(JSON.stringify(cmd_definition[s_param]));

        if (cmd_definition && cmd_definition[s_param]) {
            let min = "min";
            let max = "max";
            let exist = false;
            if (cmd_definition[s_param]["values"]) {
                if (cmd_definition[s_param]["values"]["min"] !== undefined) {
                    min = cmd_definition[s_param]["values"]["min"];
                    exist = true;
                }
                if (cmd_definition[s_param]["values"]["max"] !== undefined) {
                    max = cmd_definition[s_param]["values"]["max"];
                    exist = true;
                }
            }
            if (exist) {
                setValueById(slider_minmax, min + "-" + max);
            }
        }
    }

}

