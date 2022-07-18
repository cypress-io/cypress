import React from 'react'
// @ts-expect-error
import ReactDOM from 'react-dom/client'
import {
  _mount,
  _unmount,
} from './mount'
import type {
  MountOptions,
  InternalMountOptions,
  InternalUnmountOptionsReact18,
  UnmountArgs,
} from './mount'

let root: any

export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement, reactDomToUse: typeof ReactDOM) => {
      root = ReactDOM.createRoot(el)

      return root.render(reactComponent)
    },
    unmount,
  }

  return _mount('mount', jsx, { ReactDom: ReactDOM, ...options }, rerenderKey, internalOptions)
}

export function unmount (options: UnmountArgs = { log: true }) {
  const internalOptions: InternalUnmountOptionsReact18 = {
    // type is ReturnType<typeof ReactDOM.createRoot>
    unmount: (): boolean => {
      root.unmount()

      return true
    },
  }

  return _unmount(options, internalOptions)
}
