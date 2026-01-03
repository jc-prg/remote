//--------------------------------
// jc://remote/color-picker/
//--------------------------------
// uses parts from source: https://www.w3docs.com/tools/color-picker

/* create a color-picker, to be embedded into a button -> RemoteControlAdvanced.colorPicker() */
class RemoteElementColorPicker extends RemoteDefaultClass {
    constructor(name) {
        super(name);
        this.hh = 0;
    }

    set_device(name) {

            this.active_name = name;
            }

    // color picker visualization
    colorPickerHTML(container_id, sub_id, send_command, color_model) {

            const device = sub_id.replace("_"+send_command, "");
            let use_image = "rgb";

            this.logging.debug("Load Color Picker ("+container_id+" - " + device + " - " + send_command + " / " + color_model + ") ...");

            if (color_model.indexOf("Brightness") > -1)       { use_image = "strip_brightness"; }
            else if (color_model.indexOf("temperature") > -1) { use_image = "strip_temperature"; }
            else if (color_model.indexOf("small") > -1)       { use_image = "strip_rgb"; }
            else if (color_model.indexOf("old") > -1)         { use_image = "old"; }

            let color_picker_images = {
                "rgb":               ['remote-v3/img/rgb2.png', 250, 250],
                "strip_rgb":         ['remote-v3/img/rgb-regenbogen.png', 280, 30],
                "strip_temperature": ['remote-v3/img/color-temp.png', 280, 30],
                "strip_brightness":  ['remote-v3/img/brightness.png', 280, 30],
                "old":               ['remote-v3/img/img_colormap.gif', 234, 199]
            }

            // Get the canvas element and its context
            const color_demo = document.getElementById("color-picker_demo_" + sub_id);
            const canvas = document.getElementById(container_id);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const color_send_command = send_command;

            // Load image
            const image  = new Image();
            image.src    = color_picker_images[use_image][0]; // Replace 'image.jpg' with your image path
            image.width  = color_picker_images[use_image][1];
            image.height = color_picker_images[use_image][2];

            if (image.height === 30) {
                color_demo.style.width  = "10px";
                color_demo.style.height = "28px";
                color_demo.style.background = "2px solid white";
                }
            else {
                color_demo.style.width  = (image.width/2) + "px";
                color_demo.style.height = "10px";
                color_demo.style.background = "2px solid gray";
                }

            // When the image is loaded, draw it on the canvas
            image.onload = function() {
                canvas.width  = image.width;
                canvas.height = image.height;
                canvas.style.borderRadius = "5px";
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                console.debug("Color picker canvas size: " + canvas.width + "x" + canvas.height);
            };

            // Event listener for click on the canvas
            canvas.addEventListener('click', (event) => {

                // Get the clicked pixel data
                let x = event.offsetX;
                let y = event.offsetY;
                const pixelData = ctx.getImageData(x, y, 1, 1).data;

                // Extract RGB values
                const red   = pixelData[0];
                const green = pixelData[1];
                const blue  = pixelData[2];
                const value = Math.round(x / canvas.width * 1000) / 10;

                // Display RGB values
                this.logging.debug("PIXEL DATA: " + pixelData);
                this.logging.debug(`PIXEL DATA: X: ${x}, Y: ${y} | R: ${red}, G: ${green}, B: ${blue} | value: ${value}`);
                color_demo.style.backgroundColor = "rgb("+red+","+green+","+blue+")";

                let input = `${red}:${green}:${blue}`;
                if (color_model.indexOf("CIE_1931") > -1)          { eval(this.name).sendColorCode_CIE1931(color_send_command, input, device); }
                else if (color_model.indexOf("temperature") > -1)  { eval(this.name).sendColorCode_temperature(color_send_command, value, device); }
                else if (color_model.indexOf("Brightness") > -1)   { eval(this.name).sendColorCode_brightness(color_send_command, value, device); }
                else                                                          { eval(this.name).sendColorCode(color_send_command, input, device); }
            });

        }

    // send color code for CIE1931
    sendColorCode_CIE1931(send_command, input, device) {

            let rgb_color = input.split(":");
            let xy_color  = this.RGB_to_XY(rgb_color);
            input     = xy_color[0] + ":" + xy_color[1];

            this.logging.log("Send CIE 1931 XY color coordinates: " + input + " / " + this.name + " / " + device);
            appFW.requestAPI('GET',[ 'send-data', device, send_command, '"'+input+'"' ], '','');
        }

    // send color code for brightness
    sendColorCode_brightness(send_command, input, device) {
        let pure_cmd = send_command.replace("send-", "");
        let check_device = device;

        if (device.indexOf("group") >= 0) {
            let group_id = device.split("_")[1];
            let devices = remoteData.device_groups.list_devices(group_id);
            check_device = devices[0];
        }

        let commands_def = remoteData.devices.list_commands(check_device, "definition");
        let min_max  = commands_def[pure_cmd]["values"];
        let type     = commands_def[pure_cmd]["type"];
        if (min_max === undefined || min_max["min"] === undefined || min_max["max"] === undefined) {
            appMsg.info("Could not set brightness: no min-max values for " + check_device + " / " + pure_cmd + ".  Check remote configuration!","error");
            this.logging.error(commands_def[pure_cmd]);
            this.logging.error(min_max["min"]);
        }
        else {
            let range = min_max["max"] - min_max["min"];
            let value = (range * input) / 100 + min_max["min"];
            if (type === "integer") { value = Math.round(value); }
            this.logging.log("BRIGHTNESS: " + send_command + " / " + input + " / min=" + min_max["min"] + "; max=" + min_max["max"] + " / " + value);
            this.logging.debug(min_max);
            appFW.requestAPI('GET',[ 'send-data', device, send_command, value ], '','');
        }
    }

    // send color code for temperature
    sendColorCode_temperature(send_command, input, device) {
            let pure_cmd = send_command.replace("send-", "");
            let check_device = device;

            if (device.indexOf("group") >= 0) {
                let group_id = device.split("_")[1];
                let devices = remoteData.device_groups.list_devices(group_id);

                check_device = devices[0];
            }

            let commands_def = remoteData.devices.list_commands(check_device, "definition");
            let min_max  = commands_def[pure_cmd]["values"];
            let type     = commands_def[pure_cmd]["type"];
            if (min_max === undefined || min_max["min"] === undefined || min_max["max"] === undefined) {
                appMsg.info("Could not set color temperature: no min-max values for " + device + " / " + pure_cmd + ". Check remote configuration!","error");
                this.logging.error(commands_def[pure_cmd]);
                }
            else {
                let range = min_max["max"] - min_max["min"];
                let value = (range * input) / 100 + min_max["min"];
                if (type === "integer") { value = Math.round(value); }
                this.logging.log("TEMPERATURE: " + send_command + " / " + input + " / min=" + min_max["min"] + "; max=" + min_max["max"] + " / " + value);
                this.logging.debug(min_max);
                appFW.requestAPI('GET',[ 'send-data', device, send_command, value ], '','');
                }
            }

    // send commands depending on color model
    sendColorCode(send_command, input, device) {

            this.logging.log("Send default color code: " + input + " / " + this.name + " / " + device);
            appFW.requestAPI('GET',[ 'send-data', device, send_command, '"'+input+'"'	 ], '','');
            }

    // Function to convert RGB to XY
    RGB_to_XY(rgb) {

            let red = rgb[0];
            let green = rgb[1];
            let blue = rgb[2];

            //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
            red 	= (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
            green 	= (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
            blue 	= (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

            //RGB values to XYZ using the Wide RGB D65 conversion formula
            let X 		= red * 0.664511 + green * 0.154324 + blue * 0.162028;
            let Y 		= red * 0.283881 + green * 0.668433 + blue * 0.047685;
            let Z 		= red * 0.000088 + green * 0.072310 + blue * 0.986039;

            //Calculate the xy values from the XYZ values
            let x 		= (X / (X + Y + Z)).toFixed(4);
            let y 		= (Y / (X + Y + Z)).toFixed(4);

            if (isNaN(x))
                x = 0;
            if (isNaN(y))
                y = 0;
            return [x, y];
            }
}

