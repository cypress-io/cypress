import React from 'react'
import ReactDOM from 'react-dom'
import {
  _mount,
  _unmount,
  lastMountedReactDom,
} from './mount'
import type {
  MountOptions,
  InternalMountOptions,
  InternalUnmountOptionsReact17,
} from './mount'

export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement, reactDomToUse: typeof ReactDOM) => {
      return (reactDomToUse || ReactDOM).render(reactComponent, el)
    },
    unmount,
  }

  return _mount('mount', jsx, { ReactDom: ReactDOM, ...options }, rerenderKey, internalOptions)
}

export function unmount (options = { log: true }) {
  const internalOptions: InternalUnmountOptionsReact17 = {
    unmount: (el) => {
      return (lastMountedReactDom || ReactDOM).unmountComponentAtNode(el)
    },
  }

  return _unmount(options, internalOptions)
}
