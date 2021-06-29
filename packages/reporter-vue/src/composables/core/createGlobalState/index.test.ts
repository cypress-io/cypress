import { nextTick } from 'vue'
import { useSetup } from '../../.test'
import { useStorage } from '../useStorage'
import { createGlobalState } from '.'

const KEY = 'custom-key'

describe('createGlobalState', () => {
  afterEach(() => {
    localStorage.clear()
    // @ts-ignore
    localStorage.setItem.mockClear()
  })

  it('should work after dispose 1', async() => {
    const useGlobalState = createGlobalState(() => useStorage(KEY, 'a'))

    const vm1 = useSetup(() => {
      const ref = useGlobalState()

      expect(ref.value).toBe('a')
      expect(localStorage.setItem).toBeCalledWith(KEY, 'a')
      // @ts-ignore
      localStorage.setItem.mockClear()

      return {
        ref,
      }
    })

    vm1.ref = 'b'
    await nextTick()

    expect(vm1.ref).toBe('b')
    expect(localStorage.setItem).toBeCalledWith(KEY, 'b')
    // @ts-ignore
    localStorage.setItem.mockClear()

    vm1.unmount()

    const instance2 = useSetup(() => {
      const ref = useGlobalState()

      expect(ref.value).toBe('b')

      return {
        ref,
      }
    })

    const vm2 = instance2

    vm2.ref = 'c'
    await nextTick()

    expect(vm2.ref).toBe('c')
    expect(localStorage.setItem).toBeCalledWith(KEY, 'c')
  })

  it('should work after dispose 2', async() => {
    const ref = createGlobalState(() => useStorage(KEY, 'a'))()

    const vm1 = useSetup(() => {
      expect(ref.value).toBe('a')
      expect(localStorage.setItem).toBeCalledWith(KEY, 'a')
      // @ts-ignore
      localStorage.setItem.mockClear()

      return {
        ref,
      }
    })

    vm1.ref = 'b'
    await nextTick()

    expect(vm1.ref).toBe('b')
    expect(localStorage.setItem).toBeCalledWith(KEY, 'b')
    // @ts-ignore
    localStorage.setItem.mockClear()

    vm1.unmount()

    const vm2 = useSetup(() => {
      expect(ref.value).toBe('b')

      return {
        ref,
      }
    })

    vm2.ref = 'c'
    await nextTick()

    expect(vm2.ref).toBe('c')
    expect(localStorage.setItem).toBeCalledWith(KEY, 'c')
  })

  it('watches deeply', async() => {
    const useGlobalState = createGlobalState(() => useStorage(KEY, { a: 'a', b: 1 }))

    const vm1 = useSetup(() => {
      const ref = useGlobalState()

      expect(ref.value).toEqual({
        a: 'a',
        b: 1,
      })
      expect(localStorage.setItem).toBeCalledWith(KEY, '{"a":"a","b":1}')
      // @ts-ignore
      localStorage.setItem.mockClear()

      return {
        ref,
      }
    })

    vm1.ref.a = 'b'
    await nextTick()

    expect(vm1.ref).toEqual({
      a: 'b',
      b: 1,
    })
    expect(localStorage.setItem).toBeCalledWith(KEY, '{"a":"b","b":1}')
    // @ts-ignore
    localStorage.setItem.mockClear()

    vm1.unmount()

    const vm2 = useSetup(() => {
      const ref = useGlobalState()

      expect(ref.value).toEqual({
        a: 'b',
        b: 1,
      })

      return {
        ref,
      }
    })

    vm2.ref.b = 2
    await nextTick()

    expect(vm2.ref).toEqual({
      a: 'b',
      b: 2,
    })
    expect(localStorage.setItem).toBeCalledWith(KEY, '{"a":"b","b":2}')
    // @ts-ignore
    localStorage.setItem.mockClear()

    vm2.ref = {
      a: 'c',
      b: 3,
    }
    await nextTick()

    expect(vm2.ref).toEqual({
      a: 'c',
      b: 3,
    })
    expect(localStorage.setItem).toBeCalledWith(KEY, '{"a":"c","b":3}')
  })
})
