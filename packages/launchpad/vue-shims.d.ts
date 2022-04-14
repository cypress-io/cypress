declare module 'virtual:*' {
  import type { Component } from 'vue'
  const src: Component
  export default src
}

declare module 'virtual:icons/*' {
  // eslint-disable-next-line no-duplicate-imports
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}
declare module '~icons/*' {
  // eslint-disable-next-line no-duplicate-imports
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}
