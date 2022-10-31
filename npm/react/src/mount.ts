import { getContainerEl } from '@cypress/mount-utils'
import React from 'react'
import ReactDOM from 'react-dom'
import major from 'semver/functions/major'
import {
  makeMountFn,
  makeUnmountFn,
} from './createMount'
import type {
  MountOptions,
  InternalMountOptions,
} from './types'

let lastReactDom: typeof ReactDOM

const cleanup = () => {
  if (lastReactDom) {
    const root = getContainerEl()

    lastReactDom.unmountComponentAtNode(root)

    return true
  }

  return false
}

/**
 * Mounts a React component into the DOM.
 * @param jsx {React.ReactNode} The React component to mount.
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
 */
export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  if (major(React.version) === 18) {
    const message = '[cypress/react]: You are using `cypress/react`, which is designed for React <= 17. Consider changing to `cypress/react18`, which is designed for React 18.'

    console.error(message)
    Cypress.log({ name: 'warning', message })
  }

  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement, reactDomToUse: typeof ReactDOM) => {
      lastReactDom = (reactDomToUse || ReactDOM)

      return lastReactDom.render(reactComponent, el)
    },
    unmount,
    cleanup,
  }

  return makeMountFn('mount', jsx, { ReactDom: ReactDOM, ...options }, rerenderKey, internalOptions)
}

/**
 * Unmounts the component from the DOM.
 * @param options - Options for unmounting.
 */
export function unmount (options = { log: true }) {
  return makeUnmountFn(options)
}
