const background = require('./background.coffee')

const HOST = 'CHANGE_ME_HOST'
const PATH = 'CHANGE_ME_PATH'
const CONFIG = 'CHANGE_ME_CONFIG'

// immediately connect
background.connect(HOST, PATH, CONFIG)
