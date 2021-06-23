---
category: Browser
---

# useEventListener

Use EventListener with ease. Register using [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) on mounted, and [removeEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener) automatically on unmounted.

## Usage

```js
import { useEventListener } from '@vueuse/core'

useEventListener(document, 'visibilitychange', (evt) => { console.log(evt) })
```

You can also pass a ref as the event target, `useEventListener` will unregister the previous event and register the new one when you change the target.

```ts
import { useEventListener } from '@vueuse/core'

const element = ref<HTMLDivElement>()
useEventListener(element, 'keydown', (e) => { console.log(e.key) })
```

```html
<template>
  <div v-if="cond" ref="element">Div1</div>
  <div v-else ref="element">Div2</div>
</template>
```

<!--FOOTER_STARTS-->
## Type Declarations

```typescript
interface InferEventTarget<Events> {
  addEventListener(event: Events, fn?: any, options?: any): any
  removeEventListener(event: Events, fn?: any, options?: any): any
}
export declare type WindowEventName = keyof WindowEventMap
export declare type DocumentEventName = keyof DocumentEventMap
export declare type GeneralEventListener<E = Event> = {
  (evt: E): void
}
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 1: Omitted Window target
 *
 * @see https://vueuse.org/useEventListener
 * @param event
 * @param listener
 * @param options
 */
export declare function useEventListener<E extends keyof WindowEventMap>(
  event: E,
  listener: (this: Window, ev: WindowEventMap[E]) => any,
  options?: boolean | AddEventListenerOptions
): Fn
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 2: Explicitly Window target
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export declare function useEventListener<E extends keyof WindowEventMap>(
  target: Window,
  event: E,
  listener: (this: Window, ev: WindowEventMap[E]) => any,
  options?: boolean | AddEventListenerOptions
): Fn
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 3: Explicitly Document target
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export declare function useEventListener<E extends keyof DocumentEventMap>(
  target: Document,
  event: E,
  listener: (this: Document, ev: DocumentEventMap[E]) => any,
  options?: boolean | AddEventListenerOptions
): Fn
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 4: Custom event target with event type infer
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export declare function useEventListener<
  Names extends string,
  EventType = Event
>(
  target: InferEventTarget<Names>,
  event: Names,
  listener: GeneralEventListener<EventType>,
  options?: boolean | AddEventListenerOptions
): Fn
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 5: Custom event target fallback
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export declare function useEventListener<EventType = Event>(
  target: MaybeRef<EventTarget | null | undefined>,
  event: string,
  listener: GeneralEventListener<EventType>,
  options?: boolean | AddEventListenerOptions
): Fn
export {}
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useEventListener/index.ts) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useEventListener/index.md)


<!--FOOTER_ENDS-->
