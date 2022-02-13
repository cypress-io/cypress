require('@percy/cypress')
const _ = require('lodash')

class ElementOverrideManager {
  mutationStack = undefined

  performOverrides (cy, overrides) {
    const observer = new MutationObserver((mutations) => {
      this.mutationStack ??= []
      this.mutationStack.push(...mutations)
    })

    observer.observe(cy.$$('html')[0], { childList: true, subtree: true, attributes: true, attributeOldValue: true })

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

    // Use takeRecords to flush all pending mutations that have not yet
    // been processed by the observer's handler prior to disconnecting.
    this.mutationStack = [...(observer.takeRecords() || [])]

    observer.disconnect()
  }

  resetOverrides () {
    _.forEachRight(this.mutationStack, ({
      type,
      target,
      attributeName,
      oldValue,
      addedNodes,
      removedNodes,
    }) => {
      if (type === 'attributes') {
        target.setAttribute(attributeName, oldValue)

        return
      }

      if (type === 'childList') {
        if (addedNodes.length) {
          addedNodes.forEach((addedNode) => {
            target.removeChild(addedNode)
          })
        }

        if (removedNodes.length) {
          removedNodes.forEach((removedNode) => {
            target.insertBefore(removedNode, removedNode.previousSibling)
          })
        }

        return
      }

      // TODO: support more mutations
    })

    this.mutationStack = undefined
  }
}

const applySnapshotMutations = ({
  log,
  snapshotWidth,
  snapshotElementOverrides,
  defaultWidth,
  defaultHeight,
}) => {
  let cyLog
  let elementOverrideManager

  if (log) {
    cyLog = Cypress.log({
      message: log,
      snapshot: false,
    })
  }

  if (Object.keys(snapshotElementOverrides).length) {
    elementOverrideManager = new ElementOverrideManager()
  }

  return cy.viewport(snapshotWidth, defaultHeight, { log: false })
  .then(() => {
    if (elementOverrideManager) {
      elementOverrideManager.performOverrides(cy, snapshotElementOverrides)
    }

    if (cyLog) {
      // Take first snapshot after viewport and mutations have been applied
      cyLog.snapshot('percy', { next: 'after percy' })
    }

    return () => {
      cy.viewport(defaultWidth, defaultHeight, { log: false })
      .then(() => {
        if (elementOverrideManager) {
          elementOverrideManager.resetOverrides()
        }

        if (cyLog) {
          // FIXME: the logged snapshots do not maintain two separate viewport widths. even
          // though the first snapshot was taken with the snapshotWidth, viewing the
          // log before/after will show both snapshots with the defaultWidth applied.
          cyLog.snapshot().end()
        }
      })
    }
  })
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
    const snapshotWidth = !_.isNil(options.width) ? options.width : viewportWidth

    const snapshotMutationOptions = {
      defaultWidth: viewportWidth,
      defaultHeight: viewportHeight,
      snapshotWidth,
      snapshotElementOverrides: {
        ...elementOverrides,
        ...options.elementOverrides,
      },
    }

    // If we're in interactive mode via 'cypress open', apply overrides,
    // create log, reset overrides, and abort.
    if (Cypress.config().isInteractive) {
      applySnapshotMutations({
        ...snapshotMutationOptions,
        log: 'percy: skipping snapshot in interactive mode',
      }).then((reset) => reset())

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

    // If we're not in interactive mode, apply mutations, call original
    // percy snapshot function, and then reset overrides
    applySnapshotMutations(snapshotMutationOptions)
    .then((reset) => {
      origFn(screenshotName, {
        widths: [snapshotWidth],
      })

      return reset()
    }).then(() => {
      Cypress.config('defaultCommandTimeout', _backupTimeout)
    })

    return
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}
