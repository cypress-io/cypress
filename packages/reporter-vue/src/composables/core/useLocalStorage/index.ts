import { StorageOptions, useStorage } from '../useStorage'
import { Ref } from 'vue'
import { defaultWindow } from '../_configurable'

export function useLocalStorage (key: string, defaultValue: string, options?: StorageOptions<string>): Ref<string>
export function useLocalStorage (key: string, defaultValue: boolean, options?: StorageOptions<boolean>): Ref<boolean>
export function useLocalStorage(key: string, defaultValue: number, options?: StorageOptions<number>): Ref<number>
export function useLocalStorage<T> (key: string, defaultValue: T, options?: StorageOptions<T>): Ref<T>
export function useLocalStorage<T = unknown> (key: string, defaultValue: null, options?: StorageOptions<T>): Ref<T>

/**
 * Reactive LocalStorage.
 *
 * @see https://vueuse.org/useLocalStorage
 * @param key
 * @param defaultValue
 * @param options
 */
export function useLocalStorage<T extends(string|number|boolean|object|null)> (key: string, defaultValue: T, options: StorageOptions<T> = {}): Ref<any> {
  const { window = defaultWindow } = options
  return useStorage(key, defaultValue, window && window.localStorage, options)
}
