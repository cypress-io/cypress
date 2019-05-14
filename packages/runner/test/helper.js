import mockRequire from 'mock-require'
import { JSDOM } from 'jsdom'
const jsdom = new JSDOM('<!doctype html><html><body></body></html>')
const { window } = jsdom

const chai = require('chai')
const sinonChai = require('sinon-chai')

global.window = window
global.document = window.document
window.Selection = { prototype: { isCollapsed: {} } }
global.navigator = {
  userAgent: 'node.js',
}
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0)
}
global.cancelAnimationFrame = function (id) {
  clearTimeout(id)
}
Object.keys(window.document.defaultView).forEach((property) => {
  if (
    property === 'localStorage' ||
    property === 'sessionStorage' ||
    typeof global[property] !== 'undefined'
  ) return

  global[property] = window.document.defaultView[property]
})

// enzyme, and therefore chai-enzyme, needs to be required after
// global.navigator is set up (https://github.com/airbnb/enzyme/issues/395)
const enzyme = require('enzyme')
const EnzymeAdapter = require('enzyme-adapter-react-16')
const chaiEnzyme = require('chai-enzyme')

enzyme.configure({ adapter: new EnzymeAdapter() })

chai.use(chaiEnzyme())
chai.use(sinonChai)
global.expect = chai.expect

const returnMockRequire = (name, modExport = {}) => {
  mockRequire(name, modExport)

  return require(name)
}

const bresolve = require('browser-resolve')
const Module = require('module')

const overrideRequire = () => {

  const _load = Module._load

  Module._load = function (...args) {
    let browserPkg = args

    if (!['path'].includes(args[0])) {
      try {
        browserPkg = [bresolve.sync.apply(this, args)]
      } catch (e) {
        null
      }
    }

    return _load.apply(this, browserPkg)
  }

}

overrideRequire()

const sinon = require('sinon')

const driver = returnMockRequire('@packages/driver')
const io = returnMockRequire('@packages/socket/lib/client', {})

io.connect = sinon.stub().returns({ emit: () => {}, on: () => {} })

const _useFakeTimers = sinon.useFakeTimers
let timers = []

sinon.useFakeTimers = function (...args) {

  const ret = _useFakeTimers.apply(this, args)

  timers.push(ret)
}

beforeEach(() => {
  driver.$ = sinon.stub().throws('$ called without being stubbed')
})

afterEach(() => {
  timers.forEach((clock) => {
    return clock.restore()
  })
  timers = []
})
