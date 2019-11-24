//--------------------------------
// jc://remote/
//--------------------------------

var stage_port  = "${REMOTE_SERVER_PORT}";
var rm3_rollout = "${REMOTE_CURRENT_STAGE}";
var rm3_test    = false;

if (rm3_rollout == "test") {
	rm3_test = true;
	}

