const debug = require('debug')('spec')

const evalFn = (win, fn) => {
  return function () {
    return win.eval(`(${fn.toString()})`).call(this)
  }
}

const createHooks = (win, hooks = []) => {
  hooks.forEach((hook) => {
    if (typeof hook === 'string') {
      hook = { type: hook }
    }

    let { type, fail, fn, agents } = hook

    if (fn) {
      if (hook.eval) {
        const fnStr = fn.toString()

        const newFn = function () {
          return win.eval(`(${fnStr})`).call(this)
        }

        Object.defineProperty(newFn, 'length', { value: fn.length })
        fn = newFn
      }

      return win[type](fn)
    }

    if (fail) {
      const numFailures = fail

      return win[type](function () {
        const message = `${type} - ${this._runnable.parent.title || 'root'}`

        if (agents) {
          registerAgents(win)
        }

        if (typeof fail === 'number' && fail-- <= 0) {
          debug(`hook pass after (${numFailures}) failures: ${type}`)
          win.assert(true, message)

          return
        }

        if (agents) {
          failCypressCommand(win, type)
        } else {
          debug(`hook fail: ${type}`)

          win.assert(false, message)

          throw new Error(`hook failed: ${type}`)
        }
      })
    }

    return win[type](function () {
      win.assert(true, `${type} - ${this._runnable.parent.title || 'root'}`)
      debug(`hook pass: ${type}`)
    })
  })
}

const createTests = (win, tests = []) => {
  tests.forEach((test) => {
    if (typeof test === 'string') {
      test = { name: test }
    }

    let { name, pending, fail, fn, only, agents } = test

    let it = win.it

    if (only) {
      it = it['only']
    }

    if (fn) {
      if (test.eval) {
        const fnStr = fn.toString()

        const newFn = function () {
          return win.eval(`(${fnStr})`).call(this)
        }

        Object.defineProperty(newFn, 'length', { value: fn.length })
        fn = newFn
      }

      return it(name, fn)
    }

    if (pending) {
      return it(name)
    }

    if (fail) {
      return it(name, () => {
        if (agents) {
          registerAgents(win)
        }

        if (typeof fail === 'number' && fail-- === 0) {
          debug(`test pass after retry: ${name}`)
          win.assert(true, name)

          return
        }

        if (agents) {
          failCypressCommand(win, name)
        } else {
          debug(`test fail: ${name}`)
          win.assert(false, name)

          throw new Error(`test fail: ${name}`)
        }
      })
    }

    return it(name, () => {
      debug(`test pass: ${name}`)
      win.assert(true, name)
    })
  })
}

const failCypressCommand = (win, name) => win.cy.wrap(name).then(() => win.assert(false, name))
const registerAgents = (win) => {
  const obj = { foo: 'bar' }

  win.cy.stub(obj, 'foo')
  win.cy.wrap(obj).should('exist')
  win.cy.intercept('https://example.com')
}

export const createSuites = (win, suites = {}) => {
  Object.entries(suites).forEach(([suiteName, obj]) => {
    let fn = () => {
      createHooks(win, obj.hooks)
      createTests(win, obj.tests)
      createSuites(win, obj.suites)
    }

    if (typeof obj === 'function') {
      fn = evalFn(win, obj)
    }

    win.describe(suiteName, obj.options || {}, fn)
  })
}

export const generateMochaTestsForWin = (win, obj) => {
  if (typeof obj === 'function') {
    win.eval(`(${obj.toString()})()`)

    return
  }

  createHooks(win, obj.hooks)
  createTests(win, obj.tests)
  createSuites(win, obj.suites)
}
