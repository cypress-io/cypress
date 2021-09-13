'use strict'
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.getPathToDesktopIndex = exports.getPathToIndex = exports.getRunnerInjectionContents = exports.getPathToDist = void 0

const path_1 = __importDefault(require('path'))
let fs
const getPathToDist = (folder, ...args) => {
  return path_1.default.join(...[__dirname, '..', '..', folder, 'dist', ...args])
}

exports.getPathToDist = getPathToDist

const getRunnerInjectionContents = () => {
  fs !== null && fs !== void 0 ? fs : (fs = require('fs-extra'))

  return fs.readFile(exports.getPathToDist('runner', 'injection.js'))
}

exports.getRunnerInjectionContents = getRunnerInjectionContents

const getPathToIndex = (pkg) => {
  return exports.getPathToDist(pkg, 'index.html')
}

exports.getPathToIndex = getPathToIndex

const getPathToDesktopIndex = (pkg) => {
  // TODO: check if there's a better approach to fix here
  if (pkg === 'launchpad' && !process.env.CI) {
    return `http://localhost:3001`
  }

  return `file://${path_1.default.join(__dirname, '..', '..', pkg, 'dist', 'index.html')}`
}

exports.getPathToDesktopIndex = getPathToDesktopIndex
