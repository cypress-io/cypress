'use strict'
let __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k

  Object.defineProperty(o, k2, { enumerable: true, get () {
    return m[k]
  } })
}) : (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k

  o[k2] = m[k]
}))
let __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
  Object.defineProperty(o, 'default', { enumerable: true, value: v })
}) : function (o, v) {
  o['default'] = v
})
let __importStar = (this && this.__importStar) || function (mod) {
  if (mod && mod.__esModule) return mod

  let result = {}

  if (mod != null) for (let k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)

  __setModuleDefault(result, mod)

  return result
}
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.getClientSource = exports.getClientVersion = exports.getPathToClientSource = exports.SocketIOServer = exports.server = exports.client = void 0

const fs_1 = __importDefault(require('fs'))
const socket_io_1 = __importStar(require('socket.io'))

exports.server = socket_io_1.default

const browser_1 = require('./browser')

Object.defineProperty(exports, 'client', { enumerable: true, get () {
  return browser_1.client
} })

const HUNDRED_MEGABYTES = 1e8 // 100000000
const { version } = require('socket.io-client/package.json')
const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

class SocketIOServer extends socket_io_1.Server {
  constructor (srv, opts) {
    let _a

    // in socket.io v3, they reduced down the max buffer size
    // from 100mb to 1mb, so we reset it back to the previous value
    //
    // previous commit for reference:
    // https://github.com/socketio/engine.io/blame/61b949259ed966ef6fc8bfd61f14d1a2ef06d319/lib/server.js#L29
    opts = opts !== null && opts !== void 0 ? opts : {}
    opts.maxHttpBufferSize = (_a = opts.maxHttpBufferSize) !== null && _a !== void 0 ? _a : HUNDRED_MEGABYTES
    super(srv, opts)
  }
}
exports.SocketIOServer = SocketIOServer

const getPathToClientSource = () => {
  return clientSource
}

exports.getPathToClientSource = getPathToClientSource

const getClientVersion = () => {
  return version
}

exports.getClientVersion = getClientVersion

const getClientSource = () => {
  return fs_1.default.readFileSync(exports.getPathToClientSource(), 'utf8')
}

exports.getClientSource = getClientSource
