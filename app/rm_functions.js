//--------------------------------
// jc://remote/
//--------------------------------
/* INDEX:
function sortDict(dict,sort_key)
function showRemoteInBackground(show=false)
function clickMenu ()
function setNavTitle (title)
function image(file)
function writeKeyBoard ()
*/
//--------------------------------

//--------------------------------
// sort dictionary
//--------------------------------

function sortDict(dict,sort_key) {

	var sorted = {};
	for (key in dict) {
		sorted[dict[key][sort_key]+"_"] = key;
		}
		
	var order  = [];
	var i = 1;
	for (key in sorted) {
		if (sorted[i+"_"]) { order.push( sorted[i+"_"] ); }
		i++;
		}
		
	if (order.length == 0) {
		for (key in dict) {
			order.push( key );
			}	
		}
		
	return order;
	}

//--------------------------------
// create menus & landing page & setting page
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
        setTextById("navTitle", "<div onClick=\"javascript:rm3settings.hide();rm3cookie.erase('remote');remoteInit();\">"+title.replace(/#/g,"\"")+"</div>");
        }

// ------------------------------------------

function image(file) {
        return "<img src='icon/"+file+"' style='max-height:18px;max-width:24px;margin:0px;padding:0px;' alt='"+file+"' />";
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

