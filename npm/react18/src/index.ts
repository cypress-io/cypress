import React from 'react'
// @ts-expect-error
import ReactDOM from 'react-dom/client'
import { getContainerEl } from '@cypress/mount-utils'
import {
  makeMountFn,
  makeUnmountFn,
} from '@cypress/react'
import type {
  MountOptions,
  InternalMountOptions,
  UnmountArgs,
} from '@cypress/react'

let root: ReactDOM.Root | null

const cleanup = () => {
  if (root) {
    root.unmount()

    root = null

    return true
  }

  return false
}

/**
 * Mounts a React component into the DOM.
 * @param {import('react').JSX.Element} jsx The React component to mount.
 * @param {MountOptions} options Options to pass to the mount function.
 * @param {string} rerenderKey A key to use to force a rerender.
 *
 * @example
 * import { mount } from '@cypress/react'
 * import { Stepper } from './Stepper'
 *
 * it('mounts', () => {
 *   mount(<StepperComponent />)
 *   cy.get('[data-cy=increment]').click()
 *   cy.get('[data-cy=counter]').should('have.text', '1')
 * }
 *
 * @see {@link https://on.cypress.io/mounting-react} for more details.
 *
 * @returns {Cypress.Chainable<MountReturn>} The mounted component.
 */
export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  // Remove last mounted component if cy.mount is called more than once in a test
  // React by default removes the last component when calling render, but we should remove the root
  // to wipe away any state
  cleanup()
  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement) => {
      if (!root) {
        root = ReactDOM.createRoot(el)
      }

      return root.render(reactComponent)
    },
    unmount: internalUnmount,
    cleanup,
  }

  return makeMountFn('mount', jsx, { ReactDom: ReactDOM, ...options }, rerenderKey, internalOptions)
}

function internalUnmount (options = { log: true }) {
  return makeUnmountFn(options)
}
/**
 * Removed as of Cypress 11.0.0.
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export function unmount (options: UnmountArgs = { log: true }) {
  // @ts-expect-error - undocumented API
  Cypress.utils.throwErrByPath('mount.unmount')
}

// Re-export this to help with migrating away from `unmount`
export {
  getContainerEl,
}
