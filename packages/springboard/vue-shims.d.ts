import { DefineComponent } from 'vue'

declare module '*.vue' {
  const component: DefineComponent
  export default component
}