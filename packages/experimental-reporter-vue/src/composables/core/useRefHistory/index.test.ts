import { ref, nextTick } from 'vue'
import { useRefHistory } from '.'
import { useSetup } from '../../.test'

describe('useRefHistory - sync', () => {
  test('sync: should record', () => {
    useSetup(() => {
      const v = ref(0)
      const { history } = useRefHistory(v, { flush: 'sync' })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot).toBe(0)

      v.value = 2

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot).toBe(2)
      expect(history.value[1].snapshot).toBe(0)
    })
  })

  test('sync: should be able to undo and redo', () => {
    useSetup(() => {
      const v = ref(0)
      const { undo, redo, clear, canUndo, canRedo, history, last } = useRefHistory(v, { flush: 'sync' })

      expect(canUndo.value).toBe(false)
      expect(canRedo.value).toBe(false)

      v.value = 2
      v.value = 3
      v.value = 4

      expect(canUndo.value).toBe(true)
      expect(canRedo.value).toBe(false)

      expect(v.value).toBe(4)
      expect(history.value.length).toBe(4)
      expect(last.value.snapshot).toBe(4)
      undo()

      expect(canUndo.value).toBe(true)
      expect(canRedo.value).toBe(true)

      expect(v.value).toBe(3)
      expect(last.value.snapshot).toBe(3)
      undo()
      expect(v.value).toBe(2)
      expect(last.value.snapshot).toBe(2)
      redo()
      expect(v.value).toBe(3)
      expect(last.value.snapshot).toBe(3)
      redo()
      expect(v.value).toBe(4)
      expect(last.value.snapshot).toBe(4)

      expect(canUndo.value).toBe(true)
      expect(canRedo.value).toBe(false)

      redo()
      expect(v.value).toBe(4)
      expect(last.value.snapshot).toBe(4)

      clear()
      expect(canUndo.value).toBe(false)
      expect(canRedo.value).toBe(false)
    })
  })

  test('sync: object with deep', () => {
    useSetup(() => {
      const v = ref({ foo: 'bar' })
      const { history, undo } = useRefHistory(v, { flush: 'sync', deep: true })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot.foo).toBe('bar')

      v.value.foo = 'foo'

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot.foo).toBe('foo')

      // different references
      expect(history.value[1].snapshot.foo).toBe('bar')
      expect(history.value[0].snapshot).not.toBe(history.value[1].snapshot)

      undo()

      // history references should not be equal to the source
      expect(history.value[0].snapshot).not.toBe(v.value)
    })
  })

  test('sync: shallow watch with clone', () => {
    useSetup(() => {
      const v = ref({ foo: 'bar' })
      const { history, undo } = useRefHistory(v, { flush: 'sync', clone: true })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot.foo).toBe('bar')

      v.value.foo = 'foo'

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot.foo).toBe('bar')

      v.value = { foo: 'foo' }

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot.foo).toBe('foo')

      // different references
      expect(history.value[1].snapshot.foo).toBe('bar')
      expect(history.value[0].snapshot).not.toBe(history.value[1].snapshot)

      undo()

      // history references should not be equal to the source
      expect(history.value[0].snapshot).not.toBe(v.value)
    })
  })

  test('sync: dump + parse', () => {
    useSetup(() => {
      const v = ref({ a: 'bar' })
      const { history, undo } = useRefHistory(v, {
        flush: 'sync',
        deep: true,
        dump: v => JSON.stringify(v),
        parse: (v: string) => JSON.parse(v),
      })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot).toBe('{"a":"bar"}')

      v.value.a = 'foo'

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot).toBe('{"a":"foo"}')
      expect(history.value[1].snapshot).toBe('{"a":"bar"}')

      undo()

      expect(v.value.a).toBe('bar')
    })
  })

  test('sync: commit', () => {
    const v = ref(0)
    const { commit, history } = useRefHistory(v, { flush: 'sync' })

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(0)

    commit()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(0)
    expect(history.value[1].snapshot).toBe(0)
  })

  test('sync: without batch', () => {
    const v = ref({ foo: 1, bar: 'one' })
    const { history } = useRefHistory(v, { flush: 'sync', deep: true })

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toEqual({ foo: 1, bar: 'one' })

    v.value.foo = 2
    v.value.bar = 'two'

    expect(history.value.length).toBe(3)
    expect(history.value[0].snapshot).toEqual({ foo: 2, bar: 'two' })
    expect(history.value[1].snapshot).toEqual({ foo: 2, bar: 'one' })
    expect(history.value[2].snapshot).toEqual({ foo: 1, bar: 'one' })
  })

  test('sync: with batch', () => {
    const v = ref({ foo: 1, bar: 'one' })
    const { history, batch } = useRefHistory(v, { flush: 'sync', deep: true })

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toEqual({ foo: 1, bar: 'one' })

    batch(() => {
      v.value.foo = 2
      v.value.bar = 'two'
    })

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toEqual({ foo: 2, bar: 'two' })
    expect(history.value[1].snapshot).toEqual({ foo: 1, bar: 'one' })
  })

  test('sync: pause and resume', () => {
    const v = ref(1)
    const { history, pause, resume, last } = useRefHistory(v, { flush: 'sync' })

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(1)

    pause()
    v.value = 2

    expect(history.value.length).toBe(1)
    expect(last.value.snapshot).toBe(1)

    resume()

    expect(history.value.length).toBe(1)
    expect(last.value.snapshot).toBe(1)

    v.value = 3

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(3)
    expect(last.value.snapshot).toBe(3)
  })

  test('sync: reset', () => {
    useSetup(() => {
      const v = ref(0)
      const { history, commit, undoStack, redoStack, pause, reset, undo } = useRefHistory(v, { flush: 'sync' })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot).toBe(0)

      v.value = 1

      pause()

      v.value = 2

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot).toBe(1)
      expect(history.value[1].snapshot).toBe(0)

      reset()

      // v value needs to be the last history point, but history is unchanged
      expect(v.value).toBe(1)

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot).toBe(1)
      expect(history.value[1].snapshot).toBe(0)

      reset()

      // Calling reset twice is a no-op
      expect(v.value).toBe(1)

      expect(history.value.length).toBe(2)
      expect(history.value[1].snapshot).toBe(0)
      expect(history.value[0].snapshot).toBe(1)

      // Same test, but with a non empty redoStack

      v.value = 3
      commit()

      undo()

      v.value = 2

      reset()

      expect(v.value).toBe(1)

      expect(undoStack.value.length).toBe(1)
      expect(undoStack.value[0].snapshot).toBe(0)

      expect(redoStack.value.length).toBe(1)
      expect(redoStack.value[0].snapshot).toBe(3)
    })
  })
})

describe('useRefHistory - pre', () => {
  test('pre: should record', async() => {
    const v = ref(0)
    const { history } = useRefHistory(v)

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(0)

    v.value = 2
    await nextTick()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(2)
    expect(history.value[1].snapshot).toBe(0)
  })

  test('pre: should be able to undo and redo', async() => {
    const v = ref(0)
    const { undo, redo, clear, canUndo, canRedo, history, last } = useRefHistory(v)

    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)

    v.value = 2
    await nextTick()
    v.value = 3
    await nextTick()
    v.value = 4
    await nextTick()

    expect(v.value).toBe(4)
    expect(history.value.length).toBe(4)
    expect(last.value.snapshot).toBe(4)
    expect(canUndo.value).toBe(true)
    expect(canRedo.value).toBe(false)
    undo()
    await nextTick()
    expect(v.value).toBe(3)
    expect(last.value.snapshot).toBe(3)
    undo()
    await nextTick()
    expect(v.value).toBe(2)
    expect(last.value.snapshot).toBe(2)
    redo()
    await nextTick()
    expect(canUndo.value).toBe(true)
    expect(canRedo.value).toBe(true)
    expect(v.value).toBe(3)
    expect(last.value.snapshot).toBe(3)
    redo()
    await nextTick()
    expect(v.value).toBe(4)
    expect(last.value.snapshot).toBe(4)
    redo()
    await nextTick()
    expect(v.value).toBe(4)
    expect(last.value.snapshot).toBe(4)
    expect(canUndo.value).toBe(true)
    expect(canRedo.value).toBe(false)

    clear()

    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)
  })

  test('pre: object with deep', async() => {
    const v = ref({ foo: 'bar' })
    const { history } = useRefHistory(v, { deep: true })

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot.foo).toBe('bar')

    v.value.foo = 'foo'
    await nextTick()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot.foo).toBe('foo')

    // different references
    expect(history.value[1].snapshot.foo).toBe('bar')
    expect(history.value[0].snapshot).not.toBe(history.value[1].snapshot)
  })

  test('pre: dump + parse', async() => {
    const v = ref({ a: 'bar' })
    const { history, undo } = useRefHistory(v, {
      deep: true,
      dump: v => JSON.stringify(v),
      parse: (v: string) => JSON.parse(v),
    })

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe('{"a":"bar"}')

    v.value.a = 'foo'
    await nextTick()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe('{"a":"foo"}')
    expect(history.value[1].snapshot).toBe('{"a":"bar"}')

    undo()
    await nextTick()

    expect(v.value.a).toBe('bar')
  })

  test('pre: commit', async() => {
    const v = ref(0)
    const { commit, history, undo } = useRefHistory(v)

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(0)

    commit()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(0)
    expect(history.value[1].snapshot).toBe(0)

    undo()
    v.value = 2
    commit()
    await nextTick()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(2)
    expect(history.value[1].snapshot).toBe(0)
  })

  test('pre: pause and resume', async() => {
    const v = ref(1)
    const { history, pause, resume, last } = useRefHistory(v)

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(1)

    pause()
    v.value = 2
    await nextTick()

    expect(history.value.length).toBe(1)
    expect(last.value.snapshot).toBe(1)

    resume()
    await nextTick()

    expect(history.value.length).toBe(1)
    expect(last.value.snapshot).toBe(1)

    v.value = 3
    await nextTick()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(3)
    expect(last.value.snapshot).toBe(3)
  })

  test('pre: reset', async() => {
    const v = ref(0)
    const { history, commit, undoStack, redoStack, pause, reset, undo } = useRefHistory(v)

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(0)

    v.value = 1
    await nextTick()

    pause()

    v.value = 2
    await nextTick()

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(1)
    expect(history.value[1].snapshot).toBe(0)

    reset()

    // v value needs to be the last history point, but history is unchanged
    expect(v.value).toBe(1)

    expect(history.value.length).toBe(2)
    expect(history.value[0].snapshot).toBe(1)
    expect(history.value[1].snapshot).toBe(0)

    reset()

    // Calling reset twice is a no-op
    expect(v.value).toBe(1)

    expect(history.value.length).toBe(2)
    expect(history.value[1].snapshot).toBe(0)
    expect(history.value[0].snapshot).toBe(1)

    // Same test, but with a non empty redoStack

    v.value = 3
    commit()

    undo()
    await nextTick()

    v.value = 2
    await nextTick()

    reset()
    await nextTick()

    expect(v.value).toBe(1)

    expect(undoStack.value.length).toBe(1)
    expect(undoStack.value[0].snapshot).toBe(0)

    expect(redoStack.value.length).toBe(1)
    expect(redoStack.value[0].snapshot).toBe(3)
  })

  test('pre: auto batching', async() => {
    const v = ref(0)
    const { history } = useRefHistory(v)

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(0)

    v.value = 1

    expect(history.value.length).toBe(1)
    await nextTick()
    expect(history.value.length).toBe(2)

    v.value += 1
    v.value += 1

    expect(history.value.length).toBe(2)
    await nextTick()
    expect(history.value.length).toBe(3)
    expect(history.value[0].snapshot).toBe(3)
    expect(history.value[1].snapshot).toBe(1)

    await nextTick()
    expect(history.value.length).toBe(3)
  })
})
