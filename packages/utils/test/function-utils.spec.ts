import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, once, uniqueId } from '../src/function-utils'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays invocation', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('passes last arguments', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced('b')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('b')
  })

  it('preserves this context', () => {
    let captured: any

    const fn = function (this: any) {
      captured = this
    }

    const debounced = debounce(fn, 100)
    const ctx = { name: 'test' }

    debounced.call(ctx)
    vi.advanceTimersByTime(100)

    expect(captured).toBe(ctx)
  })

  it('flush invokes immediately', () => {
    const fn = vi.fn().mockReturnValue(42)
    const debounced = debounce(fn, 100)

    debounced()
    const result = debounced.flush()

    expect(fn).toHaveBeenCalledOnce()
    expect(result).toBe(42)
  })

  it('flush returns last result when no pending call', () => {
    const fn = vi.fn().mockReturnValue(42)
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(100)
    const result = debounced.flush()

    expect(fn).toHaveBeenCalledOnce()
    expect(result).toBe(42)
  })

  it('cancel prevents invocation', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(100)

    expect(fn).not.toHaveBeenCalled()
  })
})

describe('once', () => {
  it('calls function only once', () => {
    const fn = vi.fn().mockReturnValue(42)
    const onceFn = once(fn)

    expect(onceFn()).toBe(42)
    expect(onceFn()).toBe(42)
    expect(onceFn()).toBe(42)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('preserves this context on first call', () => {
    let captured: any
    const fn = function (this: any) {
      captured = this

      return this.value
    }
    const onceFn = once(fn)
    const ctx = { value: 'hello' }

    expect(onceFn.call(ctx)).toBe('hello')
    expect(captured).toBe(ctx)
  })

  it('passes arguments', () => {
    const fn = vi.fn((a: number, b: number) => a + b)
    const onceFn = once(fn)

    expect(onceFn(1, 2)).toBe(3)
    expect(onceFn(3, 4)).toBe(3)
    expect(fn).toHaveBeenCalledWith(1, 2)
  })
})

describe('uniqueId', () => {
  it('returns incrementing ids', () => {
    const a = uniqueId()
    const b = uniqueId()

    expect(Number(a)).toBeLessThan(Number(b))
  })

  it('accepts prefix', () => {
    const id = uniqueId('test_')

    expect(id).toMatch(/^test_\d+$/)
  })

  it('default prefix is empty string', () => {
    const id = uniqueId()

    expect(id).toMatch(/^\d+$/)
  })
})
