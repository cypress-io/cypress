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
      const { type, fail } = hook

      if (fail) {
        return win[type](() => {
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
    if (_.isObject(test)) {
      const { name, pending, fail } = test

      if (pending) {
        return win.it(name)
      }

      if (fail) {
        return win.it(name, () => {
          throw new Error(`test failed: ${name}`)
        })
      }

      return win.it(name, () => {})
    }

    win.it(test, () => {})
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
