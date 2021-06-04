import { DefineComponent } from 'vue'

declare global {
  interface Window {
    App: {
      start: () => void
    }
    ipc: {
      send: (...args: unknown) => void
      on: (event: string, ...args: unknown[]) => void
    }
  }
}

declare module '*.vue' {
  const component: DefineComponent
  export default component
}

export {} 