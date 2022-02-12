require('@percy/cypress')
const _ = require('lodash')

class MutationManager {
  mutationStack = []

  constructor () {
    this.observer = new MutationObserver((mutationsList) => {
      this.mutationStack.push(...mutationsList)
    })
  }

  performOverrides (cy, overrides) {
    this.observer.observe(cy.$$('html')[0], { childList: true, subtree: true, attributes: true, attributeOldValue: true })

    _.each(overrides, (v, k) => {
      // eslint-disable-next-line cypress/no-assigning-return-values
      const $el = cy.$$(k)

      if (_.isFunction(v)) {
        v($el)

        return
      }

      if (v === 'displayNone') {
        $el.attr('style', 'display: none !important')

        return
      }

      $el.css({ visibility: 'hidden' })
    })

    this.mutationStack.push(...(this.observer.takeRecords() || []))

    this.observer.disconnect()
  }

  reset () {
    while (this.mutationStack.length) {
      const { type, target, attributeName, oldValue } = this.mutationStack.pop()

      // TODO: handle more types (child updates)
      if (type === 'attributes') {
        target.setAttribute(attributeName, oldValue)
      }
    }
  }
}

export const installCustomPercyCommand = ({ before, elementOverrides } = {}) => {
  const customPercySnapshot = (origFn, name, options = {}) => {
    if (_.isObject(name)) {
      options = name
      name = null
    }

    /**
     * @type {Mocha.Test}
     */
    const test = cy.state('test')

    const titlePath = test.titlePath()

    const screenshotName = titlePath.concat(name).filter(Boolean).join(' > ')

    const { viewportWidth, viewportHeight } = cy.state()

    const hasCustomWidth = !_.isNil(options.width)
    const snapshotWidth = hasCustomWidth ? options.width : viewportWidth

    const customOptions = {
      width: options.width || viewportWidth,
      elementOverrides: {
        ...elementOverrides,
        ...options.elementOverrides,
      },
    }

    const performMutations = ({ afterMutation, log }) => {
      let mutationManager
      let cyLog

      if (log) {
        cyLog = Cypress.log({
          message: log,
          snapshot: false,
        })
      }

      cy.viewport(snapshotWidth, viewportHeight, { log: false })
      .then(() => {
        if (Object.keys(customOptions.elementOverrides).length) {
          mutationManager = new MutationManager()
          mutationManager.performOverrides(cy, customOptions.elementOverrides)
        }
      })
      .then(() => {
        if (cyLog) {
          // Take first snapshot after viewport and mutations have been applied
          cyLog.snapshot('before', { next: 'after' })
        }

        if (afterMutation) {
          afterMutation()
        }
      })

      cy.viewport(viewportWidth, viewportHeight, { log: false })
      .then(() => {
        // If an mutationManager was created, we have to reset tracked mutations
        if (mutationManager) {
          mutationManager.reset()
        }
      })
      .then(() => {
        if (cyLog) {
          // FIXME: the snapshots do not maintain two separate viewport widths. even
          // though the first snapshot was taken at the provided width, viewing the
          // log before/after will show both snapshots at this final reapplied width.
          cyLog.snapshot().end()
        }
      })

      return
    }

    // if we're in interactive mode via 'cypress open', apply overrides, create log,
    // and then abort
    if (Cypress.config().isInteractive) {
      performMutations({ log: 'percy: skipping snapshot in interactive mode' })

      return
    }

    if (_.isFunction(before)) {
      before()
    }

    // Percy v3.1.0 will timeout waiting for response from server if screenshot
    // takes longer than defaultCommandTimeout, so we hack around it
    // eslint-disable-next-line
    const _backupTimeout = Cypress.config('defaultCommandTimeout')

    Cypress.config('defaultCommandTimeout', 10000)

    // Call original function after preparing AUT for presentation
    performMutations({
      afterMutation: () => {
        origFn(screenshotName, {
          widths: [snapshotWidth],
        })
      },
    })

    cy.then(() => {
      Cypress.config('defaultCommandTimeout', _backupTimeout)
    })

    return
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}
