require('@percy/cypress')
const _ = require('lodash')

class ElementOverrideManager {
  mutationStack = undefined

  /**
   * overrides are defined in selector/override pairs.
   *
   * {
   *   // boolean values indicate elements should be 'visibility: hidden'
   *   '.element-to-make-invisible': true,
   *
   *   // function values are called with the found elements for more complex overrides
   *   '.element-to-change-color': ($el) => {
   *     $el.css('color', 'blue')
   *   }
   * }
   */
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
    })

    // Clear out our mutation record references so we're not holding onto
    // this memory.
    this.mutationStack = undefined
  }
}

/**
 * Performs viewport and DOM mutations for a snapshot and returns a function
 * that will revert those mutations.
 */
const applySnapshotMutations = ({
  log,
  snapshotWidth,
  snapshotHeight,
  snapshotElementOverrides,
  defaultWidth,
  defaultHeight,
}) => {
  let elementOverrideManager

  if (Object.keys(snapshotElementOverrides).length) {
    elementOverrideManager = new ElementOverrideManager()
  }

  return cy.viewport(snapshotWidth, snapshotHeight, { log: false })
  .then(() => {
    if (elementOverrideManager) {
      elementOverrideManager.performOverrides(cy, snapshotElementOverrides)
    }

    if (log) {
      Cypress.log({
        message: log,
        snapshot: true,
        end: true,
      })
    }

    return () => {
      cy.viewport(defaultWidth, defaultHeight, { log: false })
      .then(() => {
        if (elementOverrideManager) {
          elementOverrideManager.resetOverrides()
        }
      })
    }
  })
}

export const installCustomPercyCommand = ({ before, elementOverrides } = {}) => {
  /**
   * A custom Percy command that allows for additional mutations prior to snapshot generation. Mutations will be
   * reset after snapshot generation so that the AUT is not polluted after the command executes.
   *
   * @param {string} name The name of the snapshot to generate. Will be generated from test's titlePath by default.
   * @param {Object} options Object containing options for the snapshot command, including:
   * @param {number} options.width The desired snapshot width. The test's viewportWidth will be used by default.
   * @param {number} options.height The desired snapshot height. The test's viewportHeight will be used by default.
   * @param {Object} options.elementOverrides The desired snapshot overrides. These will be merged with and take
   *   precedence over the global override defined when the command was installed.
   */
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

    // viewport data is read from test state rather than config to ensure that
    // the snapshot is presented at the test's expected size.
    const { viewportWidth, viewportHeight } = cy.state()
    const snapshotWidth = !_.isNil(options.width) ? options.width : viewportWidth
    const snapshotHeight = !_.isNil(options.height) ? options.height : viewportHeight

    const snapshotMutationOptions = {
      defaultWidth: viewportWidth,
      defaultHeight: viewportHeight,
      snapshotWidth,
      snapshotHeight,
      snapshotElementOverrides: {
        ...elementOverrides,
        ...options.elementOverrides,
      },
    }

    // If we're in interactive mode via 'cypress open', apply overrides,
    // create log, reset overrides, and abort. The log will hold a snapshot
    // that is representative of the snapshot that would be taken by Percy and can be
    // used for validation during development.
    if (Cypress.config().isInteractive) {
      return applySnapshotMutations({
        ...snapshotMutationOptions,
        log: 'percy: skipping snapshot in interactive mode',
      }).then((reset) => reset())
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
    return applySnapshotMutations(snapshotMutationOptions)
    .then((reset) => {
      // Wrap in cy.then here to ensure that the original command is
      // enqueued appropriately.
      cy.then(() => {
        return origFn(screenshotName, {
          widths: [snapshotWidth],
        })
      }).then(() => {
        return reset()
      })
      .then(() => {
        Cypress.config('defaultCommandTimeout', _backupTimeout)
      })
    })
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}
