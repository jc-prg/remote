//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// Build standard Remote Controls
//-----------------------------
// jc://remote/keyboard
// --------------------------------


/* create displays for scene and device remote controls, format defined in style-display.css */
class RemoteElementDisplay {

    constructor(name) {

        this.app_name       = name;
        this.data           = {};
        this.edit_mode      = false;
        this.logging        = new jcLogging(this.app_name);
    }

    /* create a set of displays for each type, one visible and the others hidden */
    default(id, device, rm_type="devices", style="", display_data={}) {

            let text          = "";
            let status;

            if (rm_type === "scenes") {
                let [scene_status, status_log] = statusCheck_scenePowerStatus(dataAll);
                status = scene_status[device];
            }
            else {
                let [device_status, device_status_log] = statusCheck_devicePowerStatus(dataAll);
                status = device_status[device];
            }

            // create link for details (for scenes not defined yet)
            if (rm_type === "devices")   { let onclick = "onclick=\"" + this.app_name + ".alert('"+id+"','"+device+"','"+rm_type+"','##STYLE##');\""; }
            else                        { let onclick = "disabled"; }

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
                for (let key in display_data) {
                    let label = "<span class='display-label'>"+key+":</span>";
                    let input = "<span class='display-input-shorten' id='display_"+device+"_"+display_data[key]+"_edit'>{"+display_data[key]+"}</span>";
                    text += "<div class='display-element "+style+"'>"+label+input+"</div>";
                }
                text += display_end;
            }

            else {
                // display if ERROR
                text += display_start;
                text  = text.replace( /##STATUS##/g, "ERROR" );
                text  = text.replace( /##STYLE##/g, style + " display_error" );

                if (status.indexOf("ERROR") >= 0) {
                    text  = text.replace( /##DISPLAY##/g, "block" );
                    text += "<center><b>"+lang("CONNECTION_ERROR")+"</b></center>"; //<br/>";
                }
                else if (status.indexOf("DISABLED") >= 0) {
                    text  = text.replace( /##DISPLAY##/g, "block" );
                    text += "<center><b>"+lang("CONNECTION_DISABLED")+"</b></center>"; //<br/>";
                }
                else {
                    text += "<center><b>"+lang("CONNECTION_ERROR")+"</b></center>"; //<br/>";
                    text  = text.replace( /##DISPLAY##/g, "none" );
                }
                text += "<center><i><text id='display_ERROR_info_"+device+"'></text></i></center>";
                text += display_end;

                // display if ON
                text += display_start;
                text  = text.replace( /##STATUS##/g, "ON" );
                text  = text.replace( /##STYLE##/g, style + " display_on" );
                if (status === "ON" || status === "PARTLY")	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                                        { text  = text.replace( /##DISPLAY##/g, "none" ); }

                for (let key in display_data) {
                    let input_id = "";
                    if (display_data[key].indexOf("_") >= 0)    { input_id = 'display_' + display_data[key]; }
                    else                                        { input_id = 'display_' + device + '_' + display_data[key]; }
                    let label    = "<span class='display-label'>"+key+":</span>";
                    let input    = "<span class='display-input' id='"+input_id+"'>no data</span>";
                    text += "<div class='display-element "+style+"'>"+label+input+"</div>";
                }
                text += display_end;

                // display if MANUAL_MODE
                text += display_start;
                text  = text.replace( /##STATUS##/g, "MANUAL" );
                text  = text.replace( /##STYLE##/g, style + " display_manual" );
                if (rm3settings.manual_mode || status === "N/A")    { text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                                               { text  = text.replace( /##DISPLAY##/g, "none" ); }
                text += "<center>"+lang("CONNECTION_MANUAL")+"<br/><text id='display_MANUAL_info_"+device+"'></text></center>";
                text += display_end;

                // display if OFF
                text += display_start;
                text  = text.replace( /##STATUS##/g, "OFF" );
                text  = text.replace( /##STYLE##/g, style + " display_off" );
                if (status === "OFF")    { text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                    { text  = text.replace( /##DISPLAY##/g, "none" ); }
                text += "<center><b>"+lang("CONNECTION_DEVICE_OFF")+"</b><br/><i><text id='display_OFF_info_"+device+"'></text></i></center>";
                text += display_end;

                // display if OFF
                text += display_start;
                text  = text.replace( /##STATUS##/g, "POWER_OFF" );
                text  = text.replace( /##STYLE##/g, style + " display_off" );
                if (status === "POWER_OFF")    { text  = text.replace( /##DISPLAY##/g, "block" ); }
                else                          { text  = text.replace( /##DISPLAY##/g, "none" ); }
                text += "<center><b>"+lang("CONNECTION_POWER_OFF")+"</b><br/><i><text id='display_POWER_OFF_info_"+device+"'></text></i></center>";
                text += display_end;
            }

            return text;
        }

    /* return the set of available display sizes - connect to css definition in style-display.css */
    sizes() {
        return {
            "small": "Small",
            "middle": "Middle",
            "big": "Big",
            "h1w2": "1x height / 2x wide",
            "h1w4": "1x height / 4x wide",
            "h2w2": "2x height / 2x wide",
            "h2w3": "2x height / 3x wide",
            "h2w4": "2x height / 4x wide",
            "h3w2": "3x height / 2x wide",
            "h4w2": "4x height / 2x wide"
        };
    }

    /* create an alert for displays with the detailed view status values available for a device */
    alert(id, device, type="", style="" ) {

            let display_data = [];
            let text  = "Device Information: "+device +"<hr/>";
            text  += "<div style='width:100%;height:400px;overflow-y:scroll;'>";

            if (type !== "devices") {

                if (!this.data["CONFIG"][type][device]["remote"]["display-detail"]) {

                    this.logging.warn(this.app_name+".display_alert() not implemented for this type and device ("+type+"/"+device+")");
                    this.logging.warn(this.data["CONFIG"][type][device]);
                    return;
                }
                else {
                    display_data = Object.keys(this.data["CONFIG"][type][device]["remote"]["display-detail"]);
                    this.logging.warn(display_data);
                }
            }

            else {
                let power = this.data["STATUS"][type][device];
                if (type !== "devices") { power = {}; }
                let queries = this.data["CONFIG"]["devices"][device]["commands"]["definition"];
                if (this.data["CONFIG"]["devices"][device] && queries)	{ display_data = Object.keys(queries); }
                else								{ display_data = ["ERROR","No display defined"]; }

                this.logging.debug(device,"debug");
                this.logging.debug(power,"debug");
                this.logging.debug(queries,"debug");
                this.logging.debug(display_data,"debug");

                text  += "<center id='display_full_"+device+"_power'>"+power["api-status"]+": "+power["power"] + "</center><hr/>";
            }

            text  += this.tab_row("start","100%");

            for (let i=0; i<display_data.length; i++) {

                if (display_data[i] !== "power" && display_data[i].substring && display_data[i].substring(0,3) !== "api") { // || display_data[i].indexOf("api") !== 0)) {
                    let label = "<span class='display-label-dialog'>"+display_data[i]+":</span>";
                    let input = use_color("<span class='display-detail-dialog' id='display_full_"+device+"_"+display_data[i]+"'>no data</span>", "VALUE");
                    //text += "<div class='display-element alert'>"+label+input+"</div><br/>";
                    text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
                }
            }
            text  += this.tab_row("<hr/>",false);

            text  += this.tab_row("<span class='display-label-dialog'>API:</span>",             use_color("<span class='display-detail' id='display_full_"+device+"_api'>no data</span>", "VALUE") );
            text  += this.tab_row("<span class='display-label-dialog'>Status:</span>",          use_color("<span class='display-detail' id='display_full_"+device+"_api-status'>no data</span>", "VALUE") );
            text  += this.tab_row("<span class='display-label-dialog'>Last&nbsp;Send:</span>",  use_color("<span class='display-detail' id='display_full_"+device+"_api-last-send'>no data</span>", "VALUE") );
            text  += this.tab_row("<span class='display-label-dialog'>Last&nbsp;Query:</span>", use_color("<span class='display-detail' id='display_full_"+device+"_api-last-query'>no data</span>", "VALUE") );
            text  += this.tab_row("end");

            text  += "</div>";
            appMsg.confirm(text,"",500);
            statusCheck_load();
        }

    /* create a textarea for JSON data, specially formated - currently not used any more?! */
    json(id, json, format="" ) {

        let text = "";
        text += "<center><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:95%;height:160px;\">";
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
        text += "</textarea></center>";
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

