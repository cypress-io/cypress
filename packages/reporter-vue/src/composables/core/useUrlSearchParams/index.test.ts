import { useUrlSearchParams } from '.'
import { useSetup } from '../../.test'
import each from 'jest-each'

describe('useUrlSearchParams', () => {
  const baseURL = 'https://vueuse.org'

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: new URL(baseURL),
      writable: true,
    })
    window.location.search = ''
    window.location.hash = ''
  })

  const mockPopstate = (search: string, hash: string) => {
    window.location.search = search
    window.location.hash = hash
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: {
        ...location,
        search,
        hash,
      },
    }))
  }

  each([
    'history',
    'hash',
  ]).describe('each mode', (mode: 'history' | 'hash') => {
    test('return initial params', () => {
      useSetup(() => {
        if (mode === 'hash')
          window.location.hash = '#/test/?foo=bar'
        else
          window.location.search = '?foo=bar'
      })

      const params = useUrlSearchParams(mode)
      expect(params.foo).toBe('bar')
    })

    test('update params on poststate event', () => {
      useSetup(() => {
        const params = useUrlSearchParams(mode)
        expect(params.foo).toBeUndefined()
        if (mode === 'hash')
          mockPopstate('', '#/test/?foo=bar')
        else
          mockPopstate('?foo=bar', '')

        expect(params.foo).toBe('bar')
      })
    })

    test('update browser location on params change', () => {
      useSetup(() => {
        const params = useUrlSearchParams(mode)
        expect(params.foo).toBeUndefined()
        params.foo = 'bar'

        expect(params.foo).toBe('bar')
      })
    })

    test('array url search param', () => {
      useSetup(() => {
        const params = useUrlSearchParams(mode)
        expect(params.foo).toBeUndefined()
        params.foo = ['bar1', 'bar2']

        expect(params.foo).toEqual(['bar1', 'bar2'])
      })
    })

    test('generic url search params', () => {
      useSetup(() => {
        interface CustomUrlParams extends Record<string, any> {
          customFoo: number | undefined
        }

        const params = useUrlSearchParams<CustomUrlParams>(mode)
        expect(params.customFoo).toBeUndefined()
        params.customFoo = 42

        expect(params.customFoo).toEqual(42)
      })
    })
  })

  test('hash url without params', () => {
    useSetup(() => {
      window.location.hash = '#/test/'
      const params = useUrlSearchParams('hash')
      expect(params).toEqual({})

      const newHash = '#/change/?foo=bar'
      window.location.hash = newHash
      expect(window.location.hash).toBe(newHash)
    })
  })
})
