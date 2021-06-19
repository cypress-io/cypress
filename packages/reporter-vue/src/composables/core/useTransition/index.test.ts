import { promiseTimeout } from '../../shared'
import { ref } from 'vue'
import { useTransition } from '.'

const expectBetween = (val: number, floor: number, ceiling: number) => {
  expect(val).toBeGreaterThan(floor)
  expect(val).toBeLessThan(ceiling)
}

describe('useTransition', () => {
  it('transitions between numbers', async() => {
    const source = ref(0)
    const transition = useTransition(source, { duration: 100 })

    expect(transition.value).toBe(0)

    source.value = 1

    await promiseTimeout(50)
    expectBetween(transition.value, 0, 1)

    await promiseTimeout(100)
    expect(transition.value).toBe(1)
  })

  it('transitions between vectors', async() => {
    const source = ref([0, 0])
    const transition = useTransition(source, { duration: 100 })

    expect(transition.value).toEqual([0, 0])

    source.value = [1, 1]

    await promiseTimeout(50)
    expectBetween(transition.value[0], 0, 1)
    expectBetween(transition.value[1], 0, 1)

    await promiseTimeout(100)
    expect(transition.value[0]).toBe(1)
    expect(transition.value[1]).toBe(1)
  })

  it('supports cubic bezier curves', async() => {
    const source = ref(0)

    // https://cubic-bezier.com/#0,2,0,1
    const easeOutBack = useTransition(source, {
      duration: 100,
      transition: [0, 2, 0, 1],
    })

    // https://cubic-bezier.com/#1,0,1,-1
    const easeInBack = useTransition(source, {
      duration: 100,
      transition: [1, 0, 1, -1],
    })

    source.value = 1

    await promiseTimeout(50)
    expectBetween(easeOutBack.value, 1, 2)
    expectBetween(easeInBack.value, -1, 0)

    await promiseTimeout(100)
    expect(easeOutBack.value).toBe(1)
    expect(easeInBack.value).toBe(1)
  })

  it('supports custom easing functions', async() => {
    const source = ref(0)
    const linear = jest.fn(n => n)
    const transition = useTransition(source, {
      duration: 100,
      transition: linear,
    })

    expect(linear).not.toHaveBeenCalled()

    source.value = 1

    await promiseTimeout(50)
    expect(linear).toHaveBeenCalled()
    expectBetween(transition.value, 0, 1)

    await promiseTimeout(100)
    expect(transition.value).toBe(1)
  })

  it('supports delayed transitions', async() => {
    const source = ref(0)

    const transition = useTransition(source, {
      delay: 100,
      duration: 100,
    })

    source.value = 1

    await promiseTimeout(50)
    expect(transition.value).toBe(0)

    await promiseTimeout(100)
    expectBetween(transition.value, 0, 1)
  })

  it('supports dynamic transitions', async() => {
    const source = ref(0)
    const first = jest.fn(n => n)
    const second = jest.fn(n => n)
    const easingFn = ref(first)

    useTransition(source, {
      duration: 100,
      transition: easingFn,
    })

    expect(first).not.toHaveBeenCalled()
    expect(second).not.toHaveBeenCalled()

    source.value = 1

    await promiseTimeout(50)
    expect(first).toHaveBeenCalled()
    expect(second).not.toHaveBeenCalled()

    first.mockReset()
    second.mockReset()

    easingFn.value = second
    source.value = 2

    await promiseTimeout(100)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
  })

  it('supports dynamic durations', async() => {
    const source = ref(0)
    const duration = ref(100)
    const transition = useTransition(source, { duration })

    source.value = 1

    await promiseTimeout(50)
    expectBetween(transition.value, 0, 1)

    await promiseTimeout(100)
    expect(transition.value).toBe(1)

    duration.value = 200
    source.value = 2

    await promiseTimeout(150)
    expectBetween(transition.value, 1, 2)

    await promiseTimeout(100)
    expect(transition.value).toBe(2)
  })

  it('fires onStarted and onFinished callbacks', async() => {
    const source = ref(0)
    const onStarted = jest.fn()
    const onFinished = jest.fn()

    useTransition(source, {
      duration: 100,
      onStarted,
      onFinished,
    })

    expect(onStarted).not.toHaveBeenCalled()
    expect(onFinished).not.toHaveBeenCalled()

    source.value = 1

    await promiseTimeout(50)
    expect(onStarted).toHaveBeenCalled()
    expect(onFinished).not.toHaveBeenCalled()

    onStarted.mockReset()
    onFinished.mockReset()

    await promiseTimeout(100)
    expect(onStarted).not.toHaveBeenCalled()
    expect(onFinished).toHaveBeenCalled()
  })

  it('clears pending transitions before starting a new one', async() => {
    const source = ref(0)
    const onStarted = jest.fn()
    const onFinished = jest.fn()

    useTransition(source, {
      delay: 100,
      duration: 100,
      onFinished,
      onStarted,
    })

    await promiseTimeout(150)
    expect(onStarted).not.toHaveBeenCalled()
    source.value = 1
    await promiseTimeout(50)
    source.value = 2
    await promiseTimeout(250)
    expect(onStarted).toHaveBeenCalledTimes(1)
    expect(onFinished).toHaveBeenCalledTimes(1)
  })

  it('can be disabled for sychronous changes', async() => {
    const onStarted = jest.fn()
    const disabled = ref(false)
    const source = ref(0)

    const transition = useTransition(source, {
      disabled,
      duration: 100,
      onStarted,
    })

    disabled.value = true
    source.value = 1

    expect(transition.value).toBe(1)
    await promiseTimeout(150)
    expect(onStarted).not.toHaveBeenCalled()
    disabled.value = false
    expect(transition.value).toBe(1)
  })
})
