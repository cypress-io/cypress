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

export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
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
