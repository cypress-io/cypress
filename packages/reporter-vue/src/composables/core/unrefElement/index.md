---
category: Component
---

# unrefElement

Unref for dom element.

## Usage

```html
<template>
  <div ref="div"/>
  <HelloWorld ref="hello"/>
</template>

<script setup>
import { ref } from 'vue'
import { unrefElement } from '@vueuse/core'

const div = ref() // will be bind to the <div> element
const hello = ref() // will be bind to the HelloWorld Component

onMounted(() => {
  console.log(unrefElement(div)) // the <div> element
  console.log(unrefElement(hello)) // the root element of the HelloWorld Component
})
</script>
```


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type VueInstance = InstanceType<
  ReturnType<typeof defineComponent>
>
export declare type MaybeElementRef = MaybeRef<
  Element | VueInstance | undefined | null
>
/**
 * Get the dom element of a ref of element or Vue component instance
 *
 * @param elRef
 */
export declare function unrefElement(elRef: MaybeElementRef): any
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/unrefElement/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/unrefElement/index.md)


<!--FOOTER_ENDS-->
