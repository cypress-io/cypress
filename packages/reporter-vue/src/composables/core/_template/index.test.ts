import { useSetup } from '../../.test'
import { useCounter } from '.'

describe('useCounter', () => {
  it('should be defined', () => {
    expect(useCounter).toBeDefined()
  })

  it('should be update counter', () => {
    useSetup(() => {
      const { count, inc, dec, get, set, reset } = useCounter()

      expect(count.value).toBe(0)
      expect(get()).toBe(0)
      inc()
      expect(count.value).toBe(1)
      expect(get()).toBe(1)
      inc(2)
      expect(count.value).toBe(3)
      expect(get()).toBe(3)
      dec()
      expect(count.value).toBe(2)
      expect(get()).toBe(2)
      dec(5)
      expect(count.value).toBe(-3)
      expect(get()).toBe(-3)
      set(100)
      expect(count.value).toBe(100)
      expect(get()).toBe(100)
      reset()
      expect(count.value).toBe(0)
      expect(get()).toBe(0)
      reset(25)
      expect(count.value).toBe(25)
      expect(get()).toBe(25)
      reset()
      expect(count.value).toBe(25)
      expect(get()).toBe(25)
    })
  })
})
