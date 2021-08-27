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
let __exportStar = (this && this.__exportStar) || function (m, exports) {
  for (let p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p)
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.launch = exports.detectByPath = exports.detect = void 0

const detect_1 = require('./lib/detect')

Object.defineProperty(exports, 'detect', { enumerable: true, get () {
  return detect_1.detect
} })

Object.defineProperty(exports, 'detectByPath', { enumerable: true, get () {
  return detect_1.detectByPath
} })

const browsers_1 = require('./lib/browsers')

Object.defineProperty(exports, 'launch', { enumerable: true, get () {
  return browsers_1.launch
} })

__exportStar(require('./lib/types'), exports)
