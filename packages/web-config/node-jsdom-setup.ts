import mockRequire from 'mock-require'
import { JSDOM } from 'jsdom'
import * as ansiEscapes from 'ansi-escapes'

declare global {
  module NodeJS {
    interface Global {
      [key: string]: any
    }
  }
}

export const register = ({
  enzyme,
  EnzymeAdapter,
  chaiEnzyme,
  requireOverride,
}) => {
  const jsdom = new JSDOM('<!doctype html><html><body></body></html>')
  const { window } = jsdom

  const chai = require('chai')
  const sinonChai = require('sinon-chai')
  // const chaiEnzyme = require('chai-enzyme')

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

  enzyme.configure({ adapter: new EnzymeAdapter() })

  chai.use(chaiEnzyme())
  chai.use(sinonChai)
  global.expect = chai.expect

  const bresolve = require('browser-resolve')
  const Module = require('module')

  const overrideRequire = () => {
    const _load = Module._load

    Module._load = function (...args) {
      let browserPkg = args

      if (requireOverride) {
        const mockedDependency = requireOverride(...args)

        if (mockedDependency != null) {
          return mockedDependency
        }
      }

      // Follow browser-field spec for importing modules
      // except chalk so we dont mess up mocha coloring
      if (!['path'].includes(args[0]) && !(args[1] && args[1].id.includes('chalk'))) {
        try {
          browserPkg = [bresolve.sync.apply(this, args)]
        } catch (e) {
          null
        }
      }

      // Stub out all webpack-specific imports
      if (args[0].includes('!')) {
        return {}
      }

      if (args[0].endsWith('.png')) {
        return args[0]
      }

      const ret = _load.apply(this, browserPkg)

      return ret
    }
  }

  overrideRequire()
}

// eslint-disable-next-line
after(() => {
  process.stdout.write(ansiEscapes.cursorShow)
})

export const returnMockRequire = (name, modExport = {}) => {
  mockRequire(name, modExport)

  return require(name)
}
