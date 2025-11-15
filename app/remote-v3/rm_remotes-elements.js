//--------------------------------
// jc://remote/
//--------------------------------


let rmSheetBox_open = {};


function RemoteBasicElements(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;
	this.input_width    = "100px";
    this.container_open = {};

	this.logging        = new jcLogging(this.app_name);

	// input for text
	this.input	            = function (id,value="")   {

	    return "<div style='width:" + this.input_width + ";margin:0px;'><input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;' value='"+value+"'></div>";
	    }

	// select for different data 
	this.select	            = function (id,title,data,onchange="",selected_value="",sort=false, change_key_value=false) {

	            if (change_key_value) {
	                let new_data = {};
	                for (key in data) {
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
                        }       }
                item     += "</select>";
                return item;
                }

	this.select_array       = function (id,title,data,onchange="",selected_value="") {
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

    // write line with text ...
	this.line	            = function (text="") {
          	let remote = "";
		remote += "<div class='remote-line'><hr/>";
		if (text !== "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
		remote += "</div>";
		return remote;
		}
		
	this.edit_line	        = function (text="") {
          	let remote = "";
		remote += "<div style='border:1px solid;height:1px;margin:5px;margin-top:10px;padding:0px;'>";
		if (text !== "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
		remote += "</div>";
		return remote;
		}
		
	this.container           = function(id,title,text="",open=true) {
	
		if (this.container_open[id] !== undefined)	{ open = this.container_open[id]; }
		else						{ this.container_open[id] = open; }
	
		let onclick  = ' onclick="'+this.app_name+'.container_showHide(\''+id+'\')"; '
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

	this.container_showHide = function( id, open="" ) {
		status = document.getElementById(id+"_status").innerHTML;
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
	}
	

function RemoteElementTable(name) {

	this.app_name       = name;

	this.start	= function (width="100%") {

		return "<table border=\"0\" width=\""+width+"\">";
		}
		
	this.row	= function (td1,td2="")  { 
		if (td1 === "start")     { return "<table border=\"0\" width=\""+td2+"\">"; }
		else if (td1 === "end")  { return "</table>"; }
		else if (td2 === false)  { return "<tr><td valign=\"top\" colspan=\"2\">" + td1 + "</td></tr>"; }
		else                     { return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
		}

	this.line	= function (text="") {

		return "<tr><td colspan='2'><hr style='border:1px solid white;'/></td></tr>";
		}

	this.end	= function () {

		return "</table>";
		}
	}
	

function RemoteElementButtons(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;
	
	this.logging        = new jcLogging(this.app_name);
	this.tooltip        = new jcTooltip(this.app_name + ".tooltip");
	this.keyboard       = new rmRemoteKeyboard(name+".keyboard");	// rm_remotes-keyboard.js
	
	// set default button size
	this.default_size	= function () {	
		this.width	= "";
		this.height	= "";
		this.margin	= "";
		}
	this.default_size();

	// default buttons
	this.default         = function (id, label, style, script_apiCommandSend, disabled="", btnstyle="" ){
	
        let onContext  = "";
        let onClick    = "";

        if (Array.isArray(script_apiCommandSend)) {
                //let test   = "onmousedown_left_right(event,'alert(#left#);','alert(#right#);');"
                onClick    = "onmousedown_left_right(event,\"" + script_apiCommandSend[0].replaceAll("\"","#") +
                             "\",\"" + script_apiCommandSend[1].replaceAll("\"","#") + "\");";
                onClick    = "onmousedown='"+onClick+"'";
                onContext  = "oncontextmenu=\"return false;\"";
                }
        else if (script_apiCommandSend !== "") {
            onClick    = "onclick='" + script_apiCommandSend + "'";
            onClick    = onClick.replaceAll("##", "{{!!}}");
            onClick    = onClick.replaceAll("#", "\"");
            onClick    = onClick.replaceAll("{{!!}}", "#");
            }

        if (!isNaN(label)) { label = "<big>" + label + "</big>"; }
        if (style !== "")   { style = " " + style; }

        let button = "<button id='" + id.toLowerCase() + "' class='rm-button" + style + "' " + btnstyle + " " +
                     onClick + " " + onContext + " " + disabled + " >" + label + "</button>"; // style='float:left;'
        return button;
		}

	// default with size from values
	this.sized           = function (id, label, style, script_apiCommandSend, disabled="") {
		let btnstyle	= "";
	        if (this.width  !== "") { btnstyle += "width:" + this.width + ";max-width:" + this.width + ";"; }
	        if (this.height !== "") { btnstyle += "height:" + this.height + ";max-height:" + this.height + ";"; }
	        if (btnstyle    !== "") { btnstyle  = "style='" + btnstyle + "'"; }
	        
	        return this.default(id, label, style, script_apiCommandSend, disabled, btnstyle);
		}
	        
	// button edit mode		
	this.edit            = function (onclick,label,disabled="",id="") {
		let style = "";
		if (this.width !== "")  { style += "width:" + this.width + ";"; }
		if (this.height !== "") { style += "height:"+this.height+";"; }
		if (this.margin !== "") { style += "margin:"+this.margin+";"; }

        	if (disabled === "disabled") { style += "background-color:gray;"; }
        	return "<button id=\""+id+"\" style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
        	}

	// create button for single command
	this.device          = function (id, label, device, style, cmd, disabled ) {

        if (label.indexOf("||") > 0) { label = label.split("||")[1]; }
        if (cmd.indexOf("||") > 0)   { cmd = cmd.split("||")[0]; }

		let label2 	= this.image( label, style );
		if (label === ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
        else if (label2[0].indexOf("<img") < 0) {
            label2[0] = "<span class='rm-button-text'>" + label2[0] + "</span>";
        }
		if (cmd !== "") {
			cmd = 'apiCommandSend("'+cmd+'","","","'+device+'");';
			}
		return this.default( id, label2[0], label2[1], cmd, disabled );
		}
				
	// create button for single command
	this.device_keyboard = function (id, label, device, style, cmd, disabled ) {

		let label2 	= this.image( label, style );
		if (label === ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
		if (cmd !== "") {
			cmd = this.keyboard.toggle_cmd();
			}
		return this.default( id, label2[0], label2[1], cmd, disabled );
		}
				
	// create button for single command -> if no command assigned yet to record command for button
	this.device_add      = function (id, label, device, style, cmd, disabled ) {

        let device_button	= cmd.split("_");
		let label2		= this.image( label, style );
		if (label === ".")	{ disabled = "disabled"; label2[0] = "&nbsp;"; }
	        
        let button = this.default( id, label2[0], label2[1], 'apiCommandRecord("'+device_button[0]+'","'+device_button[1]+'");', disabled );
		return button;		
		}		

	// create button for multiple commands (macro)
	this.macro           = function (id, label, scene, style, macro, disabled ) {
        if (macro) {
            let d = this.image( label, style );
            let macro_string = "";
            let macro_wait = "";

            for (let i=0; i<macro.length; i++) {

                if (isNaN(macro[i]) && macro[i].indexOf("WAIT") > -1) {
                    let wait = macro[i].split("-");
                    macro_wait = 'appMsg.wait_time("'+lang("MACRO_PLEASE_WAIT")+'", '+wait[1]+');';
                    }
                else {
                    macro_string = macro_string + macro[i] + "::";
                    }
                }
            let b = this.default( id, d[0], d[1], 'apiMacroSend("'+macro_string+'","'+scene+'");'+macro_wait, disabled );
            this.logging.debug("button_macro - "+b);
            return b;
            }
        else { return this.default( id, label, style+" notfound", "", "disabled" ); }
        }
		
	// create button for multiple commands (macro)
	this.btn_group           = function (id, label, scene, style, group, disabled ) {
        if (group) {
            let d = this.image( label, style );
            let b = this.default( id, d[0], d[1], 'apiGroupSend("'+group.join("_")+'","'+scene+'");', disabled );
            this.logging.debug("button_macro - "+b);
            return b;
            }
        else { return this.default( id, label, style+" notfound", "", "disabled" ); }
        }

	// create button for channel (macro)
	this.channel         = function (id, label, scene, macro, style, disabled="") {
    		let macro_string = "";
		for (let i=0; i<macro.length; i++) { macro_string = macro_string + macro[i] + "::"; }

		this.logging.debug(label+" - "+macro_string);
		return "<button id='" + id + "' class='channel-entry " + style + "' " + disabled + " onclick=\"javascript:apiMacroSend('" + macro_string + "','"+scene+"','"+label+"');\">" + label + "</button>";
		}

	// check if image exists for button
	this.image           = function (label,style) {

        // set vars
        let button_color = this.data["CONFIG"]["elements"]["button_colors"];  // definition of button color
        let button_img2  = this.data["CONFIG"]["elements"]["button_images"];  // definition of images for buttons (without path and ".png")

        // if image available set image
        let button_img   = [];
        for (let key in button_img2) { button_img[key] = this.imageHTML(button_img2[key]); }

        // check label
        if (label in button_color) { style = style + " bg" + label + " "; }
        else if (label in button_img && showImg ) { label = button_img[label]; }

        return [label, style];
    }

    this.imageHTML = function (file) {

        return "<img src='icon/"+file+"' class='rm-button-image' alt='"+file+"' />";
    }
}


/*
* class to create a box, where content can be added into several sheets and the sheets can be selected by tabs
*/
class RemoteElementSheetBox {

    constructor(containerId, height = "300px", scroll_bar = false, scroll_view = false, keep_open = true) {
        this.id = containerId;
        this.created = false;
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error("RemoteElementSheetBox: Could not create the sheet box, container '"+containerId+"' not found.");
        } else {
            this.created = true;
            this.container.innerHTML = "";
            this.sheets = [];
            this.activeIndex = 0;
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

    addSheet(title, content) {
        if (!this.created) { console.error("RemoteElementSheetBox: Could not add sheet '"+title+"'."); return; }
        const index = this.sheets.length;

        // Tab erstellen
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.textContent = title;
        tab.addEventListener("click", () => this.setActiveSheet(index));

        // Sheet-Container erstellen
        const sheetDiv = document.createElement("div");
        sheetDiv.className = "sheet-panel";
        sheetDiv.innerHTML = content;
        sheetDiv.style.display = "none"; // inaktiv = unsichtbar
        sheetDiv.style.position = "absolute";
        sheetDiv.style.top = "0";
        sheetDiv.style.left = "0";
        sheetDiv.style.right = "0";
        sheetDiv.style.bottom = "0";

        // Scrollbar nur für das Sheet selbst
        if (this.scroll) {
            sheetDiv.style.overflowY = "auto";
            }

        // Immer im DOM, auch inaktiv
        this.contentArea.appendChild(sheetDiv);

        this.sheets.push({ title, tab, sheetDiv });
        this.tabBar.appendChild(tab);

        // Erstes Sheet aktivieren
        if (this.keep_open)     { this.activateLast(); }
        else if (index === 0)   { this.setActiveSheet(0); }

        this.updateArrowVisibility();
        }

    setActiveSheet(index) {
        this.activeIndex = index;
        this.updateArrowVisibility();

        this.sheets.forEach((sheet, i) => {
            const active = i === index;
            sheet.tab.classList.toggle("active", active);
            sheet.sheetDiv.style.display = active ? "block" : "none"; // inaktiv = display:none

            if (this.keep_open && active) {
                rmSheetBox_open[this.id] = index;
                }

            if (active && this.scroll_into_view) {
                sheet.tab.scrollIntoView({ behavior: "smooth", inline: "center" });
                }
            });
        }

    activateLast() {
        if (this.keep_open && rmSheetBox_open[this.id]) { this.setActiveSheet(rmSheetBox_open[this.id]); }
        else                                            { this.setActiveSheet(0); }
        }

    scrollTabs(offset) {
        this.tabBar.scrollBy({ left: offset, behavior: "smooth" });
        setTimeout(() => this.updateArrowVisibility(), 200);
        }

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

    getSheetContent(index) {
        // Zugriff auf die Inhalte auch wenn sie gerade unsichtbar sind
        return this.sheets[index]?.sheetDiv || null;
        }
    }


/*
* class to create a wide box for content, that can be scrolled left and right if it's wider than the box
*/
class RemoteElementScrollBox {

    constructor(container="scrollBox", html="") {

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
	        console.error("RemoteElementScrollBox: Container '" + container + "' not found.");
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
	        console.error("RemoteElementScrollBox.update: Container '" + this.id_container + "' not found.");
	        }
        }
    }
