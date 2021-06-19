---
category: Utilities
---

# useManualRefHistory

Manually track the change history of a ref when the using calls `commit()`, also provides undo and redo functionality

## Usage

```ts {5}
import { ref } from 'vue' 
import { useManualRefHistory } from '@vueuse/core'

const counter = ref(0)
const { history, commit, undo, redo } = useManualRefHistory(counter)

counter.value += 1
commit()

console.log(history.value)
/* [
  { snapshot: 1, timestamp: 1601912898062 }, 
  { snapshot: 0, timestamp: 1601912898061 }
] */
```

You can use `undo` to reset the ref value to the last history point.

```ts
console.log(counter.value) // 1
undo()
console.log(counter.value) // 0
```

#### History of mutable objects

If you are going to mutate the source, you need to pass a custom clone function or use `clone` `true` as a param, that is a shortcut for a minimal clone function `x => JSON.parse(JSON.stringify(x))` that will be used in both `dump` and `parse`.

```ts {5}
import { ref } from 'vue' 
import { useManualRefHistory } from '@vueuse/core'

const counter = ref({ foo: 1, bar: 2 })
const { history, commit, undo, redo } = useManualRefHistory(counter, { clone: true })

counter.value.foo += 1
commit()
```

#### Custom Clone Function

To use a full featured or custom clone function, you can set up via the `dump` options.

For example, using [lodash's `cloneDeep`](https://lodash.com/docs/4.17.15#cloneDeep):

```ts
import { cloneDeep } from 'lodash-es'
import { useManualRefHistory } from '@vueuse/core'

const refHistory = useManualRefHistory(target, { clone: cloneDeep })
```

Or a more lightweight [`klona`](https://github.com/lukeed/klona):

```ts
import { klona } from 'klona'
import { useManualRefHistory } from '@vueuse/core'

const refHistory = useManualRefHistory(target, { clone: klona })
```

#### Custom Dump and Parse Function

Instead of using the `clone` param, you can pass custom functions to control the serialization and parsing. In case you do not need history values to be objects, this can save an extra clone when undoing. It is also useful in case you want to have the snapshots already stringified to be saved to local storage for example.

```ts
import { useManualRefHistory } from '@vueuse/core'

const refHistory = useManualRefHistory(target, { 
  dump: JSON.stringify,
  parse: JSON.parse
})
```

### History Capacity

We will keep all the history by default (unlimited) until you explicitly clear them up, you can set the maximal amount of history to be kept by `capacity` options.

```ts
const refHistory = useManualRefHistory(target, {
  capacity: 15, // limit to 15 history records
})

refHistory.clear() // explicitly clear all the history
```

## Related Functions

- `useRefHistory`


<!--FOOTER_STARTS-->
## Type Declarations

```typescript
export interface UseRefHistoryRecord<T> {
  snapshot: T
  timestamp: number
}
export declare type CloneFn<F, T = F> = (x: F) => T
export interface UseManualRefHistoryOptions<Raw, Serialized = Raw> {
  /**
   * Maximum number of history to be kept. Default to unlimited.
   */
  capacity?: number
  /**
   * Clone when taking a snapshot, shortcut for dump: JSON.parse(JSON.stringify(value)).
   * Default to false
   *
   * @default false
   */
  clone?: boolean | CloneFn<Raw>
  /**
   * Serialize data into the history
   */
  dump?: (v: Raw) => Serialized
  /**
   * Deserialize data from the history
   */
  parse?: (v: Serialized) => Raw
  /**
   * Deserialize data from the history
   */
  setSource?: (source: Ref<Raw>, v: Raw) => void
}
export interface UseManualRefHistoryReturn<Raw, Serialized> {
  /**
   * Bypassed tracking ref from the argument
   */
  source: Ref<Raw>
  /**
   * An array of history records for undo, newest comes to first
   */
  history: Ref<UseRefHistoryRecord<Serialized>[]>
  /**
   * Last history point, source can be different if paused
   */
  last: Ref<UseRefHistoryRecord<Serialized>>
  /**
   * Same as 'history'
   */
  undoStack: Ref<UseRefHistoryRecord<Serialized>[]>
  /**
   * Records array for redo
   */
  redoStack: Ref<UseRefHistoryRecord<Serialized>[]>
  /**
   * A ref representing if undo is possible (non empty undoStack)
   */
  canUndo: Ref<boolean>
  /**
   * A ref representing if redo is possible (non empty redoStack)
   */
  canRedo: Ref<boolean>
  /**
   * Undo changes
   */
  undo(): void
  /**
   * Redo changes
   */
  redo(): void
  /**
   * Clear all the history
   */
  clear(): void
  /**
   * Create new a new history record
   */
  commit(): void
  /**
   * Reset ref's value with lastest history
   */
  reset(): void
}
/**
 * Track the change history of a ref, also provides undo and redo functionality.
 *
 * @see https://vueuse.org/useManualRefHistory
 * @param source
 * @param options
 */
export declare function useManualRefHistory<Raw, Serialized = Raw>(
  source: Ref<Raw>,
  options?: UseManualRefHistoryOptions<Raw, Serialized>
): UseManualRefHistoryReturn<Raw, Serialized>
```

## Source

[Source](https://github.com/vueuse/vueuse/blob/main/packages/core/useManualRefHistory/index.ts) • [Demo](https://github.com/vueuse/vueuse/blob/main/packages/core/useManualRefHistory/demo.vue) • [Docs](https://github.com/vueuse/vueuse/blob/main/packages/core/useManualRefHistory/index.md)


<!--FOOTER_ENDS-->
