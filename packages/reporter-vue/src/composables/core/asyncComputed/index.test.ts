import { ref, computed, nextTick } from 'vue'
import { useSetup } from '../../.test'
import { asyncComputed } from '.'
import { promiseTimeout } from '../../shared'

describe('computed', () => {
  it('is lazy', () => {
    const func = jest.fn(() => 'data')

    useSetup(() => {
      const data = computed(func)

      expect(func).not.toBeCalled()

      expect(data.value).toBe('data')

      expect(func).toBeCalledTimes(1)
    })
  })
})

describe('asyncComputed', () => {
  it('is not lazy by default', async() => {
    const func = jest.fn(() => Promise.resolve('data'))

    const data = asyncComputed(func)

    expect(func).toBeCalledTimes(1)

    expect(data.value).toBeUndefined()

    await nextTick()
    await nextTick()

    expect(data.value).toBe('data')
  })

  it('is lazy if configured', async() => {
    const func = jest.fn(() => Promise.resolve('data'))

    const data = asyncComputed(func, undefined, { lazy: true })

    expect(func).not.toBeCalled()

    // Act
    expect(data.value).toBeUndefined()
    await nextTick()
    await nextTick()

    // Assert
    expect(func).toBeCalledTimes(1)
    expect(data.value).toBe('data')
  })

  it('re-computes when dependency changes', async() => {
    const counter = ref(1)
    const double = asyncComputed(() => {
      const result = counter.value * 2
      return Promise.resolve(result)
    })

    expect(double.value).toBeUndefined()

    await nextTick()

    expect(double.value).toBe(2)

    counter.value = 2
    expect(double.value).toBe(2)

    await nextTick()
    await nextTick()

    expect(double.value).toBe(4)
  })

  test('evaluating works', async() => {
    const evaluating = ref(false)

    const data = asyncComputed(() =>
      new Promise(resolve => setTimeout(() => resolve('data'), 0)),
    undefined,
    evaluating)

    await nextTick()
    expect(data.value).toBeUndefined()
    expect(evaluating.value).toBe(true)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(evaluating.value).toBe(false)
    expect(data.value).toBe('data')
  })

  test('triggers', async() => {
    const counter = ref(1)
    const double = asyncComputed(() => {
      const result = counter.value * 2
      return Promise.resolve(result)
    })
    const other = computed(() => {
      return double.value + 1
    })

    expect(double.value).toBeUndefined()

    await nextTick()
    await nextTick()

    expect(double.value).toBe(2)

    counter.value = 2
    expect(double.value).toBe(2)
    expect(other.value).toBe(3)

    await nextTick()
    await nextTick()

    expect(double.value).toBe(4)
    expect(other.value).toBe(5)
  })

  test('cancel is called', async() => {
    const onCancel = jest.fn()

    const data = ref('initial')
    const uppercase = asyncComputed((cancel) => {
      cancel(() => onCancel())

      const uppercased = data.value.toUpperCase()

      return new Promise((resolve) => {
        setTimeout(resolve.bind(null, uppercased), 0)
      })
    })

    expect(uppercase.value).toBeUndefined()

    await promiseTimeout(10)

    expect(uppercase.value).toBe('INITIAL')

    data.value = 'to be cancelled'
    await nextTick()
    await nextTick()
    expect(onCancel).toBeCalledTimes(0)

    data.value = 'final'
    await nextTick()
    await nextTick()
    expect(onCancel).toBeCalledTimes(1)

    await promiseTimeout(10)

    expect(uppercase.value).toBe('FINAL')
  })

  test('cancel is called for lazy', async() => {
    const onCancel = jest.fn()

    const data = ref('initial')
    const uppercase = asyncComputed((cancel) => {
      cancel(() => onCancel())

      const uppercased = data.value.toUpperCase()

      return new Promise((resolve) => {
        setTimeout(resolve.bind(null, uppercased), 0)
      })
    }, '', { lazy: true })

    expect(uppercase.value).toBe('')

    await promiseTimeout(10)

    expect(uppercase.value).toBe('INITIAL')

    data.value = 'to be cancelled'
    await nextTick()
    await nextTick()
    expect(onCancel).toBeCalledTimes(0)

    data.value = 'final'
    await nextTick()
    await nextTick()
    expect(onCancel).toBeCalledTimes(1)

    await promiseTimeout(10)

    expect(uppercase.value).toBe('FINAL')
  })
})
