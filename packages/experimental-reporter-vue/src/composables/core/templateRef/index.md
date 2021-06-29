---
category: Component
---

# templateRef

Shorthand for binding ref to template element.

## Usage

```vue
<template>
  <div ref="target"></div>
</template>

<script lang="ts">
import { templateRef } from '@vueuse/core'

export default {
  setup() {
    const target = templateRef('target')

    // no need to return the `target`, it will bind to the ref magically
  }
}
</script>
```

### With JSX/TSX

```tsx
import { templateRef } from '@vueuse/core'

export default {
  setup() {
    const target = templateRef<HTMLElement | null>('target', null)

    // use string ref
    return () => <div ref="target"></div>
  },
}
```

### `<script setup>`

There is no need for this when using with `<script setup>` since all the variables will be exposed to the template. It will be exactly the same as `ref`.

```vue
<template>
  <div ref="target"></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const target = ref<HTMLElement | null>(null)
</script>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Shorthand for binding ref to template element.
 *
 * @see https://vueuse.org/templateRef
 * @param key
 * @param initialValue
 */
export declare function templateRef<T extends Element | null>(
  key: string,
  initialValue?: T | null
): Readonly<Ref<T>>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/templateRef/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/templateRef/index.md)


<!--FOOTER_ENDS-->
