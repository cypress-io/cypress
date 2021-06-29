---
category: Utilities
---

# reactivePick

Reactively pick fields from a reactive object.

## Usage

```js
import { reactivePick } from '@vueuse/core'

const obj = reactive({
  x: 0,
  y: 0,
  elementX: 0,
  elementY: 0,
})

const picked = reactivePick(obj, 'x', 'elementX') // { x: number, elementX: number }
```

### Scenarios

#### Selectively passing props to child

```html
<script setup>
import { defineProps } from 'vue'
import { reactivePick } from '@vueuse/core'

const props = defineProps({
  value: {
    default: 'value',
  },
  color: {
    type: String,
  },
  font: {
    type: String,
  }
})

const childProps = reactivePick(props, 'color', 'font')
</script>

<template>
  <div>
    <!-- only passes "color" and "font" props to child -->
    <ChildComp v-bind="childProps" />
  </div>
</template>
```

#### Selectively wrap reactive object

Instead of doing this

```ts
import { reactive } from 'vue'
import { useElementBounding } from '@vueuse/core'

const { height, width } = useElementBounding() // object of refs
const size = reactive({ height, width })
```

Now we can just have this

```ts
import { reactivePick, useElementBounding } from '@vueuse/core'

const size = reactivePick(useElementBounding(), 'height', 'width')
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
/**
 * Reactively pick fields from a reactive object
 *
 * @see https://vueuse.js.org/reactivePick
 */
export declare function reactivePick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): {
  [S in K]: UnwrapRef<T[S]>
}
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/shared/reactivePick/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/shared/reactivePick/index.md)


<!--FOOTER_ENDS-->
