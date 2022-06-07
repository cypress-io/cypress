const minimist = require('minimist')
const debugLib = require('debug')
const dedent = require('dedent')
const { register } = require('./ts_node')

const debug = debugLib('cypress:server:register-ts-node')

const args = minimist(process.argv)

debug('executing register_ts_node with args %o', args)

const { projectRoot, file } = args

if (!projectRoot || !file) {
  throw Error(dedent`
    Need to provide --projectRoot and --file args when using
    register_ts_node, for example: 
    node --require register_ts_node --projectRoot=/path/to/project --file=/path/to/project/cypress.config.ts.
    You passed projectRoot: ${projectRoot} and file ${file}.
  `)
}

register(projectRoot, file)
