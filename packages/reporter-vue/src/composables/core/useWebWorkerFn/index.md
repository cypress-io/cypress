---
category: Misc
---

# useWebWorkerFn

Run expensive function without blocking the UI, using a simple syntax that makes use of Promise. A port of [alewin/useWorker](https://github.com/alewin/useWorker).

## Usage

### Basic example

```js
import { useWebWorkerFn } from '@vueuse/core'

const { workerFn } = useWebWorkerFn(() => {
  // some heavy works to do in web worker
})
```

### With dependencies

```ts {7-9}
import { useWebWorkerFn } from '@vueuse/core'

const { workerFn, workerStatus, workerTerminate } = useWebWorkerFn(
  dates => dates.sort(dateFns.compareAsc), 
  {
    timeout: 50000,
    dependencies: [
      'https://cdnjs.cloudflare.com/ajax/libs/date-fns/1.30.1/date_fns.js' // dateFns
    ],
  }
)
```

## Web Worker

Before you start using this function, we suggest you read the [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) documentation.

## Credit

This function is a Vue port of https://github.com/alewin/useWorker by Alessio Koci, with the help of [@Donskelle](https://github.com/Donskelle) to migration.



<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export declare type WebWorkerStatus =
  | "PENDING"
  | "SUCCESS"
  | "RUNNING"
  | "ERROR"
  | "TIMEOUT_EXPIRED"
export interface WebWorkerOptions extends ConfigurableWindow {
  /**
   * Number of milliseconds before killing the worker
   *
   * @default undefined
   */
  timeout?: number
  /**
   * An array that contains the external dependencies needed to run the worker
   */
  dependencies?: string[]
}
/**
 * Run expensive function without blocking the UI, using a simple syntax that makes use of Promise.
 *
 * @see https://vueuse.org/useWebWorkerFn
 * @param fn
 * @param options
 */
export declare const useWebWorkerFn: <T extends (...fnArgs: any[]) => any>(
  fn: T,
  options?: WebWorkerOptions
) => {
  workerFn: (...fnArgs: Parameters<T>) => Promise<ReturnType<T>>
  workerStatus: Ref<WebWorkerStatus>
  workerTerminate: (status?: WebWorkerStatus) => void
}
export declare type UseWebWorkerFnReturn = ReturnType<typeof useWebWorkerFn>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useWebWorkerFn/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useWebWorkerFn/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useWebWorkerFn/index.md)


<!--FOOTER_ENDS-->
