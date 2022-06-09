const minimist = require('minimist')
const debugLib = require('debug')
const { register } = require('./ts_node')

const debug = debugLib('cypress:server:register-ts-node')

const args = minimist(process.argv)

debug('executing register_ts_node with args %o', args)

const { projectRoot, file } = args

if (projectRoot && file) {
  debug('registering ts-node for projectRoot: %s and file: %s', projectRoot, file)
  register(projectRoot, file)
}
