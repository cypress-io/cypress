import { ref, isReactive } from 'vue'
import { useManualRefHistory } from '.'
import { useSetup } from '../../.test'

describe('useManualRefHistory', () => {
  test('should record', () => {
    useSetup(() => {
      const v = ref(0)
      const { history, commit } = useManualRefHistory(v)

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot).toBe(0)

      v.value = 2
      commit()

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot).toBe(2)
      expect(history.value[1].snapshot).toBe(0)
    })
  })

  test('should be able to undo and redo', () => {
    useSetup(() => {
      const v = ref(0)
      const { commit, undo, redo, clear, canUndo, canRedo, history, last } = useManualRefHistory(v)

      expect(canUndo.value).toBe(false)
      expect(canRedo.value).toBe(false)

      v.value = 2
      commit()
      v.value = 3
      commit()
      v.value = 4
      commit()

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

  test('object with deep', () => {
    useSetup(() => {
      const v = ref({ foo: 'bar' })
      const { commit, undo, history } = useManualRefHistory(v, { clone: true })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot.foo).toBe('bar')

      v.value.foo = 'foo'
      commit()

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

  test('object with clone function', () => {
    useSetup(() => {
      const v = ref({ foo: 'bar' })
      const { commit, undo, history } = useManualRefHistory(v, { clone: x => JSON.parse(JSON.stringify(x)) })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot.foo).toBe('bar')

      v.value.foo = 'foo'
      commit()

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

  test('dump + parse', () => {
    useSetup(() => {
      const v = ref({ a: 'bar' })
      const { history, commit, undo } = useManualRefHistory(v, {
        dump: v => JSON.stringify(v),
        parse: (v: string) => JSON.parse(v),
      })

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot).toBe('{"a":"bar"}')

      v.value.a = 'foo'
      commit()

      expect(history.value.length).toBe(2)
      expect(history.value[0].snapshot).toBe('{"a":"foo"}')
      expect(history.value[1].snapshot).toBe('{"a":"bar"}')

      undo()

      expect(v.value.a).toBe('bar')
    })
  })

  test('reset', () => {
    useSetup(() => {
      const v = ref(0)
      const { history, commit, undoStack, redoStack, reset, undo } = useManualRefHistory(v)

      expect(history.value.length).toBe(1)
      expect(history.value[0].snapshot).toBe(0)

      v.value = 1
      commit()

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

  test('snapshots should not be reactive', async() => {
    const v = ref(0)
    const { history, commit } = useManualRefHistory(v)

    expect(history.value.length).toBe(1)
    expect(history.value[0].snapshot).toBe(0)

    v.value = 2
    commit()

    expect(isReactive(history.value[0])).toBe(false)
    expect(isReactive(history.value[1])).toBe(false)
  })
})
