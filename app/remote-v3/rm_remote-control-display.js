//--------------------------------
// jc://remote/display/
//--------------------------------


/* create displays for scene and device remote controls, format defined in style-display.css */
class RemoteControlDisplay extends RemoteDefaultClass {

    constructor(name) {
        super(name);

        this.data           = {};
        this.edit_mode      = false;
        this.tab = new RemoteElementTable(this.name + ".tab");
    }

    /* create a set of displays for each type, one visible and the others hidden */
    default(id, device, rm_type="devices", style="", display_data={}) {

            let text          = "";
            let status;

            if (rm_type === "scenes") { status = rmStatus.status_scene(device); }
            else { status = rmStatus.status_device(device); }

            if (status === undefined) {
                this.logging.error("default(): No status available for "+device);
                return
            }
            if (style === undefined || style === "") {
                style = "middle";
            }

            // create link for details (for scenes not defined yet)
            let onclick;
            if (rm_type === "devices") { onclick = "onclick=\"" + this.name + ".alert('"+id+"','"+device+"','"+rm_type+"','##STYLE##');\""; }
            else { onclick = "disabled"; }

            // create display
            let display_start = "<button id=\"display_"+device+"_##STATUS##\" class=\"display ##STYLE##\" style=\"display:##DISPLAY##\" "+onclick+">";
            display_start += "<div class='display-content'>";
            let display_end = "</button>";
            display_end += "</button>";

            // create display content
            if (this.edit_mode) {

                // display if EDIT_MODE
                text += display_start;
                text  = text.replace( /##STATUS##/g, "EDIT_MODE" );
                text  = text.replace( /##STYLE##/g, style + " display_on edit" );
                if (this.edit_mode) { text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                { text  = text.replace( /##DISPLAY##/g, "none" ); }

                text += "<div class='display-table "+style+"'>";
                if (style.indexOf("weather") === 0) { text += this.values(device, display_data, "weather_edit"); }
                else if (style.indexOf("c2") > 0) { text += this.values(device, display_data, "columns_edit"); }
                else { text += this.values(device, display_data, "edit"); }
                text += "</div>";
                text += display_end;

            } else {

                // display if ERROR
                text += display_start;
                text  = text.replace( /##STATUS##/g, "ERROR" );
                text  = text.replace( /##STYLE##/g, style + " display_error" );

                if (status.indexOf("ERROR") >= 0) {
                    text  = text.replace( /##DISPLAY##/g, "block" );
                    text += "<span class='center'><b>"+lang("CONNECTION_ERROR")+"</b></span>"; //<br/>";
                }
                else if (status.indexOf("DISABLED") >= 0) {
                    text  = text.replace( /##DISPLAY##/g, "block" );
                    text += "<span class='center'><b>"+lang("CONNECTION_DISABLED")+"</b></span>"; //<br/>";
                }
                else {
                    text += "<span class='center'><b>"+lang("CONNECTION_ERROR")+"</b></span>"; //<br/>";
                    text  = text.replace( /##DISPLAY##/g, "none" );
                }
                text += "<span class='center'><i><text id='display_ERROR_info_"+device+"'></text></i></span>";
                text += display_end;

                // display if ON
                text += display_start;
                text  = text.replace( /##STATUS##/g, "ON" );
                text  = text.replace( /##STYLE##/g, style + " display_on" );
                if (status === "ON" || status === "PARTLY")	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                                        { text  = text.replace( /##DISPLAY##/g, "none" ); }

                text += "<div class='display-table "+style+"'>";
                if (style && style.indexOf("weather") === 0) { text += this.values(device, display_data, "weather"); }
                else if (style.indexOf("c2") > 0) { text += this.values(device, display_data, "columns"); }
                else { text += this.values(device, display_data, "default"); }
                text += "</div>";
                text += display_end;

                // display if MANUAL_MODE
                text += display_start;
                text  = text.replace( /##STATUS##/g, "MANUAL" );
                text  = text.replace( /##STYLE##/g, style + " display_manual" );
                if (rmSettings.manual_mode || status === "N/A")    { text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                                               { text  = text.replace( /##DISPLAY##/g, "none" ); }
                text += "<span class='center'>"+lang("CONNECTION_MANUAL")+"<br/><text id='display_MANUAL_info_"+device+"'></text></span>";
                text += display_end;

                // display if OFF
                text += display_start;
                text  = text.replace( /##STATUS##/g, "OFF" );
                text  = text.replace( /##STYLE##/g, style + " display_off" );
                if (status === "OFF")    { text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                    { text  = text.replace( /##DISPLAY##/g, "none" ); }
                text += "<span class='center'><b>"+lang("CONNECTION_DEVICE_OFF")+"</b><br/><i><text id='display_OFF_info_"+device+"'></text></i></span>";
                text += display_end;

                // display if POWER_OFF
                text += display_start;
                text  = text.replace( /##STATUS##/g, "POWER_OFF" );
                text  = text.replace( /##STYLE##/g, style + " display_off" );
                if (status === "POWER_OFF")    { text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                          { text  = text.replace( /##DISPLAY##/g, "none" ); }
                text += "<span class='center'><b>"+lang("CONNECTION_POWER_OFF")+"</b><br/><i><text id='display_POWER_OFF_info_"+device+"'></text></i></span>";
                text += display_end;
            }

            return text;
        }

    /* format display values */
    values(device, display_data, format="default") {
        let html = "";
        let html_col1 = "";
        let html_col2 = "";

        // weather data - icon on the righten side
        if (format === "weather" && display_data["ICON"]) {
            let input_id;
            html += this.tab.start("100%", "", "center");

            if (display_data["ICON"].indexOf("_") >= 0) { input_id = 'display_' + display_data["ICON"]; }
            else { input_id = 'display_' + device + '_' + display_data["ICON"]; }
            html_col1 += "<span id='"+input_id+"' class='display-weather-element'></span>";

            html_col2 += this.tab.start("100%");
            for (let key in display_data) {
                if (display_data[key].indexOf("_") >= 0) { input_id = 'display_' + display_data[key]; }
                else { input_id = 'display_' + device + '_' + display_data[key]; }
                if (key !== "ICON") { html_col2 += this.tab.row(key + ":&nbsp;", "<span id='" + input_id + "'>no data</span>"); }
            }
            html_col2 += this.tab.end();

            html += this.tab.row(html_col1, html_col2);
            html += this.tab.end();
        }
        // weather data - icon on the righten side - edit mode
        else if (format === "weather_edit") {
            let input_id;
            html += this.tab.start("100%", "", "center");

            if (display_data["ICON"].indexOf("_") >= 0) { input_id = 'display_' + display_data["ICON"]; }
            else { input_id = 'display_' + device + '_' + display_data["ICON"]; }
            html_col1 += "<span id='edit_"+input_id+"'>ICON<br/>{"+display_data["ICON"]+"}</span>";

            html_col2 += this.tab.start("100%");
            for (let key in display_data) {
                if (display_data[key].indexOf("_") >= 0) { input_id = 'display_' + display_data[key]; }
                else { input_id = 'display_' + device + '_' + display_data[key]; }
                if (key !== "ICON") { html_col2 += this.tab.row(key + ":&nbsp;", "<span id='edit_" + input_id + "'>{"+display_data[key]+"}</span>"); }
            }
            html_col2 += this.tab.end();

            html += this.tab.row(html_col1, html_col2);
            html += this.tab.end();
        }
        // data in 2 columns
        else if (format === "columns") {
            let count = 1;
            let key_per_column = Math.round(Object.keys(display_data).length / 2);
            let column = 0;
            let html_cols = ["",""];
            for (let key in display_data) {
                let input_id = "";
                if (display_data[key].indexOf("_") >= 0) { input_id = 'display_' + display_data[key]; }
                else { input_id = 'display_' + device + '_' + display_data[key]; }
                html_cols[column] += this.tab.row(key + ":", "<span id='" + input_id + "'>no data</span>");
                if (count >= key_per_column) { column = 1; }
                count += 1;
            }
            html_cols[0] = this.tab.start("100%") + html_cols[0] + this.tab.end();
            html_cols[1] = this.tab.start("100%") + html_cols[1] + this.tab.end();

            html += this.tab.start("100%");
            html += this.tab.row(html_cols[0], html_cols[1]);
            html += this.tab.end();
        }
        // data in 2 columns - edit mode
        else if (format === "columns_edit") {
            let count = 1;
            let key_per_column = Math.round(Object.keys(display_data).length / 2);
            let column = 0;
            let html_cols = ["",""];
            for (let key in display_data) {
                let input_id = "";
                if (display_data[key].indexOf("_") >= 0) { input_id = 'display_' + display_data[key]; }
                else { input_id = 'display_' + device + '_' + display_data[key]; }
                html_cols[column] += this.tab.row(key + ":&nbsp;", "<span id='edit_" + input_id + "'>{"+display_data[key]+"}</span>");
                if (count >= key_per_column) { column = 1; }
                count += 1;
            }
            html_cols[0] = this.tab.start("100%") + html_cols[0] + this.tab.end();
            html_cols[1] = this.tab.start("100%") + html_cols[1] + this.tab.end();

            html += this.tab.start("100%");
            html += this.tab.row(html_cols[0], html_cols[1]);
            html += this.tab.end();
        }
        // default edit - just a table of keys and values - show {data_keys}
        else if (format === "edit") {
            html += this.tab.start("100%");
            for (let key in display_data) {
                let input_id = "";
                if (display_data[key].indexOf("_") >= 0) { input_id = 'display_' + display_data[key]; }
                else { input_id = 'display_' + device + '_' + display_data[key]; }
                html += this.tab.row(key + ":&nbsp;", "<span id='edit_" + input_id + "'>{"+display_data[key]+"}</span>");
            }
            html += this.tab.end();
        }
        // default - just a table of keys and values
        else {
            html += this.tab.start("100%");
            for (let key in display_data) {
                let input_id = "";
                if (display_data[key].indexOf("_") >= 0) { input_id = 'display_' + display_data[key]; }
                else { input_id = 'display_' + device + '_' + display_data[key]; }
                html += this.tab.row(key + ":&nbsp;", "<span id='" + input_id + "'>no data</span>");
            }
            html += this.tab.end();
        }

        return html;
    }

    /* return the set of available display sizes - connect to css definition in style-display.css */
    sizes() {
        return {
            "small": "Small",
            "middle": "Middle",
            "big": "Big",

            "h1w2": "2x width / 1x height",
            "h2w2": "2x width / 2x height",
            "h3w2": "2x width / 3x height",
            "h4w2": "2x width / 4x height",
            "h2w3": "3x width / 2x height",
            "h1w4": "4x width / 1x height",
            "h2w4": "4x width / 2x height",
            "h3w4": "4x width / 3x height",
            "h4w4": "4x width / 4x height",
            "h1w4 c2": "4x width / 1x height / 2 columns",
            "h2w4 c2": "4x width / 2x height / 2 columns",
            "h3w4 c2": "4x width / 3x height / 2 columns",
            "h4w4 c2": "4x width / 4x height / 2 columns",

            "weather1": "weather big",
            "weather2": "weather middle",
            "weather3": "weather small"
        };
    }

    /* create an alert for displays with the detailed view status values available for a device */
    alert(id, device, type="", style="" ) {

            let display_data = [];
            let text  = "Device Information: "+device +"<hr/>";
            text  += "<div style='width:100%;max-width:100%;max-height:400px;overflow-y:auto;overflow-x:hidden;display:block;'>";

            if (type === "scenes") {
                if (!rmData.scenes.data(device)["remote"]["display-detail"]) {
                    this.logging.warn(this.name+".display_alert() not implemented for this type and device ("+type+"/"+device+")");
                    this.logging.warn(rmData.scenes.data(device));
                    return;
                }
                else {
                    display_data = Object.keys(rmData.scenes.data(device)["remote"]["display-detail"]);
                    this.logging.warn(display_data);
                }
            }
            else if (type === "devices") {
                let power = this.data["STATUS"][type][device];

                if (type !== "devices") { power = {}; }
                let queries = rmData.devices.list_commands(device, "definition");
                if (rmData.devices.exists(device) && queries) { display_data = Object.keys(queries); }
                else { display_data = ["ERROR","No display defined"]; }

                this.logging.debug(device,"debug");
                this.logging.debug(power,"debug");
                this.logging.debug(queries,"debug");
                this.logging.debug(display_data,"debug");

                text  += "<span class='center' id='display_full_"+device+"_power'>"+power["api-status"]+": "+power["power"] + "</span><hr/>";
            }

            text  += this.tab_row("start","100%");

            for (let i=0; i<display_data.length; i++) {

                if (display_data[i] !== "power" && display_data[i] !== "device-configuration" && display_data[i].substring && display_data[i].substring(0,3) !== "api") { // || display_data[i].indexOf("api") !== 0)) {
                    let label = "<span class='display-label-dialog'>"+display_data[i]+":</span>";
                    let input = use_color("<span class='display-detail-dialog' id='display_full_"+device+"_"+display_data[i]+"' onclick='this.style.whiteSpace=\"unset\";'>no data</span>", "VALUE");
                    //text += "<div class='display-element alert'>"+label+input+"</div><br/>";
                    text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
                }
            }
            text  += this.tab_row("<hr/>",false);

            text  += this.tab_row("<span class='display-label-dialog'>API:</span>",              use_color("<span class='display-detail' id='display_full_"+device+"_api'>no data</span>", "VALUE") );
            text  += this.tab_row("<span class='display-label-dialog'>Status:</span>",           use_color("<span class='display-detail' id='display_full_"+device+"_api-status'>no data</span>", "VALUE") );
            text  += this.tab_row("<span class='display-label-dialog'>Last&nbsp;Send:</span>",   use_color("<span class='display-detail' id='display_full_"+device+"_api-last-send'>no data</span>", "VALUE") );
            text  += this.tab_row("<span class='display-label-dialog'>Last&nbsp;Query:</span>",  use_color("<span class='display-detail' id='display_full_"+device+"_api-last-query'>no data</span>", "VALUE") );
            text  += this.tab_row("<span class='display-label-dialog'>Last&nbsp;Answer:</span>", use_color("<span class='display-detail' id='display_full_"+device+"_api-last-answer'>no data</span>", "VALUE") );
            text  += this.tab_row("end");

            text  += "</div>";
            appMsg.confirm(text,"",500);
            statusCheck_load();
        }

    /* create a textarea for JSON data, specially formated - currently not used any more?! */
    json(id, json, format="" ) {

        let text = "";
        text += "<span class='center'><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:95%;height:160px;\">";
        if (format === "buttons") {
            let x=0;
            text += "[\n";
            for (let i=0;i<json.length;i++) {
                x++;
                text += "\""+json[i]+"\"";
                if (i+1 < json.length)                                          { text += ", "; }
                if (Number.isInteger((x)/4))                                    { text += "\n\n"; x = 0; }
                if (json.length > i+1 && json[i+1].includes("LINE") && x > 0)   { text += "\n\n"; x = 0; }
                if (json[i].includes("LINE"))                                   { text += "\n\n"; x = 0; }
                if (json[i].includes("HEADER-IMAGE"))                           { text += "\n\n"; x = 0; }
                if (json[i].includes("SLIDER"))                                 { text += "\n\n"; x = 0; }
                if (json[i].includes("COLOR-PICKER"))                           { text += "\n\n"; x = 0; }
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
        else {
            json = JSON.stringify(json);
            json = json.replaceAll( ",", ",\n" );
            json = json.replaceAll( "{", "{\n" );
            json = json.replaceAll( "}", "\n}" );
            text += json;
        }
        text += "</textarea></span>";
        return text;
    }

    /* create a row for the display.alert() */
    tab_row(td1, td2="") {
            if (td1 === "start")     { return "<table border=\"0\" width=\""+td2+"\">"; }
            else if (td1 === "end")	{ return "</table>"; }
            else if (td2 === false)	{ return "<tr><td valign=\"top\" colspan=\"2\">" + td1 + "</td></tr>"; }
            else                    { return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
        }

    /* create a line for the display.alert() */
    tab_line(text="") {

        return "<tr><td colspan='2'><hr style='border:1px solid white;'/></td></tr>";
    }
}


remote_scripts_loaded += 1;

