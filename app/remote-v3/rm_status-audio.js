//--------------------------------
// jc://remote/
//--------------------------------

let statusCheck_audio;


// class for audio functionality (used in rm_status.js > statusCheck())
class RemoteMainAudio {
    constructor(name) {
        this.app_name = name;
        this.data = dataAll;

        this.audio_device = undefined;
        this.audio_device_label = "";
        this.audio_active = undefined;
        this.audio_status = "INIT";
        this.audio_info = {
            "mute": "audio1",
            "active": "audio2",
            "volume": "audio3"
        }
        this.audio_level = {
            "min": 0,
            "max": 100
        }
        this.color_volume = "white";
        this.color_no_volume = "#333333";
        this.volume_bar_length = 20;
        this.volume_bar_element = "I";

        this.slider = new jcSlider(this.app_name+".slider", "audio_slider");
        this.slider.init(0, 100, "loading");
        this.slider.setPosition("45px",false,false,"10px");
        this.slider.setOnChange(apiSetVolume);
        this.slider.setShowVolume(this.show);

        for (let key in this.audio_info) {
            let element = document.getElementById(this.audio_info[key]);
            element.addEventListener("click", () => {
                this.slider.show_hide();
            });
        }

        this.main_audio_settings();
    }

    // read properties from main audio device
    main_audio_settings(data=undefined) {
        if (data !== undefined) {
            this.data = data;
        }

        this.audio_device = this.data["CONFIG"]["main-audio"];
        this.audio_active = (this.audio_device !== undefined);

        let devices = this.data["STATUS"]["devices"];
        let devices_config = this.data["CONFIG"]["devices"];

        if (devices[this.audio_device] === undefined || devices_config[this.audio_device] === undefined) {
            this.audio_active = false;
            this.audio_status = "ERROR: device not found ("+this.audio_device+")";
        }

        let device_definition = devices_config[this.audio_device]["commands"]["definition"];
        let device_api = this.data["STATUS"]["devices"][this.audio_device]["api"];
        let device_api_status = this.data["STATUS"]["interfaces"]["connect"][device_api];
        this.audio_device_label = devices_config[this.audio_device]["settings"]["label"];

        if (device_api_status === undefined) {
            this.audio_active = false;
            this.audio_status = "ERROR: device_api not found ("+device_api+")";
        }

        if (this.audio_status.indexOf("ERROR") < 0) {
            if (device_definition && device_definition["vol"] && device_definition["vol"]["values"] && device_definition["vol"]["values"]["max"]) { this.audio_level["max"] = device_definition["vol"]["values"]["max"]; }
            if (device_definition && device_definition["vol"] && device_definition["vol"]["values"] && device_definition["vol"]["values"]["max"]) { this.audio_level["min"] = device_definition["vol"]["values"]["min"]; }

            this.main_audio_status(this.data);

            this.slider.init(this.audio_level["min"],this.audio_level["max"],this.audio_device_label+" ("+this.audio_device+")");
            this.slider.device = this.audio_device;
        }
    }

    // read main audio device status
    main_audio_status(data) {
        if (this.audio_active) {
            const [device_status, device_status_info] = statusCheck_devicePowerStatus(data);
            this.audio_status = device_status[this.audio_device];
            if (this.audio_status.indexOf("ERROR") >= 0) { this.audio_status += " (" + device_status_info[this.audio_device] + ")"; }
        }
        return this.audio_status;
    }

    // display mute/active icon
    mute(status=true) {
        if (status === "True") { status = true; }
        if (status === "False") { status = false; }

        if (status) {
            elementHidden(this.audio_info["active"]);
            elementVisible(this.audio_info["mute"]);
        } else {
            elementHidden(this.audio_info["mute"]);
            elementVisible(this.audio_info["active"]);
        }
    }

    // display volume level
    volume(volume_level=undefined) {
        let volume_bar = "";

        if (volume_level !== undefined) {
            let volume = Math.round((volume_level - this.audio_level["min"]) * this.volume_bar_length / this.audio_level["max"]);
            volume_bar = "<span style='color:" + this.color_volume + "'>";
            for (let i = 0; i < volume; i++) {
                volume_bar += this.volume_bar_element;
            }
            volume_bar += "</span>";

            volume_bar += "<span style='color:" + this.color_no_volume + "'>";
            for (let i = 0; i < this.volume_bar_length - volume; i++) {
                volume_bar += this.volume_bar_element;
            }
            volume_bar += "</span>";
        }
        setTextById(this.audio_info["volume"], volume_bar);
    }

    // show audio status
    show_status(data) {
        this.main_audio_settings(data);

        if (!this.audio_active || this.audio_status.indexOf("ERROR") >= 0) {
            console.error("StatusCheckMainAudio.show(): device=" + this.audio_device + "; status=" + this.audio_status);
            this.volume();
            this.mute();
        }
        else if (this.audio_status.indexOf("OFF") >= 0) {
            console.debug("StatusCheckMainAudio.show(): device=" + this.audio_device + "; status=" + this.audio_status);
            this.volume(0);
            this.mute();
        }
        else {
            let status_volume = data["STATUS"]["devices"][this.audio_device]["vol"];
            let status_mute = data["STATUS"]["devices"][this.audio_device]["mute"];
            this.volume(status_volume);
            if (status_volume === 0) { status_mute = true; }
            this.mute(status_mute);
            this.slider.set_value(status_volume);

            console.debug("StatusCheckMainAudio.show(): device=" + this.audio_device + "; status=" + this.audio_status +"; volume=" + status_volume + "; mute=" + status_mute);
        }

    }
}
