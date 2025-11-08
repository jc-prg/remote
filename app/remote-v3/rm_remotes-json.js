//--------------------------------
// jc://remote/
//--------------------------------


/*
* class to convert JSON data and edit it in <textarea> fields
*/
class RemoteJsonHandling {

    constructor(name) {
        this.app_name       = name;
        this.data           = {};
        this.logging        = new jcLogging(this.app_name);
    }

    /* get JSON value (and check if correct) */
    get_value(id, default_data="" ) {

            if (typeof id !== "string") {
                this.logging.error(this.app_name+".get_value: id is not type 'string' but '"+(typeof id)+"'.");
                this.logging.error(id);
                this.logging.error(default_data);
                return;
            }

            const element = document.getElementById(id);
            this.logging.debug(this.app_name+".get_value: "+id);

            if (!element)	{
                this.logging.error(this.app_name+".get_value: element not found "+id);
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
        } else {
            this.logging.error("Replace JSON in textarea - Element not found: "+id );
        }
    }

    /* create textarea to edit JSON */
    textarea(id, json, format="" ) {
            let text = "";
            text += "<center><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:95%;height:160px;\">";
            text += this.json2text( id, json, format );
            text.replaceAll('"', '<b>"</b>');
            text += "</textarea></center>";
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

    constructor(id, format_style = "default", style = "width: 95%; height: 160px;") {
        this.default_size = style;
        this.format_style = format_style;   // other options: default, leafs, row4

        this.start = this.start.bind(this);
        this.create = this.create.bind(this);
        this.customJSONStringify = this.customJSONStringify.bind(this);
    }

    create(container_id, id, json, format_style = "", style = "") {
        const editor    = this.get(id, json, format_style, style);
        if (document.getElementById(container_id)) {
            const container = document.getElementById(container_id);
            container.innerHTML = editor;
            this.start(id);
        }
        else {
            console.error("RemoteJsonEditing.create: container for json editor '" + container_id + "' not found." );
        }
    }

    get(id, json, format_style = "", style = "") {
        const id_container = id + "_container";
        const id_highlight = id + "_highlight";
        const id_type      = id + "_type";
        const id_textarea  = id;
        const jsonText     = this.customJSONStringify(json, 2, format_style);

        if (style === "") { style = this.default_size; }

        this.editor     = `<div id="`+id_container+`" class="json-editor-container" style="`+style+`">
            <pre id="`+id_highlight+`">`+this.syntaxHighlight(jsonText)+`</pre>
            <textarea id="`+id_textarea+`" spellcheck="false">`+jsonText+`</textarea>
            <div id="`+id_type+`">`+format_style+`</div>
            </div>`;

        return this.editor;
    }

    start(id) {
        const highlight = document.getElementById(id + "_highlight");
        const textarea  = document.getElementById(id);

        if (textarea) {
            // overlay highlighted text
            textarea.addEventListener("input", () => {
                highlight.innerHTML = this.syntaxHighlight(textarea.value);
            });

            // Sync scroll position
            textarea.addEventListener("scroll", () => {
                highlight.scrollTop = textarea.scrollTop;
                highlight.scrollLeft = textarea.scrollLeft;
            });

            // Sync size changes with ResizeObserver
            const resizeObserver = new ResizeObserver(() => {
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
        if (disabled)   { highlight.style.background = "var(--json-color-background-disabled)"; }
        else            { highlight.style.background = "var(--json-color-background)"; }
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

