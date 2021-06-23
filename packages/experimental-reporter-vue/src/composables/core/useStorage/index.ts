import { ConfigurableFlush, watchWithFilter, ConfigurableEventFilter } from '../../shared'
import { ref, Ref } from 'vue'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export type Serializer<T> = {
  read(raw: string): T

  write(value: T): string
}

const Serializers: Record<string, Serializer<any>> = {
  boolean: {
    read: (v: any) => v != null ? v === 'true' : null,
    write: (v: any) => String(v),
  },
  object: {
    read: (v: any) => v ? JSON.parse(v) : null,
    write: (v: any) => JSON.stringify(v),
  },
  number: {
    read: (v: any) => v != null ? Number.parseFloat(v) : null,
    write: (v: any) => String(v),
  },
  any: {
    read: (v: any) => v != null ? v : null,
    write: (v: any) => String(v),
  },
  string: {
    read: (v: any) => v != null ? v : null,
    write: (v: any) => String(v),
  },
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface StorageOptions<T> extends ConfigurableEventFilter, ConfigurableWindow, ConfigurableFlush {
  /**
   * Watch for deep changes
   *
   * @default true
   */
  deep?: boolean

  /**
   * Listen to storage changes, useful for multiple tabs application
   *
   * @default true
   */
  listenToStorageChanges?: boolean

  /**
   * Custom data serialization
   */
  serializer?: Serializer<T>
}

export function useStorage(key: string, defaultValue: string, storage?: StorageLike, options?: StorageOptions<string>): Ref<string>
export function useStorage(key: string, defaultValue: boolean, storage?: StorageLike, options?: StorageOptions<boolean>): Ref<boolean>
export function useStorage(key: string, defaultValue: number, storage?: StorageLike, options?: StorageOptions<number>): Ref<number>
export function useStorage<T> (key: string, defaultValue: T, storage?: StorageLike, options?: StorageOptions<T>): Ref<T>
export function useStorage<T = unknown> (key: string, defaultValue: null, storage?: StorageLike, options?: StorageOptions<T>): Ref<T>

/**
 * Reactive LocalStorage/SessionStorage.
 *
 * @see https://vueuse.org/useStorage
 * @param key
 * @param defaultValue
 * @param storage
 * @param options
 */
export function useStorage<T extends(string|number|boolean|object|null)> (
  key: string,
  defaultValue: T,
  storage: StorageLike | undefined = defaultWindow && defaultWindow.localStorage,
  options: StorageOptions<T> = {},
) {
  const {
    flush = 'pre',
    deep = true,
    listenToStorageChanges = true,
    window = defaultWindow,
    eventFilter,
  } = options

  const data = ref<T>(defaultValue)

  const type = defaultValue == null
    ? 'any'
    : typeof defaultValue === 'boolean'
      ? 'boolean'
      : typeof defaultValue === 'string'
        ? 'string'
        : typeof defaultValue === 'object'
          ? 'object'
          : Array.isArray(defaultValue)
            ? 'object'
            : !Number.isNaN(defaultValue)
              ? 'number'
              : 'any'
  let serializerValue = Serializers[type]
  if (options.serializer) {
    serializerValue = options.serializer
  }
  const serializer = serializerValue

  function read(event?: StorageEvent) {
    if (!storage)
      return

    if (event && event.key !== key)
      return

    try {
      const rawValue = event ? event.newValue : storage.getItem(key)
      if (rawValue == null) {
        (data as Ref<T>).value = defaultValue
        storage.setItem(key, serializer.write(defaultValue))
      }
      else {
        data.value = serializer.read(rawValue)
      }
    }
    catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e)
    }
  }

  read()

  if (window && listenToStorageChanges)
    useEventListener(window, 'storage', read)

  watchWithFilter(
    data,
    () => {
      if (!storage) // SSR
        return

      try {
        if (data.value == null)
          storage.removeItem(key)
        else
          storage.setItem(key, serializer.write(data.value))
      }
      catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e)
      }
    },
    {
      flush,
      deep,
      eventFilter,
    },
  )

  return data
}
