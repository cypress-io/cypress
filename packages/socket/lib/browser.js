'use strict'
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.client = void 0

const socket_io_client_1 = __importDefault(require('socket.io-client'))

exports.client = socket_io_client_1.default
