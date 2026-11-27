// Types `.vue` imports in the React programs (tsconfig.react.json), which run
// plain tsc. Under vue-tsc an SFC's template is checked as JSX in the program's
// JSX mode, so a React program would check Vue templates as React JSX. The Vue
// programs check every SFC with its real types.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent

  export default component
}
