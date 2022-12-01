'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.getPathToDesktopIndex = exports.getPathToIndex = exports.getRunnerCrossOriginInjectionContents = exports.getRunnerInjectionContents = exports.getPathToDist = exports.resolveFromPackages = void 0

const tslib_1 = require('tslib')
const path_1 = tslib_1.__importDefault(require('path'))
let fs
const resolveFromPackages = (...args) => {
  return path_1.default.join(...[__dirname, '..', '..', ...args])
}

exports.resolveFromPackages = resolveFromPackages

const getRunnerContents = (filename) => {
  fs !== null && fs !== void 0 ? fs : (fs = require('fs-extra'))

  return fs.readFile((0, exports.getPathToDist)('runner', filename))
}
const getPathToDist = (folder, ...args) => {
  return path_1.default.join(...[__dirname, '..', '..', folder, 'dist', ...args])
}

exports.getPathToDist = getPathToDist

const getRunnerInjectionContents = () => {
  return getRunnerContents('injection.js')
}

exports.getRunnerInjectionContents = getRunnerInjectionContents

const getRunnerCrossOriginInjectionContents = () => {
  return getRunnerContents('injection_cross_origin.js')
}

exports.getRunnerCrossOriginInjectionContents = getRunnerCrossOriginInjectionContents

const getPathToIndex = (pkg) => {
  return (0, exports.getPathToDist)(pkg, 'index.html')
}

exports.getPathToIndex = getPathToIndex

const getPathToDesktopIndex = (graphqlPort) => {
  return `http://localhost:${graphqlPort}/__launchpad/index.html`
}

exports.getPathToDesktopIndex = getPathToDesktopIndex
