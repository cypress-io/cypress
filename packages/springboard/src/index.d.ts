import { DefineComponent } from 'vue'

declare global {
  interface Window {
    App: {
      start: () => void
    }
  }
}

declare module '*.vue' {
  const component: DefineComponent
  export default component
}

export {} 