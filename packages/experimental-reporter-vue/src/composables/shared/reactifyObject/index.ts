import { reactify, Reactify } from '../reactify'

export type ReactifyNested<T, Keys extends keyof T = keyof T> = { [K in Keys]: T[K] extends (...args: any[]) => any ? Reactify<T[K]> : T[K]}

export interface ReactifyObjectOptions {
  /**
   * Includes names from Object.getOwnPropertyNames
   *
   * @default true
   */
  includeOwnProperties?: boolean
}

/**
 * Apply `reactify` to an object
 */
export function reactifyObject<T extends object, Keys extends keyof T>(obj: T, keys?: (keyof T)[]): ReactifyNested<T, Keys>
export function reactifyObject<T extends object>(obj: T, options?: ReactifyObjectOptions): ReactifyNested<T>

export function reactifyObject<T extends object>(obj: T, optionsOrKeys: ReactifyObjectOptions | (keyof T)[] = {}): ReactifyNested<T> {
  let keys: string[] = []
  if (Array.isArray(optionsOrKeys)) { keys = optionsOrKeys as string[] }
  else {
    const { includeOwnProperties = true } = optionsOrKeys

    keys.push(...Object.keys(obj))
    if (includeOwnProperties)
      keys.push(...Object.getOwnPropertyNames(obj))
  }

  return Object.fromEntries(
    keys
      .map((key) => {
        const value = obj[key as keyof T]
        return [
          key,
          typeof value === 'function'
            ? reactify(value.bind(obj))
            : value,
        ]
      }),
  ) as ReactifyNested<T>
}
