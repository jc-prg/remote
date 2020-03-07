//-----------------------------------------
/* INDEX:
function check_status_dev_old(device)
function loadRemote2(cmd,callback="")
*/
//-----------------------------------------

function check_status_dev_old(device) {

	loadRemote("list");
	var Status = dataAll["STATUS"]["devices"];

	return Status[device];
	}
	
	
//--------------------------------------------
// reload, reconnect to device
//--------------------------------------------

function loadRemote2(cmd,callback="") {

	rm3app.requestAPI( "GET", [cmd], "", callback );
	}

