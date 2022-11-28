declare module 'virtual:*' {
  import { Component } from 'vue'
  const src: Component
  export default src
}

declare module 'virtual:icons/*' {
  // eslint-disable-next-line no-duplicate-imports
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}
declare module '~icons/*' {
  // eslint-disable-next-line no-duplicate-imports
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}

declare module '~icons/cy/*' {
  // eslint-disable-next-line no-duplicate-imports
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}

declare module '~icons/mdi/*' {
  // eslint-disable-next-line no-duplicate-imports
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}
