const background = require('./background.coffee')

const HOST = 'CHANGE_ME_HOST'
const PATH = 'CHANGE_ME_PATH'
const SCREENCAST_FRAME = 'CHANGE_ME_SCREENCAST_FRAME'

// immediately connect
background.connect(HOST, PATH, SCREENCAST_FRAME)
