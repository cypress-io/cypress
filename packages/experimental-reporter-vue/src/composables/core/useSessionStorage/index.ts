import { StorageOptions, useStorage } from '../useStorage'
import { Ref } from 'vue'
import { defaultWindow } from '../_configurable'

export function useSessionStorage (key: string, defaultValue: string, options?: StorageOptions<string>): Ref<string>
export function useSessionStorage (key: string, defaultValue: boolean, options?: StorageOptions<boolean>): Ref<boolean>
export function useSessionStorage(key: string, defaultValue: number, options?: StorageOptions<number>): Ref<number>
export function useSessionStorage<T> (key: string, defaultValue: T, options?: StorageOptions<T>): Ref<T>
export function useSessionStorage<T = unknown> (key: string, defaultValue: null, options?: StorageOptions<T>): Ref<T>

/**
 * Reactive SessionStorage.
 *
 * @see https://vueuse.org/useSessionStorage
 * @param key
 * @param defaultValue
 * @param options
 */
export function useSessionStorage<T extends(string|number|boolean|object|null)> (key: string, defaultValue: T, options: StorageOptions<T> = {}): Ref<any> {
  const { window = defaultWindow } = options
  return useStorage(key, defaultValue, window && window.sessionStorage, options)
}
