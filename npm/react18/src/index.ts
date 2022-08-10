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

let root: any

const cleanup = () => {
  if (root) {
    root.unmount()

    return true
  }

  return false
}

export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement) => {
      root = ReactDOM.createRoot(el)

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
