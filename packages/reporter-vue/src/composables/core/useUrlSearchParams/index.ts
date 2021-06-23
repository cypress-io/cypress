import { computed, reactive } from 'vue'
import { pausableWatch } from '../../shared'
import { useEventListener } from '../useEventListener'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export type UrlParams = Record<string, string[] | string>

/**
 * Reactive URLSearchParams
 *
 * @see https://vueuse.org/useUrlSearchParams
 * @param mode
 * @param options
 */
export function useUrlSearchParams<T extends Record<string, any> = UrlParams>(
  mode: 'history'|'hash' = 'history',
  options: ConfigurableWindow = {},
): T {
  const { window = defaultWindow } = options

  if (!window)
    return reactive(Object.assign({}))

  const hashWithoutParams = computed((): string => {
    const hash = window.location.hash || ''
    const index = hash.indexOf('?')
    return index > 0 ? hash.substring(0, index) : hash
  })

  const read = (): URLSearchParams => {
    if (mode === 'hash') {
      const hash = window.location.hash || ''
      const index = hash.indexOf('?')
      return new URLSearchParams(index >= 0 ? hash.substring(index + 1) : '')
    }
    else {
      return new URLSearchParams(window.location.search || '')
    }
  }

  let params: URLSearchParams = read()
  const paramsMap: T = reactive(Object.assign({}))

  function writeToParamsMap(key: keyof T, value: any) {
    return paramsMap[key] = value
  }

  function updateParamsMap() {
    Object.keys(paramsMap).forEach(key => delete paramsMap[key])
    for (const key of params.keys()) {
      const paramsForKey = params.getAll(key)
      writeToParamsMap(key, paramsForKey.length > 1 ? paramsForKey : (params.get(key) || ''))
    }
  }

  // Update the paramsMap with initial values
  updateParamsMap()

  const { pause, resume } = pausableWatch(
    paramsMap,
    () => {
      params = new URLSearchParams('')
      Object.keys(paramsMap).forEach((key) => {
        const mapEntry = paramsMap[key]
        if (Array.isArray(mapEntry))
          mapEntry.forEach(value => params.append(key, value))
        else
          params.set(key, mapEntry)
      })
      write(params)
    },
    { deep: true },
  )

  function write(params: URLSearchParams, shouldUpdateParamsMap?: boolean) {
    pause()
    if (shouldUpdateParamsMap)
      updateParamsMap()

    const empty = !params.keys().next()
    const query = empty
      ? hashWithoutParams.value
      : (mode === 'hash')
        ? `${hashWithoutParams.value}?${params}`
        : `?${params}${hashWithoutParams.value}`

    if (window)
      window.history.replaceState({}, '', window.location.pathname + query)
    resume()
  }

  useEventListener(window, 'popstate', () => {
    params = read()
    write(params, true)
  })

  return paramsMap
}
