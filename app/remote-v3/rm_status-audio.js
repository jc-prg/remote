//--------------------------------
// jc://remote/
//--------------------------------

let rmStatusAudio;


// class for audio functionality (used in rm_status.js > statusCheck())
class RemoteVisualizeMainAudioStatus extends RemoteDefaultClass {
    constructor(name, status, data) {
        super(name);

        this.data = data;
        this.status = status;

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

        this.temp_audio_level = 0;
        this.temp_audio_time = 0;
        this.temp_audio_offset = 10;

        // bind volume slider
        this.slider = new jcSlider(this.name+".slider", "audio_slider");
        this.slider.init(0, 100, "loading");
        this.slider.setPosition("45px",false,false,"10px");
        this.slider.setOnChange(this.change_volume);
        this.slider.setShowVolume(this.show_status_slider);

        for (let key in this.audio_info) {
            let element = document.getElementById(this.audio_info[key]);
            element.addEventListener("click", () => {
                this.slider.show_hide();
            });
        }

        this.main_audio_settings();
        //this.show_status_slider = this.show_status_slider.bind(this);
        //this.change_volume = this.change_volume.bind(this);
    }

    // read main audio device status
    main_audio_status() {
        if (this.audio_active) {

            this.audio_status_details = this.status.status_device(this.audio_device, true);
            this.audio_status = this.audio_status_details["status"];
            if (this.audio_status.indexOf("ERROR") >= 0) { this.audio_status += " (" + this.audio_status_details["message"] + ")"; }
        }
        return this.audio_status;
    }

    // read properties from main audio device
    main_audio_settings(data=undefined) {
        if (data !== undefined) { this.data = data || dataAll; }

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
        
        this.main_audio_status();
        if (this.audio_status.indexOf("ERROR") < 0) {
            if (device_definition && device_definition["vol"] && device_definition["vol"]["values"] && device_definition["vol"]["values"]["max"]) { this.audio_level["max"] = device_definition["vol"]["values"]["max"]; }
            if (device_definition && device_definition["vol"] && device_definition["vol"]["values"] && device_definition["vol"]["values"]["max"]) { this.audio_level["min"] = device_definition["vol"]["values"]["min"]; }

            this.slider.init(this.audio_level["min"],this.audio_level["max"],this.audio_device_label+" ("+this.audio_device+")");
            this.slider.device = this.audio_device;
        }
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

    // check if temp volume level is relevant (avoid a "jump back to old volume" while change_volume() is processed by the server)
    volume_temp(volume) {
        let current_time = Math.floor(Date.now() / 1000);
        if (this.temp_audio_time !== 0 && current_time - this.temp_audio_time <= this.temp_audio_offset) {
            return this.temp_audio_level;
        }
        return volume;
    }

    // draw volume level
    volume_draw(volume_level, volume_min, volume_max, bar_length) {
        let volume_bar = "";
        if (volume_level !== undefined) {

            let volume = Math.round((volume_level - volume_min) * bar_length / volume_max);
            volume_bar = "<span style='color:" + this.color_volume + "'>";
            for (let i = 0; i < volume; i++) {
                volume_bar += this.volume_bar_element;
            }
            volume_bar += "</span>";

            volume_bar += "<span style='color:" + this.color_no_volume + "'>";
            for (let i = 0; i < bar_length - volume; i++) {
                volume_bar += this.volume_bar_element;
            }
            volume_bar += "</span>";
        }
        return volume_bar;
    }

    // display volume level
    volume(volume_level=undefined) {
        let volume_bar = this.volume_draw(volume_level, this.audio_level["min"], this.audio_level["max"], this.volume_bar_length);
        setTextById(this.audio_info["volume"], volume_bar);
    }

    // show audio status
    show_status(data) {
        this.main_audio_settings(data);

        if (!this.audio_active || this.audio_status.indexOf("ERROR") >= 0) {
            this.logging.error("show(): device=" + this.audio_device + "; status=" + this.audio_status);
            this.volume();
            this.mute();
        }
        else if (this.audio_status.indexOf("OFF") >= 0) {
            this.logging.debug("show(): device=" + this.audio_device + "; status=" + this.audio_status);
            this.volume(0);
            this.mute();
        }
        else {
            let status_mute = this.data["STATUS"]["devices"][this.audio_device]["mute"];
            let status_volume = this.data["STATUS"]["devices"][this.audio_device]["vol"];
            status_volume = this.volume_temp(status_volume);
            this.volume(status_volume);
            if (status_volume === 0) { status_mute = true; }
            this.mute(status_mute);
            this.slider.set_value(status_volume);

            this.logging.debug("show(): device=" + this.audio_device + "; status=" + this.audio_status +"; volume=" + status_volume + "; mute=" + status_mute);
        }

    }

    // show audio status after slider change
    show_status_slider(data) {
        rmStatusAudio.temp_audio_level = data;
        rmStatusAudio.temp_audio_time = Math.floor(Date.now() / 1000);
        rmStatusAudio.show_status();
    }

    // send API call to set volume
    change_volume(volume) {
        console.debug("change_volume(): " + rmStatusAudio.audio_device+" -> "+volume);
        appFW.requestAPI( "GET",  ["set",rmStatusAudio.audio_device,"send-vol",volume], "", remoteReload_load );
    }
}
