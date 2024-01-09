/// <reference types="cypress" />

import '@percy/cypress'
import type { SnapshotOptions } from '@percy/core'

export interface CustomSnapshotOptions extends SnapshotOptions{
  /**
   * width of the snapshot taken from the left edge of the viewport
   * @default - The test's viewportWidth
   */
  width?: number
  /**
   * height of the snapshot taken from the top edge of the viewport
   * @default - The test's viewportHeight
   */
  height?: number
  /**
   * The desired snapshot overrides. These will be merged with and take
   * precedence over the global override defined when the command was installed.
   * @example
   * ```ts
   * {
   *  '.element-to-hide': true,
   *  '#element-to-replace-content': ($el) => { $el.text('new content') },
   * }
   * ```
   */
  elementOverrides?: Record<string, ((el$: JQuery) => void) | true>
}

interface SnapshotMutationOptions{
  log?: string
  defaultWidth: number
  defaultHeight: number
  snapshotWidth: number
  snapshotHeight: number
  snapshotElementOverrides: NonNullable<CustomSnapshotOptions['elementOverrides']>
}

declare global {
  namespace Cypress {
    interface Chainable{
      /**
       * A custom Percy command that allows for additional mutations prior to snapshot generation. Mutations will be
       * reset after snapshot generation so that the AUT is not polluted after the command executes.
       */
      percySnapshot(options?: CustomSnapshotOptions): Chainable<() => void>
      /**
       * A custom Percy command that allows for additional mutations prior to snapshot generation. Mutations will be
       * reset after snapshot generation so that the AUT is not polluted after the command executes.
       */
      percySnapshot(name?: string, options?: CustomSnapshotOptions): Chainable<() => void>
    }
  }
}

class ElementOverrideManager {
  private mutationStack: Array<MutationRecord> | undefined = undefined

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
  performOverrides (cy: Cypress.cy, overrides: NonNullable<CustomSnapshotOptions['elementOverrides']>) {
    const observer = new MutationObserver((mutations) => {
      this.mutationStack = this.mutationStack || []
      this.mutationStack.push(...mutations)
    })

    observer.observe(cy.$$('html')[0], {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    })

    Object.entries(overrides).forEach(([k, v]) => {
      // eslint-disable-next-line cypress/no-assigning-return-values
      const $el = cy.$$(k)

      if (typeof v === 'function') {
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
    if (!this.mutationStack) return

    [...this.mutationStack].reverse().forEach(({
      type,
      target,
      attributeName,
      oldValue,
      addedNodes,
      removedNodes,
    }) => {
      if (type === 'attributes' && attributeName) {
        let targetElement = target as HTMLElement

        if (!oldValue) {
          targetElement.removeAttribute(attributeName)
        } else {
          targetElement.setAttribute(attributeName, oldValue)
        }

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
}: SnapshotMutationOptions): Cypress.Chainable<() => void> => {
  if (!Object.keys(snapshotElementOverrides).length) {
    return cy.then(() => () => {})
  }

  const elementOverrideManager = new ElementOverrideManager()

  return cy.viewport(snapshotWidth, snapshotHeight, { log: false })
  .then(() => {
    elementOverrideManager.performOverrides(cy, snapshotElementOverrides)

    if (log) {
      Cypress.log({
        message: log,
        // @ts-ignore
        snapshot: true,
        end: true,
      })
    }

    return () => {
      cy.viewport(defaultWidth, defaultHeight, { log: false })
      .then(() => {
        elementOverrideManager.resetOverrides()
      })
    }
  })
}

export const installCustomPercyCommand = ({ before, elementOverrides }: {before?: () => void, elementOverrides?: CustomSnapshotOptions['elementOverrides'], isComponentTesting?: boolean } = {}) => {
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
  const customPercySnapshot = (percySnapshot: (name?: string, options?: SnapshotOptions) => Cypress.Chainable<any>, name?: string, options: CustomSnapshotOptions = {}) => {
    if (name && typeof name === 'object') {
      options = name
      name = undefined
    }

    // @ts-ignore
    const test: Mocha.Test = cy.state('test')

    const titlePath = test.titlePath()

    const screenshotName = name
      ? titlePath.concat(name).join(' > ')
      : titlePath.join(' ')

    // viewport data is read from test state rather than config to ensure that
    // the snapshot is presented at the test's expected size.
    // @ts-ignore
    const { viewportWidth, viewportHeight } = cy.state() as Cypress.Config
    const snapshotWidth = options.width ? options.width : viewportWidth
    const snapshotHeight = options.height ? options.height : viewportHeight

    const snapshotMutationOptions: SnapshotMutationOptions = {
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
      // since Percy snapshots represent visually unique states in the application
      // doing an accessibility check here should cover all situations that need to a11y checks

      return applySnapshotMutations({
        ...snapshotMutationOptions,
        log: 'skipping Percy: hover to see snapshot',
      }).then((reset) => reset())
    }

    if (before && typeof before === 'function') {
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
      cy
      .then(() => {
        return percySnapshot(screenshotName, {
          ...options,
          widths: [snapshotWidth],
        })
      })
      .then(() => {
        return reset()
      })
      .then(() => {
        Cypress.config('defaultCommandTimeout', _backupTimeout)
      })
    })
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}
