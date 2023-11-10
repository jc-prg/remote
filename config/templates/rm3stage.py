test           = False
rollout        = '${REMOTE_CURRENT_STAGE}'
server_port    = ${REMOTE_SERVER_PORT}
client_port    = ${REMOTE_CLIENT_PORT}
data_dir       = '${REMOTE_DIR_DATA}'
icons_dir      = '${REMOTE_DIR_ICONS}'
scene_img_dir  = '${REMOTE_DIR_SCENES}'

log_level     = '${REMOTE_LOG_LEVEL}'					# set log level: INFO, DEBUG, WARNING, ERROR
log_apidata   = '${REMOTE_LOG_APIDATA}'				# shall data from API request be logged: YES, NO
log_to_file   = '${REMOTE_LOG_TO_FILE}'				# shall logging done into a logfile: YES, NO
log_filename  = '${REMOTE_LOG_FILENAME}'				# path to logfile (if YES)
log_webserver = '${REMOTE_LOG_WEBSERVER}'				# shall webserver logging be done with default level: YES, NO
log_apiext    = '${REMOTE_LOG_APIEXTERNAL}'				# shall external API data be logged: YES, NO

if rollout == "test":
  test = True
