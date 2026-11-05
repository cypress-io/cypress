declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the shim Vue CLI scaffolds, kept verbatim in this fixture project
  const component: DefineComponent<{}, {}, any>
  export default component
}
