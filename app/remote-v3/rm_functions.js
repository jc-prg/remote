//--------------------------------
// jc://remote/
//--------------------------------

function showRemoteInBackground(show=false) {
    const body = document.getElementById("app_background");
    const width = window.innerWidth;

    if (show === 1 || show === true) {
        body.style.backgroundImage      = "url("+rm3background+")";
        body.style.backgroundRepeat     = "no-repeat";
        body.style.backgroundPosition   = "bottom center";
        body.style.backgroundAttachment = "fixed";
        if (width < 350)	{ body.style.backgroundSize     = "100%"; }
        else 			    { body.style.backgroundSize     = "350px"; }
        }
    else {
        body.style.backgroundImage    = "";
        }
    }

function setNavTitle (title) {

        setTextById("navTitle", "<div onClick=\"remoteMainMenu();\" id='header_title'>"+title.replace(/#/g,"\"")+"</div>");
        }

function rm_image(file, big=false) {
    let style;
    if (big)    { style = "max-height:54px;max-width:72px;"; }
    else        { style = "max-height:18px;max-width:24px;"; }
    return "<img src='icon/"+file+"' style='" + style + "margin:auto;padding:0;' alt='"+file+"' />";
}

function writeKeyBoard () {
   var test = "<ul>";
   for (var i=8500;i<15000;i++) {
       test = test + "<li>" + i + " &nbsp; [ &#"+i+"; ]</li>";
       }
   test = test + "</ul>";
   return test;
   }

function dictCopy(dict) {

    return JSON.parse(JSON.stringify(dict));
    }

function use_color (value, color="VALUE", light=false) {
    let color_var;
    if (light) {
        color_var = "--rm-color-signal-value-light-" + color.toLowerCase();
    } else {
        color_var = "--rm-color-signal-value-" + color.toLowerCase();
    }
    return "<span style='color:var("+color_var+");'>" + value + "</span>";
}

function scrollTop() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}


//--------------------------------

class RemoteLogging extends jcLogging {
    constructor(name) {
        super(name);
    }
}

class RemoteDefaultClass {
    constructor(name) {
        this.name = name;
        this.logging = new RemoteLogging(name);
        this.logging.error("Initializing " + name + " ...");
    }
}
