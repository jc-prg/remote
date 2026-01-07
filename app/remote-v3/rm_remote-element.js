//--------------------------------
// jc://remote/elements/
//--------------------------------


let rmSheetBox_open = {};


/* create elements for remote control editing */
class RemoteElementsEdit extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.data           = {};
        this.edit_mode      = false;
        this.input_width    = "100px";
        this.container_open = {};
    }

    // create a basic container element that can be opened or closed dynamically
    container(id, title, text="", open=true) {

        let onclick  = ' onclick="'+this.name+'.container_showHide(\''+id+'\')"; '

        if (this.container_open[id] !== undefined) {
            open = this.container_open[id];
        } else {
            this.container_open[id] = open;
        }
        let display  = "";
        let link     = "&minus;";
        let ct       = "";

        if (open === false) {
            link    = "+";
            display = "display:none;";
            }

        ct  += "<div id='"+id+"_header' class='remote_group_header' "+onclick+">[<span id='"+id+"_link'>"+link+"</span>]&nbsp;&nbsp;<b>"+title+"</b></div>";
        ct  += "<div id='"+id+"_status' style='display:none;'>"+open+"</div>";
        ct  += "<div id='"+id+"_body'   class='remote_group' style='"+display+"'>";
        ct  += text;
        ct  += "</div>";

        return ct;
    }

    // open or close the basic container element
    container_showHide(id) {
        let status = document.getElementById(id+"_status").innerHTML;
        if (status === "true") {
            document.getElementById(id+"_body").style.display = "none";
            document.getElementById(id+"_status").innerHTML   = "false";
            document.getElementById(id+"_link").innerHTML     = "+";
            this.container_open[id] = false;
        }
        else {
            document.getElementById(id+"_body").style.display = "block";
            document.getElementById(id+"_status").innerHTML   = "true";
            document.getElementById(id+"_link").innerHTML     = "&minus;";
            this.container_open[id] = true;
        }
    }

    // create a simple input field
    input(id, value="") {

        return "<div style='width:" + this.input_width + ";margin:0;'><input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;' value='"+value+"'></div>";
    }

    // create a select field with options from a dict
    select(id, title, data, onchange="", selected_value="", sort=false, change_key_value=false) {

        if (change_key_value) {
            let new_data = {};
            for (let key in data) {
                new_data[data[key]] = key;
                }
            data = new_data;
            }

        let item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
        item     += "<option value='' disabled='disabled' selected>"+lang("SELECT")+" " + title + "</option>";
        let keys = Object.keys(data);

        if (sort) { keys.sort(); }
        for (let i=0;i<keys.length;i++) {
            let key = keys[i];
            let selected = "";
            if (selected_value === key) { selected = "selected"; }
            if (key !== "default") {
                item += "<option value=\"" + key + "\" "+selected+">" + data[key] + "</option>";
            }
        }
        item     += "</select>";
        return item;
    }

    // create a select field with options from an array
    select_array(id, title, data, onchange="", selected_value="") {
        let control = {};
        let item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
        item     += "<option value='' disabled='disabled' selected>"+lang("SELECT")+" " + title + "</option>";
        data.forEach(function(key) {
            let selected = "";
            if (selected_value === key) { selected = "selected"; }
            if (key !== "default" && !control[key]) {
                item += "<option value=\"" + key + "\" "+selected+">" + key + "</option>";
                control[key] = 1;
                }
            });
        item     += "</select>";
        return item;
    }

    // create a line with a text on it, if given
    edit_line(text="") {
        let remote = "";
        remote += "<div style='border:1px solid;height:1px;margin: 10px 5px 5px;padding:0;'>";
        if (text !== "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
        remote += "</div>";
        return remote;
    }

}


/* class to draw a table */
class RemoteElementTable extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.row_ratio = "auto";
    }

    /* add a table start */
    start(width="100%", row_ratio="") {
        this.row_ratio = row_ratio;
        return "<table style=\"border:0;width:"+width+"\">";
    }

    /* add a table row with up to two cells */
    row(td1, td2=undefined) {

        let row_ratio_left = "";
        let row_ratio_right = "";

        if (this.row_ratio.indexOf("px:*") > 0) {
            row_ratio_left = "width:" + this.row_ratio.split(":")[0] + ";";
            row_ratio_right = "width:auto;";
        }
        else if (this.row_ratio.indexOf(":") > 0) {
            row_ratio_left = "width:" + this.row_ratio.split(":")[0] + "%;";
            row_ratio_right = "width:" + this.row_ratio.split(":")[1] + "%;";
        }

        if (td2 === undefined)   { td2 = ""; }
        if (td1 === "start")     { return "<table style=\"border:0;widt:"+td2+"\">"; }
        else if (td1 === "end")  { return "</table>"; }
        else if (td2 === false)  { return "<tr><td style=\"vertical-align:top;\" colspan=\"2\">" + td1 + "</td></tr>"; }
        else                     { return "<tr><td style=\"vertical-align:top;"+row_ratio_left+"\">" + td1 + "</td><td style=\"vertical-align:top;"+row_ratio_right+"\">" + td2 + "</td></tr>"; }
    }

    /* add a table row with a line in it*/
    line() {

        return "<tr><td colspan='2'><hr style='border:1px solid white;'/></td></tr>";
    }

    /* add a table end */
    end() {
        this.row_ratio = "auto";
        return "</table>";
    }

}


/* class to create a box, where content can be added into several sheets and the sheets can be selected by tabs */
class RemoteElementSheetBox extends RemoteDefaultClass {
    constructor(containerId, height = "300px", scroll_bar = false, scroll_view = false, keep_open = true) {
        super("RemoteElementSheetBox");

        this.id = containerId;
        this.created = false;
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.logging.error("Could not create the sheet box, container '"+containerId+"' not found.");
        } else {
            this.created = true;
            this.container.innerHTML = "";
            this.sheets = [];
            this.scroll = scroll_bar;
            this.scroll_into_view = scroll_view;
            this.keep_open = keep_open;

            // Hauptstruktur
            this.box = document.createElement("div");
            this.box.className = "sheet-box";
            this.box.style.minHeight = height;
            this.box.style.display = "flex";
            this.box.style.flexDirection = "column";

            // Tab-Leiste Wrapper
            this.tabWrapper = document.createElement("div");
            this.tabWrapper.className = "tab-bar-wrapper";

            // Scrollbare Tab-Bar
            this.tabBar = document.createElement("div");
            this.tabBar.className = "tab-bar";

            // Pfeile rechts
            this.arrowContainer = document.createElement("div");
            this.arrowContainer.className = "tab-scroll-right";
            this.arrowContainer.style.display = "flex";

            this.btnLeft = document.createElement("button");
            this.btnLeft.className = "tab-scroll-btn";
            this.btnLeft.innerHTML = "&#10094;";
            this.btnLeft.addEventListener("click", () => this.scrollTabs(-150));

            this.btnRight = document.createElement("button");
            this.btnRight.className = "tab-scroll-btn";
            this.btnRight.innerHTML = "&#10095;";
            this.btnRight.addEventListener("click", () => this.scrollTabs(150));

            this.arrowContainer.appendChild(this.btnLeft);
            this.arrowContainer.appendChild(this.btnRight);

            this.tabWrapper.appendChild(this.tabBar);
            this.tabWrapper.appendChild(this.arrowContainer);

            this.contentArea = document.createElement("div");
            this.contentArea.className = "sheet-content";
            this.contentArea.style.position = "relative";

            this.box.appendChild(this.tabWrapper);
            this.box.appendChild(this.contentArea);
            this.container.appendChild(this.box);

            this.fade = document.createElement('div');
            this.fade.className = 'fade-bottom';
            this.contentArea.appendChild(this.fade);

            window.addEventListener("resize", () => this.updateArrowVisibility());
            this.updateArrowVisibility();
        }
    }

    /* add a new sheet as tab to the box */
    addSheet(title, content, load_on_open = true, on_load_command=undefined) {
        if (!this.created) { this.logging.error("addSheet(): Could not add sheet '"+title+"'."); return; }
        const index = this.sheets.length;
        const lazy = load_on_open;

        // Tab erstellen
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.textContent = title;
        tab.addEventListener("click", () => this.setActiveSheet(index));

        // Sheet-Container erstellen
        const sheetDiv = document.createElement("div");
        sheetDiv.className = "sheet-panel";
        sheetDiv.style.display = "none"; // inaktiv = unsichtbar
        sheetDiv.style.position = "absolute";
        sheetDiv.style.top = "0";
        sheetDiv.style.left = "0";
        sheetDiv.style.right = "0";
        sheetDiv.style.bottom = "0";
        sheetDiv.dataset.loaded = "false"; // noch nicht geladen

        // Scrollbar nur für das Sheet selbst
        if (this.scroll) {
            sheetDiv.style.overflowY = "auto";
        }

        if (index === 0 || !lazy) {
            sheetDiv.innerHTML = content;
            sheetDiv.dataset.loaded = "true";
            sheetDiv.dataset.on_load = "false";
        } else {
            // Inhalte bleiben für später gespeichert
            sheetDiv.dataset.content = content;
            sheetDiv.dataset.on_load = "false";
        }

        // Immer im DOM, auch inaktiv
        this.contentArea.appendChild(sheetDiv);

        this.sheets.push({ title, tab, sheetDiv, on_load_command });
        this.tabBar.appendChild(tab);

        // Erstes Sheet aktivieren
        if (this.keep_open)     { this.activateLast(); }
        else if (index === 0)   { this.setActiveSheet(0); }

        this.updateArrowVisibility();
    }

    /* set a sheet active, e.g., when clicking on the tab */
    setActiveSheet(index) {
        this.updateArrowVisibility();

        this.sheets.forEach((sheet, i) => {
            const active = i === index;
            sheet.tab.classList.toggle("active", active);
            sheet.sheetDiv.style.display = active ? "block" : "none";

            // Lazy-Loading: Inhalte beim ersten Aktivieren laden
            if (active && sheet.sheetDiv.dataset.loaded === "false") {
                sheet.sheetDiv.innerHTML = sheet.sheetDiv.dataset.content;
                sheet.sheetDiv.dataset.loaded = "true";
                delete sheet.sheetDiv.dataset.content;
            }
            if (active && sheet.on_load_command && sheet.sheetDiv.dataset.on_load === "false") {
                setTimeout(()=>{
                    eval(sheet.on_load_command);
                    //try { eval(sheet.on_load_command); }
                    //catch (e) { this.logging.error("addSheet(): Could not execute command '"+sheet.on_load_command+"' on load :" + e); }
                },100);
                sheet.sheetDiv.dataset.on_load ="true";
            }


            if (this.keep_open && active) {
                rmSheetBox_open[this.id] = index;
            }

            if (active && this.scroll_into_view) {
                sheet.tab.scrollIntoView({ behavior: "smooth", inline: "center" });
            }
        });
    }

    /* activate the last active sheet */
    activateLast() {
        if (this.keep_open && rmSheetBox_open[this.id]) { this.setActiveSheet(rmSheetBox_open[this.id]); }
        else                                            { this.setActiveSheet(0); }
        }

    /* scroll the tabs if not all visible */
    scrollTabs(offset) {
        this.tabBar.scrollBy({ left: offset, behavior: "smooth" });
        setTimeout(() => this.updateArrowVisibility(), 200);
        }

    /* show or hide the arrows to scroll the tabs */
    updateArrowVisibility() {
        function isVisible(el) {
          if (!el) return false;
          // Not connected to the DOM
          if (!el.ownerDocument || !el.ownerDocument.documentElement.contains(el)) {
            return false;
          }

          // Walk up the DOM tree
          while (el) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              return false;
            }
            el = el.parentElement;
          }
          return true;
        }

        const { scrollWidth, clientWidth } = this.tabBar;
        if (isVisible(this.container)) {
            this.arrowContainer.style.display = scrollWidth > clientWidth ? "flex" : "none";
            }
        else {
            this.arrowContainer.style.display = "flex";
            }
        }

    /* get content from a specific tab */
    getSheetContent(index) {
        // Zugriff auf die Inhalte auch wenn sie gerade unsichtbar sind
        return this.sheets[index]?.sheetDiv || null;
        }
    }


/* class to create a wide box for content, that can be scrolled left and right if it's wider than the box */
class RemoteElementScrollBox extends RemoteDefaultClass {
    constructor(container="scrollBox", html="") {
        super("RemoteElementScrollBox");

        this.update = this.update.bind(this);

        this.id_container   = container;
        this.id_wrapper     = container + "_wrapper";
        this.id_scrollLeft  = container + "_scroll_left";
        this.id_scrollRight = container + "_scroll_right";

        this.boxHTML    = `<div id=`+this.id_wrapper+` class="rm-button_setting_wrapper_top">
            <button class="nav-arrow left" id="`+this.id_scrollLeft+`">❮</button>
            `+html+`
            <button class='nav-arrow right' id="`+this.id_scrollRight+`">❯</button>
	        </div>`;

	    if (document.getElementById(this.id_container)) {

	        this.container = document.getElementById(this.id_container);
	        this.container.innerHTML = this.boxHTML;

	        this.wrapper    = document.getElementById(this.id_wrapper);
	        this.leftArrow  = document.getElementById(this.id_scrollLeft);
	        this.rightArrow = document.getElementById(this.id_scrollRight);

            this.leftArrow.addEventListener('click', () => {
              this.wrapper.scrollBy({ left: -100, behavior: 'smooth' });
            });

            this.rightArrow.addEventListener('click', () => {
              this.wrapper.scrollBy({ left: 100, behavior: 'smooth' });
            });

            this.wrapper.addEventListener('scroll', this.update);
            window.addEventListener('resize', this.update);

            this.update();
	        }
	    else {
	        this.logging.error("Container '" + container + "' not found.");
	        }
        }

    update() {
        if (this.wrapper) {
            const scrollLeft = this.wrapper.scrollLeft;
            const maxScroll  = this.wrapper.scrollWidth - this.wrapper.clientWidth;

            this.leftArrow.style.display  = scrollLeft > 0 ? 'block' : 'none';
            this.rightArrow.style.display = scrollLeft < maxScroll - 1 ? 'block' : 'none';
            }
	    else {
	        this.logging.error("update(): Container '" + this.id_container + "' not found.");
	        }
        }
    }


remote_scripts_loaded += 1;
