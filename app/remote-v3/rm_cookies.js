//--------------------------------
// jc://remote/
//--------------------------------

let rmCookies = undefined;


/* class to handle remote specific cookies */
class RemoteCookies extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.cookie = new jcCookie(name + ".cookie");
        this.cookie_remote = "remote";
        this.cookie_app = "app";
    }

    /* erase all data from cookie */
    erase() {
        this.logging.debug("erase()");
        this.cookie.set(this.cookie_remote, "");
    }

    /* get cookie data and return as array */
    get() {
        let result = this.cookie.get(this.cookie_remote);
        this.logging.debug("get(): " + result);
        if (!result || result === "") { result = []; }
        else { result = result.split("::"); }
        return result;
    }

    /* load settings from cookie */
    get_settings() {
        let cookie = this.get();
        if (cookie.length > 1) {
            this.logging.info("Get settings from cookie: " + this.info());

            // start remote if cookie is set (reopen with last remote control)
            if (cookie[0] === "scene") 	{
                rmRemote.create('scene',cookie[1]);
                rmSettings.hide();
                setNavTitle(cookie[2]);
            }
            else if (cookie[0] === "device") {
                rmRemote.create('device',cookie[1]);
                rmSettings.hide();
                setNavTitle(cookie[2]);
            }
            else {}

            if (cookie.length > 3) { remoteToggleEditMode(cookie[3]); }
            if (cookie.length > 4) { remoteToggleEasyEdit(cookie[4]); }
            if (cookie.length > 5) { remoteToggleRemoteHints(cookie[5]); }
            if (cookie.length > 6) { remoteToggleJsonHighlighting(cookie[6]); }
        }
    }

    /* return cookie data as formated string with labels */
    info() {
        let info = "";
        let label = ["type", "active", "label", "edit-mode", "easy-edit", "hints", "json-highlighting"]
        let cookie = this.get();
        for (let i = 0; i < cookie.length; i++) {
            info += label[i] + "=" + cookie[i];
            if (i < cookie.length - 1) { info += ", "}
        }
        return info;
    }

    /* set cookie data */
    set(values) {
        if (values && values !== []) {
            values = values.join("::");
        }
        this.logging.debug("set(): " + values);
        this.cookie.set(this.cookie_remote, values);
    }

    /* set remote cookie data, and get the others from global vars */
    set_remote(rm_type, rm_active, rm_label) {
        this.set([rm_type, rm_active, rm_label, rmRemote.edit_mode, easyEdit, remoteHints, jsonHighlighting]);
    }

    /* set all relevant cookie data directly */
    set_all(rm_type, rm_active, rm_label, rm_edit_mode, rm_easy_edit, rm_hints, rm_json) {
        this.set([rm_type, rm_active, rm_label, rm_edit_mode, rm_easy_edit, rm_hints, rm_json]);
    }

    /* set cookie data from global vars */
    set_status_quo() {
        this.set([rmRemote.active_type, rmRemote.active_name, rmRemote.active_label, rmRemote.edit_mode, easyEdit, remoteHints, jsonHighlighting]);
    }
}
