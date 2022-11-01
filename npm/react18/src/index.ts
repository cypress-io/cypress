import React from 'react'
// @ts-expect-error
import ReactDOM from 'react-dom/client'
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
 * @param jsx {import('react').JSX.Element} The React component to mount.
 * @param options {MountOptions} Options to pass to the mount function.
 * @param rerenderKey {string} A key to use to force a rerender.
 *
 * @example
 * import { mount } from '@cypress/react'
 * import { Stepper } from './Stepper'
 * it('mounts', () => {
 *  mount(<StepperComponent />)
 *  cy.get('[data-cy=increment]').click()
 *  cy.get('[data-cy=counter]').should('have.text', '1')
 * }
 *
 * @see {@link https://docs.cypress.io/guides/component-testing/mounting-react} for more details.
 *
 * @returns {Cypress.Chainable<MountReturn>} The mounted component.
 */
export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement) => {
      if (!root) {
        root = ReactDOM.createRoot(el)
      }

      return root.render(reactComponent)
    },
    unmount,
    cleanup,
  }

  return makeMountFn('mount', jsx, { ReactDom: ReactDOM, ...options }, rerenderKey, internalOptions)
}

export function unmount (options: UnmountArgs = { log: true }) {
  return makeUnmountFn(options)
}
