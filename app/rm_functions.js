//--------------------------------
// jc://remote/
//--------------------------------

// Warten
//--------------------------------

function pausecomp(ms) {
    ms += new Date().getTime();
    while (new Date() < ms){}
    }

function pausecmd(s) {
    s = s*1000;
    s += new Date().getTime();
    while (new Date() < s){
		}
    }

//--------------------------------
// create menus & landing page & setting page
//--------------------------------

function showRemote(i) {
    var body   = document.getElementById("app_background");
    var w      = window.innerWidth;

    if (i == 1) {
        body.style.backgroundImage    = "url("+rm3background+")";
        body.style.backgroundRepeat   = "no-repeat";
        body.style.backgroundPosition = "bottom center";
        if (w < 400)	{ body.style.backgroundSize     = "100%"; }
        else 		{ body.style.backgroundSize     = "400px"; }
        }
    else {
        body.style.backgroundImage    = "";
        }
    }


//--------------------------------------
// Show / hide menu and set app title
//--------------------------------------


function clickMenu () {
   if (window.innerWidth < 800) {
     if (document.getElementById("menuItems").style.visibility == "hidden")     { document.getElementById("menuItems").style.visibility = "visible"; }
     else                                                                       { document.getElementById("menuItems").style.visibility = "hidden"; }
     }
   else 									{ document.getElementById("menuItems").style.visibility = "visible"; }
   }

//--------------------------------------

function setNavTitle (title) {
        setTextById("navTitle", "<div onClick=\"javascript:rm3settings.hide();rm3cookie.erase('remote');initRemote();\">"+title.replace(/#/g,"\"")+"</div>");
        }

//--------------------------------------

function writeKeyBoard () {
   var test = "<ul>";
   for (var i=8500;i<15000;i++) {
       test = test + "<li>" + i + " &nbsp; [ &#"+i+"; ]</li>";
       }
   test = test + "</ul>";
   return test;
   }

