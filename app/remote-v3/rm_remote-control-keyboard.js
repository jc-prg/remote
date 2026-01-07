//--------------------------------
// jc://remote/keyboard/
//--------------------------------


/* class to create a text field in the remote for sending text data, e.g., to be used for a content search */
class RemoteControlKeyboard extends RemoteDefaultClass{
    constructor(name) {
        super(name);
    }

    /* create text input field to activate device keyboard */
    input() {
        let cmd_update = this.name + ".update();";
        let cmd_send = this.name + ".send();";
        let cmd_enter = "if (event.keyCode==13) {"+cmd_send+"}";
        let remote = "<span class='center'><div id='"+this.name+"_keyboard' class='remote-keyboard'><br/>";
        remote += "<input id='"+this.name+"_keyboard_input' onkeypress='"+cmd_enter+"' oninput='"+cmd_update+"' type='text' style='width:80%;font-size:18px;'>&nbsp;";
        remote += "<button onclick=\""+cmd_send+"\">&nbsp;&gt;&nbsp;</button></div></span>";
        return remote;
    }

    /* Set device name for remote keyboard */
    set_device(device ) {
            this.active_name = device;
            this.logging.default("Set device name for remote keyboard: "+this.active_name);
            }

    /* update text via keyboard */
    update() {
        this.logging.default("Update text via keyboard: "+this.active_name);

        if (this.kupdate) { return; }
        this.kupdate = true;
        let input = document.getElementById(this.name+"_keyboard_input").value;
        appFW.requestAPI('GET',[ 'send-data', this.active_name, 'send-text', input ], '','');
        this.kupdate = false;
        }

    /* send input to API */
    send() {
        let input = document.getElementById(this.name+"_keyboard_input").value;
        appFW.requestAPI('GET',[ 'send-data', this.active_name, 'send-text-enter', input ], '','');
    }

    /* command to toggle between visible and hidden */
    toggle_cmd() {
        return this.name+'.input_toggle();';
        }

    /* toggle between visible and hidden, indirectly used - cmd created by toggle_cmd() */
    input_toggle() {
        const input = document.getElementById(this.name+"_keyboard");
        const input_text = document.getElementById(this.name+"_keyboard_input");
        if (input.style.display === "block") {
            input.style.display = "none";  input_text.blur(); input_text.value = "";
        }
        else {
            input.style.display = "block"; input_text.focus();
        }
    }
}


remote_scripts_loaded += 1;
