const { _ } = Cypress

const getFirstSubjectByName = (name) => {
  return cy.queue.find({ name }).get('subject')
}

const getQueueNames = () => {
  return _.map(cy.queue, 'name')
}

const createHooks = (win, hooks = []) => {
  _.each(hooks, (hook) => {

    if (_.isObject(hook)) {
      let { type, fail, fn } = hook

      if (fn) {
        return win[type](new Function(fn.toString()))
      }

      if (fail) {

        return win[type](() => {
          if (_.isNumber(fail) && fail--) {
            return
          }

          throw new Error(`hook failed: ${type}`)

        })
      }

      return win[type](() => {})
    }

    win[hook](() => {})
  })
}

const createTests = (win, tests = []) => {
  _.each(tests, (test) => {
    if (_.isString(test)) {
      test = { name: test }
    }

    let { name, pending, fail, fn, only } = test

    let it = win.it

    if (only) {
      it = it['only']
    }

    if (fn) {
      return it(name, new Function(fn.toString()))
    }

    if (pending) {
      return it(name)
    }

    if (fail) {
      return it(name, () => {
        if (_.isNumber(fail) && fail-- === 0) {
          return
        }

        throw new Error(`test failed: ${name}`)
      })
    }

    return it(name, () => {})

  })
}

const createSuites = (win, suites = {}) => {
  _.each(suites, (obj, suiteName) => {
    win.describe(suiteName, () => {
      createHooks(win, obj.hooks)
      createTests(win, obj.tests)
      createSuites(win, obj.suites)
    })
  })
}

const generateMochaTestsForWin = (win, obj) => {
  createHooks(win, obj.hooks)
  createTests(win, obj.tests)
  createSuites(win, obj.suites)
}

module.exports = {
  getQueueNames,

  getFirstSubjectByName,

  generateMochaTestsForWin,
}
