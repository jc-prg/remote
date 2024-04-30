//--------------------------------
// jc://remote/
//--------------------------------

function showRemoteInBackground(show=false) {
    var body   = document.getElementById("app_background");
    var width  = window.innerWidth;

    if (show == 1 || show == true) {
        body.style.backgroundImage      = "url("+rm3background+")";
        body.style.backgroundRepeat     = "no-repeat";
        body.style.backgroundPosition   = "bottom center";
        body.style.backgroundAttachment = "fixed";
        if (width < 350)	{ body.style.backgroundSize     = "100%"; }
        else 			{ body.style.backgroundSize     = "350px"; }
        }
    else {
        body.style.backgroundImage    = "";
        }
    }


function setNavTitle (title) {
        setTextById("navTitle", "<div onClick=\"javascript:remoteMainMenu();\" id='header_title'>"+title.replace(/#/g,"\"")+"</div>");
        }

function image(file) {
        return "<img src='icon/"+file+"' style='max-height:18px;max-width:24px;margin:0px;padding:0px;' alt='"+file+"' />";
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

function use_color (value, color="VALUE") {
    if (!function_colors[color]) { return value; }
    return "<font color='" + function_colors[color] + "'>" + value + "</font>";
    }

function scrollTop() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}