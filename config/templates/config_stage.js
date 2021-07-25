//--------------------------------
// Configure stage details
//---------------------------------
// Please edit not here, but the orginial configuration file. This files is created using a template.

var test		= false;
var log_level           = 'info';
var server_port         = "${REMOTE_SERVER_PORT}";
var rollout             = "${REMOTE_CURRENT_STAGE}";

LANG                    = 'EN';

if (rollout === "test")	{ test = true; }

