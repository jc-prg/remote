test        = False
rollout     = '${REMOTE_CURRENT_STAGE}'
server_port = ${REMOTE_SERVER_PORT}
data_dir    = '${REMOTE_DIR_DATA}'
icons_dir   = '${REMOTE_DIR_ICONS}'

if rollout == "test":
  test = True
